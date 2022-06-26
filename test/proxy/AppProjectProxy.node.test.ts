/* eslint-disable import/no-named-as-default-member */
import { assert, use } from 'chai';
import chaiUuid from 'chai-uuid';
import nock from 'nock';
import getConfig from '../helpers/getSetup.js';
import { 
  IAppProjectProxyInit, IProjectExecutionLog, AppProject, AppProjectKind, ProxyService, ApiError, RouteBuilder,
} from '../../index.js';

use(chaiUuid);

describe('ProxyService', () => {
  describe('AppProjectProxy', () => {
    let httpPort: number;
    let project: AppProject;
    const appId = 'xyz';
    const token = 'token-test';
    const storeHostname = 'http://localhost:1234';
    const storePath = '/store/v1';
    const storeUri = `${storeHostname}${storePath}`;
    let projectRequestPath: string;

    before(async () => {
      const cnf = await getConfig();
      httpPort = cnf.httpPort;
    });

    beforeEach(async () => {
      project = AppProject.fromName('p1');
      project.addRequest(`http://localhost:${httpPort}/v1/get`);
      projectRequestPath = `${storePath}${RouteBuilder.appProjectItem(appId, project.key)}`;
    });

    it('initializes the proxy session and returns the identifier', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      nock(storeHostname, {
        reqheaders: {
          authorization: `Bearer ${token}`
        },
      }).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      const key = await service.addAppProjectProxy(token, storeUri, message);
      assert.typeOf(key, 'string', 'returns the key');
      assert.uuid(key, 'v4');
    });

    it('returns error when no appId', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        options: {},
        appId: '',
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The "appId" parameter is required.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when no pid', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        appId,
        options: {},
        pid: '',
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The "pid" parameter is required.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when no options', async () => {
      // @ts-ignore
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The "options" parameter is required.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when no token', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy('', storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'Set the authentication credentials.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when no store URI', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, '', message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The store uri is missing.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when invalid store URI', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      const scope = nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, 'test', message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'The store uri is invalid.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns error when no project', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      nock(storeHostname).get(projectRequestPath).reply(404, new ApiError('Not found', 404).toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.addAppProjectProxy(token, storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Not found', 'has the message');
    });

    it('proxies the project requests', async () => {
      const message: IAppProjectProxyInit = {
        kind: AppProjectKind,
        pid: project.key,
        appId,
        options: {},
      }
      nock(storeHostname).get(projectRequestPath).reply(200, project.toJSON());
      const service = new ProxyService();
      const key = await service.addAppProjectProxy(token, storeUri, message);
      const response = await service.proxy(key);
      const exe = response.result as IProjectExecutionLog;
      assert.typeOf(exe.started, 'number', 'has the response.started');
      assert.typeOf(exe.ended, 'number', 'has the response.ended');
      assert.typeOf(exe.iterations, 'array', 'has the response.iterations');
    });
  });
});
