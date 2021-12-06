/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { ProjectRunner, HttpProject, IRequestLog, ProjectRequest } from '../../index.js';
import { ExpressServer } from '../servers/ExpressServer.js';

describe('Runtime', () => {
  describe('NodeJS', () => {
    const server = new ExpressServer();
    let httpPort: number;

    before(async () => {
      httpPort = await server.startHttp();
    });

    after(async () => {
      await server.stopHttp();
    });

    describe('ProjectRunner', () => {
      it('runs a request from a folder', async () => {
        const project = new HttpProject();
        const folder = project.addFolder();
        const request = ProjectRequest.fromHttpRequest({
          url: `http://localhost:${httpPort}/v1/get`,
          method: 'GET',
          headers: 'x-test: true',
        }, project);
        project.addRequest(request, {
          parent: folder.key,
        });
        const runner = new ProjectRunner(project);
        const result = await runner.run(folder.key);
        
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
    });
  });  
});
