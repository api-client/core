import { assert } from '@esm-bundle/chai';
import { ResponseRedirect, IResponseRedirect, Kind as ResponseRedirectKind } from '../../src/models/ResponseRedirect.js';
import { HttpResponse, IHttpResponse } from '../../src/models/HttpResponse.js';
import { ResponseRedirect as LegacyRedirect } from '../../src/models/legacy/request/ArcResponse.js';

describe('Models', () => {
  describe('ResponseRedirect', () => {
    describe('ResponseRedirect.fromValues()', () => {
      let response: IHttpResponse;
      beforeEach(() => {
        response = HttpResponse.fromValues(200, 'OK', 'content-type: text/plain').toJSON();
      });

      it('sets the kind', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response);
        assert.equal(result.kind, ResponseRedirectKind);
      });

      it('sets the url', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response);
        assert.equal(result.url, 'https://dot.com');
      });

      it('sets the response', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response);
        assert.typeOf(result.response, 'object', 'has the response');
        assert.isTrue(result.response instanceof HttpResponse, 'has the HttpResponse instance');
      });

      it('sets the default startTime', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response);
        assert.equal(result.startTime, 0);
      });

      it('sets the default endTime', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response);
        assert.equal(result.endTime, 0);
      });

      it('sets the startTime', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response, 1234);
        assert.equal(result.startTime, 1234);
      });

      it('sets the endTime', () => {
        const result = ResponseRedirect.fromValues('https://dot.com', response, 1234, 5678);
        assert.equal(result.endTime, 5678);
      });
    });

    describe('ResponseRedirect.fromLegacy()', () => {
      let schema: LegacyRedirect;
      beforeEach(() => {
        schema = {
          startTime: 1234,
          endTime: 5678,
          url: 'https://rdr.com',
          timings: {
            blocked: 1,
            connect: 2,
            dns: 3,
            receive: 4,
            send: 5,
            wait: 6,
            ssl: 7,
          },
          response: {
            status: 307,
            statusText: 'Moved.',
            headers: 'location: https://rdr.com',
            payload: 'I am in a different location.',
          },
        };
      });

      it('sets the kind', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.kind, ResponseRedirectKind);
      });

      it('sets the startTime', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.startTime, schema.startTime);
      });

      it('sets the default startTime', async () => {
        delete schema.startTime;
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.startTime, 0);
      });

      it('sets the endTime', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.endTime, schema.endTime);
      });

      it('sets the default endTime', async () => {
        delete schema.endTime;
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.endTime, 0);
      });

      it('sets the url', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.url, schema.url);
      });

      it('sets the default url', async () => {
        delete schema.url;
        const result = await ResponseRedirect.fromLegacy(schema);
        assert.equal(result.url, '');
      });

      it('sets the response', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        const { response } = result;
        assert.typeOf(response, 'object');
        assert.equal(response.status, schema.response.status);
        assert.equal(response.statusText, schema.response.statusText);
        assert.equal(response.headers, schema.response.headers);
        assert.equal(response.payload, 'I am in a different location.');
      });

      it('sets the default response', async () => {
        delete schema.response;
        const result = await ResponseRedirect.fromLegacy(schema);
        const { response } = result;
        assert.typeOf(response, 'object');
        assert.equal(response.status, 0);
      });

      it('sets the timings', async () => {
        const result = await ResponseRedirect.fromLegacy(schema);
        const { timings } = result;
        assert.typeOf(timings, 'object');
        assert.equal(timings.blocked, schema.timings.blocked);
        assert.equal(timings.connect, schema.timings.connect);
        assert.equal(timings.dns, schema.timings.dns);
        assert.equal(timings.receive, schema.timings.receive);
        assert.equal(timings.send, schema.timings.send);
        assert.equal(timings.wait, schema.timings.wait);
      });
    });

    describe('constructor()', () => {
      it('creates a default instance', () => {
        const result = new ResponseRedirect();
        assert.equal(result.kind, ResponseRedirectKind);
        assert.equal(result.endTime, 0);
        assert.equal(result.startTime, 0);
        assert.equal(result.url, '');
        assert.equal(result.response.status, 0);
      });

      it('creates an instance from the schema', () => {
        const schema: IResponseRedirect = {
          kind: ResponseRedirectKind,
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            status: 200,
            statusText: 'OK',
          },
          timings: {
            blocked: 1,
            connect: 2,
            dns: 3,
            receive: 4,
            send: 5,
            wait: 6,
            ssl: 7,
          },
        };
        const result = new ResponseRedirect(schema);
        assert.equal(result.kind, ResponseRedirectKind);
        assert.equal(result.startTime, 1234);
        assert.equal(result.endTime, 5678);
        assert.equal(result.url, 'https://dot.com');
        assert.equal(result.response.status, 200);
        assert.equal(result.response.statusText, 'OK');
        assert.equal(result.timings.blocked, schema.timings.blocked);
        assert.equal(result.timings.connect, schema.timings.connect);
      });

      it('the timings is optional', () => {
        let schema: IResponseRedirect = {
          kind: ResponseRedirectKind,
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            status: 200,
            statusText: 'OK',
          },
        };
        const result = new ResponseRedirect(schema);
        assert.isUndefined(result.timings);
      });

      it('creates an instance from the JSON schema string', () => {
        let schema: IResponseRedirect = {
          kind: ResponseRedirectKind,
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            status: 200,
            statusText: 'OK',
          },
        };
        const result = new ResponseRedirect(JSON.stringify(schema));
        assert.equal(result.kind, ResponseRedirectKind);
        assert.equal(result.startTime, 1234);
        assert.equal(result.endTime, 5678);
        assert.equal(result.url, 'https://dot.com');
        assert.equal(result.response.status, 200);
        assert.equal(result.response.statusText, 'OK');
      });
    });

    describe('toJSON()', () => {
      let schema: IResponseRedirect;
      let instance: ResponseRedirect;
      beforeEach(() => {
        schema = {
          kind: ResponseRedirectKind,
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            kind: 'ARC#HttpResponse',
            status: 200,
            statusText: 'OK',
          },
          timings: {
            blocked: 1,
            connect: 2,
            dns: 3,
            receive: 4,
            send: 5,
            wait: 6,
            ssl: 7,
          },
        };
        instance = new ResponseRedirect(schema);
      });

      it('serializes the kind', () => {
        const result = instance.toJSON();
        assert.equal(result.kind, ResponseRedirectKind);
      });

      it('serializes the startTime', () => {
        const result = instance.toJSON();
        assert.equal(result.startTime, schema.startTime);
      });

      it('serializes the endTime', () => {
        const result = instance.toJSON();
        assert.equal(result.endTime, schema.endTime);
      });

      it('serializes the url', () => {
        const result = instance.toJSON();
        assert.equal(result.url, schema.url);
      });

      it('serializes the response', () => {
        const result = instance.toJSON();
        assert.deepEqual(result.response, schema.response);
      });

      it('serializes the default response', () => {
        delete instance.response;
        const result = instance.toJSON();
        assert.deepEqual(result.response, {
          kind: 'ARC#HttpResponse',
          status: 0,
        });
      });

      it('serializes the timings', () => {
        const result = instance.toJSON();
        assert.deepEqual(result.timings, { ...schema.timings, kind: 'ARC#RequestTime' });
      });

      it('does not serialize the timings when missing', () => {
        delete instance.timings;
        const result = instance.toJSON();
        assert.isUndefined(result.timings);
      });
    });
  });
});
