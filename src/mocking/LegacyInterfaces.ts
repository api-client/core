import { IDataMockInit, IHarTimingInit, IHttpResponseRedirectStatusInit } from '@pawel-up/data-mock'

export interface ArcDataMockInit extends IDataMockInit {
}

export interface VariableInit {
  defaultEnv?: boolean;
  randomEnv?: boolean;
}

export declare interface RestApiIndexInit {
  versionSize?: number;
  order?: number;
}

export declare interface HttpResponseArcInit extends IHarTimingInit {
  /**
   * When set it does not generate a response payload.
   */
  noBody?: boolean;
  /**
   * The first number of the status group. Other 2 are auto generated
   */
  statusGroup?: number;
  /**
   * Whether to generate timings object
   */
  timings?: boolean;
  /**
   * When set it ignores size information
   */
  noSize?: boolean;
  /**
   * Adds redirects to the request
   */
  redirects?: boolean;
}

export declare interface HttpResponseRedirectInit extends IHttpResponseRedirectStatusInit, IHarTimingInit {
  /**
   * When set it adds body to the response
   */
  body?: boolean;
  /**
   * The redirection code. Otherwise a random pick is used
   */
  code?: number;
  /**
   * Whether to generate timings object
   */
  timings?: boolean;
}
