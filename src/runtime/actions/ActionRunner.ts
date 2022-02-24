import { Action } from '../../models/actions/Action.js';
import { Runnable as ModelRunnable } from '../../models/actions/runnable/Runnable.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { IRequestLog } from '../../models/RequestLog.js';
import { Kind as DeleteCookieKind } from '../../models/actions/runnable/DeleteCookieAction.js';
import { Kind as SetCookieKind } from '../../models/actions/runnable/SetCookieAction.js';
import { Kind as SetVariableKind } from '../../models/actions/runnable/SetVariableAction.js';
import { ActionRunnable } from './runnable/ActionRunnable.js';
import { DeleteCookieRunnable } from './runnable/DeleteCookieRunnable.js';
import { SetCookieRunnable } from './runnable/SetCookieRunnable.js';
import { SetVariableRunnable } from './runnable/SetVariableRunnable.js';

/**
 * A class that is responsible for running a single action.
 */
export class ActionRunner {
  action: Action;
  eventTarget: EventTarget;

  constructor(action: Action, eventTarget: EventTarget) {
    this.action = action;
    this.eventTarget = eventTarget;
  }

  async request(request: IHttpRequest): Promise<void> {
    const runnable = this.getActionRunnable();
    if (!runnable) {
      throw new Error(`Invalid action configuration. The runnable configuration is not defined.`);
    }
    const { action } = this;
    if (action.sync === false) {
      this.requestAsync(runnable, request);
      return;
    }
    await runnable.request(request);
  }

  async requestAsync(runnable: ActionRunnable, request: IHttpRequest): Promise<void> {
    const { action } = this;
    try {
      await runnable.request(request);
    } catch (e) {
      const err = e as Error;
      console.error(`Unable to run a request action: ${action.name || 'unknown name'}: ${err.message}`);
    }
  }

  getActionRunnable(): ActionRunnable | undefined {
    const { action, eventTarget } = this;
    const config = action.config as ModelRunnable;
    if (!config) {
      return;
    }
    switch (config.kind) {
      case DeleteCookieKind: return new DeleteCookieRunnable(config.toJSON(), eventTarget);
      case SetCookieKind: return new SetCookieRunnable(config.toJSON(), eventTarget);
      case SetVariableKind: return new SetVariableRunnable(config.toJSON(), eventTarget);
    }
  }

  async response(log: IRequestLog): Promise<void> {
    const runnable = this.getActionRunnable();
    if (!runnable) {
      throw new Error(`Invalid action configuration. The runnable configuration is not defined.`);
    }
    const { action } = this;
    if (action.sync === false) {
      this.responseAsync(runnable, log);
      return;
    }
    await runnable.response(log);
  }

  async responseAsync(runnable: ActionRunnable, log: IRequestLog): Promise<void> {
    const { action } = this;
    try {
      await runnable.response(log);
    } catch (e) {
      const err = e as Error;
      console.error(`Unable to run a response action: ${action.name || 'unknown name'}: ${err.message}`);
    }
  }
}
