import formDataConverter from './FormData';
import { Headers } from '../headers/Headers';
import { Payload, PayloadSerializer, IMultipartBody } from '../transformers/PayloadSerializer';

/**
 * A class containing static helper methods to deal with Payload
 * transformations
 */
export class PayloadSupport {
  /**
   * NormalizeLineEndingsToCRLF
   * https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/
   * platform/text/LineEnding.cpp&rcl=1458041387&l=101
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
   * @param payload A payload message
   * @param headers A headers object where to append headers when needed
   * @returns A promise resolved to a `Buffer`.
   */
  static async payloadToBuffer(payload: Payload, headers: Headers): Promise<Buffer|undefined> {
    if (!payload) {
      return;
    }
    if (typeof payload === 'string') {
      payload = PayloadSupport.normalizeString(payload);
      return Buffer.from(payload, 'utf8');
    }
    
    if (payload.type === 'string') {
      return PayloadSupport.payloadToBuffer(payload.data as string, headers);
    }

    if (['blob', 'file'].includes(payload.type)) {
      if (!headers.has('content-type') && payload.mime) {
        headers.set('content-type', payload.mime);
      }
      return PayloadSerializer.deserializeBlobBuffer(payload.data as string);
    }

    if (payload.type === 'buffer') {
      return PayloadSerializer.deserializeBuffer(payload.data as number[]);
    }

    if (payload.type === 'arraybuffer') {
      return PayloadSerializer.deserializeArrayBufferBuffer(payload.data as number[]);
    }

    if (payload.type === 'formdata') {
      const result = await formDataConverter(payload.data as IMultipartBody[]);
      headers.set('Content-Type', result.type);
      return result.buffer;
    }
    
    throw new Error('Unsupported payload message');
  }
}
