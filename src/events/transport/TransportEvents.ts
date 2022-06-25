/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IRequestAuthorization } from "../../models/RequestAuthorization.js";
import { IHttpRequest } from "../../models/HttpRequest.js";
import { IRequestBaseConfig } from "../../models/RequestConfig.js";
import { IRequestLog } from '../../models/RequestLog.js';
import { HttpProject } from "../../models/HttpProject.js";
import { AppProject } from "../../models/AppProject.js";
import { ContextEvent } from "../BaseEvents.js";
import { TransportEventTypes } from "./TransportEventTypes.js";
import { IProjectRunnerOptions } from "../../runtime/node/InteropInterfaces.js";
import { IProjectExecutionLog } from "../../runtime/reporters/Reporter.js";

export interface ICoreRequestDetail {
  request: IHttpRequest; 
  authorization?: IRequestAuthorization[]; 
  config?: IRequestBaseConfig;
}

export interface IHttpRequestDetail {
  request: IHttpRequest; 
  init?: RequestInit;
}

export interface IHttpRequestResult {
  log: IRequestLog;
  /**
   * The variables evaluated during the run. 
   * These variables have values set by request HTTP flows.
   */
  variables: Record<string, string>;
}

export interface IHttpProjectRequestDetail {
  project: HttpProject | string; 
  opts: IProjectRunnerOptions;
}

export interface IAppProjectRequestDetail {
  project: AppProject | string; 
  opts: IProjectRunnerOptions;
}

/* eslint-disable no-unused-vars */
export const TransportEvent = Object.freeze({
  /** 
   * Transport via the CoreEngine.
   */
  Core: Object.freeze({
    /**
     * Sends a single request without a context of a project.
     * 
     * @param target The events target.
     * @param request The request definition
     * @param authorization When known, a list of authorization configuration to apply to the request.
     * @param config Optional request configuration.
     * @returns The execution log with the variables evaluated during the run or `undefined` when the event was not handled.
     */
    request: async (request: IHttpRequest, authorization?: IRequestAuthorization[], config?: IRequestBaseConfig, target: EventTarget = window): Promise<IHttpRequestResult | undefined> => {
      const e = new ContextEvent<ICoreRequestDetail, IHttpRequestResult>(TransportEventTypes.Core.request, {
        request,
        authorization,
        config
      });
      target.dispatchEvent(e);
      return e.detail.result;
    },

    /**
     * For both the project or a folder (since it's all single configuration.)
     * 
     * @param target The events target
     * @param project The instance of a project or an id of the project to execute. The current user has to be already authenticated.
     * @param opts The project execution options.
     */
    httpProject: async (project: HttpProject | string, opts: IProjectRunnerOptions, target: EventTarget = window): Promise<IProjectExecutionLog | undefined> => {
      const e = new ContextEvent<IHttpProjectRequestDetail, IProjectExecutionLog>(TransportEventTypes.Core.httpProject, {
        project,
        opts,
      });
      target.dispatchEvent(e);
      return e.detail.result;
    },

    /**
     * For both the project or a folder (since it's all single configuration.)
     * 
     * @param target The events target
     * @param project The instance of a project or an id of the project to execute. The current user has to be already authenticated.
     * @param opts The project execution options.
     */
    appProject: async (project: AppProject | string, opts: IProjectRunnerOptions, target: EventTarget = window): Promise<IProjectExecutionLog | undefined> => {
      const e = new ContextEvent<IAppProjectRequestDetail, IProjectExecutionLog>(TransportEventTypes.Core.appProject, {
        project,
        opts,
      });
      target.dispatchEvent(e);
      return e.detail.result;
    },
  }),
  /** 
   * Transport via the native platform's bindings.
   */
  Http: Object.freeze({
    /**
     * Sends the request outside the Core engine, most probably using Fetch API.
     * Note, CORS may apply to the request.
     * 
     * @param target The events target
     * @param request The base request definition.
     * @param init Optional request init options compatible with the Fetch API.
     * @returns Compatible with the Fetch API Response object or `undefined` when the event was not handled.
     */
    send: async (request: IHttpRequest, init?: RequestInit, target: EventTarget = window): Promise<Response | undefined> => {
      const e = new ContextEvent<IHttpRequestDetail, Response>(TransportEventTypes.Http.send, {
        request,
        init,
      });
      target.dispatchEvent(e);
      return e.detail.result;
    },
  }),

  // web sockets.
  Ws: Object.freeze({
    /** 
     * Informs to make a connection. Used by web sockets.
     */
    connect: async (target: EventTarget): Promise<any> => {
      throw new Error(`Not yet implemented`);
    },
    /** 
     * Informs to close the current connection. Used by web sockets.
     */
    disconnect: async (target: EventTarget): Promise<any> => {
      throw new Error(`Not yet implemented`);
    },
    /** 
     * Informs to send a data on the current connection. Used by web sockets.
     */
    send: async (target: EventTarget): Promise<any> => {
      throw new Error(`Not yet implemented`);
    },
  }),
});
