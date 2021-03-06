import { IHttpResponse, HttpResponse, Kind } from './HttpResponse.js';
import { IRequestTime, RequestTime } from './RequestTime.js';
import { IResponseAuthorization, ResponseAuthorization } from './ResponseAuthorization.js';
import { IErrorResponse } from './ErrorResponse.js';
import { Response as LegacyResponse } from './legacy/request/ArcResponse.js';
import { PayloadSerializer } from '../lib/transformers/PayloadSerializer.js';
import { Normalizer } from './legacy/Normalizer.js';

export { Kind };

/**
 * An HTTP response object.
 */
export interface IResponse extends IHttpResponse {
  /**
   * The request timings. 
   * Some HTTP clients may not give this information.
   */
  timings?: IRequestTime;
  /**
   * The total loading time (from sending the request to receive the last byte)
   */
  loadingTime: number;
  /**
   * The authentication request from the server.
   */
  auth?: IResponseAuthorization;
}

export class Response extends HttpResponse {
  /**
   * The request timings. 
   * Some HTTP clients may not give this information.
   */
  timings?: RequestTime;
  /**
   * The total loading time (from sending the request to receive the last byte)
   */
  loadingTime = 0;
  /**
   * The authentication request from the server.
   */
  auth?: ResponseAuthorization;

  static fromValues(status: number, statusText?: string, headers?: string): Response {
    return new Response({
      kind: Kind,
      status,
      statusText,
      headers,
      loadingTime: 0,
    });
  }

  static async fromLegacy(input: LegacyResponse): Promise<Response> {
    const init: IResponse = {
      kind: Kind,
      status: input.status || 0,
      loadingTime: input.loadingTime || 0,
    };
    if (input.headers) {
      init.headers = input.headers;
    }
    if (input.statusText) {
      init.statusText = input.statusText;
    }
    if (input.payload) {
      const orig = Normalizer.restoreTransformedPayload(input.payload);
      if (orig) {
        init.payload = await PayloadSerializer.serialize(orig);
      }
    } else if (input.blob) {
      init.payload = {
        type: 'blob',
        data: input.blob,
      };
    } else if (input.multipart) {
      init.payload = {
        type: 'formdata',
        data: input.multipart,
      };
    }
    if (input.timings) {
      init.timings = new RequestTime(input.timings).toJSON();
    }
    return new Response(init);
  }

  /**
   * @param input The response definition used to restore the state.
   */
  constructor(input?: string|IResponse) {
    super();
    let init: IResponse;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        status: 0,
        loadingTime: 0,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new response clearing anything that is so far defined.
   */
  new(init: IResponse): void {
    super.new(init);
    const { loadingTime=0, timings, auth } = init;
    this.loadingTime = loadingTime;
    if (timings) {
      this.timings = new RequestTime(timings);
    } else {
      this.timings = undefined;
    }
    if (auth) {
      this.auth = new ResponseAuthorization(auth);
    } else {
      this.auth = undefined;
    }
  }

  toJSON(): IResponse {
    const response = super.toJSON() as IResponse;
    response.loadingTime = this.loadingTime;
    if (this.timings) {
      response.timings = this.timings.toJSON();
    }
    if (this.auth) {
      response.auth = this.auth.toJSON();
    }
    return response;
  }

  /**
   * Checks whether the object (JSON Object) is an Error response.
   */
  static isErrorResponse(input: unknown): boolean {
    const typed = input as IErrorResponse;
    if (typed.error) {
      return true;
    }
    return false;
  }

  /**
   * Creates the RequestTime object from the passed object.
   */
  setTimings(timings: IRequestTime): void {
    this.timings = new RequestTime(timings);
  }

  /**
   * Sets the authorization data on the response.
   */
  setAuth(auth: IResponseAuthorization): void {
    this.auth = new ResponseAuthorization(auth);
  }
}
