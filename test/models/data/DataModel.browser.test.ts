import { assert } from '@esm-bundle/chai';
import { DataEntity } from '../../../src/models/data/DataEntity.js';
import { DataModel, IDataModel, Kind as DataModelKind, } from '../../../src/models/data/DataModel.js';
import { DataNamespace } from '../../../src/models/data/DataNamespace.js';
import { Thing } from '../../../src/models/Thing.js';

describe('models', () => {
  describe('data', () => {
    describe('DataModel', () => {
      describe('constructor()', () => {
        describe('defaults', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });

          it('sets the kind', () => {
            const assoc = new DataModel(root);
            assert.equal(assoc.kind, DataModelKind);
          });

          it('sets the key', () => {
            const assoc = new DataModel(root);
            assert.typeOf(assoc.key, 'string');
            assert.isNotEmpty(assoc.key);
          });

          it('sets the default "info"', () => {
            const assoc = new DataModel(root);
            assert.typeOf(assoc.info, 'object');
            assert.equal(assoc.info.name, '');
          });

          it('sets the default "entities"', () => {
            const assoc = new DataModel(root);
            assert.typeOf(assoc.info, 'object');
            assert.deepEqual(assoc.entities, []);
          });
        });

        describe('From schema initialization', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });
  
          it('sets the key', () => {
            const orig = new DataModel(root).toJSON();
            orig.key = 'test';
            const instance = new DataModel(root, orig);
            assert.equal(instance.key, 'test');
          });
  
          it('sets the info', () => {
            const orig = new DataModel(root).toJSON();
            orig.info.name = 'test';
            const instance = new DataModel(root, orig);
            assert.equal(instance.info.name, 'test');
          });

          it('initializes from JSON schema ', () => {
            const orig = new DataModel(root).toJSON();
            orig.key = 'test';
            const instance = new DataModel(root, JSON.stringify(orig));
            assert.equal(instance.key, 'test');
          });
        });
      });

      describe('fromName()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the name', () => {
          const assoc = DataModel.fromName(root, 'test');
          assert.equal(assoc.info.name, 'test');
        });
      });

      describe('new()', () => {
        let root: DataNamespace;
        let base: IDataModel;
        beforeEach(() => {
          root = new DataNamespace();
          base = {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataModelKind,
          };
        });

        it('sets the key', () => {
          const assoc = new DataModel(root);
          assoc.new(base);
          assert.equal(assoc.key, 'test123');
        });

        it('sets the info', () => {
          const assoc = new DataModel(root);
          assoc.new(base);
          assert.equal(assoc.info.name, 'test name');
        });

        it('sets default info', () => {
          const assoc = new DataModel(root);
          delete base.info;
          assoc.new(base);
          assert.equal(assoc.info.name, '');
        });

        it('sets the entities as objects', () => {
          const e1 = DataEntity.fromName(root, 'e1');
          root.definitions.entities.push(e1);
          const model = new DataModel(root);
          base.entities = [e1.key];
          model.new(base);
          assert.deepEqual(model.entities, [e1]);
        });

        it('re-sets entities when missing', () => {
          const model = new DataModel(root);
          model.addEntity('test');
          base.entities = [];
          model.new(base);
          assert.deepEqual(model.entities, []);
        });

        it('throws when unknown input', () => {
          const assoc = new DataModel(root);
          assert.throws(() => {
            // @ts-ignore
            assoc.new({});
          }, 'Not a data model.');
        });
      });

      describe('toJSON()', () => {
        let root: DataNamespace;
        let base: DataModel;
        beforeEach(() => {
          root = new DataNamespace();
          base = new DataModel(root, {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataModelKind,
          });
        });

        it('serializes the kind', () => {
          const result = base.toJSON();
          assert.equal(result.kind, DataModelKind);
        });

        it('serializes the key', () => {
          const result = base.toJSON();
          assert.equal(result.key, base.key);
        });

        it('serializes the info', () => {
          const result = base.toJSON();
          assert.equal(result.info.name, 'test name');
        });

        it('serializes the entities', () => {
          const e1 = base.addEntity('e1');
          const result = base.toJSON();
          assert.deepEqual(result.entities, [e1.key]);
        });

        it('ignores entities when missing', () => {
          const result = base.toJSON();
          assert.isUndefined(result.entities);
        });
      });

      describe('remove()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('removes self from the root definitions', () => {
          const m1 = root.addDataModel('m1');
          m1.remove();
          assert.deepEqual(root.definitions.models, []);
        });

        it('removes self only', () => {
          const m1 = root.addDataModel('m1');
          const m2 = root.addDataModel('m2');
          m1.remove();
          assert.deepEqual(root.definitions.models, [m2]);
        });

        it('removes self a sub-namespace as parent', () => {
          const n1 = root.addNamespace('n1');
          const m1 = n1.addDataModel('d1');
          m1.remove();
          assert.deepEqual(n1.items, []);
          assert.deepEqual(root.definitions.models, []);
        });

        it('removes model entities', () => {
          const m1 = root.addDataModel('d1');
          m1.addEntity('e1');
          m1.remove();
          assert.deepEqual(root.definitions.entities, []);
        });
      });

      describe('addEntity()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('adds an entity when the parent is root', () => {
          const m1 = root.addDataModel('m1');
          const e1 = m1.addEntity('e1');
          assert.deepEqual(root.definitions.entities, [e1]);
          assert.deepEqual(m1.entities, [e1]);
        });

        it('adds an entity when the parent is as sub-namespace', () => {
          const n1 = root.addNamespace('n1');
          const m1 = n1.addDataModel('m1');
          const e1 = m1.addEntity('e1');
          assert.deepEqual(root.definitions.entities, [e1]);
          assert.deepEqual(m1.entities, [e1]);
        });
      });

      describe('getParent()', () => {
        let root: DataNamespace;

        beforeEach(() => {
          root = new DataNamespace();
        });

        it('returns the parent as root', () => {
          const m1 = root.addDataModel('m1');
          const result = m1.getParent();
          assert.isTrue(result === root);
        });

        it('returns the parent is as sub-namespace', () => {
          const n1 = root.addNamespace('n1');
          const m1 = n1.addDataModel('m1');
          const result = m1.getParent();
          assert.isTrue(result === n1);
        });
      });

      describe('breadcrumbs()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('adds root and self', () => {
          const m1 = root.addDataModel('m1');
          const result = m1.breadcrumbs();
          
          assert.lengthOf(result, 2, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, m1.key, 'has the self last');
        });

        it('adds root, sub-ns, and self', () => {
          const n1 = root.addNamespace('n1');
          const m1 = n1.addDataModel('m1');
          const result = m1.breadcrumbs();
          assert.lengthOf(result, 3, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, n1.key, 'has the child-namespace');
          assert.equal(result[2].key, m1.key, 'has self last');
        });

        it('adds root, sub-ns, sub-ns, and self', () => {
          const n1 = root.addNamespace('n1');
          const n2 = n1.addNamespace('n2');
          const m1 = n2.addDataModel('m1');
          const result = m1.breadcrumbs();
          assert.lengthOf(result, 4, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, n1.key, 'has the child-namespace');
          assert.equal(result[2].key, n2.key, 'has the child-namespace');
          assert.equal(result[3].key, m1.key, 'has self last');
        });
      });
    });
  });
});
