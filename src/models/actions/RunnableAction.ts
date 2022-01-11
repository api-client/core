import { ICondition, Condition } from './Condition.js';
import { IAction, Action } from './Action.js';
import { RunnableAction as LegacyRunnable } from '../legacy/actions/Actions.js';

export const Kind = 'ARC#RunnableAction';

/**
 * An interface representing a runnable set of action in a condition.
 * For the actions to be executed the condition first has to be met.
 * The condition can be configured to always pass by setting the `alwaysPass` property.
 */
export interface IRunnableAction {
  kind?: typeof Kind;
  /**
   * The condition to be checked when executing the runnable,
   */
  condition: ICondition;
  /**
   * The list of actions to execute.
   */
  actions: IAction[];
  /**
   * Whether the entire runnable is enabled. This is checked before the condition is executed.
   * An action is enabled by default.
   */
  enabled?: boolean;
}

export class RunnableAction {
  kind = Kind;
  /**
   * The condition to be checked when executing the runnable,
   */
  condition: Condition = new Condition();
  /**
   * The list of actions to execute.
   */
  actions: Action[] = [];
  /**
   * Whether the entire runnable is enabled. This is checked before the condition is executed.
   */
  enabled?: boolean;

  static fromLegacy(runnable: LegacyRunnable): RunnableAction {
    const result = new RunnableAction();
    result.fromLegacy(runnable);
    return result;
  }

  constructor(input?: string | IRunnableAction) {
    let init: IRunnableAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        condition: new Condition().toJSON(),
        actions: [],
        enabled: true,
      };
    }
    if (init.kind === Kind) {
      this.new(init);
    } else {
      this.fromLegacy((init as unknown) as LegacyRunnable);
    }
  }

  new(init: IRunnableAction): void {
    const { enabled, condition, actions } = init;
    this.enabled = enabled;
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
      condition: this.condition.toJSON(),
      actions: this.actions.map(i => i.toJSON()),
      kind: Kind,
    };
    if (typeof this.enabled === 'boolean') {
      result.enabled = this.enabled;
    }
    return result;
  }

  fromLegacy(runnable: LegacyRunnable): void {
    const { actions, condition, enabled } = runnable;
    if (typeof enabled === 'boolean') {
      this.enabled = enabled;
    }
    if (condition) {
      this.condition = Condition.fromLegacy(condition);
    } else {
      this.condition = new Condition();
    }
    if (Array.isArray(actions) && actions.length) {
      this.actions = actions.map(i => Action.fromLegacy(i));
    } else {
      this.actions = [];
    }
  }

  /**
   * Adds a new action to the list of runnable action.
   * 
   * @param schema The schema of the action
   * @returns Created instance of the action.
   */
  addAction(schema: IAction): Action;

  /**
   * Adds a new action to the list of runnable action.
   * 
   * @param schema The instance of the action
   * @returns The same instance of the action.
   */
  addAction(instance: Action): Action;
  
  addAction(value: Action | IAction): Action {
    if (!Array.isArray(this.actions)) {
      this.actions = [];
    }
    let finalAction: Action;
    if (value instanceof Action) {
      finalAction = value;
    } else {
      finalAction = new Action(value);
    }
    this.actions.push(finalAction);
    return finalAction;
  }
}
