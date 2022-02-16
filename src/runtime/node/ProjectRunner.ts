import { EventEmitter } from 'events';
import { HttpProject } from '../../models/HttpProject.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { ProjectRequest } from '../../models/ProjectRequest.js';
import { ProjectFolder, Kind as ProjectFolderKind } from '../../models/ProjectFolder.js';
import { Environment } from '../../models/Environment.js';
import { Property } from '../../models/Property.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { RequestFactory } from '../node/RequestFactory.js';
import { Logger } from '../../lib/logging/Logger.js';

export interface RunResult {
  /**
   * The key of the request from the HttpProject that was executed.
   */
  key: string;
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
  on(event: 'request', listener: (request: IHttpRequest) => void): this;
  /**
   * The response is ready.
   */
  on(event: 'response', listener: (request: IHttpRequest, log: IRequestLog) => void): this;
  /**
   * There was a general error during the request
   */
  on(event: 'request-error', listener: (request: IHttpRequest, message: string) => void): this;
  /**
   * The request object is prepared and about to be sent to the HTTP engine
   */
  once(event: 'request', listener: (request: IHttpRequest) => void): this;
  /**
   * The response is ready.
   */
  once(event: 'response', listener: (request: IHttpRequest, log: IRequestLog) => void): this;
  /**
   * There was a general error during the request
   */
  once(event: 'request-error', listener: (request: IHttpRequest, message: string) => void): this;
}

/**
 * A NodeJS runtime class that runs requests from a project.
 * It allows to select a specific folder and run the requests one-by-one using ARC's HTTP runtime.
 */
export class ProjectRunner extends EventEmitter {
  eventTarget = new EventTarget();
  logger?: Logger;
  project: HttpProject;

  protected queue: ProjectRequest[] = [];
  protected executed: RunResult[] = [];
  protected mainResolver?: (value: RunResult[] | PromiseLike<RunResult[]>) => void;
  protected mainRejecter?: (reason?: Error) => void;
  protected root?: HttpProject | ProjectFolder;
  protected masterEnvironment?: Environment;
  /**
   * The base URI to use with the requests fo fill up the relative URLs.
   */
  protected baseUri?: string;
  /**
   * The list of variables collected from the project to apply to the requests.
   */
  protected variables: Property[] = [];
  /**
   * The list of system variables to apply.
   */
  protected systemVariables: Record<string, string> = {};

  /**
   * The variables processor instance.
   */
  variablesProcessor = new VariablesProcessor();

  /**
   * After reading the environment data this is populated
   * with evaluated by the `VariablesProcessor` context.
   * This enables storing variables inside variables.
   */
  protected envContext: Record<string, string> = {};

  /**
   * @param project The project to execute the requests from.
   * @param environment Optional environment that overrides any other environment definition in the project.
   * When this is set then the environment option from the `run()` function is ignored.
   */
  constructor(project: HttpProject, environment?: Environment) {
    super();
    this.project = project;
    this.masterEnvironment = environment;
  }

  /**
   * Runs the request from the project root or a specified folder.
   * @param folder The optional folder key or name.
   * @returns A promise with the run result.
   */
  async run(folder?: string): Promise<RunResult[]> {
    this.executed = [];
    const root = folder ? this.project.findFolder(folder) : this.project;
    if (!root) {
      throw new Error(`Folder not found: ${folder}`);
    }
    const items = root.listRequests();
    if (!items.length) {
      return [];
    }
    this.root = root;
    this.queue = items;
    await this.prepareEnvironment();
    return new Promise((resolve, reject) => {
      this.mainResolver = resolve;
      this.mainRejecter = reject;
      this.next();  
    });
  }

  /**
   * Reads the environment information from the current folder or a project
   */
  async prepareEnvironment(nameOrKey?: string): Promise<void> {
    this.prepareSystemVariables();
    const env = await this.readEnvironments(nameOrKey);
    this.applyVariables(env);

    await this.prepareExecutionContext();
  }

  /**
   * Reads the list of the environments to apply to this runtime.
   */
  async readEnvironments(nameOrKey?: string): Promise<Environment[]> {
    let env: Environment[] = [];
    if (this.masterEnvironment) {
      env = [this.masterEnvironment];
    } else {
      const folderKey = this.root?.kind === ProjectFolderKind ? (this.root as ProjectFolder).key : undefined;
      env = await this.project.readEnvironments({ nameOrKey, folderKey });
    }
    return env;
  }

  /**
   * Reads the variables and the base URI from the passed environments.
   */
  applyVariables(environments: Environment[]): void {
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
    if (baseUri) {
      this.baseUri = baseUri;
    } else {
      this.baseUri = undefined;
    }
    this.variables = variables;
  }

  /**
   * Re-sets the `systemVariables` property with the current system variables.
   */
  prepareSystemVariables(): void {
    this.systemVariables = {};
    Object.keys(process.env).forEach(key => {
      const value = process.env[key];
      if (value) {
        this.systemVariables[key] = value;
      }
    });
  }

  /**
   * Sets the `envContext` with the variables that are finally passed to the request executor.
   */
  async prepareExecutionContext(): Promise<void> {
    const { variables, systemVariables, baseUri } = this;
    const ctx = VariablesProcessor.createContextFromProperties(variables);
    Object.keys(systemVariables).forEach((key) => {
      if (!(key in ctx)) {
        ctx[key] = systemVariables[key];
      }
    });
    // the `baseUri` is reserved and always set to the environment's `baseUri`.
    ctx.baseUri = baseUri || '';
    this.envContext = await this.variablesProcessor.buildContext(ctx);
  }

  /**
   * Executes the next item in the queue.
   */
  protected async next(): Promise<void> {
    const item = this.queue.shift();
    if (!item) {
      await this.finalize();
      return;
    }
    const config = item.getConfig();
    const factory = new RequestFactory(this.eventTarget);
    factory.variables = this.envContext;
    if (item.authorization) {
      factory.authorization = item.authorization.map(i => i.toJSON());
    }
    if (item.actions) {
      factory.actions = item.actions.toJSON();
    }
    if (item.clientCertificate) {
      factory.certificates = [item.clientCertificate];
    }
    if (config.enabled !== false) {
      factory.config = config.toJSON();
    }
    if (this.logger) {
      factory.logger = this.logger;
    }
    const info: RunResult = {
      key: item.key,
    };
    const requestData = { ...item.expects.toJSON() };
    requestData.url = this.prepareRequestUrl(requestData.url);
    const evCopy = { ...requestData };
    this.emit('request', evCopy);
    try {
      const log = await factory.run(requestData);
      item.setLog(log);
      info.log = log;
      this.emit('response', evCopy, { ...log });
    } catch (e) {
      info.error = true;
      info.errorMessage = (e as Error).message;
      this.emit('request-error', evCopy, info.errorMessage);
    }
    this.executed.push(info);
    setTimeout(() => this.next(), 1);
  }

  /**
   * Resolves the main promise and cleans-up.
   */
  protected async finalize(): Promise<void> {
    if (!this.mainResolver) {
      return;
    }
    
    this.mainResolver(this.executed);
    this.mainResolver = undefined;
    this.mainRejecter = undefined;
  }

  /**
   * Rejects the main promise with the passed error and cleans-up.
   */
  protected async error(error: Error): Promise<void> {
    if (!this.mainRejecter) {
      return;
    }
    this.mainRejecter(error);
    this.mainResolver = undefined;
    this.mainRejecter = undefined;
    this.queue = [];
  }

  /**
   * When defined it applies the serve's base URI to relative URLs.
   * @param currentUrl The URL to process.
   */
  prepareRequestUrl(currentUrl: string): string {
    const { baseUri } = this;
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
