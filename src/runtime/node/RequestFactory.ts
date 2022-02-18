import { IRequest } from '../../models/Request.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { IRequestConfig, IRequestBaseConfig } from '../../models/RequestConfig.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';
import { IRequestActions } from '../../models/RequestActions.js';
import { IRequestCertificate } from '../../models/ClientCertificate.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { VariablesProcessor } from '../variables/VariablesProcessor.js';
import { IRunnableAction } from '../../models/actions/RunnableAction.js';
import { Action } from '../../models/actions/Action.js';
import { RunnableCondition } from '../actions/RunnableCondition.js';
import { ActionRunner } from '../actions/ActionRunner.js';
import { HttpEngineOptions } from '../http-engine/HttpEngine.js';
import { ArcEngine } from '../http-engine/ArcEngine.js';
import { ModulesRegistry, RegisteredRequestModule, RegisteredResponseModule, ExecutionContext, RegistryPermission } from '../modules/ModulesRegistry.js';
import { ExecutionResponse } from '../modules/ExecutionResponse.js';
import { Events } from '../../events/Events.js';
import { Logger } from '../../lib/logging/Logger.js';

/**
 * The main class to make HTTP requests in the API Client / ARC.
 * This factory includes all logic components to perform the entire HTTP request lifecycle. This includes:
 * 
 * - variables evaluation on the request object
 * - running request actions
 * - running request modules
 * - choosing the execution engine
 * - performing the request
 * - running response actions
 * - running response modules
 * - reporting the response
 * 
 * This class may not be used when not necessary but the logic should take care of the items listed above.
 * 
 * This class splits the `IRequest` object into it's components and use them when defined.
 * This way it is possible to use the factory only with the `IHttpRequest` interface.
 */
export class RequestFactory {
  /**
   * The main events bus.
   * This target is used to dispatch the events on.
   * The runtime should handle the events and proxy them to the corresponding context store.
   */
  eventTarget: EventTarget;
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
  actions?: IRequestActions;
  /**
   * The list of certificates to use with the request.
   */
  certificates?: IRequestCertificate[];
  /**
   * The cumulative list of all variables to be applied to the request and other properties.
   * The variables must be already processed fir variables in values (evaluated).
   */
  variables?: Record<string, string>;
  /**
   * The variables processor instance.
   */
  variablesProcessor = new VariablesProcessor();

  logger?: Logger;

  /**
   * Creates an instance from the IRequest object with setting the corresponding variables.
   * @param eventTarget The main events bus.
   * This target is used to dispatch the events on.
   * The runtime should handle the events and proxy them to the corresponding context store.
   * @param request The request object to use.
   */
  static fromRequest(eventTarget: EventTarget, request: IRequest): RequestFactory {
    const instance = new RequestFactory(eventTarget);
    instance.actions = request.actions;
    instance.authorization = request.authorization;
    if (request.clientCertificate) {
      instance.certificates = [request.clientCertificate];
    }
    instance.config = request.config;
    return instance;
  }

  /**
   * @param eventTarget The main events bus.
   * This target is used to dispatch the events on.
   * The runtime should handle the events and proxy them to the corresponding context store.
   */
  constructor(eventTarget: EventTarget) {
    this.eventTarget = eventTarget;
  }

  /**
   * Runs the request and all tasks around the HTTp request execution like gathering 
   * environment information, running actions, and HTTP modules.
   * 
   * @param request The request object to execute.
   * @returns The execution log.
   */
  async run(request: IHttpRequest): Promise<IRequestLog> {
    await this.prepareEnvironment();
    const requestCopy = await this.processRequest(request);
    const result = await this.executeRequest(requestCopy);
    await this.processResponse(result);
    return result;
  }

  async prepareEnvironment(): Promise<void> {
    const { variables } = this;
    if (!variables) {
      return;
    }
    this.variables = await this.variablesProcessor.buildContext(variables);
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
   * @returns the actions for the passed type processed by the variables processor.
   */
  async readActions(type: keyof IRequestActions): Promise<IRunnableAction[] | undefined> {
    const { variables, actions, variablesProcessor } = this;
    if (!actions) {
      return undefined;
    }
    const list = actions[type];
    if (!Array.isArray(list) || !list.length) {
      return undefined;
    }
    if (!variables) {
      return list;
    }
    const ps = list.filter(i => i.enabled !== false).map(async (item) => {
      const copy = await variablesProcessor.evaluateVariablesWithContext(item, variables);
      if (copy.condition) {
        copy.condition = await variablesProcessor.evaluateVariablesWithContext(copy.condition, variables);
      }
      if (Array.isArray(copy.actions) && copy.actions.length) {
        const actionsPs = copy.actions.map(async (action) => {
          const actionCopy =  await variablesProcessor.evaluateVariablesWithContext(action, variables);
          if (actionCopy.config) {
            actionCopy.config = await variablesProcessor.evaluateVariablesWithContext(actionCopy.config, variables);
          }
          return actionCopy;
        });
        copy.actions = await Promise.all(actionsPs);
      }
      return copy;
    });
    const result: IRunnableAction[] = await Promise.all(ps);
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
    const copy = await this.processRequestVariables(request);
    await this.processRequestLogic(copy);
    return copy;
  }

  /**
   * Runs the request through the variables processor.
   * @returns A copy of the passed request with possibly changed values.
   */
  async processRequestVariables(request: IHttpRequest): Promise<IHttpRequest> {
    const { variables, variablesProcessor } = this;
    let copy: IHttpRequest = { ...request };
    if (variables) {
      copy = await variablesProcessor.evaluateVariablesWithContext(copy, variables);
    }
    return copy;
  }

  /**
   * Executes the request actions and modules.
   */
  async processRequestLogic(request: IHttpRequest): Promise<void> {
    const actions = await this.readActions('request');
    if (Array.isArray(actions) && actions.length) {
      await this.processRequestActions(request, actions);
    }
    await this.processRequestModules(request);
  }

  /**
   * Runs each action one by one.
   * @param request The request object associated with actions
   * @param actions The list of actions to execute.
   */
  async processRequestActions(request: IHttpRequest, actions: IRunnableAction[]): Promise<void> {
    const runnables = actions.filter((item) => item.enabled !== false && !!item.actions && !!item.actions.length);
    if (!runnables.length) {
      return;
    }
    for (let i = 0, len = runnables.length; i < len; i++) {
      const runnable = new RunnableCondition(runnables[i]);
      const passed = await runnable.satisfied(request);
      if (!passed) {
        continue;
      }
      const execs = runnable.actions.filter(i => i.enabled !== false);
      execs.sort(Action.sortActions);
      for (let j = 0, eLen = execs.length; j < eLen; j++) {
        const action = execs[j];
        const runner = new ActionRunner(action, this.eventTarget);
        try {
          await runner.request(request);
        } catch (e) {
          if (action.failOnError) {
            throw e;
          } else {
            const err = e as Error;
            console.error(`Unable to run a request action: ${action.name || 'unknown name'}: ${err.message}`);
          }
        }
      }
    }
  }

  async processRequestModules(request: IHttpRequest): Promise<void> {
    const modules = ModulesRegistry.get(ModulesRegistry.request);
    for (const [id, main] of modules) {
      const mod = main as RegisteredRequestModule;
      const context = await this.buildExecutionContext(mod.permissions);

      let result: number|undefined;
      try {
        result = await mod.fn(request, context);
      } catch (e) {
        // eslint-disable-next-line no-console
        const err = e as Error;
        console.warn(e);
        const message = `Request module ${id} reported error: ${err.message}`;
        throw new Error(message);
      }
      if (result === ExecutionResponse.ABORT) {
        return;
      }
      if (Array.isArray(context.certificates)) {
        if (!Array.isArray(this.certificates)) {
          this.certificates = [];
        }
        this.certificates.concat(context.certificates);
      }
    }
  }

  /**
   * Prepares the HTTP engine configuration and executes the request,
   * @param request The request to execute.
   * @returns The execution log.
   */
  async executeRequest(request: IHttpRequest): Promise<IRequestLog> {
    const opts = await this.prepareEngineConfig();
    const engine = new ArcEngine(request, opts);
    return engine.send();
  }

  /**
   * Creates a configuration options for the HTTP engine.
   */
  async prepareEngineConfig(): Promise<HttpEngineOptions> {
    const { certificates, logger } = this;
    const auth = await this.readAuthorization();
    const config = await this.readConfig();
    const opts: HttpEngineOptions = {};
    if (Array.isArray(certificates) && certificates.length) {
      opts.certificates = certificates;
    }
    if (Array.isArray(auth)) {
      opts.authorization = auth;
    }
    if (logger) {
      opts.logger = logger;
    }
    if (!config || config.enabled === false) {
      return opts;
    }
    const exclude = ['kind', 'enabled', 'ignoreSessionCookies', 'variables'];
    (Object.keys(config) as (keyof IRequestBaseConfig)[]).forEach(key => {
      if (exclude.includes(key)) {
        return;
      }
      const value: any = config[key];
      opts[key] = value;
    });
    return opts;
  }

  async processResponse(log: IRequestLog): Promise<void> {
    const { request, response } = log;
    if (!request || !response) {
      return;
    }
    await this.processResponseActions(log);
    await this.processResponseModules(log);
  }

  async processResponseActions(log: IRequestLog): Promise<void> {
    const actions = await this.readActions('response');
    if (!Array.isArray(actions) || !actions.length) {
      return;
    }
    if (!log.request || !log.response) {
      return;
    }
    const runnables = actions.filter((item) => item.enabled !== false && !!item.actions && !!item.actions.length);
    if (!runnables.length) {
      return;
    }
    for (let i = 0, len = runnables.length; i < len; i++) {
      const runnable = new RunnableCondition(runnables[i]);
      const passed = await runnable.satisfied(log.request, log.response);
      if (!passed) {
        continue;
      }
      const execs = runnable.actions.filter(i => i.enabled !== false);
      execs.sort(Action.sortActions);
      for (let j = 0, eLen = execs.length; j < eLen; j++) {
        const action = execs[j];
        const runner = new ActionRunner(action, this.eventTarget);
        try {
          await runner.response(log);
        } catch (e) {
          if (action.failOnError) {
            throw e;
          } else {
            const err = e as Error;
            console.error(`Unable to run a request action: ${action.name || 'unknown name'}: ${err.message}`);
          }
        }
      }
    }
  }

  async processResponseModules(log: IRequestLog): Promise<void> {
    const modules = ModulesRegistry.get(ModulesRegistry.response);
    for (const [id, main] of modules) {
      const mod = main as RegisteredResponseModule;
      const context = await this.buildExecutionContext(mod.permissions);

      let result: number|undefined;
      try {
        result = await mod.fn(log, context);
      } catch (e) {
        // eslint-disable-next-line no-console
        const err = e as Error;
        console.warn(e);
        const message = `Response module ${id} reported error: ${err.message}`;
        throw new Error(message);
      }
      if (result === ExecutionResponse.ABORT) {
        return;
      }
    }
  }

  async buildExecutionContext(permissions: RegistryPermission[]): Promise<ExecutionContext> {
    const result: ExecutionContext = {
      eventsTarget: this.eventTarget,
    };
    const hasEnvironment = permissions.includes(RegistryPermission.environment);
    if (hasEnvironment) {
      result.variables = this.variables;
    }
    if (permissions.includes(RegistryPermission.events)) {
      result.Events = {
        Authorization: Events.Authorization,
        ClientCertificate: Events.Model.ClientCertificate,
        Cookie: Events.Cookie,
        Encryption: Events.Encryption,
        Process: Events.Process,
        Environment: Events.Environment,
      };
    }
    result.authorization = this.authorization;
    result.config = await this.readConfig();
    return result;
  }
}
