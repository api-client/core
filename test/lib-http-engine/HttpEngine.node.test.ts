/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import fs from 'fs';
import sinon from 'sinon';
import zlib from 'zlib';
import getConfig from '../helpers/getSetup.js';
import net from 'net';
import { 
  CoreEngine, 
  IResponse, 
  Response, 
  HttpEngineOptions, 
  IHttpRequest, 
  HttpCertificate, 
  DummyLogger,
  ISentRequest,
  ResponseRedirect,
  Headers,
  INtlmAuthorization,
  PayloadSerializer,
  HeadersReceivedDetail,
  IRequestsSize,
  IRequestTime,
  RequestState,
  IErrorResponse,
  IHostRule,
  ErrorResponse,
  HostRuleKind,
  RequestAuthorizationKind,
  SerializableError,
} from '../../index.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('CoreEngine', () => {
    let httpPort: number;
    let certPort: number;
    let chunkedHttpPort: number;
    let chunkedHttpsPort: number;

    before(async () => {
      const cnf = await getConfig();
      httpPort = cnf.httpPort;
      certPort = cnf.certificatesPort;
      chunkedHttpPort = cnf.chunkedHttpPort;
      chunkedHttpsPort = cnf.chunkedHttpsPort;
    });

    describe('Unit tests', () => {
      describe('_connect()', () => {
        let engine: CoreEngine;
        let request: IHttpRequest;
        const host = 'localhost';
        const opts: HttpEngineOptions = {
          timeout: 50000,
          followRedirects: false,
          hosts: [{
            kind: HostRuleKind,
            from: 'domain.com',
            to: 'test.com',
          }],
          logger,
        };
    
        before(() => {
          request = {
            url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          engine = new CoreEngine(request, opts);
        });
    
        it('returns HTTP server client', async () => {
          const client = await engine._connect(httpPort, host);
          assert.typeOf(client, 'object');
          client.destroy();
        });
    
        it('Sets stats property', async () => {
          const client = await engine._connect(httpPort, host);
          client.destroy();
          assert.typeOf(engine.stats.connectionTime, 'number', 'connectionTime stat is set');
          assert.typeOf(engine.stats.lookupTime, 'number', 'lookupTime stat is set');
        });
      });

      describe('_connectTls()', () => {
        let engine: CoreEngine;
        let request: IHttpRequest;
        const host = 'localhost';
        const opts: HttpEngineOptions = {
          timeout: 50000,
          followRedirects: false,
          hosts: [{
            kind: HostRuleKind,
            from: 'domain.com',
            to: 'test.com',
          }],
          logger,
        };
    
        before(() => {
          request = {
            url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          engine = new CoreEngine(request, opts);
        });
    
        it('returns HTTP server client', async () => {
          const client = await engine._connectTls(chunkedHttpsPort, host);
          assert.typeOf(client, 'object');
          client.destroy();
        });
    
        it('sets stats property', async () => {
          const client = await engine._connectTls(chunkedHttpsPort, host);
          client.destroy();
          assert.typeOf(engine.stats.connectionTime, 'number', 'connectionTime stat is set');
          assert.typeOf(engine.stats.lookupTime, 'number', 'lookupTime stat is set');
          assert.typeOf(engine.stats.secureStartTime, 'number', 'secureStartTime stat is set');
          assert.typeOf(engine.stats.secureConnectedTime, 'number', 'secureConnectedTime stat is set');
        });
      });

      describe('connect()', () => {
        let engine: CoreEngine;
        let request: IHttpRequest;
        let opts: HttpEngineOptions;
        let createdClient: net.Socket | undefined;
    
        before(() => {
          request = {
            url: `http://localhost:${chunkedHttpPort}/v1/headers`,
            method: 'GET',
            headers: 'x-test: true',
          };
          opts = {
            timeout: 50000,
            followRedirects: false,
            hosts: [{
              kind: HostRuleKind,
              from: 'domain.com',
              to: 'test.com',
            }],
            logger,
          };
          engine = new CoreEngine(request, opts);
        });
    
        afterEach(() => {
          if (createdClient) {
            createdClient.end();
            createdClient.destroy();
            createdClient = undefined;
          }
        });
    
        it('returns HTTP server client', async () => {
          const client = await engine.connect();
          assert.typeOf(client, 'object');
          createdClient = client;
        });
    
        it('sets the socket property', async () => {
          const client = await engine.connect();
          assert.isTrue(engine.socket === client);
          createdClient = client;
        });
      });

      describe('_authorizeNtlm()', () => {
        let headers: Headers;
        let engine: CoreEngine;
        let request: IHttpRequest;
        let opts: HttpEngineOptions;
        let authConfig: INtlmAuthorization;

        beforeEach(() => {
          headers = new Headers();
          request = {
            url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com',
          };
          authConfig = {
            domain: 'domain.com',
            username: 'test',
            password: 'test',
          },
          opts = {
            logger,
            authorization: [{
              kind: RequestAuthorizationKind,
              type: 'ntlm',
              enabled: true,
              valid: true,
              config: authConfig
            }],
          };
          engine = new CoreEngine(request, opts);
        });
    
        it('adds the authorization header', () => {
          engine._authorizeNtlm(authConfig, headers);
          assert.isTrue(headers.has('Authorization'));
        });
    
        it('the authorization is NTLM', () => {
          engine._authorizeNtlm(authConfig as INtlmAuthorization, headers);
          const value = headers.get('Authorization') as string;
          assert.equal(value.indexOf('NTLM '), 0);
        });
      });

      describe('_prepareMessage()', () => {
        it('returns a buffer', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            timeout: 50000,
            followRedirects: false,
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers(''));
          assert.isTrue(result instanceof Buffer);
        });
    
        it('contains the status message', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            timeout: 50000,
            followRedirects: false,
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers('')).toString();
          assert.equal(result.split('\n')[0], 'POST /api/endpoint?query=param HTTP/1.1\r');
        });
    
        it('removes hash from the URL', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param#access_token=test`,
            method: 'GET',
            headers: 'Host: test.com',
          };
          const opts: HttpEngineOptions = {
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers('')).toString();
          assert.equal(result.split('\n')[0],
            'GET /api/endpoint?query=param HTTP/1.1\r');
        });
    
        it('adds the Host header', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            timeout: 50000,
            followRedirects: false,
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers('')).toString();
          assert.equal(result.split('\n')[1], `Host: localhost:${httpPort}\r`);
        });
    
        it('adds the passed headers', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            timeout: 50000,
            followRedirects: false,
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers('content-type: text/plain')).toString();
          assert.equal(result.split('\n')[2], 'content-type: text/plain\r');
        });
    
        it('adds empty line after headers', () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = engine._prepareMessage(new Headers('content-type: text/plain')).toString();
          assert.equal(result.split('\n')[3], '\r');
        });
    
        it('adds the payload message', () => {
          const payloadBuffer = Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74]);
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(payloadBuffer),
          };
          const opts: HttpEngineOptions = {
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const headers = new Headers('content-type: text/plain');
          const result = engine._prepareMessage(headers, payloadBuffer).toString();
          assert.equal(result.split('\n')[4], 'test');
          assert.equal(result.split('\n')[5], 'test');
        });
    
        it('encodes query parameters', () => {
          const request = {
            url: `http://localhost:${httpPort}/v1/query-params?va=test-paßword`,
            method: 'GET',
            headers: '',
          }
          const engine = new CoreEngine(request, { logger });
          const result = engine._prepareMessage(new Headers('')).toString();
          assert.include(result, 'GET /v1/query-params?va=test-pa%C3%9Fword HTTP/1.1');
        });
      });
    
      describe('prepareMessage()', () => {
        it('returns a Buffer', async () => {
          const request = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          }
          const engine = new CoreEngine(request, { logger });
          const result = await engine.prepareMessage();
          assert.isTrue(result instanceof Buffer);
        });
    
        it('ignores payload for GET requests', async () => {
          const request = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          }
          const engine = new CoreEngine(request, { logger });
          const result = await engine.prepareMessage();
          assert.lengthOf(result.toString().split('\n'), 5);
        });
    
        it('creates a message with the passed payload', async () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            timeout: 50000,
            followRedirects: false,
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = await engine.prepareMessage();
          assert.lengthOf(result.toString().split('\n'), 7);
        });
    
        it('adds NTLM request headers from payload processing', async () => {
          const request = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com',
          };
          const opts: HttpEngineOptions = {
            logger,
            authorization: [{
              kind: RequestAuthorizationKind,
              type: 'ntlm',
              enabled: true,
              valid: true,
              config: {
                domain: 'domain.com',
                username: 'test',
                password: 'test',
              }
            }],
          };

          const engine = new CoreEngine(request, opts);
          const result = await engine.prepareMessage();
          const headers = engine.request.headers as string;
          assert.equal(headers.indexOf('NTLM '), -1, 'Headers are not altered');
          assert.isAbove(result.toString().indexOf('NTLM '), 0, 'Adds headers to body');
        });
    
        it('adds content length header', async () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            logger,
          };
          const engine = new CoreEngine(request, opts);
          const result = await engine.prepareMessage();
          const headers = engine.sentRequest.headers as string;
          const search = headers.indexOf('content-length: 9');
          assert.isAbove(search, 0);
          assert.isAbove(result.toString().indexOf('content-length: 9'), 0);
        });
    
        it('adds the default headers', async () => {
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])),
          };
          const opts: HttpEngineOptions = {
            logger,
            defaultHeaders: true,
          };
          const engine = new CoreEngine(request, opts);
          await engine.prepareMessage();
          
          assert.include(engine.sentRequest.headers, 'user-agent: api client', 'user-agent is set');
          assert.include(engine.sentRequest.headers, 'accept: */*', 'accept is set');
        });
      });
    
      describe('writeMessage()', () => {
        let message: Buffer;
        let engine:CoreEngine;
        let createdClient: net.Socket | undefined;
    
        before(() => {
          let str = 'GET /api/endpoint?query=param HTTP/1.1\r\n';
          str += 'Host: localhost:8123\r\n';
          str += '\r\n';
          message = Buffer.from(str);
        });
    
        beforeEach(async () => {
          const request: IHttpRequest = {
            url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          const opts: HttpEngineOptions = {
            logger,
          };

          engine = new CoreEngine(request, opts);
          createdClient = await engine.connect();
        });
    
        afterEach(() => {
          if (createdClient) {
            createdClient.end();
            createdClient.destroy();
            createdClient = undefined;
          }
        });
    
        it('sets the messageSent property on the sentRequest', async () => {
          await engine.writeMessage(message);
          assert.typeOf(engine.sentRequest.httpMessage, 'string');
        });
    
        it('sets the messageStart property on the stats object', async () => {
          await engine.writeMessage(message);
          assert.typeOf(engine.stats.messageStart, 'number');
        });
    
        it('sets the sentTime property on stats object', async () => {
          await engine.writeMessage(message);
          assert.typeOf(engine.stats.sentTime, 'number');
        });
    
        it('emits the "loadstart" event', (done) => {
          engine.once('loadstart', () => {
            done();
          });
          engine.writeMessage(message);
        });
      });

      describe('_parseHeaders()', () => {
        let engine: CoreEngine;
        let headersStr: string;
        let headersBuf: Buffer;
        before(() => {
          const payloadBuffer = Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74]);
          const request: IHttpRequest = {
            url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: PayloadSerializer.stringifyBuffer(payloadBuffer),
          };
          const opts: HttpEngineOptions = {
            logger,
          };

          engine = new CoreEngine(request, opts);
          const response = Response.fromValues(0);
          response.loadingTime = 0;
          engine.currentResponse = response;
          headersStr = 'Content-Type: application/test\r\n';
          headersStr += 'Content-Length: 123\r\n';
          headersStr += 'Transfer-Encoding: chunked\r\n';
          headersBuf = Buffer.from(headersStr);
        });
    
        it('sets the headers property', () => {
          engine._parseHeaders(headersBuf);
          assert.typeOf(engine.currentResponse!.headers, 'string');
        });
    
        it('contains all headers', () => {
          engine._parseHeaders(headersBuf);
          const list: Record<string, string> = {};
          engine.currentHeaders!.forEach((value, name) => {
            list[name] = value;
          });
          assert.lengthOf(Object.keys(list), 3);
        });
    
        it('sets the responseInfo.contentLength property', () => {
          engine._parseHeaders(headersBuf);
          assert.equal(engine.responseInfo!.contentLength, 123);
        });
    
        it('sets the responseInfo.chunked property', () => {
          engine._parseHeaders(headersBuf);
          assert.isTrue(engine.responseInfo!.chunked);
        });
    
        it('dispatches the headersreceived event', () => {
          const spy = sinon.spy();
          engine.once('headersreceived', spy);
          engine._parseHeaders(headersBuf);
          assert.isTrue(spy.calledOnce);
        });
    
        it('has the returnValue on the headersreceived event', () => {
          const spy = sinon.spy();
          engine.once('headersreceived', spy);
          engine._parseHeaders(headersBuf);
          const info: HeadersReceivedDetail = spy.args[0][0];
          assert.isTrue(info.returnValue);
        });
    
        it('has the value property on the headersreceived event', () => {
          const spy = sinon.spy();
          engine.once('headersreceived', spy);
          engine._parseHeaders(headersBuf);
          const info: HeadersReceivedDetail = spy.args[0][0];
          assert.ok(info.value);
          assert.typeOf(info.value, 'string');
        });
    
        it('aborts the request when the event is canceled', () => {
          engine.once('headersreceived', (detail) => {
            detail.returnValue = false;
          });
          engine._parseHeaders(headersBuf);
          assert.isTrue(engine.aborted);
        });
      });

      describe('prepareHeaders()', () => {
        let request: IHttpRequest;
        let opts: HttpEngineOptions;

        beforeEach(() => {
          request = {
            url: 'https://api.domain.com',
            method: 'GET',
            headers: '',
          };
          opts = {
            defaultHeaders: true,
            logger,
          };
        });

        it('adds default user-agent', () => {
          const base = new CoreEngine(request, opts);
          const headers = new Headers();
          base.prepareHeaders(headers);
          assert.equal(headers.get('user-agent'), 'api client');
        });
    
        it('adds default accept', () => {
          const base = new CoreEngine(request, opts);
          const headers = new Headers();
          base.prepareHeaders(headers);
          assert.equal(headers.get('accept'), '*/*');
        });
    
        it('adds configured user-agent', () => {
          opts.defaultUserAgent = 'test';
          const base = new CoreEngine(request, opts);
          const headers = new Headers();
          base.prepareHeaders(headers);
          assert.equal(headers.get('user-agent'), 'test');
        });
    
        it('adds configured accept', () => {
          opts.defaultAccept = 'test';
          const base = new CoreEngine(request, opts);
          const headers = new Headers();
          base.prepareHeaders(headers);
          assert.equal(headers.get('accept'), 'test');
        });
    
        it('ignores adding headers when no config option', () => {
          opts.defaultHeaders = false;
          const base = new CoreEngine(request, opts);
          const headers = new Headers();
          base.prepareHeaders(headers);
          assert.isFalse(headers.has('user-agent'), 'user-agent is not set');
          assert.isFalse(headers.has('accept'), 'accept is not set');
        });
    
        it('skips when user-agent header is set', () => {
          const base = new CoreEngine(request, opts);
          const headers = new Headers({
            'user-agent': 'test',
          });
          base.prepareHeaders(headers);
          assert.equal(headers.get('user-agent'), 'test');
        });
    
        it('skips when accept header is set', () => {
          const base = new CoreEngine(request, opts);
          const headers = new Headers({
            accept: 'test',
          });
          base.prepareHeaders(headers);
          assert.equal(headers.get('accept'), 'test');
        });
      });

      describe('BaseRequest uri', () => {
        let request: IHttpRequest;

        beforeEach(() => {
          request = {
            url: 'https://domain.com',
            method: 'GET',
          };
        });
      
        it('parses the URL', () => {
          const engine = new CoreEngine(request);
          assert.typeOf(engine.uri, 'URL');
          assert.equal(engine.uri.hostname, 'domain.com');
        });
      
        it('changes uri', () => {
          const engine = new CoreEngine(request);
          const result = engine.readUrl('http://other.com');
          assert.typeOf(result, 'URL');
          assert.equal(result.hostname, 'other.com');
        });
      
        it('applies host rules', () => {
          const hosts: IHostRule[] = [{ from: 'domain.com', to: 'other.com', kind: HostRuleKind }];
          const engine = new CoreEngine(request, {
            hosts,
          });
          assert.equal(engine.uri.hostname, 'other.com');
        });
      });
    });

    describe('Events', () => {
      let engine: CoreEngine;
      beforeEach(() => {
        const request: IHttpRequest = {
          url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
          method: 'GET',
          headers: 'Host: test.com\nContent-Length: 0',
          payload: 'abc',
        };
        const opts: HttpEngineOptions = {
          logger,
        };
        engine = new CoreEngine(request, opts);
      });
  
      it('dispatches the "loadstart" event', async () => {
        const spy = sinon.spy();
        engine.once('loadstart', spy);
        await engine.send();
        assert.isTrue(spy.calledOnce);
      });
  
      it('dispatches the "firstbyte" event', async () => {
        const spy = sinon.spy();
        engine.once('firstbyte', spy);
        await engine.send();
        assert.isTrue(spy.calledOnce);
      });
  
      it('dispatches the "loadend" event', async () => {
        const spy = sinon.spy();
        engine.once('loadend', spy);
        await engine.send();
        assert.isTrue(spy.calledOnce);
      });
  
      it('dispatches the "headersreceived" event', async () => {
        const spy = sinon.spy();
        engine.once('headersreceived', spy);
        await engine.send();
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('Client certificate', () => {
      let alicePem: HttpCertificate;
      let aliceP12: HttpCertificate;
      let alicePassword: HttpCertificate;
      let bobP12: HttpCertificate;
      before(async () => {
        alicePem = {
          cert: {
            data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice_cert.pem', 'utf8'),
          },
          certKey: {
            data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice_key.pem', 'utf8'),
          },
          type: 'pem',
          key: '1',
          kind: 'Core#Certificate',
          name: 'Alice PEM',
        };
        aliceP12 = {
          cert: {
            data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice.p12'),
            passphrase: '',
          },
          type: 'p12',
          key: '2',
          kind: 'Core#Certificate',
          name: 'Alice p12',
        };
        alicePassword = {
          cert: {
            data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice-password.p12'),
            passphrase: 'test',
          },
          type: 'p12',
          key: '3',
          kind: 'Core#Certificate',
          name: 'Alice password',
        };
        bobP12 = {
          cert: {
            data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/bob.p12'),
            passphrase: 'test',
          },
          type: 'p12',
          key: '4',
          kind: 'Core#Certificate',
          name: 'Bob p12',
        };
      });
  
      it('makes connection without a certificate', async () => {
        const request = new CoreEngine({
          url: `https://localhost:${certPort}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          timeout: 10000,
          logger,
        });

        const data = await request.send();
        assert.ok(data.response, 'has the response');
        const response = new Response(data.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        
        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isFalse(body.authenticated);
      });

      it('makes a connection with p12 client certificate', async () => {
        const request = new CoreEngine({
          url: `https://localhost:${certPort}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          certificates: [aliceP12],
          logger,
        });

        const data = await request.send();
        assert.ok(data.response, 'has the response');
        const response = new Response(data.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });

      it('makes a connection with p12 client certificate and password', async () => {
        const request = new CoreEngine({
          url: `https://localhost:${certPort}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          certificates: [alicePassword],
          logger,
        });
        
        const data = await request.send();
        const response = new Response(data.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });

      it('ignores untrusted valid certificates', async () => {
        const request = new CoreEngine({
          url: `https://localhost:${certPort}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          certificates: [bobP12],
          logger,
        });

        const data = await request.send();
        
        const response = new Response(data.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isFalse(body.authenticated);
        assert.equal(body.name, 'Bob');
        // Bob has self-signed cert
        assert.equal(body.issuer, 'Bob');
      });

      it('makes a connection with pem client certificate', async () => {
        const request = new CoreEngine({
          url: `https://localhost:${certPort}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          certificates: [alicePem],
          logger,
        });
        
        const data = await request.send();
        
        const response = new Response(data.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });
    });

    // these tests started failing on GitHub.
    describe.skip('Certificates validation', () => {
      [
        ['expired', 'https://expired.badssl.com', 'CERT_HAS_EXPIRED'],
        ['wrong host', 'https://wrong.host.badssl.com/', 'ERR_TLS_CERT_ALTNAME_INVALID'],
        ['self signed', 'https://self-signed.badssl.com/', 'DEPTH_ZERO_SELF_SIGNED_CERT'],
        ['untrusted root', 'https://untrusted-root.badssl.com/', 'SELF_SIGNED_CERT_IN_CHAIN'],
    
    
        // ['revoked', 'https://revoked.badssl.com/'],
        // ['pinned', 'https://pinning-test.badssl.com/']
      ].forEach((item) => {
        const [name, url, code] = item;
        it(`reads certificate: ${name}`, async () => {
          const request = new CoreEngine({
            url,
            method: 'GET',
          }, {
            validateCertificates: false,
            logger,
          });
          const log = await request.send();
          const response = log.response as IResponse;
          assert.isAbove(response.status, 199);
          assert.isBelow(response.status, 300);
        });
    
        it(`rejects ${name} cert with validation enabled`, async () => {
          const request = new CoreEngine({
            url,
            method: 'GET',
          }, {
            validateCertificates: true,
            logger,
          });
          const log = await request.send();
          const { response } = log;
          assert.ok(response, 'has the response');
          assert.isTrue(ErrorResponse.isErrorResponse(response), 'is the errored response');
          const errored = response as ErrorResponse;
          const error = errored.error;
          assert.equal(error.code, code, 'has the error code');
        });
      });
    });

    describe('Sending request parameters', () => {
      it('sends query parameters to the server', async () => {
        const request: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/query-params?a=b&c=d`,
          method: 'GET',
        };
        const opts: HttpEngineOptions = {
          logger,
        };
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.deepEqual(body.params.query, {
          a: 'b',
          c: 'd',
        });
      });
  
      it('sends headers to the server', async () => {
        const request: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/headers`,
          method: 'GET',
          headers: 'x-test: true\naccept: application/json',
        };
        const opts: HttpEngineOptions = {
          logger,
        };
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.deepEqual(body.headers, {
          'accept': 'application/json',
          'host': `localhost:${httpPort}`,
          'x-test': 'true',
        });
      });
    });

    describe('query parameters processing', () => {
      let requestData: IHttpRequest;
      const opts: HttpEngineOptions = {
        logger,
      };

      beforeEach(() => {
        requestData = {
          url: `http://localhost:${httpPort}/v1/query-params/`,
          method: 'GET',
          headers: '',
        };
      });

      it('sends a query parameter', async () => {
        const r: IHttpRequest = { ...requestData };
        r.url += '?a=b';
        const request = new CoreEngine(r, opts);
        const log = await request.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: { query: { a: 'b' } } });
      });

      it('sends a multiple query parameters', async () => {
        const r = { ...requestData };
        r.url += '?a=b&c=1&d=true';
        const request = new CoreEngine(r, opts);
        const log = await request.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: {
          query: {
            a: 'b',
            c: '1',
            d: 'true',
          },
        },
        });
      });

      it('sends an array query parameters', async () => {
        const r = { ...requestData };
        r.url += '?a=b&a=c&a=d';
        const request = new CoreEngine(r, opts);
        const log = await request.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: {
          query: {
            a: ['b', 'c', 'd'],
          },
        },
        });
      });

      it('sends an array query parameters with brackets', async () => {
        const r = { ...requestData };
        r.url += '?a[]=b&a[]=c&a[]=d';
        const request = new CoreEngine(r, opts);
        const log = await request.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: {
          query: {
            a: ['b', 'c', 'd'],
          },
        },
        });
      });

      it('sends mixed query parameters', async () => {
        const r = { ...requestData };
        r.url += '?a[]=b&a[]=c&b=a&b=b&c=d';
        const request = new CoreEngine(r, opts);
        const log = await request.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: {
          query: {
            a: ['b', 'c'],
            b: ['a', 'b'],
            c: 'd',
          },
        },
        });
      });
    });

    describe('headers processing', () => {
      let request: IHttpRequest;
      const opts: HttpEngineOptions = {
        logger,
      };

      beforeEach(() => {
        request = {
          url: `http://localhost:${httpPort}/v1/headers/`,
          method: 'GET',
          headers: '',
        };
      });

      it('sends a header', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true';
        const er = new CoreEngine(r, opts);
        const log = await er.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true');
      });

      it('sends multiple headers', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true\nAccept-CH: DPR, Viewport-Width';
        const er = new CoreEngine(r, opts);
        const log = await er.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true');
        assert.equal(body.headers['accept-ch'], 'DPR, Viewport-Width');
      });

      it('sends array headers', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true, x-value';
        const er = new CoreEngine(r, opts);
        const log = await er.send();
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true, x-value');
      });
    });

    describe('Request size', () => {
      it('has the request size value', async () => {
        const request: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/headers`,
          method: 'GET',
          headers: 'x-test: true\naccept: application/json',
        };
        const opts: HttpEngineOptions = {
          logger,
        };
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const size = log.size as IRequestsSize;
        assert.equal(size.request, 90);
      });
  
      it('has the response size value', async () => {
        const request: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/headers`,
          method: 'GET',
          headers: 'x-test: true\naccept: application/json',
        };
        const opts: HttpEngineOptions = {
          logger,
        };
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const size = log.size as IRequestsSize;
        assert.equal(size.response, 81);
      });
    });

    describe('POST requests', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: `http://localhost:${chunkedHttpPort}/v1/tests/`,
          method: 'POST',
          headers: 'Host: test.com\nContent-Length: 0',
          payload: 'abc',
        };
        opts = {
          timeout: 50000,
          followRedirects: false,
          logger,
        };
      });

      it('makes a POST request', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        assert.ok(log);
      });
  
      it('response has stats', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const response = new Response(log.response as IResponse);
        assert.equal(response.status, 200);
      });
  
      it('response has statusText', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const response = new Response(log.response as IResponse);
        assert.equal(response.statusText, 'OK');
      });
  
      it('response has headers', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const response = new Response(log.response as IResponse);
        assert.typeOf(response.headers, 'string');
      });
  
      it('has response payload', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const response = new Response(log.response as IResponse);
        assert.ok(response.payload);
      });
  
      it('has the response timings object', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const response = new Response(log.response as IResponse);
        assert.typeOf(response.timings, 'object');
      });
  
      it('has response sentHttpMessage', async () => {
        const engine = new CoreEngine(request, opts);
        const log = await engine.send();
        const sent = log.request as ISentRequest;
        assert.typeOf(sent.httpMessage, 'string');
      });
    });
  
    describe('GET requests', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: `http://localhost:${chunkedHttpPort}/v1/tests/`,
          method: 'GET',
          headers: 'Host: test.com',
        };
        opts = {
          timeout: 50000,
          followRedirects: false,
          logger,
        };
      });

      it('makes a GET request', async () => {
        const engine = new CoreEngine(request, opts);
        const info = await engine.send();
        assert.ok(info);
      });
  
      it('makes a delayed GET request', async () => {
        request.url += '?delay=300';
        const engine = new CoreEngine(request, opts);
        const info = await engine.send();
        assert.ok(info);
      });
    });

    describe('Responses test', () => {
      [
        ['Image - jpeg', `http://localhost:PORT/v1/image/jpeg`, 'image/jpeg'],
        ['Image - png', `http://localhost:PORT/v1/image/png`, 'image/png'],
        ['Image - svg', `http://localhost:PORT/v1/image/svg`, 'image/svg+xml'],
        ['Image - webp', `http://localhost:PORT/v1/image/webp`, 'image/webp'],
        ['html', `http://localhost:PORT/v1/response/html`, 'text/html; charset=UTF-8'],
        ['json', `http://localhost:PORT/v1/response/json`, 'application/json'],
        ['xml', `http://localhost:PORT/v1/response/xml`, 'application/xml'],
        ['Bytes', `http://localhost:PORT/v1/response/bytes/120`, 'application/octet-stream'],
      ].forEach((item) => {
        const [name, sourceUrl, mime] = item;
        it(`reads the response: ${name}`, async () => {
          const url = sourceUrl.replace('PORT', String(httpPort));
          const engine = new CoreEngine({
            url,
            method: 'GET',
          }, { logger });
          const info = await engine.send();
          const response = new Response(info.response as IResponse);

          const headers = new Headers(response.headers);
          assert.equal(headers.get('content-type'), mime, 'has the content type');
          const payload = await response.readPayload() as Buffer;

          const { length } = payload;
          assert.equal(headers.get('content-length'), String(length));
        });
      });
    });
  
    describe('Compression test', () => {
      [
        ['brotli', `http://localhost:PORT/v1/compression/brotli`, 'br'],
        ['deflate', `http://localhost:PORT/v1/compression/deflate`, 'deflate'],
        ['gzip', `http://localhost:PORT/v1/compression/gzip`, 'gzip'],
      ].forEach((item) => {
        const [name, sourceUrl, enc] = item;
        it(`reads the compressed response: ${name}`, async () => {
          const url = sourceUrl.replace('PORT', String(httpPort));
          const engine = new CoreEngine({
            url,
            method: 'GET',
            headers: `accept-encoding: ${enc}`,
          }, { logger });
          const info = await engine.send();
          const response = new Response(info.response as IResponse);

          assert.ok(response.payload, 'has the payload');

          const headers = new Headers(response.headers);
          assert.equal(headers.get('content-encoding'), enc, 'has the content-encoding in the response');

          const payload = await response.readPayload() as Buffer;
          const body = payload.toString();
          const data = JSON.parse(body);
          assert.typeOf(data, 'array', 'has the response body');
        });
      });
    });

    describe('Decompression', () => {
      function createDeflate(str?: string): Buffer {
        return zlib.deflateSync(Buffer.from(str || 'deflate-string'));
      }
    
      function createGzip(str?: string): Buffer {
        return zlib.gzipSync(Buffer.from(str || 'gzip-string'));
      }
    
      function createBrotli(str?: string): Buffer {
        return zlib.brotliCompressSync(Buffer.from(str || 'brotli-string'));
      }

      let request: IHttpRequest;

      beforeEach(() => {
        request = {
          url: 'https://domain.com',
          method: 'GET',
        };
      });
    
      describe('inflate()', () => {
        it('resolves to a Buffer', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.inflate(createDeflate());
          assert.equal(result.length, 14);
        });
    
        it('has original data', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.inflate(createDeflate());
          assert.equal(result.toString(), 'deflate-string');
        });
      });
    
      describe('gunzip()', () => {
        it('resolves to a buffer', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.gunzip(createGzip());
          assert.equal(result.length, 11);
        });
    
        it('has original data', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.gunzip(createGzip());
          assert.equal(result.toString(), 'gzip-string');
        });
      });
    
      describe('brotli()', () => {
        it('resolves to a buffer', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.brotli(createBrotli());
          assert.equal(result.length, 13);
        });
    
        it('has original data', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.brotli(createBrotli());
          assert.equal(result.toString(), 'brotli-string');
        });
      });
    
      describe('_decompress()', () => {
        it('returns undefined when no data', async () => {
          const engine = new CoreEngine(request);
          const result = await engine.decompress(undefined);
          assert.isUndefined(result);
        });
    
        it('returns undefined when aborted', async () => {
          const engine = new CoreEngine(request);
          engine.aborted = true;
          const result = await engine.decompress(Buffer.from('test'));
          assert.isUndefined(result);
        });
    
        it('returns the same buffer when no content-encoding header', async () => {
          const b = Buffer.from('test');
          const engine = new CoreEngine(request);
          engine.currentHeaders = new Headers();
          engine.currentResponse = Response.fromValues(200);
          engine.currentResponse.loadingTime = 1;
          const result = await engine.decompress(b) as Buffer;
          assert.equal(result.compare(b), 0);
        });
    
        it('decompresses deflate', async () => {
          const b = createDeflate();
          const engine = new CoreEngine(request);
          engine.currentHeaders = new Headers('content-encoding: deflate');
          engine.currentResponse = Response.fromValues(200);
          engine.currentResponse.loadingTime = 1;
          const result = await engine.decompress(b) as Buffer;
          assert.equal(result.toString(), 'deflate-string');
        });
    
        it('decompresses gzip', async () => {
          const b = createGzip();
          const engine = new CoreEngine(request);
          engine.currentHeaders = new Headers('content-encoding: gzip');
          engine.currentResponse = Response.fromValues(200);
          engine.currentResponse.loadingTime = 1;
          const result = await engine.decompress(b) as Buffer;
          assert.equal(result.toString(), 'gzip-string');
        });
    
        it('decompresses brotli', async () => {
          const b = createBrotli();
          const engine = new CoreEngine(request);
          engine.currentHeaders = new Headers('content-encoding: br');
          engine.currentResponse = Response.fromValues(200);
          engine.currentResponse.loadingTime = 1;
          const result = await engine.decompress(b) as Buffer;
          assert.equal(result.toString(), 'brotli-string');
        });
      });
    });
  
    describe('Timings tests', () => {
      it('has the stats object', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        const response = info.response as IResponse;
        const timing = response.timings as IRequestTime;
        assert.typeOf(timing, 'object');
      });
  
      (['connect', 'receive', 'send', 'wait', 'dns', 'ssl'] as (keyof IRequestTime)[]).forEach((prop) => {
        it(`has the ${prop} value`, async () => {
          const engine = new CoreEngine({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          }, { logger });
          const info = await engine.send();
          const response = info.response as IResponse;
          const timing = response.timings as IRequestTime;
          assert.typeOf(timing[prop], 'number');
        });
      });
  
      it('has the stats time for ssl', async () => {
        const engine = new CoreEngine({
          url: 'https://www.google.com/',
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        const response = info.response as IResponse;
        const timing = response.timings as IRequestTime;
        assert.isAbove(timing.ssl as number, -1);
      });
    });

    describe('Data buffer responses', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
          method: 'GET',
          headers: 'Host: test.com\nContent-Length: 0',
          payload: 'abc',
        };
        opts = {
          timeout: 50000,
          followRedirects: false,
          logger,
        };
      });
    
      describe('Issue #75', () => {
        // https://github.com/advanced-rest-client/arc-electron/issues/75#issuecomment-399204512
        const parts = [
          Buffer.from([
            72, 84, 84, 80, 47, 49, 46, 48, 32, 50, 48, 48, 32, 79, 75, 13, 10, 67,
            111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58, 32, 97, 112, 112,
            108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 13, 10, 67,
            111, 110, 116, 101, 110, 116, 45, 76, 101, 110, 103, 116, 104, 58, 32, 49,
            49, 52, 13, 10]),
          Buffer.from([83, 101, 114, 118, 101, 114, 58, 32, 87, 101, 114, 107, 122,
            101, 117, 103, 47, 48, 46, 49, 52, 46, 49, 32, 80, 121, 116, 104, 111,
            110, 47, 50, 46, 55, 46, 49, 52, 13, 10, 68, 97, 116, 101, 58, 32, 84,
            104, 117, 44, 32, 50, 49, 32, 74, 117, 110, 32, 50, 48, 49, 56, 32, 49,
            56, 58, 51, 48, 58, 53, 49, 32, 71, 77, 84, 13, 10, 13, 10, 123, 34, 105,
            110, 115, 116, 114, 117, 109, 101, 110, 116, 95, 105, 100, 34, 58, 32,
            50, 52, 49, 56, 54, 44, 32, 34, 117, 115, 101, 114, 95, 105, 100, 34, 58,
            32, 53, 57, 44, 32, 34, 112, 114, 111, 100, 117, 99, 116, 95, 105, 100,
            34, 58, 32, 51, 50, 54, 57, 44, 32, 34, 112, 114, 105, 99, 101, 34, 58,
            32, 50, 46, 48, 44, 32, 34, 115, 105, 100, 101, 34, 58, 32, 34, 83, 101,
            108, 108, 34, 44, 32, 34, 105, 100, 34, 58, 32, 50, 44, 32, 34, 113, 117,
            97, 110, 116, 105, 116, 121, 34, 58, 32, 48, 125, 10]),
          // After processing status line
          Buffer.from([67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58,
            32, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115,
            111, 110, 13, 10, 67, 111, 110, 116, 101, 110, 116, 45, 76, 101, 110,
            103, 116, 104, 58, 32, 49, 49, 52, 13, 10]),
        ];
        const headersMap: Record<string, string> = {
          'Content-Type': 'application/json',
          'Content-Length': '114',
          'Server': 'Werkzeug/0.14.1 Python/2.7.14',
          'Date': 'Thu, 21 Jun 2018 18:30:51 GMT',
        };

        let engine: CoreEngine;
        beforeEach(() => {
          engine = new CoreEngine(request, opts);
        });
    
        it('returns data from the _processStatus()', () => {
          const result = engine._processStatus(parts[0]) as Buffer;
          assert.equal(result.compare(parts[2]), 0);
        });
    
        it('reads the status line', () => {
          engine._processSocketMessage(parts[0]);
          const cr = engine.currentResponse as Response;
          assert.equal(cr.status, 200, 'Status code is set');
          assert.equal(cr.statusText, 'OK', 'Status message is set');
        });
    
        it('puts headers from part #1 after processing status to temp variable', () => {
          engine._processHeaders(parts[2]);
          const headers = engine.rawHeaders as Buffer;
          assert.equal(headers.compare(parts[2]), 0);
        });
    
        it('sets the state to HEADERS after first part', () => {
          engine._processSocketMessage(parts[0]);
          assert.equal(engine.state, RequestState.Headers);
        });
    
        function processMessages(): void {
          engine._processSocketMessage(parts[0]);
          engine._processSocketMessage(parts[1]);
        }
    
        it('processes both messages', () => {
          processMessages();
          assert.equal(engine.state, RequestState.Done);
        });
    
        it('sets the status', () => {
          processMessages();
          const cr = engine.currentResponse as Response;
          assert.equal(cr.status, 200, 'Status code is set');
          assert.equal(cr.statusText, 'OK', 'Status message is set');
        });
    
        it('sets the headers', () => {
          processMessages();
          const cr = engine.currentResponse as Response;
          assert.typeOf(cr.headers, 'string');
          assert.typeOf(engine.currentHeaders, 'object');
          engine.currentHeaders.forEach((value, name) => {
            assert.equal(headersMap[name], value);
          });
        });
    
        it('sets the body', () => {
          processMessages();
          assert.isTrue(engine._rawBody instanceof Buffer);
        });
      });
    });

    describe('Receiving data', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: `http://localhost:${chunkedHttpPort}/api/endpoint?query=param`,
          method: 'GET',
          headers: 'Host: test.com\nContent-Length: 0',
          payload: 'abc',
        };
        opts = {
          timeout: 50000,
          followRedirects: false,
          logger,
        };
      });
    
      describe('Chunked responses', () => {
        let engine: CoreEngine;

        it('receives chunked response.', async () => {
          engine = new CoreEngine(request, opts);
          const info = await engine.send();
          const response = new Response(info.response as IResponse);
          const payload = await response.readPayload() as Buffer;

          const parts = payload.toString().split('\n');
          assert.lengthOf(parts, 6);
          for (let i = 0; i < 5; i++) {
            assert.equal(parts[i].length, 128);
          }
        });
      });
    
      describe('readChunkSize()', () => {
        let engine: CoreEngine;
        before(() => {
          engine = new CoreEngine(request, opts);
        });
    
        it('returns the the same array when new line is not found', () => {
          const b = Buffer.from('test');
          const result = engine.readChunkSize(b);
          assert.isTrue(b === result);
        });
    
        it('does not set chunkSize property', () => {
          const b = Buffer.from('test');
          engine.readChunkSize(b);
          assert.isUndefined(engine.responseInfo.chunkSize);
        });
    
        it('parses chunk size', () => {
          let chunk = Number(128).toString(16);
          chunk += '\r\ntest';
          const b = Buffer.from(chunk);
          engine.readChunkSize(b);
          assert.equal(engine.responseInfo.chunkSize, 128);
        });
    
        it('truncates the buffer', () => {
          let chunk = Number(128).toString(16);
          chunk += '\r\ntest';
          const b = Buffer.from(chunk);
          const result = engine.readChunkSize(b) as Buffer;
          assert.equal(result.toString(), 'test');
        });
      });
    
      describe('_processBodyChunked()', () => {
        let engine: CoreEngine;
        beforeEach(() => {
          engine = new CoreEngine(request, opts);
          engine._reportResponse = (): void => {};
        });
    
        it('reads body chunk', () => {
          let chunk = Number(4).toString(16);
          chunk += '\r\ntest\r\n0\r\n';
          const b = Buffer.from(chunk);
          engine._processBodyChunked(b);
          assert.equal(engine.responseInfo.chunkSize, 0);
          assert.equal((engine._rawBody as Buffer).toString(), 'test');
        });
    
        it('Reads multi chunks', () => {
          let chunk = Number(6).toString(16);
          chunk += '\r\ntest\r\n\r\n';
          chunk += Number(8).toString(16);
          chunk += '\r\ntest1234\r\n';
          chunk += '0\r\n';
          const b = Buffer.from(chunk);
          engine._processBodyChunked(b);
          assert.equal(engine.responseInfo.chunkSize, 0);
          assert.equal((engine._rawBody as Buffer).toString(), 'test\r\ntest1234');
        });
    
        it('Reads multi chunks with partial buffer', () => {
          let chunk = Number(6).toString(16);
          chunk += '\r\nte';
          engine._processBodyChunked(Buffer.from(chunk));
          chunk = 'st\r\n\r\n';
          engine._processBodyChunked(Buffer.from(chunk));
          chunk = Number(8).toString(16);
          chunk += '\r\ntest';
          engine._processBodyChunked(Buffer.from(chunk));
          chunk = '1234\r\n0\r\n';
          engine._processBodyChunked(Buffer.from(chunk));
          assert.equal(engine.responseInfo.chunkSize, 0);
          assert.equal((engine._rawBody as Buffer).toString(), 'test\r\ntest1234');
        });
      });
    
      describe('_processBody()', () => {
        let engine: CoreEngine;
        const testData = Buffer.from('abcdefghijklmn');
        const testLength = testData.length;
    
        beforeEach(() => {
          engine = new CoreEngine(request, opts);
          engine._reportResponse = ():void => {};
        });
    
        it('sets the responseInfo.body property', () => {
          engine.responseInfo.contentLength = testLength + 1;
          engine.responseInfo.chunked = false;
          engine._processBody(testData);
          assert.equal((engine.responseInfo.body as Buffer).toString(), testData.toString());
        });
    
        it('does not call _reportResponse when length is higher than data', () => {
          engine.responseInfo.contentLength = testLength + 1;
          let called = false;
          engine._reportResponse = ():void => {
            called = true;
          };
          engine._processBody(testData);
          assert.isFalse(called);
        });
    
        it('reports response when the data is read as whole on one socket buffer', () => {
          engine.responseInfo.contentLength = testLength;
          let called = false;
          engine._reportResponse = (): void => {
            called = true;
          };
          engine._processBody(testData);
          assert.isTrue(called, '_reportResponse was called');
        });
    
        it('reports response after more calls', () => {
          engine.responseInfo.contentLength = testLength;
          let called = false;
          engine._reportResponse = (): void => {
            called = true;
          };
          engine._processBody(Buffer.from('abcdef'));
          engine._processBody(Buffer.from('ghijklmn'));
          assert.isTrue(called, '_reportResponse was called');
        });
      });
    });

    describe('Timeout test', () => {
      let opts: HttpEngineOptions;

      beforeEach(() => {
        opts = {
          timeout: 60,
          followRedirects: false,
          logger,
        };
      });
    
      it('timeouts the request', async () => {
        const request: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/delay/1000`,
          method: 'GET',
        };
        const engine = new CoreEngine(request, opts);
        const spy = sinon.spy();
        engine.on('loadend', spy);
        const info = await engine.send();
        assert.isFalse(spy.called, 'loadend was not called');
        const response = info.response as IErrorResponse;
        assert.equal(response.status, 0, 'status is 0');
        assert.equal((response.error as Error).message, 'Connection timeout.');
      });
    });

    describe('Aborting the request', () => {
      let request: IHttpRequest;
      let opts: HttpEngineOptions;

      beforeEach(() => {
        request = {
          url: `http://localhost:${httpPort}/v1/headers`,
          method: 'GET',
        };
        opts = {
          logger,
        };
      });

      function setupSocket(base: CoreEngine): Promise<void> {
        return new Promise((resolve, reject) => {
          const socket = new net.Socket({
            writable: true,
          });
          socket.connect(httpPort, 'localhost', () => {
            base.socket = socket;
            resolve();
          });
          socket.on('error', () => {
            reject(new Error('Unable to connect'));
          });
        });
      }
  
      it('sets aborted flag', () => {
        const base = new CoreEngine(request, opts);
        base.abort();
        assert.isTrue(base.aborted);
      });
  
      it('destroys the socket', async () => {
        const base = new CoreEngine(request, opts);
        await setupSocket(base);
        base.abort();
        assert.isUndefined(base.socket);
      });
  
      it('removes destroyed socket', async () => {
        const base = new CoreEngine(request, opts);
        await setupSocket(base);
        const soc = base.socket as net.Socket;
        soc.pause();
        soc.destroy();
        base.abort();
        assert.isUndefined(base.socket);
      });
  
      it('decompress() results to undefined', async () => {
        const base = new CoreEngine(request, opts);
        base.abort();
        const result = await base.decompress(Buffer.from('test'));
        assert.isUndefined(result);
      });
  
      it('_createResponse() results to undefined', async () => {
        const base = new CoreEngine(request, opts);
        base.abort();
        const result = await base._createResponse();
        assert.isUndefined(result);
      });

      it('aborts the request with a signal', async () => {
        const ctrl = new AbortController();
        const base = new CoreEngine(request, { ...opts, signal: ctrl.signal });
        const p = base.send();
        setTimeout(() => {
          ctrl.abort();
        }, 1);
        const result = await p;
        const response = result.response as IErrorResponse;
        assert.equal(response.status, 0);
        assert.equal((response.error as SerializableError).message, 'Request aborted');
      });
    });

    describe('Cleaning up', () => {
      let request: IHttpRequest;

      beforeEach(() => {
        request = {
          url: 'https://domain.com',
          method: 'GET',
        };
      });

      it('_cleanUp()', () => {
        const base = new CoreEngine(request);
        base.redirects = [];
        base.currentResponse = new Response();
        base.currentHeaders = new Headers('content-type: test');
        base._rawBody = Buffer.from('test');
        base.stats = { connectedTime: 123 };
        base._cleanUp();
        assert.deepEqual(base.redirects, []);
        assert.isUndefined(base.currentResponse);
        assert.equal(base.currentHeaders.toString(), '');
        assert.isUndefined(base._rawBody);
        assert.deepEqual(base.stats, {});
      });
    
      it('_cleanUpRedirect()', () => {
        const base = new CoreEngine(request);
        base.redirects.push(new ResponseRedirect());
        base.currentResponse = new Response();
        base.currentHeaders = new Headers('content-type: test');
        base._rawBody = Buffer.from('test');
        base.stats = { connectedTime: 123 };
        base._cleanUpRedirect();
        assert.lengthOf(base.redirects, 1);
        assert.isUndefined(base.currentResponse);
        assert.equal(base.currentHeaders.toString(), '');
        assert.isUndefined(base._rawBody);
        assert.deepEqual(base.stats, {});
      });
    });

    describe('Logger', () => {
      let request: IHttpRequest;

      beforeEach(() => {
        request = {
          url: 'https://domain.com',
          method: 'GET',
        };
      });
    
      it('Sets default logger', () => {
        const base = new CoreEngine(request);
        const result = base.setupLogger({});
        assert.typeOf(result, 'object');
        assert.typeOf(result.info, 'function');
        assert.typeOf(result.log, 'function');
        assert.typeOf(result.warn, 'function');
        assert.typeOf(result.error, 'function');
      });
    
      it('Sets passed logger option', () => {
        const base = new CoreEngine(request);
        const result = base.setupLogger({
          logger: console,
        });
        assert.isTrue(result === console);
      });
    });

    describe('Hosts evaluation', () => {
      it('alters the uri', () => {
        const opts: HttpEngineOptions = {
          timeout: 50000,
          followRedirects: false,
          hosts: [{
            kind: HostRuleKind,
            from: 'domain.com',
            to: 'test.com',
          }],
          logger,
        };
        const request: IHttpRequest = {
          url: `https://domain.com/api/endpoint?query=param`,
          method: 'GET',
        };
        const engine = new CoreEngine(request, opts);
        assert.equal(engine.uri.hostname, 'test.com');
      });
    });

    describe('NTLM authorization', () => {
      it('returns 401 when no credentials', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/auth/ntlm/resource`,
          method: 'GET',
        }, { logger });
        const log = await engine.send();
        const response = log.response as IResponse;
        assert.equal(response.status, 401, 'has the 401 status code')
      });

      it('authenticates the user', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/auth/ntlm/resource`,
          method: 'GET',
        }, {
          logger,
          authorization: [
            {
              kind: RequestAuthorizationKind,
              enabled: true,
              type: 'ntlm',
              valid: true,
              config: {
                username: 'u1',
                password: 'u2',
                domain: 'custom.com',
              },
            }
          ],
        });
        const log = await engine.send();
        const response = log.response as IResponse;
        assert.equal(response.status, 200, 'has the 200 status code')
      });
    });

    describe('Redirects test', () => {
      const opts: HttpEngineOptions = {
        logger,
      };

      describe('Absolute redirects', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${httpPort}/v1/redirect/absolute/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to an absolute URL', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${httpPort}/v1/redirect/absolute/1?test=true`;
          assert.equal(rdr1.url, location, 'has the redirect URL');
          assert.typeOf(rdr1.startTime, 'number', 'has the startTime property');
          assert.typeOf(rdr1.endTime, 'number', 'has the endTime property');
          assert.typeOf(rdr1.timings, 'object', 'has the timings property');
          assert.typeOf(rdr1.response, 'object', 'has the response property');

          const rsp = rdr1.response!;
          assert.equal(rsp.status, 302, 'has the status code');
          assert.equal(rsp.statusText, 'Found', 'has the status text');
          assert.typeOf(rsp.headers, 'string', 'has the headers');
          
          const body = await rsp.readPayload() as Buffer;
          const parsed = JSON.parse(body.toString('utf8'));
          assert.equal(parsed.location, location, 'has the payload');
        });

        it('has the final response', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IResponse;

          const location = `http://localhost:${httpPort}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });

      describe('Relative redirects - relative path', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${httpPort}/v1/redirect/relative/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to a relative URL', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new CoreEngine(baseRequest, opts);
          
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${httpPort}/v1/redirect/relative/1?test=true`;
          assert.equal(rdr1.url, location, 'has the redirect URL');
          assert.typeOf(rdr1.startTime, 'number', 'has the startTime property');
          assert.typeOf(rdr1.endTime, 'number', 'has the endTime property');
          assert.typeOf(rdr1.timings, 'object', 'has the timings property');
          assert.typeOf(rdr1.response, 'object', 'has the response property');

          const rsp = rdr1.response!;
          assert.equal(rsp.status, 302, 'has the status code');
          assert.equal(rsp.statusText, 'Found', 'has the status text');
          assert.typeOf(rsp.headers, 'string', 'has the headers');

          const body = await rsp.readPayload() as Buffer;
          const parsed = JSON.parse(body.toString('utf8'));
          assert.equal(parsed.location, '../relative/1?test=true', 'has the payload');
        });

        it('has the final response', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IResponse;

          const location = `http://localhost:${httpPort}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });

      describe('Relative redirects - root path', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${httpPort}/v1/redirect/relative-root/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to a relative URL', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${httpPort}/v1/redirect/relative/1?test=true`;
          assert.equal(rdr1.url, location, 'has the redirect URL');
          assert.typeOf(rdr1.startTime, 'number', 'has the startTime property');
          assert.typeOf(rdr1.endTime, 'number', 'has the endTime property');
          assert.typeOf(rdr1.timings, 'object', 'has the timings property');
          assert.typeOf(rdr1.response, 'object', 'has the response property');

          const rsp = rdr1.response!;
          assert.equal(rsp.status, 302, 'has the status code');
          assert.equal(rsp.statusText, 'Found', 'has the status text');
          assert.typeOf(rsp.headers, 'string', 'has the headers');


          const body = await rsp.readPayload() as Buffer;
          const parsed = JSON.parse(body.toString('utf8'));
          assert.equal(parsed.location, '/v1/redirect/relative/1?test=true', 'has the payload');
        });

        it('has the final response', async () => {
          const request = new CoreEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IResponse;
          
          const location = `http://localhost:${httpPort}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });
    });

    describe('Sending request parameters', () => {
      const jsonBody = JSON.stringify({ test: true, body: 'some value' });
      let opts: HttpEngineOptions;

      beforeEach(() => {
        opts = {
          timeout: 9500,
          followRedirects: false,
          logger,
          hosts: [{
            kind: HostRuleKind,
            from: 'domain.com',
            to: 'test.com',
          }],
        };
      });

      it('sends query parameters to the server', async () => {
        const info = {
          url: `http://localhost:${httpPort}/v1/get?a=b&c=d`,
          method: 'GET',
          headers: 'x-test: true\naccept: application/json',
        };
        const request = new CoreEngine(info, opts);

        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.deepEqual(body.query, { a: 'b', c: 'd' });
      });

      it('sends headers to the server', async () => {
        const info = {
          url: `http://localhost:${httpPort}/v1/get?a=b&c=d`,
          method: 'GET',
          headers: 'x-test: true\naccept: application/json',
        };
        const request = new CoreEngine(info, opts);
        
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { headers } = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(headers, {
          'x-test': 'true',
          'accept': 'application/json',
          'host': `localhost:${httpPort}`,
          // 'connection': 'keep-alive',
        });
      });

      it('sends the default headers', async () => {
        const options = { ...opts };
        options.defaultHeaders = true;
        const info = {
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
        };
        const request = new CoreEngine(info, options);
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { headers } = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(headers, {
          'user-agent': 'api client',
          'accept': '*/*',
          'host': `localhost:${httpPort}`,
          // 'connection': 'keep-alive',
        });
      });

      it('adds passed accept header value', async () => {
        const options = { ...opts };
        options.defaultHeaders = true;
        options.defaultAccept = 'application/json';
        const info = {
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
        };
        const request = new CoreEngine(info, options);

        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { headers } = JSON.parse(payload.toString('utf8'));
        assert.equal(headers.accept, 'application/json');
      });

      it('adds passed user-agent header value', async () => {
        const options = { ...opts };
        options.defaultHeaders = true;
        options.defaultUserAgent = 'test-run';
        const info = {
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
        };
        const request = new CoreEngine(info, options);
        
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { headers } = JSON.parse(payload.toString('utf8'));
        assert.equal(headers['user-agent'], 'test-run');
      });

      it('adds content-length header when body is send', async () => {
        const info: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/post`,
          method: 'POST',
          headers: 'content-type: application/json',
          payload: jsonBody,
        };
        const request = new CoreEngine(info, opts);

        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { headers } = JSON.parse(payload.toString('utf8'));
        assert.equal(headers['content-length'], '33');
      });

      it('sends the string body with the request', async () => {
        const info: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/post`,
          method: 'POST',
          headers: 'content-type: application/json',
          payload: jsonBody,
        };
        const request = new CoreEngine(info, opts);
        
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { body } = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, jsonBody);
      });

      it('sends the buffer body with the request', async () => {
        const info: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/post`,
          method: 'POST',
          headers: 'content-type: application/json',
          payload: {
            type: 'buffer',
            data: [...Buffer.from(jsonBody)],
          },
        };
        const request = new CoreEngine(info, opts);
        
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { body } = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, jsonBody);
      });

      it('sends the FormData body with the request', async () => {
        const info: IHttpRequest = {
          url: `http://localhost:${httpPort}/v1/post`,
          method: 'POST',
          headers: 'content-type: application/json',
          payload: {
            type: 'formdata',
            data: [{
              isFile: false,
              name: 'a',
              value: 'b',
            }],
          },
        };

        const request = new CoreEngine(info, opts);
        
        const log = await request.send();
        assert.ok(log.response, 'has the response');
        const response = new Response(log.response as IResponse);
        const payload = await response.readPayload() as Buffer;

        const { body } = JSON.parse(payload.toString('utf8'));
        assert.include(body, 'name="a"');
      });
    });

    describe('Status codes', () => {
      it('results with 200', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/code/200`,
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        assert.ok(info.response, 'has the response')
        assert.equal(info.response!.status, 200);
      });

      it('results with 201', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/code/201`,
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        assert.ok(info.response, 'has the response')
        assert.equal(info.response!.status, 201);
      });

      it('results with 202', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/code/202`,
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        assert.ok(info.response, 'has the response')
        assert.equal(info.response!.status, 202);
      });

      it('results with 204', async () => {
        const engine = new CoreEngine({
          url: `http://localhost:${httpPort}/v1/code/204`,
          method: 'GET',
        }, { logger });
        const info = await engine.send();
        assert.ok(info.response, 'has the response')
        assert.equal(info.response!.status, 204);
      });
    });
  });
});
