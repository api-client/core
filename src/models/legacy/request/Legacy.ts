import { RequestTime } from "./ArcResponse.js";

/**
 * @deprecated This is no longer used in ARC except for internal processing of the data model
 */
export interface LegacyResponseMeta {
  /**
   * Request loading time
   */
  loadingTime: number;
  /**
   * Whether the request was made using web APIs.
   */
  responseIsXhr: boolean;
  redirects: LegacyRedirect[];
  redirectsTiming: RequestTime[];
  /**
   * Request timings.
   */
  timing: RequestTime;
  /** 
   * sent message by the transport
   */
  sourceMessage: string;
}

/**
 * @deprecated This is no longer used in ARC except for internal processing of the data model
 */
export interface LegacyRedirect {
  status: number;
  statusText: string;
  headers: string;
  url: string;
  payload: string|Buffer|ArrayBuffer;
  sentHttpMessage: string;
}

/**
 * @deprecated This is no longer used in ARC except for internal processing of the data model
 */
export interface LegacyResponse extends LegacyRedirect {
  stats: RequestTime;
  redirects: LegacyRedirect[];
}
