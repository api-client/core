/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { NodeEngine, DummyLogger, HttpEngineOptions, ErrorResponse, IErrorResponse } from '../../index.js';
import { ExpressServer } from '../servers/ExpressServer.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('NodeEngine', () => {
    describe('Timeout test', () => {
      const opts: HttpEngineOptions = {
        logger,
        timeout: 60,
        followRedirects: false,
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

      it('timeouts the request from the class options', async () => {
        const request = new NodeEngine({
          url: `http://localhost:${port}/v1/delay/1000`,
          method: 'GET',
        }, opts);

        const log = await request.send();
        const response = new ErrorResponse(log.response as IErrorResponse);
        assert.equal(response.error.message, 'An operation timed out');
      });
    });
  });
});
