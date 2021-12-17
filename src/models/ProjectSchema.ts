import v4 from '../lib/uuid.js';
export const Kind = 'ARC#ProjectSchema';

export type SchemaPropertyType = 'string' | 'integer' | 'float' | 'nil' | 'boolean' | 'date' | 'datetime' | 'time';

export interface IProjectSchemaProperty {
  name: string;
  value?: string | number | boolean | null | IProjectSchemaProperty | IProjectSchemaProperty[];
  description?: string;
  disabled?: boolean;
  type?: SchemaPropertyType;
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
