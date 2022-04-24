import { IMultipartBody, PayloadSerializer, IBlobMeta, IFileMeta } from '../../lib/transformers/PayloadSerializer.js';

export interface FormDataResult {
  /**
   * The contents of the form data
   */
  buffer: Buffer;
  /**
   * Content type for the form data.
   */
  type: string;
}

interface IPart {
  name: string;
  type: 'file' | 'string';
  meta?: IBlobMeta | IFileMeta;
  contents: Buffer;
}

const DefaultContentType = 'application/octet-stream';
const LineBreak = '\r\n';

/**
 * In API Client (old old version of ARC) multipart data is encoded 
 * as serializable array of buffer views. This class transforms these data
 * into a valid form data contents as a Buffer and generates content type header with the proper boundary.
 */
export class FormDataNode {
  protected _boundary?: string;

  protected _parts: IPart[] = [];

  get boundary(): string {
    if (!this._boundary) {
      this._boundary = this._generateBoundary();
    }
    return this._boundary;
  }

  protected _generateBoundary(): string {
    let boundary = '--------------------------';
    for (let i = 0; i < 24; i++) {
      boundary += Math.floor(Math.random() * 10).toString(16);
    }
    return boundary;
  }

  /**
   * 
   * @param parts The serialized FormData body
   * @returns 
   */
  getBody(parts: IMultipartBody[]): FormDataResult {
    parts.forEach(part => this._append(part));
    const buffer = this._generate();
    return {
      buffer,
      type: this.getContentType(),
    }
  }

  /**
   * @returns The value of the content type header with the generate boundary.
   */
  getContentType(): string {
    return `multipart/form-data; boundary=${this.boundary}`;
  }

  protected _append(part: IMultipartBody): void {
    if (part.enabled === false) {
      return;
    }
    if (typeof part.isFile === 'boolean') {
      this._appendLegacy(part);
      return;
    }
    const { name, value } = part;
    if (typeof value === 'string') {
      this._parts.push({
        name,
        type: 'string',
        contents: Buffer.from(value),
      });
      return;
    }
    let buffer: Buffer
    if (value.type === 'file') {
      buffer = PayloadSerializer.deserializeFileBuffer(value);
    } else {
      buffer = PayloadSerializer.deserializeBlobBuffer(value);
    }
    this._parts.push({
      name,
      type: 'file',
      contents: buffer,
      meta: value.meta,
    });
  }

  protected _appendLegacy(part: IMultipartBody): void {
    if (part.isFile) {
      const buffer = PayloadSerializer.deserializeBlobBufferLegacy(part.value as string);
      this._parts.push({
        name: part.name,
        type: 'file',
        contents: buffer,
        meta: {
          mime: this._readDataUrlMime(part.value as string) || DefaultContentType,
          name: part.fileName,
        },
      });
    } else if (part.type) {
      const buffer = PayloadSerializer.deserializeBlobBufferLegacy(part.value as string);
      this._parts.push({
        name: part.name,
        type: 'file',
        contents: buffer,
        meta: {
          mime: part.type || DefaultContentType,
        },
      });
    } else {
      const buffer = Buffer.from(part.value as string);
      this._parts.push({
        name: part.name,
        type: 'string',
        contents: buffer,
      });
    }
  }

  protected _readDataUrlMime(dataUrl: string): string | undefined {
    const arr = dataUrl.split(',');
    const matchedMime = arr[0].match(/:(.*?);/);
    if (!matchedMime) {
      return undefined;
    }
    return matchedMime[1];
  }

  protected _generate(): Buffer {
    const result: Buffer[] = [];
    for (const part of this._parts) {
      result.push(this._getHeader(part));
      result.push(part.contents);
      result.push(Buffer.from(LineBreak));
    }
    result.push(this._getFooter());
    return Buffer.concat(result);
  }

  protected _getHeader(part: IPart): Buffer {
    const disposition: string[] = [
      'Content-Disposition: form-data',
      `name="${part.name}"`,
    ];
    let mime: string | undefined;
    if (part.type === 'file') {
      const meta = part.meta as IFileMeta;
      if (meta) {
        // "blob" is added by browsers by default.
        disposition.push(`filename="${meta.name || 'blob'}"`);
        mime = meta.mime || DefaultContentType;
      }
    }

    const headers: string[] = [
      `--${this.boundary}`,
      disposition.join('; '),
    ];
    if (mime) {
      headers.push(`Content-Type: ${mime}`);
    }
    headers.push(LineBreak);
    return Buffer.from(headers.join(LineBreak));
  }

  protected _getFooter(): Buffer {
    return Buffer.from(`--${this.boundary}--`);
  }
}

// --7MA4YWxkTrZu0gW
// Content-Disposition: form-data; name="a"; filename="kubectrl-apimodeling.sh"
// Content-Type: application/x-shellscript

// {…file content…}
// --7MA4YWxkTrZu0gW
// Content-Disposition: form-data; name="t1"

// v1
// --7MA4YWxkTrZu0gW
// Content-Disposition: form-data; name="t2"; filename="blob"
// Content-Type: plain/text

// {…file content…}
// --7MA4YWxkTrZu0gW--

/**
 * Processes the form data.
 */
export default function (parts: IMultipartBody[]): FormDataResult {
  const factory = new FormDataNode();
  return factory.getBody(parts);
}
