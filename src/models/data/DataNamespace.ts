import { IThing, Thing } from "../Thing.js";
import { IDataAssociation, DataAssociation } from "./DataAssociation.js";
import { IDataEntity, DataEntity } from "./DataEntity.js";
import { IDataModel, DataModel, Kind as DataModelKind } from "./DataModel.js";
import { IDataProperty, DataProperty } from "./DataProperty.js";
import v4 from '../../lib/uuid.js';

export const Kind = 'Core#DataNamespace';
type ItemKind = typeof Kind | typeof DataModelKind;

interface IDataDefinitions {
  models?: IDataModel[];
  entities?: IDataEntity[];
  properties?: IDataProperty[];
  associations?: IDataAssociation[];
  namespaces?: IDataNamespace[];
  tags?: string[];
}

interface DataDefinitions {
  models: DataModel[];
  entities: DataEntity[];
  properties: DataProperty[];
  associations: DataAssociation[];
  namespaces: DataNamespace[];
  /**
   * Common for the entire root namespace tags.
   * These are kept separately so the UI can generate autocomplete for tags.
   */
  tags: string[];
}

interface IDataNamespaceParent {
  kind: typeof Kind;
  /**
   * The key of the namespace.
   */
  key: string;
  /**
   * The ordered list of items in this namespace.
   */
  items: IDataItem[];
  /**
   * The data namespace description.
   */
  info: IThing;
}

/**
 * Data namespace is a logical description of the hierarchy in the data.
 */
export interface IDataNamespace extends IDataNamespaceParent {
  /**
   * The list of definitions used in the namespace.
   */
  definitions: IDataDefinitions;
}

/**
 * Data item is a reference to an object in the top namespace definitions
 * to the namespace items.
 */
export interface IDataItem {
  /**
   * The kind of the item.
   */
  kind: ItemKind;
  /**
   * The identifier in the `definitions` array of the namespace.
   */
  key: string;
}

class DataNamespaceParent {
  kind = Kind;

  key = '';

  /**
   * The ordered list of items in this namespace.
   */
  items: DataItem[] = [];

  /**
   * The description of the data namespace.
   */
  info: Thing = Thing.fromName('');

  /**
   * When a namespace is a sub-namespace this is the reference to the 
   * root namespace with all definitions.
   */
  root?: DataNamespace;

  constructor(root?: DataNamespace) {
    this.root = root;
  }

  /**
   * @returns The parent namespace of this namespace. It returns `undefined` when this is the root namespace.
   */
  getParent(): DataNamespace | undefined {
    const { root, key } = this;
    if (root) {
      const result = (root as DataNamespace).findParent(key);
      if (result === this.root) {
        return undefined;
      }
      return result;
    }
    // we are the root namespace.
    return undefined;
  }

  /**
   * Adds a data namespace to the structure.
   * @param init The name of the namespace to add, namespace's schema, or instance.
   * @param parent The optional key of the parent namespace to add the new namespace to.
   */
  addNamespace(init: string | IDataNamespace | DataNamespace): DataNamespace {
    return this.root!.addNamespace(init, this.key);
  }

  /**
   * Lists namespaces that are in this namespace items.
   */
  listNamespaces(): DataNamespace[] {
    const result: DataNamespace[] = [];
    const { items } = this;
    const root = this.getRoot();
    const { namespaces } = root.definitions;
    items.forEach(i => {
      if (i.kind !== Kind) {
        return;
      }
      const def = namespaces.find(j => j.key === i.key);
      if (def) {
        result.push(def);
      }
    });
    return result;
  }

  /**
   * Lists namespaces that are in this namespace items.
   */
  listDataModels(): DataModel[] {
    const result: DataModel[] = [];
    const { items } = this;
    const root = this.getRoot();
    const { models } = root.definitions;
    items.forEach(i => {
      if (i.kind !== DataModelKind) {
        return;
      }
      const def = models.find(j => j.key === i.key);
      if (def) {
        result.push(def);
      }
    });
    return result;
  }

  /**
   * @returns The root of the namespaces tree. It might be the same object.
   */
  getRoot(): DataNamespace {
    if (this.root) {
      return this.root;
    }
    return (this as unknown) as DataNamespace;
  }

  /**
   * Removes self from the parent namespace with all data models.
   * This does noting for the root namespace.
   */
  remove(): void {
    const { root } = this;
    if (!root) {
      throw new Error(`Unable to remove the root namespace this way.`);
    }
    const models = this.listDataModels();
    const children = this.listNamespaces();
    models.forEach(m => m.remove());
    children.forEach(c => c.remove());
    const index = root.definitions.namespaces.findIndex(i => i.key === this.key);
    if (index >= 0) {
      root.definitions.namespaces.splice(index, 1);
    }
  }
}

export class DataItem implements IDataItem {
  kind: ItemKind = DataModelKind;

  key = '';

  /**
   * A reference to the top level namespace.
   */
  private root: DataNamespace;

  static isDataItem(input: unknown): boolean {
    const typed = input as IDataItem;
    if (!input || ![DataModelKind, Kind].includes(typed.kind)) {
      return false;
    }
    return true;
  }

  static dataNamespace(root: DataNamespace, key: string): DataItem {
    const item = new DataItem(root, {
      kind: Kind,
      key,
    });
    return item;
  }

  static dataModel(root: DataNamespace, key: string): DataItem {
    const item = new DataItem(root, {
      kind: DataModelKind,
      key,
    });
    return item;
  }

  /**
   * @param root The top-most data namespace.
   * @param input The project item definition used to restore the state.
   */
  constructor(root: DataNamespace, input: string | IDataItem) {
    this.root = root;
    let init: IDataItem;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      throw new Error('Specify the type of the item.');
    }
    this.new(init);
  }

  new(init: IDataItem): void {
    if (!DataItem.isDataItem(init)) {
      throw new Error(`Not a data item.`);
    }
    const { kind, key } = init;
    this.kind = kind;
    this.key = key;
  }

  toJSON(): IDataItem {
    const result: IDataItem = {
      kind: this.kind,
      key: this.key,
    };
    return result;
  }

  getItem(): DataNamespace | DataModel | undefined {
    const { root, key, kind } = this;
    const { definitions } = root;
    if (kind === DataModelKind) {
      return definitions.models.find(i => i.key === key);
    }
    if (kind === kind) {
      return definitions.namespaces.find(i => i.key === key);
    }
  }
}

/**
 * Data namespace is a logical description of the hierarchy in the data.
 */
export class DataNamespace extends DataNamespaceParent {
  definitions: DataDefinitions;

  /**
   * Creates a new data namespace from a name.
   * @param name The name to set.
   */
  static fromName(name: string, root?: DataNamespace): DataNamespace {
    const ns = new DataNamespace(undefined, root);
    const info = Thing.fromName(name);
    ns.info = info;
    return ns;
  }

  static definitions(): DataDefinitions {
    return {
      models: [],
      associations: [],
      entities: [],
      properties: [],
      namespaces: [],
      tags: [],
    };
  }

  constructor(input?: string | IDataNamespace, root?: DataNamespace) {
    super(root);
    this.definitions = DataNamespace.definitions() as DataDefinitions;

    let init: IDataNamespace;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
      if (!init.kind) {
        init.kind = Kind;
      }
    } else {
      init = {
        kind: Kind,
        key: v4(),
        definitions: {},
        items: [],
        info: Thing.fromName('').toJSON(),
      }
    }
    this.new(init);
  }

  new(init: IDataNamespace): void {
    if (!init || !init.definitions || !init.items) {
      throw new Error(`Not a data namespace.`);
    }
    const { key = v4(), definitions = {}, items, info } = init;
    this.key = key;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    if (Array.isArray(items)) {
      this.items = items.map(i => new DataItem(this, i));
    } else {
      this.items = [];
    }
    if (Array.isArray(definitions.associations)) {
      this.definitions.associations = definitions.associations.map(i => new DataAssociation(this, i));
    } else {
      this.definitions.associations = [];
    }
    if (Array.isArray(definitions.properties)) {
      this.definitions.properties = definitions.properties.map(i => new DataProperty(this, i));
    } else {
      this.definitions.properties = [];
    }
    // note, entities must be restored after properties / associations
    if (Array.isArray(definitions.entities)) {
      this.definitions.entities = definitions.entities.map(i => new DataEntity(this, i));
    } else {
      this.definitions.entities = [];
    }
    // must be set after entities.
    if (Array.isArray(definitions.models)) {
      this.definitions.models = definitions.models.map(i => new DataModel(this, i));
    } else {
      this.definitions.models = [];
    }
    if (Array.isArray(definitions.namespaces)) {
      this.definitions.namespaces = definitions.namespaces.map(i => new DataNamespace(i, this));
    } else {
      this.definitions.namespaces = [];
    }
    if (Array.isArray(definitions.tags)) {
      this.definitions.tags = [...definitions.tags];
    } else {
      this.definitions.tags = [];
    }
  }

  toJSON(): IDataNamespace {
    const result: IDataNamespace = {
      key: this.key,
      kind: Kind,
      info: this.info.toJSON(),
      items: this.items.map(i => i.toJSON()),
      definitions: {},
    };
    const { associations, entities, models, namespaces, properties, tags } = this.definitions;
    if (Array.isArray(associations) && associations.length) {
      result.definitions.associations = associations.map(i => i.toJSON());
    }
    if (Array.isArray(entities) && entities.length) {
      result.definitions.entities = entities.map(i => i.toJSON());
    }
    if (Array.isArray(models) && models.length) {
      result.definitions.models = models.map(i => i.toJSON());
    }
    if (Array.isArray(namespaces) && namespaces.length) {
      result.definitions.namespaces = namespaces.map(i => i.toJSON());
    }
    if (Array.isArray(properties) && properties.length) {
      result.definitions.properties = properties.map(i => i.toJSON());
    }
    if (Array.isArray(tags) && tags.length) {
      result.definitions.tags = [...tags];
    }
    return result;
  }

  /**
   * Finds a parent namespace for the given namespace.
   * @param key The namespace key to find the parent for.
   * @returns The parent namespace or undefined when the namespace does not exist. It may return the root namespace.
   */
  findParent(key: string): DataNamespace | undefined {
    const { definitions, items = [] } = this;
    const rootIndex = items.findIndex(i => i.key === key);
    if (rootIndex >= 0) {
      return this;
    }
    const definition = definitions.namespaces.find(i => i.items.some(item => item.key === key));
    if (definition) {
      return definition;
    }
    return undefined;
  }

  /**
   * Adds a data namespace to the structure.
   * @param init The name of the namespace to add, namespace's schema, or instance.
   * @param parent The optional key of the parent namespace to add the new namespace to.
   */
  addNamespace(init: string | IDataNamespace | DataNamespace, parent?: string): DataNamespace {
    let root: DataNamespace;
    if (parent) {
      const rootCandidate = this.findParent(parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent namespace ${parent}`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }
    let definition: DataNamespace;
    if (typeof init === 'string') {
      definition = DataNamespace.fromName(init, this.root || this);
    } else if (init instanceof DataNamespace) {
      definition = init;
    } else {
      definition = new DataNamespace(init, this.root || this);
    }
    (this.root || this).definitions.namespaces.push(definition);
    const item = DataItem.dataNamespace(this.root || this, definition.key);
    if (!Array.isArray(root.items)) {
      root.items = [];
    }
    root.items.push(item);
    return definition;
  }

  /**
   * Finds a namespace in the definitions.
   * @param key The key of the namespace to find.
   * @returns The namespace definition or undefined when not found.
   */
  findNamespace(key: string): DataNamespace | undefined {
    const { definitions } = this.root || this;
    return definitions.namespaces.find(i => i.key === key);
  }

  /**
   * Finds a namespace and calls the `remove()` on it.
   * @param key The key of the namespace to find.
   */
  removeNamespace(key: string): void {
    const root = this.root || this;
    if (root.key === key) {
      throw new Error(`Unable to remove the root namespace this way.`);
    }
    const { definitions } = root;
    const space = definitions.namespaces.find(i => i.key === key);
    if (space) {
      space.remove();
    }
  }

  /**
   * Adds a data model to a namespace.
   * @param init The name of the data model to add, data model's schema, or its instance.
   * @param parent The optional key of the parent namespace to add the new data model to.
   */
  addDataModel(init: string | IDataModel | DataModel, parent?: string): DataModel {
    let root: DataNamespace;
    if (parent) {
      const rootCandidate = this.findNamespace(parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent namespace ${parent}`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }
    let definition: DataModel;
    if (typeof init === 'string') {
      definition = DataModel.fromName(this.root || this, init);
    } else if (init instanceof DataModel) {
      definition = init;
    } else {
      definition = new DataModel(this.root || this, init);
    }
    (this.root || this).definitions.models.push(definition);
    const item = DataItem.dataModel(this.root || this, definition.key);
    if (!Array.isArray(root.items)) {
      root.items = [];
    }
    root.items.push(item);
    return definition;
  }

  /**
   * Finds a data model in the definitions.
   * @param key The key of the data model to find.
   * @returns The data model definition or undefined when not found.
   */
  findDataModel(key: string): DataModel | undefined {
    const { definitions } = this.root || this;
    return definitions.models.find(i => i.key === key);
  }

  /**
   * Finds a data model and calls the `remove()` on it.
   * @param key The key of the data model to find.
   */
  removeDataModel(key: string): void {
    const { definitions } = this.root || this;
    const model = definitions.models.find(i => i.key === key);
    if (model) {
      model.remove();
    }
  }
}
