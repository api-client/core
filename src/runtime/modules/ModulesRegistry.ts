import { IHttpRequest } from '../../models/HttpRequest.js';
import { EnvironmentEvents } from '../../events/environment/EnvironmentEvents.js';
import { CookieEvents } from '../../events/cookies/CookieEvents.js';
import { EncryptionEvents } from '../../events/encryption/EncryptionEvents.js';
import { ProcessEvents } from '../../events/process/ProcessEvents.js';
import { AuthorizationEvents } from '../../events/authorization/AuthorizationEvents.js';
import { ClientCertificateEvents } from '../../events/models/ClientCertificateEvents.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';
import { IRequestConfig } from '../../models/RequestConfig.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { IRequestCertificate } from '../../models/ClientCertificate.js';

export interface RegisteredRequestModule {
  fn: (request: IHttpRequest, context: ExecutionContext) => Promise<number>;
  permissions: RegistryPermission[];
}

export interface RegisteredResponseModule {
  fn: (log: IRequestLog, context: ExecutionContext) => Promise<number>;
  permissions: RegistryPermission[];
}

export enum RegistryPermission {
  environment = 'environment',
  events = 'events',
}

export interface ExecutionContext {
  /**
   * The event target for events
   */
  eventsTarget: EventTarget;
  /**
   * The events to use to communicate with the context store(s)
   */
  Events?: ExecutionEvents;
  /**
   * The environment variables to use when executing the module.
   */
  variables?: Record<string, string>;
  /**
   * Request authorization configuration
   */
  authorization?: IRequestAuthorization[];
  /**
   * Optional request configuration.
   */
  config?: IRequestConfig;
  /**
   * Can be altered by the actions.
   */
  certificates?: IRequestCertificate[];
}

export interface ExecutionEvents {
  Authorization: typeof AuthorizationEvents;
  Environment: typeof EnvironmentEvents;
  Cookie: typeof CookieEvents;
  Encryption: typeof EncryptionEvents;
  Process: typeof ProcessEvents;
  ClientCertificate: typeof ClientCertificateEvents;
}

/**
 * The list of registered request processing modules.
 */
const requestModules = new Map<string, RegisteredRequestModule>();

/**
 * The list of registered response processing modules.
 */
const responseModules = new Map<string, RegisteredResponseModule>();

export type RequestModule = 'request';
export type ResponseModule = 'response';

/**
 * A registry for modules.
 */
export class ModulesRegistry {
  static get request(): RequestModule { return 'request' }

  static get response(): ResponseModule { return 'response' }

  /**
   * Registers a new request or response module in the registry.
   * @param context The name of the execution context
   * @param id The identifier of the module
   * @param fn The function to execute
   * @param permissions The list of permissions for the module
   * @throws {Error} When the module is already registered
   */
  static register(context: ResponseModule|RequestModule, id: string, fn: Function, permissions?: string[]): void {
    const data = {
      fn,
      permissions: Array.isArray(permissions) ? permissions : [],
    };
    const map = context === ModulesRegistry.request ? requestModules : responseModules;
    if (map.has(id)) {
      throw new Error(`Module ${id} already exists`);
    }
    // @ts-ignore
    map.set(id, data);
  }

  /**
   * Checks whether a module is already registered for the given context.
   * @param {ModulesRegistry.request|ModulesRegistry.response} context The name of the execution context
   * @param id The identifier of the module
   */
  static has(context: ResponseModule|RequestModule, id: string): boolean {
    const map = context === ModulesRegistry.request ? requestModules : responseModules;
    return map.has(id);
  }

  /**
   * Removes a registered module
   * @param {ModulesRegistry.request|ModulesRegistry.response} context The name of the execution context
   * @param {string} id The identifier of the module
   */
  static unregister(context: ResponseModule|RequestModule, id: string): void {
    const map = context === ModulesRegistry.request ? requestModules : responseModules;
    map.delete(id);
  }

  /**
   * Reads the list of registered modules
   * @param  context The name of the execution context
   * @returns The copy of the map of actions.
   */
  static get(context: ResponseModule|RequestModule): Map<string, RegisteredRequestModule|RegisteredResponseModule> {
    const map = context === ModulesRegistry.request ? requestModules : responseModules;
    // @ts-ignore
    return new Map(map);
  }
}
