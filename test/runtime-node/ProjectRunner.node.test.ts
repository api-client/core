/* eslint-disable @typescript-eslint/no-explicit-any */
import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import getConfig from '../helpers/getSetup.js';
import { 
  ProjectRunner, 
  HttpProject, 
  IRequestLog, 
  ProjectRequest, 
  ArcResponse, 
  IArcResponse,
  DummyLogger,
  Environment,
} from '../../index.js';

const logger = new DummyLogger();

chai.use(chaiAsPromised);

describe('Runtime', () => {
  describe('NodeJS', () => {
    let httpPort: number;

    before(async () => {
      const cnf = await getConfig();
      httpPort = cnf.httpPort;
    });

    describe('ProjectRunner', () => {
      describe('Base runs', () => {
        it('runs a request from a folder', async () => {
          const project = new HttpProject();
          const folder = project.addFolder();
          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          folder.addRequest(request);
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
        });
  
        it('runs requests from a folder', async () => {
          const project = new HttpProject();
          const folder = project.addFolder();
          const request1 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request1, {
            parent: folder.key,
          });
          const request2 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: false',
          }, project);
          project.addRequest(request2, {
            parent: folder.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 2, 'has both results');
          const [report1, report2] = result;
          assert.typeOf(report1, 'object', 'the report1 is an object');
          assert.typeOf(report2, 'object', 'the report1 is an object');
          assert.equal(report1.key, request1.key, 'the report1 has the key');
          assert.equal(report2.key, request2.key, 'the report1 has the key');
          assert.isUndefined(report1.error, 'the report2 has no error');
          assert.isUndefined(report2.error, 'the report2 has no error');
  
          const log1 = report1.log as IRequestLog;
          const payload1 = await ArcResponse.readPayloadAsString(log1.response as IArcResponse);
          const body1 = JSON.parse(payload1 as string);
          assert.equal(body1.headers['x-test'], 'true');
  
          const log2 = report2.log as IRequestLog;
          const payload2 = await ArcResponse.readPayloadAsString(log2.response as IArcResponse);
          const body2 = JSON.parse(payload2 as string);
          assert.equal(body2.headers['x-test'], 'false');
        });
  
        it('runs a request from a folder only', async () => {
          const project = new HttpProject();
          const folder1 = project.addFolder();
          const request1 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request1, {
            parent: folder1.key,
          });
          const folder2 = project.addFolder();
          const request2 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request2, {
            parent: folder2.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder1.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request1.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
        });
  
        it('returns empty array when the project has no requests', async () => {
          const project = new HttpProject();
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run();
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 0, 'has no results');
        });
  
        it('returns empty array when the folder has no requests', async () => {
          const project = new HttpProject();
          const folder = project.addFolder();
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 0, 'has no results');
        });
  
        it('throws when folder not found', async () => {
          const project = new HttpProject();
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          await assert.isRejected(runner.run({ parent: 'test' }), `Folder not found: test`);
        });

        it('runs selected requests only', async () => {
          const project = new HttpProject();
          const request1 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request1);
          const request2 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: false',
          }, project);
          request2.info.name = 'included request';
          project.addRequest(request2);
          const request3 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: false',
          }, project);
          project.addRequest(request3);
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ requests: [request1.key, 'included request'] });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 2, 'has both results');
        });
      });

      describe('Events', () => {
        it('dispatches the lifecycle events', async () => {
          const project = new HttpProject();
          const request1 = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request1);
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const requestSpy = sinon.spy();
          const responseSpy = sinon.spy();
          runner.on('request', requestSpy);
          runner.on('response', responseSpy);
          
          await runner.run();
          
          assert.equal(requestSpy.callCount, 1);
          assert.equal(responseSpy.callCount, 1);
        });
      });

      describe('Variables in environments', () => {
        it('applies variables from the project in a folder request', async () => {
          const project = new HttpProject();
          const env = project.addEnvironment('default');
          env.addVariable('httpPort', httpPort);
          const folder = project.addFolder();
          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:{httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request, {
            parent: folder.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });

        it('applies variables from a folder', async () => {
          const project = new HttpProject();
          const folder = project.addFolder();
          const env = folder.addEnvironment('default');
          env.addVariable('httpPort', httpPort);
          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:{httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request, {
            parent: folder.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });

        it('overrides variables from a parent', async () => {
          const project = new HttpProject();
          const projectEnv = project.addEnvironment('default');
          projectEnv.addVariable('httpPort', 1234567);
          const folder = project.addFolder();
          const env = folder.addEnvironment('default');
          env.addVariable('httpPort', httpPort);
          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:{httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request, {
            parent: folder.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });

        it('respects the encapsulated flag', async () => {
          const project = new HttpProject();

          const projectEnv = project.addEnvironment('default');
          projectEnv.addVariable('notIncluded', 'test1');

          const folder = project.addFolder();
          const env = folder.addEnvironment('default');
          env.encapsulated = true;
          env.addVariable('included', 'test2');

          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:${httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-included: {included}\nx-not-included: {notIncluded}',
          }, project);
          project.addRequest(request, {
            parent: folder.key,
          });
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });

          const [report] = result;

          const log = report.log as IRequestLog;
          const payload = await ArcResponse.readPayloadAsString(log.response as IArcResponse);
          const body = JSON.parse(payload as string);
          assert.equal(body.headers['x-included'], 'test2');
          assert.equal(body.headers['x-not-included'], 'undefined');
        });

        it('uses the passed environment instead of the project ones', async () => {
          const project = new HttpProject();
          const env = project.addEnvironment('default');
          env.addVariable('httpPort', '1234567890'); // this would fail the request when used
          const folder = project.addFolder();
          const request = ProjectRequest.fromHttpRequest({
            url: `http://localhost:{httpPort}/v1/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          folder.addRequest(request);

          const masterEnvironment = Environment.fromName('master');
          masterEnvironment.addVariable('httpPort', httpPort);

          const runner = new ProjectRunner(project, masterEnvironment);
          runner.logger = logger;
          const result = await runner.run({ parent: folder.key });
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });
      });

      describe('Base URI', () => {
        it('applies the base URI to the request from server\'s uri to the variable', async () => {
          const project = new HttpProject();
          const env = project.addEnvironment('default');
          env.addServer(`http://localhost:${httpPort}/v1`);
          const request = ProjectRequest.fromHttpRequest({
            url: `{baseUri}/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request);
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run();
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });

        it('applies the base URI to the request from server\'s uri without a variable', async () => {
          const project = new HttpProject();
          const env = project.addEnvironment('default');
          env.addServer(`http://localhost:${httpPort}/v1`);
          const request = ProjectRequest.fromHttpRequest({
            url: `/get`,
            method: 'GET',
            headers: 'x-test: true',
          }, project);
          project.addRequest(request);
          const runner = new ProjectRunner(project);
          runner.logger = logger;
          const result = await runner.run();
          
          assert.typeOf(result, 'array', 'returns an array');
          assert.lengthOf(result, 1, 'has a single result');
          const [report] = result;
          assert.typeOf(report, 'object', 'the report is an object');
          assert.equal(report.key, request.key, 'the report has the key');
          assert.isUndefined(report.error, 'the report has no error');
          assert.isUndefined(report.errorMessage, 'the report has no errorMessage');
  
          const log = report.log as IRequestLog;
          assert.typeOf(log, 'object', 'has the log');
          assert.typeOf(log.response as IArcResponse, 'object', 'has the log.response');
        });
      });
    });
  });  
});
