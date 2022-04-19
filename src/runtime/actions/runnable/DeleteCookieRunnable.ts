import { IHttpRequest } from '../../../models/HttpRequest.js';
import { ActionRunnable } from './ActionRunnable.js';
import { IDeleteCookieAction } from '../../../models/actions/runnable/DeleteCookieAction.js';
import { Events } from '../../../events/Events.js';
import { IRequestLog } from '../../../models/RequestLog.js';

export class DeleteCookieRunnable extends ActionRunnable {
  async response(log: IRequestLog): Promise<void> {
    if (!log.request) {
      return;
    }
    const config = this.config as IDeleteCookieAction;
    let url;
    if (config.useRequestUrl) {
      url = log.request.url;
    } else {
      url = config.url;
    }
    if (!url) {
      return;
    }
    Events.Cookie.deleteUrl(this.eventTarget, url, config.name);
  }

  async request(request: IHttpRequest): Promise<void> {
    const config = this.config as IDeleteCookieAction;

    let url;
    if (config.useRequestUrl) {
      url = request.url;
    } else {
      url = config.url;
    }
    if (!url) {
      return;
    }
    Events.Cookie.deleteUrl(this.eventTarget, url, config.name);
  } 
}
