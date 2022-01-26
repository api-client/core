import { IHttpRequest } from '../../../models/HttpRequest.js';
import { IRequestLog } from '../../../models/RequestLog.js';

export abstract class ActionRunnable {
  /**
   * The specific action configuration.
   * This depends on the action.
   */
  config: unknown;
  eventTarget: EventTarget;

  constructor(config: unknown, eventTarget: EventTarget) {
    this.config = Object.freeze(config);
    this.eventTarget = eventTarget;
  }

  abstract request(request: IHttpRequest): Promise<void>;
  abstract response(log: IRequestLog): Promise<void>;
}
