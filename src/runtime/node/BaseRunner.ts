import { EventEmitter } from 'events';
import { IProjectExecutionIteration, IProjectExecutionLog } from '../reporters/Reporter.js';

export abstract class BaseRunner extends EventEmitter {
  /**
   * Iteration start time.
   */
  protected startTime?: number;
  /**
   * Iteration end time.
   */
  protected endTime?: number;
  /**
   * A list of already executed iterations.
   */
  protected executed: IProjectExecutionIteration[] = [];

  /**
   * Creates the report of the execution.
   */
  protected async createReport(): Promise<IProjectExecutionLog> {
    const log: IProjectExecutionLog = {
      started: this.startTime as number,
      ended: this.endTime as number,
      iterations: this.executed,
    };
    return log;
  }
}
