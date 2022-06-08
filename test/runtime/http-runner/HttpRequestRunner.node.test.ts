import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { 
  HttpRequestRunner,
  DummyLogger,
  IHttpRequest,
  RequestLogKind,
  ISentRequest,
  RequestConfigKind,
  RequestAuthorizationKind,
} from '../../../index.js';
import getConfig from '../../helpers/getSetup.js';
import { ActionOperatorEnum, ActionRequestDataEnum, ActionResponseDataEnum, ActionSourceEnum, DeleteCookieStepKind, IDeleteCookieStep, IReadDataStep, ISetCookieStep, ISetDataStep, ISetVariableStep, ReadDataStepKind, SetCookieStepKind, SetDataStepKind, SetVariableStepKind } from '../../../src/models/http-actions/HttpActions.js';
import { InMemoryCookieJar, clearStore } from '../../../src/cookies/InMemoryCookieJar.js';
import { HttpCookie } from '../../../src/models/HttpCookie.js';

const logger = new DummyLogger();
chai.use(chaiAsPromised);

describe('Runtime', () => {
  describe('http-runner', () => {
    describe('HttpRequestRunner', () => {
      let httpPort: number;

      before(async () => {
        const cnf = await getConfig();
        httpPort = cnf.httpPort;
      });

      describe('simple request run', () => {
        it('sends a simple request', async () => {
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          };
          const result = await factory.run(request);
          assert.typeOf(result, 'object', 'returns an object');
          assert.equal(result.kind, RequestLogKind, 'has the kind');
          assert.typeOf(result.request, 'object', 'has the request');
          assert.typeOf(result.response, 'object', 'has the response');
          assert.typeOf(result.size, 'object', 'has the size');
        });

        it('applies variables to the URL', async () => {
          const factory = new HttpRequestRunner();
          factory.logger = logger;
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.config = {
            kind: RequestConfigKind,
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

      describe('request flows', () => {
        describe('conditions', () => {
          it('does not run an action when not enabled', async () => {
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.variables = {};
            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    steps: [
                      {
                        enabled: false,
                        kind: SetVariableStepKind,
                        name: 'test',
                      } as ISetVariableStep,
                    ],
                  }
                ],
              }
            ];
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            assert.deepEqual(factory.variables, {});
          });
  
          it('does not run the action when condition failed (method)', async () => {
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.variables = {};
            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    condition: {
                      source: ActionSourceEnum.request,
                      data: ActionRequestDataEnum.method,
                      operator: ActionOperatorEnum.equal,
                      value: 'POST',
                    },
                    steps: [
                      {
                        enabled: true,
                        kind: SetDataStepKind,
                        value: 'value'
                      } as ISetDataStep,
                      {
                        enabled: true,
                        kind: SetVariableStepKind,
                        name: 'v1',
                      } as ISetVariableStep,
                    ],
                  }
                ],
              }
            ];
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            assert.deepEqual(factory.variables, {});
          });

          it('does not run the action when condition failed (url)', async () => {
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.variables = {};
            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    condition: {
                      source: ActionSourceEnum.request,
                      data: ActionRequestDataEnum.url,
                      operator: ActionOperatorEnum.contains,
                      value: 'something',
                    },
                    steps: [
                      {
                        enabled: true,
                        kind: SetDataStepKind,
                        value: 'value'
                      } as ISetDataStep,
                      {
                        enabled: true,
                        kind: SetVariableStepKind,
                        name: 'v1',
                      } as ISetVariableStep,
                    ],
                  }
                ],
              }
            ];
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            assert.deepEqual(factory.variables, {});
          });
        });

        describe('Cookie delete action', () => {
          afterEach(() => {
            clearStore();
          });

          it('deletes a cookie from the request URL', async () => {
            const url = `http://localhost:${httpPort}/v1/get`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();
            const cookie = new HttpCookie({ name: 'c', value: 'v' });
            await factory.cookies.setCookies(url, [cookie]);

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: DeleteCookieStepKind,
                        name: 'c',
                      } as IDeleteCookieStep,
                    ],
                  }
                ],
              }
            ];
            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.deepEqual(storedCookies, []);
          });
  
          it('deletes a cookie from the passed URL', async () => {
            const url = `https://api.com`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();
            const cookie = new HttpCookie({ name: 'c', value: 'v' });
            await factory.cookies.setCookies(url, [cookie]);

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: DeleteCookieStepKind,
                        url,
                      } as IDeleteCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.deepEqual(storedCookies, []);
          });

          it('uses the optional name', async () => {
            const url = `http://localhost:${httpPort}/v1/get`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();
            const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
            const c2 = new HttpCookie({ name: 'c2', value: 'v2' });
            await factory.cookies.setCookies(url, [c1, c2]);

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: DeleteCookieStepKind,
                        name: 'c1',
                      } as IDeleteCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.deepEqual(storedCookies, [c2]);
          });
        });

        describe('Cookie set action', () => {
          afterEach(() => {
            clearStore();
          });

          it('sets a cookie from the request URL', async () => {
            const url = `http://localhost:${httpPort}/v1/get`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();
            const now = new Date().getTime();

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: SetDataStepKind,
                        value: 'v1',
                      } as ISetDataStep,
                      {
                        kind: SetCookieStepKind,
                        name: 'c1',
                        expires: String(now),
                        hostOnly: false,
                        httpOnly: true,
                        secure: false,
                        session: false,
                      } as ISetCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.lengthOf(storedCookies, 1, 'has the cookie');
            
            const [item] = storedCookies;
            assert.equal(item.name, 'c1', 'name');
            assert.equal(item.value, 'v1', 'value');
            assert.equal(item.domain, `localhost:${httpPort}`, 'domain');
            assert.equal(item.path, '/v1', 'path');
            assert.equal(item.sameSite, 'unspecified', 'sameSite');
            assert.equal(item.expirationDate, now, 'expirationDate');
            assert.isTrue(item.hostOnly, 'hostOnly');
            assert.isFalse(item.session, 'session');
            assert.isFalse(item.secure, 'secure');
            assert.isTrue(item.httpOnly, 'httpOnly');
          });

          it('sets a cookie from the set URL', async () => {
            const url = `https://api.com`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();
            
            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: SetDataStepKind,
                        value: 'v1',
                      } as ISetDataStep,
                      {
                        kind: SetCookieStepKind,
                        name: 'c1',
                        url,
                      } as ISetCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.lengthOf(storedCookies, 1, 'has the cookie');
            const [item] = storedCookies;
            assert.equal(item.domain, `api.com`, 'domain is set');
            assert.equal(item.path, '/', 'path is set');
          });

          it('sets the cookie value from the request', async () => {
            const url = `https://api.com`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();

            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    steps: [
                      {
                        kind: ReadDataStepKind,
                        source: ActionSourceEnum.request,
                        data: ActionRequestDataEnum.url,
                        path: 'query.a',
                      } as IReadDataStep,
                      {
                        kind: SetCookieStepKind,
                        name: 'c1',
                        url,
                      } as ISetCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get?a=b`,
              method: 'GET',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.lengthOf(storedCookies, 1, 'has the cookie');
            const [item] = storedCookies;
            assert.equal(item.value, `b`);
          });

          it('sets the cookie value from the response', async () => {
            const url = `https://api.com`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    steps: [
                      {
                        kind: ReadDataStepKind,
                        source: ActionSourceEnum.response,
                        data: ActionRequestDataEnum.body,
                        path: 'headers/x-test',
                      } as IReadDataStep,
                      {
                        kind: SetCookieStepKind,
                        name: 'c1',
                        url,
                      } as ISetCookieStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.lengthOf(storedCookies, 1, 'has the cookie');
            const [item] = storedCookies;
            assert.equal(item.name, `c1`);
            assert.equal(item.value, `true`);
          });

          it('runs the action when condition success (status)', async () => {
            const url = `http://localhost:${httpPort}/v1/get`;
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.cookies = new InMemoryCookieJar();

            factory.flows = [
              {
                trigger: 'response',
                actions: [
                  {
                    condition: {
                      source: ActionSourceEnum.response,
                      data: ActionResponseDataEnum.status,
                      operator: ActionOperatorEnum.equal,
                      value: '200',
                    },
                    steps: [
                      {
                        kind: SetDataStepKind,
                        value: 'v1',
                      } as ISetDataStep,
                      {
                        kind: SetCookieStepKind,
                        name: 'c1',
                      } as ISetCookieStep,
                    ],
                  }
                ],
              }
            ];
            
            const request: IHttpRequest = {
              url,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            const storedCookies = await factory.cookies.listCookies(url);
            assert.lengthOf(storedCookies, 1, 'has the cookie');
          });
        });

        describe('Variable set action', () => {
          it('sets a variable from the passed value', async () => {
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.variables = {};

            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    steps: [
                      {
                        kind: SetDataStepKind,
                        value: 'val1',
                      } as ISetDataStep,
                      {
                        kind: SetVariableStepKind,
                        name: 'var1',
                      } as ISetVariableStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
            };
            await factory.run(request);
            assert.deepEqual(factory.variables, { var1: 'val1' });
          });

          it('sets a variable from the request data', async () => {
            const factory = new HttpRequestRunner();
            factory.logger = logger;
            factory.variables = {};

            factory.flows = [
              {
                trigger: 'request',
                actions: [
                  {
                    steps: [
                      {
                        kind: ReadDataStepKind,
                        source: ActionSourceEnum.request,
                        data: ActionRequestDataEnum.headers,
                        path: 'x-test',
                      } as IReadDataStep,
                      {
                        kind: SetVariableStepKind,
                        name: 'var2',
                      } as ISetVariableStep,
                    ],
                  }
                ],
              }
            ];

            const request: IHttpRequest = {
              url: `http://localhost:${httpPort}/v1/get`,
              method: 'GET',
              headers: 'x-test: true',
            };
            await factory.run(request);
            assert.deepEqual(factory.variables, { var2: 'true' });
          });
        });
      });

      describe('request cookies', () => {
        afterEach(() => {
          clearStore();
        });

        it('adds matching cookies to the request', async () => {
          const url = `http://localhost:${httpPort}/v1/get`;

          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
          const c2 = new HttpCookie({ name: 'c2', value: 'v2' });
          await factory.cookies.setCookies(url, [c1, c2]);
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.headers, 'x-test: true\ncookie: c1=v1; c2=v2');
        });

        it('creates cookies when headers are not set on the request', async () => {
          const url = `http://localhost:${httpPort}/v1/get`;

          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
          await factory.cookies.setCookies(url, [c1]);
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.headers, 'cookie: c1=v1');
        });

        it('does not add cookies when ignored', async () => {
          const url = `http://localhost:${httpPort}/v1/get`;

          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          const c1 = new HttpCookie({ name: 'c1', value: 'v1' });
          const c2 = new HttpCookie({ name: 'c2', value: 'v2' });
          await factory.cookies.setCookies(url, [c1, c2]);
          factory.config = {
            kind: RequestConfigKind,
            enabled: true,
            ignoreSessionCookies: true,
          };
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          };
          const result = await factory.run(request);
          const sent = result.request as ISentRequest;
          assert.equal(sent.headers, 'x-test: true');
        });
      });

      describe('response cookies', () => {
        afterEach(() => {
          clearStore();
        });

        it('sets the cookies in the store', async () => {
          const url = `http://localhost:${httpPort}/v1/cookie`;
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();

          const request: IHttpRequest = {
            url,
            method: 'GET',
          };
          await factory.run(request);
          const cookies = await factory.cookies.listCookies(url);
          assert.lengthOf(cookies, 3, 'has all cookies');
          assert.equal(cookies[0].name, 'c1');
          assert.equal(cookies[1].name, 'c2');
          assert.equal(cookies[2].name, 'c3');
        });

        it('ignores cookies when configured', async () => {
          const url = `http://localhost:${httpPort}/v1/cookie`;
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          factory.config = {
            kind: RequestConfigKind,
            enabled: true,
            ignoreSessionCookies: true,
          };
          const request: IHttpRequest = {
            url,
            method: 'GET',
          };
          await factory.run(request);
          const cookies = await factory.cookies.listCookies(url);
          assert.lengthOf(cookies, 0, 'has no cookies');
        });

        it('does not ignores cookies when configuration not enabled', async () => {
          const url = `http://localhost:${httpPort}/v1/cookie`;
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          factory.config = {
            kind: RequestConfigKind,
            enabled: false,
            ignoreSessionCookies: true,
          };
          const request: IHttpRequest = {
            url,
            method: 'GET',
          };
          await factory.run(request);
          const cookies = await factory.cookies.listCookies(url);
          assert.lengthOf(cookies, 3, 'has all cookies');
        });

        it('ignores setting cookies when no cookies', async () => {
          const url = `http://localhost:${httpPort}/v1/get`;
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          factory.cookies = new InMemoryCookieJar();
          const request: IHttpRequest = {
            url,
            method: 'GET',
          };
          await factory.run(request);
          const cookies = await factory.cookies.listCookies(url);
          assert.lengthOf(cookies, 0, 'has no cookies');
        });
      });

      describe('request authorization', () => {
        it('applies the Bearer token', async () => {
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: '',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
          const factory = new HttpRequestRunner();
          factory.logger = logger;
          const request: IHttpRequest = {
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
          };
          factory.authorization = [
            {
              kind: RequestAuthorizationKind,
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
  });
});
