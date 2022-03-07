/**
 * A model of a cookie object used by the API Client.
 * @deprecated
 */
export interface ARCCookie {
  /**
   * Cookie name
   */
  name: string;
  /**
   * Cookie value
   */
  value?: string;
  /**
   * A string representing the domain the cookie belongs to
   * (e.g. "www.google.com", "example.com")
   */
  domain: string;
  /**
   * Cookie path
   */
  path: string;
  /**
   * A boolean, `true` if the cookie is a `host-only` cookie
   * (i.e. the request's host must exactly match the domain of the cookie),
   * or `false` otherwise.
   */
  hostOnly?: boolean;
  /**
   * A boolean, `true` if the cookie is marked as HttpOnly
   * (i.e. the cookie is inaccessible to client-side scripts),
   * or `false` otherwise.
   */
  httpOnly?: boolean;
  /**
   * A boolean, `true` if the cookie is marked as secure
   * (i.e. its scope is limited to secure channels, typically HTTPS),
   * or `false` otherwise.
   */
  secure?: boolean;
  /**
   * Whether or not a cookie is a session cookie this means the cookie is
   * deleted when the session ends.
   *
   * Session cookies are not used in the data export.
   */
  session?: boolean;
  /**
   * A timestamp when the cookie expires
   */
  expires?: number;
}
