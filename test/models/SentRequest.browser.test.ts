import { assert } from '@esm-bundle/chai';
import { SentRequest, ISentRequest, IBaseSentRequest } from '../../src/models/SentRequest.js';
import { Kind as HttpRequest } from '../../src/models/HttpRequest.js';
import { TransportRequest as LegacyTransportRequest } from '../../src/models/legacy/request/ArcRequest.js';

describe('Models', () => {
  describe('SentRequest', () => {
    describe('SentRequest.fromBaseValues()', () => {
      let base: IBaseSentRequest;
      beforeEach(() => {
        base = {
          startTime: 1234,
          url: 'https://dot.com',
          endTime: 5678,
          headers: 'x-test: true',
          httpMessage: 'GET / HTTP 1/1\n\n',
          method: 'GET',
          payload: 'test'
        };
      });

      it('sets the kind', () => {
        const result = SentRequest.fromBaseValues(base);
        assert.equal(result.kind, HttpRequest);
      });

      it('sets the kind', () => {
        const result = SentRequest.fromBaseValues(base);
        assert.equal(result.kind, HttpRequest);
      });

      it('sets the httpMessage', () => {
        const result = SentRequest.fromBaseValues(base);
        assert.equal(result.httpMessage, base.httpMessage);
      });

      it('sets the startTime', () => {
        const result = SentRequest.fromBaseValues(base);
        assert.equal(result.startTime, base.startTime);
      });

      it('sets the endTime', () => {
        const result = SentRequest.fromBaseValues(base);
        assert.equal(result.endTime, base.endTime);
      });
    });

    describe('SentRequest.fromLegacy()', () => {
      let base: LegacyTransportRequest;
      beforeEach(() => {
        base = {
          startTime: 1234,
          url: 'https://dot.com',
          endTime: 5678,
          httpMessage: 'GET / HTTP 1/1\n\n',
          method: 'GET',
          headers: 'x-test: true',
          payload: 'test',
        };
      });

      it('sets the kind', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.kind, HttpRequest);
      });

      it('sets the url', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.url, base.url);
      });

      it('sets the default url when missing', async () => {
        delete base.url;
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.url, '');
      });

      it('sets the startTime', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.startTime, base.startTime);
      });

      it('sets the default startTime', async () => {
        delete base.startTime;
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.startTime, 0);
      });

      it('sets the endTime', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.endTime, base.endTime);
      });

      it('sets the default endTime when missing', async () => {
        delete base.endTime;
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.endTime, 0);
      });

      it('sets the httpMessage', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.httpMessage, base.httpMessage);
      });

      it('does not set the httpMessage when missing', async () => {
        delete base.httpMessage;
        const result = await SentRequest.fromLegacy(base);
        assert.isUndefined(result.httpMessage);
      });

      it('sets the method', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.method, base.method);
      });

      it('sets the default method when missing', async () => {
        delete base.method;
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.method, 'GET');
      });

      it('sets the headers', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.headers, base.headers);
      });

      it('does not set the headers when missing', async () => {
        delete base.headers;
        const result = await SentRequest.fromLegacy(base);
        assert.isUndefined(result.headers);
      });

      it('sets the payload', async () => {
        const result = await SentRequest.fromLegacy(base);
        assert.equal(result.payload, 'test');
      });

      it('does not set the payload when missing', async () => {
        delete base.payload;
        const result = await SentRequest.fromLegacy(base);
        assert.isUndefined(result.payload);
      });
    });

    describe('constructor()', () => {
      it('creates a default instance', () => {
        const result = new SentRequest();
        assert.equal(result.kind, HttpRequest);
        assert.equal(result.url, '');
        assert.equal(result.startTime, 0);
      });

      it('creates an instance from schema', () => {
        const schema: ISentRequest = {
          kind: HttpRequest,
          startTime: 1234,
          url: 'https://dot.com',
          endTime: 56789,
          httpMessage: 'GET / HTTP 1/1\n\n',
          method: 'GET',
          headers: 'x-test: true',
          payload: 'test',
        };
        const result = new SentRequest(schema);
        assert.equal(result.kind, HttpRequest);
        assert.equal(result.url, 'https://dot.com');
        assert.equal(result.startTime, 1234);
        assert.equal(result.endTime, 56789);
        assert.equal(result.httpMessage, 'GET / HTTP 1/1\n\n');
        assert.equal(result.method, 'GET');
        assert.equal(result.headers, 'x-test: true');
        assert.equal(result.payload, 'test');
      });

      it('creates an instance from a JSON schema string', () => {
        const schema: ISentRequest = {
          kind: HttpRequest,
          startTime: 1234,
          url: 'https://dot.com',
          endTime: 56789,
          httpMessage: 'GET / HTTP 1/1\n\n',
          method: 'GET',
          headers: 'x-test: true',
          payload: 'test',
        };
        const result = new SentRequest(JSON.stringify(schema));
        assert.equal(result.kind, HttpRequest);
        assert.equal(result.url, 'https://dot.com');
        assert.equal(result.startTime, 1234);
        assert.equal(result.endTime, 56789);
        assert.equal(result.httpMessage, 'GET / HTTP 1/1\n\n');
        assert.equal(result.method, 'GET');
        assert.equal(result.headers, 'x-test: true');
        assert.equal(result.payload, 'test');
      });
    });

    describe('toJSON()', () => {
      let schema: ISentRequest;
      let instance: SentRequest;
      beforeEach(() => {
        schema = {
          kind: HttpRequest,
          startTime: 1234,
          url: 'https://dot.com',
          endTime: 56789,
          httpMessage: 'GET / HTTP 1/1\n\n',
          method: 'GET',
          headers: 'x-test: true',
          payload: 'test',
        };
        instance = new SentRequest(schema);
      });

      it('sets the kind', () => {
        const result = instance.toJSON();
        assert.equal(result.kind, HttpRequest);
      });

      it('sets the parent class properties', () => {
        const result = instance.toJSON();
        assert.equal(result.url, schema.url);
      });

      it('sets the httpMessage', () => {
        const result = instance.toJSON();
        assert.equal(result.httpMessage, schema.httpMessage);
      });

      it('sets the startTime', () => {
        const result = instance.toJSON();
        assert.equal(result.startTime, schema.startTime);
      });

      it('sets the endTime', () => {
        const result = instance.toJSON();
        assert.equal(result.endTime, schema.endTime);
      });
    });
  });
});
