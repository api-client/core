/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@esm-bundle/chai';
import { Kind as ArcHttpRequestKind, ArcHttpRequest, IArcHttpRequest } from '../../../src/models/arc/ArcHttpRequest.js';
import { Kind as ThingKind } from '../../../src/models/Thing.js';
import { Kind as HttpRequestKind, IHttpRequest } from '../../../src/models/HttpRequest.js';
import { Kind as RequestLogKind, RequestLog } from '../../../src/models/RequestLog.js';
import { SentRequest } from '../../../src/models/SentRequest.js';
import { RequestConfig } from '../../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../../src/models/RequestAuthorization.js';
import { Kind as RequestKind } from '../../../src/models/Request.js';

describe('Models', () => {
  describe('arc', () => {
    describe('ArcHttpRequest', () => {
      describe('Initialization', () => {
        describe('Default project initialization', () => {
          it('initializes a default project request', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.kind, ArcHttpRequestKind, 'sets the kind property');
            assert.typeOf(result.created, 'number', 'sets the created property');
            assert.equal(result.updated, result.created, 'sets the updated property');
            assert.typeOf(result.midnight, 'number', 'sets the updated property');
            assert.typeOf(result.key, 'string', 'sets the key property');
            assert.typeOf(result.info, 'object', 'sets the info property');
            assert.typeOf(result.expects, 'object', 'sets the expects property');
            assert.isUndefined(result.log, 'does not set the log property');
            assert.isUndefined(result.config, 'does not set the config property');
            assert.isUndefined(result.authorization, 'does not set the authorization property');
            assert.isUndefined(result.actions, 'does not set the actions property');
            assert.isUndefined(result.clientCertificate, 'does not set the clientCertificate property');
          });

          it('creates the key from the created time', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.key, new Date(result.created).toJSON());
          });
        });
  
        describe('From schema initialization', () => {
          let base: IArcHttpRequest;
          beforeEach(() => {
            base = {
              kind: ArcHttpRequestKind,
              info: {
                kind: ThingKind,
                name: 'test',
              },
              key: '',
              expects: {
                kind: HttpRequestKind,
                method: '',
                url: '',
              }
            }
          });
  
          it('sets the kind property', () => {
            const init: IArcHttpRequest = { ...base };
            const request = new ArcHttpRequest(init);
            assert.equal(request.kind, ArcHttpRequestKind);
          });
  
          it('sets the key property when missing', () => {
            const init: IArcHttpRequest = { ...base };
            delete init.key;
            const request = new ArcHttpRequest(init);
            assert.equal(request.key, new Date(request.created).toJSON());
          });
  
          it('sets the key property', () => {
            const init: IArcHttpRequest = { ...base, ... { key: 'test' } };
            const request = new ArcHttpRequest(init);
            assert.equal(request.key, 'test');
          });
  
          it('sets the expects property when missing', () => {
            const init: IArcHttpRequest = { ...base };
            delete init.expects;
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.expects, 'object');
            assert.equal(request.expects.method, 'GET');
            assert.equal(request.expects.url, '');
          });
  
          it('sets the expects property', () => {
            const init: IArcHttpRequest = { ...base, ... { expects: { kind: HttpRequestKind, url: 'test.com', method: 'GET' } } };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.expects, 'object');
            assert.equal(request.expects.method, 'GET');
            assert.equal(request.expects.url, 'test.com');
          });
  
          it('sets the info property when missing', () => {
            const init: IArcHttpRequest = { ...base };
            delete init.info;
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.info, 'object');
            assert.equal(request.info.name, '');
          });
  
          it('sets the info property', () => {
            const init: IArcHttpRequest = { ...base, ... { info: { kind: ThingKind, name: 'A request' } } };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.info, 'object');
            assert.equal(request.info.name, 'A request');
          });
  
          it('sets the log property', () => {
            const sentRequest = SentRequest.fromBaseValues({
              url: 'test.com', 
              startTime: Date.now(),
            });
            const log = RequestLog.fromRequest(sentRequest.toJSON());
            const init: IArcHttpRequest = { ...base, ... { log: log.toJSON() } };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.log, 'object');
            assert.equal(request.log.kind, RequestLogKind);
            assert.typeOf(request.log.request, 'object');
            assert.equal(request.log.request.url, 'test.com');
          });
  
          it('sets the config property', () => {
            const config = RequestConfig.withDefaults();
            const init: IArcHttpRequest = { ...base, ... { config: config.toJSON() } };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.config, 'object');
            assert.isTrue(request.config.enabled);
            assert.equal(request.config.timeout, 90);
          });
  
          it('sets the authorization property', () => {
            const authorization = new RequestAuthorization();
            const init: IArcHttpRequest = { ...base, ... { authorization: [authorization.toJSON()] } };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.authorization, 'array');
            assert.lengthOf(request.authorization, 1);
          });
  
          it('sets the created property', () => {
            const init: IArcHttpRequest = { ...base, ...{ created: 123 } };
            const request = new ArcHttpRequest(init);
            assert.equal(request.created, 123);
          });
  
          it('sets the default created property', () => {
            const init: IArcHttpRequest = { ...base };
            const request = new ArcHttpRequest(init);
            assert.typeOf(request.created, 'number');
          });
  
          it('sets the updated property', () => {
            const init: IArcHttpRequest = { ...base, ...{ updated: 123 } };
            const request = new ArcHttpRequest(init);
            assert.equal(request.updated, 123);
          });
  
          it('sets the default updated property', () => {
            const init: IArcHttpRequest = { ...base };
            const request = new ArcHttpRequest(init);
            assert.equal(request.updated, request.created);
          });
  
          it('sets the midnight property', () => {
            const init: IArcHttpRequest = { ...base, ...{ midnight: 123 } };
            const request = new ArcHttpRequest(init);
            assert.equal(request.midnight, 123);
          });
  
          it('sets the default midnight property', () => {
            const now = new Date();
            const init: IArcHttpRequest = { ...base, updated: now.getTime() };
            const request = new ArcHttpRequest(init);
            now.setHours(0, 0, 0, 0);
            assert.equal(request.midnight, now.getTime());
          });
        });
  
        describe('From JSON string initialization', () => {
          it('restores project data from JSON string', () => {
            const request = ArcHttpRequest.fromUrl('https://api.com');
            const str = JSON.stringify(request);
            
            const result = new ArcHttpRequest(str);
  
            assert.equal(result.key, request.key, 'restores the key');
            assert.equal(result.info.name, 'https://api.com', 'restores the info object');
            assert.equal(result.expects.url, 'https://api.com', 'restores the expects object');
          });
        });
  
        describe('ArcHttpRequest.fromUrl()', () => {
          const url = 'https://api.com';
  
          it('sets the request values', () => {
            const request = ArcHttpRequest.fromUrl(url);
            const { expects } = request;
            assert.equal(expects.url, url, 'sets the url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, 'GET', 'sets the HTTP method');
          });
  
          it('sets the info values', () => {
            const request = ArcHttpRequest.fromUrl(url);
            const { info } = request;
            assert.equal(info.name, url, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcHttpRequest.fromUrl(url);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcHttpRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });

          it('creates the key from the created time', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.key, new Date(result.created).toJSON());
          });
        });
  
        describe('ArcHttpRequest.fromName()', () => {
          const name = 'a request';
  
          it('sets the request values', () => {
            const request = ArcHttpRequest.fromName(name);
            const { expects } = request;
            assert.equal(expects.url, '', 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, 'GET', 'sets the HTTP method');
          });
  
          it('sets the info values', () => {
            const request = ArcHttpRequest.fromName(name);
            const { info } = request;
            assert.equal(info.name, name, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcHttpRequest.fromName(name);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcHttpRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });

          it('creates the key from the created time', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.key, new Date(result.created).toJSON());
          });
        });
  
        describe('ArcHttpRequest.fromHttpRequest()', () => {
          let iRequest: IHttpRequest;
  
          beforeEach(() => {
            iRequest = {
              kind: ArcHttpRequestKind,
              method: 'PUT',
              url: 'https://api.com',
              headers: 'x-test: true',
              payload: 'something',
            };
          });
  
          it('sets the request values', () => {
            const request = ArcHttpRequest.fromHttpRequest(iRequest);
            const { expects } = request;
            assert.equal(expects.url, iRequest.url, 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, iRequest.method, 'sets the HTTP method');
            assert.equal(expects.headers, iRequest.headers, 'sets the headers');
            assert.equal(expects.payload, iRequest.payload, 'sets the payload');
          });
  
          it('sets the info values', () => {
            const request = ArcHttpRequest.fromHttpRequest(iRequest);
            const { info } = request;
            assert.equal(info.name, iRequest.url, 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcHttpRequest.fromHttpRequest(iRequest);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcHttpRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });

          it('creates the key from the created time', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.key, new Date(result.created).toJSON());
          });
        });
  
        describe('ArcHttpRequest.fromRequest()', () => {
          let iRequest: IArcHttpRequest;
  
          beforeEach(() => {
            const httpRequest: IHttpRequest = {
              kind: RequestKind,
              method: 'PUT',
              url: 'https://api.com',
              headers: 'x-test: true',
              payload: 'something',
            };
            const r = ArcHttpRequest.fromHttpRequest(httpRequest);
            r.info.name = 'a name';
            iRequest = r.toJSON();
          });
  
          it('sets the request values', () => {
            const request = ArcHttpRequest.fromRequest(iRequest);
            const { expects } = request;
            assert.equal(expects.url, iRequest.expects.url, 'sets the empty url');
            assert.equal(expects.kind, HttpRequestKind, 'sets the kind');
            assert.equal(expects.method, iRequest.expects.method, 'sets the HTTP method');
            assert.equal(expects.headers, iRequest.expects.headers, 'sets the headers');
            assert.equal(expects.payload, iRequest.expects.payload, 'sets the payload');
          });
  
          it('sets the info values', () => {
            const request = ArcHttpRequest.fromRequest(iRequest);
            const { info } = request;
            assert.equal(info.name, 'a name', 'sets the name');
            assert.equal(info.kind, ThingKind, 'sets the kind');
          });
  
          it('sets request meta', () => {
            const request = ArcHttpRequest.fromRequest(iRequest);
            assert.typeOf(request.key, 'string', 'has the key');
            assert.equal(request.kind, ArcHttpRequestKind, 'sets the kind');
            assert.typeOf(request.created, 'number', 'sets the created');
            assert.equal(request.updated, request.created, 'sets the updated');
          });

          it('creates the key from the created time', () => {
            const result = new ArcHttpRequest();
            assert.equal(result.key, new Date(result.created).toJSON());
          });
        });
      });
    });
  })
});
