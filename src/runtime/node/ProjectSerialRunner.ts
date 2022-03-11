import { SerializableError } from '../../models/SerializableError.js';
import { sleep } from '../../lib/timers/Timers.js';
import { ProjectRunner } from './ProjectRunner.js';
import { IProjectExecutionLog } from '../reporters/Reporter.js';

/**
 * Project runner that runs the requests in the project one-by-one.
 */
export class ProjectSerialRunner extends ProjectRunner {
  /**
   * Executes the requests in the project.
   */
  async execute(): Promise<IProjectExecutionLog> {
    const { root } = this;
    if (!root) {
      throw new SerializableError(`The project runner is not configured.`, 'ECONFIGURE');
    }
    
    this.startTime = Date.now();
    while (this.remaining > 0) {
      this.remaining--;
      await this.executeIteration();
      this.index++;
      if (this.remaining && this.options?.iterationDelay) {
        this.emit('before-sleep');
        await sleep(this.options.iterationDelay);
        this.emit('after-sleep');
      } else {
        await sleep(0);
      }
    }

    this.endTime = Date.now();
    return this.createReport();
  }
}
