import http from 'http';
import https from 'https';
import { Headers } from '../../lib/headers/Headers.js';
import { Http } from './Http.js';
import { IStoreRequestOptions, IStoreResponse } from './SdkBase.js';

export class HttpNode extends Http {
  /**
   * Performs the GET request.
   * 
   * @param url The request URL
   * @param opts The request options
   * @returns The response info.
   */
  async get(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const result = await this._get(url, opts);
    if ([301, 302, 308, 307].includes(result.status)) {
      const loc = result.headers.get('location');
      if (!loc) {
        throw new Error('Expected redirection but no "location" header.')
      }
      const newUrl = new URL(loc, url);
      return this.get(newUrl.toString(), opts);
    }
    return result;
  }

  private _get(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    return new Promise((resolve, reject) => {
      const { method='GET', headers={}, token = this.sdk.token } = opts;
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
      const isSsl = url.startsWith('https:');
      const lib = isSsl ? https : http;
      // console.log(`${method} ${url}`);
      const request = lib.request(url, {
        method,
        headers,
        rejectUnauthorized: false,
      });
      request.on('response', (response) => {
        const ro: IStoreResponse = {
          status: response.statusCode as number,
          headers: new Headers(response.headers),
          body: '',
        };
        response.on('data', (chunk) => {
          ro.body += chunk;
        });
        response.on('end', () => resolve(ro));
      });
      request.on('error', (error) => reject(error));
      request.end();
    });
  }

  post(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    return new Promise((resolve, reject) => {
      const { method='POST', headers={}, token = this.sdk.token } = opts;
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
      const isSsl = url.startsWith('https:');
      const lib = isSsl ? https : http;
      const request = lib.request(url, {
        method,
        headers,
      });
      request.on('response', (response) => {
        const ro: IStoreResponse = {
          status: response.statusCode as number,
          headers: new Headers(response.headers),
          body: '',
        };
        response.on('data', (chunk) => {
          ro.body += chunk;
        });
        response.on('end', () => resolve(ro));
      });
      request.on('error', (error) => reject(error));
      if (opts.body) {
        request.write(opts.body);
      }
      request.end();
    });
  }

  patch(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const options = { ...opts };
    options.method = 'PATCH';
    return this.post(url, options);
  }

  delete(url: string, opts: IStoreRequestOptions = {}): Promise<IStoreResponse> {
    const options = { ...opts };
    options.method = 'DELETE';
    return this.post(url, options);
  }
}
