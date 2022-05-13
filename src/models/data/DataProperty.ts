import { Core as JsonCore } from '@api-client/json';
import { IThing, Thing } from "../Thing.js";
import v4 from '../../lib/uuid.js';
import { DataNamespace } from "./DataNamespace.js";
import { IPropertyShape } from "../../amf/definitions/Shapes.js";
import { AmfShapeGenerator } from '../../amf/AmfShapeGenerator.js';
import { IPropertyBindings, IPropertySchema } from './Bindings.js';

export type DataPropertyType = 'string' | 'number' | 'integer' | 'nil' | 'boolean' | 'date' | 'datetime' | 'time' | 'any' | 'binary';
export const DataPropertyTypes: DataPropertyType[] = [
  'string', 'number', 'integer', 'nil', 'boolean', 'date', 'datetime', 'time' , 'any', 'binary'
];

export enum DataPropertyList {
  string = 'string',
  number = 'number',
  integer = 'integer', // RAML, OAS and JSON schema define numbers and integers separately
  nil = 'nil',
  boolean = 'boolean',
  date = 'date',
  datetime = 'datetime',
  time = 'time',
  any = 'any',
  file = 'binary',
}

export type DateFormat = 'rfc3339' | 'rfc2616';
export const DateFormats: DateFormat[] = ['rfc3339', 'rfc2616'];
export enum DateFormatList {
  /**
   * The "date-time" notation of RFC3339
   */
  rfc3339 = 'rfc3339',
  /**
   * The format defined in RFC2616.
   */
  rfc2616 = 'rfc2616',
}

export const Kind = 'Core#DataProperty';

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
   * Whether the property is read only in the schema.
   */
  readOnly?: boolean;
  /**
   * Whether the property is write only in the schema.
   */
  writeOnly?: boolean;
  /**
   * Whether the attribute is hidden in the schema (not a part of it).
   * 
   * The hidden attribute should only appear in the adapted attribute. 
   * Has no effect when added to the "main" attribute.
   */
  hidden?: boolean;
  /**
   * Whether this property is deprecated.
   */
  deprecated?: boolean;
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
   * The general schema definition of this property. 
   * This is propagated to all bindings (when they support these properties).
   * 
   * Note, schema can only occur on an adapted property. Has no effect on the "main"
   * property.
   */
  schema?: IPropertySchema;
  /**
   * The list of bindings for this property.
   * 
   * A binding defines a translation from a data model to a specific format.
   * For example allows to define properties required to generate AMF shape and therefore RAML/OAS shapes for web APIs
   * or a protocol buffer schema.
   */
  bindings?: IPropertyBindings[];
  /**
   * The key of the property that is adapted by this property.
   * Adapted properties can manipulate the shape of the schema for the property.
   * 
   * Each value defined on the adapted property changes the original value defined on
   * the property.
   */
  adapts?: string;
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
   * Whether the property is read only in the schema.
   */
  readOnly?: boolean;

  /**
   * Whether the property is write only in the schema.
   */
  writeOnly?: boolean;

  /**
   * Whether the attribute is hidden in the schema (not a part of it).
   * The hidden attribute should only appear in the adapted attribute. 
   * Has no effect when added to the "main" attribute.
   */
  hidden?: boolean;

  /**
   * Whether this property is deprecated.
   */
  deprecated?: boolean;

  /**
   * Optional general purpose tags for the UI.
   * 
   * Note to implementations, use the `addTag()` method as it propagates the "tag" value in the namespace.
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
   * The general schema definition of this property. 
   * This is propagated to all bindings (when they support these properties).
   * 
   * Note, schema can only occur on an adapted property. Has no effect on the "main"
   * property.
   */
  schema?: IPropertySchema;
  /**
   * The list of bindings for this property.
   * 
   * A binding defines a translation from a data model to a specific format.
   * For example allows to define properties required to generate AMF shape and therefore RAML/OAS shapes for web APIs
   * or a protocol buffer schema.
   */
  bindings: IPropertyBindings[] = [];

  /**
   * The key of the property that is adapted by this property.
   * Adapted properties can manipulate the shape of the schema for the property.
   * 
   * Each value defined on the adapted property changes the original value defined on
   * the property.
   */
  adapts?: string;

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
  constructor(public root: DataNamespace, input?: string | IDataProperty) {
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
    const { 
      info, key = v4(), kind = Kind, multiple, required, type = DataPropertyList.string, 
      index, primary, readOnly, writeOnly, adapts, hidden, tags, taxonomy, deprecated,
      schema, bindings,
    } = init;
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
    if (typeof deprecated === 'boolean') {
      this.deprecated = deprecated;
    } else {
      this.deprecated = undefined;
    }
    if (typeof primary === 'boolean') {
      this.primary = primary;
    } else {
      this.primary = undefined;
    }
    if (typeof readOnly === 'boolean') {
      this.readOnly = readOnly;
    } else {
      this.readOnly = undefined;
    }
    if (typeof writeOnly === 'boolean') {
      this.writeOnly = writeOnly;
    } else {
      this.writeOnly = undefined;
    }
    if (typeof hidden === 'boolean') {
      this.hidden = hidden;
    } else {
      this.hidden = undefined;
    }
    if (typeof adapts === 'string') {
      this.adapts = adapts;
    } else {
      this.adapts = undefined;
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
    if (schema) {
      this.schema = JsonCore.clone(schema);
    } else {
      this.schema = undefined;
    }
    if (Array.isArray(bindings)) {
      this.bindings = bindings.map(i => JsonCore.clone(i));
    } else {
      this.bindings = [];
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
    if (typeof this.deprecated === 'boolean') {
      result.deprecated = this.deprecated;
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
    if (typeof this.readOnly === 'boolean') {
      result.readOnly = this.readOnly;
    }
    if (typeof this.writeOnly === 'boolean') {
      result.writeOnly = this.writeOnly;
    }
    if (typeof this.hidden === 'boolean') {
      result.hidden = this.hidden;
    }
    if (this.adapts) {
      result.adapts = this.adapts;
    }
    if (Array.isArray(this.tags) && this.tags.length) {
      result.tags = [...this.tags];
    }
    if (Array.isArray(this.taxonomy) && this.taxonomy.length) {
      result.taxonomy = [...this.taxonomy];
    }
    if (this.schema) {
      result.schema = JsonCore.clone(this.schema);
    }
    if (Array.isArray(this.bindings) && this.bindings.length) {
      result.taxonomy = this.taxonomy.map(i => JsonCore.clone(i));
    }
    return result;
  }

  /**
   * Removes self from the parent entity and the namespace definition.
   */
  remove(): void {
    const { root, adapts } = this;
    const entity = root.definitions.entities.find(i => i.properties.some(j => j === this));
    if (entity) {
      const assocIndex = entity.properties.findIndex(i => i === this);
      entity.properties.splice(assocIndex, 1);
    }
    const defIndex = this.root.definitions.properties.findIndex(i => i.key === this.key);
    if (defIndex >= 0) {
      this.root.definitions.properties.splice(defIndex, 1);
    }
    if (adapts) {
      const adaptsIndex = this.root.definitions.properties.findIndex(i => i.key === adapts);
      if (adaptsIndex >= 0) {
        this.root.definitions.properties.splice(adaptsIndex, 1);
      }
    }
  }

  /**
   * Adds a new tag to the property. It also populates the root namespace's tags when tag is new.
   * 
   * Note, it does nothing when the tag is already defined.
   * 
   * @param tag The tag to add.
   */
  addTag(tag: string): void {
    if (!tag) {
      return;
    }
    const lower = tag.toLowerCase();
    const { tags } = this;
    if (tags.some(t => t.toLowerCase() === lower)) {
      return;
    }
    tags.push(tag);
    const { definitions } = this.root;
    if (!definitions.tags.some(t => t.toLowerCase() === lower)) {
      definitions.tags.push(tag);
    }
  }

  /**
   * Removes a tag from the property. Unlike the `addTag()` this won't remove a `tag` from the root namespace.
   * 
   * @param tag The tag to remove.
   */
  removeTag(tag: string): void {
    if (!tag) {
      return;
    }
    const lower = tag.toLowerCase();
    const { tags } = this;
    const index = tags.findIndex(t => t.toLowerCase() === lower);
    if (index >= 0) {
      tags.splice(index, 1);
    }
  }

  /**
   * Creates a Property Shape of AMF.
   * The property itself is auto-generated. If the `schema` is defined then it is used
   * as the `range` of the property. Otherwise basic shape is generated for the range.
   * 
   * This is a preferred way of reading the AMF shape as this synchronizes changed 
   * data properties with the shape definition.
   * 
   * @returns AMF property shape definition.
   */
  toApiShape(): IPropertyShape {
    const serializer = new AmfShapeGenerator();
    return serializer.property(this);
  }

  /**
   * @returns The adapted property, if any
   */
  readAdapted(): DataProperty | undefined {
    const { adapts } = this;
    if (!adapts) {
      return undefined;
    }
    return this.root.definitions.properties.find(i => i.key === adapts);
  }

  /**
   * Creates new adapted property and associates it with this property.
   * @returns The instance of the created property.
   */
  createAdapted(): DataProperty {
    const property = new DataProperty(this.root);
    // disallow defaults as this would influence the schema generation
    property.info.name = undefined;
    this.root.definitions.properties.push(property);
    this.adapts = property.key;
    return property;
  }
}
