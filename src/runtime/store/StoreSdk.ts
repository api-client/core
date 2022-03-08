import http from 'http';
import https from 'https';
import WebSocket from 'ws';
import { URL } from 'url';
import { JsonPatch } from 'json8-patch';
import { IBackendInfo, IListOptions, IListResponse } from '../../models/Backend.js';
import { IWorkspace, IUserWorkspace, Workspace } from '../../models/Workspace.js';
import { UserAccessOperation, IUser } from '../../models/User.js';
import { HttpProject, IHttpProject } from '../../models/HttpProject.js';

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

const E_INVALID_JSON = 'The response is not a valid JSON.';
const E_RESPONSE_NO_VALUE = 'The response has no value.';
const E_RESPONSE_STATUS = 'Invalid response status: ';
const E_RESPONSE_UNKNOWN = 'The response has unknown format.';
const E_RESPONSE_LOCATION = 'The response has no "location" header.';

const baseUriSymbol = Symbol('baseUri');

/**
 * NodeJS API for API Client's net-store module.
 */
export class StoreSdk {
  /**
   * The token to use with requests. Can be overwritten with each API call.
   */
  token?: string;
  /**
   * The user authentication features.
   */
  auth = new AuthSdk(this);
  /**
   * The store information features
   */
  store = new BackendSdk(this);
  /**
   * The user spaces features.
   */
  space = new SpacesSdk(this);
  /**
   * The user projects features.
   */
  project = new ProjectsSdk(this);
  /**
   * Reads user information.
   */
  user = new UsersSdk(this);
  /**
   * The HTTP(S) requests.
   */
  http = new HttpClient(this);
  /**
   * The web socket requests.
   */
  ws = new WsClient(this);


  [baseUriSymbol] = '';

  /**
   * @returns The base URI to the store.
   */
  get baseUri(): string {
    return this[baseUriSymbol];
  }

  /**
   * @param value The base URI to the store.
   */
  set baseUri(value: string) {
    if (!value) {
      throw new Error(`Invalid value for the baseUri`);
    }
    let url: URL;
    try {
      url = new URL(value);
    } catch (e) {
      throw new Error(`Invalid baseUri: Not an URL`);
    }
    this[baseUriSymbol] = url.origin;
    const { pathname } = url;
    if (pathname && pathname !== '/') {
      this.basePath = pathname;
    } else {
      this.basePath = undefined;
    }
  }

  /**
   * @param baseUri The base URI to the store.
   * @param basePath The base path (the router prefix) for the server.
   */
  constructor(baseUri: string, public basePath?: string) {
    this.baseUri = baseUri;
  }

  /**
   * Creates a full URL for a path.
   * This adds the server's base path and the passed path to the configured base URL.
   * @param path The path to the endpoint, without the base path.
   */
  getUrl(path='/'): URL {
    const { baseUri, basePath='' } = this;
    let userPath = path;
    if (basePath && userPath.startsWith(basePath)) {
      userPath = userPath.substring(basePath.length);
    }
    return new URL(`${basePath}${userPath}`, baseUri);
  }

  /**
   * Appends list options to the query parameters.
   * @param url The URL object to the API endpoint
   * @param options The list options, if any
   */
  appendListOptions(url: URL, options: IListOptions = {}): void {
    const { searchParams } = url;
    if (options.cursor) {
      searchParams.set('cursor', options.cursor);
    } else {
      if (typeof options.limit === 'number') {
        searchParams.set('limit', String(options.limit));
      }
      if (options.query) {
        searchParams.set('query', options.query);
      }
      if (Array.isArray(options.queryField)) {
        options.queryField.forEach((field) => {
          searchParams.append('queryField', field);
        });
      }
    }
  }
}

class SdkBase {
  constructor(public sdk: StoreSdk) {}

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

class AuthSdk extends SdkBase {
  protected getExpires(headers: http.IncomingHttpHeaders): number | undefined {
    if (!headers.expires) {
      return undefined;
    }
    const d = new Date(headers.expires);
    const time = d.getTime();
    if (Number.isNaN(time)) {
      console.warn(`Invalid session response: the expires header cannot be parsed.`);
      return undefined;
    }
    return time;
  }

  /**
   * Creates unauthenticated session in the backend.
   * @returns The JWT for unauthenticated user.
   */
  async createSession(): Promise<IStoreTokenInfo> {
    const { baseUri } = this.sdk;
    const url = `${baseUri}/sessions`;
    // console.log('Create session: ', url);
    const result = await this.sdk.http.post(url);
    this.inspectCommonStatusCodes(result.status);
    if (result.status !== 200) {
      throw new Error(`Unable to create the session. Invalid response status: ${result.status}`);
    }
    if (!result.body) {
      throw new Error(`Unable to create the session. Response has no token.`);
    }
    const info: IStoreTokenInfo = {
      token: result.body,
    };
    const expires = this.getExpires(result.headers);
    if (expires) {
      info.expires = expires;
    }
    return info;
  }

  /**
   * Initializes the authentication session.
   * @param token The unauthenticated session JWT. Required when not set on the class.
   * @returns The location of the authorization endpoint.
   */
  async createAuthSession(token?: string, loginPath = '/auth/login'): Promise<string> {
    const { baseUri } = this.sdk;
    const url = `${baseUri}${loginPath}`;
    const result = await this.sdk.http.post(url, { token });
    this.inspectCommonStatusCodes(result.status);
    const loc = result.headers.location;
    if (!loc) {
      throw new Error(`The location header not returned by the server.`);
    }
    return loc;
  }

  /**
   * Listens to the first message coming to the client from the auth endpoint.
   * @param authPath The authorization path returned by the server info or 401 response.
   * @param token Optional token to use.
   */
  async listenAuth(authPath: string, token?: string): Promise<void> {
    const { baseUri, basePath='' } = this.sdk;
    const authUrl = new URL(`${basePath}${authPath}`, baseUri);
    const client = await this.sdk.ws.createAndConnect(authUrl.toString(), token);
    return new Promise((resolve, reject) => {
      client.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        this.sdk.ws.disconnect(client)
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
   * Renews authenticated token to a new one when the token expires.
   * @param token Optional token to use.
   * @returns 
   */
  async renewToken(token = this.sdk.token): Promise<IStoreTokenInfo> {
    const { baseUri, basePath='' } = this.sdk;
    const authPath = '/sessions/renew';
    const url = new URL(`${basePath}${authPath}`, baseUri).toString();
    const result = await this.sdk.http.post(url, { token });
    this.inspectCommonStatusCodes(result.status);
    if (result.status !== 200) {
      throw new Error(`Unable to renew the token. Invalid response status: ${result.status}`);
    }
    if (!result.body) {
      throw new Error(`Unable to create the session. Response has no token.`);
    }
    const info: IStoreTokenInfo = {
      token: result.body,
    };
    const expires = this.getExpires(result.headers);
    if (expires) {
      info.expires = expires;
    }
    return info;
  }
}

class BackendSdk extends SdkBase {
  /**
   * @returns Client information about the store configuration.
   */
  async getInfo(): Promise<IBackendInfo> {
    const { baseUri } = this.sdk;
    const url = `${baseUri}/store`;
    const result = await this.sdk.http.get(url);
    this.inspectCommonStatusCodes(result.status);
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
}

class SpacesSdk extends SdkBase {
  /**
   * Lists spaces in the store.
   * @param options Optional query options.
   */
  async list(options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl('/spaces');
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list spaces. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Creates a workspace in the store.
   * @param space The workspace definition.
   * @returns The key of the creates space.
   */
  async create(space: IWorkspace | Workspace): Promise<string> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl('/spaces');
    const body = JSON.stringify(space);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a user space. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    const { location } = result.headers;
    if (!location) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_LOCATION}`);
    }
    const id = location.split('/').pop();
    return id as string;
  }

  /**
   * Reads a user space definition from the store.
   * @param key The user space key
   * @returns The definition of the user space.
   */
  async read(key: string): Promise<IUserWorkspace> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${key}`);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a user space. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IUserWorkspace;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== 'ARC#Space') {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Patches a user space in the store.
   * @param key The key of the user space to patch
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `json8-patch` library
   */
  async patch(key: string, value: JsonPatch): Promise<JsonPatch> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${key}`);
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a user space. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: any;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.revert) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data.revert as JsonPatch;
  }

  /**
   * Deletes the space in the store.
   * 
   * @param key The key of the space to delete.
   */
  async delete(key: string): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${key}`);
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to delete a user space. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Updates the sharing options of the space.
   * 
   * @param key The user space key
   * @param value The patch operation on the space's ACL
   */
  async patchUsers(key: string, value: UserAccessOperation[]): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${key}/users`);
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a user space. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }
}

class HttpClient extends SdkBase {
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
}

class WsClient extends SdkBase {
  /**
   * Creates a WS client with optional token
   * @param addr The ws:// address
   * @param token Optional token to add.
   */
  getClient(addr: string, token = this.sdk.token): WebSocket {
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
    const client = this.getClient(addr, token);
    await this.connect(client);
    return client;
  }
}

class ProjectsSdk extends SdkBase {
  /**
   * Creates a project in a user space.
   * 
   * @param key The user space key
   * @param project THe project to create
   * @returns The key of the created project.
   */
  async create(key: string, project: IHttpProject | HttpProject): Promise<string> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${key}/projects`);
    const body = JSON.stringify(project);
    const result = await this.sdk.http.post(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to create a project. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    const { location } = result.headers;
    if (!location) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_LOCATION}`);
    }
    const id = location.split('/').pop();
    return id as string;
  }

  /**
   * Reads a project definition from the store.
   * @param space The user space key
   * @param project The project key
   * @returns The definition of the project.
   */
  async read(space: string, project: string): Promise<IHttpProject> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${space}/projects/${project}`);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IHttpProject;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (data.kind !== 'ARC#HttpProject') {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists projects in the space
   * 
   * @param space The user space key
   * @param options Optional query options.
   */
  async list(space: string, options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${space}/projects`);
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list projects. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Deletes a project form the store.
   * 
   * @param space The key of the parent space.
   * @param project The key of the project to delete.
   */
  async delete(space: string, project: string): Promise<void> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${space}/projects/${project}`);
    const result = await this.sdk.http.delete(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to delete a project. ';
    if (result.status !== 204) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
  }

  /**
   * Patches a project in the store.
   * @param space The key of the parent user space
   * @param project The key of project to patch.
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `json8-patch` library
   */
  async patch(space: string, project: string, value: JsonPatch): Promise<JsonPatch> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/spaces/${space}/projects/${project}`);
    const body = JSON.stringify(value);
    const result = await this.sdk.http.patch(url.toString(), { token, body });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to patch a project. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: any;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.revert) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data.revert as JsonPatch;
  }
}

class UsersSdk extends SdkBase {
  async me(): Promise<IUser> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/users/me`);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to read a user. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IUser;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!data.key) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }

  /**
   * Lists users in the store
   * 
   * @param options Optional query options.
   */
  async list(options?: IListOptions): Promise<IListResponse> {
    const { token } = this.sdk;
    const url = this.sdk.getUrl(`/users`);
    this.sdk.appendListOptions(url, options);
    const result = await this.sdk.http.get(url.toString(), { token });
    this.inspectCommonStatusCodes(result.status);
    const E_PREFIX = 'Unable to list projects. ';
    if (result.status !== 200) {
      this.logInvalidResponse(result);
      throw new Error(`${E_PREFIX}${E_RESPONSE_STATUS}${result.status}`);
    }
    if (!result.body) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_NO_VALUE}`);
    }
    let data: IListResponse;
    try {
      data = JSON.parse(result.body);
    } catch (e) {
      throw new Error(`${E_PREFIX}${E_INVALID_JSON}.`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error(`${E_PREFIX}${E_RESPONSE_UNKNOWN}.`);
    }
    return data;
  }
}
