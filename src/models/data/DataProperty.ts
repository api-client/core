import { IThing, Thing } from "../Thing.js";
import v4 from '../../lib/uuid.js';
import { DataNamespace } from "./DataNamespace.js";
import { IDataPropertySchema } from "./DataPropertySchema.js";

export type DataPropertyType = 'string' | 'number' | 'nil' | 'boolean' | 'date' | 'datetime' |
  'time' | 'bytes' | 'any' | 'file';
export const DataPropertyTypes: DataPropertyType[] = [
  'string', 'number', 'nil', 'boolean', 'date', 'datetime', 'time', 'bytes', 'any', 'file'
];

export enum DataPropertyList {
  string = 'string',
  number = 'number',
  nil = 'nil',
  boolean = 'boolean',
  date = 'date',
  datetime = 'datetime',
  time = 'time',
  bytes = 'bytes',
  any = 'any',
  file = 'file',
}

export const Kind = 'Core#DataProperty';

export interface IPropertySchema<T> {
  /**
   * Whether it is a general schema for the property.
   * All other schemas inherit from this one. This allows creating global schema description 
   * like examples, default values, minimum value, etc and then use it as a base to generate specific formats.
   * 
   * A property may not have a global schema.
   */
  global?: boolean;
  /**
   * The mime type this schema describes.
   * For JSON it is `application/json`, for XML it is `application/xml` (or `text/xml`) adn so on.
   * 
   * Note, when this value is missing then it is assumed that the schema is `global`.
   */
  format?: string;
  /**
   * The schema definition.
   */
  value: IDataPropertySchema<T>;
}

export interface IDataProperty {
  kind: typeof Kind;
  /**
   * The key of the namespace.
   */
  key: string;
  /**
   * The data property description.
   */
  info: IThing;
  /**
   * Wether the data property is required.
   */
  required?: boolean;
  /**
   * Whether the data property allows multiple items.
   */
  multiple?: boolean;
  /**
   * Whether this property describes a primary key of the entity.
   */
  primary?: boolean;
  /**
   * Whether this property describes an indexed property of the entity.
   */
  index?: boolean;
  /**
   * Optional general purpose tags for the UI.
   */
  tags?: string[];
  /**
   * For future use.
   * 
   * The keys of the taxonomy items associated with the property.
   */
  taxonomy?: string[];
  /**
   * The data type for this property.
   * Note, not all schemas support the same type. For example, defining `sint32` 
   * works for protocol buffers but does not for JSON. In such case we use default 
   * translation `sint32` -> `number`. Another way it to create 
   * a derivative entity for specific schema to describe specific schema case.
   */
  type: DataPropertyType;

  /**
   * While the `DataProperty` describes the general shape of the data and can be used to 
   * model the structure of the data in the system, a schema describes hwo the data 
   * should be serialized into a specific format. This allows adding example values,
   * default values, specifying data format, etc. The assumption here is
   * that with enough specifics provided by the user (a domain specialist)
   * we can automatically generate a schema for the given format.
   */
  schemas?: IPropertySchema<unknown>[];
}

export class DataProperty {
  kind = Kind;

  key = '';

  /**
   * The description of the data namespace.
   */
  info: Thing = Thing.fromName('');

  /**
   * Wether the data property is required.
   */
  required?: boolean;

  /**
   * Whether the data property allows multiple items.
   */
  multiple?: boolean;

  /**
   * Whether this property describes a primary key of the entity.
   */
  primary?: boolean;

  /**
   * Whether this property describes an indexed property of the entity.
   */
  index?: boolean;

  /**
   * Optional general purpose tags for the UI.
   */
  tags: string[] = [];

  /**
   * Reserved for future use.
   * 
   * The keys of the taxonomy items associated with the property.
   */
  taxonomy: string[] = [];

  /**
   * The data type for this property.
   * Note, not all schemas support the same type. For example, defining `sint32` 
   * works for protocol buffers but does not for JSON. In such case we use default 
   * translation `sint32` -> `number`. Another way it to create 
   * a derivative entity for specific schema to describe specific schema case.
   */
  type: DataPropertyType = 'string';

  /**
   * While the `DataProperty` describes the general shape of the data and can be used to 
   * model the structure of the data in the system, a schema describes hwo the data 
   * should be serialized into a specific format. This allows adding example values,
   * default values, specifying data format, etc. The assumption here is
   * that with enough specifics provided by the user (a domain specialist)
   * we can automatically generate a schema for the given format.
   */
  schemas: IPropertySchema<unknown>[] = [];

  static get supportedTypes(): DataPropertyType[] {
    return [...DataPropertyTypes];
  }

  static fromName(root: DataNamespace, name: string): DataProperty {
    const property = new DataProperty(root);
    property.info = Thing.fromName(name);
    return property;
  }

  static fromType(root: DataNamespace, type: DataPropertyType): DataProperty {
    const assoc = new DataProperty(root);
    assoc.type = type;
    return assoc;
  }

  /**
   * @param input The data property definition to restore.
   */
  constructor(protected root: DataNamespace, input?: string | IDataProperty) {
    let init: IDataProperty;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: Thing.fromName('').toJSON(),
        type: 'string',
      };
    }
    this.new(init);
  }

  new(init: IDataProperty): void {
    if (!DataProperty.isDataProperty(init)) {
      throw new Error(`Not a data property.`);
    }
    const { info, key = v4(), kind = Kind, multiple, required, type = DataPropertyList.string, index, primary, tags, taxonomy, schemas } = init;
    this.kind = kind;
    this.key = key;
    this.type = type;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    if (typeof multiple === 'boolean') {
      this.multiple = multiple;
    } else {
      this.multiple = undefined;
    }
    if (typeof required === 'boolean') {
      this.required = required;
    } else {
      this.required = undefined;
    }
    if (typeof index === 'boolean') {
      this.index = index;
    } else {
      this.index = undefined;
    }
    if (typeof primary === 'boolean') {
      this.primary = primary;
    } else {
      this.primary = undefined;
    }
    if (Array.isArray(tags)) {
      this.tags = [...tags];
    } else {
      this.tags = [];
    }
    if (Array.isArray(taxonomy)) {
      this.taxonomy = [...taxonomy];
    } else {
      this.taxonomy = [];
    }
    if (Array.isArray(schemas)) {
      this.schemas = schemas.map(i => ({ ...i }));
    } else {
      this.schemas = [];
    }
  }

  static isDataProperty(input: unknown): boolean {
    const typed = input as IDataProperty;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IDataProperty {
    const result: IDataProperty = {
      kind: Kind,
      info: this.info.toJSON(),
      key: this.key,
      type: this.type || DataPropertyList.string,
    };
    if (typeof this.index === 'boolean') {
      result.index = this.index;
    }
    if (typeof this.primary === 'boolean') {
      result.primary = this.primary;
    }
    if (typeof this.multiple === 'boolean') {
      result.multiple = this.multiple;
    }
    if (typeof this.required === 'boolean') {
      result.required = this.required;
    }
    if (Array.isArray(this.tags) && this.tags.length) {
      result.tags = [...this.tags];
    }
    if (Array.isArray(this.taxonomy) && this.taxonomy.length) {
      result.taxonomy = [...this.taxonomy];
    }
    if (Array.isArray(this.schemas) && this.schemas.length) {
      result.schemas = this.schemas.map(i => ({ ...i }));
    }
    return result;
  }

  /**
   * Removes self from the parent entity and the namespace definition.
   */
  remove(): void {
    const { root } = this;
    const entity = root.definitions.entities.find(i => i.properties.some(j => j === this));
    if (entity) {
      const assocIndex = entity.properties.findIndex(i => i === this);
      entity.properties.splice(assocIndex, 1);
    }
    const defIndex = this.root.definitions.properties.findIndex(i => i.key === this.key);
    if (defIndex >= 0) {
      this.root.definitions.properties.splice(defIndex, 1);
    }
  }
}
