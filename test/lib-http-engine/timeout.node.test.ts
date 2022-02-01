/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { NodeEngine, DummyLogger, HttpEngineOptions, ErrorResponse, IErrorResponse } from '../../index.js';
import getConfig from '../helpers/getSetup.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('NodeEngine', () => {
    describe('Timeout test', () => {
      const opts: HttpEngineOptions = {
        logger,
        timeout: 60,
        followRedirects: false,
      };
  
      let port: number;

      before(async () => {
        const cnf = await getConfig();
        port = cnf.httpPort;
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
