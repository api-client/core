import { IResponseRedirect, ResponseRedirect  } from './ResponseRedirect.js';
import { ISentRequest, SentRequest } from './SentRequest.js';
import { IErrorResponse, ErrorResponse } from './ErrorResponse.js';
import { IArcResponse, ArcResponse } from './ArcResponse.js';
import { IRequestsSize, RequestsSize } from './RequestsSize.js';
import { ResponseRedirect as LegacyRedirect } from './legacy/request/ArcResponse.js';

export const Kind = 'ARC#ResponseLog';

/**
 * Describes a request / response pair associated with a request.
 */
export interface IRequestLog {
  kind: 'ARC#ResponseLog';
  /**
   * Describes an HTTP request sent by the transport.
   */
  request?: ISentRequest;
  /**
   * The last response made with this request, if any.
   */
  response?: IArcResponse | IErrorResponse;
  /**
   * The list of redirects, if any.
   */
  redirects?: IResponseRedirect[];
  /**
   * Request and response size. Some HTTP clients may not give this information.
   */
  size?: IRequestsSize;
}

/**
 * A request / response pair associated with a request.
 */
export class RequestLog {
  kind = Kind;
  /**
   * Describes an HTTP request sent by the transport.
   */
  request?: SentRequest;
  /**
   * The last response made with this request, if any.
   */
  response?: ArcResponse | ErrorResponse;
  /**
   * The list of redirects, if any.
   */
  redirects?: ResponseRedirect[];
  /**
   * Request and response size. Some HTTP clients may not give this information.
   */
  size?: RequestsSize;

  static fromRequest(request: ISentRequest): RequestLog {
    return new RequestLog({
      kind: Kind,
      request,
    });
  }

  static fromRequestResponse(request: ISentRequest, response: IArcResponse | IErrorResponse): RequestLog {
    return new RequestLog({
      kind: Kind,
      request,
      response,
    });
  }

  /**
   * @param input The response definition used to restore the state.
   */
  constructor(input?: string|IRequestLog) {
    let init: IRequestLog;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
      };
    }
    this.new(init);
  }

  /**
   * Creates a new response clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC response.
   */
  new(init: IRequestLog): void {
    const { request, response, redirects, size } = init;
    this.kind = Kind;
    if (request) {
      this.request = new SentRequest(request);
    }
    if (response) {
      if (ArcResponse.isErrorResponse(response)) {
        this.response = new ErrorResponse(response as IErrorResponse);
      } else {
        this.response = new ArcResponse(response as IArcResponse);
      }
    } else {
      this.response = undefined;
    }
    if (Array.isArray(redirects)) {
      this.redirects = redirects.map(i => new ResponseRedirect(i));
    } else {
      this.redirects = undefined;
    }
    if (size) {
      this.size = new RequestsSize(size);
    } else {
      this.size = undefined;
    }
  }

  toJSON(): IRequestLog {
    const result: IRequestLog = {
      kind: Kind,
    };
    if (this.request) {
      result.request = this.request.toJSON();
    }
    if (Array.isArray(this.redirects)) {
      result.redirects = this.redirects.map(i => i.toJSON());
    }
    if (this.size) {
      result.size = this.size.toJSON();
    }
    if (this.response) {
      result.response = this.response.toJSON();
    }
    return result;
  }

  /**
   * Adds a redirect to this log. 
   * It checks whether the redirects array has been initialized.
   */
  addRedirect(redirect: IResponseRedirect): ResponseRedirect {
    if (!this.redirects) {
      this.redirects = [];
    }
    const instance = new ResponseRedirect(redirect);
    this.redirects.push(instance);
    return instance;
  }

  async addLegacyRedirect(redirect: LegacyRedirect): Promise<ResponseRedirect> {
    if (!this.redirects) {
      this.redirects = [];
    }
    const info = await ResponseRedirect.fromLegacy(redirect);
    this.redirects.push(info);
    return info;
  }
}
