import { Cookie, CookieOptions } from './Cookie.js';
import {
  getPath,
  matchesDomain,
  matchesPath,
  fillCookieAttributes,
} from './Utils.js';

export const urlSymbol = Symbol('url');

/**
 * A library to handle Cookie parsing.
 */
export class Cookies {
  cookies: Cookie[];
  uri: URL | undefined;

  [urlSymbol]: string | undefined;

  /**
   * Constructs an object.
   *
   * @param cookie A HTTP cookie string to parse.
   * @param url A request url for this cookie. If empty some cookie computations (like checking if cookies matches) will be omitted.
   */
  constructor(cookie = '', url?: string) {
    /**
     * A base URL for this object.
     */
    this.url = url;

    /**
     * A list of parsed cookies.
     */
    this.cookies = Cookies.parse(cookie);
    if (this.uri && url) {
      fillCookieAttributes(this.uri, url, this.cookies);
    }
  }

  /**
   * Set's the URL and parses it setting `uri` property.
   * @param url Cookie URL
   */
  set url(url: string | undefined) {
    if (url) {
      this[urlSymbol] = url;
      this.uri = new URL(url);
    } else {
      this[urlSymbol] = undefined;
      this.uri = undefined;
    }
  }

  /**
   * @returns {string} Cookie URL
   */
  get url(): string | undefined {
    return this[urlSymbol];
  }

  /**
   * Parses a cookie string to a list of Cookie objects.
   *
   * @param cookies A HTTP cookie string
   * @returns List of parsed cookies.
   */
  static parse(cookies: string): Cookie[] {
    const cookieParts = [
      'path',
      'domain',
      'max-age',
      'expires',
      'secure',
      'httponly',
    ];
    const list: Cookie[] = [];
    if (!cookies || !cookies.trim()) {
      return list;
    }
    cookies.split(/;/).forEach((cookie) => {
      const parts = cookie.split(/=/, 2);
      if (parts.length === 0) {
        return;
      }
      const name = decodeURIComponent(parts[0].trim());
      if (!name) {
        return;
      }
      const lowerName = name.toLowerCase();
      let value: string | undefined;
      if (parts.length > 1) {
        try {
          value = decodeURIComponent(parts[1].trim());
        } catch (e) {
          // eslint-disable-next-line prefer-destructuring
          value = parts[1];
        }
      } else {
        value = undefined;
      }
      // if this is an attribute of previous cookie, set it for last
      // added cookie.
      if (cookieParts.includes(lowerName)) {
        if (list.length - 1 >= 0) {
          const attr = lowerName as keyof Cookie;
          const previousCookie = list[list.length - 1];
          previousCookie[attr] = value as never;
        }
      } else {
        try {
          list.push(new Cookie(name, value));
        } catch (e) {
          // ..
        }
      }
    });
    return list;
  }

  /**
   * Get a cookie by name.
   *
   * @param name Cookie name
   * @returns A Cookie object or null.
   */
  get(name: string): Cookie | null {
    const { cookies } = this;
    // eslint-disable-next-line no-plusplus
    for (let i = 0, len = cookies.length; i < len; i++) {
      if (cookies[i].name === name) {
        return cookies[i];
      }
    }
    return null;
  }

  /**
   * Adds a cookie to the list of cookies.
   *
   * @param name Name of the cookie.
   * @param value Value of the cookie.
   * @param opts Other cookie options to set.
   */
  set(name: string, value?: string, opts?: CookieOptions): void {
    const cookie = new Cookie(name, value, opts);
    const cookies = this.cookies.filter((c) => c.name !== name);
    cookies.push(cookie);
    this.cookies = cookies;
  }

  /**
   * Returns a string that can be used in a HTTP header value for Cookie.
   * The structure of the cookie string depends on if you want to send a
   * cookie from the server to client or other way around.
   * When you want to send the `Cookie` header to server set
   * `toServer` argument to true. Then it will produce only `name=value;`
   * string. Otherwise it will be the `Set-Cookie` header value
   * containing all other cookies properties.
   *
   * @param toServer True if produced string is to be used with the `Cookie` header
   * @returns HTTP header string value for all cookies.
   */
  toString(toServer = false): string {
    const parts: string[] = [];
    this.cookies.forEach((cookie) => {
      parts.push(toServer ? cookie.toString() : cookie.toHeader());
    });
    return parts.join('; ');
  }

  /**
   * Removes cookies from `this.cookies` that has been set for different
   * domain and path.
   * This function has no effect if the URL is not set.
   *
   * This function follows an algorithm defined in https://tools.ietf.org/html/rfc6265 for
   * domain match.
   *
   * @returns A list of removed cookies.
   */
  filter(): Cookie[] {
    const { uri, url } = this;
    if (!uri || !url) {
      return [];
    }
    const domain = uri.hostname.toLowerCase();
    const path = getPath(url);
    const removed: Cookie[] = [];
    this.cookies = this.cookies.filter((cookie) => {
      if (!cookie.path) {
        cookie.path = path;
      }
      const cDomain = cookie.domain;
      if (!cDomain) {
        cookie.domain = domain;
        // point 6. of https://tools.ietf.org/html/rfc6265#section-5.3
        cookie.hostOnly = true;
        return true;
      }
      const res =
        matchesDomain(cDomain, uri) && matchesPath(cookie.path, uri, url);
      if (!res) {
        removed.push(cookie);
      }
      return res;
    });
    return removed;
  }

  /**
   * Merges this cookies with another Cookies object.
   * This cookies will be overwritten by passed cookies according to
   * the HTTP spec.
   * This function is useful when you need to override cookies with
   * the response from the server
   * as defined in the https://tools.ietf.org/html/rfc6265.
   *
   * @param cookies An Cookies object with newest cookies.
   * @param copyKeys When set, it copies values for given keys from old object to the new one.
   */
  merge(cookies: Cookies, copyKeys: (keyof Cookie)[] = []): void {
    if (!cookies || !cookies.cookies || cookies.cookies.length === 0) {
      return;
    }
    if (!this.cookies || this.cookies.length === 0) {
      this.cookies = cookies.cookies;
      return;
    }
    const foreignDomain = cookies.uri ? cookies.uri.hostname : null;
    const foreignPath = cookies.url ? getPath(cookies.url) : null;
    // delete cookies from this.cookies that has the same name as new ones,
    // but are domain/path match
    const newCookies: Cookie[] = cookies.cookies;
    const nLength: number = newCookies.length;

    const { uri, url } = this;
    if (!uri || !url) {
      return;
    }
    const copyKeysLength = copyKeys.length;
    for (let i = this.cookies.length - 1; i >= 0; i--) {
      const tName = this.cookies[i].name;
      for (let j = 0; j < nLength; j++) {
        const targetCookie = newCookies[j];
        const nName = targetCookie.name;
        if (nName !== tName) {
          continue;
        }
        if (!foreignDomain || !matchesDomain(foreignDomain, uri)) {
          // This is cookie for a different domain. Don't override.
          continue;
        }
        if (!foreignPath || !matchesPath(foreignPath, uri, url)) {
          // This is cookie for a different path. Don't override.
          continue;
        }
        const removed = this.cookies.splice(i, 1);
        targetCookie.created = removed[0].created;
        if (copyKeysLength) {
          for (let k = 0; k < copyKeysLength; k++) {
            const key = copyKeys[k];
            if (key in removed[0]) {
              targetCookie[key] = removed[0][key] as never;
            }
          }
        }
        break;
      }
    }
    // Do not re-set cookies that values are not set.
    for (let i = nLength - 1; i >= 0; i--) {
      const nValue = newCookies[i].value;
      if (!nValue || !nValue.trim || !nValue.trim()) {
        newCookies.splice(i, 1);
      }
    }
    this.cookies = this.cookies.concat(newCookies);
  }

  /**
   * Clears cookies from `this.cookies` that already expired.
   *
   * @returns List of removed (expired) cookies.
   */
  clearExpired(): Cookie[] {
    const now = Date.now();
    const expired: Cookie[] = [];
    const cookies = this.cookies.filter((cookie) => {
      if (!cookie.expires) {
        return true;
      }
      if (now >= cookie.expires) {
        expired.push(cookie);
        return false;
      }
      return true;
    });
    this.cookies = cookies;
    return expired;
  }
}
