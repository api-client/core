import { assert } from '@esm-bundle/chai';
import { DataAssociation, IDataAssociation, Kind as DataAssociationKind, } from '../../src/models/data/DataAssociation.js';
import { DataEntity } from '../../src/models/data/DataEntity.js';
import { DataModel } from '../../src/models/data/DataModel.js';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';
import { Thing } from '../../src/models/Thing.js';

describe('models', () => {
  describe('data', () => {
    describe('DataAssociation', () => {
      describe('constructor()', () => {
        describe('defaults', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });

          it('sets the kind', () => {
            const assoc = new DataAssociation(root);
            assert.equal(assoc.kind, DataAssociationKind);
          });

          it('sets the key', () => {
            const assoc = new DataAssociation(root);
            assert.typeOf(assoc.key, 'string');
            assert.isNotEmpty(assoc.key);
          });

          it('sets the default "info"', () => {
            const assoc = new DataAssociation(root);
            assert.typeOf(assoc.info, 'object');
            assert.equal(assoc.info.name, '');
          });

          it('does not set schema', () => {
            const assoc = new DataAssociation(root);
            assert.isUndefined(assoc.schema);
          });

          it('does not set multiple', () => {
            const assoc = new DataAssociation(root);
            assert.isUndefined(assoc.multiple);
          });

          it('does not set required', () => {
            const assoc = new DataAssociation(root);
            assert.isUndefined(assoc.required);
          });

          it('does not set target', () => {
            const assoc = new DataAssociation(root);
            assert.isUndefined(assoc.target);
          });
        });

        describe('From schema initialization', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });
  
          it('sets the key', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.key = 'test';
            const instance = new DataAssociation(root, orig);
            assert.equal(instance.key, 'test');
          });
  
          it('sets the info', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.info.name = 'test';
            const instance = new DataAssociation(root, orig);
            assert.equal(instance.info.name, 'test');
          });
  
          it('sets the multiple', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.multiple = true;
            const instance = new DataAssociation(root, orig);
            assert.isTrue(instance.multiple);
          });
  
          it('sets the required', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.required = true;
            const instance = new DataAssociation(root, orig);
            assert.isTrue(instance.required);
          });
  
          it('sets the target', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.target = 'test';
            const instance = new DataAssociation(root, orig);
            assert.equal(instance.target, 'test');
          });
  
          it('sets the schema', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.schema = { embedded: true };
            const instance = new DataAssociation(root, orig);
            assert.deepEqual(instance.schema, { embedded: true });
          });
  
          it('initializes from JSON schema ', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.schema = { embedded: true };
            const instance = new DataAssociation(root, JSON.stringify(orig));
            assert.deepEqual(instance.schema, { embedded: true });
          });
        });
      });

      describe('fromTarget()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the target', () => {
          const assoc = DataAssociation.fromTarget(root, 'test');
          assert.equal(assoc.target, 'test');
        });
      });

      describe('fromName()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the name', () => {
          const assoc = DataAssociation.fromName(root, 'test');
          assert.equal(assoc.info.name, 'test');
        });
      });

      describe('new()', () => {
        let root: DataNamespace;
        let base: IDataAssociation;
        beforeEach(() => {
          root = new DataNamespace();
          base = {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataAssociationKind,
          };
        });

        it('sets the key', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.equal(assoc.key, 'test123');
        });

        it('sets the info', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.equal(assoc.info.name, 'test name');
        });

        it('sets default info', () => {
          const assoc = new DataAssociation(root);
          delete base.info;
          assoc.new(base);
          assert.equal(assoc.info.name, '');
        });

        it('sets the schema', () => {
          const assoc = new DataAssociation(root);
          assoc.new({ ...base, schema: { embedded: true }});
          assert.deepEqual(assoc.schema, { embedded: true });
        });

        it('does not set schema when not in the input', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.isUndefined(assoc.schema);
        });

        it('sets the multiple', () => {
          const assoc = new DataAssociation(root);
          assoc.new({ ...base, multiple: true });
          assert.isTrue(assoc.multiple);
        });

        it('does not set multiple when not in the input', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.isUndefined(assoc.multiple);
        });

        it('sets the required', () => {
          const assoc = new DataAssociation(root);
          assoc.new({ ...base, required: true });
          assert.isTrue(assoc.required);
        });

        it('does not set required when not in the input', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.isUndefined(assoc.required);
        });

        it('sets the target', () => {
          const assoc = new DataAssociation(root);
          assoc.new({ ...base, target: 'target-id' });
          assert.equal(assoc.target, 'target-id');
        });

        it('does not set required when not in the input', () => {
          const assoc = new DataAssociation(root);
          assoc.new(base);
          assert.isUndefined(assoc.target);
        });

        it('throws when unknown input', () => {
          const assoc = new DataAssociation(root);
          assert.throws(() => {
            // @ts-ignore
            assoc.new({});
          }, 'Not a data association.');
        });
      });

      describe('toJSON()', () => {
        let root: DataNamespace;
        let base: DataAssociation;
        beforeEach(() => {
          root = new DataNamespace();
          base = new DataAssociation(root, {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataAssociationKind,
          });
        });

        it('serializes the kind', () => {
          const result = base.toJSON();
          assert.equal(result.kind, DataAssociationKind);
        });

        it('serializes the key', () => {
          const result = base.toJSON();
          assert.equal(result.key, base.key);
        });

        it('serializes the info', () => {
          const result = base.toJSON();
          assert.equal(result.info.name, 'test name');
        });

        it('does not serialize the schema by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.schema);
        });

        it('does not serialize the multiple by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.multiple);
        });

        it('does not serialize the required by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.required);
        });

        it('does not serialize the target by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.target);
        });

        it('serializes the schema', () => {
          base.schema = { embedded: true };
          const result = base.toJSON();
          assert.deepEqual(result.schema, { embedded: true });
        });

        it('serialize the set multiple', () => {
          base.multiple = false;
          const result = base.toJSON();
          assert.isFalse(result.multiple);
        });

        it('serialize the set required', () => {
          base.required = false;
          const result = base.toJSON();
          assert.isFalse(result.required);
        });

        it('serialize the set target', () => {
          base.target = 'abc';
          const result = base.toJSON();
          assert.equal(result.target, 'abc');
        });
      });

      describe('getTarget()', () => {
        let root: DataNamespace;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          const model = root.addDataModel('m1');
          e1 = model.addEntity('e1');
          e2 = model.addEntity('e2');
        });

        it('returns the entity', () => {
          const assoc = e1.addTargetAssociation(e2.key);
          const result = assoc.getTarget();
          assert.deepEqual(result, e2);
        });

        it('returns undefined when no target', () => {
          const assoc = e1.addNamedAssociation('test');
          const result = assoc.getTarget();
          assert.isUndefined(result);
        });

        it('returns undefined when target has no definition', () => {
          const assoc = e1.addNamedAssociation('test');
          assoc.target = 'nothing';
          const result = assoc.getTarget();
          assert.isUndefined(result);
        });
      });

      describe('remove()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;
        let a1: DataAssociation;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
          a1 = e1.addTargetAssociation(e2.key);
        });

        it('removes self from the parent entity', () => {
          a1.remove();
          assert.deepEqual(e1.associations, []);
        });

        it('removes self from the root definitions', () => {
          a1.remove();
          assert.deepEqual(root.definitions.associations, []);
        });

        it('does not serialize associations', () => {
          a1.remove();
          const schema = root.toJSON();
          assert.isUndefined(schema.definitions.associations);
          assert.isUndefined(schema.definitions.entities[0].associations);
          assert.isUndefined(schema.definitions.entities[1].associations);
        });

        it('removes self only', () => {
          const e3 = m1.addEntity('e2');
          const a2 = e1.addTargetAssociation(e3.key);
          a1.remove();
          assert.deepEqual(e1.associations, [a2]);
          assert.deepEqual(root.definitions.associations, [a2]);
        });
      });
    });
  });
});
