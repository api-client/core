import { IRequest } from '../../models/Request.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { IRequestConfig } from '../../models/RequestConfig.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { IHttpActionFlow } from '../../models/http-actions/HttpActions.js';
import { HttpEngineOptions } from '../http-engine/HttpEngine.js';
import { CoreEngine } from '../http-engine/CoreEngine.js';
import { Logger } from '../../lib/logging/Logger.js';
import { CookieJar } from '../../cookies/CookieJar.js';
import { RequestAuthorizationProcessor } from './RequestAuthorizationProcessor.js';
import { RequestCookiesProcessor } from './RequestCookiesProcessor.js';
import { HttpFlowRunner } from './HttpFlowRunner.js';
import { ISentRequest } from "../../models/SentRequest.js";
import { IResponse } from "../../models/Response.js";
import { IErrorResponse } from "../../models/ErrorResponse.js";

/**
 * A class that takes a single HttpRequest definition and executes it.
 * 
 * This class does the following (in order):
 * 
 * - applies variables
 * - applies authorization configuration
 * - applies cookies
 * - runs request actions 
 * - transports the request
 * - processes response and redirect cookies
 * - runs response actions
 * - reports the request log
 */
export class HttpRequestRunner {
  /**
   * Request processing configuration.
   */
  config?: IRequestConfig;

  /**
   * Request authorization configuration
   */
  authorization?: IRequestAuthorization[];

  /**
   * Actions to be performed when the request is executed.
   */
  flows?: IHttpActionFlow[];

  /**
   * The cumulative list of all variables to be applied to the request and other properties.
   * The variables must be already processed for variables in values (evaluated).
   * 
   * These variables are passed by reference. Changes made anywhere to the variables will result 
   * with updating this list.
   */
  variables?: Record<string, string>;

  /**
   * The variables processor instance.
   */
  variablesProcessor = new VariablesProcessor();

  logger?: Logger;

  /**
   * The abort signal to set on this request.
   * Aborts the request when the signal fires.
   * @type {(AbortSignal | undefined)}
   */
  signal?: AbortSignal;

  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies?: CookieJar;

  /**
   * Creates an instance from the IRequest object with setting the corresponding variables.
   * @param request The request object to use.
   */
  static fromRequest(request: IRequest): HttpRequestRunner {
    const instance = new HttpRequestRunner();
    instance.flows = request.flows;
    instance.authorization = request.authorization;
    instance.config = request.config;
    return instance;
  }

  /**
   * Runs the request and all tasks around the HTTp request execution like gathering 
   * environment information, running actions, and HTTP modules.
   * 
   * @param request The request object to execute.
   * @returns The execution log.
   */
  async run(request: IHttpRequest): Promise<IRequestLog> {
    const requestCopy = await this.processRequest(request);
    const result = await this.executeRequest(requestCopy);
    await this.processResponse(result);
    return result;
  }

  /**
   * @returns the configuration processed by the variables processor.
   */
  async readConfig(): Promise<IRequestConfig | undefined> {
    const { config, variables, variablesProcessor } = this;
    if (!config) {
      return undefined;
    }
    if (!variables) {
      return config;
    }
    return variablesProcessor.evaluateVariablesWithContext(config, variables);
  }

  /**
   * @returns the authorization data processed by the variables processor.
   */
  async readAuthorization(): Promise<IRequestAuthorization[] | undefined> {
    const { variables, authorization, variablesProcessor } = this;
    if (!Array.isArray(authorization) || !authorization.length) {
      return undefined;
    }
    if (!variables) {
      return authorization;
    }
    
    const ps = authorization.filter(i => i.enabled !== false).map(async (item) => {
      const copy = await variablesProcessor.evaluateVariablesWithContext(item, variables);
      if (copy.config) {
        copy.config = await variablesProcessor.evaluateVariablesWithContext(copy.config, variables);
      }
      return copy;
    });
    const result = await Promise.all(ps);
    return result;
  }

  /**
   * Prepares the request object before making the HTTP request
   * and runs actions and modules.
   * 
   * @param request The request to execute.
   * @returns the copy of the request object.
   */
  async processRequest(request: IHttpRequest): Promise<IHttpRequest> {
    let copy = await this.applyVariables(request);
    copy = await this.applyAuthorization(copy);
    copy = await this.applyCookies(copy);
    await this.runRequestFlows(copy);
    return copy;
  }

  /**
   * Runs the request through the variables processor.
   * @returns A copy of the passed request with possibly changed values.
   */
  async applyVariables(request: IHttpRequest): Promise<IHttpRequest> {
    const { variables, variablesProcessor } = this;
    let copy: IHttpRequest = { ...request };
    if (variables) {
      copy = await variablesProcessor.evaluateVariablesWithContext(copy, variables);
    }
    return copy;
  }

  protected async applyAuthorization(request: IHttpRequest): Promise<IHttpRequest> {
    const auth = await this.readAuthorization();
    RequestAuthorizationProcessor.setAuthorization(request, auth);
    return request;
  }

  protected async applyCookies(request: IHttpRequest): Promise<IHttpRequest> {
    const { cookies, config } = this;
    if (!cookies) {
      return request;
    }
    if (config && config.ignoreSessionCookies) {
      return request;
    }
    const list = await cookies.listCookies(request.url);
    RequestCookiesProcessor.request(request, list);
    return request;
  }

  /**
   * Executes the request actions and modules.
   */
  async runRequestFlows(request: IHttpRequest): Promise<void> {
    const actions = await this.readActions('request');
    const runner = new HttpFlowRunner();
    runner.cookies = this.cookies;
    runner.variables = this.variables;
    await runner.request(request, actions);
  }

  /**
   * Executes the request actions and modules.
   */
  async runResponseFlows(request: ISentRequest, response: IResponse | IErrorResponse): Promise<void> {
    const actions = await this.readActions('response');
    const runner = new HttpFlowRunner();
    runner.cookies = this.cookies;
    runner.variables = this.variables;
    await runner.response(request, response, actions);
  }

  /**
   * Reads and evaluates action flows.
   * 
   * @param trigger The trigger name to read the flows for.
   */
  protected async readActions(trigger: 'request' | 'response'): Promise<IHttpActionFlow[]> {
    const result: IHttpActionFlow[] = [];
    const { flows, variables, variablesProcessor } = this;
    if (!variables || !Array.isArray(flows) || !flows.length) {
      return result;
    }
    for (const flow of flows) {
      if (flow.trigger !== trigger) {
        continue;
      }
      if (!Array.isArray(flow.actions) || !flow.actions.length) {
        continue;
      }
      const copy = { ...flow } as IHttpActionFlow;
      const actions = copy.actions.map(async (action) => {
        const actionCopy = { ...action };
        if (actionCopy.condition) {
          actionCopy.condition = await variablesProcessor.evaluateVariablesWithContext(actionCopy.condition, variables);
        }
        if (Array.isArray(actionCopy.steps) && actionCopy.steps.length) {
          const stepsPromises = actionCopy.steps.map((step) => variablesProcessor.evaluateVariablesWithContext(step, variables));
          actionCopy.steps = await Promise.all(stepsPromises);
        }
        return actionCopy;
      });
      copy.actions = await Promise.all(actions);
      result.push(copy);
    }
    return result;
  }

  /**
   * Prepares the HTTP engine configuration and executes the request,
   * @param request The request to execute.
   * @returns The execution log.
   */
  async executeRequest(request: IHttpRequest): Promise<IRequestLog> {
    const opts = await this.prepareEngineConfig();
    const engine = new CoreEngine(request, opts);
    return engine.send();
  }

  /**
   * Creates a configuration options for the HTTP engine.
   */
  async prepareEngineConfig(): Promise<HttpEngineOptions> {
    const { logger, signal } = this;
    const auth = await this.readAuthorization();
    const config = await this.readConfig();
    const cert = RequestAuthorizationProcessor.readCertificate(auth);
    const opts: HttpEngineOptions = {};
    if (cert) {
      opts.certificates = [cert];
    }
    if (Array.isArray(auth)) {
      opts.authorization = auth;
    }
    if (logger) {
      opts.logger = logger;
    }
    if (signal) {
      opts.signal = signal;
    }
    if (!config || config.enabled === false) {
      return opts;
    }
    if (typeof config.timeout === 'number') {
      opts.timeout = config.timeout;
    }
    if (typeof config.sentMessageLimit === 'number') {
      opts.sentMessageLimit = config.sentMessageLimit;
    }
    if (typeof config.followRedirects === 'boolean') {
      opts.followRedirects = config.followRedirects;
    }
    if (typeof config.defaultHeaders === 'boolean') {
      opts.defaultHeaders = config.defaultHeaders;
    }
    if (typeof config.validateCertificates === 'boolean') {
      opts.validateCertificates = config.validateCertificates;
    }
    if (config.defaultUserAgent) {
      opts.defaultUserAgent = config.defaultUserAgent;
    }
    if (config.defaultAccept) {
      opts.defaultAccept = config.defaultAccept;
    }
    if (config.proxy) {
      opts.proxy = config.proxy;
    }
    if (config.proxyUsername) {
      opts.proxyUsername = config.proxyUsername;
    }
    if (config.proxyPassword) {
      opts.proxyPassword = config.proxyPassword;
    }
    if (Array.isArray(config.hosts) ) {
      opts.hosts = config.hosts;
    }
    return opts;
  }

  async processResponse(log: IRequestLog): Promise<void> {
    const { request, response } = log;
    if (!request || !response) {
      return;
    }

    const cookies = RequestCookiesProcessor.response(log);
    if (cookies && this.cookies) {
      const ps = Object.keys(cookies).map((url) => {
        const items = cookies[url];
        this.cookies?.setCookies(url, items);
      });
      await Promise.allSettled(ps);
    }

    await this.runResponseFlows(request, response);
  }
}
