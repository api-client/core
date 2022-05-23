import { Http, Types, Lorem, Time, IDataMockInit, IHttpRequestInit } from '@pawel-up/data-mock';
// import { randomValue } from '@pawel-up/data-mock/src/lib/Http.js';
import { IHttpRequest, Kind as HttpRequestKind } from '../../models/HttpRequest.js';
import { IRequest, Kind as RequestKind, Request as RequestModel } from '../../models/Request.js';
import { ISentRequest } from '../../models/SentRequest.js';
import { IRequestLog, Kind as RequestLogKind } from '../../models/RequestLog.js';
import { IResponseInit, Response } from './Response.js';

export interface IRequestLogInit {
  request?: IHttpRequestInit;
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

export interface IRequestInit extends IResponseInit {
  /**
   * The content type to generate the body for.
   * Has no effect when `noBody` is set.
   */
  contentType?: string;
}

export class Request {
  types: Types;
  lorem: Lorem;
  time: Time;
  http: Http;
  response: Response;

  constructor(init: IDataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.time = new Time(init);
    this.http = new Http(init);
    this.response = new Response(init);
  }

  request(init?: IHttpRequestInit): IRequest {
    const schema = {
      kind: RequestKind,
      expects: this.httpRequest(init),
      info: {
        name: this.lorem.words(2),
        description: this.lorem.paragraph(),
      },
      created: this.time.timestamp(),
    };
    const instance = new RequestModel(schema);
    return instance.toJSON();
  }

  httpRequest(init?: IHttpRequestInit): IHttpRequest {
    const request = this.http.request.request(init);
    return {
      kind: HttpRequestKind,
      ...request,
    }
  }

  sentRequest(init?: IHttpRequestInit): ISentRequest {
    const start = this.time.timestamp();
    return {
      startTime: start,
      endTime: this.time.timestamp({ min: start + 1 }),
      ...this.httpRequest(init),
    };
  }

  async log(init: IRequestLogInit = {}): Promise<IRequestLog> {
    const result: IRequestLog = {
      kind: RequestLogKind,
    };
    if (!init.noRequest) {
      result.request = this.sentRequest(init.request);
    }
    if (!init.noResponse) {
      result.response = await this.response.response(init.response);
    }
    if (init.redirects) {
      result.redirects = await this.response.redirects(undefined, init.response);
    }
    if (!init.noSize) {
      result.size = this.response.size();
    }
    return result;
  }
}
