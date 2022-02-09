import { Headers } from '../../lib/headers/Headers.js';
import { ResponseRedirect } from '../../models/ResponseRedirect.js';

/**
 * Reads a port number for a connection.
 *
 * @param port Existing information about the port.
 * @param protocol Request protocol. Only used if `port` is not set.
 * @return A port number. Default to 80.
 */
export function getPort(port: number|string, protocol?: string): number {
  if (port) {
    const typedPort = Number(port);
    if (!Number.isNaN(typedPort)) {
      return typedPort;
    }
  }
  if (protocol === 'https:') {
    return 443;
  }
  return 80;
}

/**
 * Creates a value for host header.
 *
 * @param value An url to get the information from.
 * @return Value of the host header
 */
export function getHostHeader(value: string): string | undefined {
  let uri;
  try {
    uri = new URL(value);
  } catch (e) {
    return;
  }
  let hostValue = uri.hostname;
  const defaultPorts = [80, 443];
  const port = getPort(uri.port, uri.protocol);
  if (!defaultPorts.includes(port)) {
    hostValue += `:${port}`;
  }
  return hostValue;
}

/**
 * Adds the `content-length` header to current request headers list if
 * it's required.
 * This function will do nothing if the request do not carry a payload or
 * when the content length header is already set.
 *
 * @param method HTTP request method
 * @param buffer Generated message buffer.
 * @param headers A headers object where to append headers when needed
 */
export function addContentLength(method: string, buffer: Buffer, headers: Headers): void {
  if (method.toLowerCase() === 'get') {
    return;
  }
  const size = buffer ? buffer.length : 0;
  headers.set('content-length', String(size));
}

export declare interface RedirectOptions {
  /**
   * true if redirect is required
   */
  redirect?: boolean;
  /**
   * If true the redirected request has to be a GET request.
   */
  forceGet?: boolean;
  /**
   * location of the resource (redirect uri)
   */
  location?: string;
}

/**
   * Checks if redirect is required.
   * @param status Response status code
   * @param method Request HTTP method
   * @param location Location header value, if any
   * @returns The redirect options
   */
export function redirectOptions(status: number, method: string, location?: string): RedirectOptions {
  const result: RedirectOptions = {
    redirect: false,
    forceGet: false,
  };
  switch (status) {
    case 300:
    case 304:
    case 305:
      // do nothing;
      break;
    case 301:
    case 302:
    case 307:
      if (['GET', 'HEAD'].indexOf(method) !== -1) {
        result.redirect = true;
      }
      break;
    case 303:
      result.redirect = true;
      result.forceGet = true;
      break;
    default:
  }
  if (!result.redirect) {
    return result;
  }
  if (location) {
    result.location = location;
  }
  return result;
}


/**
 * Checks if request is an infinite loop.
 * @param location Redirect location
 * @param redirects List of response objects
 * @return True if redirect is into the same place as already visited.
 */
export function isRedirectLoop(location: string, redirects: ResponseRedirect[]): boolean {
  if (redirects) {
    let index = -1;
    let i = 0;
    for (const item of redirects) {
      if (item.url === location) {
        index = i;
        break;
      }
      i++;
    }
    if (index !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * Processes redirection location
 * 
 * @param location Redirect location
 * @param requestUrl Request url
 * @return Redirect location
 */
export function getRedirectLocation(location: string, requestUrl: string): string | undefined {
  // https://github.com/jarrodek/socket-fetch/issues/5
  try {
    // eslint-disable-next-line no-new
    new URL(location);
  } catch (e) {
    try {
      location = new URL(location, requestUrl).toString();
    } catch (_) {
      return;
    }
  }
  return location;
}
