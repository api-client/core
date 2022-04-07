import { IListOptions } from '../../models/Backend.js';
import { Http } from './Http.js';
import { WsClient } from './WsClient.js';
import { AuthSdk } from './AuthSdk.js';
import { BackendSdk } from './BackendSdk.js';
import { FilesSdk } from './FilesSdk.js';
import { UsersSdk } from './UsersSdk.js';
import { HistorySdk } from './HistorySdk.js';
import { SharedSdk } from './SharedSdk.js';

const baseUriSymbol = Symbol('baseUri');

/**
 * NodeJS API for API Client's net-store module.
 */
export abstract class Sdk {
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
  file = new FilesSdk(this);
  /**
   * Reads user information.
   */
  user = new UsersSdk(this);
  /**
   * The HTTP(S) requests.
   */
  abstract http: Http;
  /**
   * The web socket requests.
   */
  abstract ws: WsClient;
  /**
   * The history data.
   */
  history = new HistorySdk(this);
  /**
   * The shared data.
   */
  shared = new SharedSdk(this);

  /**
   * When set it limits log output to minimum.
   */
  silent = false;


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
      if (options.parent) {
        searchParams.set('parent', options.parent);
      }
    }
  }
}
