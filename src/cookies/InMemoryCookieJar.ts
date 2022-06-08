import { CookieJar } from "./CookieJar.js";
import { CookieParser } from "./CookieParser.js";
import { IHttpCookie, HttpCookie } from '../models/HttpCookie.js';

const cache: HttpCookie[] = [];

export function clearStore(): void {
  cache.splice(0);
}

export class InMemoryCookieJar extends CookieJar {
  /**
   * Clears the memory store from all values.
   */
  clear(): void {
    cache.splice(0);
  }

  async deleteCookies(requestUrl: string, name?: string): Promise<void> {
    const url = new URL(requestUrl);
    const domain = CookieParser.canonicalDomain(url.host);
    for (let i = cache.length - 1; i >= 0; i--) {
      const cookie = cache[i];
      if (!cookie.path || !cookie.domain) {
        continue
      }
      if (name && name !== cookie.name) {
        continue;
      }
      if (CookieParser.matchesDomain(cookie.domain, domain) && CookieParser.matchesPath(cookie.path, url)) {
        cache.splice(i, 1);
      }
    }
  }

  async listCookies(url: string): Promise<HttpCookie[]> {
    return CookieParser.filterCookies(cache, url);
  }

  async setCookies(url: string, cookies: HttpCookie[] | IHttpCookie[]): Promise<void> {
    const uri = new URL(url);
    const domain = CookieParser.canonicalDomain(uri.host);
    const path = CookieParser.getPath(uri);
    cookies.forEach((cookie) => {
      let typed: HttpCookie;
      if (typeof (cookie as HttpCookie).toJSON !== 'function') {
        typed = new HttpCookie(cookie);
      } else {
        typed = cookie as HttpCookie;
      }
      if (!typed.path) {
        typed.path = path;
      }
      if (!typed.domain) {
        // point 6. of https://tools.ietf.org/html/rfc6265#section-5.3
        typed.domain = domain;
        typed.hostOnly = true;
      } else if (typed.domain[0] !== '.') {
        // https://stackoverflow.com/a/1063760/1127848
        typed.domain = `.${typed.domain}`;
      }
      const index = cache.findIndex(cached => CookieParser.matchesCookie(typed, cached));
      if (index >= 0) {
        cache[index] = typed;
      } else {
        cache.push(typed);
      }
    });
  }
}
