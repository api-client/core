/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { URL } from 'url';
import { OutgoingHttpHeaders } from 'http';
import { NodeEngine, IArcResponse, ArcResponse, HttpEngineOptions, IHttpRequest } from '../../index';
import { ExpressServer } from '../servers/ExpressServer';

describe('http-engine', () => {
  describe('NodeEngine', () => {
    const server = new ExpressServer();
    let httpPort: number;

    const jsonBody = JSON.stringify({ test: true, body: 'some value' });

    beforeAll(async () => {
      httpPort = await server.startHttp();
    });

    afterAll(async () => {
      await server.stopHttp();
    });

    describe('Basic requests', () => {
      const opts: HttpEngineOptions = {
        timeout: 9500,
        followRedirects: false,
        hosts: [{
          kind: 'ARC#HostRule',
          from: 'domain.com',
          to: 'test.com',
        }],
      };

      describe('_connect()', () => {
        let request: NodeEngine;
        beforeAll(() => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
        });

        it('returns request object', (done) => {
          const result = request._connect(Buffer.from('test'));
          assert.typeOf(result, 'object');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets the startTime', (done) => {
          const result = request._connect(Buffer.from('test'));
          assert.typeOf(request.stats.startTime, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets the messageStart', (done) => {
          const result = request._connect(Buffer.from('test'));
          assert.typeOf(request.stats.messageStart, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });
      });

      describe('_connectHttps()', () => {
        let request: NodeEngine;
        beforeEach(() => {
          const info = {
            url: 'https://google.com',
            method: 'GET',
            headers: 'Host: localhost\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
        });

        it('returns an object', (done) => {
          const result = request._connectHttps(request.uri);
          assert.typeOf(result, 'object');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets startTime', (done) => {
          const result = request._connectHttps(request.uri);
          assert.typeOf(request.stats.startTime, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets messageStart', (done) => {
          const result = request._connectHttps(request.uri);
          assert.typeOf(request.stats.messageStart, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });
      });

      describe('_connectHttp()', () => {
        let request: NodeEngine;
        beforeAll(() => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
        });

        it('returns an object', (done) => {
          const result = request._connectHttp(request.uri);
          assert.typeOf(result, 'object');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets the startTime', (done) => {
          const result = request._connectHttp(request.uri);
          assert.typeOf(request.stats.startTime, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });

        it('sets the messageStart', (done) => {
          const result = request._connectHttp(request.uri);
          assert.typeOf(request.stats.messageStart, 'number');
          result.once('end', () => done());
          result.once('error', () => done());
          result.destroy();
        });
      });

      describe('_prepareMessage()', () => {
        it('returns a promise resolved to a Buffer', async () => {
          const info: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/post`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: {
              type: 'buffer',
              data: [...Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])],
            },
          };
          const request = new NodeEngine(info, opts);
          const result = await request._prepareMessage();
          assert.isTrue(result instanceof Uint8Array);
        });

        it('ignores payload for GET requests', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          const request = new NodeEngine(info, opts);
          const result = await request._prepareMessage();
          assert.isUndefined(result);
        });

        it('adds the content length header', async () => {
          const info: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/post`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: {
              type: 'buffer',
              data: [...Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])],
            },
          };
          const request = new NodeEngine(info, opts);
          await request._prepareMessage();

          const headers = request.sentRequest.headers as string;
          assert.include(headers, 'content-length: 9');
        });

        it('adds the default headers', async () => {
          const info: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/post`,
            method: 'POST',
            headers: 'content-type: text/plain',
            payload: {
              type: 'buffer',
              data: [...Buffer.from([0x74, 0x65, 0x73, 0x74, 0x0a, 0x74, 0x65, 0x73, 0x74])],
            },
          };
          const request = new NodeEngine(info, {
            defaultHeaders: true,
          });
          await request._prepareMessage();
          const headers = request.sentRequest.headers as string;

          assert.include(headers, 'user-agent: api client', 'user-agent is set');
          assert.include(headers, 'accept: */*', 'accept is set');
        });
      });

      describe('_createGenericOptions()', () => {
        let request: NodeEngine;
        let url: string;
        beforeAll(() => {
          url = 'https://api.com:5123/path?qp1=v1&qp2=v2#test'
          const info: IHttpRequest = {
            url,
            method: 'POST',
            headers: 'Host: localhost\nContent-Length: 3\nx-test: true',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
        });

        it('Returns an object', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.typeOf(result, 'object');
        });

        it('Sets protocol', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.equal(result.protocol, 'https:');
        });

        it('Sets host', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.equal(result.host, 'api.com');
        });

        it('Sets port', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.equal(result.port, '5123');
        });

        it('Sets search parameters with path', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.equal(result.path, '/path?qp1=v1&qp2=v2');
        });

        it('Sets method', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.equal(result.method, 'POST');
        });

        it('Sets headers', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          assert.typeOf(result.headers, 'object');
        });

        it('Sets header #1', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          const headers = result.headers as OutgoingHttpHeaders;
          assert.equal(headers.Host, 'localhost');
        });

        it('Sets header #2', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          const headers = result.headers as OutgoingHttpHeaders;
          assert.equal(headers['Content-Length'], '3');
        });

        it('Sets header #3', () => {
          const uri = new URL(url);
          const result = request._createGenericOptions(uri);
          const headers = result.headers as OutgoingHttpHeaders;
          assert.equal(headers['x-test'], 'true');
        });
      });

      describe('_addSslOptions()', () => {
        let request: NodeEngine;
        let options: any;
        beforeAll(() => {
          const info: IHttpRequest = {
            url: 'https://api.com:5123/path?qp1=v1&qp2=v2#test',
            method: 'POST',
            headers: 'Host: localhost\nContent-Length: 3\nx-test: true',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
          options = {};
        });

        it('Sets HTTP agent', () => {
          request._addSslOptions(options);
          assert.typeOf(options.agent, 'object');
        });

        it('Adds SSL certificate ignore options', () => {
          request.opts.validateCertificates = true;
          request._addSslOptions(options);
          assert.typeOf(options.checkServerIdentity, 'function');
        });

        it('Adds SSL certificate validation options', () => {
          request.opts.validateCertificates = false;
          request._addSslOptions(options);
          assert.isFalse(options.rejectUnauthorized);
          assert.isFalse(options.requestOCSP);
        });
      });

      describe('Timings setting', () => {
        let request: NodeEngine;
        beforeAll(() => {
          const info: IHttpRequest = {
            url: 'https://api.com:5123/path?qp1=v1&qp2=v2#test',
            method: 'POST',
            headers: 'Host: localhost\nContent-Length: 3\nx-test: true',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
        });

        it('sets the lookupTime', () => {
          request._lookupHandler();
          assert.typeOf(request.stats.lookupTime, 'number');
        });

        it('sets the secureConnectedTime', () => {
          request._secureConnectHandler();
          assert.typeOf(request.stats.secureConnectedTime, 'number');
        });

        it('sets the secureConnectedTime', () => {
          request._connectHandler();
          assert.typeOf(request.stats.connectedTime, 'number');
        });

        it('sets the secureStartTime', () => {
          request._connectHandler();
          assert.typeOf(request.stats.secureStartTime, 'number');
        });

        it('sets the sentTime', () => {
          request._sendEndHandler();
          assert.typeOf(request.stats.sentTime, 'number');
        });

        it('sets the sentTime only once', (done) => {
          request._sendEndHandler();
          const t1 = request.stats.sentTime;
          setTimeout(() => {
            request._sendEndHandler();
            const t2 = request.stats.sentTime;
            assert.equal(t1, t2);
            done();
          });
        });
      });

      describe('Events', () => {
        let request: NodeEngine;

        it('dispatches the "loadstart" event', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
          let called = false;
          request.once('loadstart', () => {
            called = true;
          });
          await request.send();
          assert.isTrue(called);
        });

        it('dispatches the "firstbyte" event', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
          let called = false;
          request.once('firstbyte', () => {
            called = true;
          });
          await request.send();
          assert.isTrue(called);
        });

        it('dispatches the "loadend" event', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
          let called = false;
          request.once('loadend', () => {
            called = true;
          });
          await request.send();
          assert.isTrue(called);
        });

        it('dispatches the "headersreceived" event', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'Host: test.com\nContent-Length: 0',
            payload: 'abc',
          };
          request = new NodeEngine(info, opts);
          let called = false;
          request.once('headersreceived', () => {
            called = true;
          });
          await request.send();
          assert.isTrue(called);
        });
      });

      describe('Sending request parameters', () => {
        it('sends query parameters to the server', async () => {
          const info = {
            url: `http://localhost:${httpPort}/v1/get?a=b&c=d`,
            method: 'GET',
            headers: 'x-test: true\naccept: application/json',
          };
          const request = new NodeEngine(info, opts);

          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
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
          const request = new NodeEngine(info, opts);
          
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
          const payload = await response.readPayload() as Buffer;

          const { headers } = JSON.parse(payload.toString('utf8'));
          assert.deepEqual(headers, {
            'x-test': 'true',
            'accept': 'application/json',
            'host': `localhost:${httpPort}`,
            'connection': 'close',
          });
        });

        it('sends the default headers', async () => {
          const options = { ...opts };
          options.defaultHeaders = true;
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          const request = new NodeEngine(info, options);
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
          const payload = await response.readPayload() as Buffer;

          const { headers } = JSON.parse(payload.toString('utf8'));
          assert.deepEqual(headers, {
            'user-agent': 'api client',
            'accept': '*/*',
            'host': `localhost:${httpPort}`,
            'connection': 'close',
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
          const request = new NodeEngine(info, options);

          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
          const payload = await response.readPayload() as Buffer;

          const { headers } = JSON.parse(payload.toString('utf8'));
          assert.equal(headers.accept, 'application/json');
        });

        it('adds passed accept header value', async () => {
          const options = { ...opts };
          options.defaultHeaders = true;
          options.defaultUserAgent = 'test-run';
          const info = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          const request = new NodeEngine(info, options);
          
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
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
          const request = new NodeEngine(info);

          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
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
          const request = new NodeEngine(info);
          
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
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
          const request = new NodeEngine(info);
          
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
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

          const request = new NodeEngine(info);
          
          const log = await request.send();
          assert.ok(log.response, 'has the response');
          const response = new ArcResponse(log.response as IArcResponse);
          const payload = await response.readPayload() as Buffer;

          const { body } = JSON.parse(payload.toString('utf8'));
          assert.include(body, 'name="a"');
        });
      });
    });
  });
});
