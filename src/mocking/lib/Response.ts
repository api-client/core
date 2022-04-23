import { Http, Har, Types, Lorem, Time, IDataMockInit, IHttpResponseInit, IHarTimingInit, Internet, IHttpPayloadInit } from '@pawel-up/data-mock';
import { IHttpResponse, HttpResponse, Kind as HttpResponseKind } from '../../models/HttpResponse.js';
import { IResponse, Kind as ResponseKind } from '../../models/Response.js';
import { IRequestsSize } from '../../models/RequestsSize.js';
import { IResponseRedirect, Kind as ResponseRedirectKind  } from '../../models/ResponseRedirect.js';
import { DeserializedPayload } from '../../lib/transformers/PayloadSerializer.js';

export interface IResponseInit extends IHttpResponseInit, IHarTimingInit {
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

  constructor(init: IDataMockInit={}) {
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.time = new Time(init);
    this.http = new Http(init);
    this.har = new Har(init);
    this.internet = new Internet(init);
  }

  protected _getPayload(mime?: string): DeserializedPayload {
    if (mime) {
      return undefined;
    }
    switch (mime) {
      case 'multipart/form-data': return this.http.formData.form();
      default:
        return this.http.payload.payload(mime as string);
    }
  }

  async httpResponse(init: IResponseInit = {}): Promise<IHttpResponse> {
    const mime = this.http.headers.contentType(init.payload as IHttpPayloadInit);
    const body = this._getPayload(mime);
    const headers = this.http.headers.headers('response', { mime: mime });
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
    const response = new HttpResponse(result);
    if (body) {
      await response.writePayload(body)
    }
    return response.toJSON();
  }

  async response(init: IResponseInit={}): Promise<IResponse> {
    const base = await this.httpResponse(init);
    const length = this.types.number({ min: 10, max: 4000 });
    const result: IResponse = {
      ...base,
      kind: ResponseKind,
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

  async redirect(init?: IResponseInit): Promise<IResponseRedirect> {
    const start = this.time.timestamp();
    const end = this.time.timestamp({ min: start + 1 })
    const info: IResponseRedirect = {
      kind: ResponseRedirectKind,
      startTime: start,
      endTime: end,
      url: this.internet.uri(),
      response: await this.httpResponse({ ...init, statusGroup: 3}),
    };
    return info;
  }

  async redirects(size=1, init?: IResponseInit): Promise<IResponseRedirect[]> {
    const result: Promise<IResponseRedirect>[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.redirect(init));
    }
    return Promise.all(result);
  }
}
