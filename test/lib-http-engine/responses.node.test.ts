/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { Headers, NodeEngine, IArcResponse, ArcResponse, DummyLogger, HttpEngineOptions } from '../../index.js';
import { ExpressServer } from '../servers/ExpressServer.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('Electron request', () => {
    const opts: HttpEngineOptions = {
      logger,
    };

    const server = new ExpressServer();
    let port:number;

    before(async () => {
      await server.start();
      port = server.httpPort as number;
    });

    after(async () => {
      await server.stop();
    });

    describe('Responses test', () => {
      [
        ['Image - jpeg', `http://localhost:{port}/v1/image/jpeg`, 'image/jpeg'],
        ['Image - png', `http://localhost:{port}/v1/image/png`, 'image/png'],
        ['Image - svg', `http://localhost:{port}/v1/image/svg`, 'image/svg+xml'],
        ['Image - webp', `http://localhost:{port}/v1/image/webp`, 'image/webp'],
        ['html', `http://localhost:{port}/v1/response/html`, 'text/html; charset=UTF-8'],
        ['json', `http://localhost:{port}/v1/response/json`, 'application/json'],
        ['xml', `http://localhost:{port}/v1/response/xml`, 'application/xml'],
        ['Bytes', `http://localhost:{port}/v1/response/bytes/120`, 'application/octet-stream'],
      ].forEach((item) => {
        const [name, url, mime] = item;
        it(`reads the response: ${name}`, async () => {
          const request = new NodeEngine({
            url: url.replace('{port}', String(port)),
            method: 'GET',
          }, opts);
          const log = await request.send();
          const response = new ArcResponse(log.response as IArcResponse);
          const body = await response.readPayload() as Buffer;
          assert.ok(body, 'has the payload');
          const headers = new Headers(response.headers);
          assert.equal(headers.get('content-type'), mime, 'has the content type');
          assert.equal(headers.get('content-length'), String(body.length));
        });
      });
    });

    describe('Compression test', () => {
      [
        ['brotli', `http://localhost:{port}/v1/compression/brotli`, 'br'],
        ['deflate', `http://localhost:{port}/v1/compression/deflate`, 'deflate'],
        ['gzip', `http://localhost:{port}/v1/compression/gzip`, 'gzip'],
      ].forEach((item) => {
        const [name, url, enc] = item;
        it(`reads the compressed response: ${name}`, async () => {
          const request = new NodeEngine({
            url: url.replace('{port}', String(port)),
            method: 'GET',
            headers: `accept-encoding: ${enc}`,
          }, opts);
          const log = await request.send();
          const response = new ArcResponse(log.response as IArcResponse);
          const body = await response.readPayload() as Buffer;
          assert.ok(body, 'has the payload');
          const headers = new Headers(response.headers);
          assert.equal(headers.get('content-encoding'), enc, 'has the content-encoding in the response');

          const data = JSON.parse(body.toString());
          assert.typeOf(data, 'array', 'has the response body');
        });
      });
    });

    describe('Timings tests', () => {
      it('has the stats object', async () => {
        const request = new NodeEngine({
          url: `http://localhost:${port}/v1/get`,
          method: 'GET',
        }, opts);

        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);

        assert.typeOf(response.timings!, 'object');
      });

      ['connect', 'receive', 'send', 'wait', 'dns', 'ssl'].forEach((prop) => {
        it(`has the response.timings.${prop} property`, async () => {
          const request = new NodeEngine({
            url: `http://localhost:${port}/v1/get`,
            method: 'GET',
          }, opts);

          const log = await request.send();
          const response = new ArcResponse(log.response as IArcResponse);
          // @ts-ignore
          assert.typeOf(response.timings![prop], 'number');
        });
      });

      it('has stats time for ssl', async () => {
        const request = new NodeEngine({
          url: 'https://www.google.com/',
          method: 'GET',
        }, opts);

        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
        assert.isAbove(response.timings!.ssl, -1);
      });
    });

    describe('Request size', () => {
      it('has the request size value', async () => {
        const request = new NodeEngine({
          url: `http://localhost:${port}/v1/get`,
          method: 'GET',
        }, opts);
        
        const log = await request.send();
        assert.equal(log.size!.request, 65);
      });

      it('has the response size value', async () => {
        const request = new NodeEngine({
          url: `http://localhost:${port}/v1/get`,
          method: 'GET',
        }, opts);
        
        const log = await request.send();
        assert.equal(log.size!.response, 238);
      });
    });
  });
});
