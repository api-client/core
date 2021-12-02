import { SerializablePayload } from './SerializablePayload';
import { Payload } from '../lib/transformers/PayloadSerializer';
import { HTTPResponse as LegacyHttpResponse } from './legacy/request/ArcResponse';
import { PayloadSerializer } from '../lib/transformers/PayloadSerializer';
import { Normalizer } from './legacy/Normalizer';

export const Kind = 'ARC#HttpResponse';

export interface IHttpResponse {
  kind?: string;
  /**
   * The response status code
   */
  status: number;
  /**
   * The reason part of the status message
   */
  statusText?: string;
  /**
   * The response headers
   */
  headers?: string;
  /**
   * The response message
   */
  payload?: Payload;
}

export class HttpResponse extends SerializablePayload {
  kind = Kind;
  /**
   * The response status code
   */
  status = 0;
  /**
   * The reason part of the status message
   */
  statusText?: string;
  /**
   * The response headers
   */
  headers?: string;

  static fromValues(status: number, statusText?: string, headers?: string): HttpResponse {
    return new HttpResponse({
      kind: Kind,
      status,
      statusText,
      headers,
    });
  }

  static async fromLegacy(response: LegacyHttpResponse): Promise<HttpResponse> {
    const init: IHttpResponse = {
      kind: Kind,
      status: response.status || 0,
    };
    if (response.statusText) {
      init.statusText = response.statusText;
    }
    if (response.headers) {
      init.headers = response.headers;
    }
    if (response.payload) {
      const orig = Normalizer.restoreTransformedPayload(response.payload);
      if (orig) {
        init.payload = await PayloadSerializer.serialize(orig);
      }
    }
    return new HttpResponse(init);
  }

  /**
   * @param input The response definition used to restore the state.
   */
  constructor(input?: string|IHttpResponse) {
    super();
    let init: IHttpResponse;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        status: 0,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new response clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC response.
   */
  new(init: IHttpResponse): void {
    if (!HttpResponse.isHttpResponse(init)) {
      throw new Error(`Not an ARC response.`);
    }
    const { status, statusText, headers, payload, kind=Kind } = init;
    this.kind = kind;
    this.status = status;
    this.statusText = statusText;
    this.headers = headers;
    this.payload = payload;
  }

  /**
   * Checks whether the input is a definition of an HTTP response.
   */
  static isHttpResponse(input: unknown): boolean {
    const typed = input as IHttpResponse;
    if (!input || typeof typed.status !== 'number') {
      return false;
    }
    return true;
  }

  toJSON(): IHttpResponse {
    const result: IHttpResponse = {
      kind: this.kind,
      status: this.status,
    };
    if (this.statusText) {
      result.statusText = this.statusText;
    }
    if (this.headers) {
      result.headers = this.headers;
    }
    if (this.payload) {
      result.payload = this.payload;
    }
    return result;
  }
}
