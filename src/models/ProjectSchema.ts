import v4 from '../lib/uuid.js';
import { Property, IProperty, PropertyType, Kind as PropertyKind } from './Property.js';
export const Kind = 'Core#ProjectSchema';

export interface IProjectSchema {
  kind?: typeof Kind;
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
  properties?: IProperty[];
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
  properties?: Property[];
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
   * Creates a new schema instance from the passed name.
   * @param name The name of the schema.
   */
  static fromName(name: string): ProjectSchema {
    const init: IProjectSchema = {
      kind: Kind,
      name,
      key: v4(),
    };
    return new ProjectSchema(init);
  }

  /**
   * Creates a new schema instance from the content definition
   * @param name The name of the schema.
   * @param content The "raw" content of the schema
   * @param mime The mime type associated with the schema.
   * @returns The instance of the created schema
   */
  static fromContent(name: string, content: string, mime: string): ProjectSchema {
    const init: IProjectSchema = {
      kind: Kind,
      name,
      key: v4(),
      content,
      mime,
    };
    return new ProjectSchema(init);
  }

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
      this.properties = properties.map(i => new Property(i));
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
      result.properties = this.properties.map(i => i.toJSON());
    }
    return result;
  }

  /**
   * Creates a schema property from a definition.
   * @param info The property definition.
   * @returns The same property definition
   */
  addProperty(info: IProperty): Property;

  /**
   * Creates a schema property from a definition.
   * 
   * @param name The property name
   * @param type The property data type
   * @returns The created schema definition.
   */
  addProperty(name: string, type: PropertyType): Property;

  addProperty(infoOrName: string | IProperty, type?: PropertyType): Property {
    const infoType = typeof infoOrName;
    if (infoType === 'string' && !type) {
      throw new Error('The type is required.');
    }
    let instance: Property;
    if (infoType === 'string') {
      instance = Property.fromTypeDefault(infoOrName as string, type as PropertyType);
    } else {
      const init = infoOrName as IProperty;
      if (!init.kind) {
        init.kind = PropertyKind;
      }
      instance = new Property(init);
    }
    if (!Array.isArray(this.properties)) {
      this.properties = [];
    }
    this.properties.push(instance);
    return instance;
  }
}
