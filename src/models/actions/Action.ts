import { ActionTypeEnum, ResponseDataSourceEnum, RequestDataSourceEnum } from './Enums.js';
import { IActions } from './runnable/index.js';
import { Runnable, IRunnable } from './runnable/Runnable.js';
import { Kind as DeleteCookieKind, DeleteCookieAction, IDeleteCookieAction } from './runnable/DeleteCookieAction.js';
import { Kind as SetCookieKind, SetCookieAction, ISetCookieAction } from './runnable/SetCookieAction.js';
import { Kind as SetVariableKind, SetVariableAction, ISetVariableAction } from './runnable/SetVariableAction.js';
import { Action as LegacyAction, SetCookieConfig, SetVariableConfig, DeleteCookieConfig } from '../legacy/actions/Actions.js';

export const Kind = 'ARC#Action';

/**
 * An interface representing a single action.
 */
export interface IAction {
  kind?: 'ARC#Action';
  /**
   * Action name.
   */
  name?: string;
  /**
   * Whether the action is enabled.
   * An action is enabled by default.
   * @default true
   */
  enabled?: boolean;
  /**
   * Action priority. The higher number the higher priority of execution.
   */
  priority?: number;
  /**
   * The action configuration. The schema depends on the action type.
   */
  config?: unknown;
  /**
   * Whether or not the action is executed synchronously to request / response
   */
  sync?: boolean;
  /**
   * Whether or not the request should fail when the action fails.
   */
  failOnError?: boolean;
}

export class Action {
  kind = Kind;
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

  static fromLegacy(item: LegacyAction): Action {
    const { priority, config, enabled, failOnError, name, sync } = item;
    let newConfig: IRunnable | undefined;
    switch (name) {
      case 'set-cookie': newConfig = SetCookieAction.fromLegacy(config as SetCookieConfig).toJSON(); break;
      case 'set-variable': newConfig = SetVariableAction.fromLegacy(config as SetVariableConfig); break;
      case 'delete-cookie': newConfig = DeleteCookieAction.fromLegacy(config as DeleteCookieConfig); break;
    }
    
    const init: IAction = {
      kind: Kind,
      priority,
    };
    if (typeof enabled === 'boolean') {
      init.enabled = enabled;
    }
    if (typeof failOnError === 'boolean') {
      init.failOnError = failOnError;
    }
    if (typeof sync === 'boolean') {
      init.sync = sync;
    }
    if (typeof name === 'string') {
      init.name = name;
    }
    if (newConfig) {
      init.config = newConfig;
    }
    return new Action(init);
  }

  /**
   * Creates a default configuration of an action
   */
  static defaultAction(): Action {
    const init: IAction = {
      name: 'New action',
      failOnError: false,
      priority: 0,
      sync: false,
      enabled: true,
    };
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
      };
    }
    this.new(init);
  }

  new(init: IAction): void {
    const { name, enabled, priority, sync, failOnError, config } = init;
    this.kind = Kind;
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
    if (config) {
      this.setConfig(config);
    } else {
      this.config = undefined;
    }
  }

  toJSON(): IAction {
    const result: IAction = {
      kind: Kind,
    };
    if (this.name) {
      result.name = this.name;
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

  setConfig(config: unknown): void {
    const { kind } = config as IRunnable;
    switch (kind) {
      case DeleteCookieKind: this.config = new DeleteCookieAction(config as IDeleteCookieAction); break;
      case SetCookieKind: this.config = new SetCookieAction(config as ISetCookieAction); break;
      case SetVariableKind: this.config = new SetVariableAction(config as ISetVariableAction); break;
      default: throw new Error(`Unknown action config.`)
    }
  }

  /**
   * The sort function for actions to sort them for the execution order.
   */
  static sortActions(a: Action, b: Action): number {
    const { priority: p1=0 } = a;
    const { priority: p2=0 } = b;
    if (p1 > p2) {
      return 1;
    }
    if (p2 > p1) {
      return -1;
    }
    return 0;
  }
}
