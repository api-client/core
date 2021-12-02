import { ActionTypeEnum, RequestDataSourceEnum, ResponseDataSourceEnum, OperatorEnum } from './Enums';
import { IActionIterator, ActionIterator } from './ActionIterator';
import { IConditionView, ConditionView } from './ConditionView';
import { Condition as LegacyCondition } from '../legacy/actions/Actions';

export const Kind = 'ARC#Condition';

/**
 * A base interface describing a configuration to extract data from a request or a response.
 */
export interface IBaseCondition {
  /**
   * The main data source. Either the request or the response object.
   * This is required when the `source` is not equal to `value. In this case it is ignored
   */
  type?: ActionTypeEnum;
  /**
   * Source of the data.
   */
  source: RequestDataSourceEnum | ResponseDataSourceEnum | 'value';
  /**
   * The path to the data. When `iteratorEnabled` is set then this
   * is a path counting from an array item. When not set an entire value of `source` is used.
   */
  path?: string;
  /**
   * This is only used when `source` is set to `value`. The data is not extracted from any of the request fields but this value is used.
   */
  value?: string;
}

/**
 * A configuration that extracts complex data from arrays.
 */
export interface IDataSourceConfiguration extends IBaseCondition {
  /**
   * When set the iterator configuration is enabled
   */
  iteratorEnabled?: boolean;
  /**
   * Array search configuration.
   */
  iterator?: IActionIterator;
}

/**
 * Describes action's condition configuration.
 */
export interface ICondition extends IDataSourceConfiguration {
  kind: 'ARC#Condition',
  /**
   * The value to compare to the result of extracted from the data source value.
   * Usually it is a string. For `statuscode` acceptable value is a number.
   */
  predictedValue?: string | number;
  /**
   * The comparison operator.
   */
  operator?: OperatorEnum;
  /**
   * Whether the condition always pass.
   * The condition is not really checked, values can be empty. The condition check always returns `true`.
   */
  alwaysPass?: boolean;
  /**
   * Options related to the UI state in the application.
   */
  view?: IConditionView;
}

export class Condition {
  kind = Kind;
  /**
   * The main data source. Either the request or the response object.
   * This is required when the `source` is not equal to `value. In this case it is ignored
   */
  type?: ActionTypeEnum;
  /**
   * Source of the data.
   */
  source: RequestDataSourceEnum | ResponseDataSourceEnum | 'value' = RequestDataSourceEnum.url;
  /**
   * The path to the data. When `iteratorEnabled` is set then this
   * is a path counting from an array item. When not set an entire value of `source` is used.
   */
  path?: string;
  /**
   * This is only used when `source` is set to `value`. The data is not extracted from any of the request fields but this value is used.
   */
  value?: string;
  /**
   * When set the iterator configuration is enabled
   */
  iteratorEnabled?: boolean;
  /**
   * Array search configuration.
   */
  iterator?: ActionIterator;
  /**
   * The value to compare to the result of extracted from the data source value.
   * Usually it is a string. For `statuscode` acceptable value is a number.
   */
  predictedValue?: string | number;
  /**
   * The comparison operator.
   */
  operator?: OperatorEnum;
  /**
   * Whether the condition always pass.
   * The condition is not really checked, values can be empty. The condition check always returns `true`.
   */
  alwaysPass?: boolean;
  /**
   * Options related to the UI state in the application.
   */
  view?: ConditionView;

  static fromLegacy(runnable: LegacyCondition): Condition {
    const { source, alwaysPass, iterator, iteratorEnabled, operator, path, predictedValue, type, value, view } = runnable;
    const init: ICondition = {
      kind: Kind,
      source: source as RequestDataSourceEnum | ResponseDataSourceEnum | 'value',
      alwaysPass,
      iteratorEnabled,
      path,
      predictedValue,
      view,
      value,
    };
    if (iterator) {
      init.iterator = ActionIterator.fromLegacy(iterator).toJSON();
    }
    if (operator) {
      switch (operator) {
        case 'contains': init.operator = OperatorEnum.contains; break;
        case 'equal': init.operator = OperatorEnum.equal; break;
        case 'greater-than': init.operator = OperatorEnum.greaterThan; break;
        case 'greater-than-equal': init.operator = OperatorEnum.greaterThanEqual; break;
        case 'less-than': init.operator = OperatorEnum.lessThan; break;
        case 'less-than-equal': init.operator = OperatorEnum.lessThanEqual; break;
        case 'not-equal': init.operator = OperatorEnum.notEqual; break;
        case 'regex': init.operator = OperatorEnum.regex; break;
      }
    }
    if (type) {
      switch (type) {
        case 'request': init.type = ActionTypeEnum.request; break;
        case 'response': init.type = ActionTypeEnum.response; break;
      }
    }
    return new Condition(init);
  }

  constructor(input?: string | ICondition) {
    let init: ICondition;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        source: RequestDataSourceEnum.url,
      };
    }
    this.new(init);
  }

  new(init: ICondition): void {
    const { source = RequestDataSourceEnum.url, alwaysPass, iterator, iteratorEnabled, operator, path, predictedValue, type, value, view } = init;
    this.source = source;
    if (typeof alwaysPass === 'boolean') {
      this.alwaysPass = alwaysPass;
    } else {
      this.alwaysPass = undefined;
    }
    if (iterator) {
      this.iterator = new ActionIterator(iterator);
    } else {
      this.iterator = undefined;
    }
    if (typeof iteratorEnabled === 'boolean') {
      this.iteratorEnabled = iteratorEnabled;
    } else {
      this.iteratorEnabled = undefined;
    }
    if (operator) {
      this.operator = operator;
    } else {
      this.operator = undefined;
    }
    if (path) {
      this.path = path;
    } else {
      this.path = undefined;
    }
    if (predictedValue) {
      this.predictedValue = predictedValue;
    } else {
      this.predictedValue = undefined;
    }
    if (type) {
      this.type = type;
    } else {
      this.type = undefined;
    }
    if (value) {
      this.value = value;
    } else {
      this.value = undefined;
    }
    if (view) {
      this.view = new ConditionView(view);
    } else {
      this.view = undefined;
    }
  }

  toJSON(): ICondition {
    const result: ICondition = {
      source: this.source,
      kind: Kind,
    };
    if (this.type) {
      result.type = this.type;
    }
    if (this.path) {
      result.path = this.path;
    }
    if (this.value) {
      result.value = this.value;
    }
    if (typeof this.iteratorEnabled === 'boolean') {
      result.iteratorEnabled = this.iteratorEnabled;
    }
    if (this.iterator) {
      result.iterator = this.iterator.toJSON();
    }
    if (['number', 'string'].includes(typeof this.predictedValue)) {
      result.predictedValue = this.predictedValue;
    }
    if (this.operator) {
      result.operator = this.operator;
    }
    if (typeof this.alwaysPass === 'boolean') {
      result.alwaysPass = this.alwaysPass;
    }
    if (this.view) {
      result.view = this.view.toJSON();
    }
    return result;
  }
}
