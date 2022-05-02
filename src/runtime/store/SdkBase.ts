import { Headers } from '../../lib/headers/Headers.js';
import { Sdk } from './Sdk.js';
import { SdkError, IApiError } from './Errors.js';

export interface ISdkRequestOptions {
  /**
   * Uses the provided token for authentication.
   */
  token?: string;
}

export interface IStoreRequestOptions extends ISdkRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>,
  body?: string | Buffer;
}

export interface IStoreResponse {
  status: number;
  headers: Headers;
  body?: string;
}

export interface IStoreTokenInfo {
  /**
   * The token to use.
   */
  token: string;
  /**
   * The timestamp when the token expires.
   * Note, clients may have a different date than the store.
   * 
   * May not be set when the token does not expire.
   */
  expires?: number;
}

export const E_INVALID_JSON = 'The response is not a valid JSON.';
export const E_RESPONSE_NO_VALUE = 'The response has no value.';
export const E_RESPONSE_STATUS = 'Invalid response status: ';
export const E_RESPONSE_UNKNOWN = 'The response has unknown format.';
export const E_RESPONSE_LOCATION = 'The response has no "location" header.';


export class SdkBase {
  constructor(public sdk: Sdk) {}

  protected logInvalidResponse(response: IStoreResponse): void {
    if (this.sdk.silent) {
      return;
    }
    if (response.body) {
      try {
        const data = JSON.parse(response.body);
        if (data.message) {
          console.warn(`[Store message]: ${data.message}`);
        }
      } catch (e) {
        // .
      }
    }
  }

  /**
   * Throws unified message for a common error status codes.
   * It handles 404, 403, and 401 status codes.
   */
  protected inspectCommonStatusCodes(status: number, body?: string): void {
    if (status === 404) {
      let e = this.createGenericSdkError(body)
      if (!e) {
        e = new SdkError(`Not found.`, 400);
        e.response = body;
      }
      throw e;
    }
    if (status === 403) {
      let e = this.createGenericSdkError(body)
      if (!e) {
        e = new SdkError(`You have no access to this resource.`, 403);
        e.response = body;
      }
      throw e;
    }
    if (status === 401) {
      let e = this.createGenericSdkError(body)
      if (!e) {
        e = new SdkError(`Not authorized.`, 401);
        e.response = body;
      }
      throw e;
    }
  }

  /**
   * Reads the response as ApiError
   * @param body The message returned by the store.
   * @returns The error schema or undefined when not an error;
   */
  protected readErrorResponse(body?: string): IApiError | undefined {
    if (!body) {
      return undefined;
    }
    let data: any;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return undefined;
    }
    if (data.error && data.message) {
      return data as IApiError;
    }
    return undefined;
  }

  protected createGenericSdkError(body?: string): SdkError | undefined {
    const info = this.readErrorResponse(body);
    if (!info) {
      return undefined;
    }
    const e = new SdkError(info.message, info.code);
    e.detail = info.detail;
    e.response = body;
    return e;
  }
}
