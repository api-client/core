import { assert } from '@esm-bundle/chai';
import { Kind as ArcResponseKind, ArcResponse, IArcResponse } from '../../src/models/ArcResponse';
import { ISafePayload } from '../../src/lib/transformers/PayloadSerializer';

describe('Models', () => {
  describe('ArcResponse', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new ArcResponse();
          assert.equal(result.kind, ArcResponseKind, 'sets the kind property');
          assert.equal(result.status, 0, 'sets the status property');
          assert.equal(result.loadingTime, 0, 'sets the loadingTime property');
          assert.isUndefined(result.statusText,'has no statusText property');
          assert.isUndefined(result.headers, 'has no headers property');
          assert.isUndefined(result.payload, 'has no payload property');
        });
      });

      describe('From schema initialization', () => {
        let base: IArcResponse;
        beforeEach(() => {
          base = {
            kind: ArcResponseKind,
            status: 0,
            loadingTime: 0,
          }
        });

        it('sets the kind', () => {
          const init: IArcResponse = { ...base };
          const response = new ArcResponse(init);
          assert.equal(response.kind, ArcResponseKind);
        });

        it('sets the status', () => {
          const init: IArcResponse = { ...base, ...{ status: 200 }};
          const response = new ArcResponse(init);
          assert.equal(response.status, 200);
        });

        it('sets the loadingTime', () => {
          const init: IArcResponse = { ...base, ...{ loadingTime: 200 }};
          const response = new ArcResponse(init);
          assert.equal(response.loadingTime, 200);
        });

        it('sets the timings', () => {
          const init: IArcResponse = { ...base, ...{ 
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
          const response = new ArcResponse(init);
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
          const init: IArcResponse = { ...base, ...{ 
            auth: {
              kind: 'ARC#ResponseAuthorization',
              method: 'basic',
              state: 1,
              challengeHeader: 'abc',
              headers: 'a-header',
            },
          }};
          const response = new ArcResponse(init);
          assert.typeOf(response.auth, 'object');
          assert.equal(response.auth.kind, 'ARC#ResponseAuthorization');
          assert.equal(response.auth.method, 'basic');
          assert.equal(response.auth.state, 1);
          assert.equal(response.auth.challengeHeader, 'abc');
          assert.equal(response.auth.headers, 'a-header');
        });

        it('sets the values form serialized schema', () => {
          const init: IArcResponse = { ...base, ...{
            status: 200,
            loadingTime: 200,
            statusText: 'hello',
            headers: 'content-type: test',
            payload: 'test',
          }};
          const response = new ArcResponse(JSON.stringify(init));
          assert.equal(response.kind, ArcResponseKind, 'has the kind');
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
        const response = new ArcResponse();
        const result = response.toJSON();
        assert.equal(result.kind, ArcResponseKind);
      });

      it('serializes the status', () => {
        const response = ArcResponse.fromValues(200);
        const result = response.toJSON();
        assert.equal(result.status, 200);
      });

      it('serializes the statusText', () => {
        const response = ArcResponse.fromValues(200, 'hello');
        const result = response.toJSON();
        assert.equal(result.statusText, 'hello');
      });

      it('serializes the headers', () => {
        const response = ArcResponse.fromValues(200, 'hello', 'test');
        const result = response.toJSON();
        assert.equal(result.headers, 'test');
      });

      it('serializes the timings', () => {
        const response = ArcResponse.fromValues(200, 'hello', 'test');
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
        const response = ArcResponse.fromValues(200, 'hello', 'test');
        response.setAuth({
          kind: 'ARC#ResponseAuthorization',
          method: 'basic',
          state: 1,
          challengeHeader: 'abc',
          headers: 'a-header',
        });
        const result = response.toJSON();
        assert.typeOf(result.auth, 'object');
        assert.equal(result.auth.kind, 'ARC#ResponseAuthorization');
        assert.equal(result.auth.method, 'basic');
        assert.equal(result.auth.state, 1);
        assert.equal(result.auth.challengeHeader, 'abc');
        assert.equal(result.auth.headers, 'a-header');
      });
    });

    // 
    // Note, the `auth` object is not checked here as ARC uses it only after the request.
    // Because of that the `auth` is unnecessary to restore as it makes no difference.
    // 
    describe('fromLegacy()', () => {
      it('sets the status', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.status, 200);
      });

      it('sets the loadingTime', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.loadingTime, 123);
      });

      it('sets the kind', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          loadingTime: 123,
        });
        assert.equal(response.kind, ArcResponseKind);
      });

      it('sets the statusText', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          statusText: 'test',
          loadingTime: 123,
        });
        assert.equal(response.statusText, 'test');
      });

      it('sets the headers', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          headers: 'test',
          loadingTime: 123,
        });
        assert.equal(response.headers, 'test');
      });

      it('sets the payload from a string', async () => {
        const response = await ArcResponse.fromLegacy({
          status: 200,
          loadingTime: 123,
          payload: 'test',
        });
        assert.equal(response.payload, 'test');
      });

      it('sets the payload from an ArrayBuffer', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');
        
        const response = await ArcResponse.fromLegacy({
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
        
        const response = await ArcResponse.fromLegacy({
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

      it('sets the timings', async () => {
        const response = await ArcResponse.fromLegacy({
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
    });
  });
});
