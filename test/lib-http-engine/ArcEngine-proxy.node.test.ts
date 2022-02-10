/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { ArcEngine, HttpEngineOptions, IHttpRequest, IArcResponse, ArcResponse, DummyLogger, RequestTime, ResponseRedirect } from '../../index.js';
import getConfig from '../helpers/getSetup.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('ArcEngine', () => {
    describe('Proxying requests', () => {
      const httpOpts: HttpEngineOptions = {
        logger,
        validateCertificates: false,
      };
      const httpsOpts: HttpEngineOptions = {
        logger,
        validateCertificates: false,
      };
      let baseHttpHostname: string;
      let baseHttpsHostname: string;

      before(async () => {
        const cnf = await getConfig();
        httpOpts.proxy = `127.0.0.1:${cnf.proxyHttpPort}`;
        httpsOpts.proxy = `https://127.0.0.1:${cnf.proxyHttpsPort}`;
        baseHttpHostname = `localhost:${cnf.httpPort}`;
        baseHttpsHostname = `localhost:${cnf.httpsPort}`;
      });

      describe('http proxy', () => {
        it('reads from an HTTP server', async () => {
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpHostname}`, 'sets the destination host header');
          // the definite proof that the request gone through the proxy, set by the proxy.
          assert.equal(body.headers.via, '1.1 localhost', 'sets the proxy header');
          assert.deepEqual(body.query, { a: 'b' }, 'passes the query parameters');
          assert.equal(body.method, 'GET', 'passes the method');
          assert.equal(body.protocol, 'http', 'uses the http protocol');

          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.isAtLeast(timings.connect, 0, 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.isAtLeast(timings.dns, 0, 'has the timings.dns');
          assert.strictEqual(timings.ssl, -1, 'has the timings.ssl');
        });

        it('posts to an HTTP server', async () => {
          const sentBody = JSON.stringify({ test: true });
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?x=y`,
            method: 'POST',
            headers: `content-type: application/json\nx-custom: true`,
            payload: sentBody,
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers['content-type'], 'application/json', 'passes the content type');
          assert.equal(body.headers.host, `${baseHttpHostname}`, 'sets the destination host header');
          // the definite proof that the request gone through the proxy, set by the proxy.
          assert.equal(body.headers.via, '1.1 localhost', 'sets the proxy header');
          
          assert.deepEqual(body.query, { x: 'y' }, 'passes the query parameters');
          assert.equal(body.method, 'POST', 'passes the method');
          assert.equal(body.protocol, 'http', 'uses the http protocol');
          assert.equal(body.body, sentBody, 'passes the body');

          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.isAtLeast(timings.connect, 0, 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.strictEqual(timings.ssl, -1, 'has the timings.ssl');
        });

        it('reads from an HTTPS server', async () => {
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?o=p`,
            method: 'GET',
            headers: `x-custom: true`,
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);

          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpsHostname}`, 'sets the destination host header');
          assert.deepEqual(body.query, { o: 'p' }, 'passes the query parameters');
          assert.equal(body.method, 'GET', 'passes the method');
          assert.equal(body.protocol, 'https', 'uses the http protocol');
          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.typeOf(timings.connect, 'number', 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('posts to an HTTPS server', async () => {
          const sentBody = JSON.stringify({ test: true });
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?o=p`,
            method: 'POST',
            headers: `content-type: application/json\nx-custom: true`,
            payload: sentBody,
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers['content-type'], 'application/json', 'passes the content type');
          assert.equal(body.headers.host, `${baseHttpsHostname}`, 'sets the destination host header');
          assert.deepEqual(body.query, { o: 'p' }, 'passes the query parameters');
          assert.equal(body.method, 'POST', 'passes the method');
          assert.equal(body.protocol, 'https', 'uses the http protocol');
          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');
          assert.equal(body.body, sentBody, 'passes the body');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.typeOf(timings.connect, 'number', 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('uses the proxy for redirects', async () => {
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/redirect/relative/2`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');

          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
          
          const redirects = log.redirects!.map(i => new ResponseRedirect(i))
          const [redirect] = redirects;
          
          const buffer = await redirect.response!.readPayload();
          const body = JSON.parse(buffer!.toString());

          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpHostname}`, 'sets the destination host header');
          // the definite proof that the request gone through the proxy, set by the proxy.
          assert.equal(body.headers.via, '1.1 localhost', 'sets the proxy header');
        });

        it('authenticates with the proxy', async () => {
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const localOptions = { ...httpOpts, proxyUsername: 'proxy-name', proxyPassword: 'proxy-password' };
          const request = new ArcEngine(config, localOptions);
          
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          // this header is added by the proxy to the target request on the http connection
          // when the `proxy-authorization` is set and has valid values.
          assert.equal(body.headers['x-proxy-authenticated'], 'true', 'passes request headers');
        });

        it('handles proxy authorization errors', async () => {
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const localOptions = { ...httpOpts, proxyUsername: 'some-name' };
          const request = new ArcEngine(config, localOptions);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 401, 'has the response status code');
          assert.strictEqual(response.statusText, 'Unauthorized', 'has the response status text');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.error, 'the proxy credentials are invalid', 'has the error message');
        });
      });

      describe('https proxy', () => {
        it('reads from an HTTP server', async () => {
          const config: IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const request = new ArcEngine(config, httpsOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);

          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);

          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpHostname}`, 'sets the destination host header');
          // the definite proof that the request gone through the proxy, set by the proxy.
          assert.equal(body.headers.via, '1.1 localhost', 'sets the proxy header');
          assert.deepEqual(body.query, { a: 'b' }, 'passes the query parameters');
          assert.equal(body.method, 'GET', 'passes the method');
          assert.equal(body.protocol, 'http', 'uses the http protocol');

          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.isAtLeast(timings.connect, 0, 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.isAtLeast(timings.dns, 0, 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('posts to an HTTP server', async () => {
          const sentBody = JSON.stringify({ test: true });
          const config:IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?x=y`,
            method: 'POST',
            headers: `content-type: application/json\nx-custom: true`,
            payload: sentBody,
          };
          const request = new ArcEngine(config, httpsOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers['content-type'], 'application/json', 'passes the content type');
          assert.equal(body.headers.host, `${baseHttpHostname}`, 'sets the destination host header');
          // the definite proof that the request gone through the proxy, set by the proxy.
          assert.equal(body.headers.via, '1.1 localhost', 'sets the proxy header');

          assert.deepEqual(body.query, { x: 'y' }, 'passes the query parameters');
          assert.equal(body.method, 'POST', 'passes the method');
          assert.equal(body.protocol, 'http', 'uses the http protocol');
          assert.equal(body.body, sentBody, 'passes the body');

          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');
          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.isAtLeast(timings.connect, 0, 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('reads from an HTTPS server', async () => {
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?o=p`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const request = new ArcEngine(config, httpsOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);

          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);

          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpsHostname}`, 'sets the destination host header');
          assert.deepEqual(body.query, { o: 'p' }, 'passes the query parameters');
          assert.equal(body.method, 'GET', 'passes the method');
          assert.equal(body.protocol, 'https', 'uses the http protocol');
          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');

          const timings = response.timings as RequestTime;
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.isAtLeast(timings.connect, 0, 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('posts to an HTTPS server', async () => {
          const sentBody = JSON.stringify({ test: true });
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?o=p`,
            method: 'POST',
            headers: `content-type: application/json\nx-custom: true`,
            payload: sentBody,
          };
          const request = new ArcEngine(config, httpsOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');
          assert.isNotEmpty(response.headers, 'has the response headers');
          assert.ok(response.payload, 'has the payload');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);

          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers['content-type'], 'application/json', 'passes the content type');
          assert.equal(body.headers.host, `${baseHttpsHostname}`, 'sets the destination host header');
          assert.deepEqual(body.query, { o: 'p' }, 'passes the query parameters');
          assert.equal(body.method, 'POST', 'passes the method');
          assert.equal(body.protocol, 'https', 'uses the http protocol');
          assert.isAtLeast(response.loadingTime, body.delay, 'has the loading time');
          assert.equal(body.body, sentBody, 'passes the body');

          const timings = response.timings as RequestTime;
          
          assert.strictEqual(timings.blocked, 0, 'has the timings.blocked');
          assert.typeOf(timings.connect, 'number', 'has the timings.connect');
          assert.isAtLeast(timings.receive, 0, 'has the timings.receive');
          assert.isAtLeast(timings.send, 0, 'has the timings.send');
          assert.isAtLeast(response.loadingTime, timings.wait, 'has the timings.wait');
          assert.typeOf(timings.dns, 'number', 'has the timings.dns');
          assert.isAtLeast(timings.ssl!, 0, 'has the timings.ssl');
        });

        it('uses the proxy for redirects', async () => {
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/redirect/relative/2`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const request = new ArcEngine(config, httpOpts);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          
          const redirects = log.redirects!.map(i => new ResponseRedirect(i))

          assert.typeOf(redirects, 'array', 'has the redirects');
          assert.lengthOf(redirects, 2, 'has both redirects');
          const [redirect] = redirects;
          
          const buffer = await redirect.response!.readPayload();
          const body = JSON.parse(buffer!.toString());

          assert.equal(body.headers['x-custom'], 'true', 'passes request headers');
          assert.equal(body.headers.host, `${baseHttpsHostname}`, 'sets the destination host header');
        });

        it('authenticates with the proxy', async () => {
          const config: IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const localOptions = { ...httpOpts, proxyUsername: 'proxy-name', proxyPassword: 'proxy-password' };
          const request = new ArcEngine(config, localOptions);
          const log = await request.send();
          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 200, 'has the response status code');
          assert.strictEqual(response.statusText, 'OK', 'has the response status text');

          // there's no way to tell that the proxy server actually performed the authentication
          // because the connection is over SSL. Just the 200 is enough since we are controlling the server,
        });

        it('handles proxy authorization errors (HTTP)', async () => {
          const config:IHttpRequest = {
            url: `http://${baseHttpHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const localOptions = { ...httpOpts, proxyUsername: 'some-name' };
          const request = new ArcEngine(config, localOptions);
          const log = await request.send();

          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 401, 'has the response status code');
          assert.strictEqual(response.statusText, 'Unauthorized', 'has the response status text');
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.error, 'the proxy credentials are invalid', 'has the error message');
        });

        it('handles proxy authorization errors (HTTPS)', async () => {
          const config:IHttpRequest = {
            url: `https://${baseHttpsHostname}/v1/get?a=b`,
            method: 'GET',
            headers: 'x-custom: true',
          };
          const localOptions = { ...httpOpts, proxyUsername: 'some-name' };
          const request = new ArcEngine(config, localOptions);
          const log = await request.send();

          assert.ok(log, 'has the ARC response');
          const response = new ArcResponse(log.response as IArcResponse);
          assert.strictEqual(response.status, 401, 'has the response status code');
          assert.strictEqual(response.statusText, 'Unauthorized', 'has the response status text');
          
          const payload = await response.readPayload() as Buffer;
          const bodyStr = payload.toString('utf8');
          const body = JSON.parse(bodyStr);
          
          assert.equal(body.error, 'the proxy credentials are invalid', 'has the error message');
        });
      });
    });
  });
});
