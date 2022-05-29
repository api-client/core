import { IDataMockInit, IHttpRequestInit } from '@pawel-up/data-mock';
import { IHttpClientRequest, Kind as HttpClientRequestKind } from '../../models/http-client/HttpClientRequest.js';
import { Request } from './Request.js';

export class Arc {
  protected request: Request;

  constructor(init: IDataMockInit={}) {
    this.request = new Request(init);
  }

  arcRequest(init?: IHttpRequestInit): IHttpClientRequest {
    const request = this.request.request(init);
    return {
      key: new Date(request.created || Date.now()).toJSON(),
      ...request,
      kind: HttpClientRequestKind,
    };
  }

  arcRequests(size = 25, init?: IHttpRequestInit): IHttpClientRequest[] {
    const result: IHttpClientRequest[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.arcRequest(init));
    }
    return result;
  }
}
