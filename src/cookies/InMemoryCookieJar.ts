import { CookieJar } from "./CookieJar.js";
import { CookieParser } from "./CookieParser.js";
import { IHttpCookie, HttpCookie } from '../models/HttpCookie.js';

const cache: HttpCookie[] = [];

export class InMemoryCookieJar extends CookieJar {
  async deleteCookies(requestUrl: string, name?: string): Promise<void> {
    const url = new URL(requestUrl);
    const domain = CookieParser.canonicalDomain(url.hostname);
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
    cookies.forEach((cookie) => {
      let typed: HttpCookie;
      if (typeof (cookie as HttpCookie).toJSON !== 'function') {
        typed = new HttpCookie(cookie);
      } else {
        typed = cookie as HttpCookie;
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
