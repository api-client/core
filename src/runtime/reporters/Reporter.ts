import { IRequestLog } from '../../models/RequestLog.js';
import { IResponse } from '../../models/Response.js';
import { ErrorResponse } from '../../models/ErrorResponse.js';

export interface IProjectExecutionIteration {
  /**
   * The index of the iteration.
   */
  index: number;
  /**
   * The list of requests executed in the iteration.
   */
  executed: IRequestLog[];
  /**
   * Optional general error message.
   */
  error?: string;
}

export interface IProjectExecutionLog {
  /**
   * The timestamp when the execution started
   */
  started: number;
  /**
   * The timestamp when the execution ended
   */
  ended: number;
  /**
   * The execution logs for each iteration.
   */
  iterations: IProjectExecutionIteration[];
}

/**
 * Base class for project execution reporters.
 */
export abstract class Reporter {
  info: IProjectExecutionLog;

  constructor(info: IProjectExecutionLog) {
    this.info = info;
  }

  /**
   * Generates the report for the current execution log.
   */
  abstract generate(): Promise<void>;

  /**
   * Checks whether the execution log should be considered a failure.
   * @param log The execution log.
   * @returns `true` when the request was a failure.
   */
  protected isFailedLog(log: IRequestLog): boolean {
    if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
      return true;
    }
    const response = log.response as IResponse;
    if (response.status >= 400) {
      return true;
    }
    return false;
  }

  /**
   * Computes the number of requests that failed.
   */
  computeFailed(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (this.isFailedLog(log)) {
          result++;
        }
      });
    });

    return result;
  }

  /**
   * Computes the number of requests that ended with the status code 399 at the most.
   */
  computeSucceeded(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
          return;
        }
        const response = log.response as IResponse;
        if (response.status < 400) {
          result++;
        }
      });
    });
    return result;
  }

  /**
   * Computes the total time of sending each request.
   */
  computeTotalTime(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
          return;
        }
        const response = log.response as IResponse;
        if (response.loadingTime && response.loadingTime > 0) {
          result += response.loadingTime;
        }
      });
    });
    return result;
  }

  /**
   * Computes the total size of received data.
   */
  computeTotalSize(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (log.size && log.size.response) {
          result += log.size.response;
        }
      });
    });
    return result;
  }
}
