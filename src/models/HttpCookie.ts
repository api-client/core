import { ARCCookie as LegacyARCCookie } from './legacy/models/Cookies.js';
import { Cookie as ParserCookie } from '../lib/cookies/Cookie.js';

export type CookieSameSiteType = 'unspecified' | 'no_restriction' | 'lax' | 'strict';
export type CookieChangeReason = 'explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite';

export interface IHttpCookieChangeRecord {
  /**
   * The cookie that was changed.
   */
  cookie: IHttpCookie;
  /**
   * The cause of the change with one of the following values:
   * - `explicit` - The cookie was changed directly by a consumer's action.
   * - `overwrite` - The cookie was automatically removed due to an insert operation that overwrote it.
   * - `expired` - The cookie was automatically removed as it expired.
   * - `evicted` - The cookie was automatically evicted during garbage collection.
   * - `expired-overwrite` - The cookie was overwritten with an already-expired expiration date.
   */
  cause: CookieChangeReason;
  /**
   * `true` if the cookie was removed, `false` otherwise.
   */
  removed: boolean;
}

export interface IHttpCookie {
  // https://www.electronjs.org/docs/latest/api/structures/cookie
  /**
   * The name of the cookie.
   */
  name: string;
  /**
   * The value of the cookie.
   */
  value: string;
  /**
   * The domain of the cookie; this will be normalized with a preceding dot so that
   * it's also valid for subdomains.
   */
  domain?: string;
  /**
   * Whether the cookie is a host-only cookie; this will only be `true` if no domain
   * was passed.
   */
  hostOnly?: boolean;
  /**
   * The path of the cookie.
   */
  path?: string;
  /**
   * Whether the cookie is marked as secure.
   */
  secure?: boolean;
  /**
   * Whether the cookie is marked as HTTP only.
   */
  httpOnly?: boolean;
  /**
   * Whether the cookie is a session cookie or a persistent cookie with an expiration
   * date.
   */
  session?: boolean;
  /**
   * The expiration date of the cookie as the number of seconds since the UNIX epoch.
   * Not provided for session cookies.
   */
  expirationDate?: number;
  /**
   * The Same Site policy applied to this cookie. Can be `unspecified`, `no_restriction`, `lax` or `strict`.
   * @default unspecified
   */
  sameSite: CookieSameSiteType;
}

export class HttpCookie {
  /**
   * The name of the cookie.
   */
  name = '';
  /**
   * The value of the cookie.
   */
  value = '';
  /**
   * The domain of the cookie; this will be normalized with a preceding dot so that
   * it's also valid for subdomains.
   */
  domain?: string;
  /**
   * Whether the cookie is a host-only cookie; this will only be `true` if no domain
   * was passed.
   */
  hostOnly?: boolean;
  /**
   * The path of the cookie.
   */
  path?: string;
  /**
   * Whether the cookie is marked as secure.
   */
  secure?: boolean;
  /**
   * Whether the cookie is marked as HTTP only.
   */
  httpOnly?: boolean;
  /**
   * Whether the cookie is a session cookie or a persistent cookie with an expiration
   * date.
   */
  session?: boolean;
  /**
   * The expiration date of the cookie as the number of seconds since the UNIX epoch.
   * Not provided for session cookies.
   */
  expirationDate?: number;
  /**
   * The Same Site policy applied to this cookie. Can be `unspecified`, `no_restriction`, `lax` or `strict`.
   * @default unspecified
   */
  sameSite: CookieSameSiteType = 'unspecified';

  static fromLegacy(old: LegacyARCCookie): HttpCookie {
    const init: IHttpCookie = {
      name: old.name,
      value: old.value || '',
      sameSite: 'unspecified',
    };
    if (old.domain) {
      init.domain = old.domain;
    }
    if (typeof old.expires === 'number') {
      init.expirationDate = old.expires;
    }
    if (typeof old.hostOnly === 'boolean') {
      init.hostOnly = old.hostOnly;
    }
    if (typeof old.httpOnly === 'boolean') {
      init.httpOnly = old.httpOnly;
    }
    if (typeof old.path === 'string') {
      init.path = old.path;
    }
    if (typeof old.secure === 'boolean') {
      init.secure = old.secure;
    }
    if (typeof old.session === 'boolean') {
      init.session = old.session;
    }
    return new HttpCookie(init);
  }

  static fromValue(name: string, value: string = ''): HttpCookie {
    const init: IHttpCookie = {
      name,
      value,
      sameSite: 'unspecified',
    };
    return new HttpCookie(init);
  }

  static fromCookieParser(cookie: ParserCookie): HttpCookie {
    const { name, value, sameSite='unspecified' } = cookie;
    const init: IHttpCookie = {
      name,
      value,
      sameSite,
    };
    if (typeof cookie.domain === 'string') {
      init.domain = cookie.domain;
    }
    if (typeof cookie.path === 'string') {
      init.path = cookie.path;
    }
    if (typeof cookie.expires === 'number') {
      init.expirationDate = cookie.expires;
    }
    if (typeof cookie.hostOnly === 'boolean') {
      init.hostOnly = cookie.hostOnly;
    }
    if (typeof cookie.httpOnly === 'boolean') {
      init.httpOnly = cookie.httpOnly;
    }
    if (typeof cookie.secure === 'boolean') {
      init.secure = cookie.secure;
    }
    if (typeof cookie.persistent === 'boolean') {
      init.session = !cookie.persistent;
    }
    return new HttpCookie(init);
  }

  constructor(input?: string|IHttpCookie) {
    let init: IHttpCookie;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        name: '',
        value: '',
        sameSite: 'unspecified',
      };
    }
    this.new(init);
  }

  new(init: IHttpCookie): void {
    const {
      name = '',
      value = '',
      sameSite = 'unspecified',
      domain, expirationDate, hostOnly, httpOnly, path, secure, session
    } = init;
    this.name = name;
    this.value = value;
    this.sameSite = sameSite;
    if (domain) {
      this.domain = domain;
    } else {
      this.domain = undefined;
    }
    if (typeof expirationDate === 'number') {
      this.expirationDate = expirationDate;
    } else {
      this.expirationDate = undefined;
    }
    if (typeof hostOnly === 'boolean') {
      this.hostOnly = hostOnly;
    } else {
      this.hostOnly = undefined;
    }
    if (typeof httpOnly === 'boolean') {
      this.httpOnly = httpOnly;
    } else {
      this.httpOnly = undefined;
    }
    if (typeof secure === 'boolean') {
      this.secure = secure;
    } else {
      this.secure = undefined;
    }
    if (typeof session === 'boolean') {
      this.session = session;
    } else {
      this.session = undefined;
    }
    if (typeof path === 'string') {
      this.path = path;
    } else {
      this.path = undefined;
    }
  }

  toJSON(): IHttpCookie {
    const result: IHttpCookie = {
      name: this.name,
      value: this.value,
      sameSite: this.sameSite,
    };
    if (this.domain) {
      result.domain = this.domain;
    }
    if (typeof this.expirationDate === 'number') {
      result.expirationDate = this.expirationDate;
    }
    if (typeof this.hostOnly === 'boolean') {
      result.hostOnly = this.hostOnly;
    }
    if (typeof this.httpOnly === 'boolean') {
      result.httpOnly = this.httpOnly;
    }
    if (typeof this.secure === 'boolean') {
      result.secure = this.secure;
    }
    if (typeof this.session === 'boolean') {
      result.session = this.session;
    }
    if (this.path) {
      result.path = this.path;
    }
    return result;
  }
}
