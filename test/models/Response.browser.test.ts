import { assert } from '@esm-bundle/chai';
import { Kind as ResponseKind, Response, IResponse } from '../../src/models/Response.js';
import { ErrorResponse } from '../../src/models/ErrorResponse.js';
import { Kind as ResponseAuthorizationKind } from '../../src/models/ResponseAuthorization.js';
import { ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Models', () => {
  describe('Response', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new Response();
          assert.equal(result.kind, ResponseKind, 'sets the kind property');
          assert.equal(result.status, 0, 'sets the status property');
          assert.equal(result.loadingTime, 0, 'sets the loadingTime property');
          assert.isUndefined(result.statusText,'has no statusText property');
          assert.isUndefined(result.headers, 'has no headers property');
          assert.isUndefined(result.payload, 'has no payload property');
        });
      });

      describe('From schema initialization', () => {
        let base: IResponse;
        beforeEach(() => {
          base = {
            kind: ResponseKind,
            status: 0,
            loadingTime: 0,
          }
        });

        it('sets the kind', () => {
          const init: IResponse = { ...base };
          const response = new Response(init);
          assert.equal(response.kind, ResponseKind);
        });

        it('sets the status', () => {
          const init: IResponse = { ...base, ...{ status: 200 }};
          const response = new Response(init);
          assert.equal(response.status, 200);
        });

        it('sets the loadingTime', () => {
          const init: IResponse = { ...base, ...{ loadingTime: 200 }};
          const response = new Response(init);
          assert.equal(response.loadingTime, 200);
        });

        it('sets the timings', () => {
          const init: IResponse = { ...base, ...{ 
            timings: {
              blocked: 1,
              connect: 2,
              dns: 3,
              receive: 4,
              send: 5,
              wait: 6,
              ssl: 7,
            },
          }};
          const response = new Response(init);
          assert.typeOf(response.timings, 'object');
          assert.equal(response.timings.blocked, 1);
          assert.equal(response.timings.connect, 2);
          assert.equal(response.timings.dns, 3);
          assert.equal(response.timings.receive, 4);
          assert.equal(response.timings.send, 5);
          assert.equal(response.timings.wait, 6);
          assert.equal(response.timings.ssl, 7);
        });

        it('sets the auth', () => {
          const init: IResponse = { ...base, ...{ 
            auth: {
              kind: ResponseAuthorizationKind,
              method: 'basic',
              state: 1,
              challengeHeader: 'abc',
              headers: 'a-header',
            },
          }};
          const response = new Response(init);
          assert.typeOf(response.auth, 'object');
          assert.equal(response.auth.kind, ResponseAuthorizationKind);
          assert.equal(response.auth.method, 'basic');
          assert.equal(response.auth.state, 1);
          assert.equal(response.auth.challengeHeader, 'abc');
          assert.equal(response.auth.headers, 'a-header');
        });

        it('sets the values form serialized schema', () => {
          const init: IResponse = { ...base, ...{
            status: 200,
            loadingTime: 200,
            statusText: 'hello',
            headers: 'content-type: test',
            payload: 'test',
          }};
          const response = new Response(JSON.stringify(init));
          assert.equal(response.kind, ResponseKind, 'has the kind');
          assert.equal(response.status, 200, 'has the status');
          assert.equal(response.loadingTime, 200, 'has the loadingTime');
          assert.equal(response.statusText, 'hello', 'has the statusText');
          assert.equal(response.headers, 'content-type: test', 'has the headers');
          assert.equal(response.payload, 'test', 'has the payload');
        });
      });
    });

    describe('toJSON()', () => {
      it('serializes the kind', () => {
        const response = new Response();
        const result = response.toJSON();
        assert.equal(result.kind, ResponseKind);
      });

      it('serializes the status', () => {
        const response = Response.fromValues(200);
        const result = response.toJSON();
        assert.equal(result.status, 200);
      });

      it('serializes the statusText', () => {
        const response = Response.fromValues(200, 'hello');
        const result = response.toJSON();
        assert.equal(result.statusText, 'hello');
      });

      it('serializes the headers', () => {
        const response = Response.fromValues(200, 'hello', 'test');
        const result = response.toJSON();
        assert.equal(result.headers, 'test');
      });

      it('serializes the timings', () => {
        const response = Response.fromValues(200, 'hello', 'test');
        response.setTimings({
          blocked: 1,
          connect: 2,
          dns: 3,
          receive: 4,
          send: 5,
          wait: 6,
          ssl: 7,
        });
        const result = response.toJSON();
        assert.typeOf(result.timings, 'object');
        assert.equal(result.timings.blocked, 1);
        assert.equal(result.timings.connect, 2);
        assert.equal(result.timings.dns, 3);
        assert.equal(result.timings.receive, 4);
        assert.equal(result.timings.send, 5);
        assert.equal(result.timings.wait, 6);
        assert.equal(result.timings.ssl, 7);
      });

      it('serializes the auth', () => {
        const response = Response.fromValues(200, 'hello', 'test');
        response.setAuth({
          kind: ResponseAuthorizationKind,
          method: 'basic',
          state: 1,
          challengeHeader: 'abc',
          headers: 'a-header',
        });
        const result = response.toJSON();
        assert.typeOf(result.auth, 'object');
        assert.equal(result.auth.kind, ResponseAuthorizationKind);
        assert.equal(result.auth.method, 'basic');
        assert.equal(result.auth.state, 1);
        assert.equal(result.auth.challengeHeader, 'abc');
        assert.equal(result.auth.headers, 'a-header');
      });
    });

    // 
    // Note, the `auth` object is not checked here as ARC uses it only after the request is made.
    // Because of that the `auth` is unnecessary to restore as it makes no difference.
    // 
    describe('fromLegacy()', () => {
      it('sets the status', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.status, 200);
      });

      it('sets the loadingTime', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.loadingTime, 123);
      });

      it('sets the kind', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.kind, ResponseKind);
      });

      it('sets the statusText', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          statusText: 'test',
          loadingTime: 123,
        });
        assert.equal(response.statusText, 'test');
      });

      it('sets the headers', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          headers: 'test',
          loadingTime: 123,
        });
        assert.equal(response.headers, 'test');
      });

      it('sets the payload from a string', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          payload: 'test',
        });
        assert.equal(response.payload, 'test');
      });

      it('sets the payload from an ArrayBuffer', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          payload: view.buffer,
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'arraybuffer');
        assert.deepEqual(payload.data, [ 116, 101, 115, 116 ]);
      });

      it('sets the payload from an ArrayBuffer as LegacyTransformedPayload', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          payload: {
            type: 'ArrayBuffer',
            data: [ ...view ],
          },
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'arraybuffer');
        assert.deepEqual(payload.data, [ 116, 101, 115, 116 ]);
      });

      it('sets the payload from a Blob', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          blob: 'test'
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'blob');
        assert.deepEqual(payload.data, 'test');
      });

      it('sets the payload from a multipart', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          multipart: [
            {
              name: 'a',
              isFile: false,
              value: 'b',
            }
          ],
        });
        assert.ok(response.payload, 'has the payload');
        const payload = response.payload as ISafePayload;
        assert.equal(payload.type, 'formdata');
        assert.deepEqual(payload.data, [{
          name: 'a',
          isFile: false,
          value: 'b',
        }]);
      });

      it('sets the timings', async () => {
        const response = await Response.fromLegacy({
          status: 200,
          loadingTime: 123,
          timings: {
            blocked: 1,
            connect: 2,
            dns: 3,
            receive: 4,
            send: 5,
            wait: 6,
            ssl: 7,
          },
        });
        assert.typeOf(response.timings, 'object');
        assert.equal(response.timings.blocked, 1);
        assert.equal(response.timings.connect, 2);
        assert.equal(response.timings.dns, 3);
        assert.equal(response.timings.receive, 4);
        assert.equal(response.timings.send, 5);
        assert.equal(response.timings.wait, 6);
        assert.equal(response.timings.ssl, 7);
      });

      it('sets the default status', async () => {
        const response = await Response.fromLegacy({
          status: undefined,
          loadingTime: 123,
        });
        assert.equal(response.status, 0);
      });

      it('sets the default loadingTime', async () => {
        const response = await Response.fromLegacy({
          status: undefined,
          loadingTime: undefined,
        });
        assert.equal(response.loadingTime, 0);
      });
    });

    describe('Response.isErrorResponse()', () => {
      it('returns true when is an error response', () => {
        const response = new ErrorResponse();
        const result = Response.isErrorResponse(response);
        assert.isTrue(result);
      });

      it('returns false when is not an error response', () => {
        const response = new Response();
        const result = Response.isErrorResponse(response);
        assert.isFalse(result);
      });
    });

    describe('setTimings()', () => {
      it('sets the timings value', () => {
        const response = new Response();
        response.setTimings({
          blocked: 1,
          connect: 2,
          dns: 3,
          receive: 4,
          send: 5,
          wait: 6,
        });

        assert.typeOf(response.timings, 'object', 'has the timings');
        assert.equal(response.timings.receive, 4, 'has the values');
      });
    });
  });
});
