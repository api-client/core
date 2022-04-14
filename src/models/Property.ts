import { ApiType } from './legacy/models/ApiTypes.js';

export type PropertyType = 'string' | 'integer' | 'float' | 'nil' | 'boolean' | 'date' | 'datetime' | 'time' | 'int32' | 'int64' | 'uint32' | 'uint64' | 'sint32' | 'sint64' | 'fixed32' | 'fixed64' | 'sfixed32' | 'sfixed64' | 'double' | 'bytes';

export interface IProperty {
  kind: typeof Kind;
  /**
   * Property name
   */
  name: string;
  /**
   * Property value
   */
  value: unknown | IProperty[];
  /**
   * Property data type
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
  /**
   * When set to `true` it represents a property that is an array.
   */
  repeated?: boolean;
}

export const Kind = 'Core#Property';

/**
 * A property of an HTTP request.
 */
export class Property {
  kind = Kind;
  /**
   * Property name
   */
  name = '';
  /**
   * Property data type
   */
  type: PropertyType = 'string';
  /**
   * Property value
   */
  value: unknown = '';
  /**
   * The description of the property
   */
  description?: string;
  /**
   * The default value for the property
   */
  default?: unknown;
  /**
   * Whether the property is enabled. If not set it is assumed the property is enabled.
   */
  enabled?: boolean;
  /**
   * Enum values for the property.
   */
  enum?: unknown;
  /**
   * Whether the value id required to be provided. This is used with validation.
   */
  required?: boolean;
  /**
   * When set to `true` it represents a property that is an array.
   */
  repeated?: boolean;

  static get supportedTypes(): PropertyType[] {
    return [
      'string', 'integer', 'float', 'nil', 'boolean', 'date', 'datetime', 'time', 
      'int32' , 'int64' , 'uint32' , 'uint64' , 'sint32' , 'sint64' , 'fixed32', 'fixed64' , 
      'sfixed32' , 'sfixed64' , 'double' , 'bytes'
    ];
  }

  /**
   * Creates an instance of a property recognizing the type of the `value`.
   * It only works for primitive values.
   * 
   * @param name The name of the property
   * @param value The value of the property. Default to an empty string which is the same as calling `Property.String()`.
   * @param enabled Whether the property is enabled.
   */
  static fromType(name = '', value: unknown = '', enabled = true): Property {
    const type = typeof value;
    if (type === 'boolean') {
      return Property.Boolean(name, value as boolean, enabled);
    }
    if (type === 'number') {
      return Property.Integer(name, value as number, enabled);
    }
    return Property.String(name, value as string, enabled);
  }

  static fromTypeDefault(name = '', type: PropertyType): Property {
    let result: Property | undefined;
    switch (type) {
      case 'string': result = Property.String(name); break;
      case 'boolean': result = Property.Boolean(name); break;
      case 'date': result = Property.Date(name); break;
      case 'datetime': result = Property.Datetime(name); break;
      case 'time': result = Property.Time(name); break;
      case 'float': result = Property.Float(name); break;
      case 'double': result = Property.Double(name); break;
      case 'int32': result = Property.Int32(name); break;
      case 'int64': result = Property.Int64(name); break;
      case 'uint32': result = Property.Uint32(name); break;
      case 'uint64': result = Property.Uint64(name); break;
      case 'sint32': result = Property.Sint32(name); break;
      case 'sint64': result = Property.Sint64(name); break;
      case 'fixed32': result = Property.Fixed32(name); break;
      case 'fixed64': result = Property.Fixed64(name); break;
      case 'sfixed32': result = Property.Sfixed32(name); break;
      case 'sfixed64': result = Property.Sfixed64(name); break;
      case 'integer': result = Property.Integer(name); break;
      case 'bytes': result = Property.Bytes(name); break;
    }
    if (!result) {
      throw new Error(`The type ${type} is not yet supported.`)
    }
    return result;
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

  static Int32(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'int32',
      enabled,
    });
  }

  static Int64(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'int64',
      enabled,
    });
  }

  static Uint32(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'uint32',
      enabled,
    });
  }

  static Uint64(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'uint64',
      enabled,
    });
  }

  static Sint32(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'sint32',
      enabled,
    });
  }

  static Sint64(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'sint64',
      enabled,
    });
  }

  static Fixed32(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'fixed32',
      enabled,
    });
  }

  static Fixed64(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'fixed64',
      enabled,
    });
  }

  static Sfixed32(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'sfixed32',
      enabled,
    });
  }

  static Sfixed64(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0,
      type: 'sfixed64',
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

  static Double(name = '', value?: number, enabled = true): Property {
    return new Property({
      kind: Kind,
      name,
      value: value || 0.0,
      type: 'double',
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

  static Bytes(name = ''): Property {
    return new Property({
      kind: Kind,
      name,
      value: '',
      type: 'bytes',
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
   * Creates a new property.
   * 
   * Note, this throws an error when the property is not a property.
   */
  new(init: IProperty): void {
    if (!Property.isProperty(init)) {
      throw new Error(`Not a property.`);
    }
    const { name, value, default: defaultValue, description, enabled, enum: enumValue, required, type, repeated } = init;
    this.kind = Kind;
    this.name = name;
    this.value = value;
    this.description = description;
    this.default = defaultValue;
    this.enabled = enabled;
    this.enum = enumValue;
    this.required = required;
    this.type = type;
    this.repeated = repeated;
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
    if (typeof this.default !== 'undefined') {
      result.default = this.default;
    }
    if (this.enum) {
      result.enum = this.enum;
    }
    if (typeof this.enabled === 'boolean') {
      result.enabled = this.enabled;
    }
    if (typeof this.required === 'boolean') {
      result.required = this.required;
    }
    if (typeof this.repeated === 'boolean') {
      result.repeated = this.repeated;
    }
    return result;
  }

  /**
   * Maps the list of properties to a single map.
   * It overrides previously defined properties on the map in case of multiple variables with the same name.
   * 
   * @param properties The list of properties to map.
   * @returns A map where keys are property names and values are the property values.
   */
  static toMap(properties: (IProperty | Property)[]): Record<string, any> {
    const result: Record<string, any> = {};
    properties.forEach(p => {
      if (p.enabled === false) {
        return;
      }
      result[p.name] = p.value;
    });
    return result;
  }
}
