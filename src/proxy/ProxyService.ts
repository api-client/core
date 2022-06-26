import { IProjectExecutionLog } from "../runtime/reporters/Reporter.js";
import { IRequestLog } from "../models/RequestLog.js";
import AppProjectProxy, { IAppProjectProxyInit } from "./AppProjectProxy.js";
import HttpProjectProxy, { IHttpProjectProxyInit } from "./HttpProjectProxy.js";
import { IProxyResult } from "./Proxy.js";
import RequestProxy, { IRequestProxyInit } from "./RequestProxy.js";

export default class ProxyService {
  /**
   * Executes a single HTTP request.
   * 
   * @param init The request to execute with additional configuration.
   * @returns The execution log for the request.
   */
  async proxyRequest(init: IRequestProxyInit): Promise<IProxyResult<IRequestLog>> {
    const proxy = new RequestProxy();
    await proxy.configure(init);
    return proxy.execute();
  }

  /**
   * Executes an HttpProject.
   * 
   * @param token The user access token to read data from the store.
   * @param storeUri The store's base URI.
   * @param init The project run configuration.
   * @returns The key under which the proxy is cached.
   */
  async proxyHttpProject(token: string, storeUri: string, init: IHttpProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>> {
    const proxy = new HttpProjectProxy();
    await proxy.configure(init, token, storeUri);
    return proxy.execute();
  }

  /**
   * Executes an AppProject.
   * 
   * @param token The user access token to read data from the store.
   * @param storeUri The store's base URI.
   * @param init The project run configuration.
   * @returns The key under which the proxy is cached.
   */
  async proxyAppProject(token: string, storeUri: string, init: IAppProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>> {
    const proxy = new AppProjectProxy();
    await proxy.configure(init, token, storeUri);
    return proxy.execute() as Promise<IProxyResult<IProjectExecutionLog>>;
  }
}
