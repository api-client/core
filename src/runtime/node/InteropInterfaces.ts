/* eslint-disable @typescript-eslint/no-empty-interface */
import { IProjectRequestIterator, IHttpProject } from '../../models/HttpProject.js';
import { Environment } from '../../models/Environment.js';
import { Logger } from '../../lib/logging/Logger.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { CookieJar } from '../../cookies/CookieJar.js';

export interface IRequestRunnerOptions {
  /**
   * When provided it overrides any project / folder defined environment.
   */
  environment?: Environment;
  /**
   * Additional variables to pass to the selected environment.
   * This can be use to pass system variables, when needed.
   * 
   * To use system variables tou can use `init.variables = process.env`;
   */
  variables?: Record<string, string>;
  /**
   * Overrides the default logger (console).
   */
  logger?: Logger;
  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies?: CookieJar;
}

export interface IRequestRunnerRunOptions extends IProjectRequestIterator {
}

export interface IProjectExecutionResult {
  /**
   * The variables evaluated during the run. 
   * These variables have values set by requests' HTTP flows.
   */
  variables: Record<string, string>;
  /**
   * The executed items.
   */
  items: IRunResult[];
}

export interface IRunResult {
  /**
   * The key of the request from the HttpProject that was executed.
   */
  key: string;
  /**
   * The key of parent folder of the executed request.
   */
  parent?: string;
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

export interface IProjectParallelRunnerOptions extends IProjectRunnerOptions {
}

export interface IProjectParallelWorkerOptions extends IProjectRunnerOptions {
  project: IHttpProject;
}

export interface IProjectRunnerOptions {
  /**
   * The environment to use.
   * This can be a name or the key of the environment located under the parent or root.
   * It can also be a path to the environment definition. If the file exists it is used. Otherwise it tried to 
   * find the environment in the project.
   */
  environment?: string;
  /**
   * The parent folder to execute.
   */
  parent?: string;
  /**
   * The names or the keys of requests to execute.
   * This can be used to limit the number of requests.
   */
  request?: string[];
  /**
   * The number of times the execution should be repeated.
   * Default to 1.
   */
  iterations?: number;
  /**
   * The number of milliseconds to wait between each iteration.
   * Default to the next frame (vary from 1 to tens of milliseconds).
   */
  iterationDelay?: number;
  /**
   * When set it performs parallel execution for each iteration.
   * The number of executions at the same time depends on the number of processor cores
   * available on the current machine. The maximum of the parallel execution
   * is the number of available cores. When the `iterations` number is higher
   * then the "rest" is added to the iterations per each core.
   */
  parallel?: boolean;
  /**
   * When set it includes requests in the current folder and sub-folder according to the order
   * defined in the folder.
   */
  recursive?: boolean;
  /**
   * The opposite of the `requests`. The list of names or keys of requests or folders to ignore.
   * Note, ignore is tested before the `requests`.
   */
  ignore?: string[];
  /**
   * The logger to use with the request factory.
   * When not set it uses the dummy logger (no output).
   */
  logger?: Logger;
  /**
   * When true it copies all system variables to the execution environment.
   * When an array of strings, only takes system variables that are listed in the array.
   * When a map, it uses this map as a list of variables.
   * When not set it does not read system variables.
   */
  variables?: boolean | string[] | Record<string, string>;

  /**
   * Optional signal from an `AbortController`.
   * It aborts the execution when the ``abort` event is dispatched.
   */
  signal?: AbortSignal;

  /**
   * An instance of a cookie jar (store) to put/read cookies.
   */
  cookies?: CookieJar;
}
