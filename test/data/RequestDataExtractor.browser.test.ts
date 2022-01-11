import { assert } from '@esm-bundle/chai';
import { RequestDataExtractor } from '../../src/data/RequestDataExtractor.js';
import { RequestDataSourceEnum, ResponseDataSourceEnum, ActionTypeEnum } from '../../src/models/actions/Enums.js';
import { Kind as HttpRequestKind, IHttpRequest } from '../../src/models/HttpRequest.js';
import { Kind as HttpResponseKind, IHttpResponse } from '../../src/models/HttpResponse.js';

describe('data', () => {
  describe('RequestDataExtractor', () => {
    describe('constructor()', () => {
      it('sets the request instance', () => {
        const instance = new RequestDataExtractor({
          url: 'https://domain.com',
          method: 'GET',
        });
        assert.typeOf(instance.request, 'object', 'has the object');
        assert.equal(instance.request.kind, HttpRequestKind, 'has the HttpRequest instance');
      });

      it('does not set the response instance when missing', () => {
        const instance = new RequestDataExtractor({
          url: 'https://domain.com',
          method: 'GET',
        });
        assert.isUndefined(instance.response);
      });

      it('sets the response instance', () => {
        const instance = new RequestDataExtractor({
          url: 'https://domain.com',
          method: 'GET',
        }, {
          kind: HttpResponseKind,
          status: 200,
        });
        assert.typeOf(instance.response, 'object', 'has the object');
        assert.equal(instance.response.kind, HttpResponseKind, 'has the HttpResponse instance');
      });
    });

    describe('URL extraction', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        request = {
          url: 'https://dot.com',
          method: 'GET',
        };
      });

      it('returns the whole URL when no path', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
        });
        assert.equal(result, 'https://dot.com');
      });

      it('returns the "host" path', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'host',
        });
        assert.equal(result, 'dot.com');
      });

      it('returns the "protocol" path', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'protocol',
        });
        assert.equal(result, 'https:');
      });

      it('returns the "path" path', async () => {
        request.url += '/a/path/index.html'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'path',
        });
        assert.equal(result, '/a/path/index.html');
      });

      it('returns the whole "query" path', async () => {
        request.url += '/a/b?c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'query',
        });
        assert.equal(result, 'c=d&e=f');
      });

      it('returns a specific query parameter', async () => {
        request.url += '/a/b?c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'query.c',
        });
        assert.equal(result, 'd');
      });

      it('returns undefined when unknown query parameter', async () => {
        request.url += '/a/b?c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'query.g',
        });
        assert.isUndefined(result);
      });

      it('returns undefined when no query parameters', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'query.g',
        });
        assert.isUndefined(result);
      });

      it('returns the whole "hash" path', async () => {
        request.url += '/a/b#c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'hash',
        });
        assert.equal(result, 'c=d&e=f');
      });

      it('returns a specific hash as query parameter', async () => {
        request.url += '/a/b#c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'hash.c',
        });
        assert.equal(result, 'd');
      });

      it('returns undefined when unknown hash as query parameter', async () => {
        request.url += '/a/b#c=d&e=f'
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'hash.g',
        });
        assert.isUndefined(result);
      });

      it('returns undefined when no hash part', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.url,
          path: 'hash.g',
        });
        assert.isUndefined(result);
      });

      it('throws when unknown path', async () => {
        let thrown = false;
        const factory = new RequestDataExtractor(request);
        try {
          await factory.extract({
            source: RequestDataSourceEnum.url,
            path: 'something',
          });
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });
    });

    describe('headers extraction', () => {
      describe('request', () => {
        let request: IHttpRequest;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            headers: 'x-t1: true\naccept: text/plain',
          };
        });

        it('returns the whole headers value when no path', async () => {
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.headers,
            type: ActionTypeEnum.request,
          });
          assert.equal(result, 'x-t1: true\naccept: text/plain');
        });

        it('returns a specific header', async () => {
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.headers,
            type: ActionTypeEnum.request,
            path: 'accept',
          });
          assert.equal(result, 'text/plain');
        });

        it('returns undefined for unknown header', async () => {
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.headers,
            type: ActionTypeEnum.request,
            path: 'some',
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no headers', async () => {
          delete request.headers;
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.headers,
            type: ActionTypeEnum.request,
            path: 'some',
          });
          assert.isUndefined(result);
        });
      });

      describe('response', () => {
        let request: IHttpRequest;
        let response: IHttpResponse;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
          };
          response = {
            status: 200,
            kind: HttpResponseKind,
            headers: 'x-t1: true\naccept: text/plain',
          };
        });

        it('returns the whole headers value when no path', async () => {
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.headers,
            type: ActionTypeEnum.response,
          });
          assert.equal(result, 'x-t1: true\naccept: text/plain');
        });

        it('returns a specific header', async () => {
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.headers,
            type: ActionTypeEnum.response,
            path: 'accept',
          });
          assert.equal(result, 'text/plain');
        });

        it('returns undefined for unknown header', async () => {
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.headers,
            type: ActionTypeEnum.response,
            path: 'some',
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no headers', async () => {
          delete request.headers;
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.headers,
            type: ActionTypeEnum.response,
            path: 'some',
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no response object', async () => {
          delete request.headers;
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.headers,
            type: ActionTypeEnum.response,
            path: 'some',
          });
          assert.isUndefined(result);
        });
      });
    });

    describe('status extraction', () => {
      let request: IHttpRequest;
      let response: IHttpResponse;
      beforeEach(() => {
        request = {
          url: 'https://dot.com',
          method: 'GET',
        };
        response = {
          status: 200,
          kind: HttpResponseKind,
        };
      });

      it('returns the response status', async () => {
        const factory = new RequestDataExtractor(request, response);
        const result = await factory.extract({
          source: ResponseDataSourceEnum.status,
          type: ActionTypeEnum.response,
        });
        assert.strictEqual(result, 200);
      });

      it('returns undefined when no response', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: ResponseDataSourceEnum.status,
          type: ActionTypeEnum.response,
        });
        assert.isUndefined(result);
      });
    });

    describe('method extraction', () => {
      let request: IHttpRequest;
      beforeEach(() => {
        request = {
          url: 'https://dot.com',
          method: 'GET',
        };
      });

      it('returns the http method', async () => {
        const factory = new RequestDataExtractor(request);
        const result = await factory.extract({
          source: RequestDataSourceEnum.method,
        });
        assert.strictEqual(result, 'GET');
      });
    });

    describe('body extraction', () => {
      describe('data source selection', () => {
        let request: IHttpRequest;
        let response: IHttpResponse;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            payload: 'request-payload'
          };
          response = {
            status: 200,
            kind: HttpResponseKind,
            payload: 'response-payload'
          };
        });

        it('extract body from the request object', async () => {
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
          });
          assert.equal(result, 'request-payload');
        });

        it('extract body from the response object', async () => {
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.body,
            type: ActionTypeEnum.response,
          });
          assert.equal(result, 'response-payload');
        });

        it('returns undefined when no request payload', async () => {
          delete request.payload;
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no response payload', async () => {
          delete response.payload;
          const factory = new RequestDataExtractor(request, response);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.body,
            type: ActionTypeEnum.response,
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no response', async () => {
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: ResponseDataSourceEnum.body,
            type: ActionTypeEnum.response,
          });
          assert.isUndefined(result);
        });
      });

      describe('JSON data extraction', () => {
        const simpleBody = JSON.stringify({ a: { b: { c: 'value' } } });;

        let request: IHttpRequest;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            headers: 'content-length: 100\ncontent-type: application/json',
          };
        });

        it('returns undefined when invalid payload', async () => {
          request.payload = 'test';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'a.b.c'
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no headers', async () => {
          request.payload = simpleBody;
          delete request.headers;
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'a.b.c'
          });
          assert.isUndefined(result);
        });

        it('returns undefined when no content-type header', async () => {
          request.payload = simpleBody;
          request.headers = 'content-length: 100';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'a.b.c'
          });
          assert.isUndefined(result);
        });

        it('returns the value for a simple object', async () => {
          request.payload = simpleBody;
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'a.b.c',
          });
          assert.equal(result, 'value');
        });

        it('returns the value with an iterator', async () => {
          request.payload = JSON.stringify({ tokens: [
            { "type": "Bearer", "value": "bearer-token" },
            { "type": "openid", "value": "openid-token" },
          ]});
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'tokens[?type === \'Bearer\'].value',
          });
          assert.equal(result, 'bearer-token');
        });

        it('returns the "value", when configured', async () => {
          request.payload = simpleBody;
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: 'value',
            type: ActionTypeEnum.request,
            value: 'test-value'
          });
          assert.equal(result, 'test-value');
        });
      });

      describe('XML data extraction', () => {
        let request: IHttpRequest;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            headers: 'content-length: 100\ncontent-type: application/xml',
          };
        });

        it('returns undefined when invalid payload', async () => {
          request.payload = 'test';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'root/a'
          });
          assert.isUndefined(result);
        });

        it('returns the value for a simple payload', async () => {
          request.payload = '<feed><item><name>Test</name></item></feed>';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'feed/item/name',
          });
          assert.equal(result, 'Test');
        });

        it('returns the value with an iterator', async () => {
          request.payload = '<feed><item><name>Test</name></item><item><name>Other</name></item></feed>';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'feed/item[name="Other"]/name',
          });
          assert.equal(result, 'Other');
        });
      });

      describe('x-www-form-urlencoded data extraction', () => {
        let request: IHttpRequest;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            headers: 'content-length: 100\ncontent-type: x-www-form-urlencoded',
          };
        });

        it('returns undefined when invalid payload', async () => {
          request.payload = 'test';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'param'
          });
          assert.isUndefined(result);
        });

        it('returns the value for a simple payload', async () => {
          request.payload = 'a=b&c=d';
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'c',
          });
          assert.equal(result, 'd');
        });
      });

      describe('other data extraction', () => {
        let request: IHttpRequest;
        beforeEach(() => {
          request = {
            url: 'https://dot.com',
            method: 'GET',
            headers: 'content-length: 100\ncontent-type: text/plain',
            payload: 'lorem ipsum...',
          };
        });

        it('always returns undefined for unsupported mime type', async () => {
          const factory = new RequestDataExtractor(request);
          const result = await factory.extract({
            source: RequestDataSourceEnum.body,
            type: ActionTypeEnum.request,
            path: 'lorem'
          });
          assert.isUndefined(result);
        });

        it('throws for unknown source', async () => {
          const factory = new RequestDataExtractor(request);
          let thrown = false;
          try {
            await factory.extract({
              // @ts-ignore
              source: 'unknown',
              type: ActionTypeEnum.request,
            });
          } catch (e) {
            thrown = true;
          }
          assert.isTrue(thrown);
        });
      });
    });
  });
});
