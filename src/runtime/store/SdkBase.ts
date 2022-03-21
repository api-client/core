import { Headers } from '../../lib/headers/Headers.js';
import { Sdk } from './Sdk.js';

export interface IStoreRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>,
  body?: string | Buffer;
  /**
   * Adds the token to the headers.
   */
  token?: string;
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
  protected inspectCommonStatusCodes(status: number): void {
    if (status === 404) {
      throw new Error(`Not found.`);
    }
    if (status === 403) {
      throw new Error(`You have no access to this resource.`);
    }
    if (status === 401) {
      throw new Error(`Not authorized.`);
    }
  }
}
