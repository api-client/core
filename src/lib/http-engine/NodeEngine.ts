/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { URL, UrlWithStringQuery } from 'url';
import http from 'http';
import https from 'https';
import net from 'net';
import { HttpEngine, HttpEngineOptions, ResponseErrorInit, HeadersReceivedDetail } from './HttpEngine';
import { IHttpRequest } from '../../models/HttpRequest';
import { ArcResponse } from '../../models/ArcResponse';
import { IRequestLog } from '../../models/RequestLog';
import { Headers } from '../headers/Headers';
import { PayloadSupport } from './PayloadSupport';
import { addContentLength, getPort } from './RequestUtils';
import { NetError } from './Errors';

export class NodeEngine extends HttpEngine {
  responseReported = false;

  _sentHttpMessage: any;

  client?: http.ClientRequest;
  receivingResponse = false;

  constructor(request: IHttpRequest, opts: HttpEngineOptions = {}) {
    super(request, opts);

    this._connectHandler = this._connectHandler.bind(this);
    this._secureConnectHandler = this._secureConnectHandler.bind(this);
    this._responseHandler = this._responseHandler.bind(this);
    this._timeoutHandler = this._timeoutHandler.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    this._lookupHandler = this._lookupHandler.bind(this);
    this._closeHandler = this._closeHandler.bind(this);
    this._socketHandler = this._socketHandler.bind(this);
    this._sendEndHandler = this._sendEndHandler.bind(this);
  }

  // _cleanUp(): void {
  //   super._cleanUp();
  //   this.receivingResponse = false;
  // }

  // _cleanUpRedirect(): void {
  //   super._cleanUpRedirect();
  //   this.receivingResponse = false;
  // }

  /**
   * Sends the request
   */
  async send(): Promise<IRequestLog> {
    this.abort();
    this.aborted = false;
    const promise = this.wrapExecution();
    this.sendRequest();
    return promise;
  }

  private async sendRequest(): Promise<void> {
    try {
      const message = await this._prepareMessage();
      const request = this.opts.proxy ? await this._connectProxy(this.opts.proxy, message) : this._connect(message);
      if (request) {
        this.client = request;
        const { timeout } = this;
        if (timeout > 0) {
          request.setTimeout(timeout);
        }
      }
    } catch (e) {
      console.warn(e);
      this.finalizeRequest(e as Error);
    }
  }

  /**
   * Prepares the request body (the payload) and the headers.
   *
   * @return Resolved promise to a `Buffer`. Undefined when no message.
   */
  async _prepareMessage(): Promise<Buffer|undefined> {
    const { method='GET', headers, payload } = this.request;
    const engineHeaders = new Headers(headers);
    this.prepareHeaders(engineHeaders);
    if (!payload || ['get', 'head'].includes(method.toLowerCase())) {
      this.sentRequest.headers = engineHeaders.toString();
      return undefined;
    }
    const buffer = await PayloadSupport.payloadToBuffer(payload, engineHeaders);
    if (!buffer) {
      return undefined;
    }
    addContentLength(method, buffer, engineHeaders);
    this.sentRequest.headers = engineHeaders.toString();
    return buffer;
  }

  /**
   * Connects to the remote machine.
   */
  _connect(message?: Buffer): http.ClientRequest {
    const uri = new URL(this.request.url);
    const port = getPort(uri.port, uri.protocol);
    if (port === 443 || uri.protocol === 'https:') {
      return this._connectHttps(uri, message);
    }
    return this._connectHttp(uri, message);
  }

  /**
   * Creates a connection using regular transport.
   */
  _connectHttp(uri: URL, message?: Buffer): http.ClientRequest {
    if (!uri.port) {
      uri.port = '80';
    }
    const options = this._createGenericOptions(uri);
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;

    const request = http.request(options);
    this._setCommonListeners(request);
    if (message) {
      request.write(message);
    }
    this.stats.messageStart = Date.now();
    request.end();
    // This is a hack to read sent data.
    // In the https://github.com/nodejs/node/blob/0a62026f32d513a8a5d9ed857481df5f5fa18e8b/lib/_http_outgoing.js#L960
    // library it hold the data until it is flushed.
    // @ts-ignore
    const pending = request.outputData;
    if (Array.isArray(pending)) {
      this._sentHttpMessage = pending;
    }
    try {
      this.emit('loadstart');
    } catch (_) {
      //
    }
    return request;
  }

  /**
   * Creates a connection using SSL transport.
   */
  _connectHttps(uri: URL, message?: Buffer): http.ClientRequest {
    if (!uri.port) {
      uri.port = '443';
    }
    const options = this._createGenericOptions(uri);
    this._addSslOptions(options);
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;

    const request = https.request(options);
    this._setCommonListeners(request);
    if (message) {
      request.write(message);
    }
    this.stats.messageStart = Date.now();
    this.stats.sentTime = this.stats.messageStart + 1;
    request.end();
    // This is a hack to read sent data.
    // In the https://github.com/nodejs/node/blob/0a62026f32d513a8a5d9ed857481df5f5fa18e8b/lib/_http_outgoing.js#L960
    // library it hold the data until it is flushed.
    // @ts-ignore
    const pending = request.outputData;
    if (Array.isArray(pending)) {
      this._sentHttpMessage = pending;
    }
    try {
      this.emit('loadstart');
    } catch (_) {
      //
    }
    return request;
  }

  /**
   * Sets listeners on a socket
   * @param request The request object
   */
  _setCommonListeners(request: http.ClientRequest): void {
    // request.shouldKeepAlive = false;
    request.once('socket', this._socketHandler);
    request.once('error', this._errorHandler);
    request.once('response', this._responseHandler);
    request.once('close', this._closeHandler);
  }

  /**
   * Handler for connection error.
   */
  _errorHandler(e: ResponseErrorInit): void {
    if (this.aborted) {
      return;
    }
    this._errorRequest({
      code: e.code,
      message: e.message,
    });
  }

  /**
   * Handler for DNS lookup.
   */
  _lookupHandler(): void {
    this.stats.lookupTime = Date.now();
  }

  /**
   * Handler for connected event.
   */
  _secureConnectHandler(): void {
    this.stats.secureConnectedTime = Date.now();
  }

  /**
   * Handler for connecting event.
   */
  _connectHandler(): void {
    this.stats.connectedTime = Date.now();
    this.stats.secureStartTime = Date.now();
  }

  /**
   * Handler for sending finished event
   */
  _sendEndHandler(): void {
    if (!this.stats.sentTime) {
      this.stats.sentTime = Date.now();
    }
  }

  /**
   * Handler for timeout event
   */
  _timeoutHandler(): void {
    this._errorRequest({
      code: 7,
    });
    this.abort();
  }

  /**
   * A handler for response data event
   */
  _responseHandler(res: http.IncomingMessage): void {
    this.receivingResponse = true;
    
    this.emit('firstbyte');
    this.stats.firstReceiveTime = Date.now();
    this.stats.responseTime = Date.now();
    if (this._sentHttpMessage) {
      this.sentRequest.httpMessage = this._readSentMessage(this._sentHttpMessage);
    } else {
      this.sentRequest.httpMessage = '';
    }
    const status = res.statusCode;
    if (!status) {
      this._errorRequest({
        message: 'The response has no status.',
      });
      return;
    }
    const headers = this.computeResponseHeaders(res);
    const rawHeaders = headers.toString();
    const response = ArcResponse.fromValues(status, res.statusMessage, rawHeaders);
    this.currentResponse = response;
    this.currentHeaders = headers;
    const detail: HeadersReceivedDetail = {
      returnValue: true,
      value: rawHeaders,
    };
    this.emit('headersreceived', detail);
    if (!detail.returnValue) {
      this.abort();
      return;
    }
    res.on('data', (chunk) => {
      if (!this._rawBody) {
        this._rawBody = chunk;
      } else {
        const endTime = Date.now();
        this.stats.lastReceivedTime = endTime;
        this._rawBody = Buffer.concat([this._rawBody, chunk]);
      }
    });
    res.once('end', () => {
      const endTime = Date.now();
      this.sentRequest.endTime = endTime;
      this.stats.receivingTime = endTime;
      this._reportResponse();
    });
  }

  /**
   * Handler for connection close event
   */
  _closeHandler(): void {
    if (this.responseReported || this.receivingResponse || this.aborted || this.redirecting) {
      return;
    }
    if (!this.currentResponse) {
      const e = new Error('Connection closed unexpectedly.');
      // console.log(e.stack);
      // console.log(this.sentRequest);
      this._errorRequest(e);
    } else {
      // There is an issue with the response. Size mismatch? Anyway,
      // it tries to create a response from current data.
      this.emit('loadend');
      this._publishResponse();
    }
  }
  
  _socketHandler(socket: net.Socket): void {
    this.socket = socket;
    socket.once('lookup', this._lookupHandler);
    socket.once('connect', this._connectHandler);
    socket.once('timeout', this._timeoutHandler);
    socket.once('end', this._sendEndHandler);
    socket.once('secureConnect', this._secureConnectHandler);
    this.stats.connectionTime = Date.now();
  }

  /**
   * Creates and publishes a response.
   */
  _reportResponse(): void {
    const { aborted, currentResponse } = this;
    if (aborted || !currentResponse) {
      return;
    }
    const { status } = currentResponse;
    if (status >= 300 && status < 400) {
      if (this.followRedirects !== false && this._reportRedirect(status)) {
        return;
      }
    }
    if (this.responseReported) {
      return;
    }
    this.responseReported = true;
    this.emit('loadend');
    this._publishResponse();
  }

  /**
   * Transforms a message from the client to a string.
   * It uses `opts.sentMessageLimit` to limit number of data returned
   * by the client.
   */
  _readSentMessage(messages: string|any[]): string {
    let result = '';
    if (typeof messages === 'string') {
      result = messages;
    } else {
      for (let i = 0, len = messages.length; i < len; i++) {
        const chunk = messages[i].data;
        if (!chunk) {
          continue;
        }
        if (typeof chunk === 'string') {
          result += chunk;
        } else if (chunk instanceof Uint8Array) {
          result += chunk.toString();
        }
      }
    }
    const limit = this.opts.sentMessageLimit;
    if (limit && limit > 0 && result.length >= limit) {
      result = result.substr(0, limit);
      result += ' ...';
    }
    return result;
  }

  /**
   * Connects to the remote machine via a proxy.
   */
  async _connectProxy(proxy: string, message?: Buffer): Promise<http.ClientRequest | undefined> {
    const { url } = this.request;
    const isTargetSsl = url.startsWith('https:');
    const isProxySsl = proxy.startsWith('https:');
    const uri = new URL(url);

    if (!isProxySsl && !isTargetSsl) {
      return this._proxyHttpOverHttp(uri, proxy, message);
    }
    if (!isProxySsl && isTargetSsl) {
      return this._proxyHttpsOverHttp(uri, proxy, message);
    }
    if (isProxySsl && !isTargetSsl) {
      return this._proxyHttpOverHttps(uri, proxy, message);
    }
    return this._proxyHttpsOverHttps(uri, proxy, message);
  }

  /**
   * Creates a default options for a request.
   * @param uri Instance of URL class for current URL.
   */
  _createGenericOptions(uri: URL | UrlWithStringQuery): http.RequestOptions {
    const result: http.RequestOptions = {
      protocol: uri.protocol,
      host: uri.hostname,
      // hash: uri.hash,
      method: this.request.method.toUpperCase(),
    };
    result.headers = {};
    if (uri.port) {
      result.port = uri.port;
    }
    result.path = `${uri.pathname}${uri.search}`;
    // Note, the final headers are set on the `sentRequest` object.
    // The `request` object is not changed.
    const headers = new Headers(this.sentRequest.headers);
    for (const [key, value] of headers.entries()) {
      result.headers[key] = value;
    }
    return result;
  }

  /**
   * Adds SSL options to the request.
   */
  _addSslOptions(options: any): void {
    if (this.opts.validateCertificates) {
      options.checkServerIdentity = this._checkServerIdentity.bind(this);
    } else {
      options.rejectUnauthorized = false;
      options.requestOCSP = false;
    }
    const cert = this.opts.clientCertificate;
    if (cert) {
      this._addClientCertificate(cert, options);
    }
    options.agent = new https.Agent(options);
  }

  /**
   * Creates options to be set on the proxy request.
   * It replaces the original `host` and `port` values with the ones defined
   * for the proxy server.
   *
   * @param proxy The proxy URI. (e.g. 10.0.0.12:8118)
   * @param requestUri The original request URI.
   * @param requestOptions The original request options
   */
  _createProxyOptions(proxy: string, requestUri: URL, requestOptions: http.RequestOptions): http.RequestOptions {
    let proxyUrl = proxy;
    const options = requestOptions;
    const isSsl = proxyUrl.startsWith('https:');
    const isHttp = proxyUrl.startsWith('http:');
    if (!isSsl && !isHttp) {
      proxyUrl = `http://${proxyUrl}`;
    }
    const proxyUri = new URL(proxyUrl);
    if (!options.headers) {
      options.headers = {};
    }
    const auth = this._proxyAuthHeader();
    if (auth) {
      if (!options.headers['proxy-authorization']) {
        options.headers['proxy-authorization'] = auth;
      }
    }
    options.headers.host = `${requestUri.hostname}:${requestUri.port || 80}`;
    delete options.headers.Host;
    return {
      ...options,
      protocol: proxyUri.protocol,
      host: proxyUri.hostname,
      hostname: proxyUri.hostname,
      port: proxyUri.port || 80,
      path: requestUri.toString(),
      agent: false,
    };
  }

  /**
   * Creates a connection to non-ssl target via a non-ssl proxy.
   *
   * @param message The message to send
   * @param uri The target URI
   * @param proxy The proxy URI
   */
  _proxyHttpOverHttp(uri: URL, proxy: string, message?: Buffer): http.ClientRequest {
    const targetOptions = this._createGenericOptions(uri);
    const options = this._createProxyOptions(proxy, uri, targetOptions);
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;
    const request = http.request(options);
    this._setCommonListeners(request);
    if (message) {
      request.write(message);
    }
    this.stats.messageStart = Date.now();
    this.stats.sentTime = this.stats.messageStart + 1;
    request.end();
    try {
      this.emit('loadstart');
    } catch (_) {
      //
    }
    return request;
  }

  /**
   * Creates a connection to non-ssl target via an ssl proxy.
   *
   * @param message The message to send
   * @param uri The target URI
   * @param proxy The proxy URI
   */
  async _proxyHttpsOverHttp(uri: URL, proxy: string, message?: Buffer): Promise<http.ClientRequest|undefined> {
    let proxyUrl = proxy;
    if (!proxyUrl.startsWith('http:')) {
      proxyUrl = `http://${proxyUrl}`;
    }
    const proxyUri = new URL(proxyUrl);
    const proxyPort = proxyUri.port || 80;
    const targetPort = uri.port || 443; // target is always SSL so 443.
    const authority = `${uri.hostname}:${targetPort}`;
    const connectOptions: http.RequestOptions = {
      host: proxyUri.hostname,
      port: proxyPort,
      method: 'CONNECT',
      path: authority,
      headers: {
        host: authority,
      },
    };
    const auth = this._proxyAuthHeader();
    if (auth) {
      connectOptions.headers = {
        'proxy-authorization': auth,
      };
    }
    return new Promise((resolve, reject) => {
      const connectRequest = http.request(connectOptions);
      connectRequest.on('connect', (res, socket, head) => {
        if (res.statusCode === 200) {
          const options = this._createGenericOptions(uri);
          this._addSslOptions(options);
          delete options.agent;
          const startTime = Date.now();
          this.stats.startTime = startTime;
          this.sentRequest.startTime = startTime;
          const agent = new https.Agent({
            socket,
          });
          const request = https.request({ ...options, agent });
          this._connectHandler();
          this._setCommonListeners(request);
          if (message) {
            request.write(message);
          }
          request.end();
          this.stats.messageStart = Date.now();
          this.stats.sentTime = this.stats.messageStart + 1;
          resolve(request);
        } else if (res.statusCode === 401) {
          this.currentHeaders = this.computeResponseHeaders(res);
          const response = ArcResponse.fromValues(res.statusCode, res.statusMessage, this.currentHeaders.toString());
          this.currentResponse = response;
          if (head.length) {
            this._rawBody = head;
            this.currentResponse.payload = {
              type: 'buffer',
              data: [...head],
            };
          }
          connectRequest.destroy();
          resolve(undefined);
          setTimeout(() => {
            // const e = new NetError('The proxy requires authentication.', 127);
            this._publishResponse();
          });
        } else {
          connectRequest.destroy();
          const e = new NetError('A tunnel connection through the proxy could not be established.', 111);
          reject(e);
        }
      });
      connectRequest.once('error', (err) => reject(err));
      try {
        this.emit('loadstart');
      } catch (_) {
        //
      }
      connectRequest.end();
    });
  }

  /**
   * Creates a connection to a non-ssl target using SSL proxy.
   * 
   * @param proxy The proxy URI
   */
  _proxyHttpOverHttps(uri: URL, proxy: string, message?: Buffer): http.ClientRequest {
    const targetOptions = this._createGenericOptions(uri);
    const options: https.RequestOptions = this._createProxyOptions(proxy, uri, targetOptions);
    options.rejectUnauthorized = false;
    // @ts-ignore
    options.requestOCSP = false;
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;
    const request = https.request(options);
    this._setCommonListeners(request);
    if (message) {
      request.write(message);
    }
    this.stats.messageStart = Date.now();
    this.stats.sentTime = this.stats.messageStart + 1;
    request.end();
    // @ts-ignore
    const pending = request.outputData;
    if (Array.isArray(pending)) {
      this._sentHttpMessage = pending;
    }
    try {
      this.emit('loadstart');
    } catch (_) {
      //
    }
    return request;
  }

  /**
   * Creates a connection to a non-ssl target using SSL proxy.
   * 
   * @param proxy The proxy URI
   */
  _proxyHttpsOverHttps(uri: URL, proxy: string, message?: Buffer): http.ClientRequest {
    let proxyUrl = proxy;
    if (!proxyUrl.startsWith('https:')) {
      proxyUrl = `https://${proxyUrl}`;
    }
    const proxyUri = new URL(proxyUrl);
    const connectOptions: https.RequestOptions = {
      host: proxyUri.hostname, // IP address of proxy server
      port: proxyUri.port || 443, // port of proxy server
      method: 'CONNECT',
      path: `${uri.hostname}:${uri.port || 443}`,
      headers: {
        host: `${uri.hostname}:${uri.port || 443}`,
      },
      rejectUnauthorized: false,
      // @ts-ignore
      requestOCSP: false,
    };
    const auth = this._proxyAuthHeader();
    if (auth) {
      connectOptions.headers = {
        'proxy-authorization': auth,
      };
    }
    const connectRequest = https.request(connectOptions);
    connectRequest.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        const agent = new https.Agent({ socket });
        const options = this._createGenericOptions(uri);
        this._addSslOptions(options);
        const startTime = Date.now();
        this.stats.startTime = startTime;
        this.sentRequest.startTime = startTime;
        const sslRequest = https.request({ ...options, agent, protocol: 'https:' });
        sslRequest.on('error', () => {
          console.log('sslRequest error');
        });
        this._connectHandler();
        this._setCommonListeners(sslRequest);
        if (message) {
          sslRequest.write(message);
        }
        this.stats.messageStart = Date.now();
        this.stats.sentTime = this.stats.messageStart + 1;
        sslRequest.end();
        // @ts-ignore
        const pending = sslRequest.outputData;
        if (Array.isArray(pending)) {
          this._sentHttpMessage = pending;
        }
      } else {
        this._errorRequest({
          code: 111,
          message: 'A tunnel connection through the proxy could not be established.',
        });
        connectRequest.destroy();
      }
    });
    connectRequest.once('error', this._errorHandler);
    try {
      this.emit('loadstart');
    } catch (_) {
      //
    }
    connectRequest.end();
    return connectRequest;
  }
}
