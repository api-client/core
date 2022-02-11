import { Entity } from './base.js';

/**
 * @deprecated
 */
export interface UrlHistory {
 /**
   * A number of times the URL was used
   */
  cnt: number;
  /**
   * Last use timestamp.
   */
  time: number;
  /**
   * The request URL stored in the history.
   */
  url: string;
  /**
   * A timestamp of the midnight that corresponds to the `time` property.
   */
  midnight: number;
}

/**
 * @deprecated
 */
export declare interface ARCUrlHistory extends UrlHistory, Entity {
  
}

/**
 * @deprecated
 */
export declare interface ARCWebsocketUrlHistory extends UrlHistory, Entity {
  
}
