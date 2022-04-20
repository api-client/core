import { blobToDataUrl } from './Utils.js';

export type PayloadTypes = 'string' | 'file' | 'blob' | 'buffer' | 'arraybuffer' | 'formdata' | 'x-www-form-urlencoded';
export type DeserializedPayload = string | Blob | File | FormData | Buffer | ArrayBuffer | undefined;
export const SupportedPayloadTypes: PayloadTypes[] = ['string', 'file', 'blob', 'buffer', 'arraybuffer', 'formdata', 'x-www-form-urlencoded'];

export interface IMultipartBody {
  /**
   * When true a this entry represent a file part
   */
  isFile: boolean;
  /**
   * The name of the filed
   */
  name: string;
  /**
   * Converted value
   */
  value: string;
  /**
   * A content type entered by the user to the text part of the text part input.
   * This can only be set when `isFile` is false.
   */
  type?: string;
  /**
   * The original file name used with the part
   */
  fileName?: string;
  /**
   * Whether the parameter is enabled. Default to true.
   */
  enabled?: boolean;
}

/**
 * Represents a payload that is safe to store in a data store.
 * The `string` goes without any transformations.
 * The `file` and the `blob` are data URLs encoded as string.
 * The `buffer` and `arraybuffer` are UInt8Arrays.
 */
export interface ISafePayload {
  /**
   * The type od the originating payload object.
   */
  type: PayloadTypes;
  data: string | number[] | IMultipartBody[];
  /**
   * Optionally the original mime type of the payload.
   * This is used with files.
   */
  mime?: string;
}
/**
 * The request payload. When not a string then it has to go through a 
 * transformation from a store safe object to the original data object.
 * For example, a file is stored as type 'file' and data with the file's data URL.
 * A Buffer / ArrayBuffer is stored as type 'buffer' / 'arraybuffer' respectively 
 * with the `data` being an UInt8Array of the content.
 */
export type Payload = string | ISafePayload;

export const hasFormData: boolean = typeof FormData === 'function';
export const hasBlob: boolean = typeof Blob === 'function';
export const hasBuffer: boolean = typeof Buffer === 'function';

export class PayloadSerializer {
  /**
   * Checked whether the passed payload can be safely stored in the data store.
   * @param payload The value to test. 
   */
  static isSafePayload(payload: any): boolean {
    if (payload === undefined || payload === null) {
      // both values should be stored correctly
      return true;
    }
    if (typeof payload === 'string') {
      return true;
    }
    // checks whether the payload is already serialized./
    const typed = payload as ISafePayload;
    if (typed.type && SupportedPayloadTypes.includes(typed.type)) {
      return true
    }
    return false;
  }

  /**
   * Transforms the payload into a data store safe object.
   */
  static async serialize(payload: DeserializedPayload): Promise<ISafePayload | string | undefined> {
    if (PayloadSerializer.isSafePayload(payload)) {
      if (payload === null) {
        return undefined;
      }
      return (payload as unknown) as ISafePayload | string | undefined;
    }
    // if (payload === undefined || payload === null) {
    //   return undefined;
    // }
    // if (typeof payload === 'string') {
    //   return payload;
    // }
    if (hasBlob && payload instanceof Blob) {
      return PayloadSerializer.stringifyBlob(payload);
    }
    if (hasBuffer && payload instanceof Buffer) {
      return PayloadSerializer.stringifyBuffer(payload);
    }
    if (payload instanceof ArrayBuffer) {
      return PayloadSerializer.stringifyArrayBuffer(payload);
    }
    if (hasFormData && payload instanceof FormData) {
      try {
        const result = await PayloadSerializer.stringifyFormData((payload as unknown) as Iterable<(string | File)[]>);
        return result;
      } catch (e: unknown) {
        console.warn(`Unable to transform FormData: ${(e as Error).message}`);
      }
    }
    return '';
  }

  /**
   * Converts blob data to base64 string.
   *
   * @param blob File or blob object to be translated to string
   * @return Promise resolved to a base64 string data from the file.
   */
  static async stringifyBlob(blob: Blob): Promise<ISafePayload> {
    const typedFile = blob as File;
    const data = await blobToDataUrl(blob);
    const result: ISafePayload = {
      type: 'blob',
      data,
      mime: typedFile.type,
    };
    return result;
  }

  /**
   * When the passed argument is a NodeJS buffer it creates an object describing the buffer
   * in a safe to store object.
   * 
   * @returns The buffer metadata or undefined if the passed argument is not a Buffer.
   */
  static stringifyBuffer(payload: Buffer): ISafePayload | undefined {
    if (typeof payload.copy === 'function') {
      return {
        type: 'buffer',
        data: [...payload],
      };
    }
    return undefined;
  }

  /**
   * When the passed argument is an ArrayBuffer it creates an object describing the object in a safe to store object.
   * 
   * @param payload 
   * @returns The buffer metadata or undefined if the passed argument is not an ArrayBuffer.
   */
  static stringifyArrayBuffer(payload: ArrayBuffer): ISafePayload | undefined {
    if (payload.byteLength) {
      const view = new Uint8Array(payload);
      return {
        type: 'arraybuffer',
        data: Array.from(view),
      };
    }
    return undefined;
  }

  /**
   * Transforms the FormData object to a serialized object describing the data.
   *
   * @param payload A `FormData` object
   * @return A promise resolved to a datastore safe entries.
   */
  static async stringifyFormData(payload: Iterable<(string | File)[]>): Promise<ISafePayload> {
    const promises: Promise<IMultipartBody>[] = [];
    for (const part of payload) {
      promises.push(PayloadSerializer.serializeFormDataEntry(part[0] as string, part[1]));
    }
    const items = await Promise.all(promises);
    return {
      type: 'formdata',
      data: items,
    }
  }

  /**
   * Transforms a FormData entry into a safe-to-store text entry
   *
   * @param name The part name
   * @param file The part value
   * @returns Transformed FormData part to a datastore safe entry.
   */
  static async serializeFormDataEntry(name: string, file: string | File): Promise<IMultipartBody> {
    if (typeof file === 'string') {
      // when adding an item to the FormData object without 3rd parameter of the append function
      // then  the value is a string.
      return {
        isFile: false,
        name,
        value: file,
        enabled: true,
      };
    }

    const value = await blobToDataUrl(file);
    const part: IMultipartBody = {
      isFile: false,
      name,
      value,
      enabled: true,
    };
    if (file.name === 'blob') {
      // API Client adds the "blob" filename when the content type is set on the editor.
      // otherwise it wouldn't be possible to set the content type value.
      part.type = file.type;
    } else {
      part.isFile = true;
      part.fileName = file.name;
    }
    return part;
  }

  /**
   * Restores the payload into its original format.
   */
  static async deserialize(payload: ISafePayload | string | undefined): Promise<DeserializedPayload> {
    if (payload === undefined || payload === null) {
      return undefined;
    }
    if (typeof payload === 'string') {
      return payload;
    }
    if (hasBuffer && !hasBlob) {
      // we are in the nodejs environment. 
      // We mostly gonna return a Buffer here.
      switch (payload.type) {
        case 'string': return payload.data as string;
        case 'file':
        case 'blob': return PayloadSerializer.deserializeBlobBuffer(payload.data as string);
        case 'buffer': return PayloadSerializer.deserializeBuffer(payload.data as number[]);
        case 'arraybuffer': return PayloadSerializer.deserializeArrayBufferBuffer(payload.data as number[]);
        case 'formdata': return undefined;
        default: return undefined;
      }
    }
    switch (payload.type) {
      case 'string': return payload.data as string;
      case 'file':
      case 'blob': return PayloadSerializer.deserializeBlob(payload.data as string);
      case 'buffer': return PayloadSerializer.deserializeBuffer(payload.data as number[]);
      case 'arraybuffer': return PayloadSerializer.deserializeArrayBuffer(payload.data as number[]);
      case 'formdata': return PayloadSerializer.deserializeFormData(payload.data as IMultipartBody[]);
      default: return undefined;
    }
  }

  /**
   * Converts data-url string to blob
   *
   * @param dataUrl Data url from blob value.
   * @return Restored blob value
   */
  static deserializeBlob(dataUrl: string): Blob | undefined {
    const arr = dataUrl.split(',');
    const matchedMime = arr[0].match(/:(.*?);/);
    if (!matchedMime) {
      return undefined;
    }
    const mime = matchedMime[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Converts data-url string to blob
   *
   * @param dataUrl Data url from blob value.
   * @return Restored blob value
   */
  static deserializeBlobBuffer(dataUrl: string): Buffer {
    const arr = dataUrl.split(',');
    const value = arr[1];
    return Buffer.from(value, 'base64url');
  }

  /**
   * Converts UInt8Array to a Buffer.
   *
   * @param data Previously serialized buffer.
   * @return Restored blob value
   */
  static deserializeBuffer(data: number[]): Buffer {
    return Buffer.from(data);
  }

  /**
   * Converts UInt8Array to an ArrayBuffer.
   *
   * @param data Previously serialized buffer.
   */
  static deserializeArrayBuffer(data: number[]): ArrayBuffer {
    const { buffer } = new Uint8Array(data);
    return buffer;
  }

  /**
   * Converts UInt8Array to a Buffer.
   *
   * @param data Previously serialized buffer.
   */
  static deserializeArrayBufferBuffer(data: number[]): Buffer {
    const ab = this.deserializeArrayBuffer(data);
    return Buffer.from(ab);
  }

  /**
   * Deserializes FormData from API Client data model.
   *
   * @param parts API Client model for multipart.
   * @return {FormData} Restored form data
   */
  static deserializeFormData(parts: IMultipartBody[]): FormData {
    const fd = new FormData();
    if (!Array.isArray(parts) || !parts.length) {
      return fd;
    }
    parts.forEach((part) => {
      const { isFile, name, value, type, fileName, enabled } = part;
      if (enabled === false) {
        return;
      }
      let blob;
      if (isFile) {
        blob = PayloadSerializer.deserializeBlob(value);
        if (blob) {
          fd.append(name, blob, fileName);
        }
      } else if (type) {
        blob = PayloadSerializer.deserializeBlob(value);
        if (blob) {
          fd.append(name, blob, 'blob');
        }
      } else {
        fd.append(name, value);
      }
    });
    return fd;
  }
}
