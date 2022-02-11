import { assert } from '@esm-bundle/chai';
import { Request, IRequest, Kind as RequestKind, updatedSymbol, midnightSymbol } from '../../src/models/Request.js';
import { HttpRequest, IHttpRequest, Kind as HttpRequestKind } from '../../src/models/HttpRequest.js';
import { ErrorResponse } from '../../src/models/ErrorResponse.js';
import { RequestLog } from '../../src/models/RequestLog.js';
import { RequestConfig, Kind as RequestConfigKind } from '../../src/models/RequestConfig.js';
import { RequestAuthorization } from '../../src/models/RequestAuthorization.js';
import { RequestUiMeta } from '../../src/models/RequestUiMeta.js';
import { RequestActions } from '../../src/models/RequestActions.js';
import { Kind as ThingKind } from '../../src/models/Thing.js';
import { ARCSavedRequest } from '../../src/models/legacy/request/ArcRequest.js';
import { ISafePayload } from '../../src/lib/transformers/PayloadSerializer.js';

describe('Models', () => {
  describe('Request', () => {
    describe('Request.fromUrl()', () => {
      const url = 'https://dot.com';

      it('sets the request data', () => {
        const result = Request.fromUrl(url);
        assert.equal(result.kind, RequestKind);
        assert.typeOf(result.created, 'number');
        assert.typeOf(result.updated, 'number');
        const { expects, info } = result;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');

        assert.equal(expects.method, 'GET');
        assert.equal(expects.url, url);
        assert.equal(info.name, url);
      });
    });

    describe('Request.fromName()', () => {
      const name = 'a name';

      it('sets the request data', () => {
        const result = Request.fromName(name);
        assert.equal(result.kind, RequestKind);
        assert.typeOf(result.created, 'number');
        assert.typeOf(result.updated, 'number');
        const { expects, info } = result;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');

        assert.equal(expects.method, 'GET');
        assert.equal(expects.url, '');
        assert.equal(info.name, name);
      });
    });

    describe('Request.fromHttpRequest()', () => {
      it('sets the request data', () => {
        const schema: IHttpRequest = {
          kind: HttpRequestKind,
          url: 'https://dot.com',
          headers: 'a: b',
          method: 'PUT',
          payload: 'test',
        };
        const result = Request.fromHttpRequest(schema);

        assert.equal(result.kind, RequestKind);
        assert.typeOf(result.created, 'number');
        assert.typeOf(result.updated, 'number');
        const { expects, info } = result;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');

        assert.equal(expects.url, schema.url);
        assert.equal(expects.method, schema.method);
        assert.equal(expects.headers, schema.headers);
        assert.equal(expects.payload, schema.payload);
        assert.equal(info.name, schema.url);
      });
    });

    describe('Request.fromLegacy()', () => {
      it('throws when unknown object', async () => {
        let thrown = false;
        try {
          await Request.fromLegacy(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('sets the created and updated', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          created: 1234567890,
          updated: 987654321,
        });
        assert.equal(instance.created, 1234567890);
        assert.equal(instance.updated, 987654321);
      });

      it('sets the default created', async () => {
        const now = Date.now();
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        });
        assert.approximately(instance.created, now, 2);
      });

      it('sets the default updated', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        });
        assert.equal(instance.updated, instance.created);
      });

      it('sets the expects object', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          headers: 'x-a: b',
          payload: 'test-payload',
        });
        const { expects } = instance;
        assert.equal(expects.method, 'PUT');
        assert.equal(expects.url, 'https://dot.com');
        assert.equal(expects.headers, 'x-a: b');
        assert.equal(expects.payload, 'test-payload');
      });

      it('sets the info object', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        });
        const { info } = instance;
        assert.equal(info.name, 'test');
      });

      it('sets the payload from a Blob', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          blob: 'test'
        });
        const { expects } = instance;
        assert.ok(expects.payload, 'has the payload');
        const payload = expects.payload as ISafePayload;
        assert.equal(payload.type, 'blob');
        assert.deepEqual(payload.data, 'test');
      });

      it('sets the payload from a multipart', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          multipart: [
            {
              name: 'a',
              isFile: false,
              value: 'b',
            }
          ],
        });
        const { expects } = instance;
        assert.ok(expects.payload, 'has the payload');
        const payload = expects.payload as ISafePayload;
        assert.equal(payload.type, 'formdata');
        assert.deepEqual(payload.data, [{
          name: 'a',
          isFile: false,
          value: 'b',
        }]);
      });

      it('sets the payload from an ArrayBuffer', async () => {
        const encoder = new TextEncoder();
        const view = encoder.encode('test');

        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          payload: view.buffer,
        });
        const { expects } = instance;
        assert.ok(expects.payload, 'has the payload');
        const payload = expects.payload as ISafePayload;
        assert.equal(payload.type, 'arraybuffer');
        assert.deepEqual(payload.data, [ 116, 101, 115, 116 ]);
      });

      it('translates the actions object', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          actions: {
            request: [
              {
                condition: {
                  source: 'body',
                  alwaysPass: true,
                  path: 'a.b.c',
                  type: 'request',
                },
                actions: [
                  {
                    priority: 0,
                    type: 'request',
                    name: 'set-cookie',
                    config: {
                      
                    },
                  }
                ],
                enabled: true,
                type: 'request',
              }
            ],
            response: [
              {
                condition: {
                  source: 'body',
                  alwaysPass: true,
                  path: 'a.b.c',
                  type: 'response',
                },
                actions: [
                  {
                    priority: 0,
                    type: 'response',
                    config: {
                    },
                    name: 'set-cookie',
                  }
                ],
                enabled: true,
                type: 'response',
              }
            ],
          },
        });
        const { actions } = instance;
        assert.ok(actions, 'has actions');
        assert.typeOf(actions.request, 'array', 'has request actions');
        assert.typeOf(actions.response, 'array', 'has response actions');

        const [reqAction] = actions.request;
        assert.equal(reqAction.kind, 'ARC#RunnableAction');

        const [resAction] = actions.response;
        assert.equal(resAction.kind, 'ARC#RunnableAction');
      });

      it('translates the config object', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          config: {
            enabled: true,
            defaultHeaders: true,
            followRedirects: true,
            hosts: [],
            ignoreSessionCookies: false,
            nativeTransport: true,
            timeout: 500,
            validateCertificates: true,
            variables: [],
          },
        });
        const { config } = instance;

        assert.typeOf(config, 'object', 'has the UI definition');
        assert.equal(config.kind, 'ARC#RequestConfig');

        assert.isTrue(config.enabled);
        assert.isTrue(config.followRedirects);
        assert.isTrue(config.validateCertificates);
        assert.isTrue(config.defaultHeaders);
        assert.isFalse(config.ignoreSessionCookies);
        assert.equal(config.timeout, 500);
        assert.typeOf(config.hosts, 'array');
        assert.typeOf(config.variables, 'array');
      });

      it('translates the authorization', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          authorization: [
            {
              enabled: true,
              type: 'oauth 2',
              valid: true,
              config: {},
            }
          ],
        });

        const { authorization } = instance;
        assert.typeOf(authorization, 'array');
        const [info] = authorization;
        assert.equal(info.enabled, true);
      });

      it('creates the log with the request data', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          transportRequest: {
            endTime: 123456,
            httpMessage: 'test message',
            method: 'PUT',
            startTime: 789456,
            url: 'https://dot.com',
            headers: 'x-a: b',
            payload: 'test-payload',
          }
        });
        const { log } = instance;
        assert.ok(log, 'has the log');
        assert.equal(log.kind, 'ARC#ResponseLog');
        assert.ok(log.request, 'has the log.request');
        assert.notOk(log.response, 'has no log.response');
        assert.notOk(log.redirects, 'has no log.redirects');
        assert.equal(log.request.kind, 'ARC#HttpRequest');
      });

      it('creates the log with the response data', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          response: {
            loadingTime: 1,
            status: 200,
          }
        });
        const { log } = instance;
        assert.ok(log, 'has the log');
        assert.equal(log.kind, 'ARC#ResponseLog');
        assert.ok(log.response, 'has the log.response');
        assert.notOk(log.request, 'has no log.request');
        assert.notOk(log.redirects, 'has no log.redirects');
        assert.equal(log.response.kind, 'ARC#HttpResponse');
        assert.equal(log.response.status, 200);
      });

      it('creates the log with an error response data', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          response: {
            loadingTime: 1,
            status: 0,
            error: new Error('test'),
          }
        });
        const { log } = instance;
        assert.ok(log, 'has the log');
        assert.equal(log.kind, 'ARC#ResponseLog');
        assert.ok(log.response, 'has the log.response');
        assert.notOk(log.request, 'has no log.request');
        assert.notOk(log.redirects, 'has no log.redirects');
        assert.equal(log.response.kind, 'ARC#HttpResponse');
        assert.equal(log.response.status, 0);
        const err = log.response as ErrorResponse;
        assert.equal(err.error.message, 'test');
      });

      it('creates the log with redirects data', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          response: {
            loadingTime: 1,
            status: 200,
            redirects: [
              {
                endTime: 12345,
                response: {
                  status: 207,
                },
                startTime: 9876,
                url: 'https://rdr.com',
                timings: {
                  blocked: 1,
                  connect: 2,
                  dns: 3,
                  receive: 4,
                  send: 5,
                  wait: 6,
                },
              }
            ],
          }
        });
        const { log } = instance;
        assert.ok(log, 'has the log');
        const { redirects } = log;
        assert.typeOf(redirects, 'array');
        assert.lengthOf(redirects, 1);
      });

      it('creates the log with size data', async () => {
        const instance = await Request.fromLegacy({
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
          response: {
            loadingTime: 1,
            status: 200,
            size: {
              request: 200,
              response: 400,
            }
          }
        });
        const { log } = instance;
        assert.ok(log, 'has the log');
        const { size } = log;
        assert.typeOf(size, 'object');
        assert.equal(size.request, 200);
        assert.equal(size.response, 400);
      });

      it('sets the default HTTP method', async () => {
        const info: ARCSavedRequest = {
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        };
        delete info.method;
        const instance = await Request.fromLegacy(info);
        assert.equal(instance.expects.method, 'GET');
      });

      it('sets the default request url', async () => {
        const info: ARCSavedRequest = {
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        };
        delete info.url;
        const instance = await Request.fromLegacy(info);
        assert.equal(instance.expects.url, '');
      });

      it('sets the default request name', async () => {
        const info: ARCSavedRequest = {
          method: 'PUT',
          name: 'test',
          url: 'https://dot.com',
        };
        delete info.name;
        const instance = await Request.fromLegacy(info);
        assert.equal(instance.info.name, 'Unnamed request');
      });
    });

    describe('#created', () => {
      it('sets the value', () => {
        const instance = new Request();
        instance.created = 1234;
        assert.equal(instance.created, 1234);
      });

      it('sets the current time when value is missing', () => {
        const instance = new Request();
        const now = Date.now();
        instance.created = undefined;
        assert.approximately(instance.created, now, 10);
      });
    });

    describe('#updated', () => {
      it('sets the value', () => {
        const instance = new Request();
        instance.updated = 1234;
        assert.equal(instance.updated, 1234);
      });

      it('sets the created time when value is missing', () => {
        const instance = new Request();
        instance.updated = undefined;
        assert.equal(instance.updated, instance.created);
      });

      it('sets the midnight value', () => {
        const instance = new Request();
        instance.updated = 1641774295483;
        // assert.equal(instance.midnight, 1641715200000);
        assert.typeOf(instance.midnight, 'number');
      });
    });

    describe('#midnight', () => {
      it('sets the value', () => {
        const instance = new Request();
        instance.midnight = 1234;
        assert.equal(instance.midnight, 1234);
      });

      it('sets the default value when the value is missing', () => {
        const instance = new Request();
        instance[updatedSymbol] = 1641774295483;
        instance.midnight = undefined;
        // assert.equal(instance.midnight, 1641715200000);
        assert.typeOf(instance.midnight, 'number');
      });

      it('reads the default value when not set', () => {
        const instance = new Request();
        instance[updatedSymbol] = 1641774295483;
        instance[midnightSymbol] = undefined;
        // assert.equal(instance.midnight, 1641715200000);
        assert.typeOf(instance.midnight, 'number');
      });
    });

    describe('constructor()', () => {
      it('creates the default values', () => {
        const now = Date.now();
        const instance = new Request();
        assert.equal(instance.kind, RequestKind);

        assert.typeOf(instance.created, 'number');
        assert.typeOf(instance.updated, 'number');

        assert.approximately(instance.created, now, 2);
        assert.approximately(instance.updated, now, 2);

        const { expects, info } = instance;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');

        assert.equal(expects.method, 'GET');
        assert.equal(expects.url, '');
        assert.equal(expects.kind, HttpRequestKind);

        assert.equal(info.name, '');
        assert.equal(info.kind, ThingKind);
      });

      it('creates values from the schema', () => {
        const now = Date.now();
        const schema: IRequest = {
          kind: RequestKind,
          created: now,
          updated: now,
          expects: {
            url: 'https://dot.com',
            headers: 'x-test: true',
            method: 'PUT',
          },
          info: {
            name: 'a request',
          },
        };
        const instance = new Request(schema);

        assert.equal(instance.kind, RequestKind);
        assert.equal(instance.created, now);
        assert.equal(instance.updated, now);
        const { expects, info } = instance;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');
        assert.equal(expects.method, 'PUT');
        assert.equal(expects.url, 'https://dot.com');
        assert.equal(expects.kind, HttpRequestKind);

        assert.equal(info.name, 'a request');
        assert.equal(info.kind, ThingKind);
      });

      it('creates values from the JSON schema string', () => {
        const now = Date.now();
        const schema: IRequest = {
          kind: RequestKind,
          created: now,
          updated: now,
          expects: {
            url: 'https://dot.com',
            headers: 'x-test: true',
            method: 'PUT',
          },
          info: {
            name: 'a request',
            kind: ThingKind,
          },
        };
        const instance = new Request(JSON.stringify(schema));

        assert.equal(instance.kind, RequestKind);
        assert.equal(instance.created, now);
        assert.equal(instance.updated, now);
        const { expects, info } = instance;
        assert.typeOf(expects, 'object', 'sets the expects');
        assert.typeOf(info, 'object', 'sets the info');
        assert.equal(expects.method, 'PUT');
        assert.equal(expects.url, 'https://dot.com');
        assert.equal(expects.kind, HttpRequestKind);

        assert.equal(info.name, 'a request');
        assert.equal(info.kind, ThingKind);
      });
    });

    describe('new()', () => {
      it('sets the passed expects', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.expects.url = 'https://api.com';
        schema.expects.method = 'PATCH';
        schema.expects.headers = 'x-header: true';
        schema.expects.payload = 'a message';
        instance.new(schema);

        assert.equal(instance.expects.url, 'https://api.com');
        assert.equal(instance.expects.method, 'PATCH');
        assert.equal(instance.expects.headers, 'x-header: true');
        assert.equal(instance.expects.payload, 'a message');
      });

      it('sets the default expects', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        delete schema.expects;
        instance.new(schema);

        assert.equal(instance.expects.url, '');
        assert.equal(instance.expects.method, 'GET');
        assert.isUndefined(instance.expects.headers);
        assert.isUndefined(instance.expects.payload);
      });

      it('sets the passed info', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.info.name = 'a';
        schema.info.description = 'b';
        schema.info.version = 'c';
        instance.new(schema);

        assert.equal(instance.info.name, 'a');
        assert.equal(instance.info.description, 'b');
        assert.equal(instance.info.version, 'c');
      });

      it('sets the kind on the info object when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        delete schema.info.kind;
        schema.info.description = 'b';
        instance.new(schema);

        assert.equal(instance.info.kind, ThingKind);
        assert.equal(instance.info.description, 'b');
      });

      it('sets the default info', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        delete schema.info;
        instance.new(schema);

        assert.equal(instance.info.name, '');
        assert.isUndefined(instance.info.description);
        assert.isUndefined(instance.info.version);
      });

      it('sets the passed log', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.log = {
          kind: 'ARC#ResponseLog',
          request: {
            startTime: 1,
            url: 'test'
          }
        };
        instance.new(schema);

        assert.typeOf(instance.log, 'object');
        assert.equal(instance.log.kind, 'ARC#ResponseLog');
        assert.typeOf(instance.log.request, 'object');
        assert.equal(instance.log.request.startTime, 1);
      });

      it('sets the log to undefined when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.log = {
          kind: 'ARC#ResponseLog',
          request: {
            startTime: 1,
            url: 'test'
          }
        };
        instance.new(schema);
        assert.typeOf(instance.log, 'object');
        // now delete it and re-set.
        delete schema.log;
        instance.new(schema);
        assert.isUndefined(schema.log);
      });

      it('sets the config', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.config = {
          enabled: true,
          kind: 'ARC#RequestConfig',
          timeout: 10,
        };
        instance.new(schema);

        assert.typeOf(instance.config, 'object');
        assert.equal(instance.config.timeout, 10);
      });

      it('sets the config to undefined when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.config = {
          enabled: true,
          kind: 'ARC#RequestConfig',
          timeout: 10,
        };
        instance.new(schema);
        delete schema.config;
        instance.new(schema);
        assert.isUndefined(instance.config);
      });

      it('sets the authorization', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.authorization = [
          {
            kind: 'ARC#RequestAuthorization',
            enabled: true,
            type: 'oauth 2',
            valid: true,
            config: {},
          }
        ];
        instance.new(schema);

        assert.typeOf(instance.authorization, 'array');
        assert.equal(instance.authorization[0].type, 'oauth 2');
      });

      it('sets the authorization to undefined when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.authorization = [
          {
            kind: 'ARC#RequestAuthorization',
            enabled: true,
            type: 'oauth 2',
            valid: true,
            config: {},
          }
        ];
        instance.new(schema);
        delete schema.authorization;
        instance.new(schema);

        assert.isUndefined(instance.authorization);
      });

      it('sets the created', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.created = 1234567;
        instance.new(schema);
        assert.equal(instance.created, 1234567);
      });

      it('sets the created as current time', () => {
        const now = Date.now();
        const instance = new Request();
        const schema = instance.toJSON();
        delete schema.created;
        instance.new(schema);
        assert.approximately(instance.created, now, 2);
      });

      it('sets the updated', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.updated = 1234567;
        instance.new(schema);
        assert.equal(instance.updated, 1234567);
      });

      it('sets the updated to created when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        delete schema.updated;
        instance.new(schema);
        assert.equal(instance.updated, instance.created);
      });

      it('sets the midnight', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.midnight = 1234567;
        instance.new(schema);
        assert.equal(instance.midnight, 1234567);
      });

      it('sets the actions', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.actions = {
          request: [
            {
              condition: {
                source: 'value',
                alwaysPass: true,
                kind: 'ARC#Condition',
              },
              actions: [
                {
                  priority: 0,
                  config: {

                  },
                  name: 'set-cookie',
                }
              ],
              enabled: true,
            }
          ],
          response: [],
        };
        instance.new(schema);

        const { actions } = instance;
        assert.ok(actions, 'has actions');
        assert.typeOf(actions.request, 'array', 'has request actions');
        assert.typeOf(actions.response, 'array', 'has response actions');

        const [reqAction] = actions.request;
        assert.equal(reqAction.kind, 'ARC#RunnableAction');
      });

      it('sets the actions to undefined when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.actions = {
          request: [],
          response: [],
        };
        instance.new(schema);
        delete schema.actions;
        instance.new(schema);

        assert.isUndefined(instance.actions);
      });

      it('sets the clientCertificate', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.clientCertificate = {
          type: 'pem',
          cert: {
            data: 'abc'
          },
        };
        instance.new(schema);

        const { clientCertificate } = instance;
        assert.ok(clientCertificate, 'has clientCertificate');
      });

      it('sets the clientCertificate to undefined when missing', () => {
        const instance = new Request();
        const schema = instance.toJSON();
        schema.clientCertificate = {
          type: 'pem',
          cert: {
            data: 'abc'
          },
        };
        instance.new(schema);
        delete schema.clientCertificate;
        instance.new(schema);

        assert.isUndefined(instance.clientCertificate);
      });
    });

    describe('toJSON()', () => {
      it('sets the expects', () => {
        const instance = new Request();
        instance.expects.url = 'https://api.com';
        instance.expects.method = 'PATCH';
        instance.expects.headers = 'x-header: true';
        instance.expects.payload = 'a message';
        
        const result = instance.toJSON();

        assert.equal(result.expects.url, 'https://api.com');
        assert.equal(result.expects.method, 'PATCH');
        assert.equal(result.expects.headers, 'x-header: true');
        assert.equal(result.expects.payload, 'a message');
      });

      it('sets the info', () => {
        const instance = new Request();
        instance.info.name = 'a';
        instance.info.description = 'b';
        instance.info.version = 'c';
        
        const result = instance.toJSON();

        assert.equal(result.info.name, 'a');
        assert.equal(result.info.description, 'b');
        assert.equal(result.info.version, 'c');
      });

      it('sets the kind', () => {
        const instance = new Request();
        const result = instance.toJSON();

        assert.equal(result.kind, RequestKind);
      });

      it('sets the updated, created, and midnight', () => {
        const now = Date.now();
        const instance = new Request();
        instance.created = now;
        instance.updated = now;
        instance.midnight = 1234;

        const result = instance.toJSON();

        assert.equal(result.created, now);
        assert.equal(result.updated, now);
        assert.equal(result.midnight, 1234);
      });

      it('sets the log', () => {
        const instance = new Request();
        instance.log = new RequestLog({
          kind: 'ARC#ResponseLog',
          request: {
            startTime: 1,
            url: 'test'
          }
        });
        
        const result = instance.toJSON();

        assert.typeOf(result.log, 'object');
        assert.equal(result.log.kind, 'ARC#ResponseLog');
        assert.typeOf(result.log.request, 'object');
        assert.equal(result.log.request.startTime, 1);
      });

      it('does not set the log when missing', () => {
        const instance = new Request();
        const result = instance.toJSON();
        assert.isUndefined(result.log);
      });

      it('sets the config', () => {
        const instance = new Request();
        instance.config = new RequestConfig({
          enabled: true,
          kind: 'ARC#RequestConfig',
          timeout: 10,
        });
        const result = instance.toJSON();
        assert.typeOf(result.config, 'object');
        assert.equal(result.config.timeout, 10);
      });

      it('does not set the config when missing', () => {
        const instance = new Request();
        const result = instance.toJSON();
        assert.isUndefined(result.config);
      });

      it('sets the authorization', () => {
        const instance = new Request();
        instance.authorization = [
          new RequestAuthorization({
            kind: 'ARC#RequestAuthorization',
            enabled: true,
            type: 'oauth 2',
            valid: true,
            config: {},
          }),
        ];
        const result = instance.toJSON();

        assert.typeOf(result.authorization, 'array');
        assert.equal(result.authorization[0].type, 'oauth 2');
      });

      it('does not set the authorization when missing', () => {
        const instance = new Request();
        const result = instance.toJSON();
        assert.isUndefined(result.authorization);
      });
      
      it('sets the actions', () => {
        const instance = new Request();
        instance.actions = new RequestActions({
          request: [
            {
              condition: {
                source: 'value',
                alwaysPass: true,
                kind: 'ARC#Condition',
              },
              actions: [
                {
                  priority: 0,
                  config: {

                  },
                  name: 'set-cookie',
                }
              ],
              enabled: true,
            }
          ],
          response: [],
        });
        const result = instance.toJSON();
        const { actions } = result;
        assert.ok(actions, 'has actions');
        assert.typeOf(actions.request, 'array', 'has request actions');
        assert.typeOf(actions.response, 'array', 'has response actions');

        const [reqAction] = actions.request;
        assert.equal(reqAction.kind, 'ARC#RunnableAction');
      });

      it('does not set the actions when missing', () => {
        const instance = new Request();
        const result = instance.toJSON();
        assert.isUndefined(result.actions);
      });

      it('sets the clientCertificate', () => {
        const instance = new Request();
        instance.clientCertificate = {
          type: 'pem',
          cert: {
            data: 'abc'
          },
        };
        const result = instance.toJSON();
        const { clientCertificate } = result;
        assert.ok(clientCertificate, 'has clientCertificate');
      });

      it('sets the clientCertificate to undefined when missing', () => {
        const instance = new Request();
        const result = instance.toJSON();
        assert.isUndefined(result.clientCertificate);
      });
    });

    describe('setInfo()', () => {
      it('sets the info from the schema', () => {
        const instance = new Request();
        instance.setInfo({
          kind: ThingKind,
          name: 'test',
        });
        assert.equal(instance.info.name, 'test');
      });

      it('sets the updated', () => {
        const now = Date.now();
        const instance = new Request();
        instance.setInfo({
          kind: ThingKind,
          name: 'test',
        });
        assert.approximately(instance.updated, now, 2);
      });
    });

    describe('getExpects()', () => {
      it('sets the expects object when missing', () => {
        const instance = new Request();
        delete instance.expects;
        const result = instance.getExpects();
        assert.typeOf(result, 'object', 'returns an object');
        assert.deepEqual(result, instance.expects, 'sets the expects on the instance');
      });

      it('returns the expects object', () => {
        const instance = new Request();
        instance.expects = new HttpRequest({
          kind: HttpRequestKind,
          url: 'domain.com'
        });
        const result = instance.getExpects();
        assert.deepEqual(result, instance.expects);
      });
    });

    describe('getConfig()', () => {
      it('sets the config object when missing', () => {
        const instance = new Request();
        delete instance.config;
        const result = instance.getConfig();
        assert.typeOf(result, 'object', 'returns an object');
        assert.deepEqual(result, instance.config, 'sets the config on the instance');
      });

      it('returns the config object', () => {
        const instance = new Request();
        instance.config = new RequestConfig({
          kind: RequestConfigKind,
          enabled: true,
        });
        const result = instance.getConfig();
        assert.deepEqual(result, instance.config);
      });
    });

    describe('setLog()', () => {
      it('sets the log object from the schema', () => {
        const schema = new RequestLog({
          kind: 'ARC#ResponseLog',
          request: {
            startTime: 1,
            url: 'test'
          }
        }).toJSON();
        const instance = new Request();
        instance.setLog(schema);

        assert.ok(instance.log, 'has the log');
        assert.equal(instance.log.request.url, 'test');
      });

      it('sets the updated', () => {
        const schema = new RequestLog({
          kind: 'ARC#ResponseLog',
          request: {
            startTime: 1,
            url: 'test'
          }
        }).toJSON();
        const now = Date.now();
        const instance = new Request();
        instance.setLog(schema);

        assert.approximately(instance.updated, now, 2);
      });
    });
  });
});
