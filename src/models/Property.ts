import { ApiType } from './legacy/models/ApiTypes.js';

export type PropertyType = 'string' | 'integer' | 'float' | 'nil' | 'boolean' | 'date' | 'datetime' | 'time' | 'enum';

export interface IProperty {
  kind: 'ARC#Property';
  /**
   * Property name
   */
  name: string;
  /**
   * Property value
   */
  value: unknown;
  /**
   * Property type
   */
  type: PropertyType;
  /**
   * Whether the property is enabled. If not set it is assumed the property is enabled.
   */
  enabled?: boolean;
  /**
   * The default value for the property
   */
  default?: unknown;
  /**
   * Enum values for the property.
   */
  enum?: unknown;
  /**
   * The description of the property
   */
  description?: string;
  /**
   * Whether the value id required to be provided. This is used with validation.
   */
  required?: boolean;
}

export const Kind = 'ARC#Property';

/**
 * A property of an HTTP request.
 */
export class Property {
  kind = Kind;
  name = '';
  type: PropertyType = 'string';
  value: unknown = '';
  description?: string;
  default?: unknown;
  enabled?: boolean;
  enum?: unknown;
  required?: boolean;

  static get supportedTypes(): PropertyType[] {
    return ['string', 'integer', 'float', 'nil', 'boolean', 'date', 'datetime', 'time', 'enum'];
  }

  /**
   * Creates an instance of a property recognizing the type of the `value`.
   * It only works for primitive values.
   * 
   * @param name The name of the property
   * @param value The value of the property. Default to an empty string which is the same as calling `Property.String()`.
   * @param enabled Whether the property is enabled.
   */
  static fromType(name = '', value:unknown = '', enabled = true): Property {
    const type = typeof value;
    if (type === 'boolean') {
      return Property.Boolean(name, value as boolean, enabled);
    }
    if (type === 'number') {
      return Property.Integer(name, value as number, enabled);
    }
    return Property.String(name, value as string, enabled);
  }

  static String(name = '', value?: string, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || '',
      type: 'string',
      enabled,
    });
  }

  static Integer(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'integer',
      enabled,
    });
  }

  static Float(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0.0,
      type: 'float',
      enabled,
    });
  }

  static Boolean(name = '', value = false, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value,
      type: 'boolean',
      enabled,
    });
  }

  static Date(name = ''): Property {
    return new Property({
      kind: Kind,
      name,
      value: '',
      type: 'date',
      enabled: true,
    });
  }

  static Datetime(name = ''): Property {
    return new Property({
      kind: Kind,
      name,
      value: '',
      type: 'datetime',
      enabled: true,
    });
  }

  static Time(name = ''): Property {
    return new Property({
      kind: Kind,
      name,
      value: '',
      type: 'time',
      enabled: true,
    });
  }

  static fromApiType(type: ApiType): Property {
    const init: IProperty = { ...type, kind: Kind, type: type.type as PropertyType || 'string' };
    return new Property(init);
  }

  /**
   * @param input The property definition used to restore the state.
   */
  constructor(input?: string | IProperty) {
    let init: IProperty;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        name: '',
        value: '',
        type: 'string',
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the property is not an ARC environment.
   */
  new(init: IProperty): void {
    if (!Property.isProperty(init)) {
      throw new Error(`Not an ARC property.`);
    }
    const { name, value, default: defaultValue, description, enabled, enum: enumValue, required, type } = init;
    this.kind = Kind;
    this.name = name;
    this.value = value;
    this.description = description;
    this.default = defaultValue;
    this.enabled = enabled;
    this.enum = enumValue;
    this.required = required;
    this.type = type;
  }

  /**
   * Checks whether the input is a definition of a property.
   */
  static isProperty(input: unknown): boolean {
    const typed = input as IProperty;
    if (!input || typeof typed.name !== 'string' || typeof typed.type !== 'string' || typed.kind !== Kind) {
      return false;
    }
    if (!Property.supportedTypes.includes(typed.type)) {
      return false;
    }
    return true;
  }

  toJSON(): IProperty {
    const result:IProperty = {
      kind: Kind,
      name: this.name,
      value: this.value,
      type: this.type,
    };
    if (this.description) {
      result.description = this.description;
    }
    if (this.default) {
      result.default = this.default;
    }
    if (this.enabled) {
      result.enabled = this.enabled;
    }
    if (this.enum) {
      result.enum = this.enum;
    }
    if (this.required) {
      result.required = this.required;
    }
    return result;
  }
}
