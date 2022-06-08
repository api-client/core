import cluster, { Worker } from 'cluster';
import { cpus } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { HttpProject } from '../../models/HttpProject.js';
import { IProjectExecutionLog, IProjectExecutionIteration } from '../reporters/Reporter.js';
import { BaseRunner } from './BaseRunner.js';
import { State } from './enums.js';
import { IProjectParallelRunnerOptions, IProjectParallelWorkerOptions } from './InteropInterfaces.js'

const numCPUs = cpus().length;
const __dirname = dirname(fileURLToPath(import.meta.url));

export type WorkerStatus = 'initializing' | 'ready' | 'running' | 'finished' | 'error';

export interface IWorkerInfo {
  /**
   * Whether the worker is online.
   */
  online: boolean;
  /**
   * The number of iterations the worker is performing.
   */
  iterations: number;
  /**
   * The current status of the worker.
   */
  status: WorkerStatus;
  /**
   * Optional error message received from the worker.
   */
  message?: string;
}

interface WorkerInfoInternal extends IWorkerInfo {
  worker: Worker;
}

export interface IWorkerMessage {
  cmd: string;
  data?: unknown;
}

export interface ProjectParallelRunner {
  /**
   * Dispatched when a status of a worker change.
   * This can be used to render the current status.
   */
  on(event: 'status', listener: (info: IWorkerInfo[]) => void): this;
  /**
   * Dispatched when a status of a worker change.
   * This can be used to render the current status.
   */
  once(event: 'status', listener: (info: IWorkerInfo[]) => void): this;
}

/**
 * Runs a project in parallel.
 * It creates a number of workers determined by the number of CPUs available on the current machine
 * and the number of iterations defined in the configuration options.
 * 
 * When the number of iterations is greater then the number of CPUs then 
 * the program distributes the remaining iterations among created workers.
 * 
 * The program dispatched the `status` event. It is dispatched each time when the worker status
 * change. This event can be user to refresh the UI to reflect the newest state.
 */
export class ProjectParallelRunner extends BaseRunner {
  project: HttpProject;
  options: IProjectParallelRunnerOptions;
  workers: WorkerInfoInternal[] = [];
  private mainResolver?: (report: IProjectExecutionLog) => void;
  private mainRejecter?: (err: Error) => void;

  constructor(project: HttpProject, opts: IProjectParallelRunnerOptions = {}) {
    super();
    this.project = project;
    this.options = opts;

    this._exitHandler = this._exitHandler.bind(this);
    this._abortHandler = this._abortHandler.bind(this);
    if (opts.signal) {
      this.signal = opts.signal;
    }
  }

  execute(): Promise<IProjectExecutionLog> {
    return new Promise((resolve, reject) => {
      this.mainResolver = resolve;
      this.mainRejecter = reject;
      this._execute();
    });
  }

  protected _state: State = State.Idle;

  get state(): State {
    return this._state;
  }

  protected _signal?: AbortSignal;

  /**
   * The abort signal to set on this request.
   * Aborts the request when the signal fires.
   * @type {(AbortSignal | undefined)}
   */
  get signal(): AbortSignal | undefined {
    return this._signal;
  }

  set signal(value: AbortSignal | undefined) {
    const old = this._signal;
    if (old === value) {
      return;
    }
    this._signal = value;
    if (old) {
      old.removeEventListener('abort', this._abortHandler);
    }
    if (value) {
      value.addEventListener('abort', this._abortHandler);
    }
  }

  /**
   * Aborts the current run.
   * The promise returned by the `execute()` method will reject if not yet resolved.
   */
  abort(): void {
    this._state = State.Aborted;
    const { workers } = this;
    workers.forEach((info) => {
      if (info.status !== 'error') {
        try {
          info.worker.destroy();
        } catch (e) {
          // ...
        }
        info.status = 'error';
      }
    });
    if (this.mainRejecter) {
      this.mainRejecter(new Error(`The execution has been aborted.`));
      this.mainRejecter = undefined;
      this.mainResolver = undefined;
    }
  }

  /**
   * Handler for the `abort` event on the `AbortSignal`.
   */
  protected _abortHandler(): void {
    this.abort();
  }

  private _execute(): void {
    this._state = State.Running as State;
    try {
      cluster.setupPrimary({
        exec: join(__dirname, 'ProjectRunnerWorker.js'),
        silent: true,
      });
      const { iterations = 1 } = this.options;
      const poolSize = Math.min(iterations, numCPUs);
      for (let i = 0; i < poolSize; i++) {
        const worker = cluster.fork();
        this.setupWorker(worker);
      }
      this.distributeIterations();
      this.emit('status', this.getStatusWorkers());
      cluster.on('exit', this._exitHandler);
    } catch (e) {
      const cause = e as Error;
      if (this.mainRejecter) {
        this.mainRejecter(cause);
      }
      this.mainResolver = undefined
      this.mainRejecter = undefined
      this._state = State.Idle as State;
    }
  }

  private getStatusWorkers(): IWorkerInfo[] {
    const { workers } = this;
    const result: IWorkerInfo[] = [];
    workers.forEach((info) => {
      const cp = { ...info } as any;
      delete cp.worker;
      result.push(cp);
    });
    return result;
  }

  private distributeIterations(): void {
    const workers = this.workers.length;
    const { iterations = 1 } = this.options;
    let iterationsRemaining = iterations - workers;
    let currentIndex = 0;
    while (iterationsRemaining > 0) {
      this.workers[currentIndex].iterations += 1;
      iterationsRemaining--;
      currentIndex++;
      if (currentIndex + 1 === workers) {
        currentIndex = 0;
      }
    }
  }

  private setupWorker(worker: Worker): void {
    this.workers.push({
      worker,
      online: false,
      iterations: 1,
      status: 'initializing',
    });
    worker.on('message', this._messageHandler.bind(this, worker));
  }

  private _messageHandler(worker: Worker, message: IWorkerMessage): void {
    switch (message.cmd) {
      case 'online': this.setOnline(worker); break;
      case 'result': this.setRunResult(worker, message); break;
      case 'error': this.setRunError(worker, message); break;
    }
  }

  private _exitHandler(worker: Worker): void {
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    this.finishWhenReady();
  }

  private setOnline(worker: Worker): void {
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.online = true;
    info.status = 'ready';
    this.runWhenReady();
    this.emit('status', this.getStatusWorkers());
  }

  private setRunResult(worker: Worker, message: IWorkerMessage): void {
    const reports = message.data as IProjectExecutionIteration[];
    this.executed = this.executed.concat(reports);
    worker.destroy();
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.status = 'finished';
    this.emit('status', this.getStatusWorkers());
  }

  private runWhenReady(): void {
    const waiting = this.workers.some(i => !i.online);
    if (waiting) {
      return;
    }
    this.startTime = Date.now();
    this.workers.forEach((info) => {
      const opts: IProjectParallelWorkerOptions = { ...this.options, project: this.project.toJSON() };
      opts.iterations = info.iterations;
      info.status = 'running';
      info.worker.send({
        cmd: 'run',
        data: opts,
      });
    });
  }

  private async finishWhenReady(): Promise<void> {
    if (this.endTime) {
      return;
    }
    const working = this.workers.some(i => !['finished', 'error'].includes(i.status));
    if (working || !this.mainResolver) {
      return;
    }
    this.endTime = Date.now();
    const report = await this.createReport();
    this.mainResolver(report);
    this.mainResolver = undefined
    this.mainRejecter = undefined
    cluster.off('exit', this._exitHandler);
    this._state = State.Idle as State;
  }

  private setRunError(worker: Worker, message: IWorkerMessage): void {
    worker.destroy();
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.status = 'error';
    info.message = message.data as string;
    this.emit('status', this.getStatusWorkers());
  }
}
