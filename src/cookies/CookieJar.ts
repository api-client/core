import { IHttpCookie, HttpCookie } from '../models/HttpCookie.js';

export abstract class CookieJar {
  /**
   * Requests the store to list all cookies that should be sent with the HTTP request.
   * 
   * @param url The request URL to match the cookies for.
   */
  abstract listCookies(url: string): Promise<HttpCookie[]>;

  /**
   * Writes cookies to the store.
   * 
   * @param url The request URL the cookies were set for.
   * @param cookies The list of cookies to store.
   */
  abstract setCookies(url: string, cookies: IHttpCookie | HttpCookie[]): Promise<void>;
}
