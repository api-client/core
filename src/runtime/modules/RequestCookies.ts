import { CookieEvents } from '../../events/cookies/CookieEvents.js';
import { Cookies } from '../../lib/cookies/Cookies.js';
import { Headers } from '../../lib/headers/Headers.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { ExecutionContext } from './ModulesRegistry.js';
import { IResponseRedirect } from '../../models/ResponseRedirect.js';
import { IResponse } from '../../models/Response.js';
import { IErrorResponse } from '../../models/ErrorResponse.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { HttpCookie } from '../../models/HttpCookie.js';
import { Kind as RequestConfigKind } from '../../models/RequestConfig.js';
import { Cookie } from '../../lib/cookies/Cookie.js';

/**
 * Get cookies header value for given URL.
 *
 * @param eventsTarget
 * @param url An URL for cookies.
 * @returns A promise that resolves to header value string.
 */
async function getCookiesHeaderValue(eventsTarget: EventTarget, url: string): Promise<string> {
  const cookies = await CookieEvents.listUrl(eventsTarget, url);
  if (!cookies || !cookies.length) {
    return '';
  }
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Applies cookie header value to current request headers.
 * If header to be applied is computed then it will alter headers string.
 *
 * Note, this element do not sends `request-headers-changed` event.
 *
 * @param header Computed headers string
 * @param request The request object from the event.
 */
function applyCookieHeader(header: string, request: IHttpRequest): void {
  const trimmed = header.trim();
  if (!trimmed) {
    return;
  }
  const headers = new Headers(request.headers);
  headers.append('cookie', trimmed);
  request.headers = headers.toString();
}

/**
 * Extracts cookies from the `response` object and returns an object with `cookies` and `expired` properties containing array of cookies, each.
 *
 * @param url The request URL.
 * @param redirects List of redirect responses 
 * @returns An object with `cookies` and `expired` arrays of cookies.
 */
function extract(response: IResponse, url: string, redirects?: IResponseRedirect[]): Record<'expired'|'cookies', Cookie[]> {
  let expired: Cookie[] = [];
  let parser;
  let exp;
  const parsers = [];
  if (redirects && redirects.length) {
    redirects.forEach((r) => {
      const headers = new Headers(r.response.headers);
      if (headers.has('set-cookie')) {
        parser = new Cookies(headers.get('set-cookie'), r.url);
        parser.filter();
        exp = parser.clearExpired();
        if (exp && exp.length) {
          expired = expired.concat(exp);
        }
        parsers.push(parser);
      }
    });
  }
  const headers = new Headers(response.headers);
  if (headers.has('set-cookie')) {
    parser = new Cookies(headers.get('set-cookie'), url);
    parser.filter();
    exp = parser.clearExpired();
    if (exp && exp.length) {
      expired = expired.concat(exp);
    }
    parsers.push(parser);
  }
  let mainParser: Cookies|undefined;
  parsers.forEach((item) => {
    if (!mainParser) {
      mainParser = item;
      return;
    }
    mainParser.merge(item);
  });
  return {
    cookies: mainParser ? mainParser.cookies : [],
    expired
  };
}

/**
 * A request engine request module to apply session cookies to a request.
 * It adds stored session cookies when application configuration applies for it (or request configuration, when apply)
 * 
 * Unregister this module when the application settings change to not to use session storage.
 * 
 * In electron the session storage is a chrome persistent partition with a session shared with the "log in to a web service".
 * This way cookies can be acquired in through the browser login and store in the application to use them with the request.
 */
export async function processRequestCookies(request: IHttpRequest, context: ExecutionContext): Promise<void> {
  const editorRequest = request;
  const { config } = context;
  const ignore = config && config.enabled === true && config.ignoreSessionCookies === true;
  if (ignore) {
    return;
  }
  const cookie = await getCookiesHeaderValue(context.eventsTarget, editorRequest.url);
  applyCookieHeader(cookie, editorRequest);
}

/**
 * Processes cookies data from the response and inserts them into the session storage
 */
export async function processResponseCookies(log: IRequestLog, context: ExecutionContext): Promise<void> {
  if (!log.response || !log.request) {
    return;
  }
  const typedError = log.response as IErrorResponse;
  if (typedError.error) {
    return;
  }
  const config = context.config || {
    kind: RequestConfigKind,
    enabled: false,
  };
  let ignore = false; 
  if (config.enabled !== false && config.ignoreSessionCookies) {
    ignore = true;
  }
  
  if (ignore) {
    return;
  }
  const typedResponse = log.response as IResponse;
  const result = extract(typedResponse, log.request.url, log.redirects);
  if (result.cookies.length) {
    await CookieEvents.updateBulk(context.eventsTarget, result.cookies.map(c => HttpCookie.fromCookieParser(c).toJSON()));
  }
}
