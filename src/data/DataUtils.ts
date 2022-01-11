import { Headers } from '../lib/headers/Headers.js';

/**
 * Reads value of the URL query parameters.
 *
 * The `?` at the beginning of the query string is removed.
 *
 * @param url The URL object instance
 * @param param Param name to return. If not set then it returns  whole query string value.
 * @return Full query string value if `param` is not set or parameter
 * value. This function does not returns `null` values.
 */
export function readUrlQueryValue(url: URL, param?: string): string | null {
  if (!param) {
    let v = url.search || '';
    if (v[0] === '?') {
      v = v.substring(1);
    }
    return v;
  }
  let value = url.searchParams.get(param);
  if (!value && value !== '') {
    value = null;
  }
  return value;
}

/**
 * Reads value of the URL hash.
 *
 * The `#` at the beginning of the hash string is removed.
 *
 * If the `param` argument is set then it treats hahs value as a query
 * parameters string and parses it to get the value.
 *
 * @param url The URL object instance
 * @param param Param name to return. If not set then it returns whole hash string value.
 * @return Hash parameter or whole hash value.
 */
export function readUrlHashValue(url: URL, param?: string): string | undefined {
  let value: string | undefined = (url.hash || '').substring(1);
  if (!param) {
    return value;
  }
  const obj = new URLSearchParams(value);
  value = obj.get(param) || undefined;
  if (!value && value !== '') {
    value = undefined;
  }
  return value;
}

/**
 * Returns the value for path for given source object
 *
 * @param url An url to parse.
 * @param path Path to the data
 * @return Value for the path.
 */
export function getDataUrl(url: string, path: string[]): string | number | undefined {
  if (!path || path.length === 0 || !url) {
    return url;
  }
  let value: URL | undefined;
  try {
    value = new URL(url);
  } catch (e) {
    // 
  }
  if (!value) {
    return undefined;
  }
  switch (path[0]) {
    case 'host':
      return value.host;
    case 'protocol':
      return value.protocol;
    case 'path':
      return value.pathname;
    case 'query':
      return readUrlQueryValue(value, path[1]) || undefined;
    case 'hash':
      return readUrlHashValue(value, path[1]) || undefined;
    default:
      throw new Error(`Unknown path in the URL: ${path}`);
  }
}

/**
 * Returns a value for the headers.
 *
 * @param {string} source HTTP headers string
 * @param {string[]} path Path to the object
 * @return {string|undefined} Value for the path.
 */
export function getDataHeaders(source: string, path: string[]): string | undefined {
  if (!path || !path.length || !path[0]) {
    return source;
  }
  const headers = new Headers(source);
  const lowerName = path[0].toLowerCase();
  for (const [name, value] of headers) {
    if (name.toLowerCase() === lowerName) {
      return value;
    }
  }
  return undefined;
}
