/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
import process from 'process';
import cluster from 'cluster';
import { HttpProject } from '../../models/HttpProject.js';
import { IProjectExecutionLog } from '../reporters/Reporter.js';
import { IWorkerMessage } from './ProjectParallelRunner.js';
import { IProjectParallelWorkerOptions } from './InteropInterfaces.js';
import { sleep } from '../../lib/timers/Timers.js';
import { ProjectRunner } from './ProjectRunner.js';
import { State } from './enums.js';
import { InMemoryCookieJar } from '../../cookies/InMemoryCookieJar.js';

class ProjectExeWorker extends ProjectRunner {
  initialize(): void {
    if (cluster.isPrimary) {
      throw new Error(`This file should not be called directly.`);
    }
    process.send!({ cmd: 'online' });
    process.on('message', this.messageHandler.bind(this));
  }

  messageHandler(message: IWorkerMessage): void {
    switch (message.cmd) {
      case 'run': this.run(message.data as IProjectParallelWorkerOptions); break;
    }
  }

  async run(options: IProjectParallelWorkerOptions): Promise<void> {
    options.cookies = new InMemoryCookieJar();
    try {
      await this.configure(new HttpProject(options.project), options);
      await this.execute();
    } catch (e) {
      const cause = e as Error;
      process.send!({ cmd: 'error', data: cause.message });
    }
  }

  async execute(): Promise<IProjectExecutionLog> {
    const { root } = this;
    if (!root) {
      throw new Error(`The project runner is not configured.`);
    }
    function unhandledRejection(): void {}
    process.on('unhandledRejection', unhandledRejection);
    this._state = State.Running as State;
    this.startTime = Date.now();
    while (this.remaining > 0) {
      this.remaining--;
      await this.executeIteration();
      this.index++;
      if (this.remaining && this.options?.iterationDelay) {
        await sleep(this.options.iterationDelay);
      }
    }
    process.off('unhandledRejection', unhandledRejection);
    this.endTime = Date.now();

    const log = await this.createReport();
    process.send!({ cmd: 'result', data: log.iterations });
    this._state = State.Idle as State;
    return log;
  }
}

const instance = new ProjectExeWorker();
instance.noEmit = true;
instance.initialize();
