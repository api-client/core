import { requestHeaders, responseHeaders, statusCodes, IHeaderDefinition, IStatusCodeDefinition } from '../headers/HeadersData.js';

/**
 * Queries for headers containing a `query`. If query is not set
 * (value is falsy) then it returns all headers definitions array.
 *
 * @param query A query to search for in the `key` field of the headers array.
 * @param type If this equals `request` then it will look in the request headers array. Is the response headers list otherwise.
 * @returns Array of the headers of selected `type` matched a `query` in a header's `key` field.
 */
export function queryHeaders(type: 'request' | 'response', query?: string): IHeaderDefinition[] {
  const headers = type === 'request' ? requestHeaders : responseHeaders;
  if (!query) {
    return headers;
  }
  const lowerQuery = query.trim().toLowerCase();
  return headers.filter(
    (item) => item.key.toLowerCase().indexOf(lowerQuery) !== -1
  );
}

/**
 * Queries for request headers that contains a `query`. If query is
 * not set (value is falsy) then it returns all headers definitions array.
 *
 * @param name A header name to look for. It will match a header where the header name contains the `name` param.
 * @returns Array of the request headers matched `name` in the header's `key` field.
 */
export function queryRequestHeaders(name?: string): IHeaderDefinition[] {
  return queryHeaders('request', name);
}

/**
 * Queries for response headers that contains a `query`. If query is
 * not set (value is falsy) then it returns all headers definitions array.
 *
 * @param name A header name to look for. It will match a header where the header name contains the `name` param.
 * @returns Array of the response headers matched `name` in the header's `key` field.
 */
export function queryResponseHeaders(name?: string): IHeaderDefinition[] {
  return queryHeaders('response', name);
}

/**
 * Convenient function to look for a status code in the array.
 *
 * @param codeArg The status code to look for.
 * @returns Status code definition or null if not found.
 */
export function getStatusCode(codeArg: number): IStatusCodeDefinition|IStatusCodeDefinition[]|null {
  if (!codeArg) {
    return statusCodes;
  }
  const code = Number(codeArg);
  if (Number.isNaN(code)) {
    return null;
  }
  const res = statusCodes.filter((item) => item.key === code);
  if (!res.length) {
    return null;
  }
  return res[0];
}
