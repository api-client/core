/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { UrlEncoder } from './UrlEncoder.js';

class Tokenizer {
  protected tokens: string;

  /**
   * This is set to the next token to be read.
   */
  index = 0;

  size: number;

  get ended(): boolean {
    return this.index === this.size - 1;
  }

  constructor(tokens: string) {
    this.tokens = tokens;
    this.size = tokens.length;
  }

  /**
   * Reads characters until one of the passed characters (not included).
   * @param chars The list of characters to search for.
   * @returns The string between the current index and the found character or the end of tokens.
   */
  untilChar(...chars: string[]): string {
    const { tokens, index, size } = this;
    let result = '';
    for (let i = index; i < size; i++) {
      const token = tokens[i];
      this.index = i;
      if (chars.includes(token)) {
        return result;
      }
      result += token;
    }
    return result;
  }

  /**
   * Reads the next token and changes the state.
   * @returns The next token.
   */
  next(): string | undefined {
    const { ended, tokens } = this;
    if (ended) {
      return undefined;
    }
    const next = tokens[this.index];
    this.index += 1;
    return next;
  }

  /**
   * Reads the next character without changing the state.
   */
  getNext(): string | undefined {
    const { ended, tokens, index } = this;
    if (ended) {
      return undefined;
    }
    return tokens[index + 1];
  }
}

enum PartType {
  /**
   * Literal string, we do not process these
   */
  literal,
  /**
   * URI template expression
   */
  template,
  /**
   * query parameter
   */
  param,
}

enum State {
  /**
   * Processing a literal
   */
  literal, 
  /**
   * Processing a query parameter
   */
  param, 
  /**
   * Processing a template expression
   */
  expression,
}

enum DataType {
  // undefined/null
  nil,
  // string
  string,
  // object
  object,
  // array
  array,
}

/**
 * The operator definition for a template expression
 */
interface IOperator {
  /**
   * The value of the operator for the variable.
   * Can be one of `+`, `#`, `.`, `/`, `;`, `?`, or `&`,
   * THere are additional reserved characters for future use: `=`, `,`, `!`, `@` and `|`.
   * 
   * This is not set when the expression has no operator.
   */
  operator?: string;
  prefix?: string;
  separator: string;
  named?: boolean;
  reserved?: boolean;
  emptyNameSeparator?: boolean
}

/**
 * Variable definition of a template expression
 */
interface IVariable {
  /**
   * The variable name, cleaned of any operators
   */
  name: string;
  /**
   * Whether the variable "explode" values as described in the spec.
   */
  explode: boolean;
  /**
   * The value length to insert. For expressions like `{var:20}`
   */
  maxLength?: number;
}

export interface IUrlPart {
  type: PartType;
  expression: string;
}

/**
 * A part that defines a query parameter.
 */
export interface IUrlParamPart extends IUrlPart {
  /**
   * The name of the query parameter.
   */
  name: string;
  /**
   * The name value of the query parameter.
   */
  value: string;
  /**
   * Whether the parameter should be considered when creating the URL.
   */
  enabled: boolean;
}

/**
 * A part that defines a template expression
 */
export interface IUrlExpressionPart extends IUrlPart {
  operator: IOperator;
  variables: IVariable[];
}

interface IData {
  /**
   * type of data 0: undefined/null, 1: string, 2: object, 3: array
   */
  type: DataType;
  /**
   * The read values, except undefined/null.
   * The value is always set. Name is set when the read value is an object.
   */
  values: { value: string, name?: string }[];
}

export interface IUrlExpandOptions {
  /**
   * When set it ignores replacing the value in the template when the variable is missing.
   */
  ignoreMissing?: boolean;
  /**
   * When set it throws errors when missing variables.
   */
  strict?: boolean;
}

export type UrlPart = IUrlPart | IUrlParamPart | IUrlExpressionPart;

class SearchParams {
  /**
   * A reference to the URL processor's parts.
   */
  parts: UrlPart[] = [];

  constructor(parts: UrlPart[]) {
    this.parts = parts;
  }

  /**
   * Iterates over each query parameter, in order.
   */
  * [Symbol.iterator](): Generator<IUrlParamPart> {
    for (const part of this.parts) {
      if (part.type === PartType.param) {
        yield part as IUrlParamPart;
      }
    }
  }

  /**
   * Reads parts, in order, that are query parameters.
   */
  list(): IUrlParamPart[] {
    return this.parts.filter(i => i.type === PartType.param) as IUrlParamPart[];
  }

  /**
   * Adds a new query parameter to the list.
   * 
   * @param name The name of the parameter.
   * @param value The value of the parameter.
   */
  append(name: string, value = ''): void {
    const part: IUrlParamPart = {
      type: PartType.param,
      expression: `${name}=${value}`,
      name,
      value,
      enabled: true,
    };
    this.parts.push(part);
  }
  
  /**
   * Replaces the param part in the parts list.
   * 
   * @param index The index of the parameter as returned by the `getParameters()` method.
   * @param param The param to set.
   */
  update(index: number, param: IUrlParamPart): void {
    if (param.type !== PartType.param) {
      throw new Error(`Invalid query parameter definition`);
    }
    // eslint-disable-next-line no-param-reassign
    param.expression = `${param.name}=${param.value || ''}`;
    let current = 0;
    for (let i = 0, len = this.parts.length; i < len; i++) {
      const part = this.parts[i];
      if (part.type === PartType.param) {
        if (current === index) {
          this.parts[i] = param;
          return;
        }
        current += 1;
      }
    }
    throw new Error(`Missing query parameter at position ${index}.`);
  }

  /**
   * Replaces all parameters with the name with the passed value.
   * It insets the param at the first occurrence of the current param in the parts list.
   * If not exists, it adds it as a last.
   * 
   * @param name The name of the parameter 
   * @param value the value of the parameter
   */
  set(name: string, value: string): void {
    let firstIndex = -1;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      if (part.type === PartType.param) {
        const typed = part as IUrlParamPart;
        if (typed.name === name) {
          this.parts.splice(i, 1);
          firstIndex = i;
        }
      }
    }
    const part: IUrlParamPart = {
      type: PartType.param,
      expression: `${name}=${value}`,
      name,
      value,
      enabled: true,
    };
    if (firstIndex === -1) {
      this.parts.push(part);
    } else {
      this.parts.splice(firstIndex, 0, part);
    }
  }

  /**
   * Removes a query parameter from the parameters list.
   * 
   * @param index The index of the parameter as returned by the `getParameters()` method.
   */
  delete(index: number): void {
    let current = 0;
    for (let i = 0, len = this.parts.length; i < len; i++) {
      const part = this.parts[i];
      if (part.type === PartType.param) {
        if (current === index) {
          this.parts.splice(i, 1);
          return;
        }
        current += 1;
      }
    }
    throw new Error(`Missing query parameter at position ${index}.`);
  }

  /**
   * Toggles the enabled state of the parameter.
   * 
   * @param index The index of the parameter as returned by the `getParameters()` method.
   * @param enabled The enabled state of the parameter.
   */
  toggle(index: number, enabled: boolean): void {
    const params = this.list();
    const param = params[index];
    if (!param) {
      throw new Error(`Missing query parameter at position ${index}.`);
    }
    param.enabled = enabled;
  }
}

/**
 * A class that parses a string a treats it as a value that may include
 * URI templates and request parameters.
 * 
 * It can be used by the UI libraries to manipulate the URL templates and query parameters.
 */
export class UrlProcessor {
  /**
   * The source expression.
   * It is immutable for the entire manipulation process of the URI.
   * Any modification is on the parts level and the `expand()` and `toString()`
   * function only rely on the `parts`.
   */
  expression: string;

  /**
   * The tokenizer object
   */
  tokens: Tokenizer;

  /**
   * An ordered list of parts of the expression.
   */
  parts: UrlPart[] = [];

  /**
   * A helper class to manipulate query parameters on the parser.
   */
  search: SearchParams;

  constructor(expression: string) {
    this.expression = expression;
    this.tokens = new Tokenizer(expression);
    this.search = new SearchParams(this.parts);
    this._parse();
  }

  /**
   * Creates an URI leaving the template expressions are they are (without expanding them).
   */
  toString(): string {
    let result = '';
    this.parts.forEach((part) => {
      if (part.type === PartType.literal) {
        result += part.expression;
      } else if (part.type === PartType.template) {
        result += `{${part.expression}}`;
      } else {
        const typed = part as IUrlParamPart;
        if (!typed.enabled) {
          return;
        }
        if (result.includes('?')) {
          result += '&';
        } else {
          result += '?';
        }
        result += part.expression;
      }
    });
    return result;
  }

  /**
   * Creates a URI with expanded template values.
   * 
   * @param map The variables to evaluate.
   * @param opts Processing options.
   */
  expand(map: Record<string, any>, opts: IUrlExpandOptions = {}): string {
    let result = '';
    for (const part of this.parts) {
      if (part.type === PartType.literal) {
        result += part.expression;
      } else if (part.type === PartType.param) {
        const typed = part as IUrlParamPart;
        if (!typed.enabled) {
          continue;
        }
        if (result.includes('?')) {
          result += '&';
        } else {
          result += '?';
        }
        result += part.expression;
      } else {
        result += this._expandExpression(part as IUrlExpressionPart, map, opts);
      }
    }
    return result;
  }

  protected _expandExpression(part: IUrlExpressionPart, map: Record<string, any>, opts: IUrlExpandOptions): string {
    const { operator, variables } = part;
    const buffer: string[] = [];
    for (const variable of variables) {
      const data = this._getData(map, variable.name);
      
      if (data.type === DataType.nil && opts.strict) {
        throw new Error(`Missing expansion value for variable "${variable.name}"`);
      }

      if (data.type === DataType.nil && opts.ignoreMissing) {
        buffer.push(part.expression);
        continue;
      }

      if (!data.values.length) {
        if (data.type !== DataType.nil) {
          // Empty object / array. We still append the separator.
          buffer.push('');
        }
        continue;
      }

      if (data.type > DataType.string && variable.maxLength) {
        if (opts.strict) {
          throw new Error(`Invalid expression: Prefix modifier not applicable to variable "${variable.name}"`);
        }
        // we ignore invalid values.
        continue;
      }

      if (operator.named) {
        buffer.push(this._expandNamedExpression(data, operator, variable));
      } else {
        buffer.push(this._expandUnNamedExpression(data, operator, variable));
      }
    }
    if (buffer.length) {
      return (operator.prefix || '') + buffer.join(operator.separator);
    }
    // prefix is not prepended for empty expressions
    return '';
  }

  protected _expandNamedExpression(data: IData, operator: IOperator, variable: IVariable): string {
    let result = '';
    const separator = variable.explode && operator.separator || ',';
    const encodeFunction = operator.reserved ? UrlEncoder.encodeReserved : UrlEncoder.strictEncode;
    let name = '';
    if (data.type !== DataType.object && variable.name) {
      name = encodeFunction(variable.name);
    }
    const hasLength = typeof variable.maxLength === 'number';
    data.values.forEach((item, index) => {
      let value: string;
      if (hasLength) {
        value = encodeFunction(item.value.substring(0, variable.maxLength));
        if (data.type === DataType.object) {
          // apply maxLength to keys of objects as well
          name = encodeFunction(item.name!.substring(0, variable.maxLength));
        }
      } else {
        // encode value
        value = encodeFunction(item.value);
        if (data.type === DataType.object) {
          // encode name and cache encoded value
          name = encodeFunction(item.name!);
        }
      }
      if (result) {
        result += separator;
      }

      if (!variable.explode) {
        if (!index) {
          result += encodeFunction(variable.name) + (operator.emptyNameSeparator || value ? '=' : '');
        }
        if (data.type === DataType.object) {
          result += `${name},`;
        }
        result += value;
      } else {
        result += name + (operator.emptyNameSeparator || value ? '=' : '') + value;
      }
    });
    return result;
  }

  protected _expandUnNamedExpression(data: IData, operator: IOperator, variable: IVariable): string {
    let result = '';
    const separator = variable.explode && operator.separator || ',';
    const encodeFunction = operator.reserved ? UrlEncoder.encodeReserved : UrlEncoder.strictEncode;
    const hasLength = typeof variable.maxLength === 'number';
    data.values.forEach((item) => {
      let value: string;
      if (hasLength) {
        value = encodeFunction(item.value.substring(0, variable.maxLength));
      } else {
        value = encodeFunction(item.value);
      }
      if (result) {
        result += separator;
      }
      if (data.type === DataType.object) {
        let _name: string;
        if (hasLength) {
          _name = encodeFunction(item.name!.substring(0, variable.maxLength));
        } else {
          _name = encodeFunction(item.name || '');
        }
        result += _name;
        if (variable.explode) {
          result += (operator.emptyNameSeparator || value ? '=' : '');
        } else {
          result += ',';
        }
      }
      result += value;
    });
    return result;
  }

  protected _getData(map: Record<string, any>, name: string): IData {
    const result: IData = {
      type: DataType.nil,
      values: [],
    };

    const value = map[name];
    if (value === undefined || value === null) {
      // undefined and null values are to be ignored completely
      return result;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        // we only allow primitives in the values
        if (this._validExpansionValue(v)) {
          result.values.push({ value: String(v) });
        }
      }
    } else if (String(Object.prototype.toString.call(value)) === '[object Object]') {
      Object.keys(value).forEach((k) => {
        const v = value[k];
        if (this._validExpansionValue(v)) {
          result.values.push({name: k, value: v});
        }
      });
      if (result.values.length) {
        result.type = DataType.object;
      }
    } else {
      result.type = DataType.string;
      result.values.push({ value: String(value) });
    }
    return result;
  }

  protected _validExpansionValue(value: any): boolean {
    if (value === undefined || value === null) {
      // these are ignored completely
      return false;
    }
    // we only allow primitives in the values
    return ['string', 'number', 'boolean'].includes(typeof value);
  }

  /**
   * Creates an ordered list of parts that describe the passed expression.
   * 
   * FIXME: Handle error states like unclosed brackets.
   */
  protected _parse(): void {
    const { tokens } = this;
    
    let state = State.literal;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let value: string;
      if (state === State.literal) {
        value = tokens.untilChar('?', '&', '{', '}');
      } else if (state === State.param) {
        value = tokens.untilChar('&', '{');
      } else  {
        value = tokens.untilChar('}');
      }
      const next = tokens.next();

      if (state === State.literal) {
        // when the value is an empty string that means that we entered the expression string
        // and we have a variable or a query parameter as the first character.
        // We don't need to pass a literal in this case.
        if (value !== '') {
          this._addLiteral(value);
        }
      } else if (state === State.param) {
        this._addParam(value);
      } else {
        this._addTemplate(value);
      }

      if (next === '?' || next === '&') {
        state = State.param;
      } else if (next === '{') {
        state = State.expression;
      } else if (next === undefined) {
        break;
      } else {
        state = State.literal;
      }
    }
  }

  /**
   * Adds a literal part.
   * Literal parts are not processed in any way. They do not contain query parameters
   * or template expressions.
   * 
   * @param expression The literal expression.
   */
  protected _addLiteral(expression: string): void {
    this.parts.push({
      type: PartType.literal,
      expression,
    });
  }

  /**
   * Adds a part that describes a query parameter
   * @param expression The query param as `name=value` or `name` or `name=`
   */
  protected _addParam(expression: string): void {
    const parts = expression.split('=');
    const part: IUrlParamPart = {
      type: PartType.param,
      expression,
      name: parts[0],
      value: parts[1] || '',
      enabled: true,
    };
    this.parts.push(part);
  }

  /**
   * Adds a part that is a template expression.
   * 
   * @param expression The template expression as defined in RFC 6570
   */
  protected _addTemplate(expression: string): void {
    const ch = expression[0];
    let operator: IOperator;
    if (ch === '+') {
      // Reserved character strings (no encoding)
      operator = {
        operator: '+',
        separator: ',',
        reserved: true,
      }
    } else if (ch === '#') {
      // Fragment identifiers prefixed by '#'
      operator = {
        operator: '#',
        prefix: '#',
        separator: ',',
        reserved: true,
      }
    } else if (ch === '.') {
      // Name labels or extensions prefixed by '.'
      operator = {
        operator: '.',
        prefix: '.',
        separator: '.',
      }
    } else if (ch === '/') {
      // Path segments prefixed by '/'
      operator = {
        operator: '/',
        prefix: '/',
        separator: '/',
      }
    } else if (ch === ';') {
      // Path parameter name or name=value pairs prefixed by ';'
      operator = {
        operator: ';',
        prefix: ';',
        separator: ';',
        named: true,
      }
    } else if (ch === '?') {
      // Query component beginning with '?' and consisting
      // of name=value pairs separated by '&'
      operator = {
        operator: '?',
        prefix: '?',
        separator: '&',
        named: true,
        emptyNameSeparator: true,
      }
    } else if (ch === '&') {
      // Continuation of query-style &name=value pairs
      // within a literal query component.
      operator = {
        operator: '&',
        prefix: '&',
        separator: '&',
        named: true,
        emptyNameSeparator: true,
      }
    } else {
      // The operator characters equals ("="), comma (","), exclamation ("!"),
      // at sign ("@"), and pipe ("|") are reserved for future extensions.

      // this is level1 simple expression
      operator = {
        separator: ',',
      }
    }

    const part: IUrlExpressionPart = {
      type: PartType.template,
      expression,
      operator,
      variables: this._readVariables(expression, operator.operator),
    };

    this.parts.push(part);
  }

  protected _readVariables(expression: string, operator?: string): IVariable[] {
    let name = expression;
    if (operator) {
      name = name.substring(1);
    }
    return name.split(',').map((item) => {
      let maxLength: number | undefined;
      let varName = item;
      let explode = false;
      if (varName.endsWith('*')) {
        explode = true;
        varName = varName.substring(0, varName.length - 1);
      }
      const lengthIndex = varName.indexOf(':');
      if (lengthIndex >= 0) {
        const len = varName.substring(lengthIndex + 1);
        varName = varName.substring(0, lengthIndex);
        if (len) {
          const parsed = Number(len);
          if (Number.isInteger(parsed)) {
            maxLength = parsed;
          }
        }
      }

      const result: IVariable = {
        name: varName,
        explode,
      };
      if (typeof maxLength === 'number') {
        result.maxLength = maxLength;
      }
      return result;
    });
  }
}
