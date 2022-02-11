/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { BaseTransformer } from './BaseTransformer.js';
import { ArcExportObject } from '../legacy/DataExport.js';

export const postmanVarRegex = /\{\{(.*?)\}\}/gim;

/**
 * Replacer function for regex replace to be used to replace variables
 * notation to ARC's
 *
 * @param match
 * @param value
 * @return Value to be replaced in the string.
 */
export function variablesReplacerFunction(match: string, value: string): string {
  switch (value) {
    case '$randomInt': value = 'random()'; break;
    case '$guid': value = 'uuid()'; break;
    case '$timestamp': value = 'now()'; break;
    default:
  }
  return `\${${value}}`;
}

/**
 * Parse input string as a payload param key or value.
 *
 * @param input An input to parse.
 * @return Trimmed string
 */
export function paramValue(input: string): string {
  if (!input) {
    return String();
  }
  input = String(input);
  input = input.trim();
  return input;
}

/**
 * Base class for all Postman transformers
 */
export abstract class PostmanTransformer extends BaseTransformer {

  /**
   * Computes body value for Postman's v1 body definition.
   *
   * @param item Postman v1 model.
   * @return Body value
   */
  computeBodyOld(item: any): string {
    if (typeof item.data === 'string') {
      return this.ensureVariablesSyntax(item.data) as string;
    }
    if (item.data instanceof Array && !item.data.length) {
      return '';
    }
    switch (item.dataMode) {
      case 'params': return this.computeFormDataBody(item);
      case 'urlencoded': return this.computeUrlEncodedBody(item);
      // case 'binary': return '';
      default: return '';
    }
  }

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param item Postman v1 model.
   * @returns Body value. Always empty string.
   */
  computeFormDataBody(item: any): string {
    if (!item.data || !item.data.length) {
      return '';
    }
    const multipart: any[] = [];
    item.data = this.ensureVarsRecursively(item.data);
    (item.data as any[]).forEach((data) => {
      const obj = {
        enabled: data.enabled,
        name: data.key,
        isFile: data.type === 'file',
        value: data.type === 'file' ? '' : data.value,
      };
      multipart.push(obj);
    });
    item.multipart = multipart;
    return '';
  }

  /**
   * Computes body as a URL encoded data model.
   *
   * @param item Postman v1 model.
   * @return Body value.
   */
  computeUrlEncodedBody(item: any): string  {
    if (!item.data || !item.data.length) {
      return '';
    }
    item.data = this.ensureVarsRecursively(item.data);
    return (item.data as any[]).map((obj) => {
      const name = paramValue(obj.key);
      const value = paramValue(obj.value);
      return `${name}=${value}`;
    }).join('&');
  }

  /**
   * Replaces any occurrence of {{STRING}} with ARC's variables syntax.
   *
   * @param str A string value to check for variables.
   * @return The same string with ARC's variables syntax
   */
  ensureVariablesSyntax(str?: string): string|undefined {
    if (!str || !str.indexOf) {
      return str;
    }
    // https://jsperf.com/regex-replace-with-test-conditions
    if (str.indexOf('{{') !== -1) {
      str = str.replace(postmanVarRegex, variablesReplacerFunction);
    }
    return str;
  }

  ensureVarsRecursively(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.ensureVarsRecursively(item));
    }
    if (obj === Object(obj)) {
      Object.keys(obj).forEach((key) => {
        obj[key] = this.ensureVarsRecursively(obj[key]);
      });
      return obj;
    }
    if (typeof obj === 'string') {
      return this.ensureVariablesSyntax(obj);
    }
    return obj;
  }

  /**
   * Transforms the data into ARC data model.
   * @returns Promise resolved when data are transformed.
   */
  abstract transform(): Promise<ArcExportObject>;
}
