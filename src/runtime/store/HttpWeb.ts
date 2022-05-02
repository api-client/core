import { Http } from './Http.js';
import { IStoreRequestOptions, IStoreResponse } from './SdkBase.js';
import { Headers } from '../../lib/headers/Headers.js';

export class HttpWeb extends Http {
  /**
   * Performs the GET request.
   * 
   * @param url The request URL
   * @param opts The request options
   * @returns The response info.
   */
  async get(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const { method='GET', headers={}, token = this.sdk.token } = opts;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    // eslint-disable-next-line no-undef
    const init: RequestInit = {
      method,
      headers,
      redirect: 'follow',
    };
    const response = await fetch(url, init);
    let body: string | undefined;
    try {
      body = await response.text();
    } catch (e) {
      // ...
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value: string, key: string) => {
      responseHeaders.append(key, value);
    });

    const result: IStoreResponse = {
      status: response.status,
      headers: responseHeaders,
      body,
    };
    return result;
  }

  async post(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const { method='POST', headers={}, token = this.sdk.token } = opts;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    // eslint-disable-next-line no-undef
    const init: RequestInit = {
      method,
      headers,
      redirect: 'follow',
    };
    if (opts.body) {
      init.body = opts.body.toString();
    }
    const response = await fetch(url, init);
    let body: string | undefined;
    try {
      body = await response.text();
    } catch (e) {
      // ...
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value: string, key: string) => {
      responseHeaders.append(key, value);
    });

    const result: IStoreResponse = {
      status: response.status,
      headers: responseHeaders,
      body,
    };
    return result;
  }

  patch(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const options: IStoreRequestOptions = { ...opts, method: 'PATCH' };
    return this.post(url, options);
  }

  put(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const options: IStoreRequestOptions = { ...opts, method: 'PUT' };
    return this.post(url, options);
  }

  delete(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const options: IStoreRequestOptions = { ...opts, method: 'DELETE' };
    return this.post(url, options);
  }
}
