import { ARCCookie as LegacyARCCookie } from './legacy/models/Cookies.js';

export type CookieSameSiteType = 'unspecified' | 'no_restriction' | 'lax' | 'strict';
export type CookieChangeReason = 'explicit' | 'overwrite' | 'expired' | 'evicted' | 'expired-overwrite';
// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

export interface IElectronCookie {
  name: string;
  value: string;
  /**
   * The domain of the cookie; this will be normalized with a preceding dot so that it's also valid for subdomains.
   */
  domain?: string;
  /**
   * Whether the cookie is a host-only cookie; this will only be true if no domain was passed.
   */
  hostOnly?: boolean;
  /**
   * The path of the cookie.
   */
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  session?: boolean;
  expirationDate?: number;
  sameSite?: CookieSameSiteType;
}

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
  sameSite?: CookieSameSiteType;
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
  session?: boolean = true;
  /**
   * The Same Site policy applied to this cookie. Can be `unspecified`, `no_restriction`, `lax` or `strict`.
   * @default unspecified
   */
  sameSite: CookieSameSiteType = 'unspecified';

  protected _domain?: string;
  protected _maxAge?: number;
  protected _expirationDate?: number | undefined;

  /**
   * @param max The max age value
   */
  set maxAge(max: number | undefined) {
    const typedMax = Number(max);
    if (Number.isNaN(typedMax)) {
      return;
    }
    
    this._maxAge = typedMax;
    if (typedMax <= 0) {
      // see http://stackoverflow.com/a/11526569/1127848
      // and https://tools.ietf.org/html/rfc6265#section-5.2.2
      this._expirationDate = -8640000000000000;
    } else {
      let now = Date.now();
      now += typedMax * 1000;
      this._expirationDate = now;
    }
    this.session = false;
  }

  /**
   * @return Returns a value of maxAge property
   */
  get maxAge(): number | undefined {
    return this._maxAge;
  }

  /**
   * The expiration date of the cookie as the number of seconds since the UNIX epoch.
   * Not provided for session cookies.
   */
  set expirationDate(expires: number | Date | string | undefined) {
    this.setExpirationTime(expires);
  }

  get expirationDate(): number | undefined {
    return this._expirationDate;
  }

  /**
   * The domain of the cookie; this will be normalized with a preceding dot so that
   * it's also valid for subdomains.
   */
  set domain(domain: string | undefined) {
    this._domain = domain;
    if (!domain) {
      this.hostOnly = false;
    } else {
      this.hostOnly = true;
    }
  }
  
  get domain(): string | undefined {
    return this._domain;
  }

  // get samesite(): CookieSameSiteType | undefined {
  //   return this.sameSite;
  // }

  set samesite(value: CookieSameSiteType | undefined) {
    this.sameSite = value || 'unspecified';
  }

  // get httponly(): boolean | undefined {
  //   return this.httpOnly;
  // }

  set httponly(value: boolean | undefined) {
    this.httpOnly = value;
  }

  // get hostonly(): boolean | undefined {
  //   return this.hostOnly;
  // }

  set hostonly(value: boolean | undefined) {
    this.hostOnly = value;
  }

  // get ['max-age'](): number | undefined {
  //   return this.maxAge;
  // }

  set ['max-age'](value: number | undefined) {
    this.maxAge = value;
  }

  set expires(value: string | number | Date | undefined) {
    this.expirationDate = value;
  }

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

  static fromValue(name: string, value = ''): HttpCookie {
    const init: IHttpCookie = {
      name,
      value,
      sameSite: 'unspecified',
    };
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
    if (name && !fieldContentRegExp.test(name)) {
      throw new TypeError('Argument `name` is invalid');
    }
    if (value && !fieldContentRegExp.test(value)) {
      throw new TypeError('Argument `value` is invalid');
    }
    this.name = name;
    this.value = value;
    this.sameSite = sameSite;
    if (typeof path === 'string') {
      if (!fieldContentRegExp.test(path)) {
        throw new TypeError('Option `path` is invalid');
      }
      this.path = path;
    } else {
      this.path = undefined;
    }
    if (domain) {
      if (!fieldContentRegExp.test(domain)) {
        throw new TypeError('Option `domain` is invalid');
      }
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
      this.session = !this.expirationDate;
    }
  }

  /**
   * Sets value for `expirationDate` property.
   * @param expires The value as string, date, or a number
   */
  setExpirationTime(expires: Date | string | number | undefined): void {
    let value: number | undefined;
    if (expires instanceof Date) {
      value = expires.getTime();
    } else if (typeof expires === 'string') {
      const tmp = new Date(expires);
      if (tmp.toString() === 'Invalid Date') {
        value = 0;
      } else {
        value = tmp.getTime();
      }
    } else if (typeof expires === 'number') {
      value = expires;
    } else {
      value = undefined;
    }
    this._expirationDate = value;
    this.session = !value;
  }

  /**
   * @return Cookie's `name=value` string.
   */
  toString(): string {
    const { name, value } = this;
    return `${name}=${value}`;
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

  /**
   * Returns a Cookie as a HTTP header string.
   * @return Cookie string as a HTTP header value
   */
  toHeader(): string {
    let header = this.toString();
    let expires;
    if (this._expirationDate) {
      expires = new Date(this._expirationDate);
      if (expires.toString() === 'Invalid Date') {
        expires = new Date(0);
      }
    }
    if (expires) {
      header += `; expires=${expires.toUTCString()}`;
    }
    const { path, domain, httpOnly, sameSite, secure } = this;
    if (path) {
      header += `; path=${path}`;
    }
    if (domain) {
      header += `; domain=${domain}`;
    }
    if (httpOnly) {
      header += `; httpOnly=${httpOnly}`;
    }
    switch (sameSite) {
      case 'lax': header += `; SameSite=Lax`; break;
      case 'no_restriction': header += `; SameSite=None`; break;
      case 'strict': header += `; SameSite=Strict`; break;
    }
    if (secure || sameSite === 'strict') {
      header += `; Secure`;
    }
    return header;
  }
}
