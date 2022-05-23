import { IRequest, Request } from "../Request.js";
import { HttpRequest, IHttpRequest } from "../HttpRequest.js";
import { Thing } from "../Thing.js";

export const Kind = 'Arc#ArcRequest';

export interface IArcHttpRequest extends IRequest {
  kind: typeof Kind;
  key: string;
}

export class ArcHttpRequest extends Request {
  kind = Kind;

  /**
   * The identifier of the request.
   * The key is related to the `created` property. It is the `new Date(created).toJSON()` value.
   */
  key = '';

  /**
   * Creates a project request from an URL.
   * 
   * @param url The Request URL. This is required.
   */
  static fromUrl(url: string): ArcHttpRequest {
    const d = new Date();
    const now: number = d.getTime();
    const request = new ArcHttpRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ url, method: 'GET' }).toJSON(),
      info: Thing.fromName(url).toJSON(),
    });
    return request;
  }

  /**
   * Creates a project request from a name.
   * 
   * @param name The Request name.
   */
  static fromName(name: string): ArcHttpRequest {
    const d = new Date();
    const now: number = d.getTime();
    const request = new ArcHttpRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: new HttpRequest().toJSON(),
      info: Thing.fromName(name).toJSON(),
    });
    return request;
  }

  /**
   * Creates a request from an HttpRequest definition.
   * 
   * @param info The request data.
   */
  static fromHttpRequest(info: IHttpRequest): ArcHttpRequest {
    const d = new Date();
    const now: number = d.getTime();
    const request = new ArcHttpRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ method: info.method, url: info.url, headers: info.headers, payload: info.payload }).toJSON(),
      info: Thing.fromName(info.url).toJSON(),
    });
    return request;
  }

  /**
   * Creates a request for a schema of a Request.
   */
  static fromRequest(request: IArcHttpRequest): ArcHttpRequest {
    const d = new Date(request.created || Date.now());
    const now: number = d.getTime();
    const init: IArcHttpRequest = { 
      ...request, 
      key: d.toJSON(), 
      kind: Kind,
      created: now,
    };
    const result = new ArcHttpRequest(init);
    return result;
  }

  constructor(input?: string | IArcHttpRequest) {
    super(input);

    let init: IArcHttpRequest | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key;
    }
    if (!this.key) {
      this.key = new Date(this.created || Date.now()).toJSON();
    }
    this.kind = Kind;
  }

  new(init: IArcHttpRequest): void {
    super.new(init);
    
    const { key } = init;
    this.key = key || new Date(init.created || Date.now()).toJSON();
    this.kind = Kind;
  }

  toJSON(): IArcHttpRequest {
    const request = super.toJSON();
    const result: IArcHttpRequest = { 
      ...request, 
      key: this.key, 
      kind: Kind 
    };
    return result;
  }
}
