import { IHttpResponse, HttpResponse, Kind as ResponseKind } from './HttpResponse';
import { IRequestTime, RequestTime } from './RequestTime';
import { ResponseRedirect as LegacyRedirect } from './legacy/request/ArcResponse'

export const Kind = 'ARC#HttpResponseRedirect';

/**
 * An information about a redirect
 */
export interface IResponseRedirect {
  kind: string;
  /**
   * Redirection response
   */
  response: IHttpResponse;
  /**
   * Redirection timings, if available.
   */
  timings?: IRequestTime;
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime: number;
  /**
   * The timestamp of when the response ended.
   */
  endTime: number;
  /**
   * The URL the request was redirected to
   */
  url: string;
}


export class ResponseRedirect {
  kind = Kind;
  /**
   * Redirection response
   */
  response?: HttpResponse;
  /**
   * Redirection timings, if available.
   */
  timings?: RequestTime;
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime = 0;
  /**
   * The timestamp of when the response ended.
   */
  endTime = 0;
  /**
   * The URL the request was redirected to
   */
  url = '';

  static fromValues(url: string, response: IHttpResponse, startTime = 0, endTime = 0): ResponseRedirect {
    return new ResponseRedirect({
      kind: Kind,
      url,
      startTime,
      endTime,
      response,
    });
  }

  static async fromLegacy(redirect: LegacyRedirect): Promise<ResponseRedirect> {
    const init: IResponseRedirect = {
      kind: Kind,
      endTime: redirect.endTime || 0,
      startTime: redirect.startTime || 0,
      url: redirect.url || '',
      response: {
        kind: ResponseKind,
        status: 0,
      },
    };
    if (redirect.response) {
      const response = await HttpResponse.fromLegacy(redirect.response);
      init.response = response.toJSON();
    }
    if (redirect.timings) {
      init.timings = new RequestTime(redirect.timings).toJSON();
    }
    return new ResponseRedirect(init);
  }

  /**
   * @param input The redirect definition used to restore the state.
   */
  constructor(input?: string|IResponseRedirect) {
    let init: IResponseRedirect;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        endTime: 0,
        startTime: 0,
        url: '',
        response: {
          kind: ResponseKind,
          status: 0,
        },
      };
    }
    this.new(init);
  }

  /**
   * Creates a new redirect clearing anything that is so far defined.
   * 
   * Note, this throws an error when the object is not an ARC redirect.
   */
  new(init: IResponseRedirect): void {
    const { response, timings, startTime=0, endTime=0, url='', kind=Kind } = init;
    this.kind = kind;
    this.startTime = startTime;
    this.endTime = endTime;
    this.url = url;
    this.response = new HttpResponse(response);
    if (timings) {
      this.timings = new RequestTime(timings);
    } else {
      this.timings = undefined;
    }
  }

  toJSON(): IResponseRedirect {
    const result: IResponseRedirect = {
      kind: this.kind,
      startTime: this.startTime,
      endTime: this.endTime,
      url: this.url,
      response: {} as IHttpResponse,
    };
    if (this.response) {
      result.response = this.response.toJSON();
    }
    if (this.timings) {
      result.timings = this.timings.toJSON();
    }
    return result;
  }
}
