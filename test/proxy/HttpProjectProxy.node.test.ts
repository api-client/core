/* eslint-disable import/no-named-as-default-member */
import { assert, use } from 'chai';
import chaiUuid from 'chai-uuid';
import nock from 'nock';
import { 
  HttpProject, HttpProjectKind, IHttpProjectProxyInit, ProxyService, ApiError,
} from '../../index.js';
import getConfig from '../helpers/getSetup.js';

use(chaiUuid);

describe('ProxyService', () => {
  describe('HttpProjectProxy', () => {
    let httpPort: number;
    let project: HttpProject;
    const token = 'token-test';
    const storeHostname = 'http://localhost:1234';
    const storePath = '/store/v1';
    const storeUri = `${storeHostname}${storePath}`;

    before(async () => {
      const cnf = await getConfig();
      httpPort = cnf.httpPort;
    });

    beforeEach(async () => {
      project = HttpProject.fromName('p1');
      project.addRequest(`http://localhost:${httpPort}/v1/get`);
    });

    it('returns an error when no pid', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: '',
        options: {},
      };
      const scope = nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject(token, storeUri, message);
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

    it('returns an error when no options', async () => {
      // @ts-ignore
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
      };
      const scope = nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject(token, storeUri, message);
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

    it('returns an error when no token', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
        options: {},
      };
      const scope = nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject('', storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.message, 'Invalid request', 'has the message');
      assert.equal(error.detail, 'Set the authentication credentials.', 'has the detail');
      assert.isFalse(scope.isDone(), 'did not call the store');
      nock.cleanAll();
    });

    it('returns an error when no store URI', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
        options: {},
      };
      const scope = nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject(token, '', message);
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

    it('returns an error when invalid store URI', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
        options: {},
      };
      const scope = nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject(token, 'test', message);
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

    it('returns an error when no project', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
        options: {},
      };
      nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(404, new ApiError('Not found', 404).toJSON());
      const service = new ProxyService();
      let error: ApiError;
      try {
        await service.proxyHttpProject(token, storeUri, message);
        error = new ApiError('Not thrown', 0);
      } catch (e) {
        error = e as ApiError;
      }
      assert.equal(error.code, 400, 'has the error code');
      assert.equal(error.message, 'Not found', 'has the message');
    });

    it('proxies the project requests', async () => {
      const message: IHttpProjectProxyInit = {
        kind: HttpProjectKind,
        pid: project.key,
        options: {},
      };
      nock(storeHostname).get(`${storePath}/files/${project.key}?alt=media`).reply(200, project.toJSON());
      const service = new ProxyService();
      const response = await service.proxyHttpProject(token, storeUri, message);
      const exe = response.result;
      assert.typeOf(exe.started, 'number', 'has the response.started');
      assert.typeOf(exe.ended, 'number', 'has the response.ended');
      assert.typeOf(exe.iterations, 'array', 'has the response.iterations');
    });
  });
});
