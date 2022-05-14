import { assert } from '@esm-bundle/chai';
import { DataAssociation, IDataAssociation, Kind as DataAssociationKind, } from '../../../src/models/data/DataAssociation.js';
import { DataEntity } from '../../../src/models/data/DataEntity.js';
import { DataModel } from '../../../src/models/data/DataModel.js';
import { DataNamespace } from '../../../src/models/data/DataNamespace.js';
import { Thing } from '../../../src/models/Thing.js';

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
            assert.equal(assoc.info.name, 'Unnamed association');
          });

          it('sets the default schema', () => {
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

          it('sets the default targets', () => {
            const assoc = new DataAssociation(root);
            assert.deepEqual(assoc.targets, []);
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
  
          it('sets the targets', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.targets = ['test'];
            const instance = new DataAssociation(root, orig);
            assert.deepEqual(instance.targets, ['test']);
          });
  
          it('sets the schema', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.schema = { linked: true };
            const instance = new DataAssociation(root, orig);
            assert.deepEqual(instance.schema, { linked: true });
          });
  
          it('initializes from JSON schema ', () => {
            const orig = new DataAssociation(root).toJSON();
            orig.schema = { linked: true };
            const instance = new DataAssociation(root, JSON.stringify(orig));
            assert.deepEqual(instance.schema, { linked: true });
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
          assert.deepEqual(assoc.targets, ['test']);
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
          assoc.new({ ...base, schema: { linked: true }});
          assert.deepEqual(assoc.schema, { linked: true });
        });

        it('sets default schema', () => {
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

        it('sets the targets', () => {
          const assoc = new DataAssociation(root);
          assoc.new({ ...base, targets: ['target-id'] });
          assert.deepEqual(assoc.targets, ['target-id']);
        });

        it('re-sets targets when not in the input', () => {
          const assoc = new DataAssociation(root);
          assoc.targets = ['test1'];
          assoc.new(base);
          assert.deepEqual(assoc.targets, []);
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

        it('does not serialize targets when empty', () => {
          const result = base.toJSON();
          assert.isUndefined(result.targets);
        });

        it('serializes the schema', () => {
          base.schema = { linked: true };
          const result = base.toJSON();
          assert.deepEqual(result.schema, { linked: true });
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

        it('serializes targets as a copy', () => {
          base.targets = ['abc'];
          const result = base.toJSON();
          assert.deepEqual(result.targets, ['abc']);
          base.targets.push('def');
          assert.deepEqual(result.targets, ['abc']);
        });
      });

      describe('#isSingle', () => {
        let root: DataNamespace;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          const model = root.addDataModel('m1');
          e1 = model.addEntity('e1');
          e2 = model.addEntity('e2');
        });

        it('returns true when no targets', () => {
          const assoc = e1.addNamedAssociation('a1');
          assert.isTrue(assoc.isSingle);
        });

        it('returns true when a single target', () => {
          const assoc = e1.addTargetAssociation(e2.key);
          assert.isTrue(assoc.isSingle);
        });

        it('returns false when multiple targets', () => {
          const assoc = e1.addTargetAssociation(e2.key);
          assoc.targets.push('other')
          assert.isFalse(assoc.isSingle);
        });
      });

      describe('getTargets()', () => {
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
          const result = assoc.getTargets();
          assert.deepEqual(result, [e2]);
        });

        it('returns empty array when no target', () => {
          const assoc = e1.addNamedAssociation('test');
          const result = assoc.getTargets();
          assert.deepEqual(result, []);
        });

        it('returns undefined when target has no definition', () => {
          const assoc = e1.addNamedAssociation('test');
          assoc.targets = ['nothing'];
          const result = assoc.getTargets();
          assert.deepEqual(result, []);
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

      describe('addTarget()', () => {
        let root: DataNamespace;
        let e1: DataEntity;
        let e2: DataEntity;
        let a1: DataAssociation;

        beforeEach(() => {
          root = new DataNamespace();
          const model = root.addDataModel('m1');
          e1 = model.addEntity('e1');
          e2 = model.addEntity('e2');
          a1 = e1.addNamedAssociation('a1');
        });

        it('adds the target from the key', () => {
          a1.addTarget(e2.key);
          assert.deepEqual(a1.targets, [e2.key]);
        });

        it('adds the target from an entity', () => {
          a1.addTarget(e2);
          assert.deepEqual(a1.targets, [e2.key]);
        });

        it('adds the target from an entity schema', () => {
          a1.addTarget(e2.toJSON());
          assert.deepEqual(a1.targets, [e2.key]);
        });
      });

      describe('removeTarget()', () => {
        let root: DataNamespace;
        let e1: DataEntity;
        let e2: DataEntity;
        let a1: DataAssociation;

        beforeEach(() => {
          root = new DataNamespace();
          const model = root.addDataModel('m1');
          e1 = model.addEntity('e1');
          e2 = model.addEntity('e2');
          a1 = e1.addTargetAssociation(e2.key);
        });

        it('removes the target from the key', () => {
          a1.removeTarget(e2.key);
          assert.deepEqual(a1.targets, []);
        });

        it('removes the target from an entity', () => {
          a1.removeTarget(e2);
          assert.deepEqual(a1.targets, []);
        });

        it('removes the target from an entity schema', () => {
          a1.removeTarget(e2.toJSON());
          assert.deepEqual(a1.targets, []);
        });

        it('does nothing when the target does not exist', () => {
          a1.removeTarget('other');
          assert.deepEqual(a1.targets, [e2.key]);
        });
      });

      describe('createAdapted()', () => {
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

        it('returns the created association', () => {
          const result = a1.createAdapted();
          assert.typeOf(result, 'object');
          assert.equal(result.kind, DataAssociationKind);
        });

        it('sets the adapts association', () => {
          const result = a1.createAdapted();
          assert.equal(a1.adapts, result.key);
        });

        it('adds the association to the definitions', () => {
          const result = a1.createAdapted();
          assert.deepEqual(root.definitions.associations[1], result);
        });
      });

      describe('readAdapted()', () => {
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

        it('returns undefined when none', () => {
          assert.isUndefined(a1.readAdapted());
        });

        it('returns the association', () => {
          const result = a1.createAdapted();
          assert.deepEqual(a1.readAdapted(), result);
        });

        it('returns undefined when definition not found', () => {
          a1.adapts = '123';
          assert.isUndefined(a1.readAdapted());
        });
      });

      describe('toApiShape()', () => {
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

        // these tests only check whether the AmfShapeGenerator is called.
        // specific tests are performed elsewhere

        it('returns an object', () => {
          const result = a1.toApiShape();
          
          assert.typeOf(result, 'object');
          assert.typeOf(result.range, 'object');
        });
      });
    });
  });
});
