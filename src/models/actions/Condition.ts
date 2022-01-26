import { ActionTypeEnum, RequestDataSourceEnum, ResponseDataSourceEnum, OperatorEnum } from './Enums.js';
import { Condition as LegacyCondition } from '../legacy/actions/Actions.js';

export const Kind = 'ARC#Condition';

/**
 * A base interface describing a configuration to extract data from a request or a response.
 */
export interface IDataSource {
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
   * The path to the data.
   * For JSON value use https://jmespath.org/ syntax.
   * For XML use xpath.
   * For any other use a simple path to the data separated by dot (e.g. headers.content-type)
   */
  path?: string;
  /**
   * Only used when the `source` is `value`. The data extraction always returns this value.
   */
  value?: string;
}

/**
 * Describes action's condition configuration.
 */
export interface ICondition extends IDataSource {
  kind: 'ARC#Condition',
  /**
   * The comparison operator.
   */
  operator?: OperatorEnum;
  /**
   * Whether the condition always pass.
   * The condition is not really checked, values can be empty. The condition check always returns `true`.
   */
  alwaysPass?: boolean;
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
   * The path to the data.
   * For JSON value use https://jmespath.org/ syntax.
   * For XML use xpath.
   * For any other use a simple path to the data separated by dot (e.g. headers.content-type)
   */
  path?: string;
  /**
   * Only used when the `source` is `value`. The data extraction always returns this value.
   */
  value?: string;
  /**
   * The comparison operator.
   */
  operator?: OperatorEnum;
  /**
   * Whether the condition always pass.
   * The condition is not really checked, values can be empty. The condition check always returns `true`.
   */
  alwaysPass?: boolean;

  static defaultCondition(type=ActionTypeEnum.response): Condition {
    const init: ICondition = {
      kind: Kind,
      type,
      source: RequestDataSourceEnum.url,
      operator: OperatorEnum.equal,
      path: '',
      alwaysPass: false,
    };
    return new Condition(init);
  }

  static fromLegacy(runnable: LegacyCondition): Condition {
    const { source, alwaysPass, operator, path, predictedValue, type, value } = runnable;
    const init: ICondition = {
      kind: Kind,
      source: source as RequestDataSourceEnum | ResponseDataSourceEnum | 'value',
    };
    if (typeof alwaysPass === 'boolean') {
      init.alwaysPass = alwaysPass;
    }
    if (typeof path === 'string') {
      init.path = path;
    }
    if (path === 'value') {
      init.value = String(value);
    } else {
      init.value = String(predictedValue);
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

  static alwaysPass(type=ActionTypeEnum.request): Condition {
    const init: ICondition = {
      kind: Kind,
      type,
      source: 'value',
      alwaysPass: true,
    };
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
    const { source = RequestDataSourceEnum.url, alwaysPass, operator, path, type, value } = init;
    this.source = source;
    if (typeof alwaysPass === 'boolean') {
      this.alwaysPass = alwaysPass;
    } else {
      this.alwaysPass = undefined;
    }
    if (operator) {
      this.operator = operator;
    } else {
      this.operator = undefined;
    }
    if (typeof path === 'string') {
      this.path = path;
    } else {
      this.path = undefined;
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
    if (this.operator) {
      result.operator = this.operator;
    }
    if (typeof this.alwaysPass === 'boolean') {
      result.alwaysPass = this.alwaysPass;
    }
    return result;
  }
}
