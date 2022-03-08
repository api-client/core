import http from 'http';
import https from 'https';
import WebSocket from 'ws';
import { IBackendInfo } from '../../models/Backend.js';

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
  headers: http.IncomingHttpHeaders;
  body?: string;
}

/**
 * NodeJS API for API Client's net-store module.
 */
export class StoreSdk {
  /**
   * The token to use with requests. Can be overwritten with each API call.
   */
  token?: string;
  /**
   * @param baseUri The base URI to the store.
   * @param basePath The base path (the router prefix) for the server.
   */
  constructor(public baseUri: string, public basePath?: string) {}

  /**
   * @returns Client information about the store configuration.
   */
  async getInfo(): Promise<IBackendInfo> {
    const { baseUri } = this;
    const url = `${baseUri}/store`;
    const result = await this.get(url);
    if (result.status !== 200) {
      throw new Error(`Invalid store response. Expected 200 status and ${result.status} received.`);
    }
    const body = result.body as string;
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error(`The server returned invalid response. Unable to read store status.`);
    }
    return data as IBackendInfo;
  }

  /**
   * Creates unauthenticated session in the backend.
   * @returns The JWT for unauthenticated user.
   */
  async createSession(): Promise<string> {
    const { baseUri } = this;
    const url = `${baseUri}/sessions`;
    // console.log('Create session: ', url);
    const result = await this.post(url);
    return result.body as string;
  }

  /**
   * Initializes the authentication session.
   * @param token The unauthenticated session JWT. Required when not set on the class.
   * @returns The location of the authorization endpoint.
   */
  async createAuthSession(token?: string, loginPath = '/auth/login'): Promise<string> {
    const { baseUri } = this;
    const url = `${baseUri}${loginPath}`;
    const result = await this.post(url, {
      token,
    });
    const loc = result.headers.location;
    if (!loc) {
      throw new Error(`The location header not returned by the server.`);
    }
    return loc;
  }

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
      const loc = result.headers.location;
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
      const { method='GET', headers={}, token = this.token } = opts;
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
          headers: response.headers,
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
      const { method='POST', headers={}, token = this.token } = opts;
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
          headers: response.headers,
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

  /**
   * Listens to the first message coming to the client from the auth endpoint.
   * @param authPath The authorization path returned by the server info or 401 response.
   * @param token Optional token to use.
   */
  async listenAuth(authPath: string, token?: string): Promise<void> {
    const { baseUri, basePath='' } = this;
    const authUrl = new URL(`${basePath}${authPath}`, baseUri);
    const client = await this.createAndConnect(authUrl.toString(), token);
    return new Promise((resolve, reject) => {
      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        this.disconnect(client)
        .then(() => {
          if (message.status === 'OK') {
            resolve();
          } else {
            reject(new Error(message.message || 'Unknown error'));
          }
        }).catch(cause => reject(cause));
      });
    });
  }

  /**
   * Creates a WS client with optional token
   * @param addr The ws:// address
   * @param token Optional token to add.
   */
  getWsClient(addr: string, token = this.token): WebSocket {
    let url = addr;
    if (token) {
      url += url.includes('?') ? '&' : '?';
      url += 'token=';
      url += token;
    }
    if (url.startsWith('http:')) {
      url = `ws:${url.substring(5)}`;
    } else if (url.startsWith('https:')) {
      url = `wss:${url.substring(6)}`;
    }
    return new WebSocket(url);
  }

  /**
   * Connect to the WS server
   * 
   * @param client The client to wait for connection.
   */
  connect(client: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      client.once('open', () => {
        client.removeAllListeners('error');
        resolve();
      });
      client.once('error', (err) => {
        client.removeAllListeners('open');
        reject(err);
      });
    });
  }

  /**
   * Disconnects from the WS server.
   */
  disconnect(client: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      client.once('close', () => {
        client.removeAllListeners('error');
        resolve();
      });
      client.once('error', (err) => {
        client.removeAllListeners('close');
        reject(err);
      });
      client.close();
    });
  }

  /**
   * The combination of `getClient()` and `connect()`.
   */
  async createAndConnect(addr: string, token?: string): Promise<WebSocket> {
    const client = this.getWsClient(addr, token);
    await this.connect(client);
    return client;
  }
}
