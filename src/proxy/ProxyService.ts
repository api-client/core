import { ApiError } from "../runtime/store/Errors.js";
import v4 from "../lib/uuid.js";
import AppProjectProxy, { IAppProjectProxyInit } from "./AppProjectProxy.js";
import HttpProjectProxy, { IHttpProjectProxyInit } from "./HttpProjectProxy.js";
import { IProxyResult } from "./Proxy.js";
import RequestProxy, { IRequestProxyInit } from "./RequestProxy.js";

type Proxy = RequestProxy | HttpProjectProxy | AppProjectProxy;

export default class ProxyService {
  state = new Map<string, Proxy>();

  /**
   * Executes a single HTTP request.
   * @param init The request to execute with additional configuration.
   * @returns The key under which the proxy is cached.
   */
  async addRequestProxy(init: IRequestProxyInit): Promise<string> {
    const proxy = new RequestProxy();
    await proxy.configure(init);
    const id = v4();
    this.state.set(id, proxy);
    return id;
  }

  /**
   * Executes an HttpProject.
   * 
   * @param token The user access token to read data from the store.
   * @param storeUri The store's base URI.
   * @param init The project run configuration.
   * @returns The key under which the proxy is cached.
   */
  async addHttpProjectProxy(token: string, storeUri: string, init: IHttpProjectProxyInit): Promise<string> {
    const proxy = new HttpProjectProxy();
    await proxy.configure(init, token, storeUri);
    const id = v4();
    this.state.set(id, proxy);
    return id;
  }

  /**
   * Executes an AppProject.
   * 
   * @param token The user access token to read data from the store.
   * @param storeUri The store's base URI.
   * @param init The project run configuration.
   * @returns The key under which the proxy is cached.
   */
  async addAppProjectProxy(token: string, storeUri: string, init: IAppProjectProxyInit): Promise<string> {
    const proxy = new AppProjectProxy();
    await proxy.configure(init, token, storeUri);
    const id = v4();
    this.state.set(id, proxy);
    return id;
  }

  /**
   * Executes previously configured proxy.
   * 
   * @param key The key returned by the add proxy function.
   * @param body Optional body to send with the `HttpRequest` proxy.
   * @returns The execution log depending on the proxy type.
   */
  async proxy(key: string, body?: Buffer): Promise<IProxyResult> {
    const proxy = this.state.get(key);
    if (!proxy) {
      throw new ApiError(`Unknown key: ${key}. The request may have been already executed.`, 400);
    }
    this.state.delete(key);
    return proxy.execute(body);
  }
}
