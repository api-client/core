/* eslint-disable @typescript-eslint/no-explicit-any */
import { OperatorEnum } from '../../models/actions/Enums.js';

/**
 * Checks if values equal.
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if objects matches.
 */
export function isEqual(value: any, condition: any): boolean {
  if (value === condition) {
    return true;
  }
  let valueTyped = value;
  let conditionTyped = condition;
  if (typeof value !== 'undefined') {
    valueTyped = String(value);
  }
  if (typeof condition !== 'undefined') {
    conditionTyped = String(condition);
  }
  const typedConditionNumber = Number(conditionTyped);
  if (!Number.isNaN(typedConditionNumber)) {
    conditionTyped = typedConditionNumber;
    valueTyped = Number(valueTyped);
  }
  return conditionTyped === valueTyped;
}

/**
 * Opposite of `isEqual()`.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @return False if objects matches.
 */
export function isNotEqual(value: any, condition: any): boolean {
  return !isEqual(value, condition);
}

/**
 * Checks if value is less than comparator.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if value is less than condition.
 */
export function isLessThan(value: any, condition: any): boolean {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return false;
  }
  const conditionNumber = Number(condition);
  if (Number.isNaN(conditionNumber)) {
    return false;
  }
  return valueNumber < conditionNumber;
}

/**
 * Checks if value is less than or equal to comparator.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if value is less than or equal to `condition`.
 */
export function isLessThanEqual(value: any, condition: any): boolean {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return false;
  }
  const conditionNumber = Number(condition);
  if (Number.isNaN(conditionNumber)) {
    return false;
  }
  return valueNumber <= conditionNumber;
}

/**
 * Checks if value is greater than comparator.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if value is greater than `condition`.
 */
export function isGreaterThan(value: any, condition: any): boolean {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return false;
  }
  const conditionNumber = Number(condition);
  if (Number.isNaN(conditionNumber)) {
    return false;
  }
  return valueNumber > conditionNumber;
}

/**
 * Checks if value is greater than or equal to comparator.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if value is greater than or equal to `condition`.
 */
export function isGreaterThanEqual(value: any, condition: any): boolean {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return false;
  }
  const conditionNumber = Number(condition);
  if (Number.isNaN(conditionNumber)) {
    return false;
  }
  return valueNumber >= conditionNumber;
}

/**
 * Checks if value contains the `condition`.
 * It works on strings, arrays and objects.
 *
 * @param value Value to compare
 * @param condition Comparator value
 * @returns True if value contains the `condition`.
 */
export function contains(value: any, condition: any): boolean {
  if (!value) {
    return false;
  }
  if (typeof value === 'string') {
    return value.indexOf(condition) !== -1;
  }
  if (Array.isArray(value)) {
    if (!Number.isNaN(condition) && typeof condition !== 'number') {
      const result = value.indexOf(Number(condition));
      if (result !== -1) {
        return true;
      }
    }
    return value.indexOf(condition) !== -1;
  }
  if (typeof value !== 'object') {
    return false;
  }
  return condition in value;
}

/**
 * Checks if `value` can be tested against regular expression.
 *
 * @param value Value to compare
 * @param condition Comparator value - regex string.
 * @returns Value of calling `test()` function on string.
 */
export function isRegex(value: any, condition: any): boolean {
  let re;
  try {
    re = new RegExp(condition, 'm');
  } catch (e) {
    return false;
  }
  const result = String(value);
  return re.test(result);
}

/**
 * Checks if given condition is satisfied by both value and operator.
 *
 * @param value Value read from the response / request object
 * @param operator Comparison term.
 * @param condition Value to compare.
 * @returns True if the condition is satisfied and false otherwise.
 */
export function checkCondition(value: any, operator: OperatorEnum, condition: string | number): boolean {
  switch (operator) {
    case 'equal':
      return isEqual(value, condition);
    case 'not-equal':
      return isNotEqual(value, condition);
    case 'greater-than':
      return isGreaterThan(value, condition);
    case 'greater-than-equal':
      return isGreaterThanEqual(value, condition);
    case 'less-than':
      return isLessThan(value, condition);
    case 'less-than-equal':
      return isLessThanEqual(value, condition);
    case 'contains':
      return contains(value, condition);
    case 'regex':
      return isRegex(value, condition);
    default:
      return false;
  }
}
