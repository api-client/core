import { CookieSameSiteType } from '../../models/HttpCookie.js';

/**
 * Cookie creation options.
 */
export interface CookieOptions {
  'max-age'?: number;
  /**
   * When the cookie expires.
   * Note that this value is parsed to a timestamp in the Cookie class.
   */
  expires?: Date | number | string;
  /**
   * A string representing the domain the cookie belongs to
   * (e.g. "www.google.com", "example.com")
   */
  domain?: string;
  /**
   * Cookie path
   */
  path?: string;
  /**
   * A boolean, `true` if the cookie is marked as secure
   * (i.e. its scope is limited to secure channels, typically HTTPS),
   * or `false` otherwise.
   */
  secure?: boolean;
  /**
   * A boolean, `true` if the cookie is marked as HttpOnly
   * (i.e. the cookie is inaccessible to client-side scripts),
   * or `false` otherwise.
   */
  httpOnly?: boolean;
  /**
   * A boolean, `true` if the cookie is a `host-only` cookie
   * (i.e. the request's host must exactly match the domain of the cookie),
   * or `false` otherwise.
   */
  hostOnly?: boolean;
  /**
   * The SameSite attribute of the Set-Cookie HTTP response header allows you to declare if your cookie should be restricted to a first-party or same-site context.
   */
  sameSite?: CookieSameSiteType;
}

/* eslint-disable no-control-regex */
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * A Cookie object.
 * It is based on https://github.com/pillarjs/cookies/blob/master/lib/cookies.js
 */
export class Cookie {
  protected _maxAge?: number;
  protected _expires: number;
  protected _domain?: string;
  name: string;
  value: string;
  created: number;
  lastAccess: number;
  persistent?: boolean;
  hostOnly?: boolean;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: CookieSameSiteType;

  /**
   * Constructs a new cookie.
   *
   * @param name Cookie name
   * @param value Cookie value
   * @param opts Additional cookie attributes.
   */
  constructor(name: string, value = '', opts: CookieOptions = {}) {
    if (!fieldContentRegExp.test(name)) {
      throw new TypeError('Argument `name` is invalid');
    }
    if (value && !fieldContentRegExp.test(value)) {
      throw new TypeError('Argument `value` is invalid');
    }
    if (opts.path && !fieldContentRegExp.test(opts.path)) {
      throw new TypeError('Option `path` is invalid');
    }
    if (opts.domain && !fieldContentRegExp.test(opts.domain)) {
      throw new TypeError('Option `domain` is invalid');
    }
    this._expires = 0;
    this._domain = undefined;
    this._maxAge = undefined;
    this.name = name;
    this.value = value;
    this.created = Date.now();
    this.lastAccess = this.created;

    if ('max-age' in opts) {
      this.maxAge = opts['max-age'];
    } else if (typeof opts.expires !== 'undefined') {
      this.setExpires(opts.expires);
    } else {
      this.persistent = false;
      // see http://stackoverflow.com/a/11526569/1127848
      this._expires = new Date(8640000000000000).getTime();
    }
    if ('hostOnly' in opts) {
      this.hostOnly = opts.hostOnly;
    }
    if ('domain' in opts) {
      this.domain = opts.domain;
    } else {
      this.hostOnly = false;
    }
    if ('path' in opts) {
      this.path = opts.path;
    }
    if ('secure' in opts) {
      this.secure = opts.secure;
    }
    if ('httpOnly' in opts) {
      this.httpOnly = opts.httpOnly;
    }
    if ('sameSite' in opts) {
      this.sameSite = opts.sameSite;
    }
  }

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
      this._expires = new Date(-8640000000000000).getTime();
    } else {
      let now = Date.now();
      now += typedMax * 1000;
      this._expires = now;
    }
    this.persistent = true;
  }

  /**
   * @return Returns a value of maxAge property
   */
  get maxAge(): number | undefined {
    return this._maxAge;
  }

  get ['max-age'](): number | undefined {
    return this.maxAge;
  }

  set ['max-age'](value: number | undefined) {
    this.maxAge = value;
  }

  /**
   * @param expires The value for expires
   */
  set expires(expires: number | Date | string) {
    const any = expires as unknown;
    if ((expires && typeof any === 'string') || any instanceof Date) {
      this.setExpires(any);
      return;
    }
    this._expires = expires as number;
    this.persistent = true;
  }

  /**
   * @return the current expires value
   */
  get expires(): number {
    return this._expires;
  }

  /**
   * @param domain The cookie domain
   */
  set domain(domain: string | undefined) {
    this._domain = domain;
    if (!domain) {
      this.hostOnly = false;
    } else {
      this.hostOnly = true;
    }
  }

  /**
   * @return The cookie domain
   */
  get domain(): string | undefined {
    return this._domain;
  }

  get samesite(): CookieSameSiteType | undefined {
    return this.sameSite;
  }

  set samesite(value: CookieSameSiteType | undefined) {
    this.sameSite = value;
  }

  get httponly(): boolean | undefined {
    return this.httpOnly;
  }

  set httponly(value: boolean | undefined) {
    this.httpOnly = value;
  }

  /**
   * @return Cookie's `name=value` string.
   */
  toString(): string {
    const { name, value } = this;
    return `${name}=${value}`;
  }

  /**
   * Returns a Cookie as a HTTP header string.
   * @return Cookie string as a HTTP header value
   */
  toHeader(): string {
    let header = this.toString();
    let expires;
    if (this._expires) {
      expires = new Date(this._expires);
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
    if (sameSite) {
      header += `; SameSite=${sameSite}`;
    }
    if (secure) {
      header += `; Secure`;
    }
    return header;
  }

  /**
   * Override toJSON behaviour so it will eliminate
   * all _* properties and replace it with a proper ones.
   *
   * @return {object}
   */
  toJSON(): Record<string, string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy: any = {};
    const keys: (keyof Cookie)[] = Object.keys(this) as (keyof Cookie)[];
    keys.forEach((key) => {
      if (key.indexOf('_') === 0) {
        const realKey = key.substring(1);
        copy[realKey] = this[key];
      } else {
        copy[key] = this[key];
      }
    });
    return copy;
  }

  /**
   * Sets value for `expirers` propr from other types.
   * @param expires The value for `expires`
   */
  setExpires(expires: Date | string | number): void {
    let value: number;
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
      value = 0;
    }
    this.expires = value;
  }
}
