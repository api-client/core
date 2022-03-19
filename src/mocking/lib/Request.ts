import { Http, Types, Lorem, Time, DataMockInit, HttpRequestInit } from '@pawel-up/data-mock';
// import { randomValue } from '@pawel-up/data-mock/src/lib/Http.js';
import { IHttpRequest, Kind as HttpRequestKind } from '../../models/HttpRequest.js';
import { IRequest, Kind as RequestKind } from '../../models/Request.js';
import { ISentRequest } from '../../models/SentRequest.js';
import { IRequestLog, Kind as RequestLogKind } from '../../models/RequestLog.js';
import { IResponseInit, Response } from './Response.js';

export interface IRequestLogInit {
  request?: HttpRequestInit;
  response?: IResponseInit;
  /**
   * When set it ignores size information
   */
  noSize?: boolean;
  /**
   * Adds redirects to the request
   */
  redirects?: boolean;
  noResponse?: boolean;
  noRequest?: boolean;
}

export class Request {
  types: Types;
  lorem: Lorem;
  time: Time;
  http: Http;
  response: Response;

  constructor(init: DataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.time = new Time(init);
    this.http = new Http(init);
    this.response = new Response(init);
  }

  request(init?: HttpRequestInit): IRequest {
    return {
      kind: RequestKind,
      expects: this.httpRequest(init),
      info: {
        name: this.lorem.words(2),
        description: this.lorem.paragraph(),
      },
    }
  }

  httpRequest(init?: HttpRequestInit): IHttpRequest {
    const request = this.http.request(init);
    return {
      kind: HttpRequestKind,
      ...request,
    }
  }

  sentRequest(init?: HttpRequestInit): ISentRequest {
    const start = this.time.timestamp();
    return {
      startTime: start,
      endTime: this.time.timestamp({ min: start + 1 }),
      ...this.httpRequest(init),
    };
  }

  log(init: IRequestLogInit = {}): IRequestLog {
    const result: IRequestLog = {
      kind: RequestLogKind,
    };
    if (!init.noRequest) {
      result.request = this.sentRequest(init.request);
    }
    if (!init.noResponse) {
      result.response = this.response.response(init.response);
    }
    if (init.redirects) {
      result.redirects = this.response.redirects();
    }
    if (!init.noSize) {
      result.size = this.response.size();
    }
    return result;
  }
}
