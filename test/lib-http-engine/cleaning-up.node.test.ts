/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai';
import { Headers, NodeEngine, DummyLogger, HttpEngineOptions, ArcResponse, ResponseRedirect } from '../../index.js';

const logger = new DummyLogger();

describe('http-engine', () => {
  describe('NodeEngine', () => {
    describe('cleaning up', () => {
      const opts: HttpEngineOptions = {
        logger,
      };

      it('_cleanUp()', () => {
        const base = new NodeEngine({
          method: 'GET',
          url: 'https://domain.com',
        }, opts);
        base.redirects = [];
        base.currentResponse = new ArcResponse();
        base.currentResponse.loadingTime = 1;
        base.currentResponse.status = 0;

        base.currentHeaders = new Headers('content-type: test');
        base._rawBody = Buffer.from('test');
        
        base.stats = { sentTime: 123, }
        base._cleanUp();
        assert.equal(base.redirects.length, 0);
        assert.isUndefined(base.currentResponse);
        assert.equal(base.currentHeaders.toString(), '');
        assert.isUndefined(base._rawBody);
        assert.deepEqual(base.stats, {});
      });

      it('_cleanUpRedirect()', () => {
        const base = new NodeEngine({
          method: 'GET',
          url: 'https://domain.com',
        }, opts);
        base.redirects = [new ResponseRedirect()];
        base.currentResponse = new ArcResponse();
        base.currentResponse.loadingTime = 1;
        base.currentResponse.status = 0;

        base.currentHeaders = new Headers('content-type: test');
        base._rawBody = Buffer.from('test');

        base.stats = { sentTime: 123, }

        base._cleanUpRedirect();
        assert.equal(base.redirects.length, 1);
        assert.isUndefined(base.currentResponse);
        assert.equal(base.currentHeaders.toString(), '');
        assert.isUndefined(base._rawBody);
        assert.deepEqual(base.stats, {});
      });
    });
  });
});
