/* eslint-disable @typescript-eslint/no-explicit-any */
import { Property } from '../../../models/Property.js';
import { VariablesTokenizer } from './VariablesTokenizer.js';
import { EvalFunctions } from './EvalFunctions.js';
import { clear } from './Cache.js';

export interface EvaluateOptions {
  /**
   * A list of variables to override in created context.
   */
  override?: Record<string, string>;
  /**
   * The execution context to use instead of creating the context≥
   */
  context?: Record<string, string>;
  /**
   * The list of properties to evaluate. If not set then it scans for all keys in the object.
   * This is used when evaluating objects.
   */
  names?: string[];
}

/**
 * function that tests whether a passed variable contains a variable.
 * @param item The variable to test its value for variables.
 * @returns True when the variable has another variable in the value.
 */
export const filterToEval = (item: Property): boolean => {
  const { value } = item;
  const typedValue = String(value);
  const isJSLiteral = typedValue.includes('${');
  const isAPILiteral = !isJSLiteral && typedValue.includes('{');
  return isJSLiteral || isAPILiteral;
};

export const functionRegex = /(?:\$?{)?([.a-zA-Z0-9_-]+)\(([^)]*)?\)(?:})?/gm;
export const varValueRe = /^[a-zA-Z0-9_]+$/;

export class VariablesProcessor {
  jexl: any;
  variables: Property[];
  context?: Record<string, string>;

  /**
   * @param jexl A reference to the Jexl instance.
   * @param variables List of application variables
   */
  constructor(jexl: any, variables: Property[]) {
    this.jexl = jexl;
    this.variables = variables;
  }

  /**
   * Requests for a variables list from the variables manager
   * and creates a context for Jexl.
   *
   * If the `variables-manager` is not present it returns empty object.
   *
   * @param override Optional map of variables to use to override the built context.
   * @return Promise resolved to the context to be passed to Jexl.
   */
  async buildContext(override: Record<string, string> = {}): Promise<Record<string, string>> {
    const copy = { ...override };
    let { variables } = this;
    const result: Record<string, string> = {};
    if (!variables || !variables.length) {
      return result;
    }
    // Filter out disabled items
    variables = variables.filter((item) => item.enabled);
    variables = this.overrideContext(variables, copy);
    return this._processContextVariables(result, variables);
  }

  /**
   * Overrides variables with passed values.
   * @param variables Variables to
   * @param override Values to override the variables with
   * @return A copy the `variables` object
   */
  overrideContext(variables: Property[], override: Record<string, string>): Property[] {
    const copy = { ...override };
    const result: Property[] = [...variables];
    Object.keys(copy).forEach((key) => {
      const item = Property.String(key);
      item.value = copy[key];
      result.push(item);
    });
    return result;
  }

  /**
   * Clears cached groups.
   */
  clearCache(): void {
    clear(this);
  }

  /**
   * Evaluates a value against the variables in the current environment
   *
   * @param value A value to evaluate
   * @param options Execution options
   * @return Promise that resolves to the evaluated value.
   */
  async evaluateVariable(value: string, options: EvaluateOptions = {}): Promise<string> {
    const typeOf = typeof value;
    // Non primitives + null
    if (typeOf === 'object') {
      return value;
    }
    if (typeOf !== 'string') {
      value = String(value);
    }
    const { context, override } = options;
    const ctx = context || await this.buildContext(override);
    return this.evaluateWithContext(ctx, value);
  }

  /**
   * Evaluates variables on the passed object.
   * 
   * Note, it only performs a shallow evaluation. Deep objects are not evaluated.
   *
   * @param obj The object to evaluate.
   * @param options Execution options
   * @return Promise resolved to the evaluated object.
   */
  async evaluateVariables(obj: object, options: EvaluateOptions = {}): Promise<any> {
    const init = { ...options };
    const names = [...(init.names || Object.keys(obj))];
    init.names = names
    if (!init.context) {
      // this should be done ony once, not each time it evaluates a variable.
      init.context = await this.buildContext(init.override);
    }
    const prop = names.shift();
    if (!prop) {
      return obj;
    }
    const typed = obj as any;
    if (!typed[prop]) {
      return this.evaluateVariables(obj, init);
    }
    typed[prop] = await this.evaluateVariable(typed[prop], init);
    return this.evaluateVariables(obj, init);
  }

  /**
   * Evaluates a value with context passed to Jexl.
   * 
   * @param context Jexl's context
   * @param value Value to evaluate
   */
  async evaluateWithContext(context: Record<string, string>, value: string): Promise<string> {
    value = this._upgradeLegacy(value);
    value = this._evalFunctions(value);
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
   * Processes variables in the context recursively.
   *
   * @param result A result to where put the values.
   * @param variables A list of current variables
   * @param requireEvaluation A list of variables that require evaluation
   * @param runCount Current run count in the recursive function. It stops executing after second run.
   * @returns Evaluated `result` value.
   */
  async _processContextVariables(result: Record<string, string>, variables: Property[], requireEvaluation?: Property[], runCount?: number): Promise<Record<string, string>> {
    if (!requireEvaluation) {
      requireEvaluation = variables.filter(filterToEval);
    }
    variables.forEach((item) => {
      result[item.name] = item.value as string;
    });
    if (requireEvaluation.length === 0) {
      return result;
    }
    // this array should be sorted so items that should be evaluated first
    // because are a dependencies of other expressions.
    for (let i = 0, len = requireEvaluation.length; i < len; i++) {
      const item = requireEvaluation[i];
      const value = await this.evaluateVariable(item.value as string, {
        context: result,
      });
      result[item.name] = value;
      item.value = value;
    }

    requireEvaluation = requireEvaluation.filter(filterToEval);
    runCount = runCount || 1;
    if (requireEvaluation.length === 0 || runCount >= 2) {
      this.context = result;
      return result;
    }
    runCount += 1;
    return this._processContextVariables(result, variables, requireEvaluation, runCount);
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
  _evalFunctions(value: string): string {
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
      const _value = this._callFn(fnName, args);
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
  _callFn(fnName: string, args?: string[]): string | number {
    const dotIndex = fnName.indexOf('.');
    if (dotIndex !== -1) {
      const namespace = fnName.substr(0, dotIndex);
      const name = fnName.substr(dotIndex + 1);
      if (['Math', 'String'].indexOf(namespace) !== -1) {
        try {
          return this._callNamespaceFunction(namespace, name, args);
        } catch (e) {
          throw new Error(`Unsupported function ${fnName}`);
        }
      }
    } else {
      fnName = fnName[0].toUpperCase() + fnName.substr(1);
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
  _callNamespaceFunction(namespace: string, fn: string, args?: string[]): string | number {
    const { context } = this;
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
    const jSLiteralIndex = typedValue.indexOf('${');
    const apiLiteralIndex = typedValue.indexOf('{');
    if (jSLiteralIndex === 0 || apiLiteralIndex === 0) {
      const index = jSLiteralIndex === 0 ? 2 : 1;
      const postIndex = jSLiteralIndex === 0 ? 3 : 2;
      const varName = arg.substr(index, arg.length - postIndex);
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
        typedValue = typedValue.substr(1, typedValue.length - 2);
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
        variable = variable.substr(1);
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
