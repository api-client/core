import { SerializablePayload } from './SerializablePayload';
import { Payload } from '../lib/transformers/PayloadSerializer';

export const Kind = 'ARC#HttpRequest';

export interface IBaseHttpRequest {
  /**
   * The request URL
   */
  url: string;
  /**
   * HTTP method name
   * Defaults to "GET".
   */
  method?: string;
  /**
   * HTTP headers string
   */
  headers?: string;
  /**
   * The request payload.
   */
  payload?: Payload;
}

/**
 * The most basic HTTP request.
 */
export interface IHttpRequest extends IBaseHttpRequest {
  kind?: string;
}

/**
 * The base model of an HTTP request.
 * 
 * **Note about the payload.**
 * 
 * The payload is **always** stored in the request object in its serialized form.
 * Use the `readPayload()` to read the correct data type and the `writePayload()` to
 * safely store the payload.
 */
export class HttpRequest extends SerializablePayload {
  kind = Kind;
  /**
   * The request URL
   */
  url = '';
  /**
   * HTTP method name.
   * Defaults to "GET".
   */
  method = 'GET';
  /**
   * HTTP headers string
   */
  headers?: string;

  static fromBaseValues(values: IBaseHttpRequest): HttpRequest {
    return new HttpRequest({
      ...values,
      kind: Kind,
    });
  }

  /**
   * @param input The request definition used to restore the state.
   */
  constructor(input?: string | IHttpRequest) {
    super();
    let init: IHttpRequest;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        url: '',
        method: 'GET',
      };
    }
    this.new(init);
  }

  /**
   * Creates a new request clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC request.
   */
  new(init: IHttpRequest): void {
    const { url, method='GET', headers, payload, kind = Kind } = init;
    this.kind = kind;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.payload = payload;
  }

  /**
   * Checks whether the input is a definition of an HTTP request.
   */
  static isHttpRequest(input: unknown): boolean {
    const typed = input as IHttpRequest;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IHttpRequest {
    const result: IHttpRequest = {
      kind: this.kind,
      url: this.url,
      method: this.method,
    };
    if (this.headers) {
      result.headers = this.headers;
    }
    if (this.payload) {
      result.payload = this.payload;
    }
    return result;
  }
}
