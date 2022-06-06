import { RequestActions as LegacyRequestActions } from '../../models/legacy/request/ArcRequest.js';
import { RunnableAction as LegacyRunnable, Condition as LegacyCondition, Action as LegacyAction, SetCookieConfig, SetVariableConfig, DeleteCookieConfig, DataSourceConfiguration } from '../../models/legacy/actions/Actions.js';
import { IHttpActionFlow, IHttpAction, IHttpCondition, ActionSourceEnum, ActionRequestDataEnum, ActionResponseDataEnum, ActionOperatorEnum, IActionStep, ISetDataStep, SetDataStepKind, IReadDataStep, ReadDataStepKind, ISetCookieStep, SetCookieStepKind, IDeleteCookieStep, DeleteCookieStepKind } from './HttpActions.js';
import { AmfNamespace } from '../../amf/definitions/Namespace.js';

/**
 * Allows to translate the old ARC actions into Action flows.
 */
export class LegacyTranslator {
  static translate(action: LegacyRequestActions): IHttpActionFlow[] {
    const { request, response } = action;
    const result: IHttpActionFlow[] = [];

    if (Array.isArray(request) && request.length) {
      const flow: IHttpActionFlow = {
        trigger: 'request',
        actions: this._translateRunnables(request),
      };
      result.push(flow);
    }

    if (Array.isArray(response) && response.length) {
      const flow: IHttpActionFlow = {
        trigger: 'response',
        actions: this._translateRunnables(response),
      };
      result.push(flow);
    }
    return result;
  }

  protected static _translateRunnables(runnables: LegacyRunnable[]): IHttpAction[] {
    const result: IHttpAction[] = [];
    runnables.forEach((runnable) => {
      const actions = this._translateRunnable(runnable);
      actions.forEach(item => result.push(item));
    });
    return result;
  }

  protected static _translateRunnable(runnable: LegacyRunnable): IHttpAction[] {
    const result: IHttpAction[] = [];
    const { actions, condition } = runnable;
    actions.forEach((action) => {
      const current: IHttpAction = {
        steps: this._translateAction(action),
      };
      if (condition) {
        current.condition = this._translateCondition(condition);
      }
      result.push(current);
    });
    return result;
  }

  protected static _translateCondition(runnable: LegacyCondition): IHttpCondition | undefined {
    const { source, alwaysPass, operator, path, predictedValue, type } = runnable;
    if (alwaysPass) {
      // in the flow, if there's no condition the steps are always executed.
      return undefined
    }

    const result: IHttpCondition = {};
    if (typeof path === 'string') {
      result.path = path;
    }
    if (type) {
      switch (type) {
        case 'request': result.source = ActionSourceEnum.request; break;
        case 'response': result.source = ActionSourceEnum.response; break;
      }
    }
    if (type && source) {
      if (type === 'request') {
        result.data = source as ActionRequestDataEnum;
      }
      if (type === 'response') {
        result.data = source as ActionResponseDataEnum;
      }
    }
    if (predictedValue) {
      result.value = String(predictedValue);
    }
    if (operator) {
      switch (operator) {
        case 'contains': result.operator = ActionOperatorEnum.contains; break;
        case 'equal': result.operator = ActionOperatorEnum.equal; break;
        case 'greater-than': result.operator = ActionOperatorEnum.greaterThan; break;
        case 'greater-than-equal': result.operator = ActionOperatorEnum.greaterThanEqual; break;
        case 'less-than': result.operator = ActionOperatorEnum.lessThan; break;
        case 'less-than-equal': result.operator = ActionOperatorEnum.lessThanEqual; break;
        case 'not-equal': result.operator = ActionOperatorEnum.notEqual; break;
        case 'regex': result.operator = ActionOperatorEnum.regex; break;
      }
    }
    return result;
  }

  protected static _translateAction(item: LegacyAction): IActionStep[] {
    switch (item.name) {
      case 'set-cookie': return this._translateSetCookieAction(item);
      case 'set-variable': return this._translateSetVariableAction(item);
      case 'delete-cookie': return this._translateDeleteCookieAction(item);
      default: return [];
    }
  }

  protected static _translateSetCookieAction(item: LegacyAction): IActionStep[] {
    const legacy = item.config as SetCookieConfig;

    const steps: IActionStep[] = [];
    const ds = this._translateDataSource(legacy.source);
    steps.push(ds);

    const action: ISetCookieStep = {
      kind: SetCookieStepKind,
      name: legacy.name,
    };
    if (item.enabled === false) {
      action.enabled = item.enabled;
    }
    if (legacy.url) {
      action.url = legacy.url;
    }
    if (legacy.expires) {
      action.expires = legacy.expires;
    }
    if (typeof legacy.hostOnly === 'boolean') {
      action.hostOnly = legacy.hostOnly;
    }
    if (typeof legacy.httpOnly === 'boolean') {
      action.httpOnly = legacy.httpOnly;
    }
    if (typeof legacy.secure === 'boolean') {
      action.secure = legacy.secure;
    }
    if (typeof legacy.session === 'boolean') {
      action.session = legacy.session;
    }
    steps.push(action);
    
    return steps;
  }

  protected static _translateSetVariableAction(item: LegacyAction): IActionStep[] {
    const legacy = item.config as SetVariableConfig;

    const steps: IActionStep[] = [];
    const ds = this._translateDataSource(legacy.source);
    steps.push(ds);

    const action: ISetCookieStep = {
      kind: SetCookieStepKind,
      name: legacy.name,
    };
    if (item.enabled === false) {
      action.enabled = item.enabled;
    }
    steps.push(action);

    return steps;
  }

  protected static _translateDeleteCookieAction(item: LegacyAction): IActionStep[] {
    const legacy = item.config as DeleteCookieConfig;

    const steps: IActionStep[] = [];
    
    const action: IDeleteCookieStep = {
      kind: DeleteCookieStepKind,
    };
    if (item.enabled === false) {
      action.enabled = item.enabled;
    }
    if (legacy.name && !legacy.removeAll) {
      action.name = legacy.name;
    }
    if (legacy.url && !legacy.useRequestUrl) {
      action.url = legacy.url;
    }
    steps.push(action);

    return steps;
  }

  protected static _translateDataSource(source: DataSourceConfiguration): IActionStep {
    if (source.value) {
      const dataSet: ISetDataStep = {
        kind: SetDataStepKind,
        value: source.value,
        dataType: AmfNamespace.w3.xmlSchema.string,
      };
      return dataSet;
    }

    // Note, there's no way for us to translate the old "iterator" configuration
    // to the current syntax. We just drop it.

    const { path, type, source: legacySource } = source;
    const result: IReadDataStep = {
      kind: ReadDataStepKind,
    };

    if (typeof path === 'string') {
      result.path = path;
    }
    if (type) {
      switch (type) {
        case 'request': result.source = ActionSourceEnum.request; break;
        case 'response': result.source = ActionSourceEnum.response; break;
      }
    }
    if (type && legacySource) {
      if (type === 'request') {
        result.data = legacySource as ActionRequestDataEnum;
      }
      if (type === 'response') {
        result.data = legacySource as ActionResponseDataEnum;
      }
    }
    return result;
  }
}
