/* eslint-disable @typescript-eslint/no-explicit-any */
import { IActionIterator, ActionIterator } from '../../../models/actions/ActionIterator.js';
import * as ConditionRunner from '../actions/ConditionRunner.js';

/**
 * Class responsible for extracting data from JSON values.
 */
export class JsonExtractor {
  _data: any;
  _path: string[];
  _iterator?: ActionIterator;
  /**
   * @constructor
   * @param json JSON string or object. Strings are parsed to objects.
   * @param path Path to the data.
   * @param iterator Data iterator
   */
  constructor(json: string, path: string[], iterator?: IActionIterator) {
    /**
     * JS object or array.
     */
    this._data = this._processJson(json);
    this._path = path;
    if (iterator) {
      this._iterator = new ActionIterator(iterator);
    }
  }

  /**
   * Processes input JSON data and returns Array or Object. It returns
   * `undefined` if the data are empty, falsy or a primitive (except for JSON
   * strings).
   *
   * @param data Data to process
   * @return JS object or undefined if conversion  wasn't possible.
   */
  _processJson(data: string): any {
    if (!data) {
      return undefined;
    }

    switch (typeof data) {
      case 'number':
      case 'boolean':
        return undefined;
      case 'string':
        try {
          return JSON.parse(data);
        } catch (e) {
          return undefined;
        }
      default:
        return data;
    }
  }

  /**
   * Extracts the data for given conditions.
   *
   * @return Data found for given conditions.
   */
  async extract(): Promise<string | undefined> {
    const path = Array.from(this._path);
    if (this._iterator) {
      let obj;
      if (this._iterator.path.includes('*')) {
        obj = this._getValue(this._data, Array.from(this._iterator.path));
      } else {
        obj = this._getValue(this._data, path);
      }
      if (!obj) {
        return undefined;
      }
      return this._getValue(obj, path);
    }
    return this._getValue(this._data, path);
  }

  /**
   * Reads a value of an JSON object for given path.
   *
   * @param json JSON value to read
   * @param path Path to search for the value.
   * @param iterableOptions Instance of ActionIterableObject
   * @return The value for the given path.
   */
  _getValue(json: any, path: string[], iterableOptions?: ActionIterator): string | undefined {
    if (!json || typeof json !== 'object') {
      return json;
    }
    if (iterableOptions) {
      return this._getIterableValue(json, path, iterableOptions);
    }
    let part: string|number = path.shift() as string|number;
    if (!part) {
      return json;
    }
    if (part === '*') {
      const it = this._iterator;
      return this._getValue(json, path, it);
    }
    let isNumber = false;
    const typedNumber = Number(part);
    if (!Number.isNaN(typedNumber)) {
      isNumber = true;
      part = typedNumber;
    }
    if (Array.isArray(json) && !isNumber && !iterableOptions) {
      return undefined;
    }
    return this._getValue(json[part], path, iterableOptions);
  }

  /**
   * Searches for a value in iterable object.
   *
   * @param json Iterable object
   * @param path Path for the value
   * @param iterable Instance of ActionIterableObject
   * @returns Object that matches iterable condition or undefined if none matches the condition.
   */
  _getIterableValue(json: any, path: string[], iterable: ActionIterator): any | undefined {
    const pathCopy = Array.from(path);
    if (Array.isArray(json)) {
      if (iterable.path.includes('*')) {
        // this is the old weird system with unnatural paths
        return this._getIterableValueArray(json, pathCopy, iterable);
      }
      return this._getIterableValueArray(json, iterable.path.split('.'), iterable);
    }
    if (iterable.path.includes('*')) {
      return this._getIterableValueObject(json, pathCopy, iterable);
    }
    return this._getIterableValueObject(json, iterable.path.split('.'), iterable);
  }

  /**
   * Searches for a value in Array.
   *
   * @param json Iterable object
   * @param path Path for the value
   * @param iterable Instance of ActionIterableObject
   * @return Object that matches iterable condition or undefined if none matches the condition.
   */
  _getIterableValueArray(json: any, path: string[], iterable: ActionIterator): any | undefined {
    const { operator, condition } = iterable;
    for (let i = 0, len = json.length; i < len; i++) {
      const item = json[i];
      const copy = Array.from(path);
      const value = this._getValue(item, copy);
      if (!value) {
        continue;
      }
      if (ConditionRunner.checkCondition(value, operator, condition)) {
        return json[i];
      }
    }
    return undefined;
  }

  /**
   * Searches for a value in JS Object.
   *
   * @param json Iterable object
   * @param path Path for the value
   * @param iterable Instance of ActionIterableObject
   * @returns Object that matches iterable condition or undefined if none matches the condition.
   */
  _getIterableValueObject(json: any, path: string[], iterable: ActionIterator): any | undefined {
    const type = typeof json;
    if (!json || type === 'string' || type === 'number') {
      return undefined;
    }
    const { operator, condition } = iterable;
    const keys = Object.keys(json);
    for (let i = 0, len = keys.length; i < len; i++) {
      const copy = Array.from(path);
      const item: any = {};
      item[keys[i]] = json[keys[i]];
      const value = this._getValue(item, copy);
      if (!value) {
        continue;
      }
      if (ConditionRunner.checkCondition(value, operator, condition)) {
        return json;
      }
    }
    return undefined;
  }
}
