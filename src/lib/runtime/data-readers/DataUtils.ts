import { Headers } from '../../headers/Headers.js';
import { JsonExtractor } from './JsonExtractor.js';
import { XmlExtractor } from './XmlExtractor.js';
import { Payload, PayloadSerializer, hasBuffer } from '../../transformers/PayloadSerializer.js';
import { IActionIterator } from '../../../models/actions/ActionIterator.js';

/* eslint-disable no-plusplus */

/**
 * @param {string|Buffer|ArrayBuffer|File|Blob|FormData} body The body 
 * @returns {string|undefined}
 */
export async function readBodyString(body: Payload): Promise<string | undefined> {
  const buff = await PayloadSerializer.deserialize(body);
  const type = typeof buff;
  if (['string', 'boolean', 'undefined'].includes(type)) {
    return String(body);
  }
  if (body instanceof File || body instanceof Blob || body instanceof FormData) {
    return undefined;
  }
  if (hasBuffer && buff instanceof Buffer) {
    return buff.toString('utf8');
  }
  
  const typed = buff as ArrayBuffer;
  const decoder = new TextDecoder();
  try {
    return decoder.decode(typed);
  } catch (e) {
    return '';
  }
}


/**
 * Gets a value from a text for current path. Path is part of the
 * configuration object passed to the constructor.
 *
 * @param data Payload value.
 * @param ct Body content type.
 * @param path Remaining path to follow
 * @param iterator Iterator model
 * @return Value for given path.
 */
export async function getPayloadValue(data: Payload, ct: string, path: string[], iterator?: IActionIterator): Promise<string | undefined> {
  if (!data) {
    return undefined;
  }
  if (!path || !path.length) {
    return String(data);
  }
  
  const typedData = await readBodyString(data);
  if (!typedData) {
    return undefined;
  }
  if (ct.includes('application/json')) {
    const extractor = new JsonExtractor(typedData, path, iterator);
    return extractor.extract();
  }
  if (ct.includes('/xml') || ct.includes('+xml') || ct.startsWith('text/html')) {
    const extractor = new XmlExtractor(typedData, path, iterator);
    return extractor.extract();
  }
  return undefined;
}

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
      v = v.substr(1);
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
export function readUrlHashValue(url: URL, param?: string): string | null {
  let value: string | null = (url.hash || '').substr(1);
  if (!param) {
    return value;
  }
  const obj = new URLSearchParams(value);
  value = obj.get(param);
  if (!value && value !== '') {
    value = null;
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
export function getDataUrl(url: string, path: string[]): string | URLSearchParams | number | undefined {
  if (!path || path.length === 0 || !url) {
    return url;
  }
  const value = new URL(url);
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

/**
 * Returns a value for the payload field.
 *
 * @param payload The payload in the original form
 * @param headers The associated with the payload headers
 * @param path Path to the object
 * @param iterator Iterator model. Used only with response body.
 * @return Value for the path.
 */
export async function getDataPayload(payload: Payload | undefined, headers: string, path: string[], iterator?: IActionIterator): Promise<string | undefined> {
  if (!payload) {
    return undefined;
  }
  const headersInstance = new Headers(headers);
  const ct = headersInstance.get('content-type');
  if (!ct) {
    return undefined;
  }
  return getPayloadValue(payload, ct, path, iterator);
}
