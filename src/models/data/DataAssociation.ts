import { Core as JsonCore } from '@api-client/json';
import { AmfShapeGenerator } from '../../amf/AmfShapeGenerator.js';
import { IAssociationShape, IPropertyShape } from '../../amf/definitions/Shapes.js';
import v4 from '../../lib/uuid.js';
import { IThing, Thing } from "../Thing.js";
import { DataEntity, IDataEntity } from './DataEntity.js';
import { DataNamespace } from './DataNamespace.js';

export const Kind = 'Core#DataAssociation';

/**
 * Describes an association between entities. An association is another property of an entity. The `name` is the name of the
 * property and the value is the associated target or targets.
 * 
 * An association can have multiple targets to allow describing the model as `allOf`, `anyOf` and `oneOf` schemas.
 * When the association has only one target, then generated schema cannot have union types.
 * 
 * Depending on the schema translation an association can be embedded as a sub-object in the generated schema
 * or can be references via a primary key.
 */
export interface IDataAssociation {
  kind: typeof Kind;
  /**
   * The key of the association.
   */
  key: string;
  /**
   * The data association description.
   */
  info: IThing;
  /**
   * Wether the data association is required.
   */
  required?: boolean;
  /**
   * Whether the data association allows multiple items.
   */
  multiple?: boolean;
  /**
   * Whether the attribute is hidden in the schema (not a part of it).
   * The hidden attribute should only appear in the adapted attribute. 
   * Has no effect when added to the "main" attribute.
   */
  hidden?: boolean;
  /**
   * The list of keys associated with the entity through this association.
   * An association without a target is considered invalid and discarded when processing the values.
   */
  targets?: string[];
  /**
   * The schema allowing to translate the model into a specific format (like JSON, RAML, XML, etc.)
   * 
   * When this is defined then it is used as the schema. When this is not defined it uses 
   * referenced entities schemas. Note, changes in the referenced entities may not be propagated
   * to schemas altered by the user.
   * 
   * Note, schema can only occur on an adapted property. Has no effect on the "main"
   * property.
   */
  schema?: IAssociationShape;
  /**
   * The key of the association that is adapted by this association.
   * Adapted associations can manipulate the shape of the schema for the association.
   * 
   * Each value defined on the adapted association changes the original value defined on
   * the association.
   */
  adapts?: string;
}

/**
 * Describes an association between entities. An association is another property of an entity. The `name` is the name of the
 * property and the value is the associated target or targets.
 * 
 * An association can have multiple targets to allow describing the model as `allOf`, `anyOf` and `oneOf` schemas.
 * When the association has only one target, then generated schema cannot have union types.
 * 
 * Depending on the schema translation an association can be embedded as a sub-object in the generated schema
 * or can be references via a primary key.
 */
export class DataAssociation {
  kind = Kind;

  key = '';

  /**
   * The description of the data association.
   */
  info: Thing = Thing.fromName('');

  /**
   * Wether the data association is required.
   */
  required?: boolean;

  /**
   * Whether the data association allows multiple items.
   */
  multiple?: boolean;

  /**
   * Whether the attribute is hidden in the schema (not a part of it).
   * The hidden attribute should only appear in the adapted attribute. 
   * Has no effect when added to the "main" attribute.
   */
  hidden?: boolean;

  /**
   * The list of keys associated with the entity through this association.
   * An association without a target is considered invalid and discarded when processing the values.
   */
  targets: string[] = [];

  /**
   * The schema allowing to translate the model into a specific format (like JSON, RAML, XML, etc.)
   * 
   * When this is defined then it is used as the schema. When this is not defined it uses 
   * referenced entities schemas. Note, changes in the referenced entities may not be propagated
   * to schemas altered by the user.
   * 
   * Note, schema can only occur on an adapted property. Has no effect on the "main"
   * property.
   */
  schema?: IAssociationShape;

  /**
   * The key of the association that is adapted by this association.
   * Adapted associations can manipulate the shape of the schema for the association.
   * 
   * Each value defined on the adapted association changes the original value defined on
   * the association.
   */
  adapts?: string;

  /**
   * Returns true when the association has 0 or 1 targets.
   */
  get isSingle(): boolean {
    return this.targets.length < 2;
  }

  /**
   * Creates an instance of DataAssociation from a target entity key.
   * Note, this entity will have no name. The default name is used instead.
   * 
   * @param root The namespace root.
   * @param target The target entity key.
   */
  static fromTarget(root: DataNamespace, target: string): DataAssociation {
    const assoc = new DataAssociation(root);
    assoc.targets = [target];
    return assoc;
  }

  /**
   * Creates an instance of DataAssociation from a name, without defining a target.
   * 
   * @param root The namespace root.
   * @param name The name of the association.
   */
  static fromName(root: DataNamespace, name: string): DataAssociation {
    const assoc = new DataAssociation(root);
    assoc.info = Thing.fromName(name);
    return assoc;
  }

  /**
   * @param input The data association definition to restore.
   */
  constructor(public root: DataNamespace, input?: string | IDataAssociation) {
    let init: IDataAssociation;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: Thing.fromName('Unnamed association').toJSON(),
      };
    }
    this.new(init);
  }

  new(init: IDataAssociation): void {
    if (!DataAssociation.isDataAssociation(init)) {
      throw new Error(`Not a data association.`);
    }
    const { 
      info, key = v4(), kind = Kind, schema, multiple, required, targets,
      adapts, hidden,
    } = init;
    this.kind = kind;
    this.key = key;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    if (schema) {
      this.schema = JsonCore.clone(schema);
    } else {
      this.schema = undefined;
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
    if (Array.isArray(targets)) {
      this.targets = [...targets];
    } else {
      this.targets = [];
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
  }

  static isDataAssociation(input: unknown): boolean {
    const typed = input as IDataAssociation;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IDataAssociation {
    const result: IDataAssociation = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
    };
    if (this.schema) {
      result.schema = JsonCore.clone(this.schema);
    }
    if (typeof this.multiple === 'boolean') {
      result.multiple = this.multiple;
    }
    if (typeof this.required === 'boolean') {
      result.required = this.required;
    }
    if (Array.isArray(this.targets) && this.targets.length) {
      result.targets = [...this.targets];
    }
    if (typeof this.hidden === 'boolean') {
      result.hidden = this.hidden;
    }
    if (this.adapts) {
      result.adapts = this.adapts;
    }
    return result;
  }

  /**
   * @returns The list of DataEntity definitions for the current targets.
   */
  getTargets(): DataEntity[] {
    const { root, targets } = this;
    return root.definitions.entities.filter(item => targets.some(i => i === item.key));
  }

  /**
   * Removes self from the parent entity and the namespace definition.
   */
  remove(): void {
    const { root } = this;
    const entity = root.definitions.entities.find(i => i.associations.some(j => j === this));
    if (entity) {
      const assocIndex = entity.associations.findIndex(i => i === this);
      entity.associations.splice(assocIndex, 1);
    }
    const defIndex = this.root.definitions.associations.findIndex(i => i.key === this.key);
    if (defIndex >= 0) {
      this.root.definitions.associations.splice(defIndex, 1);
    }
  }
  
  /**
   * Adds a target to the targets list from an entity.
   * @param entity The instance or schema of an entity.
   */
  addTarget(entity: DataEntity | IDataEntity): void;

  /**
   * Adds the target to the targets list with an entity key..
   * @param key The key of the entity to add.
   */
  addTarget(key: string): void;

  /**
   * @param init The key of an entity, its instance, or schema.
   */
  addTarget(init: string | DataEntity | IDataEntity): void {
    if (typeof init === 'string') {
      this.targets.push(init);
    } else {
      const { key } = init;
      this.targets.push(key);
    }
  }

  /**
   * Removes a target entity from the targets list.
   * 
   * @param entity The instance or schema of the entity to remove.
   */
  removeTarget(entity: DataEntity | IDataEntity): void;

  /**
   * Removes a target entity from the targets list.
   * 
   * @param key The key of the target entity to remove.
   */
  removeTarget(key: string): void;

  /**
   * Removes a target entity from the targets list.
   * 
   * @param init The key of an entity, its instance, or schema.
   */
  removeTarget(init: string | DataEntity | IDataEntity): void {
    let key: string;
    if (typeof init === 'string') {
      key = init;
    } else {
      key = init.key;
    }
    const index = this.targets.indexOf(key);
    if (index >= 0) {
      this.targets.splice(index, 1);
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
    return serializer.associationProperty(this);
  }

  /**
   * @returns The adapted association, if any
   */
  readAdapted(): DataAssociation | undefined {
    const { adapts } = this;
    if (!adapts) {
      return undefined;
    }
    return this.root.definitions.associations.find(i => i.key === adapts);
  }

  /**
   * Creates new adapted association and associates it with this association.
   * @returns The instance of the created association.
   */
  createAdapted(): DataAssociation {
    const association = new DataAssociation(this.root);
    this.root.definitions.associations.push(association);
    this.adapts = association.key;
    return association;
  }
}
