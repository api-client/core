/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import sinon from 'sinon';
import getConfig from '../../helpers/getSetup.js';
import { 
  ISentRequest,
  HttpProject,
  IResponse,
  ProjectParallelRunner,
  ProjectRequest,
  ProjectFolder,
  RequestLogKind,
} from '../../../index.js';
import path from 'path';

describe('Runtime', () => {
  describe('NodeJS', () => {
    describe('ProjectParallelRunner', () => {
      let httpPort: number;
      let httpsPort: number;

      before(async () => {
        const cnf = await getConfig();
        httpPort = cnf.httpPort;
        httpsPort = cnf.httpsPort;
      });

      describe('Execution', () => {
        let project: HttpProject;
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let r1: ProjectRequest;
        let r3: ProjectRequest;
        beforeEach(() => {
          project = HttpProject.fromName('Test project');
          const env = project.addEnvironment('default');
          env.addVariable('HTTP_PORT', String(httpPort));
          env.addVariable('HTTPS_PORT', String(httpsPort));

          f1 = project.addFolder('f1');
          f2 = project.addFolder('f2');

          const baseUrl = 'http://localhost:{HTTP_PORT}/v1/';
          r1 = f1.addRequest(`${baseUrl}get`);
          r1.expects.headers = `x-request-key: ${r1.key}`;

          const r2 = f2.addRequest(`${baseUrl}post`);
          r2.expects.headers = `x-request-key: ${r2.key}\ncontent-type: application/json`;
          r2.expects.payload = '{"test":true}';
          r2.expects.method = 'POST';

          r3 = project.addRequest(`${baseUrl}response/xml`);
          r3.expects.headers = `x-request-key: ${r3.key}`;
        });

        it('runs all requests in the project', async () => {
          const runner = new ProjectParallelRunner(project);
          const result = await runner.execute();
          
          const { started, ended, iterations } = result;
          assert.typeOf(started, 'number', 'has the started');
          assert.typeOf(ended, 'number', 'has the ended');
          assert.typeOf(iterations, 'array', 'has the iterations');
          assert.lengthOf(iterations, 1, 'has a single iteration');
          const [item] = iterations;
          assert.equal(item.index, 0, 'the iteration has the index');
          assert.typeOf(item.executed, 'array', 'has the iteration.executed');
          assert.lengthOf(item.executed, 1, 'executed all requests in the project');
          const [e1] = item.executed;
          
          assert.equal(e1.kind, RequestLogKind, 'has the log');
          assert.typeOf(e1.request, 'object', 'has the log.request');
          assert.typeOf(e1.response, 'object', 'has the log.response');
          const request = e1.request as ISentRequest;
          const response = e1.response as IResponse;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/response/xml`, 'the factory evaluated variables');
          assert.equal(response.status, 200, 'has the response');
        });

        it('runs all requests in the project with the recursive option', async () => {
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
          });
          const result = await runner.execute();
          const [item] = result.iterations;
          assert.typeOf(item.executed, 'array', 'has the iteration.executed');
          assert.lengthOf(item.executed, 3, 'executed all requests in the folder');
          const [e1] = item.executed;
          
          assert.equal(e1.kind, RequestLogKind, 'has the log');
          assert.typeOf(e1.request, 'object', 'has the log.request');
          assert.typeOf(e1.response, 'object', 'has the log.response');
          const request = e1.request as ISentRequest;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/get`, 'the factory evaluated variables');
        });

        it('runs only the selected requests', async () => {
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
            request: [r1.key, r3.key],
          });
          const result = await runner.execute();
          const [item] = result.iterations;
          assert.lengthOf(item.executed, 2, 'executed only selected request');
          const [e1] = item.executed;
          
          const request = e1.request as ISentRequest;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/get`, 'the factory evaluated variables');
        });

        it('ignores selected requests', async () => {
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
            ignore: [r1.key],
          });
          const result = await runner.execute();
          const [item] = result.iterations;
          assert.lengthOf(item.executed, 2, 'executed only selected request');
          const [e2] = item.executed;
          
          const request = e2.request as ISentRequest;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/post`, 'the factory evaluated variables');
        });

        it('runs multiple iterations', async () => {
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
            request: [r1.key],
            iterations: 2,
          });
          const result = await runner.execute();
          const [item] = result.iterations;
          assert.lengthOf(result.iterations, 2, 'executed only selected request');

          const [e1] = item.executed;
          
          const request = e1.request as ISentRequest;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/get`, 'the factory evaluated variables');
        });

        it('dispatched the status event', async () => {
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
            request: [r1.key],
            iterations: 2,
          });
          const spy = sinon.spy();
          runner.on('status', spy);
          await runner.execute();
          assert.equal(spy.callCount, 5);
        });

        it('does not error the process when request error', async () => {
          const r4 = project.addRequest(`http://localhost:undefined/v1/get`);
          const runner = new ProjectParallelRunner(project, {
            recursive: true,
            request: [r4.key],
            iterations: 2,
          });

          const spy = sinon.spy();
          runner.on('status', spy);
          await runner.execute();
          assert.equal(spy.callCount, 5);
        });
      });

      describe('environment selection', () => {
        let project: HttpProject;
        let r1: ProjectRequest;

        beforeEach(() => {
          project = HttpProject.fromName('Test project');
          const baseUrl = `http://localhost:${httpPort}/v1/`;
          r1 = project.addRequest(`${baseUrl}get`);
          r1.expects.headers = `x-request-key: ${r1.key}\nx-custom: {CUSTOM}`;
        });

        it('executes a request without an environment', async () => {
          const runner = new ProjectParallelRunner(project);
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: undefined', 'does not evaluate variables that are not defined');
        });

        it('uses the default', async () => {
          const e1 = project.addEnvironment('My default');
          e1.addVariable('CUSTOM', 'custom-value');

          const runner = new ProjectParallelRunner(project);
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('uses the selected', async () => {
          project.addEnvironment('My default');
          const e2 = project.addEnvironment('Other');
          e2.addVariable('CUSTOM', 'custom-value');

          const runner = new ProjectParallelRunner(project, {
            environment: e2.key,
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('selects the environment by name', async () => {
          project.addEnvironment('My default');
          const e2 = project.addEnvironment('Other');
          e2.addVariable('CUSTOM', 'custom-value');

          const runner = new ProjectParallelRunner(project, {
            environment: 'Other',
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('reads the environment from a file', async () => {
          project.addEnvironment('My default');

          const runner = new ProjectParallelRunner(project, {
            environment: path.join('test', 'test-data', 'runner-env.json'),
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('uses the folder declared environment', async () => {
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('My default');
          e1.addVariable('CUSTOM', 'v1');
          const e2 = f1.addEnvironment('Other');
          e2.addVariable('CUSTOM', 'v2');
          project.moveRequest(r1.key, {
            parent: f1.key,
          });

          const runner = new ProjectParallelRunner(project, {
            parent: f1.key,
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: v2');
        });
      });

      describe('system variables', () => {
        let project: HttpProject;
        let r1: ProjectRequest;

        beforeEach(() => {
          project = HttpProject.fromName('Test project');
          const baseUrl = `http://localhost:${httpPort}/v1/`;
          r1 = project.addRequest(`${baseUrl}get`);
          r1.expects.headers = `x-c1: {SYS_1}\nx-c2: {SYS_2}\nx-c3: {SYS_3}`;
        });

        it('applies all system variables', async () => {
          const runner = new ProjectParallelRunner(project, {
            variables: true,
          });
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: v1\nx-c2: v2\nx-c3: v3');
        });

        it('applies only the selected', async () => {
          const runner = new ProjectParallelRunner(project, {
            variables: ['SYS_1', 'SYS_3'],
          });
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: v1\nx-c2: undefined\nx-c3: v3');
        });

        it('does not apply variables by default', async () => {
          const runner = new ProjectParallelRunner(project);
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: undefined\nx-c2: undefined\nx-c3: undefined');
        });

        it('explicitly prohibits the system variables', async () => {
          const runner = new ProjectParallelRunner(project, {
            variables: false,
          });
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: undefined\nx-c2: undefined\nx-c3: undefined');
        });

        it('uses the passed map of variables', async () => {
          const runner = new ProjectParallelRunner(project, {
            variables: {
              SYS_1: 'a1',
              SYS_3: 'a3',
            },
          });
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: a1\nx-c2: undefined\nx-c3: a3');
        });
      });
    });
  });
});
