import { IThing, Thing } from "../Thing.js";
import v4 from '../../lib/uuid.js';
import { DataNamespace } from "./DataNamespace.js";
import { DataProperty, DataPropertyType } from "./DataProperty.js";
import { DataAssociation } from "./DataAssociation.js";
import { IBreadcrumb } from "../store/Breadcrumb.js";
import { DataModel } from "./DataModel.js";

export const Kind = 'Core#DataEntity';

/**
 * Data entity is the smallest description of a data in the system
 * It contains properties and associations. At least one entity describe a data model.
 */
export interface IDataEntity {
  kind: typeof Kind;
  /**
   * The key of the namespace.
   */
  key: string;
  /**
   * The data entity description.
   */
  info: IThing;

  /**
   * Optional general purpose tags for the UI.
   */
  tags?: string[];
  
  /**
   * For future use.
   * 
   * The keys of the taxonomy items associated with the entity.
   */
  taxonomy?: string[];

  /**
   * The list of keys of properties that belong to this entity.
   */
  properties?: string[];

  /**
   * The list of keys of associations that belong to this entity.
   */
  associations?: string[];

  /**
   * The list of keys of entities that are parents to this entity.
   * 
   * This potentially may cause a conflict when two parents declare the same 
   * property. In such situation this entity should define own property 
   * with the same name to shadow parent property. When the property is 
   * not shadowed this may cause unexpected results as the processing could result 
   * with inconsistent definition of a schema because the last read property wins.
   */
  parents?: string[];
}

/**
 * Data entity is the smallest description of a data in the system
 * It contains properties and associations. At least one entity describe a data model.
 */
export class DataEntity {
  kind = Kind;

  key = '';

  /**
   * The description of the data namespace.
   */
  info: Thing = Thing.fromName('');

  /**
   * Optional general purpose tags for the UI.
   */
  tags: string[] = [];
  
  /**
   * Reserved for future use.
   * 
   * The keys of the taxonomy items associated with the entity.
   */
  taxonomy: string[] = [];

  /**
   * The list of keys of properties that belong to this entity.
   */
  properties: DataProperty[] = [];

  /**
   * The list of keys of associations that belong to this entity.
   */
  associations: DataAssociation[] = [];

  /**
   * The list of keys of entities that are parents to this entity.
   * 
   * This potentially may cause a conflict when two parents declare the same 
   * property. In such situation this entity should define own property 
   * with the same name to shadow parent property. When the property is 
   * not shadowed this may cause unexpected results as the processing could result 
   * with inconsistent definition of a schema because the last read property wins.
   */
  parents: string[] = [];

  static fromName(root: DataNamespace, name: string): DataEntity {
    const entity = new DataEntity(root);
    entity.info = Thing.fromName(name);
    return entity;
  }

  /**
   * @param input The data entity definition to restore.
   */
  constructor(protected root: DataNamespace, input?: string | IDataEntity) {
    let init: IDataEntity;
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

  new(init: IDataEntity): void {
    if (!DataEntity.isDataEntity(init)) {
      throw new Error(`Not a data entity.`);
    }
    const { info, key = v4(), kind = Kind, tags, taxonomy, parents, properties, associations } = init;
    this.kind = kind;
    this.key = key;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
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
    if (Array.isArray(parents)) {
      this.parents = [...parents];
    } else {
      this.parents = [];
    }

    this.properties = [];
    if (Array.isArray(properties)) {
      properties.forEach(key => {
        const value = this._readProperty(key);
        if (value) {
          this.properties.push(value);
        }
      });
    }

    this.associations = [];
    if (Array.isArray(associations)) {
      associations.forEach(key => {
        const value = this._readAssociation(key);
        if (value) {
          this.associations.push(value);
        }
      });
    }
  }

  static isDataEntity(input: unknown): boolean {
    const typed = input as IDataEntity;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IDataEntity {
    const result: IDataEntity = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
    };
    if (Array.isArray(this.tags) && this.tags.length) {
      result.tags = [...this.tags];
    }
    if (Array.isArray(this.taxonomy) && this.taxonomy.length) {
      result.taxonomy = [...this.taxonomy];
    }
    if (Array.isArray(this.parents) && this.parents.length) {
      result.parents = [...this.parents];
    }
    if (Array.isArray(this.properties) && this.properties.length) {
      result.properties = this.properties.map(i => i.key);
    }
    if (Array.isArray(this.associations) && this.associations.length) {
      result.associations = this.associations.map(i => i.key);
    }
    return result;
  }

  protected _readAssociation(key: string): DataAssociation | undefined {
    return this.root.definitions.associations.find(i => i.key === key);
  }

  protected _readProperty(key: string): DataProperty | undefined {
    return this.root.definitions.properties.find(i => i.key === key);
  }

  /**
   * Creates a property with a passed type.
   * @param type The type of the property
   * @returns The created property
   */
  addTypedProperty(type: DataPropertyType): DataProperty {
    const property = DataProperty.fromType(this.root, type);
    this.root.definitions.properties.push(property);
    this.properties.push(property);
    return property;
  }

  /**
   * Creates a property with a passed type.
   * @param name The name of the property.
   * @returns The created property
   */
  addNamedProperty(name: string): DataProperty {
    const property = DataProperty.fromName(this.root, name);
    this.root.definitions.properties.push(property);
    this.properties.push(property);
    return property;
  }

  /**
   * Removes the property from the entity and namespace definitions.
   * @param key The key of the property to remove.
   */
  removeProperty(key: string): void {
    const thisIndex = this.properties.findIndex(i => i.key === key);
    if (thisIndex < 0) {
      return;
    }
    this.properties.splice(thisIndex, 1);
    const defIndex = this.root.definitions.properties.findIndex(i => i.key === key);
    if (defIndex >= 0) {
      this.root.definitions.properties.splice(defIndex, 1);
    }
  }

  /**
   * Creates an association for a given name, adds it to definitions, and returns it.
   * @param name The name of the association
   * @returns The created association
   */
  addNamedAssociation(name: string): DataAssociation {
    const result = DataAssociation.fromName(this.root, name);
    this.root.definitions.associations.push(result);
    this.associations.push(result);
    return result;
  }

  /**
   * Creates an association for a given target, adds it to definitions, and returns it.
   * @param target The target entity key of the association
   * @returns The created association
   */
  addTargetAssociation(target: string): DataAssociation {
    const result = DataAssociation.fromTarget(this.root, target);
    this.root.definitions.associations.push(result);
    this.associations.push(result);
    return result;
  }

  /**
   * Removes an association from the entity and namespace definitions.
   * @param key The key of the association to remove.
   */
  removeAssociation(key: string): void {
    const thisIndex = this.associations.findIndex(i => i.key === key);
    if (thisIndex < 0) {
      return;
    }
    this.associations.splice(thisIndex, 1);
    const defIndex = this.root.definitions.associations.findIndex(i => i.key === key);
    if (defIndex >= 0) {
      this.root.definitions.associations.splice(defIndex, 1);
    }
  }

  /**
   * Reads the list of parents for the entity, inside the root namespace. The computed list contains the list of all
   * parents in the inheritance chain in no particular order.
   */
  getComputedParents(): DataEntity[] {
    const { entities } = this.root.definitions;
    let result: DataEntity[] = [];
    this.parents.forEach((key) => {
      const parent = entities.find(i => i.key === key);
      if (parent) {
        result.push(parent);
        result = result.concat(parent.getComputedParents());
      }
    });
    return result;
  }

  /**
   * Computes list of all children, inside the root namespace, that extends this entity.
   * The children are not ordered.
   */
  getComputedChildren(): DataEntity[] {
    const { entities } = this.root.definitions;
    return entities.filter(i => i.parents.includes(this.key));
  }

  /**
   * Computes a list of entities that are associated with the current entity.
   */
  getComputedAssociations(): DataEntity[] {
    const { root, associations } = this;
    const { entities } = root.definitions;
    const result: DataEntity[] = [];
    associations.forEach((assoc) => {
      if (!assoc.target) {
        return;
      }
      const entity = entities.find(i => i.key === assoc.target);
      if (entity) {
        result.push(entity);
      }
    });
    return result;
  }

  /**
   * Removes self from the namespace with all properties and attributes.
   */
  remove(): void {
    const { key, properties, associations, root } = this;
    // remove own stuff
    properties.forEach(p => this.removeProperty(p.key));
    associations.forEach(a => this.removeAssociation(a.key));
    // remove from the root
    const index = root.definitions.entities.findIndex(i => i.key === key);
    if (index >= 0) {
      root.definitions.entities.splice(index, 1);
    }
    // remove from the parent
    const model = this.getParent();
    if (model) {
      const entityIndex = model.entities.findIndex(e => e === this);
      model.entities.splice(entityIndex, 1);
    }
  }

  /**
   * Returns a parent data model where this entity exist.
   */
  getParent(): DataModel | undefined {
    return this.root.definitions.models.find(m => m.entities.some(e => e === this));
  }

  /**
   * Tests whether one entity is associated with another.
   * 
   * @param entity1 The source entity
   * @param entity2 The target entity
   * @returns true when there's any path from one entity to another.
   */
  static isAssociated(entity1: DataEntity, entity2: DataEntity): boolean {
    return entity1.isAssociated(entity2.key);
  }

  /**
   * Tests whether this entity is somehow associated with another entity.
   * @param target The key of the target entity to test for association with.
   * @returns true if this entity has any association to the `target` entity.
   */
  isAssociated(target: string): boolean {
    const it = this.associationPath(target);
    const path = it.next().value;
    return !!path;
  }

  /**
   * Prints out all associations from one entity to another through all entities that may be in between.
   * @param toEntity The key to the target entity
   * @yields The path containing keys of entities from this entity to the `toEntity` (inclusive) and all entities in between.
   */
  * associationPath(toEntity: string): Generator<string[]> {
    const graph = this._associationGraph();
    for (const path of this._associationPath(this.key, toEntity, graph)) {
      yield path;
    }
  }

  /**
   * The actual implementation of the graph search.
   * 
   * @param from The current from node
   * @param to The target node
   * @param g The graph
   * @param path The current list of entity ids.
   * @param visited The list of visited paths to avoid cycles
   */
  protected * _associationPath(from: string, to: string, g: Record<string, string[]>, path: string[] = [], visited: Set<string> = new Set()): Generator<string[]> {
    if (from === to) {
      yield path.concat(to);
      return;
    }
    if (visited.has(from)) {
      // it's a cycle
      return;
    }
    if (g[from]) {
      visited.add(from);
      path.push(from);

      for (const neighbor of g[from]) {
        yield *this._associationPath(neighbor, to, g, path, visited);
      }
      
      visited.delete(from);
      path.pop();
    }
  }

  /**
   * @returns The graph of associations where keys are the source entities and the value is the list of all target entities.
   */
  protected _associationGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    const { associations, entities } = this.root.definitions;
    for (const assoc of associations) {
      if (!assoc.target) {
        continue;
      }
      const srcEntity = entities.find(i => i.associations.some(a => a === assoc));
      if (!srcEntity) {
        continue;
      }
      if (!graph[srcEntity.key]) {
        graph[srcEntity.key] = [];
      }
      graph[srcEntity.key].push(assoc.target);
    }
    return graph;
  }

  /**
   * Creates breadcrumbs from this entity to the root namespace.
   */
  breadcrumbs(): IBreadcrumb[] {
    const result: IBreadcrumb[] = [];
    result.push({
      key: this.key,
      displayName: this.info.name || 'Unnamed entity',
      kind: Kind,
    });
    const model = this.getParent();
    if (model) {
      result.push({
        key: model.key,
        kind: model.kind,
        displayName: model.info.name || 'Unnamed data model',
      });
      let parent = model.getParent();
      while (parent && parent !== this.root) {
        result.push({
          key: parent.key,
          kind: parent.kind,
          displayName: parent.info.name || 'Unnamed namespace',
        });
        parent = parent.getParent();
      }
    }
    result.push({
      key: this.root.key,
      displayName: this.root.info.name || 'Unnamed namespace',
      kind: this.root.kind,
    });
    return result.reverse();
  }
}