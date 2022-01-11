import { assert } from '@esm-bundle/chai';
import { RequestLog, IRequestLog, Kind as RequestLogKind } from '../../src/models/RequestLog.js';
import { ISentRequest } from '../../src/models/SentRequest.js';
import { IArcResponse } from '../../src/models/ArcResponse.js';
import { IResponseRedirect } from '../../src/models/ResponseRedirect.js';
import { ResponseRedirect as LegacyRedirect } from '../../src/models/legacy/request/ArcResponse.js';

describe('Models', () => {
  describe('RequestLog', () => {
    describe('RequestLog.fromRequest()', () => {
      let request: ISentRequest;
      beforeEach(() => {
        request = {
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
        };
      });

      it('sets the kind', () => {
        const result = RequestLog.fromRequest(request);
        assert.equal(result.kind, RequestLogKind);
      });

      it('sets the request', () => {
        const result = RequestLog.fromRequest(request);
        assert.typeOf(result.request, 'object');
        assert.equal(result.request.url, request.url);
      });
    });

    describe('RequestLog.fromRequestResponse()', () => {
      let request: ISentRequest;
      let response: IArcResponse;
      beforeEach(() => {
        request = {
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
        };
        response = {
          loadingTime: 1,
          status: 200,
        };
      });

      it('sets the kind', () => {
        const result = RequestLog.fromRequestResponse(request, response);
        assert.equal(result.kind, RequestLogKind);
      });

      it('sets the request', () => {
        const result = RequestLog.fromRequestResponse(request, response);
        assert.typeOf(result.request, 'object');
        assert.equal(result.request.url, request.url);
      });

      it('sets the response', () => {
        const result = RequestLog.fromRequestResponse(request, response);
        assert.typeOf(result.response, 'object');
        assert.equal(result.response.status, response.status);
      });
    });

    describe('constructor()', () => {
      it('creates default values', () => {
        const result = new RequestLog();
        assert.equal(result.kind, RequestLogKind);
        assert.isUndefined(result.request);
        assert.isUndefined(result.response);
        assert.isUndefined(result.redirects);
        assert.isUndefined(result.size);
      });

      it('creates values from the schema', () => {
        const schema: IRequestLog = {
          kind: RequestLogKind,
          request: {
            startTime: 1234,
            endTime: 5678,
            url: 'https://dot.com',
          },
          response: {
            loadingTime: 1,
            status: 200,
          },
          redirects: [
            {
              startTime: 1234,
              endTime: 5678,
              url: 'https://dot.com',
              response: {
                status: 200,
              },
              kind: 'ARC#HttpResponseRedirect',
            }
          ],
          size: {
            request: 123,
            response: 456,
          },
        };
        const result = new RequestLog(schema);
        assert.equal(result.kind, RequestLogKind);
        assert.typeOf(result.request, 'object');
        assert.equal(result.request.url, 'https://dot.com');
        assert.typeOf(result.response, 'object');
        assert.equal(result.response.status, 200);
        assert.typeOf(result.redirects, 'array');
        assert.lengthOf(result.redirects, 1);
        assert.typeOf(result.size, 'object');
        assert.equal(result.size.request, 123);
      });

      it('creates values from the JSON schema string', () => {
        const schema: IRequestLog = {
          kind: RequestLogKind,
          request: {
            startTime: 1234,
            endTime: 5678,
            url: 'https://dot.com',
          },
          response: {
            loadingTime: 1,
            status: 200,
          },
        };
        const result = new RequestLog(JSON.stringify(schema));
        assert.equal(result.kind, RequestLogKind);
        assert.typeOf(result.request, 'object');
        assert.equal(result.request.url, 'https://dot.com');
      });
    });

    describe('toJSON()', () => {
      let schema: IRequestLog;
      let instance: RequestLog;
      beforeEach(() => {
        schema = {
          kind: RequestLogKind,
          request: {
            startTime: 1234,
            endTime: 5678,
            url: 'https://dot.com',
          },
          response: {
            loadingTime: 1,
            status: 200,
          },
          redirects: [
            {
              startTime: 1234,
              endTime: 5678,
              url: 'https://dot.com',
              response: {
                status: 200,
              },
              kind: 'ARC#HttpResponseRedirect',
            }
          ],
          size: {
            request: 123,
            response: 456,
          },
        };
        instance = new RequestLog(schema);
      });

      it('serializes the kind', () => {
        const result = instance.toJSON();
        assert.equal(result.kind, RequestLogKind);
      });

      it('serializes the request', () => {
        const result = instance.toJSON();
        assert.typeOf(result.request, 'object');
        assert.equal(result.request.url, 'https://dot.com');
      });

      it('does not serialize the request when missing', () => {
        delete instance.request;
        const result = instance.toJSON();
        assert.isUndefined(result.request);
      });

      it('serializes the size', () => {
        const result = instance.toJSON();
        assert.typeOf(result.size, 'object');
        assert.equal(result.size.request, 123);
      });

      it('does not serialize the size when missing', () => {
        delete instance.size;
        const result = instance.toJSON();
        assert.isUndefined(result.size);
      });

      it('serializes the response', () => {
        const result = instance.toJSON();
        assert.typeOf(result.response, 'object');
        assert.equal(result.response.status, 200);
      });

      it('does not serialize the response when missing', () => {
        delete instance.response;
        const result = instance.toJSON();
        assert.isUndefined(result.response);
      });

      it('serializes the redirects', () => {
        const result = instance.toJSON();
        assert.typeOf(result.redirects, 'array');
        assert.lengthOf(result.redirects, 1);
      });

      it('does not serialize the redirects when missing', () => {
        delete instance.redirects;
        const result = instance.toJSON();
        assert.isUndefined(result.redirects);
      });
    });

    describe('addRedirect()', () => {
      let instance: RequestLog;
      let schema: IResponseRedirect;
      beforeEach(() => {
        instance = new RequestLog;
        schema = {
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            status: 200,
          },
          kind: 'ARC#HttpResponseRedirect',
        };
      });

      it('adds a redirect and initializes the list', () => {
        instance.addRedirect(schema);
        assert.typeOf(instance.redirects, 'array');
        assert.lengthOf(instance.redirects, 1);
      });

      it('returns the created redirect', () => {
        const result = instance.addRedirect(schema);
        assert.typeOf(result, 'object');
        assert.isTrue(result === instance.redirects[0]);
        assert.equal(result.url, 'https://dot.com');
      });

      it('adds a redirect to already initialized list', () => {
        instance.addRedirect(schema);
        instance.addRedirect(schema);
        assert.lengthOf(instance.redirects, 2);
      });
    });

    describe('addLegacyRedirect()', () => {
      let instance: RequestLog;
      let schema: LegacyRedirect;
      beforeEach(() => {
        instance = new RequestLog;
        schema = {
          startTime: 1234,
          endTime: 5678,
          url: 'https://dot.com',
          response: {
            status: 200,
          },
        };
      });

      it('adds a redirect and initializes the list', async () => {
        await instance.addLegacyRedirect(schema);
        assert.typeOf(instance.redirects, 'array');
        assert.lengthOf(instance.redirects, 1);
      });

      it('returns the created redirect', async () => {
        const result = await instance.addLegacyRedirect(schema);
        assert.typeOf(result, 'object');
        assert.equal(result.url, 'https://dot.com');
      });

      it('adds a redirect to already initialized list', async () => {
        await instance.addLegacyRedirect(schema);
        await instance.addLegacyRedirect(schema);
        assert.lengthOf(instance.redirects, 2);
      });
    });
  });
});
