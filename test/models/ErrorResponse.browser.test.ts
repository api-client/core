import { assert } from '@esm-bundle/chai';
import { Kind as HttpResponseKind, HttpResponse } from '../../src/models/HttpResponse.js';
import { ErrorResponse, IErrorResponse } from '../../src/models/ErrorResponse.js';
import { ErrorResponse as LegacyErrorResponse } from '../../src/models/legacy/request/ArcResponse.js';

describe('Models', () => {
  describe('ErrorResponse', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new ErrorResponse();
          assert.equal(result.kind, HttpResponseKind, 'sets the kind property');
          assert.equal(result.status, 0, 'sets the status property');
          assert.equal(result.error.message, 'Unknown error', 'sets the error');
          assert.isUndefined(result.statusText,'has no statusText property');
          assert.isUndefined(result.headers, 'has no headers property');
          assert.isUndefined(result.payload, 'has no payload property');
        });
      });

      describe('From schema initialization', () => {
        let base: IErrorResponse;
        beforeEach(() => {
          base = {
            kind: HttpResponseKind,
            status: 0,
            error: 'test',
          }
        });

        it('sets the kind', () => {
          const init: IErrorResponse = { ...base };
          const response = new ErrorResponse(init);
          assert.equal(response.kind, HttpResponseKind);
        });

        it('sets the status', () => {
          const init: IErrorResponse = { ...base, ...{ status: 200 }};
          const response = new ErrorResponse(init);
          assert.equal(response.status, 200);
        });

        it('sets the error', () => {
          const init: IErrorResponse = { ...base };
          const response = new ErrorResponse(init);
          assert.equal(response.error.message, 'test');
        });

        it('sets the parent properties', () => {
          const init: IErrorResponse = { ...base, ...{
            status: 200,
            statusText: 'hello',
            headers: 'content-type: test',
            payload: 'test',
          }};
          const response = new ErrorResponse(JSON.stringify(init));
          assert.equal(response.status, 200, 'has the status');
          assert.equal(response.statusText, 'hello', 'has the statusText');
          assert.equal(response.headers, 'content-type: test', 'has the headers');
          assert.equal(response.payload, 'test', 'has the payload');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const response = new ErrorResponse();
        const result = response.toJSON();
        assert.equal(result.kind, HttpResponseKind);
      });

      it('serializes the error', () => {
        const response = ErrorResponse.fromError('test');
        const result = response.toJSON();
        assert.equal((result.error as Error).message, 'test');
      });

      it('serializes the parent values', () => {
        const init: IErrorResponse = {
          status: 200,
          statusText: 'hello',
          headers: 'content-type: test',
          payload: 'test',
          error: 'test'
        };
        const response = new ErrorResponse(init);
        const result = response.toJSON();
        assert.equal(result.status, 200);
        assert.equal(result.statusText, 'hello');
      });
    });

    describe('ErrorResponse.isErrorResponse()', () => {
      it('returns true when is an error response', () => {
        const response = ErrorResponse.fromError('test');
        assert.isTrue(ErrorResponse.isErrorResponse(response.toJSON()));
      });

      it('returns false otherwise', () => {
        const response = HttpResponse.fromValues(200);
        assert.isFalse(ErrorResponse.isErrorResponse(response.toJSON()));
      });
    });

    describe('ErrorResponse.fromLegacy()', () => {
      it('sets the kind', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.kind, HttpResponseKind);
      });

      it('sets the status', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.status, 200);
      });

      it('sets the default status', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: undefined,
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.status, 0);
      });

      it('sets the error', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.error.message, 'test');
      });

      it('sets the default error', async () => {
        const init: LegacyErrorResponse = {
          error: undefined,
          status: 100,
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.error.message, 'Unknown error');
      });

      it('sets the headers', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
          headers: 'x-test: true'
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.headers, 'x-test: true');
      });

      it('sets the statusText', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
          statusText: 'Super OK'
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.statusText, 'Super OK');
      });

      it('sets the payload from a string', async () => {
        const init: LegacyErrorResponse = {
          error: new Error('test'),
          status: 200,
          payload: 'I am an error'
        };
        const response = await ErrorResponse.fromLegacy(init);
        assert.equal(response.payload, 'I am an error');
      });
    });
  });
});
