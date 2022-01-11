import { IHttpRequest, HttpRequest, Kind, IBaseHttpRequest } from './HttpRequest.js';
import { TransportRequest as LegacyTransportRequest } from './legacy/request/ArcRequest.js';
import { PayloadSerializer } from '../lib/transformers/PayloadSerializer.js';

export interface IBaseSentRequest extends IBaseHttpRequest {
  /**
   * The HTTP message sent to the server (full message).
   * Some HTTP clients may not give this information.
   */
  httpMessage?: string;
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime: number;
  /**
   * The timestamp of when the response ended.
   * This is always set when the response is ready. May not be set when the request is ongoing.
   */
  endTime?: number;
}

/**
 * An interface describing a request made by the HTTP transport.
 * Each transport used by ARC must return this structure in the response event.
 * This is not a replacement for the editor request that also has to be returned.
 * 
 * Another difference is that this headers contains a final list of headers sent to the 
 * server, including default headers, content-length, authorization, and so on.
 */
export interface ISentRequest extends IHttpRequest, IBaseSentRequest {
}

/**
 * A class that describes a request that has been sent by the transport library
 * to the remote machine. It contains the base HTTP request properties plus
 * the sent message and start and end time.
 */
export class SentRequest extends HttpRequest {
  /**
   * The HTTP message sent to the server (full message).
   * Some HTTP clients may not give this information.
   */
  httpMessage?: string;
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime = 0;
  /**
   * The timestamp of when the response ended.
   * When `0` then the requests is still being transported.
   */
  endTime = 0;

  static fromBaseValues(values: IBaseSentRequest): SentRequest {
    return new SentRequest({
      ...values,
      kind: Kind,
    });
  }

  static async fromLegacy(input: LegacyTransportRequest): Promise<SentRequest> {
    const init: ISentRequest = {
      kind: Kind,
      url: input.url || '',
      startTime: input.startTime || 0,
    };
    if (typeof input.endTime === 'number') {
      init.endTime = input.endTime;
    }
    if (input.headers) {
      init.headers = input.headers;
    }
    if (input.httpMessage) {
      init.httpMessage = input.httpMessage;
    }
    if (input.method) {
      init.method = input.method;
    }
    if (input.payload) {
      init.payload = await PayloadSerializer.serialize(input.payload);
    }
    return new SentRequest(init);
  }

  /**
   * @param input The request definition used to restore the state.
   */
  constructor(input?: string|ISentRequest) {
    super(input);
    let init: ISentRequest;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        url: '',
        startTime: 0,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new request clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC request.
   */
  new(init: ISentRequest): void {
    super.new(init);
    const { httpMessage, startTime=0, endTime=0 } = init;
    this.httpMessage = httpMessage;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  toJSON(): ISentRequest {
    const request = super.toJSON() as ISentRequest;
    request.httpMessage = this.httpMessage;
    request.startTime = this.startTime;
    request.endTime = this.endTime;
    return request;
  }
}
