import { OperatorEnum } from './Enums.js';
import { IteratorConfiguration as LegacyIterator } from '../legacy/actions/Actions.js';

export interface IActionIterator {
  /**
   * The path to the property to use in the comparison.
   */
  path: string;
  /**
   * The value of the condition.
   */
  condition: string;
  /**
   * The comparison operator.
   */
  operator: OperatorEnum;
}

export class ActionIterator {
  /**
   * The path to the property to use in the comparison.
   */
  path = '';
  /**
   * The value of the condition.
   */
  condition = '';
  /**
   * The comparison operator.
   */
  operator: OperatorEnum = OperatorEnum.equal;

  static fromValues(path: string, operator: OperatorEnum, condition: string): ActionIterator {
    return new ActionIterator({
      path,
      operator,
      condition,
    });
  }

  static fromLegacy(input: LegacyIterator): ActionIterator {
    const { condition, operator, path } = input;
    const init: IActionIterator = {
      path,
      operator: OperatorEnum.equal,
      condition,
    };
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
    return new ActionIterator(init);
  }

  constructor(input?: string|IActionIterator) {
    let init: IActionIterator;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        path: '',
        condition: '',
        operator: OperatorEnum.equal,
      };
    }
    this.new(init);
  }

  new(init: IActionIterator): void {
    const { path='', condition='', operator = OperatorEnum.equal } = init;
    this.path = path;
    this.condition = condition;
    this.operator = operator;
  }

  toJSON(): IActionIterator {
    const result: IActionIterator = {
      path: this.path,
      condition: this.condition,
      operator: this.operator,
    };
    return result;
  }
}
