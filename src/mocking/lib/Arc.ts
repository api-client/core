import { IDataMockInit, IHttpRequestInit } from '@pawel-up/data-mock';
import { IArcHttpRequest, Kind as ArcHttpRequestKind } from '../../models/arc/ArcHttpRequest.js';
import { Request } from './Request.js';

export class Arc {
  protected request: Request;

  constructor(init: IDataMockInit={}) {
    this.request = new Request(init);
  }

  arcRequest(init?: IHttpRequestInit): IArcHttpRequest {
    const request = this.request.request(init);
    return {
      key: new Date(request.created || Date.now()).toJSON(),
      ...request,
      kind: ArcHttpRequestKind,
    };
  }

  arcRequests(size = 25, init?: IHttpRequestInit): IArcHttpRequest[] {
    const result: IArcHttpRequest[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.arcRequest(init));
    }
    return result;
  }
}
