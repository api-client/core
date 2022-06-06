/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
import { URL } from 'url';
import zlib from 'zlib';
import tls from 'tls';
import net from 'net';
import http from 'http';
import { EventEmitter } from 'events';
import { IHttpRequest, HttpRequest } from '../../models/HttpRequest.js';
import { IRequestBaseConfig } from '../../models/RequestConfig.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';
import { HostRule } from '../../models/HostRule.js';
import { HttpCertificate, IPemCertificate } from '../../models/ClientCertificate.js';
import { SentRequest } from '../../models/SentRequest.js';
import { Response } from '../../models/Response.js';
import { ErrorResponse } from '../../models/ErrorResponse.js';
import { RequestsSize } from '../../models/RequestsSize.js';
import { HttpResponse } from '../../models/HttpResponse.js';
import { ResponseRedirect } from '../../models/ResponseRedirect.js';
import { RequestLog, IRequestLog } from '../../models/RequestLog.js';
import { RequestTime } from '../../models/RequestTime.js';
import { SerializableError } from '../../models/SerializableError.js';
import { ResponseAuthorization } from '../../models/ResponseAuthorization.js';
import { DefaultLogger } from '../../lib/logging/DefaultLogger.js';
import { ILogger, Logger } from '../../lib/logging/Logger.js';
import { Headers } from '../../lib/headers/Headers.js';
import * as RequestUtils from './RequestUtils.js';
// import { Cookies } from '../../lib/cookies/Cookies.js';
import { HttpErrorCodes } from './HttpErrorCodes.js';
import { CookieParser } from '../../cookies/CookieParser.js';

/**
 * A note on cookies and redirects.
 * The architecture here assumes running requests is a test environment.
 * This means cookies are not processed by this class. This includes processing cookies during a redirect.
 * The class does parse response cookies before a redirect and sets new cookies in the redirected request only
 * if they match the domain + path. However, this class doesn't know anything about other cookies 
 * that the application may have for the domain after redirection.
 */
export interface HttpEngineOptions extends IRequestBaseConfig {
  /**
   * The authorization configuration to apply to the request.
   */
  authorization?: IRequestAuthorization[];
  /**
   * Logger object.
   */
  logger?: ILogger;
  /**
   * A certificate to use with the request.
   */
  certificates?: HttpCertificate[];
}

export interface RequestStats {
  firstReceiveTime?: number;
  lastReceivedTime?: number;
  messageStart?: number;
  sentTime?: number;
  connectionTime?: number;
  lookupTime?: number;
  connectedTime?: number;
  secureStartTime?: number;
  secureConnectedTime?: number;
  startTime?: number;
  responseTime?: number;
  receivingTime?: number;
}

export interface ResponseErrorInit {
  code?: number | string;
  message?: string;
}

export interface BeforeRedirectDetail {
  location: string;
  returnValue: boolean;
}
export interface HeadersReceivedDetail {
  value: string;
  returnValue: boolean;
}

export interface IRequestAuthState {
  method: 'ntlm';
  state: number;
  headers?: string;
  challengeHeader?: string;
}

export declare interface HttpEngine {
  /**
   * Dispatched before a redirect occurs.
   * The detail object on the listener's only argument has the `location` property 
   * with the new location for the request.
   * When the `returnValue` is set to `false` the request is cancelled.
   */
  on(event: 'beforeredirect', listener: (detail: BeforeRedirectDetail) => void): this;
  on(event: 'loadstart', listener: () => void): this;
  on(event: 'firstbyte', listener: () => void): this;
  on(event: 'headersreceived', listener: (detail: HeadersReceivedDetail) => void): this;
  on(event: 'loadend', listener: () => void): this;
  /**
   * Dispatched before a redirect occurs.
   * The detail object on the listener's only argument has the `location` property 
   * with the new location for the request.
   * When the `returnValue` is set to `false` the request is cancelled.
   */
  once(event: 'beforeredirect', listener: (detail: BeforeRedirectDetail) => void): this;
  once(event: 'loadstart', listener: () => void): this;
  once(event: 'firstbyte', listener: () => void): this;
  once(event: 'headersreceived', listener: (detail: HeadersReceivedDetail) => void): this;
  once(event: 'loadend', listener: () => void): this;
}

export const mainPromiseSymbol = Symbol('mainPromise');

/**
 * The base class to make HTTP requests in API Client.
 * This can be extended to support particular implementations.
 */
export abstract class HttpEngine extends EventEmitter {
  request: HttpRequest;
  opts: HttpEngineOptions;
  logger: Logger;

  /**
   * The current sent request
   */
  sentRequest: SentRequest;
  redirects: ResponseRedirect[] = [];
  /**
   * When true the request has been aborted.
   */
  aborted = false;
  /**
   * Parsed value of the request URL.
   */
  uri: URL;

  socket?: net.Socket;
  /**
   * Host header can be different than registered URL because of
   * `hosts` rules.
   * If a rule changes host value of the URL the original URL host value
   * is used when generating the request and not overwritten one.
   * This way virtual hosts can be tested using hosts.
   */
  hostHeader: string | undefined;

  protected hostTestReg = /^\s*host\s*:/im;
  /**
   * Set when the request is redirected.
   */
  redirecting = false;

  /**
   * The response headers.
   * The object may be empty when the response is not set.
   */
  currentHeaders = new Headers();

  /**
   * The response object build during the execution.
   */
  currentResponse?: Response;

  /**
   * @return True if following redirects is allowed.
   */
  get followRedirects(): boolean {
    const { opts } = this;
    if (typeof opts.followRedirects === 'boolean') {
      return opts.followRedirects;
    }
    return true;
  }

  /**
   * The request timeout.
   */
  get timeout(): number {
    const { opts } = this;
    if (typeof opts.timeout === 'number') {
      return opts.timeout;
    }
    return 0;
  }

  /**
   * Keeps the raw body in a temporary buffer while processing the response.
   */
  _rawBody?: Buffer;

  stats: RequestStats = {};

  auth?: IRequestAuthState;

  protected mainResolver?: (log: IRequestLog) => void;
  protected mainRejecter?: (err: SerializableError) => void;
  [mainPromiseSymbol]?: Promise<IRequestLog>;

  protected _signal?: AbortSignal;

  /**
   * The abort signal to set on this request.
   * Aborts the request when the signal fires.
   * @type {(AbortSignal | undefined)}
   */
  get signal(): AbortSignal | undefined {
    return this._signal;
  }

  set signal(value: AbortSignal | undefined) {
    const old = this._signal;
    if (old === value) {
      return;
    }
    this._signal = value;
    if (old) {
      old.removeEventListener('abort', this._abortHandler);
    }
    if (value) {
      value.addEventListener('abort', this._abortHandler);
    }
  }

  constructor(request: IHttpRequest, opts: HttpEngineOptions = {}) {
    super();
    this.request = new HttpRequest({ ...request });
    this.opts = opts;
    this.logger = this.setupLogger(opts);
    this.sentRequest = new SentRequest({ ...request, startTime: Date.now() });
    this.uri = this.readUrl(request.url);
    this.hostHeader = RequestUtils.getHostHeader(request.url);

    this._abortHandler = this._abortHandler.bind(this);
    if (opts.signal) {
      this.signal = opts.signal;
    }
  }

  /**
   * Creates a logger object to log debug output.
   */
  setupLogger(opts: HttpEngineOptions = {}): Logger {
    if (opts.logger) {
      return opts.logger;
    }
    return new DefaultLogger();
  }

  /**
   * Updates the `uri` property from current request URL
   * @param value The request URL
   */
  readUrl(value: string): URL {
    const { hosts = [] } = this.opts;
    const instances = hosts.map(i => new HostRule(i));
    value = HostRule.applyHosts(value, instances);
    try {
      return new URL(value);
    } catch (e) {
      throw new Error(`Unable to parse the URL: ${value}`);
    }
  }

  /**
   * Aborts current request.
   * It emits `error` event
   */
  abort(): void {
    this.aborted = true;
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners();
    if (this.socket.destroyed) {
      this.socket = undefined;
      return;
    }
    this.socket.pause();
    this.socket.destroy();
    this.socket = undefined;
  }

  /**
   * Handler for the `abort` event on the `AbortSignal`.
   */
  protected _abortHandler(): void {
    const e = new SerializableError('Request aborted', 3);
    this._errorRequest(e);
    this.abort();
  }

  /**
   * Sends the request.
   */
  abstract send(): Promise<IRequestLog>;

  /**
   * Decompresses received body if `content-encoding` header is set.
   *
   * @param body A body buffer to decompress.
   * @return Promise resolved to parsed body
   */
  async decompress(body?: Buffer): Promise<Buffer | undefined> {
    const { aborted, currentHeaders } = this;
    if (aborted || !currentHeaders || !body) {
      return;
    }
    const ce = currentHeaders.get('content-encoding');
    if (!ce) {
      return body;
    }
    if (ce.indexOf('deflate') !== -1) {
      return this.inflate(body);
    }
    if (ce.indexOf('gzip') !== -1) {
      return this.gunzip(body);
    }
    if (ce.indexOf('br') !== -1) {
      return this.brotli(body);
    }
    return body;
  }

  /**
   * Decompress body with Inflate.
   * @param body Received response payload
   * @return Promise resolved to decompressed buffer.
   */
  inflate(body: Buffer): Promise<Buffer> {
    body = Buffer.from(body);
    return new Promise((resolve, reject) => {
      zlib.inflate(body, (err, buffer) => {
        if (err) {
          reject(new Error(err.message || String(err)));
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
   * Decompress body with ZLib.
   * @param body Received response payload
   * @return Promise resolved to decompressed buffer.
   */
  gunzip(body: Buffer): Promise<Buffer> {
    body = Buffer.from(body);
    return new Promise((resolve, reject) => {
      zlib.gunzip(body, (err, buffer) => {
        if (err) {
          reject(new Error(err.message || String(err)));
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
   * Decompress Brotli.
   * @param body Received response payload
   * @return Promise resolved to decompressed buffer.
   */
  brotli(body: Buffer): Promise<Buffer> {
    body = Buffer.from(body);
    return new Promise((resolve, reject) => {
      zlib.brotliDecompress(body, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
   * Prepares headers list to be send to the remote machine.
   * If `defaultHeaders` option is set then it adds `user-agent` and `accept`
   * headers.
   * @param headers Parsed headers
   */
  prepareHeaders(headers: Headers): void {
    if (!this.opts.defaultHeaders) {
      return;
    }
    if (!headers.has('user-agent')) {
      if (this.opts.defaultUserAgent) {
        headers.set('user-agent', this.opts.defaultUserAgent);
      } else {
        headers.set('user-agent', 'api client');
      }
    }
    if (!headers.has('accept')) {
      if (this.opts.defaultAccept) {
        headers.set('accept', this.opts.defaultAccept);
      } else {
        headers.set('accept', '*/*');
      }
    }
  }

  /**
   * Cleans the state after finished.
   */
  _cleanUp(): void {
    this.redirects = [];
    this.currentHeaders = new Headers();
    this.currentResponse = undefined;
    this._rawBody = undefined;
    this.redirecting = false;
    this.stats = {};
    this.mainRejecter = undefined;
    this.mainResolver = undefined;
    this._clearSocketEventListeners();
  }

  /**
   * Cleans up the state for redirect.
   */
  _cleanUpRedirect(): void {
    this.currentHeaders = new Headers();
    this.currentResponse = undefined;
    this._rawBody = undefined;
    this.stats = {};
    this._clearSocketEventListeners();
  }

  /**
   * Reports response when redirected.
   * @param status Received status code
   * @return True if the request has been redirected.
   */
  _reportRedirect(status: number): boolean {
    const { request, currentHeaders } = this;
    if (!currentHeaders) {
      return false;
    }
    const rerUrl = currentHeaders.get('location');
    // https://github.com/jarrodek/socket-fetch/issues/13
    const redirectOptions = RequestUtils.redirectOptions(status, request.method, rerUrl);
    if (!redirectOptions.redirect) {
      return false;
    }
    this.redirecting = true;
    setTimeout(() => this._redirectRequest(redirectOptions));
    return true;
  }

  /**
   * Creates a response and adds it to the redirects list and redirects
   * the request to the new location.
   */
  async _redirectRequest(options: RequestUtils.RedirectOptions): Promise<void> {
    if (this.followRedirects === false) {
      this._publishResponse();
      return;
    }
    const location = options.location && RequestUtils.getRedirectLocation(options.location, this.request.url);
    if (!location) {
      this._errorRequest({ code: 302 });
      return;
    }

    // check if this is infinite loop
    if (RequestUtils.isRedirectLoop(location, this.redirects)) {
      this._errorRequest({ code: 310 });
      return;
    }

    const detail: BeforeRedirectDetail = {
      location,
      returnValue: true,
    };
    this.emit('beforeredirect', detail);
    if (!detail.returnValue) {
      this._publishResponse();
      return;
    }
    try {
      const responseCookies = this.currentHeaders.get('set-cookie');
      const response = await this._createRedirectResponse(location);
      this.redirects.push(response);
      this._cleanUpRedirect();
      if (responseCookies) {
        this._processRedirectCookies(responseCookies, location);
      }
      this.redirecting = false;

      this.request.url = location;
      this.sentRequest.url = location;
      if (options.forceGet) {
        this.request.method = 'GET';
      }
      this.uri = this.readUrl(location);
      this.hostHeader = RequestUtils.getHostHeader(location);
      // No idea why but without setTimeout the program loses it's
      // scope after calling the function.
      setTimeout(() => this.send());
    } catch (e) {
      const error = e as Error;
      this._errorRequest({
        message: (error && error.message) || 'Unknown error occurred',
      });
    }
  }

  /**
   * @param location The redirect location.
   * @return Redirect response object
   */
  async _createRedirectResponse(location: string): Promise<ResponseRedirect> {
    const { currentResponse = new Response() } = this;

    const response = HttpResponse.fromValues(
      currentResponse.status,
      currentResponse.statusText,
      currentResponse.headers,
    );
    if (currentResponse.payload) {
      response.payload = currentResponse.payload;
    }

    const body = await this.decompress(this._rawBody);
    if (body) {
      await response.writePayload(body);
      currentResponse.payload = response.payload;
    }

    const redirect = ResponseRedirect.fromValues(location, response.toJSON(), this.stats.startTime, this.stats.responseTime);
    redirect.timings = this._computeStats(this.stats);

    return redirect;
  }

  /**
   * Creates a response object
   * 
   * @return A response object.
   */
  async _createResponse(): Promise<Response | undefined> {
    if (this.aborted) {
      return;
    }
    const { currentResponse } = this;
    if (!currentResponse) {
      throw new Error(`Tried to create a response but no response data is set.`);
    }
    const { status } = currentResponse;
    if (status === undefined) {
      throw new Error(`The response status is empty.
It means that the successful connection wasn't made.
Check your request parameters.`);
    }
    const body = await this.decompress(this._rawBody);
    const response = Response.fromValues(
      status,
      currentResponse.statusText,
      currentResponse.headers,
    );
    response.timings = this._computeStats(this.stats);
    response.loadingTime = response.timings.total();
    if (body) {
      await response.writePayload(body);
      currentResponse.payload = response.payload;
    }
    if (status === 401) {
      response.auth = this._getAuth();
    }
    return response;
  }

  /**
   * Finishes the response with error message.
   */
  _errorRequest(opts: ResponseErrorInit): void {
    const { currentResponse } = this;
    this.aborted = true;
    let message;
    if (opts.code && !opts.message) {
      message = HttpErrorCodes.getCodeMessage(opts.code);
    } else if (opts.message) {
      message = opts.message;
    }
    message = message || 'Unknown error occurred';
    const error = new SerializableError(message, opts.code);
    const log = RequestLog.fromRequest(this.sentRequest);
    const response = ErrorResponse.fromError(error);
    log.response = response;
    if (currentResponse && currentResponse.status) {
      response.status = currentResponse.status;
      response.statusText = currentResponse.statusText;
      response.headers = currentResponse.headers;
      response.payload = currentResponse.payload;
    }
    this.finalizeRequest(log);
    this._cleanUp();
  }

  /**
   * Generates authorization info object from response.
   */
   _getAuth(): ResponseAuthorization {
    let auth = this.currentHeaders.get('www-authenticate');
    const result = new ResponseAuthorization();
    if (auth) {
      auth = auth.toLowerCase();
      if (auth.indexOf('ntlm') !== -1) {
        result.method = 'ntlm';
      } else if (auth.indexOf('basic') !== -1) {
        result.method = 'basic';
      } else if (auth.indexOf('digest') !== -1) {
        result.method = 'digest';
      }
    }
    return result;
  }

  /**
   * Generate response object and publish it to the listeners.
   */
  async _publishResponse(): Promise<void> {
    if (this.aborted) {
      return;
    }
    try {
      const response = await this._createResponse();
      if (!response) {
        return;
      }
      const result = RequestLog.fromRequestResponse(this.sentRequest, response.toJSON());
      if (this.redirects.length) {
        result.redirects = this.redirects;
      }
      result.size = new RequestsSize();
      if (this.sentRequest.httpMessage) {
        result.size.request = Buffer.from(this.sentRequest.httpMessage).length;
      }
      if (response.payload) {
        if (typeof response.payload === 'string') {
          result.size.response = response.payload.length;
        } else {
          result.size.response = response.payload.data.length;
        }
      }
      this.finalizeRequest(result);
    } catch (e) {
      const error = e as Error;
      // eslint-disable-next-line no-console
      console.error(error);
      this._errorRequest({
        message: (error && error.message) || 'Unknown error occurred',
      });
    }
    this.abort();
    this._cleanUp();
  }

  /**
   * Creates HAR 1.2 timings object from stats.
   * @param stats Timings object
   */
  _computeStats(stats: RequestStats): RequestTime {
    const {
      sentTime,
      messageStart,
      connectionTime=0,
      lookupTime=0,
      connectedTime,
      secureStartTime,
      secureConnectedTime,
      lastReceivedTime,
      firstReceiveTime,
      receivingTime,
    } = stats;
    // in case the `send` event was not handled we use the `messageStart` as this is set when the request is created.
    const adjustedSentTime = sentTime || messageStart;
    // when there was no body we check when the end time.
    const adjustedLastReceivedTime = lastReceivedTime || receivingTime;
    const adjustedLookupTime = lookupTime || messageStart;
    let send = adjustedSentTime && messageStart ? adjustedSentTime - messageStart : -1;
    if (send < 0) {
      send = 0;
    }
    const dns = lookupTime ? lookupTime - connectionTime : -1;
    const connect = connectedTime && adjustedLookupTime ? connectedTime - adjustedLookupTime : -1;
    let receive = adjustedLastReceivedTime && firstReceiveTime ? adjustedLastReceivedTime - firstReceiveTime : -1;
    if (receive < 0) {
      receive = 0;
    }
    let wait = firstReceiveTime && adjustedSentTime ? firstReceiveTime - adjustedSentTime : -1;
    if (wait < 0) {
      wait = 0;
    }
    let ssl = -1;
    if (typeof secureStartTime === 'number' && typeof secureConnectedTime === 'number') {
      ssl = secureConnectedTime - secureStartTime;
    }
    const result = new RequestTime();
    result.blocked = 0;
    result.connect = connect;
    result.receive = receive;
    result.send = send;
    result.wait = wait;
    result.dns = dns;
    result.ssl = ssl;
    return result;
  }

  /**
   * Handles cookie exchange when redirecting the request.
   * @param responseCookies Cookies received in the response
   * @param location Redirect destination
   */
  _processRedirectCookies(responseCookies: string, location: string): void {
    const received = CookieParser.parse(this.request.url, responseCookies);
    const forwardCookies = CookieParser.filterCookies(received, location);
    const headers = new Headers(this.request.headers);
    headers.delete('cookie');
    if (forwardCookies.length) {
      const parts: string[] = [];
      forwardCookies.forEach((cookie) => {
        parts.push(cookie.toString());
      });
      headers.set('cookie', parts.join('; '));
    }
    this.request.headers = headers.toString();

    // let newParser = new Cookies(responseCookies, location);
    // newParser.filter();
    // const expired = newParser.clearExpired();
    // const hasCookie = headers.has('cookie');
    // if (hasCookie) {
    //   const oldCookies = headers.get('cookie');
    //   const oldParser = new Cookies(oldCookies, location);
    //   oldParser.filter();
    //   oldParser.clearExpired();
    //   oldParser.merge(newParser);
    //   newParser = oldParser;
    //   // remove expired from the new response.
    //   newParser.cookies = newParser.cookies.filter((c) => {
    //     for (let i = 0, len = expired.length; i < len; i++) {
    //       if (expired[i].name === c.name) {
    //         return false;
    //       }
    //     }
    //     return true;
    //   });
    // }
    // const str = newParser.toString(true);
    // if (str) {
    //   headers.set('cookie', str);
    // } else if (hasCookie) {
    //   headers.delete('cookie');
    // }
    // this.request.headers = headers.toString();
  }

  /**
   * Checks certificate identity using TLS api.
   * 
   * @param host Request host name
   * @param cert TLS certificate info object
   */
  _checkServerIdentity(host: string, cert: tls.PeerCertificate): Error|undefined {
    const err = tls.checkServerIdentity(host, cert);
    if (err) {
      return err;
    }
  }

  /**
   * Clears event listeners of the socket object,
   */
  _clearSocketEventListeners(): void {
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('timeout');
    this.socket.removeAllListeners('end');
  }

  /**
   * Adds client certificate to the request configuration options.
   *
   * @param certificate List of certificate configurations.
   * @param options Request options. Cert agent options are added to this object.
   */
  _addClientCertificate(certificate: HttpCertificate, options: tls.ConnectionOptions): void {
    if (!certificate) {
      return;
    }
    const cert = { ...certificate };
    if (cert.type === 'p12') {
      if (!options.pfx) {
        options.pfx = [];
      }
      const struct: tls.PxfObject = {
        buf: Buffer.from(cert.cert.data as string),
      };
      if (cert.cert.passphrase) {
        struct.passphrase = cert.cert.passphrase;
      }
      if (!Array.isArray(options.pfx)) {
        if (options.pfx) {
          options.pfx = [options.pfx];
        } else {
          options.pfx = [];
        }
      }
      options.pfx.push(struct);
    } else if (cert.type === 'pem') {
      const typed = cert as IPemCertificate;
      if (!options.cert) {
        options.cert = [];
      }
      if (!Array.isArray(options.cert)) {
        if (options.cert) {
          options.cert = [options.cert];
        } else {
          options.cert = [];
        }
      }
      const added = Buffer.from(typed.cert.data as string);
      options.cert.push(added);
      if (typed.certKey) {
        if (!Array.isArray(options.key)) {
          if (options.key) {
            options.key = [options.key];
          } else {
            options.key = [];
          }
        }
        const struct: tls.KeyObject = {
          pem: Buffer.from(typed.certKey.data as string),
        };
        if (typed.certKey.passphrase) {
          struct.passphrase = typed.certKey.passphrase;
        }
        options.key.push(struct);
      }
    }
  }

  /**
   * @return Proxy authorization header value, when defined.
   */
  _proxyAuthHeader(): string|undefined {
    const { proxyUsername, proxyPassword='' } = this.opts;
    if (!proxyUsername) {
      return undefined;
    }
    const auth = `${proxyUsername}:${proxyPassword}`;
    const hash = Buffer.from(auth).toString('base64');
    return `Basic ${hash}`;
  }

  /**
   * Reads the raw headers from the node response and transforms them into the internal headers. 
   */
  computeResponseHeaders(res: http.IncomingMessage): Headers {
    const headers: Record<string, string> = {};
    for (let i = 0, len = res.rawHeaders.length; i < len; i += 2) {
      const name = res.rawHeaders[i];
      const value = res.rawHeaders[i + 1];
      if (headers[name]) {
        headers[name] += `; ${value}`;
      } else {
        headers[name] = value;
      }
    }
    return new Headers(headers);
  }

  /**
   * Called with the `send()` function to initialize the main promise returned by the send function.
   * The send function returns a promise that is resolved when the request finish.
   */
  protected wrapExecution(): Promise<IRequestLog> {
    let promise: Promise<IRequestLog>;
    if (this[mainPromiseSymbol]) {
      promise = this[mainPromiseSymbol] as Promise<IRequestLog>;
    } else {
      promise = new Promise((resolve, reject) => {
        this.mainResolver = resolve;
        this.mainRejecter = reject;
      });
      this[mainPromiseSymbol] = promise;
    }
    return promise;
  }

  /**
   * Called by the request finalizer or error finalized to report the response.
   * 
   * @param log Either the request execution log or an error.
   */
  protected finalizeRequest(log: RequestLog | SerializableError): void {
    const { mainRejecter, mainResolver } = this;
    if (!mainRejecter || !mainResolver) {
      // console.error(`Trying to finalize the request but the main resolver is not set.`);
      return;
    }
    
    if (log instanceof SerializableError) {
      mainRejecter(log);
    } else {
      mainResolver(log.toJSON());
    }
    this.mainRejecter = undefined;
    this.mainResolver = undefined;
    this[mainPromiseSymbol] = undefined;
  }
}
