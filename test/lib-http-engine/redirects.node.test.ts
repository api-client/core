/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { NodeEngine, ISentRequest, IArcResponse, ResponseRedirect, IHttpRequest, DummyLogger, HttpEngineOptions } from '../../index.js';
import getConfig from '../helpers/getSetup.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('NodeEngine', () => {
    const opts: HttpEngineOptions = {
      logger,
    };

    let port: number;

    before(async () => {
      const cnf = await getConfig();
      port = cnf.httpPort;
    });

    describe('Redirects test', () => {
      describe('Absolute redirects', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${port}/v1/redirect/absolute/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to an absolute URL', async () => {
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${port}/v1/redirect/absolute/1?test=true`;
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
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IArcResponse;

          const location = `http://localhost:${port}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });

      describe('Relative redirects - relative path', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${port}/v1/redirect/relative/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to a relative URL', async () => {
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new NodeEngine(baseRequest, opts);
          
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${port}/v1/redirect/relative/1?test=true`;
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
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IArcResponse;

          const location = `http://localhost:${port}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });

      describe('Relative redirects - root path', () => {
        let baseRequest: IHttpRequest;

        beforeEach(() => {
          baseRequest = {
            url: `http://localhost:${port}/v1/redirect/relative-root/2?test=true`,
            method: 'GET',
          };
        });

        it('redirects to a relative URL', async () => {
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();
          assert.typeOf(log.redirects!, 'array', 'has the redirects');
          assert.lengthOf(log.redirects!, 2, 'has both redirects');
        });

        it('has the redirects data', async () => {
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();
          const redirects = log.redirects!.map(i => new ResponseRedirect(i));
          const rdr1 = redirects[0]!;

          const location = `http://localhost:${port}/v1/redirect/relative/1?test=true`;
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
          const request = new NodeEngine(baseRequest, opts);
          const log = await request.send();

          const transport = log.request as ISentRequest;
          const response = log.response as IArcResponse;
          
          const location = `http://localhost:${port}/v1/get?test=true`;
          assert.equal(transport.url, location, 'transport request has the final URL');
          assert.equal(response.status, 200, 'has the status code');
        });
      });
    });
  });
});
