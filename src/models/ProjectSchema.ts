import v4 from '../lib/uuid.js';
export const Kind = 'ARC#ProjectSchema';

export type SchemaPropertyType = 'string' | 'integer' | 'float' | 'nil' | 'boolean' | 'date' | 'datetime' | 'time' | 'int32' | 'int64' | 'uint32' | 'uint64' | 'sint32' | 'sint64' | 'fixed32' | 'fixed64' | 'sfixed32' | 'sfixed64' | 'double' | 'float' | 'bytes';

export interface IProjectSchemaProperty {
  /**
   * The name of the schema property.
   */
  name: string;
  /**
   * The value of the property. It is used to prepare the schema.
   * If none is provided then the system uses the default for  the data type value.
   * For example, `0` for all number types.
   */
  value?: unknown | IProjectSchemaProperty[];
  /**
   * Optional description of the property. Uses Markdown.
   */
  description?: string;
  /**
   * Whether the property is "disabled" and should not be considered when constructing a schema.
   */
  disabled?: boolean;
  /**
   * The data type of the property.
   */
  type?: SchemaPropertyType;
  /**
   * Whether or not the property is required.
   * By default a property is required. It has to be set to `false` to consider it as not required.
   */
  required?: boolean;
  /**
   * The default value to use with this property.
   */
  default?: unknown;
  /**
   * When set to `true` it represents a property that is an array.
   */
  repeated?: boolean;
}

export interface IProjectSchema {
  kind?: 'ARC#ProjectSchema';
  /**
   * The identifier of the environment.
   */
  key: string;
  /**
   * The name of the schema.
   */
  name: string;
  /**
   * The optional list of properties in this schema.
   * Because this is a list instead of a map it is possible to duplicate the property name. In this
   * case the last set value is the final value.
   * 
   * When both the `properties` and the `content` is defined, `content` is used instead of properties.
   */
  properties?: IProjectSchemaProperty[];
  /**
   * The "raw" content of the schema.
   * This value goes unchanged to the request.
   */
  content?: string;
  /**
   * When content is used, it informs about the content type of the 
   * schema. The schema is invalid when `content` is set and the `mime` is not.
   */
  mime?: string;
}

/**
 * A project can contain schema definitions that can be reused in project requests.
 * The schema consists of:
 * 
 * - content: the "raw" schema value in any format. This goes unprocessed into the request body.
 * - properties: a map of properties description that can be manipulated at runtime
 *
 * Scalar values are not supported as a schema definition. It always represents an object.
 */
export class ProjectSchema {
  kind = Kind;
  /**
   * The identifier of the environment.
   */
  key = '';
  /**
   * The optional list of properties in this schema.
   * Because this is a list instead of a map it is possible to duplicate the property name. In this
   * case the last set value is the final value.
   * 
   * When both the `properties` and the `content` is defined, `content` is used instead of properties.
   */
  properties?: IProjectSchemaProperty[];
  /**
   * The "raw" content of the schema.
   * This value goes unchanged to the request.
   */
  content?: string;
  /**
   * When content is used, it informs about the content type of the 
   * schema. The schema is invalid when `content` is set and the `mime` is not.
   */
  mime?: string;
  /**
   * The name of the schema.
   */
  name= '';

  /**
   * @param input The schema definition used to restore the state.
   */
  constructor(input?: string | IProjectSchema) {
    let init: IProjectSchema;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        name: '',
        key: v4(),
      }
    }
    this.new(init);
  }

  /**
   * Creates a new schema definition clearing anything that is so far defined.
   */
  new(init: IProjectSchema): void {
    const { key=v4(), content, properties, mime, name='' } = init;
    this.name = name;
    this.key = key;
    if (content) {
      this.content = content;
    } else {
      this.content = undefined;
    }
    if (Array.isArray(properties)) {
      this.properties = properties;
    } else {
      this.properties = undefined;
    }
    if (mime) {
      this.mime = mime;
    } else {
      this.mime = undefined;
    }
  }

  toJSON(): IProjectSchema {
    const result:IProjectSchema = {
      kind: Kind,
      name: this.name || '',
      key: this.key || v4(),
    };
    if (this.content) {
      result.content = this.content;
    }
    if (this.mime) {
      result.mime = this.mime;
    }
    if (Array.isArray(this.properties) && this.properties.length) {
      result.properties = this.properties;
    }
    return result;
  }
}
