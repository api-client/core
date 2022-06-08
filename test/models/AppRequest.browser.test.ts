/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as AppRequestKind, AppRequest, IAppRequest } from '../../src/models/AppRequest.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { Kind as HttpRequestKind, IHttpRequest } from '../../src/models/HttpRequest.js';
import { Kind as RequestLogKind, RequestLog } from '../../src/models/RequestLog.js';
import { SentRequest } from '../../src/models/SentRequest.js';
import { RequestConfig } from '../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../src/models/RequestAuthorization.js';
import { Kind as RequestKind } from '../../src/models/Request.js';

describe('Models', () => {
  describe('AppRequest', () => {
    describe('Initialization', () => {
      describe('Default project initialization', () => {
        it('initializes a default project request', () => {
          const result = new AppRequest();
          assert.equal(result.kind, AppRequestKind, 'sets the kind property');
          assert.typeOf(result.created, 'number', 'sets the created property');
          assert.equal(result.updated, result.created, 'sets the updated property');
          assert.typeOf(result.midnight, 'number', 'sets the updated property');
          assert.typeOf(result.key, 'string', 'sets the key property');
          assert.typeOf(result.info, 'object', 'sets the info property');
          assert.typeOf(result.expects, 'object', 'sets the expects property');
          assert.equal(result.app, '', 'sets the app property');
          assert.isUndefined(result.log, 'does not set the log property');
          assert.isUndefined(result.config, 'does not set the config property');
          assert.isUndefined(result.authorization, 'does not set the authorization property');
          assert.isUndefined(result.flows, 'does not set the actions property');
          assert.isUndefined(result.clientCertificate, 'does not set the clientCertificate property');
        });

        it('creates the key from the created time', () => {
          const result = new AppRequest();
          assert.equal(result.key, new Date(result.created).toJSON());
        });
      });

      describe('From schema initialization', () => {
        const app = 'abc';
        let base: IAppRequest;
        beforeEach(() => {
          base = {
            kind: AppRequestKind,
            info: {
              kind: ThingKind,
              name: 'test',
            },
            key: '',
            expects: {
              kind: HttpRequestKind,
              method: '',
              url: '',
            },
            app,
          }
        });

        it('sets the kind property', () => {
          const init: IAppRequest = { ...base };
          const request = new AppRequest(init);
          assert.equal(request.kind, AppRequestKind);
        });

        it('sets the key property when missing', () => {
          const init: IAppRequest = { ...base };
          delete init.key;
          const request = new AppRequest(init);
          assert.equal(request.key, new Date(request.created).toJSON());
        });

        it('sets the key property', () => {
          const init: IAppRequest = { ...base, ... { key: 'test' } };
          const request = new AppRequest(init);
          assert.equal(request.key, 'test');
        });

        it('sets the app property', () => {
          const request = new AppRequest(base);
          assert.equal(request.app, 'abc');
        });

        it('sets the expects property when missing', () => {
          const init: IAppRequest = { ...base };
          delete init.expects;
          const request = new AppRequest(init);
          assert.typeOf(request.expects, 'object');
          assert.equal(request.expects.method, 'GET');
          assert.equal(request.expects.url, '');
        });

        it('sets the expects property', () => {
          const init: IAppRequest = { ...base, ... { expects: { kind: HttpRequestKind, url: 'test.com', method: 'GET' } } };
          const request = new AppRequest(init);
          assert.typeOf(request.expects, 'object');
          assert.equal(request.expects.method, 'GET');
          assert.equal(request.expects.url, 'test.com');
        });

        it('sets the info property when missing', () => {
          const init: IAppRequest = { ...base };
          delete init.info;
          const request = new AppRequest(init);
          assert.typeOf(request.info, 'object');
          assert.equal(request.info.name, '');
        });

        it('sets the info property', () => {
          const init: IAppRequest = { ...base, ... { info: { kind: ThingKind, name: 'A request' } } };
          const request = new AppRequest(init);
          assert.typeOf(request.info, 'object');
          assert.equal(request.info.name, 'A request');
        });

        it('sets the log property', () => {
          const sentRequest = SentRequest.fromBaseValues({
            url: 'test.com', 
            startTime: Date.now(),
          });
          const log = RequestLog.fromRequest(sentRequest.toJSON());
          const init: IAppRequest = { ...base, ... { log: log.toJSON() } };
          const request = new AppRequest(init);
          assert.typeOf(request.log, 'object');
          assert.equal(request.log.kind, RequestLogKind);
          assert.typeOf(request.log.request, 'object');
          assert.equal(request.log.request.url, 'test.com');
        });

        it('sets the config property', () => {
          const config = RequestConfig.withDefaults();
          const init: IAppRequest = { ...base, ... { config: config.toJSON() } };
          const request = new AppRequest(init);
          assert.typeOf(request.config, 'object');
          assert.isTrue(request.config.enabled);
          assert.equal(request.config.timeout, 90);
        });

        it('sets the authorization property', () => {
          const authorization = new RequestAuthorization();
          const init: IAppRequest = { ...base, ... { authorization: [authorization.toJSON()] } };
          const request = new AppRequest(init);
          assert.typeOf(request.authorization, 'array');
          assert.lengthOf(request.authorization, 1);
        });

        it('sets the created property', () => {
          const init: IAppRequest = { ...base, ...{ created: 123 } };
          const request = new AppRequest(init);
          assert.equal(request.created, 123);
        });

        it('sets the default created property', () => {
          const init: IAppRequest = { ...base };
          const request = new AppRequest(init);
          assert.typeOf(request.created, 'number');
        });

        it('sets the updated property', () => {
          const init: IAppRequest = { ...base, ...{ updated: 123 } };
          const request = new AppRequest(init);
          assert.equal(request.updated, 123);
        });

        it('sets the default updated property', () => {
          const init: IAppRequest = { ...base };
          const request = new AppRequest(init);
          assert.equal(request.updated, request.created);
        });

        it('sets the midnight property', () => {
          const init: IAppRequest = { ...base, ...{ midnight: 123 } };
          const request = new AppRequest(init);
          assert.equal(request.midnight, 123);
        });

        it('sets the default midnight property', () => {
          const now = new Date();
          const init: IAppRequest = { ...base, updated: now.getTime() };
          const request = new AppRequest(init);
          now.setHours(0, 0, 0, 0);
          assert.equal(request.midnight, now.getTime());
        });
      });

      describe('From JSON string initialization', () => {
        const app = 'abc';

        it('restores project data from JSON string', () => {
          const request = AppRequest.fromUrl('https://api.com', app);
          const str = JSON.stringify(request);
          
          const result = new AppRequest(str);

          assert.equal(result.key, request.key, 'restores the key');
          assert.equal(result.app, request.app, 'restores the app');
          assert.equal(result.info.name, 'https://api.com', 'restores the info object');
          assert.equal(result.expects.url, 'https://api.com', 'restores the expects object');
        });
      });

      describe('#fromUrl()', () => {
        const url = 'https://api.com';
        const app = 'abc';

        it('sets the request values', () => {
          const request = AppRequest.fromUrl(url, app);
          const { expects } = request;
          assert.equal(expects.url, url, 'sets the url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, 'GET', 'sets the HTTP method');
        });

        it('sets the info values', () => {
          const request = AppRequest.fromUrl(url, app);
          const { info } = request;
          assert.equal(info.name, url, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = AppRequest.fromUrl(url, app);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.app, app, 'has the app');
          assert.equal(request.kind, AppRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('creates the key from the created time', () => {
          const result = new AppRequest();
          assert.equal(result.key, new Date(result.created).toJSON());
        });
      });

      describe('#fromName()', () => {
        const name = 'a request';
        const app = 'abc';

        it('sets the request values', () => {
          const request = AppRequest.fromName(name, app);
          const { expects } = request;
          assert.equal(expects.url, '', 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, 'GET', 'sets the HTTP method');
        });

        it('sets the info values', () => {
          const request = AppRequest.fromName(name, app);
          const { info } = request;
          assert.equal(info.name, name, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = AppRequest.fromName(name, app);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.app, app, 'has the app');
          assert.equal(request.kind, AppRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('creates the key from the created time', () => {
          const result = new AppRequest();
          assert.equal(result.key, new Date(result.created).toJSON());
        });
      });

      describe('#fromHttpRequest()', () => {
        let iRequest: IHttpRequest;
        const app = 'abc';

        beforeEach(() => {
          iRequest = {
            kind: AppRequestKind,
            method: 'PUT',
            url: 'https://api.com',
            headers: 'x-test: true',
            payload: 'something',
          };
        });

        it('sets the request values', () => {
          const request = AppRequest.fromHttpRequest(iRequest, app);
          const { expects } = request;
          assert.equal(expects.url, iRequest.url, 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, iRequest.method, 'sets the HTTP method');
          assert.equal(expects.headers, iRequest.headers, 'sets the headers');
          assert.equal(expects.payload, iRequest.payload, 'sets the payload');
        });

        it('sets the info values', () => {
          const request = AppRequest.fromHttpRequest(iRequest, app);
          const { info } = request;
          assert.equal(info.name, iRequest.url, 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = AppRequest.fromHttpRequest(iRequest, app);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.app, app, 'has the app');
          assert.equal(request.kind, AppRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('creates the key from the created time', () => {
          const result = new AppRequest();
          assert.equal(result.key, new Date(result.created).toJSON());
        });
      });

      describe('#fromRequest()', () => {
        let iRequest: IAppRequest;
        const app = 'abc';

        beforeEach(() => {
          const httpRequest: IHttpRequest = {
            kind: RequestKind,
            method: 'PUT',
            url: 'https://api.com',
            headers: 'x-test: true',
            payload: 'something',
          };
          const r = AppRequest.fromHttpRequest(httpRequest, app);
          r.info.name = 'a name';
          iRequest = r.toJSON();
        });

        it('sets the request values', () => {
          const request = AppRequest.fromRequest(iRequest, app);
          const { expects } = request;
          assert.equal(expects.url, iRequest.expects.url, 'sets the empty url');
          assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
          assert.equal(expects.method, iRequest.expects.method, 'sets the HTTP method');
          assert.equal(expects.headers, iRequest.expects.headers, 'sets the headers');
          assert.equal(expects.payload, iRequest.expects.payload, 'sets the payload');
        });

        it('sets the info values', () => {
          const request = AppRequest.fromRequest(iRequest, app);
          const { info } = request;
          assert.equal(info.name, 'a name', 'sets the name');
          assert.equal(info.kind, ThingKind, 'sets the kind');
        });

        it('sets request meta', () => {
          const request = AppRequest.fromRequest(iRequest, app);
          assert.typeOf(request.key, 'string', 'has the key');
          assert.equal(request.app, app, 'has the app');
          assert.equal(request.kind, AppRequestKind, 'sets the kind');
          assert.typeOf(request.created, 'number', 'sets the created');
          assert.equal(request.updated, request.created, 'sets the updated');
        });

        it('creates the key from the created time', () => {
          const result = new AppRequest();
          assert.equal(result.key, new Date(result.created).toJSON());
        });
      });
    });
  });
});
