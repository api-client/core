import { UrlEncoder } from './UrlEncoder.js';

const cache = new Map<string, UriTemplate>();

/**
 * pattern to identify expressions [operator, variable-list] in template
 */
const EXPRESSION_PATTERN = /\{([^a-zA-Z0-9%_]?)([^}]+)(\}|$)/g;

/**
 * pattern to identify variables [name, explode, maxlength] in variable-list
 */
const VARIABLE_PATTERN = /^([^*:.](?:\.?[^*:.])*)((\*)|:(\d+))?$/;

/**
 * pattern to verify variable name integrity
 */
const VARIABLE_NAME_PATTERN = /[^a-zA-Z0-9%_.]/;

/**
 * pattern to verify literal integrity
 */
const LITERAL_PATTERN = /[<>{}"`^| \\]/;

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

interface IData {
  /**
   * type of data 0: undefined/null, 1: string, 2: object, 3: array
   */
  type: DataType;
  /**
   * original values (except undefined/null)
   */
  val: (string | undefined)[][];
  /**
   * cache for encoded values (only for non-maxlength expansion)
   */
  strictEncode: (string | undefined)[][];
  encodeReserved: (string | undefined)[][]
}

class Data {
  cache: Record<string, IData>;
  constructor(public data: Record<string, any>) {
    this.cache = {};
  }

  get(key: string): IData {
    const { data } = this;
    const d: IData = {
      type: DataType.nil,
      val: [],
      strictEncode: [],
      encodeReserved: [],
    };

    if (this.cache[key] !== undefined) {
      // we've already processed this key
      return this.cache[key];
    }

    this.cache[key] = d;

    let value: any;
    if (typeof data === 'function') {
      value = data(key);
    } else if (typeof data[key] === 'function') {
      value = data[key](key);
    } else {
      value = data[key];
    }

    // generalize input into [ [name1, value1], [name2, value2], … ]
    // so expansion has to deal with a single data structure only
    if (value === undefined || value === null) {
      // undefined and null values are to be ignored completely
      return d;
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          // arrays don't have names
          d.val.push([undefined, v])
        }
      });
      if (d.val.length) {
        d.type = DataType.array;
      }
    } else if (String(Object.prototype.toString.call(value)) === '[object Object]') {
      Object.keys(value).forEach((k) => {
        const v = value[k];
        if (v !== undefined && v !== null) {
          d.val.push([k, v])
        }
      });
      if (d.val.length) {
        d.type = DataType.object;
      }
    } else {
      d.type = DataType.string;
      d.val.push([undefined, String(value)]);
    }

    return d;
  }
}

interface IOperator {
  prefix: string,
  separator: string;
  named: boolean;
  empty_name_separator: boolean;
  encode: 'strictEncode' | 'encodeReserved';
}

interface IVariable {
  name: string;
  explode: boolean;
  maxlength?: number;
}

interface IPart {
  expression: string;
  operator: string;
  variables: IVariable[];
}

export interface IUriTemplateOptions {
  /**
   * Throws when a variable is not found to replaces a value in the template.
   */
  strict?: boolean;
  /**
   * When set it ignores replacing the value in the template when the variable is missing.
   */
  ignoreMissing?: boolean;
}

const operators: Record<string, IOperator> = {
  // Simple string expansion
  '': {
    prefix: '',
    separator: ',',
    named: false,
    empty_name_separator: false,
    encode: 'strictEncode'
  },
  // Reserved character strings
  '+': {
    prefix: '',
    separator: ',',
    named: false,
    empty_name_separator: false,
    encode: 'encodeReserved'
  },
  // Fragment identifiers prefixed by '#'
  '#': {
    prefix: '#',
    separator: ',',
    named: false,
    empty_name_separator: false,
    encode: 'encodeReserved'
  },
  // Name labels or extensions prefixed by '.'
  '.': {
    prefix: '.',
    separator: '.',
    named: false,
    empty_name_separator: false,
    encode: 'strictEncode'
  },
  // Path segments prefixed by '/'
  '/': {
    prefix: '/',
    separator: '/',
    named: false,
    empty_name_separator: false,
    encode: 'strictEncode'
  },
  // Path parameter name or name=value pairs prefixed by ';'
  ';': {
    prefix: ';',
    separator: ';',
    named: true,
    empty_name_separator: false,
    encode: 'strictEncode'
  },
  // Query component beginning with '?' and consisting
  // of name=value pairs separated by '&'; an
  '?': {
    prefix: '?',
    separator: '&',
    named: true,
    empty_name_separator: true,
    encode: 'strictEncode'
  },
  // Continuation of query-style &name=value pairs
  // within a literal query component.
  '&': {
    prefix: '&',
    separator: '&',
    named: true,
    empty_name_separator: true,
    encode: 'strictEncode'
  }

  // The operator characters equals ("="), comma (","), exclamation ("!"),
  // at sign ("@"), and pipe ("|") are reserved for future extensions.
};

/**
 * Processor for URI templates: http://tools.ietf.org/html/rfc6570
 */
export class UriTemplate {
  parts?: (string | IPart)[];

  /**
   * Allows to ache and reuse cached instances.
   * 
   * @param uri The URI string.
   * @returns 
   */
  static fromUri(uri: string): UriTemplate {
    let cached = cache.get(uri);
    if (!cached) {
      cached = new UriTemplate(uri);
      cache.set(uri, cached);
    }
    return cached;
  }

  /**
   * @param expression The URI string.
   */
  constructor(protected expression: string) { }

  /**
   * Expands the template with the given map values.
   * 
   * @param map The map with values
   * @param opts Processing options
   * @returns The expanded URI.
   */
  expand(map: Record<string, any>, opts: IUriTemplateOptions = {}): string {
    let result = '';
    if (!this.parts || !this.parts.length) {
      this.parse();
    }
    const data = new Data(map);

    for (const part of this.parts!) {
      const item = typeof part === 'string' ? part : UriTemplate.expand(part, data, opts);
      result += item;
    }
    return result;
  }

  /**
   * Parses the template into action tokens.
   */
  parse(): void {
    const { expression } = this;
    const parts: (string | IPart)[] = [];
    let pos = 0;

    function checkLiteral(literal: string): string {
      if (literal.match(LITERAL_PATTERN)) {
        throw new Error(`Invalid Literal "${literal}"`);
      }
      return literal;
    }

    EXPRESSION_PATTERN.lastIndex = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const eMatch = EXPRESSION_PATTERN.exec(expression);
      if (eMatch === null) {
        // push trailing literal
        parts.push(checkLiteral(expression.substring(pos)));
        break;
      } else {
        // push leading literal
        parts.push(checkLiteral(expression.substring(pos, eMatch.index)));
        pos = eMatch.index + eMatch[0].length;
      }
      if (!operators[eMatch[1]]) {
        throw new Error(`Unknown Operator "${eMatch[1]}" in "${eMatch[0]}"`);
      } else if (!eMatch[3]) {
        throw new Error(`Unclosed Expression "${eMatch[0]}"`);
      }

      // parse variable-list
      const varParts = eMatch[2].split(',');
      const vars: IVariable[] = [];

      for (var i = 0, l = varParts.length; i < l; i++) {
        const vMatch = varParts[i].match(VARIABLE_PATTERN);
        if (vMatch === null) {
          throw new Error(`Invalid Variable "${varParts[i]}" in "${eMatch[0]}"`);
        } else if (vMatch[1].match(VARIABLE_NAME_PATTERN)) {
          throw new Error(`Invalid Variable Name "${vMatch[1]}" in ""${eMatch[0]}"`);
        }

        vars[i] = {
          name: vMatch[1],
          explode: !!vMatch[3],
          maxlength: vMatch[4] && parseInt(vMatch[4], 10) || undefined,
        };
      }

      if (!vars.length) {
        throw new Error(`Expression Missing Variable(s) "${eMatch[0]}"`);
      }
      parts.push({
        expression: eMatch[0],
        operator: eMatch[1],
        variables: vars,
      });
    }

    if (!parts.length) {
      // template doesn't contain any expressions
      // so it is a simple literal string
      // this probably should fire a warning or something?
      parts.push(checkLiteral(expression));
    }

    this.parts = parts;
  }

  protected static expand(expression: IPart, data: Data, opts: IUriTemplateOptions = {}): string {
    const options = operators[expression.operator];
    const type = options.named ? 'Named' : 'Unnamed';
    const { variables } = expression;
    const buffer = [];

    for (const variable of variables) {
      const d = data.get(variable.name);
      if (d.type === DataType.nil && opts && opts.strict) {
        throw new Error(`Missing expansion value for variable "${variable.name}"`);
      }
      if (d.type === DataType.nil && opts.ignoreMissing) {
        buffer.push(expression.expression)
        continue
      }
      if (!d.val.length) {
        if (d.type !== DataType.nil) {
          // empty variables (empty string) still lead to a separator being appended!
          buffer.push('');
        }
        continue;
      }
      if (d.type > DataType.string && variable.maxlength) {
        throw new Error(`Invalid expression: Prefix modifier not applicable to variable "${variable.name}"`);
      }
      buffer.push(UriTemplate[`expand${type}`](
        d,
        options,
        variable.explode,
        variable.explode && options.separator || ',',
        variable.maxlength,
        variable.name
      ));
    }

    if (buffer.length) {
      return options.prefix + buffer.join(options.separator);
    }
    // prefix is not prepended for empty expressions
    return '';
  }

  /**
   * Expands a named variable.
   */
  protected static expandNamed(d: IData, options: IOperator, explode: boolean, separator: string, length?: number, name?: string): string {
    let result = '';
    const { encode, empty_name_separator } = options;
    const _encode = !d[encode].length;
    let _name = d.type === DataType.object ? '' : UrlEncoder[encode](name!);

    d.val.forEach((item, index) => {
      let _value;
      if (length) {
        // maxlength must be determined before encoding can happen
        _value = UrlEncoder[encode](item[1]!.substring(0, length));
        if (d.type === DataType.object) {
          // apply maxlength to keys of objects as well
          _name = UrlEncoder[encode](item[0]!.substring(0, length));
        }
      } else if (_encode) {
        // encode value
        _value = UrlEncoder[encode](item[1]!);
        if (d.type === DataType.object) {
          // encode name and cache encoded value
          _name = UrlEncoder[encode](item[0]!);
          d[encode].push([_name, _value]);
        } else {
          // cache encoded value
          d[encode].push([undefined, _value]);
        }
      } else {
        // values are already encoded and can be pulled from cache
        _value = d[encode][index][1];
        if (d.type === DataType.object) {
          _name = d[encode][index][0]!;
        }
      }

      if (result) {
        result += separator;
      }

      if (!explode) {
        if (!index) {
          result += UrlEncoder[encode](name!) + (empty_name_separator || _value ? '=' : '');
        }
        if (d.type === DataType.object) {
          result += `${_name},`;
        }
        result += _value;
      } else {
        result += _name + (empty_name_separator || _value ? '=' : '') + _value;
      }
    });

    return result;
  }

  /**
   * Expands an unnamed variable.
   */
  protected static expandUnnamed(d: IData, options: IOperator, explode: boolean, separator: string, length?: number): string {
    let result = '';
    const { encode, empty_name_separator } = options;
    const _encode = !d[encode].length;

    d.val.forEach((item, index) => {
      let _value: string;
      if (length) {
        // maxlength must be determined before encoding can happen
        _value = UrlEncoder[encode](item[1]!.substring(0, length));
      } else if (_encode) {
        // encode and cache value
        _value = UrlEncoder[encode](item[1]!);
        d[encode].push([
          d.type === DataType.object ? UrlEncoder[encode](item[0]!) : undefined,
          _value
        ]);
      } else {
        // value already encoded, pull from cache
        _value = d[encode][index][1]!;
      }

      if (result) {
        // unless we're the first value, prepend the separator
        result += separator;
      }

      if (d.type === DataType.object) {
        let _name;
        if (length) {
          // maxlength also applies to keys of objects
          _name = UrlEncoder[encode](item[0]!.substring(0, length));
        } else {
          // at this point the name must already be encoded
          _name = d[encode][index][0];
        }

        result += _name;
        if (explode) {
          // explode-modifier separates name and value by "="
          result += (empty_name_separator || _value ? '=' : '');
        } else {
          // no explode-modifier separates name and value by ","
          result += ',';
        }
      }

      result += _value;
    });
    return result;
  }
}
