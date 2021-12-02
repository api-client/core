import { ActionTypeEnum } from './Enums';
import { IActions } from './runnable/index';
import { IActionView, ActionView } from './ActionView';
import { Runnable, IRunnable } from './runnable/Runnable';
import { Kind as DeleteCookieKind, DeleteCookieAction, IDeleteCookieAction } from './runnable/DeleteCookieAction'
import { Kind as SetCookieKind, SetCookieAction, ISetCookieAction } from './runnable/SetCookieAction'
import { Kind as SetVariableKind, SetVariableAction, ISetVariableAction } from './runnable/SetVariableAction'
import { Action as LegacyAction } from '../legacy/actions/Actions'

export const Kind = 'ARC#Action';

/**
 * An interface representing a single action.
 */
export interface IAction {
  kind?: 'ARC#Action';
  /**
   * The type of the action. 
   * The `request` will only process HTTP request data. The `response` has both request and response data available.
   */
  type: ActionTypeEnum;
  /**
   * Action name.
   */
  name?: string;
  /**
   * Whether the action is enabled.
   */
  enabled?: boolean;
  /**
   * Action priority. The higher number the higher priority of execution.
   */
  priority?: number;
  /**
   * Action configuration
   */
  config?: IActions;
  /**
   * Whether or not the action is executed synchronously to request / response
   */
  sync?: boolean;
  /**
   * Whether or not the request should fail when the action fails.
   */
  failOnError?: boolean;
  /**
   * Options passed to the UI.
   */
  view?: IActionView;
}

export class Action {
  kind = Kind;
  /**
   * The type of the action. 
   * The `request` will only process HTTP request data. The `response` has both request and response data available.
   */
  type: ActionTypeEnum = ActionTypeEnum.response;
  /**
   * Action name.
   */
  name?: string;
  /**
   * Whether the action is enabled.
   */
  enabled?: boolean;
  /**
   * Action priority. The higher number the higher priority of execution.
   */
  priority?: number;
  /**
   * Action configuration
   */
  config?: Runnable;
  /**
   * Whether or not the action is executed synchronously to request / response
   */
  sync?: boolean;
  /**
   * Whether or not the request should fail when the action fails.
   */
  failOnError?: boolean;
  /**
   * Options passed to the UI.
   */
  view?: ActionView;

  static fromLegacy(item: LegacyAction): Action {
    const { priority, view, type, config, enabled, failOnError, name, sync } = item;
    const init: IAction = {
      kind: Kind,
      type: ActionTypeEnum.response,
      priority,
      view,
      config,
      enabled,
      failOnError,
      name,
      sync,
    };
    if (type) {
      switch (type) {
        case 'request': init.type = ActionTypeEnum.request; break;
        case 'response': init.type = ActionTypeEnum.response; break;
      }
    }
    return new Action(init);
  }

  constructor(input?: string | IAction) {
    let init: IAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        type: ActionTypeEnum.response,
      };
    }
    this.new(init);
  }

  new(init: IAction): void {
    const { type = ActionTypeEnum.response, name, enabled, priority, sync, failOnError, view, config } = init;
    this.kind = Kind;
    this.type = type;
    if (name) {
      this.name = name;
    } else {
      this.name = undefined;
    }
    if (typeof enabled === 'boolean') {
      this.enabled = enabled;
    } else {
      this.enabled = undefined;
    }
    if (typeof sync === 'boolean') {
      this.sync = sync;
    } else {
      this.sync = undefined;
    }
    if (typeof failOnError === 'boolean') {
      this.failOnError = failOnError;
    } else {
      this.failOnError = undefined;
    }
    if (typeof priority === 'number') {
      this.priority = priority;
    } else {
      this.priority = undefined;
    }
    if (view) {
      this.view = new ActionView(view);
    } else {
      this.view = undefined;
    }
    if (config) {
      this.setConfig(config);
    } else {
      this.config = undefined;
    }
  }

  toJSON(): IAction {
    const result: IAction = {
      kind: Kind,
      type: this.type,
    };
    if (this.name) {
      result.name = this.name;
    }
    if (this.view) {
      result.view = this.view.toJSON();
    }
    if (this.config) {
      result.config = this.config.toJSON() as IActions;
    }
    if (typeof this.enabled === 'boolean') {
      result.enabled = this.enabled;
    }
    if (typeof this.sync === 'boolean') {
      result.sync = this.sync;
    }
    if (typeof this.failOnError === 'boolean') {
      result.failOnError = this.failOnError;
    }
    if (typeof this.priority === 'number') {
      result.priority = this.priority;
    }
    return result;
  }

  setConfig(config: IRunnable): void {
    const { kind } = config;
    switch (kind) {
      case DeleteCookieKind: this.config = new DeleteCookieAction(config as IDeleteCookieAction); break;
      case SetCookieKind: this.config = new SetCookieAction(config as ISetCookieAction); break;
      case SetVariableKind: this.config = new SetVariableAction(config as ISetVariableAction); break;
    }
  }
}
