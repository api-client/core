/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import sinon from 'sinon';
import getConfig from '../helpers/getSetup.js';
import { 
  ISentRequest,
  HttpProject,
  Response,
  IResponse,
  ProjectSerialRunner,
  ProjectRequest,
  ProjectFolder,
  RequestLogKind,
  InMemoryCookieJar,
  DeleteCookieStepKind,
  IDeleteCookieStep,
  IRequestLog,
  ActionSourceEnum,
  ActionResponseDataEnum,
  ActionOperatorEnum,
  ReadDataStepKind,
  ActionRequestDataEnum,
  IReadDataStep,
  SetVariableStepKind,
  ISetVariableStep,
} from '../../index.js';
import path from 'path';

describe('Runtime', () => {
  describe('NodeJS', () => {
    describe('ProjectSerialRunner', () => {
      let httpPort: number;
      let httpsPort: number;

      before(async () => {
        const cnf = await getConfig();
        httpPort = cnf.httpPort;
        httpsPort = cnf.httpsPort;
      });

      describe('projects requests', () => {
        let project: HttpProject;
        let r1: ProjectRequest;
        let r3: ProjectRequest;
        let baseUrl: string;
        beforeEach(() => {
          project = HttpProject.fromName('Test project');
          const e1 = project.addEnvironment('default');
          e1.addVariable('HTTP_PORT', String(httpPort));
          e1.addVariable('HTTPS_PORT', String(httpsPort));

          baseUrl = 'http://localhost:{HTTP_PORT}/v1/';
          r1 = project.addRequest(`${baseUrl}get`);
          r1.expects.headers = `x-request-key: ${r1.key}`;

          const r2 = project.addRequest(`${baseUrl}post`);
          r2.expects.headers = `x-request-key: ${r2.key}\ncontent-type: application/json`;
          r2.expects.payload = '{"test":true}';
          r2.expects.method = 'POST';

          r3 = project.addRequest(`${baseUrl}response/xml`);
          r3.expects.headers = `x-request-key: ${r3.key}`;
        });

        it('runs all requests in the project', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project);
          const result = await runner.execute();
          const { started, ended, iterations } = result;
          assert.typeOf(started, 'number', 'has the started');
          assert.typeOf(ended, 'number', 'has the ended');
          assert.typeOf(iterations, 'array', 'has the iterations');
          assert.lengthOf(iterations, 1, 'has a single iteration');
          const [item] = iterations;
          assert.equal(item.index, 0, 'the iteration has the index');
          assert.typeOf(item.executed, 'array', 'has the iteration.executed');
          assert.lengthOf(item.executed, 3, 'executed all requests in the folder');
          const [e1] = item.executed;
          
          assert.equal(e1.kind, RequestLogKind, 'has the log');
          assert.typeOf(e1.request, 'object', 'has the log.request');
          assert.typeOf(e1.response, 'object', 'has the log.response');
          const request = e1.request as ISentRequest;
          const response = e1.response as IResponse;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/get`, 'the factory evaluated variables');
          assert.equal(response.status, 200, 'has the response');
        });

        it('runs only the selected requests', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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

        it('runs multiple iterations with a delay', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key],
            iterations: 2,
            iterationDelay: 50,
          });
          const spy = sinon.spy();
          runner.on('before-sleep', spy);
          await runner.execute();
          assert.isTrue(spy.calledOnce);
        });

        it('dispatched the after-sleep event', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key],
            iterations: 2,
            iterationDelay: 50,
          });
          const spy = sinon.spy();
          runner.on('after-sleep', spy);
          await runner.execute();
          assert.isTrue(spy.calledOnce);
        });

        it('dispatched the before-iteration event', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key],
            iterations: 2,
          });
          const spy = sinon.spy();
          runner.on('before-iteration', spy);
          await runner.execute();
          assert.equal(spy.callCount, 2);
        });

        it('dispatched the after-iteration event', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key],
            iterations: 2,
          });
          const spy = sinon.spy();
          runner.on('after-iteration', spy);
          await runner.execute();
          assert.equal(spy.callCount, 2);
        });

        it('dispatched the request event', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key, r3.key],
          });
          const spy = sinon.spy();
          runner.on('request', spy);
          await runner.execute();
          assert.equal(spy.callCount, 2);
        });

        it('dispatched the response event', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r1.key, r3.key],
          });
          const spy = sinon.spy();
          runner.on('response', spy);
          await runner.execute();
          assert.equal(spy.callCount, 2);
        });

        it('dispatched the error event', async () => {
          const r4 = project.addRequest(`http://localhost:undefined/v1/get`);
          
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            request: [r4.key],
          });
          const spy = sinon.spy();
          runner.on('error', spy);
          await runner.execute();
          assert.equal(spy.callCount, 1);
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project);
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: undefined', 'does not evaluate variables that are not defined');
        });

        it('uses the default', async () => {
          const e1 = project.addEnvironment('My default');
          e1.addVariable('CUSTOM', 'custom-value');

          const runner = new ProjectSerialRunner();
          await runner.configure(project);
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('uses the selected', async () => {
          project.addEnvironment('My default');
          const e2 = project.addEnvironment('Other');
          e2.addVariable('CUSTOM', 'custom-value');

          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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

          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            environment: 'Other',
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('reads the environment from a file', async () => {
          project.addEnvironment('My default');

          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            environment: path.join('test', 'test-data', 'runner-env.json'),
          });
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.include(request.headers, 'x-custom: custom-value');
        });

        it('uses the folder declared environment', async () => {
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('e1');
          e1.addVariable('CUSTOM', 'v1');
          const e2 = f1.addEnvironment('e2');
          e2.addVariable('CUSTOM', 'v2');
          project.moveRequest(r1.key, {
            parent: f1.key,
          });

          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project);
          process.env.SYS_1 = 'v1';
          process.env.SYS_2 = 'v2';
          process.env.SYS_3 = 'v3';
          const result = await runner.execute();
          const rl = result.iterations[0].executed[0];
          const request = rl.request as ISentRequest;
          assert.equal(request.headers, 'x-c1: undefined\nx-c2: undefined\nx-c3: undefined');
        });

        it('explicitly prohibits the system variables', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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

      describe('requests in folders', () => {
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

        it('runs all requests in the project with the recursive option', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
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

        it('runs requests in a folder only', async () => {
          const runner = new ProjectSerialRunner();
          await runner.configure(project, {
            recursive: true,
            parent: f1.key,
          });
          const result = await runner.execute();
          const [item] = result.iterations;
          assert.typeOf(item.executed, 'array', 'has the iteration.executed');
          assert.lengthOf(item.executed, 1, 'executed all requests in the folder');
          const [e1] = item.executed;
          
          assert.equal(e1.kind, RequestLogKind, 'has the log');
          assert.typeOf(e1.request, 'object', 'has the log.request');
          assert.typeOf(e1.response, 'object', 'has the log.response');
          const request = e1.request as ISentRequest;
          assert.equal(request.url, `http://localhost:${httpPort}/v1/get`, 'the factory evaluated variables');
        });
      });

      describe('cookies', () => {
        let cookies: InMemoryCookieJar;

        before(() => {
          cookies = new InMemoryCookieJar()
        });

        afterEach(() => {
          cookies.clear();
        });

        let project: HttpProject;
        beforeEach(() => {
          project = HttpProject.fromName('Test project');
        });

        it('stores response cookies in the store', async () => {
          project.addRequest(`http://localhost:${httpPort}/v1/cookie`);
          const runner = new ProjectSerialRunner();
          await runner.configure(project, { cookies });
          const result = await runner.execute();
          const { iterations } = result;
          assert.lengthOf(iterations, 1);

          const stored = await cookies.listCookies(`http://localhost:${httpPort}/v1/cookie`);
          assert.lengthOf(stored, 3, 'has all cookies');
        });

        it('uses stored cookies with the request', async () => {
          project.addRequest(`http://localhost:${httpPort}/v1/cookie`);
          project.addRequest(`http://localhost:${httpPort}/v1/get`);

          const runner = new ProjectSerialRunner();
          await runner.configure(project, { cookies });
          const result = await runner.execute();
          const { iterations } = result;
          assert.lengthOf(iterations, 1);
          const log2 = iterations[0].executed[1] as IRequestLog;
          const rsp2 = new Response(log2.response as IResponse);
          const body2 = await rsp2.readPayloadAsString() as string;
          const p2 = JSON.parse(body2);
          assert.equal(p2.headers.cookie, 'c1=v1; c2=v2; c3=v3');
        });

        it('uses the store with http flows', async () => {
          const r1 = project.addRequest(`http://localhost:${httpPort}/v1/cookie`);
          r1.flows = [
            {
              trigger: 'response',
              // actions are executed after cookies are stored.
              actions: [
                {
                  steps: [
                    {
                      kind: DeleteCookieStepKind,
                      name: 'c2',
                    } as IDeleteCookieStep,
                  ],
                }
              ],
            }
          ];
          const runner = new ProjectSerialRunner();
          await runner.configure(project, { cookies });
          const result = await runner.execute();
          const { iterations } = result;
          assert.lengthOf(iterations, 1);

          const stored = await cookies.listCookies(`http://localhost:${httpPort}/v1/cookie`);
          assert.lengthOf(stored, 2, 'has the remaining cookies');
          assert.equal(stored[0].name, 'c1');
          assert.equal(stored[1].name, 'c3');
        });
      });

      describe('variables sharing', () => {
        let project: HttpProject;
        beforeEach(() => {
          project = HttpProject.fromName('p1');
        });

        it('shares variables between the requests in different folders', async () => {
          // emulate a situation that the first folder performs an authorization
          // and sets a variable and other requests uses this variable
          const f1 = project.addFolder('f1');
          const r1 = f1.addRequest(`http://localhost:${httpPort}/v1/response/static`);
          r1.flows = [
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
                      kind: ReadDataStepKind,
                      source: ActionSourceEnum.response,
                      data: ActionRequestDataEnum.body,
                      path: '/data/token',
                    } as IReadDataStep,
                    {
                      kind: SetVariableStepKind,
                      name: 'token',
                    } as ISetVariableStep,
                  ],
                }
              ],
            }
          ];
          const f2 = project.addFolder('f2');
          f2.addRequest(`http://localhost:${httpPort}/v1/get?token={token}`);
          project.addRequest(`http://localhost:${httpPort}/v1/get?token={token}`);

          const runner = new ProjectSerialRunner();
          await runner.configure(project, { recursive: true });
          const result = await runner.execute();
          const { iterations } = result;
          assert.lengthOf(iterations, 1);

          const log2 = iterations[0].executed[1] as IRequestLog;
          const log3 = iterations[0].executed[2] as IRequestLog;
          
          const sent2 = log2.request as ISentRequest;
          assert.equal(sent2.url, `http://localhost:${httpPort}/v1/get?token=sJxlgNgHi8`);
          
          const sent3 = log3.request as ISentRequest;
          assert.equal(sent3.url, `http://localhost:${httpPort}/v1/get?token=sJxlgNgHi8`);
        });

        it('keeps sub-folder variables in the parent tree only.', async () => {
          const f1 = project.addFolder('f1');
          const e1 = f1.addEnvironment('e1');
          e1.addVariable('a1', 'v1');
          const r1 = f1.addRequest(`http://localhost:${httpPort}/v1/get`);
          r1.expects.headers = `x-a1: {a1}\nx-a2: {a2}`;
          const f2 = project.addFolder('f2');
          const e2 = f2.addEnvironment('e2');
          e2.addVariable('a2', 'v2');
          const r2 = f2.addRequest(`http://localhost:${httpPort}/v1/get?token={token}`);
          r2.expects.headers = `x-a1: {a1}\nx-a2: {a2}`;
          const r3 = project.addRequest(`http://localhost:${httpPort}/v1/get?token={token}`);
          r3.expects.headers = `x-a1: {a1}\nx-a2: {a2}`;

          const runner = new ProjectSerialRunner();
          await runner.configure(project, { recursive: true });
          const result = await runner.execute();
          const { iterations } = result;
          assert.lengthOf(iterations, 1);

          const log1 = iterations[0].executed[0] as IRequestLog;
          const log2 = iterations[0].executed[1] as IRequestLog;
          const log3 = iterations[0].executed[2] as IRequestLog;
          const response1 = new Response(log1.response as IResponse);
          const response2 = new Response(log2.response as IResponse);
          const response3 = new Response(log3.response as IResponse);
          const payload1 = await response1.readPayloadAsString() as string;
          const payload2 = await response2.readPayloadAsString() as string;
          const payload3 = await response3.readPayloadAsString() as string;
          const body1 = JSON.parse(payload1);
          const body2 = JSON.parse(payload2);
          const body3 = JSON.parse(payload3);
          assert.equal(body1.headers['x-a1'], 'v1', 'request #1 has a folder variable');
          assert.equal(body1.headers['x-a2'], 'undefined', 'request #1 has no variables from f2');
          assert.equal(body2.headers['x-a1'], 'undefined', 'request #2 has no variables from f1');
          assert.equal(body2.headers['x-a2'], 'v2', 'request #2 has a folder variable');
          assert.equal(body3.headers['x-a1'], 'undefined', 'request #3 has no variables from f1');
          assert.equal(body3.headers['x-a2'], 'undefined', 'request #3 has no variables from f2');
        });
      });
    });
  });
});
