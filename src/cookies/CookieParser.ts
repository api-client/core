/* eslint-disable no-control-regex */
import { Punycode } from "./Punycode.js";
import { HttpCookie } from '../models/HttpCookie.js';

export type SameSiteValue = 'Lax' | 'Strict' | 'None';

const cookieParts: (keyof HttpCookie)[] = [
  'path',
  'domain',
  'max-age',
  'expires',
  'secure',
  'httponly',
  'samesite',
  'hostonly',
];

const v6reStr = `
\\[?(?:
(?:[a-fA-F\\d]{1,4}:){7}(?:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,2}|:)|
(?:[a-fA-F\\d]{1,4}:){4}(?:(?::[a-fA-F\\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,3}|:)|
(?:[a-fA-F\\d]{1,4}:){3}(?:(?::[a-fA-F\\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){2}(?:(?::[a-fA-F\\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,5}|:)|
(?:[a-fA-F\\d]{1,4}:){1}(?:(?::[a-fA-F\\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,6}|:)|
(?::(?:(?::[a-fA-F\\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,7}|:))
)(?:%[0-9a-zA-Z]{1,})?\\]?
`
  .replace(/\s*\/\/.*$/gm, "")
  .replace(/\n/g, "")
  .trim();

const ipV6re = new RegExp(`^${v6reStr}$`);

/**
 * A class that parses the `set-cookie` header string to a list of cookies.
 */
export class CookieParser {
  /**
   * Creates a cookie canonical domain from the full request URL.
   * 
   * @param url The HTTP request URL.
   * @returns The canonical domain for the URL.
   */
  static canonicalDomainUrl(url: string): string {
    const parser = new URL(url);
    return this.canonicalDomain(parser.hostname);
  }

  /**
   * Creates a cookie canonical domain from the host name.
   * 
   * @param hostname The same as `new URL('...').hostname`.
   * @returns The canonical domain for the URL.
   */
  static canonicalDomain(hostname: string): string {
    let str = hostname;
    str = str.trim();
    if (ipV6re.test(str)) {
      str = str.replace("[", "").replace("]", "");
    }
    if (/[^\u0001-\u007f]/.test(str)) {
      str = Punycode.toASCII(str);
    }
    // if (str[0] !== '.') {
    //   str = `.${str}`;
    // }
    return str.toLowerCase();
  }

  /**
   * Parses the `set-cookie` header value and creates a list of cookies.
   * The cookie configuration must match the `url`. This means that if the cookie has a `host` property
   * this must match the request URL (browsers do not allow setting cookies from one domain for another).
   * 
   * When `host` or `path` part is missing from the cookie, the URL values are used.
   * 
   * @param requestUrl The HTTP request URL. Cookies must match this URL or will be ignored.
   * @param setCookie The value of the `set-cookie` string.
   */
  static parse(requestUrl: string, setCookie?: string): HttpCookie[] {
    const result: HttpCookie[] = [];
    if (!setCookie || typeof setCookie !== 'string') {
      return result;
    }
    const blocks = setCookie.split(';').map(i => i.trim());
    blocks.forEach((part, index) => {
      // Consider the following set-cookie string:
      // c1=v1; Path=/; Expires=Wed, 09 Feb 2022 01:30:04 GMT; HttpOnly,c2=v2; Path=/,c3=v3; Path=/; Secure; SameSite=Strict
      // It is a valid set-cookie header event though it mixes different formatting making it harder to parse cookies.
      // This loop looks for invalid parts and creates a canonical cookie parts array.
      const periodIndex = part.indexOf(',');
      if (periodIndex === -1) {
        return;
      }
      if (part.toLowerCase().startsWith('expires=')) {
        return;
      }
      const tmp = part.split(',');
      // remove current
      blocks.splice(index, 1);
      // add the new two
      blocks.splice(index, 0, ...tmp);
    });
    blocks.forEach((cookie) => {
      const parts = cookie.split(/=/, 2);
      if (parts.length === 0) {
        return;
      }
      const name = decodeURIComponent(parts[0].trim());
      if (!name) {
        return;
      }
      const lowerName = name.toLowerCase() as keyof HttpCookie;
      let value: string | boolean | undefined;
      if (parts.length > 1) {
        try {
          value = decodeURIComponent(parts[1].trim());
        } catch (e) {
          value = parts[1];
        }
      } else {
        value = true;
      }
      // if this is an attribute of previous cookie, set it for last
      // added cookie.
      if (cookieParts.includes(lowerName)) {
        if (result.length - 1 >= 0) {
          const attr = lowerName as keyof HttpCookie;
          const previousCookie = result[result.length - 1];
          if (attr === 'samesite') {
            const typed = value as SameSiteValue;
            switch (typed.toLowerCase()) {
              case 'lax': previousCookie[attr] = 'lax'; break;
              case 'strict': previousCookie[attr] = 'strict'; break;
              case 'none': previousCookie[attr] = 'no_restriction'; break;
            }
          } else {
            previousCookie[attr] = value as never;
          }
        }
      } else {
        try {
          result.push(new HttpCookie({
            name, 
            value: value as string,
            sameSite: 'unspecified',
          }));
        } catch (e) {
          // ..
        }
      }
    });

    // At this point we have all cookies set by the server. Now we need to filter out cookies 
    // set for a different domains.

    // first lets set cookie domain and path.
    const url = new URL(requestUrl);
    const domain = this.canonicalDomain(url.hostname);
    const path = this.getPath(url);

    result.forEach((cookie) => {
      if (!cookie.path) {
        cookie.path = path;
      }
      if (!cookie.domain) {
        // point 6. of https://tools.ietf.org/html/rfc6265#section-5.3
        cookie.domain = domain;
        cookie.hostOnly = true;
      } else if (cookie.domain[0] !== '.') {
        // https://stackoverflow.com/a/1063760/1127848
        cookie.domain = `.${cookie.domain}`;
      }
    });
    return this.filterCookies(result, requestUrl);
  }

  /**
   * Filters a list of cookies to match the given `requestUrl`.
   * This means that both the `domain` and the `path` part of the cookie must match the URL.
   * 
   * @param cookies The list of cookies to filter.
   * @param requestUrl The request URL to filter against.
   * @returns The filtered list of cookies that can be used with the URL.
   */
  static filterCookies(cookies: HttpCookie[], requestUrl: string): HttpCookie[] {
    const url = new URL(requestUrl);
    const domain = this.canonicalDomain(url.hostname);
    return cookies.filter((cookie) => {
      if (!cookie.path || !cookie.domain) {
        return false;
      }
      return this.matchesDomain(cookie.domain, domain) && this.matchesPath(cookie.path, url);
    });
  }

  /**
   * Gets the path for a domain as defined in
   * https://tools.ietf.org/html/rfc6265#section-5.1.4
   */
  static getPath(url: URL): string {
    let value = url.pathname;
    // /a/b/c -> /a/b
    // /a/b/c/ -> /a/b/c
    // /a -> /
    // /a/ -> /a
    let index = value.indexOf('/', 1);
    if (index === -1) {
      return '/';
    }
    index = value.lastIndexOf('/');
    if (index !== 0) {
      value = value.substring(0, index);
    }
    return value;
  }

  /**
   * This follows the algorithm defined in https://tools.ietf.org/html/rfc6265#section-5.1.3
   * 
   * @param string A string to test whether it matches the domain.
   * @param domain The domain to compare to
   * @return True if domains matches.
   */
  static matchesDomain(string: string, domain: string): boolean {
    if (!string || !domain) {
      return false;
    }

    let canonicalString = this.canonicalDomain(string);
    const canonicalDomain = this.canonicalDomain(domain);

    if (canonicalString[0] === '.') {
      canonicalString = canonicalString.substring(1);
    }

    // section-5.1.3 p.1
    if (canonicalString === canonicalDomain) {
      return true;
    }
    
    // section-5.1.3 p.2.1
    // The domain string is a suffix of the string.
    if (canonicalDomain.endsWith(canonicalString)) {
      // section-5.1.3 p.2.2
      // The last character of the string that is not included 
      // in the domain string is a %x2E (".") character.
      const index = canonicalDomain.indexOf(canonicalString);
      const char = canonicalDomain.substring(index - 1, index);
      if (char === '.') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if paths mach as defined in
   * https://tools.ietf.org/html/rfc6265#section-5.1.4
   *
   * Note: This function will return false if the `this.url` was not set.
   *
   * @param cookiePath Path from the cookie.
   * @param url
   * @return True when paths matches.
   */
  static matchesPath(cookiePath: string, url: URL): boolean {
    if (!cookiePath) {
      return true;
    }
    const requestPath = this.getPath(url);
    return this._matchesPath(cookiePath, requestPath);
    
    // const index = requestPath.indexOf(cookiePath);
    // if (index === 0 && cookiePath[cookiePath.length - 1] === '/') {
    //   return true;
    // }
    // if (index === 0 && cookiePath.indexOf('/', 1) === -1) {
    //   return true;
    // }

    // if (index === 0) {
    //   // eslint-disable-next-line no-plusplus
    //   for (let i = 0, len = requestPath.length; i < len; i++) {
    //     if (cookiePath.indexOf(requestPath[i]) === -1 && requestPath[i] === '/') {
    //       return true;
    //     }
    //   }
    // }
  }

  protected static _matchesPath(cookiePath: string, requestPath: string): boolean {
    // p1: The cookie-path and the request-path are identical.
    if (requestPath === cookiePath) {
      return true;
    }

    // p2,p3: The cookie-path is a prefix of the request-path ...
    if (requestPath.startsWith(cookiePath)) {
      // p2: and the last character of the cookie-path is U+002F ("/").
      if (cookiePath.endsWith('/')) {
        return true;
      }
      // p3: and the first character of the request-path that is not included in the cookie-path 
      // is a U+002F ("/") character.
      if (requestPath.replace(cookiePath, '')[0] === '/') {
        return true;
      }
    }
    return false;
  }

  static matchesCookie(c1: HttpCookie, c2: HttpCookie): boolean {
    if (c1.name !== c2.name) {
      return false;
    }
    if (!c1.domain || !c2.domain) {
      return false;
    }
    if (!c1.path || !c2.path) {
      return false;
    }
    return this.matchesDomain(c1.domain, c2.domain) && this._matchesPath(c1.path, c2.path);
  }
}
