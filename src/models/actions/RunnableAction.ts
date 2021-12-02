import { ICondition, Condition } from './Condition';
import { ActionTypeEnum } from './Enums';
import { IAction, Action } from './Action';
import { RunnableAction as LegacyRunnable } from '../legacy/actions/Actions'

/**
 * An interface representing a runnable set of action in a condition.
 * For the actions to be executed the condition first has to be met.
 * The condition can be configured to always pass by setting the `alwaysPass` property.
 */
export interface IRunnableAction {
  /**
   * The condition to be checked when executing the runnable,
   */
  condition: ICondition;
  /**
   * The type of the runnable. 
   * The `request` will only process HTTP request data. The `response` has both request and response data available.
   */
  type: ActionTypeEnum;
  /**
   * The list of actions to execute.
   */
  actions: IAction[];
  /**
   * Whether the entire runnable is enabled. This is checked before the condition is executed.
   */
  enabled: boolean;
}

export class RunnableAction {
  /**
   * The condition to be checked when executing the runnable,
   */
  condition: Condition = new Condition();
  /**
   * The type of the runnable. 
   * The `request` will only process HTTP request data. The `response` has both request and response data available.
   */
  type: ActionTypeEnum = ActionTypeEnum.response;
  /**
   * The list of actions to execute.
   */
  actions: Action[] = [];
  /**
   * Whether the entire runnable is enabled. This is checked before the condition is executed.
   */
  enabled = false;

  static fromLegacy(runnable: LegacyRunnable): RunnableAction {
    const { actions, condition, enabled, type=ActionTypeEnum.response, } = runnable;
    const init: IRunnableAction = {
      type: type as ActionTypeEnum,
      actions: [],
      enabled,
      condition: Condition.fromLegacy(condition).toJSON(),
    };
    if (Array.isArray(actions) && actions.length) {
      init.actions = actions.map(i => Action.fromLegacy(i).toJSON());
    }
    return new RunnableAction(init);
  }

  constructor(input?: string | IRunnableAction) {
    let init: IRunnableAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        condition: new Condition().toJSON(),
        type: ActionTypeEnum.response,
        actions: [],
        enabled: false,
      };
    }
    this.new(init);
  }

  new(init: IRunnableAction): void {
    const { enabled = false, condition, type = ActionTypeEnum.response, actions = [] } = init;
    this.enabled = enabled;
    this.type = type;
    if (condition) {
      this.condition = new Condition(condition);
    } else {
      this.condition = new Condition();
    }
    if (Array.isArray(actions)) {
      this.actions = actions.map(i => new Action(i));
    } else {
      this.actions = [];
    }
  }

  toJSON(): IRunnableAction {
    const result: IRunnableAction = {
      enabled: this.enabled,
      type: this.type,
      condition: this.condition.toJSON(),
      actions: this.actions.map(i => i.toJSON()),
    };
    return result;
  }
}
