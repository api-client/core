import { EventEmitter } from 'events';
import { Environment } from '../../models/Environment.js';
import { Logger } from '../../lib/logging/Logger.js';
import { IRequestLog, RequestLog } from '../../models/RequestLog.js';
import { Property } from '../../models/Property.js';
import { ProjectFolder, Kind as ProjectFolderKind } from '../../models/ProjectFolder.js';
import { ProjectRequest } from '../../models/ProjectRequest.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { HttpProject } from '../../models/HttpProject.js';
import { SentRequest } from '../../models/SentRequest.js';
import { ErrorResponse } from '../../models/ErrorResponse.js';
import { VariablesStore } from './VariablesStore.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { ProjectRunnerOptions, ProjectRunnerRunOptions, RunResult } from './InteropInterfaces.js';
import { State } from './enums.js';
import { HttpRequestRunner } from '../http-runner/HttpRequestRunner.js';

export interface ProjectRequestRunner {
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
 * Runs requests in a project.
 * Developers can run the entire project with the `recursive` flag set. They can also 
 * set the starting point with the `parent` options.
 * 
 * Requests are executed in order defined in the folder.
 */
export class ProjectRequestRunner extends EventEmitter {
  logger?: Logger;
  project: HttpProject;

  protected masterEnvironment?: Environment;
  protected extraVariables?: Record<string, string>;

  /**
   * The variables processor instance.
   */
  protected variablesProcessor = new VariablesProcessor();

  protected _state: State = State.Idle;

  get state(): State {
    return this._state;
  }

  constructor(project: HttpProject, opts: ProjectRunnerOptions = {}) {
    super();
    this.project = project;
    this.logger = opts.logger;
    this.masterEnvironment = opts.environment;
    this.extraVariables = opts.variables;
  }

  /**
   * Runs the request from the project root or a specified folder.
   * @param options Run options.
   * @returns A promise with the run result.
   */
  async run(options?: ProjectRunnerRunOptions): Promise<RunResult[]> {
    this._state = State.Running as State;
    const { project } = this;
    const executed: RunResult[] = [];
    for (const request of project.requestIterator(options)) {
      const info = await this._runItem(request);
      executed.push(info);
    }
    this._state = State.Idle;
    return executed;
  }

  /**
   * Aborts the current run.
   * The promise returned by the `run()` method will reject if not yet resolved.
   */
  abort(): void {
    this._state = State.Aborted;
  }

  /**
   * Allows to iterate over project requests recursively and execute each request
   * in order. The generator yields the `RunResult` for the request.
   * 
   * Example:
   * 
   * ```javascript
   * const runner = new ProjectRequestRunner(...);
   * for await (let runResult of runner) {
   *  console.log(runResult);
   * }
   * ```
   */
  async* [Symbol.asyncIterator](): AsyncGenerator<RunResult> {
    const { project } = this;
    this._state = State.Running as State;
    for (const request of project.requestIterator({ recursive: true })) {
      const info = await this._runItem(request);
      yield info;
    }
    this._state = State.Idle;
  }

  private async _runItem(request: ProjectRequest): Promise<RunResult> {
    if (this._state === State.Aborted) {
      throw new Error(`The execution has been aborted.`);
    }
    const folder = request.getParent();
    const parent = folder || this.project;
    let variables: Record<string, string>;
    if (VariablesStore.has(parent)) {
      variables = VariablesStore.get(parent);
    } else {
      variables = await this.getVariables(parent);
      VariablesStore.set(parent, variables);
    }
    const info = await this.execute(request, variables);
    if (folder && folder !== this.project) {
      info.parent = folder.key;
    }
    return info;
  } 

  protected async execute(request: ProjectRequest, variables: Record<string, string>): Promise<RunResult> {
    const config = request.getConfig();
    const factory = new HttpRequestRunner();

    factory.variables = variables;
    if (request.authorization) {
      factory.authorization = request.authorization.map(i => i.toJSON());
    }
    if (request.flows) {
      factory.flows = request.flows;
    }
    if (request.clientCertificate) {
      factory.certificates = [request.clientCertificate.toJSON()];
    }
    if (config.enabled !== false) {
      factory.config = config.toJSON();
    }
    if (this.logger) {
      factory.logger = this.logger;
    }
    const info: RunResult = {
      key: request.key,
    };
    const requestData = request.expects.toJSON();
    requestData.url = this.prepareRequestUrl(requestData.url, variables);

    try {
      // Below replaces the single call to the `run()` function of the factory to 
      // report via the events a request object that has evaluated with the Jexl library.
      const requestCopy = await factory.applyVariables(requestData);
      await factory.applyAuthorization(requestCopy);
      await factory.applyCookies(requestCopy);
      this.emit('request', request.key, { ...requestCopy });
      await factory.runRequestFlows(requestCopy);
      const result = await factory.executeRequest(requestCopy);
      result.requestId = request.key;
      await factory.processResponse(result);
      request.setLog(result);
      info.log = result;
      this.emit('response', request.key, { ...result });
    } catch (e) {
      const cause = e as Error;
      info.error = true;
      info.errorMessage = cause.message;
      const sent = new SentRequest({ ...requestData, startTime: 0, endTime: 0, });
      const response = ErrorResponse.fromError(info.errorMessage);
      const log = RequestLog.fromRequestResponse(sent.toJSON(), response.toJSON()).toJSON();
      this.emit('error', request.key, log, info.errorMessage);
    }
    return info;
  }

  protected async getVariables(parent: HttpProject | ProjectFolder): Promise<Record<string, string>> {
    if (this.masterEnvironment) {
      return this.applyVariables([this.masterEnvironment]);
    }
    return this.createEnvironment(parent);
  }

  protected async createEnvironment(parent: HttpProject | ProjectFolder): Promise<Record<string, string>> {
    const envs = await this.readEnvironments(parent);
    return this.applyVariables(envs);
  }

  /**
   * Reads the list of the environments to apply to this runtime.
   */
  protected async readEnvironments(parent: HttpProject | ProjectFolder): Promise<Environment[]> {
    const folderKey = parent.kind === ProjectFolderKind ? (parent as ProjectFolder).key : undefined;
    return this.project.readEnvironments({ parent: folderKey });
  }

  /**
   * Reads the variables and the base URI from the passed environments.
   */
  protected async applyVariables(environments: Environment[]): Promise<Record<string, string>> {
    let baseUri = '';
    const variables: Property[] = [];
    environments.forEach((environment) => {
      const { server, variables: envVariables } = environment;
      if (server) {
        baseUri = server.readUri();
      }
      if (envVariables.length) {
        envVariables.forEach((item) => {
          const defined = variables.findIndex(i => i.name === item.name);
          if (defined >= 0) {
            variables[defined] = item;
          } else {
            variables.push(item);
          }
        });
      }
    });
    const { extraVariables } = this;
    const ctx = VariablesProcessor.createContextFromProperties(variables);
    if (extraVariables) {
      Object.keys(extraVariables).forEach((key) => {
        ctx[key] = extraVariables[key];
      });
    }
    // the `baseUri` is reserved and always set to the environment's `baseUri`.
    ctx.baseUri = baseUri || '';
    return this.variablesProcessor.buildContext(ctx);
  }

  /**
   * When defined it applies the serve's base URI to relative URLs.
   * @param currentUrl The URL to process.
   */
  protected prepareRequestUrl(currentUrl: string, variables: Record<string, string>): string {
    const { baseUri } = variables;
    if (!baseUri) {
      return currentUrl;
    }
    if (currentUrl.startsWith('http:') || currentUrl.startsWith('https:')) {
      return currentUrl;
    }
    if (currentUrl.startsWith('/')) {
      return `${baseUri}${currentUrl}`;
    }
    return `${baseUri}/${currentUrl}`;
  }
}
