import formDataConverter from './FormData.js';
import { Headers } from '../../lib/headers/Headers.js';
import { Payload, PayloadSerializer, IMultipartBody, IFileMeta, IBlobMeta } from '../../lib/transformers/PayloadSerializer.js';

/**
 * A class containing static helper methods to deal with Payload
 * transformations
 */
export class PayloadSupport {
  /**
   * Normalizes line endings to CRLF
   * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/wtf/text/line_ending.cc;l=68
   *
   * @param string A string to be normalized.
   * @return normalized string
   */
  static normalizeString(string: string): string {
    let result = '';
    for (let i = 0; i < string.length; i++) {
      const c = string[i];
      const p = string[i + 1];
      if (c === '\r') {
        // Safe to look ahead because of trailing '\0'.
        if (p && p !== '\n') {
          // Turn CR into CRLF.
          result += '\r';
          result += '\n';
        }
      } else if (c === '\n') {
        result += '\r';
        result += '\n';
      } else {
        // Leave other characters alone.
        result += c;
      }
    }
    return result;
  }

  /**
   * Transforms the request payload into a `Buffer`
   *
   * @param headers A headers object where to append headers when needed
   * @param payload A payload message
   * @returns A promise resolved to a `Buffer`.
   */
  static payloadToBuffer(headers: Headers, payload?: Payload): Buffer | undefined {
    if (!payload) {
      return undefined;
    }
    if (typeof payload === 'string') {
      payload = PayloadSupport.normalizeString(payload);
      return Buffer.from(payload, 'utf8');
    }

    if (payload.type === 'string') {
      return PayloadSupport.payloadToBuffer(headers, payload.data as string);
    }

    if (payload.type === 'file') {
      const meta = payload.meta as IFileMeta;
      if (!headers.has('content-type') && meta.mime) {
        headers.set('content-type', meta.mime);
      }
      return PayloadSerializer.deserializeFileBuffer(payload);
    }

    if (payload.type === 'blob') {
      const meta = payload.meta as IBlobMeta;
      if (!headers.has('content-type') && meta.mime) {
        headers.set('content-type', meta.mime);
      }
      return PayloadSerializer.deserializeBlobBuffer(payload);
    }

    if (payload.type === 'buffer') {
      return PayloadSerializer.deserializeBuffer(payload.data as number[]);
    }

    if (payload.type === 'arraybuffer') {
      return PayloadSerializer.deserializeArrayBufferBuffer(payload.data as number[]);
    }

    if (payload.type === 'formdata') {
      const result = formDataConverter(payload.data as IMultipartBody[]);
      headers.set('Content-Type', result.type);
      return result.buffer;
    }

    throw new Error('Unsupported payload message');
  }
}
