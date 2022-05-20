import { IRequestAuthorization } from "../../models/RequestAuthorization.js";
import { IHttpRequest } from "../../models/HttpRequest.js";
import { IRequestBaseConfig } from "../../models/RequestConfig.js";
import { IRequestLog } from '../../models/RequestLog.js';
import { HttpProject } from "../../models/HttpProject.js";
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

export interface IProjectRequestDetail {
  project: HttpProject | string; 
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
     * @returns The execution log or `undefined` when the event was not handled.
     */
    send: async (request: IHttpRequest, authorization?: IRequestAuthorization[], config?: IRequestBaseConfig, target: EventTarget = window): Promise<IRequestLog | undefined> => {
      const e = new ContextEvent<ICoreRequestDetail, IRequestLog>(TransportEventTypes.Core.send, {
        request,
        authorization,
        config
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

  // project runner
  Project: Object.freeze({
    /**
     * For both a request or a folder (since it's all single configuration.)
     * 
     * @param target The events target
     * @param project The instance of a project or an id of the project to execute. The current user has to be already authenticated.
     * @param opts The project execution options.
     * @returns 
     */
    send: async (project: HttpProject | string, opts: IProjectRunnerOptions, target: EventTarget = window): Promise<IProjectExecutionLog | undefined> => {
      const e = new ContextEvent<IProjectRequestDetail, IProjectExecutionLog>(TransportEventTypes.Project.send, {
        project,
        opts,
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
