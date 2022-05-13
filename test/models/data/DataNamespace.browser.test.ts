import { assert } from '@esm-bundle/chai';
import { DataModel } from '../../../src/models/data/DataModel.js';
import { DataNamespace, IDataNamespace, Kind as DataNamespaceKind } from '../../../src/models/data/DataNamespace.js';
import { Thing } from '../../../src/models/Thing.js';

describe('models', () => {
  describe('data', () => {
    describe('DataNamespace', () => {
      describe('constructor()', () => {
        describe('defaults', () => {
          it('sets the kind', () => {
            const ns = new DataNamespace();
            assert.equal(ns.kind, DataNamespaceKind);
          });

          it('sets the key', () => {
            const ns = new DataNamespace();
            assert.typeOf(ns.key, 'string');
            assert.isNotEmpty(ns.key);
          });

          it('sets the default "info"', () => {
            const ns = new DataNamespace();
            assert.typeOf(ns.info, 'object');
            assert.equal(ns.info.name, '');
          });

          it('sets the default "items"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.items, []);
          });

          it('has no "root" when no parent', () => {
            const ns = new DataNamespace();
            assert.isUndefined(ns.root);
          });

          it('sets the "root" when passed parent', () => {
            const parent = new DataNamespace();
            const ns = new DataNamespace(undefined, parent);
            assert.deepEqual(ns.root, parent);
          });

          it('sets the default "definitions"', () => {
            const ns = new DataNamespace();
            assert.typeOf(ns.definitions, 'object');
          });

          it('sets the default "definitions.models"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.models, []);
          });

          it('sets the default "definitions.tags"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.tags, []);
          });

          it('sets the default "definitions.associations"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.associations, []);
          });

          it('sets the default "definitions.entities"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.entities, []);
          });

          it('sets the default "definitions.properties"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.properties, []);
          });

          it('sets the default "definitions.namespaces"', () => {
            const ns = new DataNamespace();
            assert.deepEqual(ns.definitions.namespaces, []);
          });
        });

        describe('From schema initialization', () => {
          it('sets the key', () => {
            const orig = new DataNamespace().toJSON();
            orig.key = 'test';
            const instance = new DataNamespace(orig);
            assert.equal(instance.key, 'test');
          });
  
          it('sets the info', () => {
            const orig = new DataNamespace().toJSON();
            orig.info.name = 'test';
            const instance = new DataNamespace(orig);
            assert.equal(instance.info.name, 'test');
          });

          it('initializes from JSON schema ', () => {
            const orig = new DataNamespace().toJSON();
            orig.key = 'test';
            const instance = new DataNamespace(JSON.stringify(orig));
            assert.equal(instance.key, 'test');
          });
        });
      });

      describe('fromName()', () => {
        it('sets the name', () => {
          const ns = DataNamespace.fromName('test');
          assert.equal(ns.info.name, 'test');
        });
      });

      describe('new()', () => {
        let base: IDataNamespace;
        beforeEach(() => {
          base = {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataNamespaceKind,
            items: [],
            definitions: {},
          };
        });

        it('sets the key', () => {
          const ns = new DataNamespace();
          ns.new(base);
          assert.equal(ns.key, 'test123');
        });

        it('sets the info', () => {
          const ns = new DataNamespace();
          ns.new(base);
          assert.equal(ns.info.name, 'test name');
        });

        it('sets default info', () => {
          const ns = new DataNamespace();
          delete base.info;
          ns.new(base);
          assert.equal(ns.info.name, '');
        });

        it('throws when unknown input', () => {
          const ns = new DataNamespace();
          assert.throws(() => {
            // @ts-ignore
            ns.new({});
          }, 'Not a data namespace.');
        });

        it('sets the "definitions.namespaces"', () => {
          const ns = new DataNamespace();
          ns.addNamespace('n1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.namespaces, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.namespaces, 0);
        });

        it('sets the "definitions.models"', () => {
          const ns = new DataNamespace();
          ns.addDataModel('d1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.models, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.models, 0);
        });

        it('sets the "definitions.tags"', () => {
          const ns = new DataNamespace();
          ns.definitions.tags = ['a'];
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.tags, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.tags, 0);
        });

        it('sets the "definitions.entities"', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          d1.addEntity('e1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.entities, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.entities, 0);
        });

        it('sets entities on the corresponding data model', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          const model = instance.findDataModel(d1.key);
          const [entity] = model.entities;
          assert.deepEqual(entity, e1);
        });

        it('sets the "definitions.properties"', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          e1.addNamedProperty('p1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.properties, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.properties, 0);
        });

        it('sets the properties on the corresponding entity', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          const p1 = e1.addNamedProperty('p1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          
          const model = instance.findDataModel(d1.key);
          const [entity] = model.entities;
          assert.lengthOf(entity.properties, 1, 'has the properties');
          assert.deepEqual(entity.properties[0], p1, 'has the property');
        });

        it('sets the "definitions.associations"', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          e1.addNamedAssociation('a1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          assert.lengthOf(instance.definitions.associations, 1);
          instance.new(base);
          assert.lengthOf(instance.definitions.associations, 0);
        });

        it('sets the associations on the corresponding entity', () => {
          const ns = new DataNamespace();
          const d1 = ns.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          const a1 = e1.addNamedAssociation('a1');
          const instance = new DataNamespace();
          instance.new(ns.toJSON());
          
          const model = instance.findDataModel(d1.key);
          const [entity] = model.entities;
          assert.lengthOf(entity.associations, 1, 'has the associations');
          assert.deepEqual(entity.associations[0], a1, 'has the association');
        });
      });

      describe('toJSON()', () => {
        let base: DataNamespace;
        beforeEach(() => {
          base = new DataNamespace({
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataNamespaceKind,
            definitions: {},
            items: [],
          });
        });

        it('serializes the kind', () => {
          const result = base.toJSON();
          assert.equal(result.kind, DataNamespaceKind);
        });

        it('serializes the key', () => {
          const result = base.toJSON();
          assert.equal(result.key, base.key);
        });

        it('serializes the info', () => {
          const result = base.toJSON();
          assert.equal(result.info.name, 'test name');
        });

        it('serializes the "items"', () => {
          const created = base.addNamespace('n1');
          const result = base.toJSON();
          assert.lengthOf(result.items, 1);
          assert.equal(result.items[0].key, created.key);
        });

        it('serializes the "definitions"', () => {
          const result = base.toJSON();
          assert.typeOf(result.definitions, 'object');
        });

        it('serializes the "definitions.namespaces"', () => {
          const created = base.addNamespace('n1');
          const result = base.toJSON();
          assert.typeOf(result.definitions.namespaces, 'array', 'has the array');
          assert.lengthOf(result.definitions.namespaces, 1, 'has a single namespace item');
          assert.deepEqual(result.definitions.namespaces, [created.toJSON()], 'has the namespace item');
        });

        it('serializes the "definitions.models"', () => {
          const created = base.addDataModel('d1');
          const result = base.toJSON();
          assert.typeOf(result.definitions.models, 'array', 'has the array');
          assert.lengthOf(result.definitions.models, 1, 'has a single models item');
          assert.deepEqual(result.definitions.models, [created.toJSON()], 'has the models item');
        });

        it('serializes the "definitions.tags"', () => {
          base.definitions.tags = ['a'];
          const result = base.toJSON();
          assert.typeOf(result.definitions.tags, 'array', 'has the array');
          assert.lengthOf(result.definitions.tags, 1, 'has a single tags item');
          assert.deepEqual(result.definitions.tags, ['a'], 'has the tags item');
        });

        it('serializes the "definitions.entities"', () => {
          const d1 = base.addDataModel('d1');
          const created = d1.addEntity('e1');
          const result = base.toJSON();
          assert.typeOf(result.definitions.entities, 'array', 'has the array');
          assert.lengthOf(result.definitions.entities, 1, 'has a single entity item');
          assert.deepEqual(result.definitions.entities, [created.toJSON()], 'has the entity item');
        });

        it('serializes the "definitions.properties"', () => {
          const d1 = base.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          const created = e1.addNamedProperty('p1');
          const result = base.toJSON();
          assert.typeOf(result.definitions.properties, 'array', 'has the array');
          assert.lengthOf(result.definitions.properties, 1, 'has a single property item');
          assert.deepEqual(result.definitions.properties, [created.toJSON()], 'has the property item');
        });

        it('serializes the "definitions.associations"', () => {
          const d1 = base.addDataModel('d1');
          const e1 = d1.addEntity('e1');
          const created = e1.addNamedAssociation('p1');
          const result = base.toJSON();
          assert.typeOf(result.definitions.associations, 'array', 'has the array');
          assert.lengthOf(result.definitions.associations, 1, 'has a single association item');
          assert.deepEqual(result.definitions.associations, [created.toJSON()], 'has the association item');
        });

        it('has no "definitions.models" when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.definitions.models);
        });

        it('has no "definitions.tags" when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.definitions.tags);
        });

        it('has no "definitions.entities" when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.definitions.entities);
        });

        it('has no "definitions.properties" when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.definitions.properties);
        });

        it('has no "definitions.associations" when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.definitions.associations);
        });
      });

      describe('remove()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('removes a child namespace', () => {
          const n1 = root.addNamespace('n1');
          n1.remove();
          assert.deepEqual(root.definitions.namespaces, []);
        });

        it('removes a child namespace and its contents', () => {
          const n1 = root.addNamespace('n1');
          const d1 = n1.addDataModel('d1');
          d1.addEntity('e1');
          n1.remove();
          assert.deepEqual(root.definitions.namespaces, []);
          assert.deepEqual(root.definitions.models, []);
          assert.deepEqual(root.definitions.entities, []);
        });

        it('throws when trying to remove the root namespace', () => {
          assert.throws(() => {
            root.remove();
          }, 'Unable to remove the root namespace this way.');
        });
      });

      describe('findParent()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('returns undefined when requesting self', () => {
          const result = root.findParent(root.key);
          assert.isUndefined(result);
        });

        it('returns self when a direct child', () => {
          const n1 = root.addNamespace('n1');
          const result = root.findParent(n1.key);
          assert.isTrue(result === root);
        });

        it('returns the parent for a child', () => {
          const n1 = root.addNamespace('n1');
          const n2 = n1.addNamespace('n2');
          const result = root.findParent(n2.key);
          assert.isTrue(result === n1);
        });
      });

      describe('addNamespace()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('adds a namespace to a root by the name', () => {
          const result = root.addNamespace('an ns');
          assert.typeOf(result, 'object', 'returns the created namespace');
          assert.deepEqual(root.definitions.namespaces, [result], 'has the ns in definitions');
          assert.lengthOf(root.items, 1, 'the root has an item');
          assert.equal(root.items[0].key, result.key, 'the root has the created item');
          assert.equal(root.items[0].kind, result.kind, 'the root item has the proper kind');
        });

        it('adds a namespace to a root by the instance', () => {
          const instance = new DataNamespace();
          const result = root.addNamespace(instance);
          assert.deepEqual(result, instance, 'returns the same namespace');
          assert.deepEqual(root.definitions.namespaces, [instance], 'has the ns in definitions');
          assert.lengthOf(root.items, 1, 'the root has an item');
          assert.equal(root.items[0].key, result.key, 'the root has the created item');
          assert.equal(root.items[0].kind, result.kind, 'the root item has the proper kind');
        });

        it('adds a namespace to a root by the schema', () => {
          const instance = new DataNamespace().toJSON();
          const result = root.addNamespace(instance)
          assert.deepEqual(result.toJSON(), instance, 'returns the created namespace');
        });

        it('adds a namespace to a parent namespace', () => {
          const parent = root.addNamespace('parent');
          const child = parent.addNamespace('child');
          assert.typeOf(child, 'object', 'returns the child namespace');
          assert.lengthOf(root.definitions.namespaces, 2, 'root has both namespaces');
          assert.deepEqual(root.definitions.namespaces, [parent, child], 'has both namespace definitions');
          assert.lengthOf(root.items, 1, 'the root has only one item');
          assert.equal(root.items[0].key, parent.key, 'the root has its own item');
          assert.lengthOf(parent.items, 1, 'the parent has only one item');
          assert.equal(parent.items[0].key, child.key, 'the parent has its own item');
        });
      });

      describe('findNamespace()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('finds a direct child namespace', () => {
          const n1 = root.addNamespace('n1');
          const result = root.findNamespace(n1.key);
          assert.deepEqual(result, n1);
        });

        it('finds a sub-ns child namespace', () => {
          const n1 = root.addNamespace('n1');
          const n2 = n1.addNamespace('n2');
          const result = root.findNamespace(n2.key);
          assert.deepEqual(result, n2);
        });
      });

      describe('removeNamespace()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('removes a child namespace', () => {
          const n1 = root.addNamespace('n1');
          root.removeNamespace(n1.key);
          assert.deepEqual(root.definitions.namespaces, []);
        });

        it('removes a child namespace and its contents', () => {
          const n1 = root.addNamespace('n1');
          const d1 = n1.addDataModel('d1');
          d1.addEntity('e1');
          root.removeNamespace(n1.key);
          assert.deepEqual(root.definitions.namespaces, []);
          assert.deepEqual(root.definitions.models, []);
          assert.deepEqual(root.definitions.entities, []);
        });

        it('throws when trying to remove the root namespace', () => {
          assert.throws(() => {
            root.removeNamespace(root.key);
          }, 'Unable to remove the root namespace this way.');
        });
      });

      describe('addDataModel()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('adds data model to the root ns by name', () => {
          const d1 = root.addDataModel('d1');
          assert.typeOf(d1, 'object', 'returns the created model');
          assert.deepEqual(root.definitions.models, [d1], 'adds the definition');
          assert.lengthOf(root.items, 1, 'adds the item');
          assert.equal(root.items[0].key, d1.key, 'the item has the key');
          assert.equal(root.items[0].kind, d1.kind, 'the item has the kind');
        });

        it('adds data model to the root ns by instance', () => {
          const m1 = DataModel.fromName(root, 'm1');
          const d1 = root.addDataModel(m1);
          assert.deepEqual(d1, m1, 'returns the same model');
          assert.deepEqual(root.definitions.models, [m1], 'adds the definition');
          assert.lengthOf(root.items, 1, 'adds the item');
          assert.equal(root.items[0].key, d1.key, 'the item has the key');
          assert.equal(root.items[0].kind, d1.kind, 'the item has the kind');
        });

        it('adds data model to the root ns by schema', () => {
          const m1 = DataModel.fromName(root, 'm1').toJSON();
          const d1 = root.addDataModel(m1);
          assert.deepEqual(d1.toJSON(), m1, 'returns the same model');
          assert.deepEqual(root.definitions.models[0].toJSON(), m1, 'adds the definition');
          assert.lengthOf(root.items, 1, 'adds the item');
          assert.equal(root.items[0].key, d1.key, 'the item has the key');
          assert.equal(root.items[0].kind, d1.kind, 'the item has the kind');
        });

        it('adds a data model to the child namespace', () => {
          const n1 = root.addNamespace('n1');
          const d1 = n1.addDataModel('d1');
          assert.typeOf(d1, 'object', 'returns the created model');
          assert.deepEqual(root.definitions.models, [d1], 'adds the definition');
          assert.lengthOf(n1.items, 1, 'adds the item');
          assert.equal(n1.items[0].key, d1.key, 'the item has the key');
          assert.equal(n1.items[0].kind, d1.kind, 'the item has the kind');
          assert.lengthOf(root.items, 1, 'the root has only 1 item');
        });
      });

      describe('findDataModel()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let m2: DataModel;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          const parent = root.addNamespace('n1');
          m2 = parent.addDataModel('m2');
        });

        it('returns the data model', () => {
          const result = root.findDataModel(m1.key);
          assert.deepEqual(result, m1);
        });

        it('returns child data model', () => {
          const result = root.findDataModel(m2.key);
          assert.deepEqual(result, m2);
        });

        it('returns undefined when not found', () => {
          const result = root.findDataModel('other');
          assert.isUndefined(result);
        });
      });

      describe('removeDataModel()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let m2: DataModel;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          const parent = root.addNamespace('n1');
          m2 = parent.addDataModel('m2');
        });

        it('removes the root data model', () => {
          root.removeDataModel(m1.key);
          assert.lengthOf(root.definitions.models, 1, 'has the remaining data model');
        });

        it('returns child data model', () => {
          root.removeDataModel(m2.key);
          assert.lengthOf(root.definitions.models, 1, 'has the remaining data model');
        });

        it('does nothing when not found', () => {
          root.removeDataModel('other');
          assert.lengthOf(root.definitions.models, 2, 'has all data models');
        });
      });
    });
  });
});
