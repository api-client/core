import { SerializableError } from '../../models/SerializableError.js';
import { HttpProject } from '../../models/HttpProject.js';
import { ProjectFolder } from '../../models/ProjectFolder.js';
import { Environment, IEnvironment } from '../../models/Environment.js';
import { DummyLogger } from '../../lib/logging/DummyLogger.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { ProjectRequestRunner } from './ProjectRequestRunner.js';
import { IProjectExecutionIteration, IProjectExecutionLog } from '../reporters/Reporter.js';
import { pathExists, readJson } from '../../lib/fs/Fs.js';
import { BaseRunner } from './BaseRunner.js';
import { IProjectRunnerOptions, IRequestRunnerOptions } from './InteropInterfaces.js';
import { State } from './enums.js';
import { AppProject, AppProjectFolder } from '../../models/AppProject.js';

type ProjectParent = HttpProject | ProjectFolder | AppProject | AppProjectFolder;

export interface ProjectRunner {
  /**
   * Event dispatched when an iteration is about to start.
   */
  on(event: 'before-iteration', listener: (index: number, iterated: boolean) => void): this;
  /**
   * Event dispatched when an iteration finished.
   */
  on(event: 'after-iteration', listener: (index: number, iterated: boolean) => void): this;
  /**
   * Event dispatched before the iteration is going to sleep for the set period of time.
   */
  on(event: 'before-sleep', listener: () => void): this;
  /**
   * Event dispatched after the iteration is woke up.
   */
  on(event: 'after-sleep', listener: () => void): this;
  /**
   * The request object is prepared and about to be sent to the HTTP engine
   */
  on(event: 'request', listener: (key: string, request: IHttpRequest) => void): this;
  /**
   * The response is ready.
   */
  on(event: 'response', listener: (key: string, log: IRequestLog) => void): this;
  /**
   * There was a general error during the request
   */
  on(event: 'error', listener: (key: string, log: IRequestLog, message: string) => void): this;
  /**
   * Event dispatched when an iteration is about to start.
   */
  once(event: 'before-iteration', listener: (index: number, iterated: boolean) => void): this;
  /**
   * Event dispatched when an iteration finished.
   */
  once(event: 'after-iteration', listener: (index: number, iterated: boolean) => void): this;
  /**
   * Event dispatched before the iteration is going to sleep for the set period of time.
   */
  once(event: 'before-sleep', listener: () => void): this;
  /**
   * Event dispatched after the iteration is woke up.
   */
  once(event: 'after-sleep', listener: () => void): this;
  /**
   * The request object is prepared and about to be sent to the HTTP engine
   */
  once(event: 'request', listener: (key: string, request: IHttpRequest) => void): this;
  /**
   * The response is ready.
   */
  once(event: 'response', listener: (key: string, log: IRequestLog) => void): this;
  /**
   * There was a general error during the request
   */
  once(event: 'error', listener: (key: string, log: IRequestLog, message: string) => void): this;
}

/**
 * A class to be extended to run an entire API Project for the given configuration options.
 * 
 * The main purpose of this class (and its children) is to iterate over requests
 * in the project and execute them one-by-one.
 * 
 * Implementations allow to execute the requests in a serial model or in parallel mode, where
 * a separate workers are created to run the same HTTP requests in each worker.
 * 
 * This class generates a run report which other programs can use to build all kinds of UIs
 * around the data collected during the run.
 */
export abstract class ProjectRunner extends BaseRunner {
  /**
   * The HTTP project to run requests from.
   */
  project?: HttpProject | AppProject;
  /**
   * The execution options for the project.
   */
  options?: IProjectRunnerOptions;
  /**
   * The root object (project or a folder) where the program starts iterating over the requests.
   */
  root?: ProjectParent;
  /**
   * The selected environment to apply to the requests.
   */
  environment?: Environment;
  /**
   * This is used with `--iterations`. The index of the current iteration.
   */
  protected index = 0;
  /**
   * The currently executed iteration loop.
   */
  protected currentIteration?: IProjectExecutionIteration;
  /**
   * The number of remaining iterations to run.
   */
  protected remaining = 1;
  /**
   * Whether the configuration allows iterations (the parallel mode).
   */
  protected hasIterations = false;
  /**
   * When set it won't amit any event.
   * This can be used in a background worker when events are never handled.
   */
  noEmit = false;

  /**
   * When executing, this is the last user request runner.
   */
  protected _runner?: ProjectRequestRunner;

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

  constructor() {
    super();
    this._requestHandler = this._requestHandler.bind(this);
    this._responseHandler = this._responseHandler.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    this._abortHandler = this._abortHandler.bind(this);
  }

  /**
   * A required step before running the project.
   * It configures the execution context. It may throw an error when configuration is not valid.
   */
  async configure(project: HttpProject | AppProject, opts: IProjectRunnerOptions = {}): Promise<void> {
    this.project = project;
    this.options = opts || {};
    if (typeof this.options.iterations === 'number' && this.options.iterations >= 0) {
      this.remaining = this.options.iterations;
    }
    this.hasIterations = this.remaining > 1;

    const root = opts.parent ? project.findFolder(opts.parent) : project;
    if (!root) {
      throw new Error(`Unable to locate the folder: ${opts.parent}`);
    }
    this.root = root;
    this.environment = await this.getEnvironment();
    if (opts.signal) {
      this.signal = opts.signal;
    }
  }

  /**
   * Executes the requests in the project.
   * @returns The execution log created by calling the `createReport()` function.
   */
  abstract execute(): Promise<IProjectExecutionLog>;

  /**
   * Aborts the current run.
   * The promise returned by the `execute()` method will reject if not yet resolved.
   */
  abort(): void {
    this._state = State.Aborted;
    if (this._runner) {
      this._runner.abort();
    }
  }

  /**
   * Handler for the `abort` event on the `AbortSignal`.
   */
  protected _abortHandler(): void {
    this.abort();
  }

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

  /**
   * Reads the environment data to use with the execution.
   * If the configured environment is a location of a file
   * it is read as API Client's environment and used in the execution.
   * Otherwise it searches for the environment in the list of the defined 
   * environments by the name of the key.
   * 
   * It throws when the environment cannot be found or when the file contents is invalid.
   */
  protected async getEnvironment(): Promise<Environment | undefined> {
    const { options } = this;
    if (!options) {
      throw new Error(`Run configure() first.`);
    }
    if (!options.environment) {
      return;
    }
    const fileExists = await pathExists(options.environment);
    if (fileExists) {
      const contents = await readJson(options.environment);
      return new Environment(contents as IEnvironment);
    }
    const root = this.root as ProjectParent;
    const envs = root.getEnvironments();
    const env = envs.find(i => i.key === options.environment || i.info.name === options.environment);
    if (!env) {
      throw new SerializableError(`The environment cannot be found: ${options.environment}.`, 'EENVNOTFOUND');
    }
    return env;
  }

  protected async getProjectRunnerOptions(): Promise<IRequestRunnerOptions> {
    const { environment, options } = this;
    if (!options) {
      throw new Error(`Run configure() first.`);
    }
    const result: IRequestRunnerOptions = {
      variables: this.prepareVariables(),
    };
    if (environment) {
      result.environment = environment;
    }
    if (options.logger) {
      result.logger = options.logger;
    } else {
      result.logger = new DummyLogger();
    }
    if (options.cookies) {
      result.cookies = options.cookies;
    }
    return result;
  }

  /**
   * Runs the requests from the project as configured.
   */
  protected async executeIteration(): Promise<void> {
    if (this._state === State.Aborted) {
      throw new Error(`The execution has been aborted.`);
    }
    const { project, options, hasIterations, index, noEmit } = this;
    if (!options || !project) {
      throw new Error(`Run configure() first.`);
    }
    if (!noEmit) {
      this.emit('before-iteration', index, hasIterations);
    }
    const runnerOptions = await this.getProjectRunnerOptions();
    const runner = new ProjectRequestRunner(project, runnerOptions);
    this._runner = runner;
    runner.on('request', this._requestHandler);
    runner.on('response', this._responseHandler);
    runner.on('error', this._errorHandler);
    this.currentIteration = {
      index: this.index,
      executed: [],
      variables: {},
    };
    try {
      const info = await runner.run({
        parent: options.parent,
        requests: options.request,
        ignore: options.ignore,
        recursive: options.recursive
      });
      this.currentIteration.variables = info.variables;
    } catch (e) {
      const cause = e as Error;
      this.options?.logger?.error(e);
      this.currentIteration.error = cause.message || 'Unknown error ocurred';
      // ...
    }
    this.executed.push(this.currentIteration);
    if (!noEmit) {
      this.emit('after-iteration', index, hasIterations);
    }
  }

  /**
   * Retargets the "request" event from the factory.
   */
  protected _requestHandler(key: string, request: IHttpRequest): void {
    if (!this.noEmit) {
      this.emit('request', key, request);
    }
  }

  /**
   * Retargets the "response" event from the factory.
   */
  protected _responseHandler(key: string, log: IRequestLog): void {
    this.currentIteration?.executed.push(log);
    if (!this.noEmit) {
      this.emit('response', key, log);
    }
  }

  /**
   * Retargets the "error" event from the factory.
   */
  protected _errorHandler(key: string, log: IRequestLog, message: string): void {
    this.currentIteration?.executed.push(log);
    if (!this.noEmit) {
      this.emit('error', key, log, message);
    }
  }

  /**
   * @returns Reads the system variables based on the library configuration.
   */
  protected prepareVariables(): Record<string, string> {
    const result: Record<string, string> = {};
    const { options } = this;
    if (!options) {
      return result;
    }
    const { variables } = options;
    if (typeof variables === 'undefined') {
      return result;
    }
    if (typeof variables === 'boolean') {
      return variables ? this._readSystemVariables() : result;
    }
    if (Array.isArray(variables)) {
      return this._readSystemVariables(variables);
    }
    return variables;
  }

  private _readSystemVariables(names?: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(process.env).forEach((key) => {
      if (names && !names.includes(key)) {
        return;
      }
      const value = process.env[key];
      if (value) {
        result[key] = value;
      }
    });
    return result;
  }
}
