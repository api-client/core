import { CookieEventTypes } from './CookieEventTypes.js';
import { IHttpCookie } from "../../models/HttpCookie.js";
import { ContextEventDetailWithResult, ContextEvent, ContextChangeRecord, ContextUpdateEvent, ContextStateUpdateEvent } from "../BaseEvents.js";

export interface ICookieDomainListDetail {
  domain: string;
}

export interface ICookieUrlListDetail {
  url: string;
}

export interface ICookieItemsDetail {
  cookies: IHttpCookie[];
}

export interface ICookieDetail {
  cookie: IHttpCookie;
}

export interface ICookieDeleteUrlDetail {
  url: string;
  name?: string
}

export class CookieEvents {
  /**
   * Lists all projects in the data store.
   * This does not return the whole project record. Instead it only returns the index object of the project.
   * 
   * @param target The target on which to dispatch the event
   * @returns The list of project index objects.
   */
  static async listAll(target: EventTarget): Promise<IHttpCookie[] | undefined> {
    const detail: ContextEventDetailWithResult<IHttpCookie[]> = {};
    const e = new CustomEvent(CookieEventTypes.listAll, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param target The target on which to dispatch the event
   * @param domain The cookie domain
   * @returns The list of project index objects.
   */
  static async listDomain(target: EventTarget, domain: string): Promise<IHttpCookie[] | undefined> {
    const detail: ICookieDomainListDetail = { domain };
    const e = new ContextEvent<ICookieDomainListDetail, IHttpCookie[]>(CookieEventTypes.listDomain, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param target The target on which to dispatch the event
   * @param url The cookie URL
   * @returns The list of project index objects.
   */
  static async listUrl(target: EventTarget, url: string): Promise<IHttpCookie[] | undefined> {
    const detail: ICookieUrlListDetail = { url };
    const e = new ContextEvent<ICookieUrlListDetail, IHttpCookie[]>(CookieEventTypes.listUrl, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes cookies from the store.
   * 
   * @param target The target on which to dispatch the event
   * @param cookies The list of cookies to remove
   */
  static async delete(target: EventTarget, cookies: IHttpCookie[]): Promise<void> {
    const detail: ICookieItemsDetail = { cookies };
    const e = new ContextEvent<ICookieItemsDetail, void>(CookieEventTypes.delete, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes cookies from the store.
   * 
   * @param target The target on which to dispatch the event
   * @param url The url associated with the cookie. Depending on the session mechanism the URL or the domain and the path is used.
   * @param name The name of the cookie to remove. When not set all cookies are removed for the given URL.
   */
  static async deleteUrl(target: EventTarget, url: string, name?: string): Promise<void> {
    const detail: ICookieDeleteUrlDetail = { url, name };
    const e = new ContextEvent<ICookieDeleteUrlDetail, void>(CookieEventTypes.deleteUrl, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates a cookie in the store.
   * 
   * @param target The target on which to dispatch the event
   * @param cookie A cookie to update
   * @returns The change record of the updated cookie.
   */
  static async update(target: EventTarget, cookie: IHttpCookie): Promise<ContextChangeRecord<IHttpCookie> | undefined> {
    const e = new ContextUpdateEvent(CookieEventTypes.update, { item: cookie });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates a cookie in the store in a bulk operation.
   * 
   * @param target The target on which to dispatch the event
   * @param cookies A list of cookies to update
   * @returns The change record of the updated cookie.
   */
  static async updateBulk(target: EventTarget, cookies: IHttpCookie[]): Promise<void> {
    const detail: ICookieItemsDetail = { cookies };
    const e = new ContextEvent<ICookieItemsDetail, void>(CookieEventTypes.updateBulk, detail);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Events related to a state of a cookie store.
   */
  static get State(): typeof StateEvents {
    return StateEvents;
  }
}

class StateEvents {
  /**
   * Event dispatched when a cookie was deleted from the context store
   * @param target The target on which to dispatch the event
   * @param cookie The schema of the removed cookie
   */
  static delete(target: EventTarget, cookie: IHttpCookie): void {
    const e = new CustomEvent<ICookieDetail>(CookieEventTypes.State.delete, {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail: { cookie },
    });
    target.dispatchEvent(e);
  }

  /**
   * Event dispatched when a cookie was deleted from the context store
   * @param target The target on which to dispatch the event
   * @param record The change record.
   */
  static update(target: EventTarget, record: ContextChangeRecord<IHttpCookie>): void {
    const e = new ContextStateUpdateEvent<IHttpCookie>(CookieEventTypes.State.update, record);
    target.dispatchEvent(e);
  }
}
