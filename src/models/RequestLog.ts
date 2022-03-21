import { IResponseRedirect, ResponseRedirect  } from './ResponseRedirect.js';
import { ISentRequest, SentRequest } from './SentRequest.js';
import { IErrorResponse, ErrorResponse } from './ErrorResponse.js';
import { IResponse, Response } from './Response.js';
import { IRequestsSize, RequestsSize } from './RequestsSize.js';
import { ResponseRedirect as LegacyRedirect } from './legacy/request/ArcResponse.js';

export const Kind = 'Core#ResponseLog';

/**
 * Describes a request / response pair associated with a request.
 */
export interface IRequestLog {
  kind: typeof Kind;
  /**
   * Describes an HTTP request sent by the transport.
   */
  request?: ISentRequest;
  /**
   * The last response made with this request, if any.
   */
  response?: IResponse | IErrorResponse;
  /**
   * The list of redirects, if any.
   */
  redirects?: IResponseRedirect[];
  /**
   * Request and response size. Some HTTP clients may not give this information.
   */
  size?: IRequestsSize;
  /**
   * Optional request ID defined on an HTTP project that triggered this log.
   */
  requestId?: string;
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
  response?: Response | ErrorResponse;
  /**
   * The list of redirects, if any.
   */
  redirects?: ResponseRedirect[];
  /**
   * Request and response size. Some HTTP clients may not give this information.
   */
  size?: RequestsSize;
  /**
   * Optional request ID defined on an HTTP project that triggered this log.
   */
  requestId?: string;

  static fromRequest(request: ISentRequest): RequestLog {
    return new RequestLog({
      kind: Kind,
      request,
    });
  }

  static fromRequestResponse(request: ISentRequest, response: IResponse | IErrorResponse): RequestLog {
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
   */
  new(init: IRequestLog): void {
    const { request, response, redirects, size, requestId } = init;
    this.kind = Kind;
    if (request) {
      this.request = new SentRequest(request);
    }
    if (response) {
      if (Response.isErrorResponse(response)) {
        this.response = new ErrorResponse(response as IErrorResponse);
      } else {
        this.response = new Response(response as IResponse);
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
    if (requestId) {
      this.requestId = requestId;
    } else {
      this.requestId = undefined;
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
    if (this.requestId) {
      result.requestId = this.requestId;
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
