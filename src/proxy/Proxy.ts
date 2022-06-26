import { IRequestLog } from "../models/RequestLog.js";
import { IProjectExecutionLog } from "../runtime/reporters/Reporter.js";

export interface IProxyResult<T = IProjectExecutionLog | IRequestLog> {
  /**
   * The result of the proxy execution. It can be project execution log or a request log.
   */
  result: T;
  /**
   * Optional variables updated during the execution.
   */
  variables?: Record<string, string>;
}

export default abstract class Proxy {
  /**
   * The time when this class was initialized.
   */
  time = Date.now();

  /**
   * Configures the proxy before running it.
   */
  abstract configure(...args: unknown[]): Promise<unknown>;

  /**
   * Executes the proxy.
   */
  abstract execute(body?: Buffer): Promise<IProxyResult>;
}
