/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { URL, UrlWithStringQuery } from 'url';
import http from 'http';
import https from 'https';
import net from 'net';
import { HttpEngine, HttpEngineOptions, ResponseErrorInit, HeadersReceivedDetail } from './HttpEngine.js';
import { IRequestLog } from 'src/models/RequestLog.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { ArcResponse } from '../../models/ArcResponse.js';
import { Headers } from '../../lib/headers/Headers.js';
import { SerializableError } from '../../models/SerializableError.js';
import { PayloadSupport } from './PayloadSupport.js';
import { addContentLength, getPort } from './RequestUtils.js';

interface IHttpOutputData {
  data: string | Buffer;
  encoding?: string;
  callback?: Function;
}

/**
 * A class that makes HTTP requests using Node's HTTP libraries without a proxy.
 */
export class NodeEngineDirect extends HttpEngine {
  responseReported = false;

  _sentHttpMessage?: string | IHttpOutputData[];

  client?: http.ClientRequest;
  receivingResponse = false;
  
  /**
   * The agent used to manage the connection.
   * Note, the agent may change, especially when redirecting between protocols.
   */
  agent: http.Agent | https.Agent;

  /**
   * Prepared to be send payload part of the HTTP message.
   */
  httpMessage?: Buffer;

  constructor(request: IHttpRequest, opts: HttpEngineOptions = {}) {
    super(request, opts);

    const port = getPort(this.uri.port, this.uri.protocol);
    if (port === 443 || this.uri.protocol === 'https:') {
      this.agent = this.httpsAgent(this.uri);
    } else {
      this.agent = this.httpAgent(this.uri);
    }

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
      const headers = new Headers(this.request.headers);
      this.prepareHeaders(headers);
      const message = await this._prepareMessage(headers);
      if (message) {
        this.httpMessage = message;
      }
      this.sentRequest.headers = headers.toString();
      const request = this._connect(message);
      this.client = request;
      const { timeout } = this;
      if (timeout > 0) {
        request.setTimeout(timeout);
      }
    } catch (cause) {
      console.warn(cause);
      const e = cause as any;
      const err = new SerializableError(e.message, { cause: e });
      if (e.code || e.code === 0) {
        err.code = e.code as string;
      }
      this.finalizeRequest(e);
    }
  }


  /**
   * Prepares the request body (the payload) and the headers.
   *
   * @return Resolved promise to a `Buffer`. Undefined when no message.
   */
  async _prepareMessage(headers: Headers): Promise<Buffer|undefined> {
    const { method='GET' } = this.request;
    let { payload } = this.request;
    if (['get', 'head'].includes(method.toLowerCase())) {
      payload = undefined;
    }
    let buffer: Buffer | undefined;
    if (payload) {
      buffer = await PayloadSupport.payloadToBuffer(payload, headers);
      if (buffer) {
        addContentLength(this.request.method || 'GET', buffer, headers);
      }
    }
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
    const options: http.RequestOptions = {
      agent: this.agent,
      protocol: uri.protocol,
      host: uri.hostname,
      method: this.request.method.toUpperCase(),
      path: `${uri.pathname}${uri.search}`,
      headers: {},
    };
    if (uri.port) {
      options.port = uri.port;
    }
    this.appendHeaders(options);
    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;

    const request = http.request(options);
    this._setListeners(request);
    if (message) {
      request.write(message);
    }
    this.stats.messageStart = Date.now();
    request.end();
    // This is a hack to read sent data.
    // In the https://github.com/nodejs/node/blob/0a62026f32d513a8a5d9ed857481df5f5fa18e8b/lib/_http_outgoing.js#L960
    // library it hold the data until it is flushed.
    // @ts-ignore
    const pending = request.outputData as IHttpOutputData[];
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
    // const options = this._createGenericOptions(uri);
    // this._addSslOptions(options);

    const options: https.RequestOptions = {
      agent: this.agent,
      protocol: uri.protocol,
      host: uri.hostname,
      method: this.request.method.toUpperCase(),
      path: `${uri.pathname}${uri.search}`,
      headers: {},
    };
    if (uri.port) {
      options.port = uri.port;
    }
    this.appendHeaders(options);

    const startTime = Date.now();
    this.stats.startTime = startTime;
    this.sentRequest.startTime = startTime;

    const request = https.request(options);
    this._setListeners(request);
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
    const pending = request.outputData as IHttpOutputData[];
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
  _setListeners(request: http.ClientRequest): void {
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
  _readSentMessage(messages: string|IHttpOutputData[]): string {
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

  httpAgent(uri: URL | UrlWithStringQuery): http.Agent {
    const init: http.AgentOptions = {
      // keepAlive: true,
      host: uri.hostname || undefined,
    };
    if (uri.port) {
      init.port = Number(uri.port);
    }
    const agent = new http.Agent(init);
    return agent;
  }

  httpsAgent(uri: URL | UrlWithStringQuery): https.Agent {
    const init: https.AgentOptions = {
      // keepAlive: true,
      host: uri.hostname || undefined,
      path: `${uri.pathname}${uri.search}`,
    };
    if (uri.port) {
      init.port = Number(uri.port);
    }
    if (this.opts.validateCertificates) {
      init.checkServerIdentity = this._checkServerIdentity.bind(this);
    } else {
      init.rejectUnauthorized = false;
      // init.requestOCSP = false;
    }
    const certs = this.opts.certificates;
    if (Array.isArray(certs)) {
      certs.forEach(cert => this._addClientCertificate(cert, init));
    }
    const agent = new https.Agent(init);
    return agent;
  }

  /**
   * Appends the list of headers on the request options.
   * 
   * @param options The request options to alter.
   */
  appendHeaders(options: http.RequestOptions | https.RequestOptions): void {
    // Note, the final headers are set on the `sentRequest` object.
    // The `request` object is not changed.
    const headers = new Headers(this.sentRequest.headers);
    if (!headers.has('host') && this.hostHeader) {
      headers.set('host', this.hostHeader);
    }
    if (!options.headers) {
      options.headers = {};
    }
    for (const [key, value] of headers.entries()) {
      options.headers[key] = value;
    }
  }
}
