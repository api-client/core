/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IHttpRequest } from "../../models/HttpRequest.js";
import { IRequestLog } from '../../models/RequestLog.js';
import { ContextEvent } from "../BaseEvents.js";
import { TransportEventTypes } from "./TransportEventTypes.js";
import { IProjectExecutionLog } from "../../runtime/reporters/Reporter.js";
import { IRequestProxyInit } from "../../proxy/RequestProxy.js";
import { IHttpProjectProxyInit } from "../../proxy/HttpProjectProxy.js";
import { IAppProjectProxyInit } from "../../proxy/AppProjectProxy.js";
import { IProxyResult } from "../../proxy/Proxy.js";

export interface IHttpRequestDetail {
  request: IHttpRequest; 
  init?: RequestInit;
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
     * @param init The request execution configuration
     * @returns The execution log with the variables evaluated during the run or `undefined` when the event was not handled.
     */
    request: async (init: IRequestProxyInit, target: EventTarget = window): Promise<IProxyResult<IRequestLog> | undefined> => {
      const e = new ContextEvent<IRequestProxyInit, IProxyResult<IRequestLog>>(TransportEventTypes.Core.request, init);
      target.dispatchEvent(e);
      return e.detail.result;
    },

    /**
     * For both the project or a folder (since it's all single configuration.)
     * 
     * @param target The events target
     * @param init The project execution configuration
     */
    httpProject: async (init: IHttpProjectProxyInit, target: EventTarget = window): Promise<IProxyResult<IProjectExecutionLog> | undefined> => {
      const e = new ContextEvent<IHttpProjectProxyInit, IProxyResult<IProjectExecutionLog>>(TransportEventTypes.Core.httpProject, init);
      target.dispatchEvent(e);
      return e.detail.result;
    },

    /**
     * For both the project or a folder (since it's all single configuration.)
     * 
     * @param target The events target
     * @param init The project execution configuration
     */
    appProject: async (init: IAppProjectProxyInit, target: EventTarget = window): Promise<IProxyResult<IProjectExecutionLog> | undefined> => {
      const e = new ContextEvent<IAppProjectProxyInit, IProxyResult<IProjectExecutionLog>>(TransportEventTypes.Core.appProject, init);
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
