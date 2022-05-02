import { IThing, Thing } from "../Thing.js";
import v4 from '../../lib/uuid.js';
import { DataEntity, IDataEntity } from "./DataEntity.js";
import { DataNamespace } from "./DataNamespace.js";
import { IBreadcrumb } from "../store/Breadcrumb.js";

export const Kind = 'Core#DataModel';

/**
 * Data model creates a logical structure around data entities.
 * It groups entities that represents a whole schema, like a Product data model
 * can have entities that describe: the product entity, price history entity, 
 * product location, etc. 
 */
export interface IDataModel {
  kind: typeof Kind;
  /**
   * The key of the namespace.
   */
  key: string;
  /**
   * The data model description.
   */
  info: IThing;
  /**
   * The list of keys of entities that this data model contain.
   */
  entities?: string[];
}

/**
 * Data model creates a logical structure around data entities.
 * It groups entities that represents a whole schema, like a Product data model
 * can have entities that describe: the product entity, price history entity, 
 * product location, etc. 
 */
export class DataModel {
  kind = Kind;

  key = '';

  /**
   * The description of the data namespace.
   */
  info: Thing = Thing.fromName('');

  /**
   * The list of keys of entities that this data model contain.
   */
  entities: DataEntity[] = [];

  static fromName(root: DataNamespace, name: string): DataModel {
    const entity = new DataModel(root);
    entity.info = Thing.fromName(name);
    return entity;
  }

  /**
   * @param root the root namespace.
   * @param input The data model definition to restore.
   */
  constructor(protected root: DataNamespace, input?: string | IDataModel) {
    let init: IDataModel;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: Thing.fromName('').toJSON(),
        entities: [],
      };
    }
    this.new(init);
  }

  new(init: IDataModel): void {
    if (!DataModel.isDataModel(init)) {
      throw new Error(`Not a data model.`);
    }
    const { info, key = v4(), kind = Kind, entities } = init;
    this.kind = kind;
    this.key = key;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }

    this.entities = [];
    if (Array.isArray(entities)) {
      entities.forEach(key => {
        const value = this._readEntity(key);
        if (value) {
          this.entities.push(value);
        }
      });
    }
  }

  static isDataModel(input: unknown): boolean {
    const typed = input as IDataModel;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IDataModel {
    const result: IDataModel = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
    };
    if (Array.isArray(this.entities) && this.entities.length) {
      result.entities = this.entities.map(i => i.key);
    }
    return result;
  }

  protected _readEntity(key: string): DataEntity | undefined {
    return this.root.definitions.entities.find(i => i.key === key);
  }

  /**
   * Removes self from the namespace with all entities.
   */
  remove(): void {
    const { key, entities, root } = this;
    // remove children
    entities.forEach(e => e.remove());

    // remove self from the parent
    const parent = this.getParent();
    if (parent) {
      const itemIndex = parent.items.findIndex(i => i.key === key);
      if (itemIndex >= 0) {
        parent.items.splice(itemIndex, 1);
      }
    }
    // remove self from definitions
    const index = root.definitions.models.findIndex(i => i.key === key);
    if (index >= 0) {
      root.definitions.models.splice(index, 1);
    }
  }

  /**
   * Adds an entity to this data model.
   * 
   * @param init The name of the entity to create, the instance of the entity or its schema
   * @returns A reference to the created entity.
   */
  addEntity(init: string | DataEntity | IDataEntity): DataEntity {
    let definition: DataEntity;
    if (typeof init === 'string') {
      definition = DataEntity.fromName(this.root, init);
    } else if (init instanceof DataEntity) {
      definition = init;
    } else {
      definition = new DataEntity(this.root, init);
    }
    this.root.definitions.entities.push(definition);
    this.entities.push(definition);
    return definition;
  }

  /**
   * Returns a parent namespace where this data model exist.
   */
  getParent(): DataNamespace | undefined {
    if (this.root.items.some(e => e.key === this.key)) {
      return this.root;
    }
    return this.root.definitions.namespaces.find(n => n.items.some(e => e.key === this.key));
  }

  /**
   * Creates breadcrumbs from this data model to the root namespace.
   */
  breadcrumbs(): IBreadcrumb[] {
    const result: IBreadcrumb[] = [];
    result.push({
      key: this.key,
      displayName: this.info.name || 'Unnamed data model',
      kind: Kind,
    });
    let parent = this.getParent();
    while (parent && parent !== this.root) {
      result.push({
        key: parent.key,
        kind: parent.kind,
        displayName: parent.info.name || 'Unnamed namespace',
      });
      parent = parent.getParent();
    }
    result.push({
      key: this.root.key,
      displayName: this.root.info.name || 'Unnamed namespace',
      kind: this.root.kind,
    });
    return result.reverse();
  }
}
