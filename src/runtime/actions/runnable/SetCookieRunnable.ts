import { IHttpRequest } from 'src/models/HttpRequest.js';
import { IHttpCookie } from 'src/models/HttpCookie.js';
import { ActionRunnable } from './ActionRunnable.js';
import { ISetCookieAction } from '../../../models/actions/runnable/SetCookieAction.js';
import { Events } from '../../../events/Events.js';
import { RequestDataExtractor } from '../../../data/RequestDataExtractor.js';
import { IRequestLog } from 'src/models/RequestLog.js';

export class SetCookieRunnable extends ActionRunnable {
  async request(request: IHttpRequest): Promise<void> {
    const config = this.config as ISetCookieAction;
    const value = await this.readRequestValue(request, config);
    if (typeof value === 'undefined') {
      throw new Error(`Cannot read value for the action`);
    }
    await this.setCookie(request, config, String(value));
  }

  async readRequestValue(request: IHttpRequest, config: ISetCookieAction): Promise<string | number | undefined> {
    const { source } = config;
    let value: string | number | undefined;
    if (source.source === 'value') {
      value = source.value;
    } else {
      const extractor = new RequestDataExtractor(request);
      value = await extractor.extract(source);
    }
    return value;
  }

  async setCookie(request: IHttpRequest, config: ISetCookieAction, value: string): Promise<void> {
    let url;
    if (config.useRequestUrl) {
      url = request.url;
    } else {
      url = config.url;
    }
    if (!url) {
      throw new Error('The set cookie action has no URL defined.');
    }
    const parser = new URL(url);
    const cookie: IHttpCookie = {
      name: config.name,
      value,
      sameSite: 'unspecified',
      domain: parser.host, // parser.hostname,
      path: parser.pathname,
    };
    if (config.expires) {
      const typedNumber = Number(config.expires);
      if (Number.isNaN(typedNumber)) {
        const exp = new Date(config.expires);
        cookie.expirationDate = exp.getTime();
      } else {
        const exp = new Date(typedNumber);
        cookie.expirationDate = exp.getTime();
      }
    }
    if (typeof config.hostOnly === 'boolean') {
      cookie.hostOnly = config.hostOnly;
    }
    if (typeof config.httpOnly === 'boolean') {
      cookie.httpOnly = config.httpOnly;
    }
    if (typeof config.session === 'boolean') {
      cookie.session = config.session;
    }
    if (typeof config.secure === 'boolean') {
      cookie.secure = config.secure;
    }
    Events.Cookie.update(this.eventTarget, cookie);
  }

  async response(log: IRequestLog): Promise<void> {
    if (!log.request || !log.response) {
      return;
    }
    const config = this.config as ISetCookieAction;
    const { source } = config;
    let value: string | number | undefined;
    if (source.source === 'value') {
      value = source.value;
    } else {
      const extractor = new RequestDataExtractor(log.request, log.response);
      value = await extractor.extract(source);
    }
    if (typeof value === 'undefined') {
      throw new Error(`Cannot read value for the action`);
    }
    await this.setCookie(log.request, config, String(value));
  }
}
