export type PayloadTypes = 'string' | 'file' | 'blob' | 'buffer' | 'arraybuffer' | 'formdata' | 'x-www-form-urlencoded';
export type DeserializedPayload = string | Blob | File | FormData | Buffer | ArrayBuffer | undefined;
export const SupportedPayloadTypes: PayloadTypes[] = ['string', 'file', 'blob', 'buffer', 'arraybuffer', 'formdata', 'x-www-form-urlencoded'];

export interface IMultipartBody {
  /**
   * Whether the parameter is enabled. Default to true.
   */
  enabled?: boolean;
  /**
   * The name of the filed
   */
  name: string;
  /**
   * Converted value.
   * When the part value was a string this is a string.
   * When the previous value was a Blob or a Buffer, this will be a serialized payload.
   */
  value: string | ISafePayload;
  /**
   * When `true` this entry represent a file part
   * @deprecated This is only used for the compatibility with ARC. This information is encoded in the `value`.
   */
  isFile?: boolean;
  /**
   * A content type entered by the user to the text part of the text part input.
   * This can only be set when `isFile` is false.
   * @deprecated This is only used for the compatibility with ARC. This information is encoded in the `value`.
   */
  type?: string;
  /**
   * The original file name used with the part
   * @deprecated This is only used for the compatibility with ARC. This information is encoded in the `value`.
   */
  fileName?: string;
}

export interface IBlobMeta {
  /**
   * The blob's mime type.
   */
  mime: string;
}

export interface IFileMeta extends IBlobMeta {
  /**
   * The file name.
   */
  name: string;
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
  /**
   * The payload contents. The data type depends on the `type`.
   */
  data: string | number[] | IMultipartBody[];
  /**
   * Optionally the original mime type of the payload.
   * This is used with files.
   */
  meta?: IBlobMeta | IFileMeta;
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
   * Tests whether the given input should be processed by the `serialize()`.
   */
  static needsSerialization(input: unknown): boolean {
    const typedSerialized = input as ISafePayload;
    if (typedSerialized.type && SupportedPayloadTypes.includes(typedSerialized.type)) {
      return false;
    }
    return true;
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

    if (hasBlob && payload instanceof File) {
      return PayloadSerializer.stringifyFile(payload);
    }
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
        const result = await PayloadSerializer.stringifyFormData(payload);
        return result;
      } catch (e: unknown) {
        console.warn(`Unable to transform FormData: ${(e as Error).message}`);
      }
    }
    return '';
  }

  /**
   * Stringifies a file object.
   */
  static async stringifyFile(file: File): Promise<ISafePayload> {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);
    const meta: IFileMeta = {
      mime: file.type,
      name: file.name,
    };
    const result: ISafePayload = {
      type: 'file',
      data: [...view],
      meta,
    };
    return result;
  }

  /**
   * Stringifies a blob object.
   *
   * @param blob Blob object to be translated to string
   */
  static async stringifyBlob(blob: Blob): Promise<ISafePayload> {
    const buffer = await blob.arrayBuffer();
    const view = new Uint8Array(buffer);
    const meta: IBlobMeta = {
      mime: blob.type,
    };
    const result: ISafePayload = {
      type: 'blob',
      data: [...view],
      meta,
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
    const view = new Uint8Array(payload);
    return {
      type: 'arraybuffer',
      data: Array.from(view),
    };
  }

  /**
   * Transforms the FormData object to a serialized object describing the data.
   *
   * @param payload A `FormData` object
   * @return A promise resolved to a datastore safe entries.
   */
  static async stringifyFormData(payload: FormData): Promise<ISafePayload> {
    // TS apparently doesn't know that FormData is iterable.
    const iterable = (payload as unknown) as Iterable<(string | File)[]>;
    const promises: Promise<IMultipartBody>[] = [];
    for (const part of iterable) {
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
  static async serializeFormDataEntry(name: string, file: string | File | Blob): Promise<IMultipartBody> {
    if (typeof file === 'string') {
      return {
        name,
        value: file,
        enabled: true,
      };
    }
    let value: ISafePayload;
    // API Client adds the "blob" when adding a text value with a mime type.
    // This is recognized by the UI to restore the entry as the text and not a file.
    if (file instanceof File && file.name !== 'blob') {
      value = await PayloadSerializer.stringifyFile(file);
    } else {
      value = await PayloadSerializer.stringifyBlob(file);
    }
    const part: IMultipartBody = {
      name,
      value,
      enabled: true,
    };
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
        case 'file': return PayloadSerializer.deserializeFileBuffer(payload);
        case 'blob': return PayloadSerializer.deserializeBlobBuffer(payload);
        case 'buffer': return PayloadSerializer.deserializeBuffer(payload.data as number[]);
        case 'arraybuffer': return PayloadSerializer.deserializeArrayBufferBuffer(payload.data as number[]);
        case 'formdata': return undefined;
        default: return undefined;
      }
    }
    switch (payload.type) {
      case 'string': return payload.data as string;
      case 'file': return PayloadSerializer.deserializeFile(payload);
      case 'blob': return PayloadSerializer.deserializeBlob(payload);
      case 'buffer': return PayloadSerializer.deserializeArrayBuffer(payload.data as number[]);
      case 'arraybuffer': return PayloadSerializer.deserializeArrayBuffer(payload.data as number[]);
      case 'formdata': return PayloadSerializer.deserializeFormData(payload.data as IMultipartBody[]);
      default: return undefined;
    }
  }

  /**
   * Deserializes previously serialized file object.
   * 
   * @param payload The serialized payload with a file.
   */
  static deserializeFile(payload: ISafePayload): File {
    const data = payload.data as number[];
    const meta = payload.meta as IFileMeta;
    const { mime, name } = meta;
    const { buffer } = new Uint8Array(data);
    return new File([buffer], name, {
      type: mime,
    });
  }

  /**
   * Deserializes previously serialized blob object.
   * 
   * In previous versions of ARC the data was a string as data URL. In API client this is a buffer.
   *
   * @param payload The serialized payload.
   * @return Restored blob value
   */
  static deserializeBlob(payload: ISafePayload): Blob | undefined {
    if (typeof payload.data === 'string') {
      return this.deserializeBlobLegacy(payload.data);
    }
    const data = payload.data as number[];
    const meta = payload.meta as IBlobMeta;
    const { mime } = meta;
    const { buffer } = new Uint8Array(data);
    return new Blob([buffer], { type: mime });
  }

  /**
   * The old implementation of the blob deserializer.
   * 
   * @deprecated
   * @param dataUrl Data url from blob value.
   * @return Restored blob value
   */
  static deserializeBlobLegacy(dataUrl: string): Blob | undefined {
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
   * Converts previously serialized File to a Buffer.
   *
   * @param payload The serialized payload.
   * @return Restored File value as Buffer
   */
  static deserializeFileBuffer(payload: ISafePayload): Buffer {
    const data = payload.data as number[];
    const ab = this.deserializeArrayBuffer(data);
    return Buffer.from(ab);
  }

  /**
   * Converts data-url string to buffer
   *
   * @param payload The serialized payload.
   * @return Restored blob value
   */
  static deserializeBlobBuffer(payload: ISafePayload): Buffer {
    if (typeof payload.data === 'string') {
      return this.deserializeBlobBufferLegacy(payload.data);
    }
    const data = payload.data as number[];
    const ab = this.deserializeArrayBuffer(data);
    return Buffer.from(ab);
  }

  /**
   * Converts data-url string to buffer
   *
   * @deprecated
   * @param dataUrl Data url from blob value.
   * @return Restored blob value
   */
  static deserializeBlobBufferLegacy(dataUrl: string): Buffer {
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
    parts.forEach(part => this.deserializeFormDataPart(fd, part));
    return fd;
  }

  private static deserializeFormDataPart(form: FormData, part: IMultipartBody): void {
    if (part.enabled === false) {
      return;
    }
    // the compatibility with old ARC.
    if (typeof part.isFile === 'boolean') {
      this.deserializeFormDataLegacy(form, part);
      return;
    }
    const { name, value } = part;
    if (typeof value === 'string') {
      form.append(name, value);
      return;
    }
    if (value.type === 'file') {
      const file = this.deserializeFile(value);
      form.append(name, file);
      return;
    }
    const blob = this.deserializeBlob(value) as Blob;
    form.append(name, blob);
  }

  /**
   * @deprecated This is only for compatibility with ARC.
   */
  private static deserializeFormDataLegacy(form: FormData, part: IMultipartBody): void {
    let blob;
    if (part.isFile) {
      blob = PayloadSerializer.deserializeBlobLegacy(part.value as string);
      if (blob) {
        form.append(part.name, blob, part.fileName);
      }
    } else if (part.type) {
      blob = PayloadSerializer.deserializeBlobLegacy(part.value as string);
      if (blob) {
        form.append(part.name, blob, 'blob');
      }
    } else {
      form.append(part.name, part.value as string);
    }
  }
}
