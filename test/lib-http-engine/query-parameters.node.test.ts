import { assert } from 'chai';
import { NodeEngine, IArcResponse, ArcResponse, IHttpRequest, DummyLogger, HttpEngineOptions } from '../../index.js';
import { ExpressServer } from '../servers/ExpressServer.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('NodeEngine', () => {
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

    describe('query parameters processing', () => {
      let requestData: IHttpRequest;

      beforeEach(() => {
        requestData = {
          url: `http://localhost:${port}/v1/query-params/`,
          method: 'GET',
          headers: '',
        };
      });

      it('sends a query parameter', async () => {
        const r: IHttpRequest = { ...requestData };
        r.url += '?a=b';
        const request = new NodeEngine(r, opts);
        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.deepEqual(body, { params: { query: { a: 'b' } } });
      });

      it('sends a multiple query parameters', async () => {
        const r = { ...requestData };
        r.url += '?a=b&c=1&d=true';
        const request = new NodeEngine(r, opts);
        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
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
        const request = new NodeEngine(r, opts);
        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
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
        const request = new NodeEngine(r, opts);
        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
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
        const request = new NodeEngine(r, opts);
        const log = await request.send();
        const response = new ArcResponse(log.response as IArcResponse);
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

      beforeEach(() => {
        request = {
          url: `http://localhost:${port}/v1/headers/`,
          method: 'GET',
          headers: '',
        };
      });

      it('sends a header', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true';
        const er = new NodeEngine(r, opts);
        const log = await er.send();
        const response = new ArcResponse(log.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true');
      });

      it('sends multiple headers', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true\nAccept-CH: DPR, Viewport-Width';
        const er = new NodeEngine(r, opts);
        const log = await er.send();
        const response = new ArcResponse(log.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true');
        assert.equal(body.headers['accept-ch'], 'DPR, Viewport-Width');
      });

      it('sends array headers', async () => {
        const r = { ...request };
        r.headers = 'x-test-header: true, x-value';
        const er = new NodeEngine(r, opts);
        const log = await er.send();
        const response = new ArcResponse(log.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;
        const body = JSON.parse(payload.toString('utf8'));
        assert.equal(body.headers['x-test-header'], 'true, x-value');
      });
    });
  });
});
