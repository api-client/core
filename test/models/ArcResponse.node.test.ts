import { assert } from 'chai';
import { ArcResponseKind, ArcResponse, IArcResponse, RequestTime, IRequestTime, ResponseAuthorization, IResponseAuthorization } from '../../index.js';

//
// Note, the actual unit tests are located in the `ArcResponse.browser.test.ts` file.
// This is to make sure that everything is working in the NodeJS module as well.
//

describe('Models', () => {
  describe('ArcResponse', () => {
    describe('Initialization', () => {
      describe('Default response initialization', () => {
        it('initializes a default project', () => {
          const result = new ArcResponse();
          assert.equal(result.kind, ArcResponseKind, 'sets the kind property');
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
          const timings = response.timings as RequestTime;
          assert.typeOf(timings, 'object');
          assert.equal(timings.blocked, 1);
          assert.equal(timings.connect, 2);
          assert.equal(timings.dns, 3);
          assert.equal(timings.receive, 4);
          assert.equal(timings.send, 5);
          assert.equal(timings.wait, 6);
          assert.equal(timings.ssl, 7);
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
          const auth = response.auth as ResponseAuthorization;
          assert.typeOf(auth, 'object');
          assert.equal(auth.kind, 'ARC#ResponseAuthorization');
          assert.equal(auth.method, 'basic');
          assert.equal(auth.state, 1);
          assert.equal(auth.challengeHeader, 'abc');
          assert.equal(auth.headers, 'a-header');
        });
      });
    });

    describe('toJSON()', () => {
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
        const timings = result.timings as IRequestTime;
        assert.typeOf(timings, 'object');
        assert.equal(timings.blocked, 1);
        assert.equal(timings.connect, 2);
        assert.equal(timings.dns, 3);
        assert.equal(timings.receive, 4);
        assert.equal(timings.send, 5);
        assert.equal(timings.wait, 6);
        assert.equal(timings.ssl, 7);
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
        const auth = result.auth as IResponseAuthorization;
        assert.typeOf(auth, 'object');
        assert.equal(auth.kind, 'ARC#ResponseAuthorization');
        assert.equal(auth.method, 'basic');
        assert.equal(auth.state, 1);
        assert.equal(auth.challengeHeader, 'abc');
        assert.equal(auth.headers, 'a-header');
      });
    });

    // 
    // Note, the `auth` object is not checked here as ARC uses it only after the request.
    // Because of that the `auth` is unnecessary to restore as it makes no difference.
    // 
    describe('fromLegacy()', () => {
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
        const timings = response.timings as RequestTime;
        assert.typeOf(timings, 'object');
        assert.equal(timings.blocked, 1);
        assert.equal(timings.connect, 2);
        assert.equal(timings.dns, 3);
        assert.equal(timings.receive, 4);
        assert.equal(timings.send, 5);
        assert.equal(timings.wait, 6);
        assert.equal(timings.ssl, 7);
      });
    });
  });
});
