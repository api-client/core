import { Cookie } from './Cookie';

/**
 * Gets the path for a domain as defined in
 * https://tools.ietf.org/html/rfc6265#section-5.1.4
 *
 * @param urlValue A url to extract path from.
 */
export function getPath(urlValue: string): string {
  let url = urlValue;
  const defaultValue = '/';
  if (!url) {
    return defaultValue;
  }
  let index = url.indexOf('/', 8); // after `http(s)://` string
  if (index === -1) {
    return defaultValue;
  }
  url = url.substr(index);
  if (!url || url[0] !== '/') {
    return defaultValue;
  }
  // removed query string
  index = url.indexOf('?');
  if (index !== -1) {
    url = url.substr(0, index);
  }
  // removes hash string
  index = url.indexOf('#');
  if (index !== -1) {
    url = url.substr(0, index);
  }
  index = url.indexOf('/', 1);
  if (index === -1) {
    return defaultValue;
  }
  index = url.lastIndexOf('/');
  if (index !== 0) {
    url = url.substr(0, index);
  }
  return url;
}

/**
 * Checks if `domain` of the request url (defined as `this.url`)
 * matches domain defined in a cookie.
 * This follows algorithm defined in https://tools.ietf.org/html/rfc6265#section-5.1.3
 *
 * Note: If `cookieDomain` is not set it returns false, while
 * (according to the spec) it should be set to `domain` and pass the test.
 * Because this function only check if domains matches it will not
 * override domain.
 * Cookie domain should be filled before calling this function.
 *
 * Note: This function will return false if the `this.url` was not set.
 *
 * @param cookieDomain A domain received in the cookie.
 * @param uri
 * @return True if domains matches.
 */
export function matchesDomain(cookieDomain: string, uri: URL): boolean {
  if (!uri) {
    return false;
  }
  let domain = uri.hostname;
  domain = domain && domain.toLowerCase && domain.toLowerCase();
  // eslint-disable-next-line no-param-reassign
  cookieDomain =
    cookieDomain && cookieDomain.toLowerCase && cookieDomain.toLowerCase();
  if (!cookieDomain) {
    return false;
  }
  if (domain === cookieDomain) {
    return true;
  }
  if (cookieDomain[0] === '.') {
    const parts = domain.split('.');
    if (parts.length > 1) {
      parts.shift();
      domain = parts.join('.');
    }
  }
  const index = cookieDomain.indexOf(domain);
  if (index === -1) {
    return false;
  }
  if (cookieDomain.substr(index - 1, index) !== '.') {
    return false;
  }
  return true;
}

/**
 * Checks if paths mach as defined in
 * https://tools.ietf.org/html/rfc6265#section-5.1.4
 *
 * Note: This function will return false if the `this.url` was not set.
 *
 * @param cookiePath Path from the cookie.
 * @param uri
 * @param url
 * @return True when paths matches.
 */
export function matchesPath(cookiePath: string, uri: URL, url: string): boolean {
  if (!uri) {
    return false;
  }
  if (!cookiePath) {
    return true;
  }
  const hostPath = getPath(url);
  if (hostPath === cookiePath) {
    return true;
  }
  // const index = cookiePath.indexOf(hostPath);
  const index = hostPath.indexOf(cookiePath);
  if (index === 0 && cookiePath[cookiePath.length - 1] === '/') {
    return true;
  }
  if (index === 0 && cookiePath.indexOf('/', 1) === -1) {
    return true;
  }

  if (index === 0) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0, len = hostPath.length; i < len; i++) {
      if (cookiePath.indexOf(hostPath[i]) === -1 && hostPath[i] === '/') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Clients must fill `path` and `domain` attribute if not set by the
 * server to match current request url.
 *
 * @param uri HTTP request url parsed by the URL class.
 * @param url The HTTP request url.
 * @param cookies Parsed cookies
 */
export function fillCookieAttributes(uri: URL, url: string, cookies: Cookie[]): void {
  if (!uri) {
    return;
  }
  let domain = uri.hostname;
  if (!domain) {
    return;
  }
  domain = domain.toLowerCase();
  const path = getPath(url);
  cookies.forEach((cookie) => {
    if (!cookie.path) {
      // eslint-disable-next-line no-param-reassign
      cookie.path = path;
    }
    const cDomain = cookie.domain;
    if (!cDomain) {
      // eslint-disable-next-line no-param-reassign
      cookie.domain = domain;
      // point 6. of https://tools.ietf.org/html/rfc6265#section-5.3
      // eslint-disable-next-line no-param-reassign
      cookie.hostOnly = true;
    }
    return cookie;
  });
}
