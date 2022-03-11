/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import {
  ProjectRunCliReporter,
  IProjectExecutionLog,
  IProjectExecutionIteration,
  TestCliHelper,
  ProjectMock,
} from '../../index.js';

describe('Runtime', () => {
  const mock = new ProjectMock();

  describe('NodeJS', () => {
    describe('ProjectRunCliReporter', () => {
      function wrapIterations(iterations: IProjectExecutionIteration[] = []): IProjectExecutionLog {
        const now = Date.now();
        const info: IProjectExecutionLog = {
          started: now - 1000,
          ended: now,
          iterations,
        };
        return info;
      }

      function wrapIteration(iteration: IProjectExecutionIteration): IProjectExecutionLog {
        return wrapIterations([iteration]);
      }

      it('prints the info table', async () => {
        const opts = { response: { statusGroup: 2 }, };
        const info = wrapIteration({
          index: 0,
          executed: [
            mock.projectRequest.log(opts),
            mock.projectRequest.log(opts),
            mock.projectRequest.log(opts),
          ],
        });
        const out = await TestCliHelper.grabOutput(async () => {
          const reporter = new ProjectRunCliReporter(info);
          await reporter.generate();
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(out));
        const [ summaryTitle, summaryColumns, iterations, requests ] = lines;
        assert.include(summaryTitle, 'Project execution summary');
        assert.include(summaryColumns, 'Succeeded');
        assert.include(iterations, 'Iterations');
        assert.include(iterations, '1');
        assert.include(requests, 'Requests');
        assert.include(requests, '3');
      });

      it('prints an error when an iteration error', async () => {
        const info = wrapIteration({
          index: 0,
          executed: [],
          error: 'This is anm error'
        });
        const out = await TestCliHelper.grabOutput(async () => {
          const reporter = new ProjectRunCliReporter(info);
          await reporter.generate();
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(out));
        const last = lines.pop();
        assert.include(last, 'Iteration 1 failed: This is anm error');
      });
    });
  });
});
