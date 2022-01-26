import { Headers } from '../../lib/headers/Headers.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { INtlmAuthorization, IBasicAuthorization } from '../../models/Authorization.js';
import { ExecutionContext } from './ModulesRegistry.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';

const cache: any = {};

/**
 * Removes query parameters and the fragment part from the URL
 * @param url The URL to process.
 * @returns The canonical URL.
 */
export function computeUrlPath(url: string): string {
  if (!url) {
    return '';
  }
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    let result = u.toString();
    // polyfill library has some error and leaves '?#' if was set
    result = result.replace('?', '');
    result = result.replace('#', '');
    return result;
  } catch (e) {
    return url;
  }
}

/**
 * Finds an auth data for given `url`.
 *
 * @param type Authorization type.
 * @param url The URL of the request.
 * @return Auth data if exists in the cache.
 */
export function findCachedAuthData(type: string, url: string): IBasicAuthorization|INtlmAuthorization|undefined {
  const key = computeUrlPath(url);
  if (!cache || !type || !key || !cache[type]) {
    return undefined;
  }
  return cache[type][key];
}

/**
 * Updates cached authorization data
 *
 * @param type Authorization type.
 * @param url The URL of the request.
 * @param value Auth data to set
 */
export function updateCache(type: string, url: string, value: IBasicAuthorization|INtlmAuthorization): void {
  const key = computeUrlPath(url);
  if (!cache[type]) {
    cache[type] = {};
  }
  cache[type][key] = value;
}

/**
 * Applies the basic authorization data to the request.
 *
 * If the header value have changed then it fires `request-headers-changed` custom event.
 * It sets computed value of the readers to the event's detail object.
 *
 * @param request The event's detail object. Changes made here will be propagated to the event.
 * @param data The authorization data to apply.
 */
export function applyRequestBasicAuthData(request: IHttpRequest, data: IBasicAuthorization): void {
  const { username='', password='' } = data;
  const headers = new Headers(request.headers || '');
  let hash: string;
  let decoded = `${username}:${password}`;
  if (typeof Buffer === 'function' && typeof Buffer.from === 'function') {
    hash = Buffer.from(decoded).toString('base64');
  } else {
    hash = btoa(decoded);
  }
  headers.set('authorization', `Basic ${hash}`);
  request.headers = headers.toString();
}

/**
 * Applies the NTLM authorization data to the request.
 *
 * Because NTLM requires certain operations on a socket it's bot just about setting a headers
 * but whole NTLM configuration object.
 *
 * Applied the `auth` object to the event's `detail.auth` object.
 *
 * @param {ArcBaseRequest} request The event's detail object. Changes made here will be propagated to
 * the event.
 * @param {NtlmAuthorization} values The authorization data to apply.
 */
function applyRequestNtlmAuthData(authorization: IRequestAuthorization[], values: INtlmAuthorization): void {
  let ntlm: IRequestAuthorization | undefined = authorization.find(((method) => method.type === 'ntlm'));
  if (!ntlm) {
    ntlm = {
      kind: '',
      enabled: true,
      type: 'ntlm',
      config: {},
      valid: true,
    };
    authorization.push(ntlm);
  }
  const cnf = ntlm.config as INtlmAuthorization;
  if (cnf.username) {
    return;
  }
  cnf.username = values.username;
  cnf.password = values.password;
  cnf.domain = values.domain;
}

/**
 * Adds basic authorization data to the request, when during this session basic auth was used
 */
export default function applyCachedBasicAuthData(request: IHttpRequest, context: ExecutionContext): void {
  // Try to find an auth data for the URL. If has a match, apply it to the request
  let authData = findCachedAuthData('basic', request.url);
  if (authData) {
    applyRequestBasicAuthData(request, authData);
    return;
  }
  // Try NTLM
  authData = findCachedAuthData('ntlm', request.url);
  if (authData && Array.isArray(context.authorization)) {
    applyRequestNtlmAuthData(context.authorization, authData as INtlmAuthorization);
  }
}
