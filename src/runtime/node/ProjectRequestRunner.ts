import { EventEmitter } from 'events';
import { Environment, Kind as EnvironmentKind } from '../../models/Environment.js';
import { Logger } from '../../lib/logging/Logger.js';
import { IRequestLog, RequestLog } from '../../models/RequestLog.js';
import { Property } from '../../models/Property.js';
import { ProjectFolder, Kind as ProjectFolderKind } from '../../models/ProjectFolder.js';
import { ProjectRequest, Kind as ProjectRequestKind } from '../../models/ProjectRequest.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { HttpProject } from '../../models/HttpProject.js';
import { SentRequest } from '../../models/SentRequest.js';
import { ErrorResponse } from '../../models/ErrorResponse.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { IProjectExecutionResult, IRequestRunnerOptions, IRequestRunnerRunOptions, IRunResult } from './InteropInterfaces.js';
import { State } from './enums.js';
import { HttpRequestRunner } from '../http-runner/HttpRequestRunner.js';
import { CookieJar } from '../../cookies/CookieJar.js';
import { AppProject, AppProjectFolder, AppProjectFolderKind, AppProjectItem, AppProjectRequest, AppProjectRequestKind } from '../../models/AppProject.js';
import { ProjectItem } from '../../models/ProjectItem.js';

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
  project: HttpProject | AppProject;
  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies?: CookieJar;

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

  constructor(project: HttpProject | AppProject, opts: IRequestRunnerOptions = {}) {
    super();
    this.project = project;
    this.logger = opts.logger;
    this.masterEnvironment = opts.environment;
    this.extraVariables = opts.variables;
    this.cookies = opts.cookies;
  }

  /**
   * Runs the request from the project root or a specified folder.
   * @param options Run options.
   * @returns A promise with the run result.
   */
  async run(options: IRequestRunnerRunOptions = {}): Promise<IProjectExecutionResult> {
    const { project } = this;
    const root = options.parent ? project.findFolder(options.parent) : project;
    if (!root) {
      throw new Error(`The parent folder not found: ${options.parent}.`);
    }
    const variables = await this.getVariables(root);
    const executed: IRunResult[] = [];
    for await (const result of this.runIterator(options, variables)) {
      executed.push(result);
    }
    return {
      items: executed,
      variables,
    };
  }

  /**
   * Creates an async iterator that allows to iterate over execution results.
   * The result is yielded after the request is executed.
   * 
   * @param options The iterator configuration.
   */
  protected async * runIterator(options: IRequestRunnerRunOptions = {}, variables?: Record<string, string>): AsyncGenerator<IRunResult> {
    const { project } = this;
    const root = options.parent ? project.findFolder(options.parent) : project;
    if (!root) {
      throw new Error(`The parent folder not found: ${options.parent}.`);
    }
    
    this._state = State.Running as State;
    const envVariables = variables || await this.getVariables(root);
    const { items } = root;
    const it = this._runIterator(items, envVariables, options);
    for await (const request of it) {
      yield request;
    }
  }

  protected async * _runIterator(items: (ProjectItem | AppProjectItem)[], variables: Record<string, string>, options: IRequestRunnerRunOptions): AsyncGenerator<IRunResult> {
    for (const item of items) {
      const current = item.getItem();
      if (!current) {
        continue;
      }
      if (current.kind === AppProjectRequestKind || current.kind === ProjectRequestKind) {
        if (Array.isArray(options.ignore) && options.ignore.includes(current.key)) {
          continue;
        }
        if (Array.isArray(options.requests) && !options.requests.includes(current.key) && !options.requests.includes(current.info.name || '')) {
          continue;
        }
        const info = await this._runItem(current as AppProjectRequest | ProjectRequest, variables);
        yield info;
      } else if (current.kind === ProjectFolderKind || current.kind === AppProjectFolderKind) {
        if (!options.recursive) {
          continue;
        }
        const parent = current as ProjectFolder | AppProjectFolder;
        // make a copy so the variables executed in the encapsulated environment won't leak out to the current environment.
        let encapsulated = false;
        // we restore the `baseUri` after exiting the folder.
        const currentBaseUri = variables.baseUri;
        const { items: parentItems } = parent;
        const envItem = (parentItems as (ProjectItem | AppProjectItem)[]).find(i => i.kind === EnvironmentKind);
        let parentVariables: Record<string, string> = {};
        let childVariables = variables;
        if (envItem) {
          const parentEnv = envItem.getItem() as Environment | undefined;
          if (parentEnv) {
            encapsulated = parentEnv.encapsulated;
            parentVariables = await this.applyVariables([parentEnv]);
            if (encapsulated) {
              childVariables = parentVariables;
            } else {
              childVariables = { ...childVariables, ...parentVariables };
            }
          }
        }

        const it = this._runIterator(parentItems, childVariables, options);
        for await (const request of it) {
          yield request;
        }
        if (!encapsulated) {
          // now we set the variables set on children to the main variables object, except for these
          // declared on the child environments, so these won't leak to other folders.
          // However, variables set by a request in a folder always is propagated to the main environment.
          const ignore: string[] = Object.keys(parentVariables);
          Object.keys(childVariables).forEach((key) => {
            if (!ignore.includes(key)) {
              variables[key] = childVariables[key]
            }
          });
        }
        variables.baseUri = currentBaseUri;
      }
    }
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
  async* [Symbol.asyncIterator](): AsyncGenerator<IRunResult> {
    for await (const result of this.runIterator({ recursive: true })) {
      yield result;
    }
  }

  private async _runItem(request: ProjectRequest | AppProjectRequest, variables: Record<string, string>): Promise<IRunResult> {
    if (this._state === State.Aborted) {
      throw new Error(`The execution has been aborted.`);
    }
    const info = await this.execute(request, variables);
    const folder = request.getParent();
    if (folder && folder !== this.project) {
      info.parent = folder.key;
    }
    return info;
  } 

  protected async execute(request: ProjectRequest | AppProjectRequest, variables: Record<string, string>): Promise<IRunResult> {
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
    if (this.cookies) {
      factory.cookies = this.cookies;
    }
    const info: IRunResult = {
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

  protected async getVariables(parent: HttpProject | AppProject | ProjectFolder | AppProjectFolder): Promise<Record<string, string>> {
    if (this.masterEnvironment) {
      return this.applyVariables([this.masterEnvironment]);
    }
    return this.createEnvironment(parent);
  }

  protected async createEnvironment(parent: HttpProject | AppProject | ProjectFolder | AppProjectFolder): Promise<Record<string, string>> {
    const envs = await this.readEnvironments(parent);
    return this.applyVariables(envs);
  }

  /**
   * Reads the list of the environments to apply to this runtime.
   */
  protected async readEnvironments(parent: HttpProject | AppProject | ProjectFolder | AppProjectFolder): Promise<Environment[]> {
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
