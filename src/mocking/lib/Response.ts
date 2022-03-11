import { Http, Har, Types, Lorem, Time, DataMockInit, HttpResponseInit, HarTimingInit, Internet } from '@pawel-up/data-mock';
import { IHttpResponse, Kind as HttpResponseKind } from '../../models/HttpResponse.js';
import { IArcResponse, Kind as ArcResponseKind } from '../../models/ArcResponse.js';
import { IRequestsSize } from '../../models/RequestsSize.js';
import { IResponseRedirect, Kind as ResponseRedirectKind  } from '../../models/ResponseRedirect.js';

export interface IArcResponseInit extends HttpResponseInit, HarTimingInit {
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
}

export class Response {
  types: Types;
  lorem: Lorem;
  time: Time;
  http: Http;
  har: Har;
  internet: Internet;

  constructor(init: DataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.time = new Time(init);
    this.http = new Http(init);
    this.har = new Har(init);
    this.internet = new Internet(init);
  }

  response(init: IArcResponseInit = {}): IHttpResponse {
    const ct = init.noBody ? undefined : this.http.headers.contentType();
    const body = init.noBody ? undefined : this.http.payload.payload(ct);
    const headers = this.http.headers.headers('response', { mime: ct });
    const statusGroup = init.statusGroup ? init.statusGroup : this.types.number({ min: 2, max: 5 });
    const sCode = this.types.number({ min: 0, max: 99 }).toString();
    const code = Number(`${statusGroup}${sCode.padStart(2, '0')}`);
    const status = this.lorem.word();
    const result: IHttpResponse = {
      kind: HttpResponseKind,
      status: code,
      statusText: status,
      headers,
    };
    if (!init.noBody) {
      result.payload = body;
    }
    return result;
  }

  arcResponse(init: IArcResponseInit={}): IArcResponse {
    const base = this.response(init);
    const length = this.types.number({ min: 10, max: 4000 });
    const result: IArcResponse = {
      ...base,
      kind: ArcResponseKind,
      loadingTime: length,
    };
    if (init.timings) {
      result.timings = this.har.timing(init);
    }
    return result;
  }

  size(): IRequestsSize {
    const result: IRequestsSize = {
      request: this.types.number({ min: 10 }),
      response: this.types.number({ min: 10 }),
    };
    return result;
  }

  redirect(init?: IArcResponseInit): IResponseRedirect {
    const start = this.time.timestamp();
    const end = this.time.timestamp({ min: start + 1 })
    const info: IResponseRedirect = {
      kind: ResponseRedirectKind,
      startTime: start,
      endTime: end,
      url: this.internet.uri(),
      response: this.response({ ...init, statusGroup: 3}),
    };
    return info;
  }

  redirects(size=1, init?: IArcResponseInit): IResponseRedirect[] {
    const result: IResponseRedirect[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.redirect(init));
    }
    return result;
  }
}
