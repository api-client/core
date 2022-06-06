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
  abstract setCookies(url: string, cookies: IHttpCookie[] | HttpCookie[]): Promise<void>;

  /**
   * Deletes cookies by the URL and optionally by name.
   * 
   * @param url The URL to delete the cookies for.
   * @param name The name of the cookie. When not set it deletes all cookies for the URL.
   */
  abstract deleteCookies(url: string, name?: string): Promise<void>;
}
