import { HttpProject } from '../../models/HttpProject.js';
import { ProjectRequest } from '../../models/ProjectRequest.js';
import { ProjectFolder, Kind as ProjectFolderKind } from '../../models/ProjectFolder.js';
import { Environment } from '../../models/Environment.js';
import { Property } from '../../models/Property.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { NodeEngine } from '../http-engine/NodeEngine.js';
import { HttpEngineOptions } from '../http-engine/HttpEngine.js';

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

/**
 * A NodeJS runtime class that runs requests from a project.
 * It allows to select a specific folder and run the requests one-by-one using ARC's HTTP runtime.
 */
export class ProjectRunner {
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
    const request = await this.evaluateVariables(item);
    const opts = this.prepareEngineConfig(request)
    const engine = new NodeEngine(request.expects, opts);
    const info: RunResult = {
      key: request.key,
    }
    try {
      const log = await engine.send();
      request.setLog(log);
      info.log = log;
    } catch (e) {
      info.error = true;
      info.errorMessage = (e as Error).message;
    }
    this.executed.push(info);
    setTimeout(() => this.next(), 1);
  }

  protected prepareEngineConfig(request: ProjectRequest): HttpEngineOptions {
    const opts: HttpEngineOptions = {};
    const config = request.getConfig();
    if (request.authorization) {
      opts.authorization = request.authorization.map(i => i.toJSON());
    }
    if (config.enabled !== false) {
      if (config.defaultHeaders) {
        opts.defaultHeaders = config.defaultHeaders;
      }
      if (config.followRedirects) {
        opts.followRedirects = config.followRedirects;
      }
      if (Array.isArray(config.hosts)) {
        opts.hosts = config.hosts.map(i => i.toJSON());
      }
      if (typeof config.timeout === 'number') {
        opts.timeout = config.timeout;
      }
      if (typeof config.validateCertificates === 'boolean') {
        opts.validateCertificates = config.validateCertificates;
      }
    }
    return opts;
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
   * Evaluates variables in the project request.
   * Note, this returns a copy of the project.
   */
  protected async evaluateVariables(request: ProjectRequest): Promise<ProjectRequest> {
    const project = request.project;
    const serialized = request.toJSON();
    
    const { envContext, variablesProcessor } = this;
    let config = request.getConfig().toJSON();
    
    // evaluate request configuration
    config = await variablesProcessor.evaluateVariablesWithContext(config, envContext);
    serialized.config = config;
    // evaluate request data
    serialized.expects = await variablesProcessor.evaluateVariablesWithContext(serialized.expects, envContext);
    const auth = serialized.authorization;
    if (Array.isArray(auth)) {
      const ps = auth.map(async (item, index) => {
        auth[index] = await variablesProcessor.evaluateVariablesWithContext(item, envContext);
      });
    }
    serialized.expects.url = this.prepareRequestUrl(serialized.expects.url);
    return new ProjectRequest(project, serialized);
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
