import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import { HttpEngine, HttpEngineOptions, HeadersReceivedDetail } from './HttpEngine.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { Response } from '../../models/Response.js';
import { SerializableError } from '../../models/SerializableError.js';
import { Headers } from '../../lib/headers/Headers.js';
import { PayloadSupport } from './PayloadSupport.js';
import { addContentLength, getPort } from './RequestUtils.js';
import { INtlmAuthorization } from '../../models/Authorization.js';
import { NtlmAuth, INtlmAuthConfig } from './ntlm/NtlmAuth.js';
import { PayloadSerializer } from '../../lib/transformers/PayloadSerializer.js';
import { ResponseRedirect } from '../../models/ResponseRedirect.js';

const nlBuffer = Buffer.from([13, 10]);
const nlNlBuffer = Buffer.from([13, 10, 13, 10]);

export enum RequestState {
  Status,
  Headers,
  Body,
  Done,
}

interface ResponseInfo {
  contentLength?: number;
  chunked: boolean;
  body?: Buffer;
  chunk?: Buffer;
  chunkSize?: number;
}

/**
 * API Client's HTTP engine.
 * An HTTP 1.1 engine working directly on the socket. It communicates with the remote machine and 
 * collects stats about the request and response.
 */
export class CoreEngine extends HttpEngine {
  state = RequestState.Status;
  rawHeaders?: Buffer;
  _hostTestReg = /^\s*host\s*:/im;

  responseInfo: ResponseInfo;
  hasProxy: boolean;
  isProxyTunnel: boolean;
  isProxySsl: boolean;

  constructor(request: IHttpRequest, opts: HttpEngineOptions = {}) {
    super(request, opts);
    this.responseInfo = {
      chunked: false,
    };
    this.hasProxy = !!this.opts.proxy;
    this.isProxyTunnel = this.hasProxy && this.request.url.startsWith('https:');
    this.isProxySsl = !!this.opts.proxy && this.opts.proxy.startsWith('https:');
  }

  /**
   * Sends the request
   */
  async send(): Promise<IRequestLog> {
    const promise = this.wrapExecution();
    this.sendRequest();
    return promise;
  }

  private async sendRequest(): Promise<void> {
    try {
      if (this.hasProxy) {
        await this.connectProxy();
      } else {
        await this.connect();
      }
      if (!this.socket || this.aborted) {
        return;
      }
      const message = await this.prepareMessage();
      await this.writeMessage(message);
    } catch (cause) {
      const e = cause as any;
      const err = new SerializableError(e.message, { cause: e });
      if (e.code || e.code === 0) {
        err.code = e.code as string;
      }
      this.abort();
      this._errorRequest({
        message: err.message,
        code: err.code,
      });
      throw cause;
    }
  }

  /**
   * Cleans the state after finished.
   */
  _cleanUp(): void {
    super._cleanUp();
    this.state = RequestState.Status;
    this.rawHeaders = undefined;
    this.responseInfo = {
      chunked: false,
    };
  }

  /**
   * Cleans up the state for redirect.
   */
  _cleanUpRedirect(): void {
    super._cleanUpRedirect();
    this.state = RequestState.Status;
    this.rawHeaders = undefined;
    this.responseInfo = {
      chunked: false,
    };
  }

  /**
   * Prepares an HTTP message from API Client's request object.
   *
   * @returns Resolved promise to an `ArrayBuffer`.
   */
  async prepareMessage(): Promise<Buffer> {
    let payload = this.request.payload;
    if (['get', 'head'].includes(this.request.method.toLowerCase())) {
      payload = undefined;
    }
    const headers = new Headers(this.request.headers);
    this.prepareHeaders(headers);
    const auth = this.hasProxy && !this.isProxyTunnel ? this._proxyAuthHeader() : undefined;
    if (auth) {
      headers.set('proxy-authorization', auth);
    }
    const buffer = PayloadSupport.payloadToBuffer(headers, payload);
    if (buffer) {
      addContentLength(this.request.method || 'GET', buffer, headers);
    }

    this._handleAuthorization(headers);
    this.sentRequest.headers = headers.toString();
    const message = this._prepareMessage(headers, buffer);
    if (this.auth) {
      // This restores altered by authorization original headers
      // so it can be safe to use when redirecting
      if (this.auth.headers) {
        this.request.headers = this.auth.headers;
        delete this.auth.headers;
      }
    }
    return message;
  }

  /**
   * Sends a data to a socket.
   *
   * @param buffer HTTP message to send
   */
  writeMessage(buffer: Buffer): Promise<void> {
    this.logger.debug(`Writing the message to the socket...`);
    let msg = buffer.toString();
    const limit = this.opts.sentMessageLimit;
    if (limit && limit > 0 && msg.length >= limit) {
      msg = msg.substr(0, limit);
      msg += ' ...';
    }
    this.sentRequest.httpMessage = msg;
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;

    this.stats.messageStart = Date.now();
    return new Promise((resolve) => {
      this.socket?.write(buffer, () => {
        this.logger.debug(`The message has been sent.`);
        this.stats.sentTime = Date.now();
        try {
          this.emit('loadstart');
        } catch (_) {
          //
        }
        resolve();
      });
    });
  }

  /**
   * Connects to a server and sends the message.
   *
   * @returns Promise resolved when socket is connected.
   */
  async connect(): Promise<net.Socket> {
    const port = getPort(this.uri.port, this.uri.protocol);
    const host = this.uri.hostname;
    let socket;
    if (port === 443 || this.uri.protocol === 'https:') {
      socket = await this._connectTls(port, host);
    } else {
      socket = await this._connect(port, host);
    }
    const { timeout } = this;
    if (timeout > 0) {
      socket.setTimeout(timeout);
    }
    this.socket = socket;
    this._addSocketListeners(socket);
    socket.resume();
    return socket;
  }

  /**
   * Connects to a server and writes a message using insecure connection.
   *
   * @param port A port number to connect to.
   * @param host A host name to connect to
   * @returns A promise resolved when the message was sent to a server
   */
  _connect(port: number, host: string): Promise<net.Socket> {
    this.logger.debug('Opening an HTTP connection...');
    return new Promise((resolve, reject) => {
      this.stats.connectionTime = Date.now();
      const isIp = net.isIP(host);
      if (isIp) {
        this.stats.lookupTime = Date.now();
      }
      const client = net.createConnection(port, host, () => {
        this.logger.debug('HTTP connection established.');
        this.stats.connectedTime = Date.now();
        resolve(client);
      });
      client.pause();
      if (!isIp) {
        client.once('lookup', () => {
          this.stats.lookupTime = Date.now();
        });
      }
      client.once('error', (err) => reject(err));
    });
  }

  /**
   * Connects to a server and writes a message using secured connection.
   *
   * @param port A port number to connect to.
   * @param host A host name to connect to
   * @returns A promise resolved when the message was sent to a server
   */
  _connectTls(port: number, host: string): Promise<tls.TLSSocket> {
    this.logger.debug('Opening an SSL connection...');
    const { opts } = this;
    const options: tls.ConnectionOptions = {};
    const isIp = net.isIP(host);
    if (!isIp) {
      options.servername = host;
    }
    if (opts.validateCertificates) {
      options.checkServerIdentity = this._checkServerIdentity.bind(this);
    } else {
      options.rejectUnauthorized = false;
      // target.requestOCSP = false;
    }
    const certs = this.opts.certificates;
    if (Array.isArray(certs)) {
      certs.forEach(cert => this._addClientCertificate(cert, options));
    }
    return new Promise((resolve, reject) => {
      const time = Date.now();
      this.stats.connectionTime = time;
      if (isIp) {
        this.stats.lookupTime = time;
      }
      const client = tls.connect(port, host, options, () => {
        this.logger.debug('SSL connection established.');
        const connectTime = Date.now();
        this.stats.connectedTime = connectTime;
        this.stats.secureStartTime = connectTime;
        resolve(client);
      });
      client.pause();
      client.once('error', (e) => reject(e));
      if (!isIp) {
        client.once('lookup', () => {
          this.stats.lookupTime = Date.now();
        });
      }
      client.once('secureConnect', () => {
        this.stats.secureConnectedTime = Date.now();
      });
    });
  }

  /**
   * Prepares a full HTTP message body
   *
   * @param httpHeaders The list ogf headers to append.
   * @param buffer The buffer with the HTTP message
   * @returns The Buffer of the HTTP message
   */
  _prepareMessage(httpHeaders: Headers, buffer?: Buffer): Buffer {
    this.logger.debug('Preparing an HTTP message...');
    const headers = [];
    // const search = this.uri.search;
    // let path = this.uri.pathname;
    // if (search) {
    //   path += search;
    // }
    // headers.push(`${this.arcRequest.method} ${path} HTTP/1.1`);
    const status = this._createHttpStatus();
    this.logger.debug(`Created message status: ${status}`);
    headers.push(status);
    if (this._hostRequired()) {
      this.logger.debug(`Adding the "host" header: ${this.hostHeader}`);
      headers.push(`Host: ${this.hostHeader}`);
    }
    let str = headers.join('\r\n');
    const addHeaders = httpHeaders.toString();
    if (addHeaders) {
      this.logger.debug(`Adding headers to the request...`);
      str += '\r\n';
      str += PayloadSupport.normalizeString(addHeaders);
    }
    const startBuffer = Buffer.from(str, 'utf8');
    const endBuffer = Buffer.from(new Uint8Array([13, 10, 13, 10]));
    let body;
    let sum = startBuffer.length + endBuffer.length;
    if (buffer) {
      sum += buffer.length;
      body = Buffer.concat([startBuffer, endBuffer, buffer], sum);
    } else {
      body = Buffer.concat([startBuffer, endBuffer], sum);
    }
    this.logger.debug(`The message is ready.`);
    return body;
  }

  /**
   * Creates an HTTP status line for the message.
   * For proxy connections it, depending whether target is SSL or not, sets the path
   * as the full URL or just the authority.
   * @returns The generates status message.
   */
  _createHttpStatus(): string {
    const { request, uri, hasProxy, isProxyTunnel } = this;
    const parts = [request.method];
    if (hasProxy && !isProxyTunnel) {
      // if (isProxyTunnel) {
      //   // when a tunnel then the target is over SSL so the default port is 443.
      //   parts.push(`${uri.hostname}:${uri.port || 443}`);
      // } else {
      //   parts.push(arcRequest.url);
      // }
      parts.push(request.url);
    } else {
      let path = uri.pathname;
      if (uri.search) {
        path += uri.search;
      }
      parts.push(path);
    }

    parts.push('HTTP/1.1');
    return parts.join(' ');
  }

  /**
   * Tests if current connection is required to add `host` header.
   * It returns `false` only if `host` header has been already provided.
   *
   * @returns True when the `host` header should be added to the headers list.
   */
  _hostRequired(): boolean {
    const headers = this.request.headers;
    if (typeof headers !== 'string') {
      return true;
    }
    return !this._hostTestReg.test(headers);
  }

  /**
   * Alters authorization header depending on the `auth` object
   * @param headers A headers object where to append headers when needed
   */
  _handleAuthorization(headers: Headers): void {
    const { authorization } = this.opts;
    const enabled = Array.isArray(authorization) ? authorization.filter((i) => i.enabled) : [];
    if (!enabled.length) {
      return;
    }
    const ntlm = enabled.find((i) => i.type === 'ntlm');
    if (ntlm) {
      this._authorizeNtlm(ntlm.config as INtlmAuthorization, headers);
    }
  }

  /**
   * Authorize the request with NTLM
   * @param authData Credentials to use
   * @param headers A headers object where to append headers if needed
   */
  _authorizeNtlm(authData: INtlmAuthorization, headers: Headers): void {
    const init = { ...authData, url: this.request.url } as INtlmAuthConfig;
    const auth = new NtlmAuth(init);
    if (!this.auth) {
      this.auth = {
        method: 'ntlm',
        state: 0,
        headers: headers.toString(),
      };
      const msg = auth.createMessage1(this.uri.host);
      headers.set('Authorization', `NTLM ${msg.toBase64()}`);
      headers.set('Connection', 'keep-alive');
    } else if (this.auth && this.auth.state === 1) {
      const msg = auth.createMessage3(this.auth.challengeHeader!, this.uri.host);
      this.auth.state = 2;
      headers.set('Authorization', `NTLM ${msg.toBase64()}`);
    }
  }

  /**
   * Add event listeners to existing socket.
   * @param socket An instance of the socket.
   * @return The same socket. Used for chaining.
   */
  _addSocketListeners(socket: net.Socket): net.Socket {
    let received = false;
    socket.on('data', (data) => {
      this.logger.debug(`Received server data from the socket...`);
      if (!received) {
        const now = Date.now();
        this.stats.firstReceiveTime = now;
        this.emit('firstbyte');
        received = true;
      }
      data = Buffer.from(data);
      try {
        this._processSocketMessage(data);
      } catch (e) {
        const err = e as Error;
        this._errorRequest({
          message: err.message || 'Unknown error occurred',
        });
        return;
      }
    });
    socket.once('timeout', () => {
      this.state = RequestState.Done;
      this._errorRequest(new Error('Connection timeout.'));
      socket.destroy();
    });
    socket.on('end', () => {
      this.logger.debug(`Server connection ended.`);
      socket.removeAllListeners('timeout');
      socket.removeAllListeners('error');
      const endTime = Date.now();
      this.stats.lastReceivedTime = endTime;
      this.sentRequest.endTime = endTime;
      if (this.state !== RequestState.Done) {
        if (!this.currentResponse) {
          this.logger.error(`Connection closed without receiving any data.`);
          // The parser haven't found the end of message so there was no message!
          const e = new SerializableError('Connection closed without receiving any data', 100);
          this._errorRequest(e);
        } else {
          // There is an issue with the response. Size mismatch? Anyway,
          // it tries to create a response from current data.
          this.emit('loadend');
          this._publishResponse();
        }
      }
    });
    socket.once('error', (err) => {
      socket.removeAllListeners('timeout');
      this._errorRequest(err);
    });
    return socket;
  }

  /**
   * Processes response message chunk
   * @param buffer Message buffer
   */
  _processResponse(buffer: Buffer): void {
    this._processSocketMessage(buffer);
    this._reportResponse();
  }

  /**
   * Reports response after processing it.
   */
  _reportResponse(): void {
    this._clearSocketEventListeners();
    const { aborted, currentResponse } = this;
    if (aborted || !currentResponse) {
      return;
    }
    const { status } = currentResponse;

    const endTime = Date.now();
    this.stats.lastReceivedTime = endTime;
    this.sentRequest.endTime = endTime;
    
    if (status >= 300 && status < 400) {
      if (this.followRedirects && this._reportRedirect(status)) {
        this.closeClient();
        return;
      }
    } else if (status === 401 && this.auth) {
      switch (this.auth.method) {
        case 'ntlm': this.handleNtlmResponse(); return;
      }
    }
    this.closeClient();
    this.emit('loadend');
    this._publishResponse();
  }

  /**
   * Generate response object and publish it to the listeners.
   */
  _publishResponse(): Promise<void> {
    this.state = RequestState.Done;
    if (!this._rawBody) {
      if (this.responseInfo.body) {
        this._rawBody = this.responseInfo.body;
      } else if (this.responseInfo.chunk) {
        this._rawBody = this.responseInfo.chunk;
      }
    }
    return super._publishResponse();
  }

  /**
   * @param location The redirect location.
   * @return Redirect response object
   */
  async _createRedirectResponse(location: string): Promise<ResponseRedirect> {
    const { currentResponse = new Response() } = this;
    this.currentResponse = currentResponse;
    if (!this.currentResponse.payload) {
      if (this._rawBody) {
        this.currentResponse.payload = PayloadSerializer.stringifyBuffer(this._rawBody);
      } else if (this.responseInfo.body) {
        this.currentResponse.payload = PayloadSerializer.stringifyBuffer(this.responseInfo.body);
      } else if (this.responseInfo.chunk) {
        this.currentResponse.payload = PayloadSerializer.stringifyBuffer(this.responseInfo.chunk);
      }
    }
    return super._createRedirectResponse(location);
  }

  /**
   * closes the connection, if any
   */
  closeClient(): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
    }
  }

  /**
   * Handles the response with NTLM authorization
   */
  handleNtlmResponse(): void {
    const { auth } = this;
    if (!auth) {
      throw new Error('No auth data.')
    }
    if (auth.state === 0) {
      if (this.currentHeaders.has('www-authenticate')) {
        auth.state = 1;
        auth.challengeHeader = this.currentHeaders.get('www-authenticate');
        this._cleanUpRedirect();
        this.prepareMessage().then((message) => this.writeMessage(message));
        return;
      }
    }
    delete this.auth;
    this.emit('loadend');
    this._publishResponse();
  }

  /**
   * Process received message.
   *
   * @param data Received message.
   */
  _processSocketMessage(data: Buffer): void {
    if (this.aborted) {
      return;
    }
    if (this.state === RequestState.Done) {
      return;
    }
    let remaining: Buffer | undefined = data;
    if (this.state === RequestState.Status) {
      remaining = this._processStatus(remaining);
      if (!remaining) {
        return;
      }
    }
    if (this.state === RequestState.Headers) {
      remaining = this._processHeaders(remaining);
      if (!remaining) {
        return;
      }
    }
    if (this.state === RequestState.Body) {
      this._processBody(remaining);
      return;
    }
  }

  /**
   * Read status line from the response.
   * This function will set `status` and `statusText` fields
   * and then will set `state` to HEADERS.
   *
   * @param data The received data
   */
  _processStatus(data?: Buffer): Buffer | undefined {
    if (this.aborted) {
      return;
    }
    const response = Response.fromValues(0);
    response.loadingTime = 0;
    this.currentResponse = response;
    if (!data) {
      return;
    }

    this.logger.info('Processing status');
    const index = data.indexOf(nlBuffer);
    let statusLine = data.slice(0, index).toString();
    data = data.slice(index + 2);
    statusLine = statusLine.replace(/HTTP\/\d(\.\d)?\s/, '');
    const delimiterPos = statusLine.indexOf(' ');
    let status;
    let msg = '';
    if (delimiterPos === -1) {
      status = statusLine;
    } else {
      status = statusLine.substr(0, delimiterPos);
      msg = statusLine.substr(delimiterPos + 1);
    }
    let typedStatus = Number(status);
    if (Number.isNaN(typedStatus)) {
      typedStatus = 0;
    }
    if (msg && msg.indexOf('\n') !== -1) {
      msg = msg.split('\n')[0];
    }
    this.currentResponse!.status = typedStatus;
    this.currentResponse!.statusText = msg;
    this.logger.info('Received status', typedStatus, msg);
    this.state = RequestState.Headers;
    return data;
  }

  /**
   * Read headers from the received data.
   *
   * @param data Received data
   * @returns Remaining data in the buffer.
   */
  _processHeaders(data?: Buffer): Buffer | undefined {
    if (this.aborted) {
      return;
    }
    if (!data) {
      this._parseHeaders();
      return;
    }
    this.logger.info('Processing headers');
    // Looking for end of headers section
    let index = data.indexOf(nlNlBuffer);
    let padding = 4;
    if (index === -1) {
      // It can also be 2x ASCII 10
      const _index = data.indexOf(Buffer.from([10, 10]));
      if (_index !== -1) {
        index = _index;
        padding = 2;
      }
    }

    // https://github.com/jarrodek/socket-fetch/issues/3
    const enterIndex = data.indexOf(nlBuffer);
    if (index === -1 && enterIndex !== 0) {
      // end in next chunk
      if (!this.rawHeaders) {
        this.rawHeaders = data;
      } else {
        const sum = this.rawHeaders.length + data.length;
        this.rawHeaders = Buffer.concat([this.rawHeaders, data], sum);
      }
      return;
    }
    if (enterIndex !== 0) {
      const headersArray = data.slice(0, index);
      if (!this.rawHeaders) {
        this.rawHeaders = headersArray;
      } else {
        const sum = this.rawHeaders.length + headersArray.length;
        this.rawHeaders = Buffer.concat([this.rawHeaders, headersArray], sum);
      }
    }
    this._parseHeaders(this.rawHeaders);
    delete this.rawHeaders;
    this.state = RequestState.Body;
    const start = index === -1 ? 0 : index;
    const move = enterIndex === 0 ? 2 : padding;
    data = data.slice(start + move);
    return this._postHeaders(data);
  }

  /**
   * Check the response headers and end the request if necessary.
   * @param data Current response data buffer
   */
  _postHeaders(data: Buffer): Buffer|undefined {
    if (this.request.method === 'HEAD') {
      this._reportResponse();
      return;
    }
    if (data.length === 0) {
      if (this.currentResponse?.status === 204) {
        this._reportResponse();
        return;
      }
      if (this.currentHeaders.has('Content-Length')) {
        // If the server do not close the connection and clearly indicate that
        // there are no further data to receive the app can close the connection
        // and prepare the response.
        const length = Number(this.currentHeaders.get('Content-Length'));
        if (!Number.isNaN(length) && length === 0) {
          this._reportResponse();
          return;
        }
      }
      // See: https://github.com/advanced-rest-client/arc-electron/issues/106
      // The client should wait until the connection is closed instead of assuming it should end the request.

      //  else if (!this.currentHeaders.has('Transfer-Encoding') || !this.currentHeaders.get('Transfer-Encoding')) {
      //   // Fix for https://github.com/jarrodek/socket-fetch/issues/6
      //   // There is no body in the response.
      //   // this._reportResponse();
      //   return;
      // }
      return;
    }
    return data;
  }

  /**
   * This function assumes that all headers has been read and it's
   * just before changing the status to BODY.
   */
  _parseHeaders(buffer?: Buffer): void {
    let raw = '';
    if (buffer) {
      raw = buffer.toString();
    }
    this.currentResponse!.headers = raw;
    this.logger.info('Received headers list', raw);
    const headers = new Headers(raw);
    this.currentHeaders = headers;
    if (headers.has('Content-Length')) {
      this.responseInfo.contentLength = Number(headers.get('Content-Length'));
    }
    if (headers.has('Transfer-Encoding')) {
      const tr = headers.get('Transfer-Encoding');
      if (tr === 'chunked') {
        this.responseInfo.chunked = true;
      }
    }
    const rawHeaders = headers.toString();
    const detail: HeadersReceivedDetail = {
      returnValue: true,
      value: rawHeaders,
    };
    this.emit('headersreceived', detail);
    if (!detail.returnValue) {
      this.abort();
    }
  }

  /**
   * @param data A data to process
   */
  _processBody(data?: Buffer): void {
    if (this.aborted || !data) {
      return;
    }
    if (this.responseInfo.chunked) {
      this._processBodyChunked(data);
    } else {
      this._processBodyContentLength(data);
    }
  }

  _processBodyContentLength(data: Buffer): void {
    if (typeof this.responseInfo.contentLength === 'undefined') {
      this._errorRequest(new Error(`The content-length header of the response is missing.`));
      return;
    }
    if (!this.responseInfo.body) {
      this.responseInfo.body = data;
      if (data.length >= this.responseInfo.contentLength) {
        this._reportResponse();
        return;
      }
      return;
    }
    const sum = this.responseInfo.body.length + data.length;
    this.responseInfo.body = Buffer.concat([this.responseInfo.body, data], sum);
    if (this.responseInfo.body.length >= this.responseInfo.contentLength) {
      this._reportResponse();
      return;
    }
  }

  /**
   * @param data A latest data to process
   */
  _processBodyChunked(data?: Buffer): void {
    if (!data) {
      return;
    }
    if (this.responseInfo.chunk) {
      data = Buffer.concat([this.responseInfo.chunk, data], this.responseInfo.chunk.length + data.length);
      this.responseInfo.chunk = undefined;
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.responseInfo.chunkSize === 0 && data.indexOf(nlNlBuffer) === 0) {
        this._reportResponse();
        return;
      }
      if (!this.responseInfo.chunkSize) {
        data = this.readChunkSize(data);
        if (!data) {
          return;
        }
        if (!this.responseInfo.chunkSize && this.responseInfo.chunkSize !== 0) {
          // It may happen that node's buffer cuts the data
          // just before the chunk size.
          // It should proceed it in next portion of the data.
          this.responseInfo.chunk = data;
          return;
        }
        if (!this.responseInfo.chunkSize) {
          this._reportResponse();
          return;
        }
      }
      const size = Math.min(this.responseInfo.chunkSize, data.length);
      const sliced = data.slice(0, size);
      if (!this._rawBody) {
        this._rawBody = sliced;
      } else {
        const sum = size + this._rawBody.length;
        this._rawBody = Buffer.concat([this._rawBody, sliced], sum);
      }

      this.responseInfo.chunkSize -= size;
      if (data.length === 0) {
        // this.logger.warn('Next chunk will start with CRLF!');
        return;
      }
      data = data.slice(size + 2); // + CR
      if (data.length === 0) {
        // this.logger.info('No more data here. Waiting for new chunk');
        return;
      }
    }
  }

  /**
   * If response's Transfer-Encoding is 'chunked' read until next CR.
   * Everything before it is a chunk size.
   */
  readChunkSize(array: Buffer): Buffer|undefined {
    if (this.aborted) {
      return;
    }
    let index = array.indexOf(nlBuffer);
    if (index === -1) {
      // not found in this portion of data.
      return array;
    }
    if (index === 0) {
      // Node's buffer cuts CRLF after the end of chunk data, without last CLCR,
      // here's to fix it.
      // It can be either new line from the last chunk or end of
      // the message where
      // the rest of the array is [13, 10, 48, 13, 10, 13, 10]
      if (array.indexOf(nlNlBuffer) === 0) {
        this.responseInfo.chunkSize = 0;
        return Buffer.alloc(0);
      }
      array = array.slice(index + 2);
      index = array.indexOf(nlBuffer);
    }
    // this.logger.info('Size index: ', index);
    const chunkSize = parseInt(array.slice(0, index).toString(), 16);
    if (Number.isNaN(chunkSize)) {
      this.responseInfo.chunkSize = undefined;
      return array.slice(index + 2);
    }
    this.responseInfo.chunkSize = chunkSize;
    return array.slice(index + 2);
  }

  /**
   * Connects to a server through a proxy. Depending on the proxy type the returned socket
   * is a socket created after creating a tunnel (SSL) or the proxy socket.
   *
   * @returns Promise resolved when socket is connected.
   */
  async connectProxy(): Promise<net.Socket|undefined> {
    let socket;
    if (this.isProxyTunnel) {
      socket = await this.connectTunnel(this.isProxySsl);
    } else {
      socket = await this.proxyHttp(this.isProxySsl);
    }
    if (!socket) {
      return;
    }
    const { timeout } = this;
    if (timeout > 0) {
      socket.setTimeout(timeout);
    }
    this.socket = socket;
    this._addSocketListeners(socket);
    socket.resume();
    return socket;
  }

  /**
   * Creates a tunnel to a Proxy for SSL connections.
   * The returned socket is the one created after the tunnel is established.
   * @param proxyIsSsl Whether the proxy is an SSL connection.
   * @returns Promise resolved when socket is connected.
   */
  async connectTunnel(proxyIsSsl=false): Promise<net.Socket | undefined> {
    this.logger.debug(`Creating a tunnel through the proxy...`);
    const { proxy } = this.opts;
    const { url } = this.request;
    if (!proxy) {
      throw new Error(`No proxy configuration found.`);
    }
    let proxyUrl = proxy;
    if (proxyIsSsl && !proxyUrl.startsWith('https:')) {
      proxyUrl = `https://${proxyUrl}`;
    } else if (!proxyIsSsl && !proxyUrl.startsWith('http:')) {
      proxyUrl = `http://${proxyUrl}`;
    }
    const proxyUri = new URL(proxyUrl);
    const targetUrl = new URL(url);
    const proxyPort = proxyUri.port || (proxyIsSsl ? 443 : 80);
    const targetPort = targetUrl.port || 443; // target is always SSL so 443.
    const authority = `${targetUrl.hostname}:${targetPort}`;
    const connectOptions: https.RequestOptions = {
      host: proxyUri.hostname,
      port: proxyPort,
      method: 'CONNECT',
      path: authority,
      headers: {
        host: authority,
      },
    };
    if (proxyIsSsl) {
      connectOptions.rejectUnauthorized = false;
      // @ts-ignore
      connectOptions.requestOCSP = false;
    }
    const auth = this._proxyAuthHeader();
    if (auth) {
      this.logger.debug(`Adding proxy authorization.`);
      connectOptions.headers!['proxy-authorization'] = auth;
    }
    const lib = proxyIsSsl ? https : http;
    return new Promise((resolve, reject) => {
      this.stats.connectionTime = Date.now();
      const connectRequest = lib.request(connectOptions);
      connectRequest.once('socket', (socket) => {
        socket.on('lookup', () => {
          this.stats.lookupTime = Date.now();
        });
      });
      connectRequest.on('connect', async (res, socket, head) => {
        const time = Date.now();
        this.stats.connectedTime = time;
        this.stats.secureStartTime = time;
        if (typeof this.stats.lookupTime === 'undefined') {
          this.stats.lookupTime = time;
        }
        if (res.statusCode === 401) {
          this.currentHeaders = new Headers(res.headers);
          const currentResponse = Response.fromValues(res.statusCode, res.statusMessage, this.currentHeaders.toString());
          currentResponse.loadingTime = 0;
          this.currentResponse = currentResponse;
          if (head.length) {
            this._rawBody = head;
            currentResponse.payload = PayloadSerializer.stringifyBuffer(head);
          }
          connectRequest.destroy();
          resolve(undefined);
          setTimeout(() => {
            // const e = new NetError('The proxy requires authentication.', 127);
            this._publishResponse();
          });
        } else if (res.statusCode !== 200) {
          this.logger.debug(`The proxy tunnel ended with ${res.statusCode} status code. Erroring request.`);
          connectRequest.destroy();
          const e = new SerializableError('A tunnel connection through the proxy could not be established', 111);
          reject(e);
        } else {
          this.logger.debug(`Established a proxy tunnel.`);
          this.logger.debug(`Upgrading connection to SSL...`);
          const tlsSocket = tls.connect({ socket, rejectUnauthorized: false }, () => {
            this.logger.debug(`Connection upgraded to SSL.`);
            resolve(tlsSocket);
          });
          tlsSocket.once('secureConnect', () => {
            this.stats.secureConnectedTime = Date.now();
          })
        }
      });
      connectRequest.end();
    });
  }

  /**
   * Creates connection to a proxy for an HTTP (non-SSL) transport.
   * This is the same as calling _connect or _connectTls but the target is the proxy and not the
   * target URL. The message sent to the proxy server is different than the one sent
   * to the target.
   * @param proxyIsSsl
   * @returns Promise resolved when socket is connected.
   */
  async proxyHttp(proxyIsSsl=false): Promise<net.Socket> {
    this.logger.debug('Proxying an HTTP request...');
    const { proxy } = this.opts;
    if (!proxy) {
      throw new Error(`No proxy configuration found.`);
    }
    let proxyUrl = proxy;
    if (proxyIsSsl && !proxyUrl.startsWith('https:')) {
      proxyUrl = `https://${proxyUrl}`;
    } else if (!proxyIsSsl && !proxyUrl.startsWith('http:')) {
      proxyUrl = `http://${proxyUrl}`;
    }
    const proxyUri = new URL(proxyUrl);
    const port = Number(proxyUri.port || 443);
    const host = proxyUri.hostname;
    let socket;
    if (proxyIsSsl) {
      socket = await this._connectTls(port, host);
    } else {
      socket = await this._connect(port, host);
    }
    return socket;
  }
}
