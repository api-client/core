import { HttpProject } from '../HttpProject.js';

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

export const dataValue = Symbol('dataValue');

export type PostmanImportLogLevel = 'error' | 'warning' | 'info';

export interface PostmanImportLog {
  type: PostmanImportLogLevel;
  message: string;
}

/**
 * Base class for all Postman transformers
 */
export abstract class PostmanTransformer {
  [dataValue]: any;
  logs: PostmanImportLog[] = [];

  /**
   * @param data Data to be transformed.
   */
  constructor(data: any) {
    this[dataValue] = data;
  }

  addLog(type: PostmanImportLogLevel, message: string): void {
    this.logs.push({
      type,
      message,
    });
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
  abstract transform(): Promise<HttpProject|HttpProject[]>;
}
