import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { EventTypes } from '../../src/events/EventTypes.js';
import { 
  OperatorEnum, 
  RequestDataSourceEnum, 
  ActionTypeEnum,
  ResponseDataSourceEnum,
} from '../../src/models/actions/Enums.js';
import { 
  RequestFactory, 
  ISentRequest, 
  ISetCookieAction, 
  ISetVariableAction, 
  Condition, 
  ModulesRegistry, 
  RequestCookiesModule, 
  RequestAuthorizationModule,
  RegistryPermission, 
  IHttpRequest, 
  IHttpCookie,
} from '../../index.js';
import getConfig from '../helpers/getSetup.js';

chai.use(chaiAsPromised);

describe('Runtime', () => {
  describe('NodeJS', () => {
    describe('RequestFactory', () => {
      let httpPort: number;

      before(async () => {
        const cnf = await getConfig();
        httpPort = cnf.httpPort;
      });
  
      describe('simple request run', () => {
        it('sends a simple request', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          };
          const result = await factory.run(request);
          assert.typeOf(result, 'object', 'returns an object');
          assert.equal(result.kind, 'ARC#ResponseLog', 'has the kind');
          assert.typeOf(result.request, 'object', 'has the request');
          assert.typeOf(result.response, 'object', 'has the response');
          assert.typeOf(result.size, 'object', 'has the size');
        });

        it('applies variables to the URL', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          factory.variables = {
            var1: 'value1',
            var2: 'value2',
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get?parsed={var1}`,
            method: 'GET',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.include(sent.url, '?parsed=value1', 'has the parsed URL');
        });

        it('applies variables to the method', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          factory.variables = {
            var1: 'value1',
            var2: 'value2',
            operation: 'GET',
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: '{operation}',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.method, 'GET');
        });

        it('applies variables to the headers', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          factory.variables = {
            var1: 'value1',
            var2: 'value2',
            operation: 'GET',
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: {var2}',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.headers, 'x-test: value2');
        });

        it('applies variables to the payload', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          factory.variables = {
            var1: 'value1',
            var2: 'value2',
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'POST',
            headers: 'content-type: application/x-www-form-urlencoded\ncontent-length: 8',
            payload: 'a={var1}'
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.payload, 'a=value1');
        });

        it('applies request configuration (defaultHeaders)', async () => {
          const et = new EventTarget();
          const factory = new RequestFactory(et);
          factory.config = {
            kind: 'ARC#RequestConfig',
            enabled: true,
            defaultHeaders: true,
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'POST',
            headers: 'content-type: application/x-www-form-urlencoded\ncontent-length: 8',
            payload: 'a=b'
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.include(sent.headers, 'user-agent: api client', 'has the user-agent');
          assert.include(sent.headers, 'accept: */*', 'has the accept');
        });
      });

      describe('request actions', () => {
        describe('conditions', () => {
          it('does not run an action when not enabled', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: false,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isFalse(spy.called);
          });
  
          it('does not run the action when condition failed (method)', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: {
                    kind: 'ARC#Condition',
                    type: ActionTypeEnum.request,
                    source: RequestDataSourceEnum.method,
                    operator: OperatorEnum.equal,
                    value: 'POST',
                  },
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isFalse(spy.called);
          });

          it('does not run the action when condition failed (url)', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: false,
                  condition: {
                    kind: 'ARC#Condition',
                    type: ActionTypeEnum.request,
                    source: RequestDataSourceEnum.url,
                    operator: OperatorEnum.contains,
                    value: 'something',

                  },
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isFalse(spy.called);
          });
        });

        describe('Cookie delete action', () => {
          it('deletes a cookie from the request URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      useRequestUrl: true,
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.url, `http://localhost:${httpPort}/v1/get`, 'event has the URL');
          });
  
          it('deletes a cookie from the passed URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.url, `https://api.com`, 'event has the URL');
            assert.isUndefined(e.detail.name, 'event has no optional name');
          });

          it('has the optional name', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      useRequestUrl: true,
                      name: 'hello',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.name, 'hello', 'event has the name');
          });
        });

        describe('Cookie set action', () => {
          it('sets a cookie from the request URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const now = new Date().getTime();
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetCookieAction',
                      useRequestUrl: true,
                      name: 'c1',
                      source: {
                        source: 'value',
                        value: 'v1',
                      },
                      expires: String(now),
                      hostOnly: false,
                      httpOnly: true,
                      secure: false,
                      session: false,
                    } as ISetCookieAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.update, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            const { item } = e.detail;
            
            assert.equal(item.name, 'c1');
            assert.equal(item.value, 'v1');
            assert.equal(item.domain, `localhost:${httpPort}`);
            assert.equal(item.path, '/v1/get');
            assert.equal(item.sameSite, 'unspecified');
            assert.equal(item.expirationDate, now);
            assert.isFalse(item.hostOnly);
            assert.isFalse(item.session);
            assert.isFalse(item.secure);
            assert.isTrue(item.httpOnly);
          });

          it('sets a cookie from the set URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetCookieAction',
                      name: 'c1',
                      url: 'https://api.com',
                      source: {
                        source: 'value',
                        value: 'v1',
                      },
                    } as ISetCookieAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.update, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            const { item } = e.detail;
            assert.equal(item.domain, `api.com`);
            assert.equal(item.path, '/');
          });

          it('reads the cookie value from the request', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetCookieAction',
                      name: 'c1',
                      url: 'https://api.com',
                      source: {
                        source: RequestDataSourceEnum.url,
                        path: 'query.a'
                      },
                    } as ISetCookieAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get?a=b`,
              method: 'GET',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.update, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            const { item } = e.detail;
            assert.equal(item.value, `b`);
          });
        });

        describe('Variable set action', () => {
          it('sets a variable from the passed value', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const now = new Date().getTime();
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetVariableAction',
                      name: 'var1',
                      source: {
                        source: 'value',
                        value: 'val1',
                      },
                    } as ISetVariableAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Environment.set, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.name, 'var1');
            assert.equal(e.detail.value, 'val1');
          });

          it('sets a cookie from the request data', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              request: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetVariableAction',
                      name: 'var2',
                      source: {
                        source: RequestDataSourceEnum.headers,
                        path: 'x-test',
                        type: ActionTypeEnum.request,
                      },
                    } as ISetVariableAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Environment.set, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.name, 'var2');
            assert.equal(e.detail.value, 'true');
          });
        });
      });

      describe('request modules', () => {
        describe('request cookies', () => {
          beforeEach(() => {
            ModulesRegistry.register('request', 'request/cookies', RequestCookiesModule.processRequestCookies, [RegistryPermission.events]);
          });

          afterEach(() => {
            ModulesRegistry.unregister('request', 'request/cookies');
          });

          function cookieHandler(e: Event): void {
            const ev = e as CustomEvent;
            const { url } = ev.detail;
            if (url === `http://localhost:${httpPort}/v1/get`) {
              const cookies: IHttpCookie[] = [
                {
                  name: 'c1',
                  value: 'v1',
                  sameSite: 'no_restriction',
                },
                {
                  name: 'c2',
                  value: 'v3',
                  sameSite: 'strict',
                  path: '/abc'
                }
              ];
              ev.detail.result = Promise.resolve(cookies);
            }
          }

          it('adds a cookie to the request', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            et.addEventListener(EventTypes.Cookie.listUrl, cookieHandler);
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'x-test: true\ncookie: c1=v1; c2=v3');
          });

          it('ignores when event not handled', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'x-test: true');
          });


          it('creates headers when not set', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            et.addEventListener(EventTypes.Cookie.listUrl, cookieHandler);
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'cookie: c1=v1; c2=v3');
          });
        });

        describe('request authorization', () => {
          beforeEach(() => {
            ModulesRegistry.register('request', 'request/auth', RequestAuthorizationModule.default, [RegistryPermission.events]);
          });

          afterEach(() => {
            ModulesRegistry.unregister('request', 'request/auth');
          });

          it('applies the Bearer token', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  token: 'test123',
                },
                enabled: true,
                type: 'bearer',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'authorization: Bearer test123');
          });

          it('applies the OIDC token', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  accessToken: 'test123',
                },
                enabled: true,
                type: 'open id',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'authorization: Bearer test123');
          });

          it('applies the OAuth2 token with defaults', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  accessToken: 'test123',
                },
                enabled: true,
                type: 'oauth 2',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'authorization: Bearer test123');
          });

          it('applies the OAuth2 token with tokenType', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  accessToken: 'test123',
                  tokenType: 'test-type'
                },
                enabled: true,
                type: 'oauth 2',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'authorization: test-type test123');
          });

          it('applies the OAuth2 token with deliveryName', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  accessToken: 'test123',
                  deliveryName: 'x-auth'
                },
                enabled: true,
                type: 'oauth 2',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'x-auth: Bearer test123');
          });

          it('applies the OAuth2 token with deliveryMethod', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  accessToken: 'test123',
                  deliveryMethod: 'query',
                },
                enabled: true,
                type: 'oauth 2',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.include(sent.url, 'authorization=Bearer+test123');
          });

          it('ignores OAuth2 when no token', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: '',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                },
                enabled: true,
                type: 'oauth 2',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.isUndefined(sent.headers);
          });

          it('applies the Basic method', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  username: 'a',
                  password: 'b',
                },
                enabled: true,
                type: 'basic',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.equal(sent.headers, 'authorization: Basic YTpi');
          });

          it('ignores the Basic method when no username', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            factory.authorization = [
              {
                kind: '',
                config: {
                  password: 'b',
                },
                enabled: true,
                type: 'basic',
                valid: true,
              }
            ];
            const result = await factory.run(request);
            const sent = result.request as ISentRequest;
            assert.isUndefined(sent.headers);
          });
        });
      });

      describe('response action', () => {
        describe('conditions', () => {
          it('does not run an action when not enabled', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: false,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isFalse(spy.called);
          });
  
          it('does not run the action when condition failed (status)', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: {
                    kind: 'ARC#Condition',
                    type: ActionTypeEnum.response,
                    source: ResponseDataSourceEnum.status,
                    operator: OperatorEnum.equal,
                    value: '400',
                  },
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isFalse(spy.called);
          });

          it('runs the action when condition success (status)', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: {
                    kind: 'ARC#Condition',
                    type: ActionTypeEnum.response,
                    source: ResponseDataSourceEnum.status,
                    operator: OperatorEnum.equal,
                    value: '200',
                  },
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.called);
          });
        });

        describe('Cookie delete action', () => {
          it('deletes a cookie from the response URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      useRequestUrl: true,
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.url, `http://localhost:${httpPort}/v1/get`, 'event has the URL');
          });
  
          it('deletes a cookie from the passed URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      url: 'https://api.com',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.url, `https://api.com`, 'event has the URL');
            assert.isUndefined(e.detail.name, 'event has no optional name');
          });

          it('has the optional name', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#DeleteCookieAction',
                      useRequestUrl: true,
                      name: 'hello',
                    }
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.deleteUrl, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            assert.equal(e.detail.name, 'hello', 'event has the name');
          });
        });

        describe('Cookie set action', () => {
          it('sets a cookie from the request URL', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            const now = new Date().getTime();
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetCookieAction',
                      useRequestUrl: true,
                      name: 'c1',
                      source: {
                        source: 'value',
                        value: 'v1',
                      },
                      expires: String(now),
                      hostOnly: false,
                      httpOnly: true,
                      secure: false,
                      session: false,
                    } as ISetCookieAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.update, spy);
            await factory.run(request);
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            const { item } = e.detail;
            
            assert.equal(item.name, 'c1');
            assert.equal(item.value, 'v1');
            assert.equal(item.domain, `localhost:${httpPort}`);
            assert.equal(item.path, '/v1/get');
            assert.equal(item.sameSite, 'unspecified');
            assert.equal(item.expirationDate, now);
            assert.isFalse(item.hostOnly);
            assert.isFalse(item.session);
            assert.isFalse(item.secure);
            assert.isTrue(item.httpOnly);
          });

          it('reads the cookie value from the response', async () => {
            const et = new EventTarget();
            const factory = new RequestFactory(et);
            factory.actions = {
              response: [
                {
                  kind: 'ARC#RunnableAction',
                  enabled: true,
                  condition: Condition.alwaysPass().toJSON(),
                  actions: [{
                    kind: 'ARC#Action',
                    config: {
                      kind: 'ARC#SetCookieAction',
                      name: 'c1',
                      url: 'https://api.com',
                      source: {
                        source: RequestDataSourceEnum.body,
                        path: 'headers."x-test"'
                      },
                    } as ISetCookieAction,
                  }]
                }
              ],
            };
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/post`,
              method: 'POST',
              headers: 'x-test: x-value'
            };
            const spy = sinon.spy();
            et.addEventListener(EventTypes.Cookie.update, spy);
            await factory.run(request);
            // const response = new ArcResponse(log.response as IArcResponse);
            // const payload = await response.readPayload() as Buffer;
            // const bodyStr = payload.toString('utf8');
            
            assert.isTrue(spy.calledOnce, 'the action called the event');
            const e = spy.args[0][0] as CustomEvent;
            const { item } = e.detail;
            assert.equal(item.value, `x-value`);
          });
        });
      });
    });
  });
});
