import { Entity } from '../models/base.js';
import { MultipartTransformer } from "./ArcRequest.js";
import { RequestTime, TransformedPayload } from "./ArcResponse.js";

export interface HistoryData extends Entity {
  timings: RequestTime;
  totalTime: number;
  created: number;
  request: HistoryDataRequest;
  response: HistoryDataResponse;
  stats: HistoryDataStats;
}
export interface HistoryDataRequest {
  headers?: string;
  payload?: string | Buffer | ArrayBuffer | Blob | File | FormData;
  url: string;
  method: string;
  /**
   * ARCs internal transformation of a native FormData into a structure that
   * can be stored in the data store. This is used internally by their model
   * and when requesting ARC request object this is restored to the original
   * format.
   */
  multipart?: MultipartTransformer[];
  /**
   * When a file is the request payload then in the data store it is transformed into a 
   * string and the payload is emptied. This is used internally by the data store
   * to restore the original format
   */
  blob?: string;
}
export interface HistoryDataResponse {
  statusCode: number,
  statusText?: string;
  headers?: string;
  payload: string | TransformedPayload;
}

export interface HistoryDataStat {
  headersSize: number;
  payloadSize: number;
}

export interface HistoryDataStats {
  request: HistoryDataStat;
  response: HistoryDataStat;
}
