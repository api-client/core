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

export interface ProjectRunnerRunOptions {
  /**
   * The parent folder key or name. When not set it runs project root requests.
   */
  parent?: string

  /**
   * When set it limits the number of requests to execute from the current folder to the one defined in this option.
   * It is an array of request keys or names.
   */
  requests?: string[];
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
  on(event: 'error', listener: (key: string, request: IHttpRequest, message: string) => void): this;
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
  once(event: 'error', listener: (key: string, request: IHttpRequest, message: string) => void): this;
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
  protected prepared = false;

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
   * To be called when all properties are set, before calling the `run()` function.
   * It prepares the execution context.
   * 
   * This is called automatically when the `run()` function is called without calling this function beforehand.
   * This can be used to obtain a reference to the processed environment variables before executing the request.
   */
  async prepare(): Promise<void> {
    await this.prepareEnvironment();
    this.prepared = true;
  }

  /**
   * @returns a direct reference to the environment variables.
   */
  variablesReference(): Record<string, string> {
    return this.envContext;
  }

  /**
   * Runs the request from the project root or a specified folder.
   * @param options Run options.
   * @returns A promise with the run result.
   */
  async run(options: ProjectRunnerRunOptions = {}): Promise<RunResult[]> {
    const { parent, requests } = options;
    this.executed = [];
    const root = parent ? this.project.findFolder(parent) : this.project;
    if (!root) {
      throw new Error(`Folder not found: ${parent}`);
    }
    let items = root.listRequests();
    if (!items.length) {
      return [];
    }
    if (Array.isArray(requests)) {
      items = items.filter((i) => {
        if (requests.includes(i.key)) {
          return true;
        }
        if (!i.info.name) {
          return false;
        }
        return requests.includes(i.info.name);
      });
    }
    this.root = root;
    this.queue = items;
    if (!this.prepared) {
      await this.prepare();
    }
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
    const requestData = item.expects.toJSON();
    requestData.url = this.prepareRequestUrl(requestData.url);
    try {
      // Below replaces the single call to the `run()` function of the factory to 
      // report via the events a request object that has evaluated with the Jexl library.
      await factory.prepareEnvironment();
      const requestCopy = await factory.processRequestVariables(requestData);
      this.emit('request', item.key, { ...requestCopy });
      await factory.processRequestLogic(requestCopy);
      const result = await factory.executeRequest(requestCopy);
      await factory.processResponse(result);

      const log = await factory.run(requestData);
      item.setLog(log);
      info.log = log;
      this.emit('response', item.key, { ...log });
    } catch (e) {
      info.error = true;
      info.errorMessage = (e as Error).message;
      this.emit('error', item.key, { ...requestData }, info.errorMessage);
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
