/* eslint-disable @typescript-eslint/no-explicit-any */
import { Jexl } from '@pawel-up/jexl';
import { Property } from '../../../models/Property.js';
import { VariablesTokenizer } from './VariablesTokenizer.js';
import { EvalFunctions } from './EvalFunctions.js';
import { clear } from './Cache.js';

export interface EvaluateOptions {
  /**
   * The execution context to use instead of creating the context
   */
  context?: Record<string, string>;
  /**
   * The list of properties to evaluate. If not set then it scans for all keys in the object.
   * This is used when evaluating objects.
   */
  names?: string[];
}

export function valueHasVariable(value: string): boolean {
  let trimmed = value.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    // the input here can be a JSON string or a variable.
    try {
      // if we can parse the string then this is a JSON string
      JSON.parse(trimmed);
      // we trim the first `{` and the last `}` so the rest of this logic can check for existing variables.
      trimmed = trimmed.substring(1, trimmed.length -1);
    } catch (e) {
      // otherwise this must be a variable.
      return true;
    }
  }
  const isJSLiteral = trimmed.includes('${');
  const isAPILiteral = !isJSLiteral && trimmed.includes('{');
  return isJSLiteral || isAPILiteral;
}

export const functionRegex = /(?:\$?{)?([.a-zA-Z0-9_-]+)\(([^)]*)?\)(?:})?/gm;
export const varValueRe = /^[a-zA-Z0-9_]+$/;

export class VariablesProcessor {
  jexl = new Jexl();

  /**
   * A helper function to map properties to the context object.
   * 
   * The arguments are the lists of `Property`. It starts reading the variables from the right to left,
   * meaning, variables on the left override variables already defined on the left.
   * 
   * ```javascript
   * const result = VariablesProcessor.createContextFromProperties([Property.String('test1', 'value1')], [Property.String('test1', 'value2')]);
   * ```
   * The result has only one variable `test1` with value `value1` because this value if left most in the arguments list.
   * 
   * When a property with the same name is repeated in the same group then the last value wins.
   * 
   * Note, variables without a name, not enabled, or which `value` is undefined are ignored.
   */
  static createContextFromProperties(...input: Property[][]): Record<string, string> {
    const result: Record<string, string> = {};
    input.reverse().forEach((group) => {
      group.forEach((item) => {
        const { enabled, name, value } = item;
        if (!enabled || !name || value === undefined) {
          return;
        }
        result[name] = value as string;
      });
    });
    return result;
  }

  /**
   * Processes the context itself. This way the context can also contain variables.
   *
   * @return Promise resolved to the context to be passed to Jexl.
   */
  async buildContext(unprocessedContext: Record<string, string>): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    return this._processContextVariables(result, unprocessedContext);
  }

  /**
   * Processes variables in the context recursively.
   *
   * @param result A result to where to put the values.
   * @param variables The map of current variables
   * @param runCount Current run count in the recursive function. It stops executing after second run.
   */
  async _processContextVariables(result: Record<string, string>, variables: Record<string, string>, runCount: number = 0): Promise<Record<string, string>> {
    let needsRerun = false;
    const keys = Object.keys(variables);
    const keysWithVariables: string[] = [];

    // In the first run put all variables that does not require processing to the list of results
    for (const key of keys) {
      const value = variables[key];
      if (!valueHasVariable(String(value))) {
        result[key] = value;
      } else {
        keysWithVariables.push(key);
      }
    }
    if (!keysWithVariables.length) {
      return result;
    }

    for (const key of keysWithVariables) {
      const value = variables[key];
      const evaluated = await this.evaluateWithContext(result, value);
      result[key] = evaluated;
      if (!needsRerun && valueHasVariable(evaluated)) {
        needsRerun = true;
      }
    }
    if (!needsRerun || runCount >= 2) {
      return result;
    }
    runCount += 1;
    return this._processContextVariables(result, variables, runCount);
  }

  /**
   * Clears cached groups.
   */
  clearCache(): void {
    clear(this);
  }

  /**
   * Evaluates a value against the passed variables.
   * 
   * Use this method when the context is not evaluated against itself. You can manually
   * build context with `buildContext()` and call `evaluateWithContext()` for additional 
   * performance improvement.
   *
   * @param value A value to evaluate
   * @param unprocessedContext The context (or variables) to use when evaluating the value.
   * @return Promise that resolves to the evaluated value.
   */
  async evaluateVariable(value: string, unprocessedContext: Record<string, string>): Promise<string> {
    const typeOf = typeof value;
    // Non primitives + null
    if (typeOf === 'object') {
      return value;
    }
    if (typeOf !== 'string') {
      value = String(value);
    }
    const ctx = await this.buildContext(unprocessedContext);
    return this.evaluateWithContext(ctx, value);
  }

  /**
   * Evaluates the object against the passed variables.
   * 
   * Note, it only performs a shallow evaluation. Deep objects are not evaluated.
   * 
   * Use this method when the context is not evaluated against itself. You can manually
   * build context with `buildContext()` and call `evaluateVariablesWithContext()` for additional 
   * performance improvement.
   *
   * @param obj The object to evaluate.
   * @param unprocessedContext The context (or variables) to use when evaluating the value.
   * @return Copy of the passed object with the evaluated values.
   */
  async evaluateVariables<T>(obj: T, unprocessedContext: Record<string, string>, names?: string[]): Promise<T> {
    const ctx = await this.buildContext(unprocessedContext);
    return this.evaluateVariablesWithContext(obj, ctx, names);
  }

  /**
   * Evaluates the object against the passed variables.
   * 
   * Note, it only performs a shallow evaluation. Deep objects are not evaluated.
   * 
   * This method is to be used when the passed context is already evaluated against itself.
   * 
   * @param obj The object to evaluate.
   * @param context The evaluated context. use `buildContext()` to prepare the values.
   * @param names The list of names of variables to evaluate. Note, this function changes this array.
   * @returns Copy of the passed object with the evaluated values.
   */
  async evaluateVariablesWithContext<T>(obj: T, context: Record<string, string>, names?: string[]): Promise<T> {
    const result = { ...obj };
    names = names || Object.keys(result);
    const prop = names.shift();
    if (!prop) {
      return result;
    }
    const typed = result as any;
    if (!typed[prop]) {
      // just process next name.
      return this.evaluateVariablesWithContext(result, context, names);
    }
    if (typeof typed[prop] === 'string') {
      typed[prop] = await this.evaluateWithContext(context, typed[prop]);
    }
    return this.evaluateVariablesWithContext(result, context, names);
  }

  /**
   * Evaluates a value with context passed to Jexl.
   * 
   * @param context Jexl's context
   * @param value Value to evaluate
   */
  async evaluateWithContext(context: Record<string, string>, value: string): Promise<string> {
    value = this._upgradeLegacy(value);
    value = this._evalFunctions(value, context);
    if (!value) {
      return value;
    }
    const typedValue = String(value);
    const isJSLiteral = typedValue.includes('${');
    const isAPILiteral = !isJSLiteral && typedValue.includes('{');
    if (!isJSLiteral && !isAPILiteral) {
      return value;
    }
    let result;
    const parts = value.split('\n');
    if (parts.length > 1) {
      result = this._prepareMultilineValue(parts);
    } else {
      result = this._prepareValue(value);
    }
    const { jexl } = this;
    if (Array.isArray(result)) {
      const items = [];
      for (let i = 0, len = result.length; i < len; i++) {
        const item = result[i];
        if (['{', '}'].includes(item.trim())) {
          items[items.length] = item;
        } else {
          try {
            items[items.length] = await jexl.eval(item, context);
          } catch (e) {
            items[items.length] = item;
          }
        }
      }
      return items.join('\n');
    }
    let returnValue = value;
    try {
      returnValue = await jexl.eval(result, context);
    } catch (e) {
      // ...
    }
    return returnValue;
  }

  /**
   * Upgrades old syntax of magic variables to new one.
   * It replaces `${now}` and `${random}` to function calls: `now()` and
   * `random()`. It also keeps grouping.
   *
   * @param value Currently evaluated value
   * @return Parsed value without old syntax.
   */
  _upgradeLegacy(value: string): string {
    const reg = /\$?{(random|now):?([0-9]+)?}/gm;
    const test = reg.test(value);
    if (!test) {
      return value;
    }
    reg.lastIndex = 0;
    const loopTest = true;
    while (loopTest) {
      const matches = reg.exec(value);
      if (!matches) {
        break;
      }
      const variable = matches[0];
      const word = matches[1];
      const group = matches[2];
      let replacement = `\${${word}(`;
      if (group) {
        replacement += group;
      }
      replacement += ')}';
      value = value.replace(variable, replacement);
      reg.lastIndex -= 2; // replacement word is shorter by 2 characters
    }
    return value;
  }

  /**
   * Evaluates functions.
   *
   * @param value A value to evaluate
   * @returns Evaluated value with removed functions.
   * @throws Error if a function is not supported.
   */
  _evalFunctions(value: string, context: Record<string, string>): string {
    if (!value) {
      return '';
    }
    functionRegex.lastIndex = 0;
    const cnd = true;
    while (cnd) {
      const matches = functionRegex.exec(value);
      if (!matches) {
        break;
      }
      const fnName = matches[1];
      const argsStr = matches[2];
      let args;
      if (argsStr) {
        args = argsStr.split(',').map(item => item.trim());
      }
      const _value = this._callFn(context, fnName, args);
      value = value.replace(matches[0], String(_value));
      functionRegex.lastIndex -= matches[0].length - String(_value).length;
    }
    return value;
  }

  /**
   * Calls one of the predefined functions and returns its value.
   *
   * @param fnName A function name to call.
   * @param args Arguments find in the expression.
   * @return Result of calling a function. Always a string.
   */
  _callFn(context: Record<string, string>, fnName: string, args?: string[]): string | number {
    const dotIndex = fnName.indexOf('.');
    if (dotIndex !== -1) {
      const namespace = fnName.substring(0, dotIndex);
      const name = fnName.substring(dotIndex + 1);
      if (['Math', 'String'].indexOf(namespace) !== -1) {
        try {
          return this._callNamespaceFunction(context, namespace, name, args);
        } catch (e) {
          throw new Error(`Unsupported function ${fnName}`);
        }
      }
    } else {
      fnName = fnName[0].toUpperCase() + fnName.substring(1);
      if (fnName in EvalFunctions) {
        return EvalFunctions[fnName](this, args);
      }
    }
    throw new Error(`Unsupported function ${fnName}`);
  }

  /**
   * Calls JavaScript native function.
   * Currently only `Math`, 'JSON', and `String` namespaces are supported.
   *
   * @param namespace The namespace of the function to call
   * @param fn Name of the function to call
   * @param args A list of arguments to call
   * @returns Processed value.
   */
  _callNamespaceFunction(context: Record<string, string>, namespace: string, fn: string, args?: string[]): string | number {
    if (context && args) {
      args = args.map(arg => this._applyArgumentsContext(arg, context));
    }
    
    if (namespace === 'Math') {
      const ns = globalThis[namespace] as any;
      return ns[fn].apply(globalThis, args?.map(Number));
    }
    if (namespace === 'JSON') {
      const ns = globalThis[namespace] as any;
      return ns[fn].apply(globalThis, args);
    }
    if (namespace === 'String') {
      if (!args || !args.length) {
        throw new Error('String functions need an argument');
      }
      const str = args.shift();
      const ns = (String.prototype as any)[fn];
      return ns.apply(str, args);
    }
    return '';
  }

  /**
   * Prepares variables to be evaluated where a value is a multiline value.
   * @param lines Lines in the expression
   * @returns Processed lines
   */
  _prepareMultilineValue(lines: string[]): string[] {
    return lines.map((line) => {
      if (['{', '}'].includes(line.trim())) {
        return line;
      }
      let _res = this._prepareValue(line);
      if (_res === line) {
        _res = _res.replace(/'/g, "\\'");
        _res = _res.replace(/\\\\/, '\\\\\\');
        _res = `'${_res}'`;
      }
      return _res;
    });
  }

  _applyArgumentsContext(arg: any, context: Record<string, string>): any {
    const typedValue = String(arg);
    const hasJsLiteral = typedValue.startsWith('${');
    const hasApiLiteral = typedValue.startsWith('{');
    if (hasJsLiteral|| hasApiLiteral) {
      const index = hasJsLiteral ? 2 : 1;
      const varName = arg.substring(index, arg.length - 1);
      if (this.isValidName(varName) && context[varName]) {
        return context[varName];
      }
    }
    return arg;
  }

  /**
   * Replaces strings with quoted string and variables notation into
   * variables that Jexl understands.
   *
   * @param value Value to evaluate
   * @return Proper syntax for Jexl
   */
  _prepareValue(value: string): string {
    if (!value) {
      return value;
    }
    let typedValue = String(value);
    let isJsonValue = typedValue[0] === '{' && typedValue[typedValue.length - 1] === '}';
    if (isJsonValue) {
      try {
        // to handle `{x} something {y}`
        JSON.parse(typedValue);
        typedValue = typedValue.substring(1, typedValue.length - 1);
      } catch (e) {
        isJsonValue = false;
      }
    }
    const isJSLiteral = typedValue.includes('${');
    let isAPILiteral = !isJSLiteral && typedValue.includes('{');
    if (!isJSLiteral && !isAPILiteral && isJsonValue) {
      // this handles the case when the value contains a single variable in
      // the URL variables syntax.
      isAPILiteral = true;
      isJsonValue = false;
      typedValue = `{${typedValue}}`;
    }
    if (!isJSLiteral && !isAPILiteral) {
      return value;
    }
    typedValue = typedValue.replace(/'/g, "\\'");
    const tokenizer = new VariablesTokenizer(typedValue);
    let parsed = '';
    const loopTest = true;
    const prefix = isJSLiteral ? '$' : '{';
    while (loopTest) {
      const _startIndex = tokenizer.index;
      const left = tokenizer.nextUntil(prefix);
      if (left === null) {
        // no more variables
        if (!parsed) {
          return this._wrapJsonValue(typedValue, isJsonValue);
        }
        tokenizer.index = _startIndex;
        parsed += `'${tokenizer.eof()}'`;
        return this._wrapJsonValue(parsed, isJsonValue);
      }
      let variable = tokenizer.nextUntil('}');
      if (variable === '') {
        // let this pass.
        continue;
      }
      if (!variable) {
        // https://github.com/advanced-rest-client/arc-environment/issues/2
        // This may not be error, even if so, don't throw it in here, just ignore the expression
        return value;
      }
      if (!isAPILiteral) {
        variable = variable.substring(1);
      }
      if (!this.isValidName(variable)) {
        continue;
      }
      const replacement = ` + ${variable} + `;
      let newValue = '';
      newValue += `'${left}'`;
      newValue += replacement;
      parsed += newValue;
    }
    return this._wrapJsonValue(typedValue, isJsonValue);
  }

  /**
   * Wraps a passed value with `'{'` and `'}'` to be properly processed by Jexl.
   * @param value The value to wrap.
   * @param isJson Whether the passed string originally was a JSON string.
   * @return Valid for Jexl JSON string.
   */
  _wrapJsonValue(value: string, isJson: boolean): string {
    return isJson ? `'{' + ${value} + '}'` : value;
  }

  /**
   * Checks whether passed value is a valid variable name.
   * @param name Variable name
   * @return true if the passed name can be used as variable value.
   */
  isValidName(name: string): boolean {
    return varValueRe.test(name);
  }
}
