import { Types, IDataMockInit, IHttpRequestInit } from '@pawel-up/data-mock';
import { IArcHttpRequest, Kind as ArcHttpRequestKind } from '../../models/arc/ArcHttpRequest.js';
import { Request } from './Request.js';

export class Arc {
  protected request: Request;
  protected types: Types;

  constructor(init: IDataMockInit={}) {
    this.request = new Request(init);
    this.types = new Types(init.seed);
    // this.lorem = new Lorem(init);
    // this.time = new Time(init);
    // this.http = new Http(init);
    // this.response = new Response(init);
  }

  arcRequest(init?: IHttpRequestInit): IArcHttpRequest {
    const request = this.request.request(init);
    return {
      key: this.types.uuid(),
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
