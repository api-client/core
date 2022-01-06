import { IHttpResponse, HttpResponse, Kind } from './HttpResponse.js';
import { ErrorResponse as LegacyErrorResponse } from './legacy/request/ArcResponse.js';
import { PayloadSerializer } from '../lib/transformers/PayloadSerializer.js';
import { Normalizer } from './legacy/Normalizer.js';

export interface IErrorResponse extends IHttpResponse {
  /**
   * An error associated with the response
   */
  error: string | Error;
}

export class ErrorResponse extends HttpResponse {
  /**
   * An error associated with the response
   */
  error = new Error('Unknown error');

  /**
   * @returns The same Error or new Error instance when passed string.
   */
  static ensureError(error: string | Error): Error {
    return typeof error === 'string' ? new Error(error) : error;
  }

  /**
   * @param error The error message or Error object to use.
   */
  static fromError(error: Error | string): ErrorResponse {
    const err = ErrorResponse.ensureError(error);
    return new ErrorResponse({
      kind: Kind,
      status: 0,
      error: err,
    });
  }

  static async fromLegacy(input: LegacyErrorResponse): Promise<ErrorResponse> {
    const init: IErrorResponse = {
      kind: Kind,
      status: input.status || 0,
      error: input.error ? ErrorResponse.ensureError(input.error) : new Error('Unknown error'),
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
    }
    return new ErrorResponse(init);
  }

  /**
   * @param input The request definition used to restore the state.
   */
  constructor(input?: string|IErrorResponse) {
    super(input);
    let init: IErrorResponse;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        status: 0,
        error: new Error('Unknown error'),
      };
    }
    this.new(init);
  }

  /**
   * Creates a new request clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC request.
   */
  new(init: IErrorResponse): void {
    super.new(init);
    if (init.error) {
      this.error = ErrorResponse.ensureError(init.error);
    }
  }

  toJSON(): IErrorResponse {
    const response = super.toJSON() as IErrorResponse;
    response.error = this.error.message;
    return response;
  }

  static isErrorResponse(input: unknown): boolean {
    const typed = input as IErrorResponse;
    return !!typed.error;
  }
}
