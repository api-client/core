import { EventEmitter } from 'events';
import { Environment } from '../../models/Environment.js';
import { Logger } from '../../lib/logging/Logger.js';
import { IRequestLog, RequestLog } from '../../models/RequestLog.js';
import { Property } from '../../models/Property.js';
import { ProjectFolder, Kind as ProjectFolderKind } from '../../models/ProjectFolder.js';
import { ProjectRequest } from '../../models/ProjectRequest.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { HttpProject, IProjectRequestIterator } from '../../models/HttpProject.js';
import { SentRequest } from '../..//models/SentRequest.js';
import { ErrorResponse } from '../../models/ErrorResponse.js';
import { VariablesStore } from './VariablesStore.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { RequestFactory } from './RequestFactory.js';
import { EventTypes } from '../../events/EventTypes.js';

export interface ProjectRunnerOptions {
  /**
   * When provided it overrides any project / folder defined environment.
   */
  environment?: Environment;
  /**
   * Additional variables to pass to the selected environment.
   * This can be use to pass system variables, when needed.
   * 
   * To use system variables tou can use `init.variables = process.env`;
   */
  variables?: Record<string, string>;
  /**
   * Overrides the default logger (console).
   */
  logger?: Logger;
  /**
   * The event target to use.
   * By default it creates its own target.
   */
  eventTarget?: EventTarget;
}

export interface ProjectRunnerRunOptions extends IProjectRequestIterator {
}

export interface RunResult {
  /**
   * The key of the request from the HttpProject that was executed.
   */
  key: string;
  /**
   * The key of parent folder of the executed request.
   */
  parent?: string;
  /**
   * Set when a fatal error occurred so the request couldn't be executed.
   * This is not the same as error reported during a request. The log's response can still be IResponseError.
   */
  error?: boolean;
  /**
   * The error message. Always set when the `error` is `true`.
   */
  errorMessage?: string;
  /**
   * The request log.
   * Always set when the `error` is `false`.
   */
  log?: IRequestLog;
}

export interface ProjectRunner {
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
export class ProjectRunner extends EventEmitter {
  eventTarget: EventTarget;
  logger?: Logger;
  project: HttpProject;

  protected masterEnvironment?: Environment;
  protected extraVariables?: Record<string, string>;

  /**
   * The variables processor instance.
   */
  protected variablesProcessor = new VariablesProcessor();

  constructor(project: HttpProject, opts: ProjectRunnerOptions = {}) {
    super();
    this.project = project;
    this.logger = opts.logger;
    this.eventTarget = opts.eventTarget || new EventTarget();
    this.masterEnvironment = opts.environment;
    this.extraVariables = opts.variables;
  }

  /**
   * Runs the request from the project root or a specified folder.
   * @param options Run options.
   * @returns A promise with the run result.
   */
  async run(options?: ProjectRunnerRunOptions): Promise<RunResult[]> {
    const { project } = this;
    const executed: RunResult[] = [];
    for (const request of project.requestIterator(options)) {
      const parent = request.getParent() || project;
      let variables: Record<string, string>;
      if (VariablesStore.has(parent)) {
        variables = VariablesStore.get(parent);
      } else {
        variables = await this.getVariables(parent);
        VariablesStore.set(parent, variables);
      }
      const info = await this.execute(request, variables);
      executed.push(info);
    }
    return executed;
  }

  protected async execute(request: ProjectRequest, variables: Record<string, string>): Promise<RunResult> {
    const config = request.getConfig();
    const factory = new RequestFactory(this.eventTarget);

    factory.variables = variables;
    if (request.authorization) {
      factory.authorization = request.authorization.map(i => i.toJSON());
    }
    if (request.actions) {
      factory.actions = request.actions.toJSON();
    }
    if (request.clientCertificate) {
      factory.certificates = [request.clientCertificate];
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

    function variableHandler(e: CustomEvent): void {
      if (e.defaultPrevented) {
        return;
      }
      const { name, value } = e.detail;
      variables[name] = value;
      e.preventDefault();
      e.detail.result = Promise.resolve();
    }

    this.eventTarget.addEventListener(EventTypes.Environment.set, variableHandler as any);

    try {
      // Below replaces the single call to the `run()` function of the factory to 
      // report via the events a request object that has evaluated with the Jexl library.
      const requestCopy = await factory.processRequestVariables(requestData);
      this.emit('request', request.key, { ...requestCopy });
      await factory.processRequestLogic(requestCopy);
      const result = await factory.executeRequest(requestCopy);
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

    this.eventTarget.removeEventListener(EventTypes.Environment.set, variableHandler as any);
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
    return this.project.readEnvironments({ folderKey });
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
