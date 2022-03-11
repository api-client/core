import { Table } from 'console-table-printer';
import chalk from 'chalk';
import { ErrorResponse, IErrorResponse } from '../../models/ErrorResponse.js';
import { IArcResponse } from '../../models/ArcResponse.js';
import { ISerializedError } from '../../models/SerializableError.js';
import { Reporter } from './Reporter.js';

/**
 * HTTP project execution reporter for a terminal output.
 */
export class ProjectRunCliReporter extends Reporter {
  async generate(): Promise<void> {
    const { info } = this;

    const table = new Table({
      title: 'Project execution summary',
      columns: [
        { name: 'position', title: ' ', alignment: 'left',  },
        { name: 'succeeded', title: 'Succeeded', alignment: 'right', },
        { name: 'failed', title: 'Failed', alignment: 'right', },
        { name: 'total', title: 'Total', alignment: 'right', },
      ],
    });

    table.addRow({
      position: 'Iterations',
      succeeded: info.iterations.length,
      failed: 0,
      total: info.iterations.length,
    });

    const failed = this.computeFailed();
    const succeeded = this.computeSucceeded();
    table.addRow({
      position: 'Requests',
      succeeded,
      failed: failed > 0 ? chalk.redBright(failed) : failed,
      total: failed + succeeded,
    });
    table.printTable();
    process.stdout.write('\n');

    info.iterations.forEach((run, index) => {
      const itNumber = index + 1;
      if (run.error) {
        process.stdout.write(`Iteration ${itNumber} failed: ${run.error}\n\n`);
        return;
      }
      const failed = run.executed.filter(log => this.isFailedLog(log));
      if (!failed.length) {
        return;
      }
      process.stdout.write(`Iteration ${itNumber} Errors\n`);
      failed.forEach((log) => {
        let url = 'Unknown request URL.';
        if (log.request) {
          url = log.request.url;
        }
        const prefix = chalk.dim(`[${url}] `);
        if (log.response && ErrorResponse.isErrorResponse(log.response)) {
          const response = log.response as IErrorResponse;
          let message = (response.error as ISerializedError).message ? (response.error as Error).message : response.error;
          if (typeof message !== 'string') {
            message = 'Unknown error.';
          }
          process.stdout.write(`${prefix}${message}\n`);
          return;
        }
        if (!log.request) {
          process.stdout.write('Request not executed.\n');
          return;
        }
        const response = log.response as IArcResponse;
        process.stdout.write(`${prefix} Status code is: ${response.status}\n`);
      });
      process.stdout.write('\n\n');
    });
  }
}
