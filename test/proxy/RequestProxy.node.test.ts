import { assert, use } from 'chai';
import chaiUuid from 'chai-uuid';
import getConfig from '../helpers/getSetup.js';
import { 
  IRequestProxyInit, HttpRequestKind, IRequestLog, 
  RequestLog, IBasicAuthorization, ProxyService, ApiError, SetDataStepKind, ISetDataStep, SetVariableStepKind, ISetVariableStep 
} from '../../index.js';

use(chaiUuid);

describe('ProxyService', () => {
  describe('RequestProxy', () => {
    let message: IRequestProxyInit;
    let httpPort: number;

    before(async () => {
      const cnf = await getConfig();
      httpPort = cnf.httpPort;
    });

    beforeEach(() => {
      message = {
        kind: HttpRequestKind,
        request: {
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
        },
        authorization: [],
      };
    });

    it('initializes the proxy session and returns the identifier', async () => {
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      assert.typeOf(key, 'string', 'returns the key');
      assert.uuid(key, 'v4');
    });

    it('throws an error when no request', async () => {
      // @ts-ignore
      delete message.request;
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addRequestProxy(message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.ok(error, 'has the error');
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The "request" parameter is required.');
    });

    it('returns error when the request has no URL', async () => {
      // @ts-ignore
      delete message.request.url;
      let error: ApiError;
      const service = new ProxyService();
      try {
        await service.addRequestProxy(message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.ok(error, 'has the error');
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The "request.url" parameter is required.');
    });

    it('proxies a GET request', async () => {
      message.request.headers = 'x-test: true\nauthorization: xyz';
      message.request.url += '?a=b#c';
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      const response = await service.proxy(key);
      const data = new RequestLog(response.result as IRequestLog);
      const echo = JSON.parse(await data.response?.readPayloadAsString() as string);
      assert.equal(echo.headers['x-test'], 'true');
      assert.equal(echo.url, '/?a=b');
    });

    it('adds the authorization data', async () => {
      message.authorization = [{
        kind: 'Core#RequestAuthorization',
        enabled: true,
        type: 'basic',
        valid: true,
        config: {
          username: 'a',
          password: 'b',
        } as IBasicAuthorization,
      }];
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      const response = await service.proxy(key);
      const data = new RequestLog(response.result as IRequestLog);
      const echo = JSON.parse(await data.response?.readPayloadAsString() as string);
      assert.equal(echo.headers['authorization'], 'Basic YTpi');
    });

    it('adds the variables', async () => {
      message.variables = {
        httpPort: String(httpPort),
      };
      message.request.url = 'http://localhost:{httpPort}/v1/get';
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      const response = await service.proxy(key);
      const data = new RequestLog(response.result as IRequestLog);
      const echo = JSON.parse(await data.response?.readPayloadAsString() as string);
      assert.equal(echo.baseUrl, '/v1/get');
    });

    it('adds the request flows', async () => {
      message.flows = [
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
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      const response = await service.proxy(key);
      const vars = response.variables as Record<string, string>;
      assert.equal(vars.var1, 'val1');
    });

    it('proxies a body', async () => {
      message.request.method = 'POST';
      message.request.headers = `content-type: application/json`;
      const service = new ProxyService();
      const key = await service.addRequestProxy(message);
      const response = await service.proxy(key, Buffer.from(JSON.stringify({ test: true })));
      const data = new RequestLog(response.result as IRequestLog);
      const echo = JSON.parse(await data.response?.readPayloadAsString() as string);
      assert.equal(echo.body, '{"test":true}');
    });
  });
});
