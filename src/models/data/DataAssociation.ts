import v4 from '../../lib/uuid.js';
import { IThing, Thing } from "../Thing.js";
import { IDataAssociationSchema } from './DataAssociationSchema.js';
import { DataEntity } from './DataEntity.js';
import { DataNamespace } from './DataNamespace.js';

export const Kind = 'Core#DataAssociation';

export interface IDataAssociation {
  kind: typeof Kind;
  /**
   * The key of the namespace.
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
   * The target entity of this association.
   * An association without a target is considered invalid and discarded when processing the values.
   */
  target?: string;
  /**
   * The schema allowing to translate the model into a specific format (like JSON, RAML, XML, etc.)
   */
  schema?: IDataAssociationSchema;
}

export class DataAssociation {
  kind = Kind;

  key = '';

  /**
   * The description of the data namespace.
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
   * The target entity of this association.
   * An association without a target is considered invalid and discarded when processing the values.
   */
  target?: string;

  /**
   * The schema allowing to translate the model into a specific format (like JSON, RAML, XML, etc.)
   * 
   * Implementation note, when an entity is removed this property is not changed. The target can't 
   * be read but it can be tracked to a deleted entity.
   */
  schema?: IDataAssociationSchema;

  static fromTarget(root: DataNamespace, target: string): DataAssociation {
    const assoc = new DataAssociation(root);
    assoc.target = target;
    return assoc;
  }

  static fromName(root: DataNamespace, name: string): DataAssociation {
    const assoc = new DataAssociation(root);
    assoc.info = Thing.fromName(name);
    return assoc;
  }

  /**
   * @param input The data association definition to restore.
   */
  constructor(protected root: DataNamespace, input?: string | IDataAssociation) {
    let init: IDataAssociation;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: Thing.fromName('').toJSON(),
      };
    }
    this.new(init);
  }

  new(init: IDataAssociation): void {
    if (!DataAssociation.isDataAssociation(init)) {
      throw new Error(`Not a data association.`);
    }
    const { info, key = v4(), kind = Kind, schema, multiple, required, target } = init;
    this.kind = kind;
    this.key = key;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    if (schema) {
      this.schema = { ...schema };
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
    if (typeof target === 'string') {
      this.target = target;
    } else {
      this.target = undefined;
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
      result.schema = { ...this.schema };
    }
    if (typeof this.multiple === 'boolean') {
      result.multiple = this.multiple;
    }
    if (typeof this.required === 'boolean') {
      result.required = this.required;
    }
    if (typeof this.target === 'string') {
      result.target = this.target;
    }
    return result;
  }

  getTarget(): DataEntity | undefined {
    const { root, target } = this;
    if (!target) {
      return undefined;
    }
    return root.definitions.entities.find(i => i.key === target);
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
}
