import { IHttpCookie, HttpCookie } from "../../models/HttpCookie.js";
import { IHttpRequest } from "../../models/HttpRequest.js";
import { IRequestLog } from "../../models/RequestLog.js";
import { IErrorResponse } from "../../models/ErrorResponse.js";
import { IResponse } from "../../models/Response.js";
import { IResponseRedirect } from '../../models/ResponseRedirect.js';
import { Headers } from '../../lib/headers/Headers.js';
import { CookieParser } from "../../cookies/CookieParser.js";

export class RequestCookiesProcessor {
  /**
   * Applies cookies to the request object.
   * 
   * Note, this mutates the request object.
   * 
   * @param request The request to which apply the cookies.
   * @param cookies The cookies to apply
   */
  static request(request: IHttpRequest, cookies?: (IHttpCookie | HttpCookie)[]): void {
    if (!Array.isArray(cookies) || !cookies.length) {
      return;
    }
    const header = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const headers = new Headers(request.headers);
    headers.append('cookie', header);
    request.headers = headers.toString();
  }

  /**
   * Computes a list of cookies in the response. This includes the redirect cookies and the final response.
   * 
   * @param log The HTTP log.
   * @returns A map where keys are the URL of the request and the values are cookies. It may be empty map when no cookies.
   */
  static response(log: IRequestLog): Record<string, HttpCookie[]> | undefined {
    if (!log.response || !log.request) {
      return;
    }
    const typedError = log.response as IErrorResponse;
    if (typedError.error) {
      return;
    }
    const typedResponse = log.response as IResponse;
    return this.extract(typedResponse, log.request.url, log.redirects);
  }

  protected static extract(response: IResponse, url: string, redirects?: IResponseRedirect[]): Record<string, HttpCookie[]> {
    const result: Record<string, HttpCookie[]> = {};
    let redirectUrl = url;
    if (redirects && redirects.length) {
      for (const redirect of redirects) {
        const headers = new Headers(redirect.response.headers);
        const sc = headers.get('set-cookie');
        if (sc) {
          const cookies = CookieParser.parse(redirectUrl, sc);
          if (cookies.length) {
            result[redirectUrl] = cookies;
          }
        }
        redirectUrl = redirect.url;
      }
    }

    const headers = new Headers(response.headers);
    const sc = headers.get('set-cookie');
    if (sc) {
      const cookies = CookieParser.parse(redirectUrl, sc);
      if (cookies.length) {
        result[redirectUrl] = cookies;
      }
    }
    return result;
  }
}
