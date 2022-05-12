import { assert } from '@esm-bundle/chai';
import { DataEntity, IDataEntity, Kind as DataEntityKind, } from '../../src/models/data/DataEntity.js';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';
import { Thing } from '../../src/models/Thing.js';
import { DataModel } from '../../src/models/data/DataModel.js';
import { DataProperty } from '../../src/models/data/DataProperty.js';
import { DataAssociation } from '../../src/models/data/DataAssociation.js';

describe('models', () => {
  describe('data', () => {
    describe('DataEntity', () => {
      describe('constructor()', () => {
        describe('defaults', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });

          it('sets the kind', () => {
            const assoc = new DataEntity(root);
            assert.equal(assoc.kind, DataEntityKind);
          });

          it('sets the key', () => {
            const assoc = new DataEntity(root);
            assert.typeOf(assoc.key, 'string');
            assert.isNotEmpty(assoc.key);
          });

          it('sets the default "info"', () => {
            const assoc = new DataEntity(root);
            assert.typeOf(assoc.info, 'object');
            assert.equal(assoc.info.name, '');
          });

          it('sets the default "tags"', () => {
            const assoc = new DataEntity(root);
            assert.deepEqual(assoc.tags, []);
          });

          it('sets the default "taxonomy"', () => {
            const assoc = new DataEntity(root);
            assert.deepEqual(assoc.taxonomy, []);
          });

          it('sets the default "properties"', () => {
            const assoc = new DataEntity(root);
            assert.deepEqual(assoc.properties, []);
          });

          it('sets the default "associations"', () => {
            const assoc = new DataEntity(root);
            assert.deepEqual(assoc.associations, []);
          });

          it('sets the default "parents"', () => {
            const assoc = new DataEntity(root);
            assert.deepEqual(assoc.parents, []);
          });

          it('does not set deprecated', () => {
            const assoc = new DataProperty(root);
            assert.isUndefined(assoc.deprecated);
          });
        });

        describe('From schema initialization', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });
  
          it('sets the key', () => {
            const orig = new DataEntity(root).toJSON();
            orig.key = 'test';
            const instance = new DataEntity(root, orig);
            assert.equal(instance.key, 'test');
          });
  
          it('sets the info', () => {
            const orig = new DataEntity(root).toJSON();
            orig.info.name = 'test';
            const instance = new DataEntity(root, orig);
            assert.equal(instance.info.name, 'test');
          });

          it('sets the "tags"', () => {
            const orig = new DataEntity(root).toJSON();
            orig.tags = ['test'];
            const assoc = new DataEntity(root, orig);
            assert.deepEqual(assoc.tags, ['test']);
          });

          it('sets the "taxonomy"', () => {
            const orig = new DataEntity(root).toJSON();
            orig.taxonomy = ['test'];
            const assoc = new DataEntity(root, orig);
            assert.deepEqual(assoc.taxonomy, ['test']);
          });
  
          it('initializes from JSON schema ', () => {
            const orig = new DataEntity(root).toJSON();
            orig.key = 'test';
            const instance = new DataEntity(root, JSON.stringify(orig));
            assert.equal(instance.key, 'test');
          });

          it('sets the deprecated', () => {
            const orig = new DataEntity(root).toJSON();
            orig.deprecated = true;
            const assoc = new DataEntity(root, orig);
            assert.isTrue(assoc.deprecated);
          });
        });
      });

      describe('fromName()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the name', () => {
          const assoc = DataEntity.fromName(root, 'test');
          assert.equal(assoc.info.name, 'test');
        });
      });

      describe('new()', () => {
        let root: DataNamespace;
        let base: IDataEntity;
        beforeEach(() => {
          root = new DataNamespace();
          base = {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataEntityKind,
          };
        });

        it('sets the key', () => {
          const assoc = new DataEntity(root);
          assoc.new(base);
          assert.equal(assoc.key, 'test123');
        });

        it('sets the info', () => {
          const assoc = new DataEntity(root);
          assoc.new(base);
          assert.equal(assoc.info.name, 'test name');
        });

        it('sets default info', () => {
          const assoc = new DataEntity(root);
          delete base.info;
          assoc.new(base);
          assert.equal(assoc.info.name, '');
        });

        it('sets the tags as a copy', () => {
          const assoc = new DataEntity(root);
          const init = { ...base, tags: ['a'] };
          assoc.new(init);
          assert.deepEqual(assoc.tags, ['a']);
          init.tags.push('b')
          assert.deepEqual(assoc.tags, ['a']);
        });

        it('resets tags when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.tags = ['a'];
          assoc.new(base);
          assert.deepEqual(assoc.tags, []);
        });

        it('sets the parents as a copy', () => {
          const assoc = new DataEntity(root);
          const init = { ...base, parents: ['a'] };
          assoc.new(init);
          assert.deepEqual(assoc.parents, ['a']);
          init.parents.push('b')
          assert.deepEqual(assoc.parents, ['a']);
        });

        it('resets parents when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.parents = ['a'];
          assoc.new(base);
          assert.deepEqual(assoc.parents, []);
        });

        it('sets the properties as a copy', () => {
          const src = new DataEntity(root);
          const p1 = src.addNamedProperty('p1');
          const assoc = new DataEntity(root);
          const init = src.toJSON();
          assoc.new(init);
          assert.deepEqual(assoc.properties, [p1]);
          const p2 = src.addNamedProperty('p2');
          init.properties.push(p2.key)
          assert.deepEqual(assoc.properties, [p1]);
        });

        it('resets properties when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.addNamedProperty('test');
          assoc.new(base);
          assert.deepEqual(assoc.properties, []);
        });

        it('sets the associations as a copy', () => {
          const src = new DataEntity(root);
          const a1 = src.addNamedAssociation('a1');
          const assoc = new DataEntity(root);
          const init = src.toJSON();
          assoc.new(init);
          assert.deepEqual(assoc.associations, [a1]);
          const a2 = src.addNamedAssociation('a2');
          init.associations.push(a2.key)
          assert.deepEqual(assoc.associations, [a1]);
        });

        it('resets associations when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.addNamedAssociation('test');
          assoc.new(base);
          assert.deepEqual(assoc.associations, []);
        });

        it('sets the taxonomy as a copy', () => {
          const assoc = new DataEntity(root);
          const init = { ...base, taxonomy: ['a'] };
          assoc.new(init);
          assert.deepEqual(assoc.taxonomy, ['a']);
          init.taxonomy.push('b')
          assert.deepEqual(assoc.taxonomy, ['a']);
        });

        it('resets taxonomy when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.taxonomy = ['a'];
          assoc.new(base);
          assert.deepEqual(assoc.taxonomy, []);
        });

        it('sets the deprecated', () => {
          const assoc = new DataEntity(root);
          assoc.new({ ...base, deprecated: true });
          assert.isTrue(assoc.deprecated);
        });

        it('does not set deprecated when not in the input', () => {
          const assoc = new DataEntity(root);
          assoc.new(base);
          assert.isUndefined(assoc.deprecated);
        });

        it('throws when unknown input', () => {
          const assoc = new DataEntity(root);
          assert.throws(() => {
            // @ts-ignore
            assoc.new({});
          }, 'Not a data entity.');
        });
      });

      describe('toJSON()', () => {
        let root: DataNamespace;
        let base: DataEntity;
        beforeEach(() => {
          root = new DataNamespace();
          base = new DataEntity(root, {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataEntityKind,
          });
        });

        it('serializes the kind', () => {
          const result = base.toJSON();
          assert.equal(result.kind, DataEntityKind);
        });

        it('serializes the key', () => {
          const result = base.toJSON();
          assert.equal(result.key, base.key);
        });

        it('serializes the info', () => {
          const result = base.toJSON();
          assert.equal(result.info.name, 'test name');
        });

        it('does not serialize taxonomy by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.taxonomy);
        });

        it('does not serialize tags by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.tags);
        });

        it('does not serialize parents by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.parents);
        });

        it('does not serialize properties by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.properties);
        });

        it('does not serialize associations by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.associations);
        });

        it('serializes tags as a copy', () => {
          base.tags = ['a'];
          const result = base.toJSON();
          assert.deepEqual(result.tags, ['a']);
          base.tags.push('b')
          assert.deepEqual(result.tags, ['a']);
        });

        it('serializes taxonomy as a copy', () => {
          base.taxonomy = ['a'];
          const result = base.toJSON();
          assert.deepEqual(result.taxonomy, ['a']);
          base.taxonomy.push('b')
          assert.deepEqual(result.taxonomy, ['a']);
        });

        it('serializes parents as a copy', () => {
          base.parents = ['a'];
          const result = base.toJSON();
          assert.deepEqual(result.parents, ['a']);
          base.parents.push('b')
          assert.deepEqual(result.parents, ['a']);
        });

        it('serializes properties as a copy', () => {
          const p1 = base.addNamedProperty('p1');
          const result = base.toJSON();
          assert.deepEqual(result.properties, [p1.key]);
          base.addNamedProperty('p2');
          assert.deepEqual(result.properties, [p1.key]);
        });

        it('serializes associations as a copy', () => {
          const a1 = base.addNamedAssociation('a1');
          const result = base.toJSON();
          assert.deepEqual(result.associations, [a1.key]);
          base.addNamedAssociation('a2');
          assert.deepEqual(result.associations, [a1.key]);
        });
      });

      describe('remove()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
          e1.addNamedProperty('test prop');
          e1.addTargetAssociation(e2.key);
        });

        it('removes self from the parent data model', () => {
          e1.remove();
          assert.deepEqual(m1.entities, [e2]);
        });

        it('removes self from the root definitions', () => {
          e1.remove();
          assert.deepEqual(root.definitions.entities, [e2]);
        });

        it('removes own properties', () => {
          const p2 = e2.addNamedProperty('other');
          e1.remove();
          assert.deepEqual(e2.properties, [p2]);
          assert.deepEqual(root.definitions.properties, [p2]);
        });

        it('removes own associations', () => {
          const e3 = m1.addEntity('e3');
          const a2 = e2.addTargetAssociation(e3.key);
          e1.remove();
          assert.deepEqual(e2.associations, [a2]);
          assert.deepEqual(root.definitions.associations, [a2]);
        });
      });

      describe('addTypedProperty()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
        });

        it('adds the property to the entity', () => {
          const p1 = e1.addTypedProperty('boolean');
          assert.deepEqual(e1.properties, [p1]);
        });

        it('adds the property type', () => {
          const p1 = e1.addTypedProperty('boolean');
          assert.equal(p1.type, 'boolean');
        });

        it('adds the property to the root definitions', () => {
          const p1 = e1.addTypedProperty('boolean');
          assert.deepEqual(root.definitions.properties, [p1]);
        });

        it('does not change other entities', () => {
          e1.addTypedProperty('boolean');
          assert.deepEqual(e2.properties, []);
        });
      });

      describe('addNamedProperty()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
        });

        it('adds the property to the entity', () => {
          const p1 = e1.addNamedProperty('hello');
          assert.deepEqual(e1.properties, [p1]);
        });

        it('adds the property type', () => {
          const p1 = e1.addNamedProperty('hello');
          assert.equal(p1.info.name, 'hello');
        });

        it('adds the property to the root definitions', () => {
          const p1 = e1.addNamedProperty('hello');
          assert.deepEqual(root.definitions.properties, [p1]);
        });

        it('does not change other entities', () => {
          e1.addNamedProperty('hello');
          assert.deepEqual(e2.properties, []);
        });
      });

      describe('removeProperty()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;
        let p1: DataProperty;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
          p1 = e1.addNamedProperty('p2');
        });

        it('removes the property from the entity', () => {
          e1.removeProperty(p1.key);
          assert.deepEqual(e1.properties, []);
        });

        it('removes the property from the root definitions', () => {
          e1.removeProperty(p1.key);
          assert.deepEqual(root.definitions.properties, []);
        });

        it('keeps other properties', () => {
          const p2 = e1.addNamedProperty('p2');
          const p3 = e2.addNamedProperty('p3');
          e1.removeProperty(p1.key);
          assert.deepEqual(e1.properties, [p2]);
          assert.deepEqual(root.definitions.properties, [p2, p3]);
        });

        it('ignores when the property belongs to another data entity', () => {
          const p2 = e1.addNamedProperty('p2');
          const p3 = e2.addNamedProperty('p3');
          e1.removeProperty(p3.key);
          assert.deepEqual(e1.properties, [p1, p2]);
          assert.deepEqual(root.definitions.properties, [p1, p2, p3]);
        });

        it('ignores when the property does not exist', () => {
          e1.removeProperty('test');
          assert.deepEqual(e1.properties, [p1]);
          assert.deepEqual(root.definitions.properties, [p1]);
        });
      });

      describe('addNamedAssociation()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
        });

        it('adds the association to the entity', () => {
          const a1 = e1.addNamedAssociation('test');
          assert.deepEqual(e1.associations, [a1]);
        });

        it('adds the association to the root definitions', () => {
          const a1 = e1.addNamedAssociation('test');
          assert.deepEqual(root.definitions.associations, [a1]);
        });

        it('adds the association name', () => {
          const a1 = e1.addNamedAssociation('test');
          assert.deepEqual(a1.info.name, 'test');
        });

        it('does not change other entities', () => {
          e1.addNamedAssociation('test');
          assert.deepEqual(e2.associations, []);
        });
      });

      describe('addTargetAssociation()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
        });

        it('adds the association to the entity', () => {
          const a1 = e1.addTargetAssociation(e2.key);
          assert.deepEqual(e1.associations, [a1]);
        });

        it('adds the association to the root definitions', () => {
          const a1 = e1.addTargetAssociation(e2.key);
          assert.deepEqual(root.definitions.associations, [a1]);
        });

        it('adds the association target', () => {
          const a1 = e1.addTargetAssociation(e2.key);
          assert.deepEqual(a1.targets, [e2.key]);
        });

        it('does not change other entities', () => {
          e1.addTargetAssociation(e2.key);
          assert.deepEqual(e2.associations, []);
        });
      });

      describe('removeAssociation()', () => {
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

        it('removes the association from the entity', () => {
          e1.removeAssociation(a1.key);
          assert.deepEqual(e1.associations, []);
        });

        it('removes the association from the root definitions', () => {
          e1.removeAssociation(a1.key);
          assert.deepEqual(root.definitions.associations, []);
        });

        it('keeps other associations', () => {
          const e3 = m1.addEntity('e3');
          const a2 = e1.addTargetAssociation(e2.key);
          const a3 = e2.addTargetAssociation(e3.key);
          e1.removeAssociation(a1.key);
          assert.deepEqual(e1.associations, [a2]);
          assert.deepEqual(root.definitions.associations, [a2, a3]);
        });

        it('ignores when the association belongs to another data entity', () => {
          const e3 = m1.addEntity('e3');
          const a2 = e1.addTargetAssociation(e2.key);
          const a3 = e2.addTargetAssociation(e3.key);
          e1.removeAssociation(a3.key);
          assert.deepEqual(e1.associations, [a1, a2]);
          assert.deepEqual(root.definitions.associations, [a1, a2, a3]);
        });

        it('ignores when the association does not exist', () => {
          e1.removeAssociation('test');
          assert.deepEqual(e1.associations, [a1]);
          assert.deepEqual(root.definitions.associations, [a1]);
        });
      });

      describe('getComputedParents()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('returns empty array when no parents', () => {
          const result = e1.getComputedParents();
          assert.deepEqual(result, []);
        });

        it('returns a parent', () => {
          const e2 = m1.addEntity('e2');
          e1.parents.push(e2.key);
          const result = e1.getComputedParents();
          assert.deepEqual(result, [e2]);
        });

        it('returns only direct parents by default', () => {
          const e2 = m1.addEntity('e2');
          const e3 = m1.addEntity('e3');
          e2.parents.push(e3.key);
          e1.parents.push(e2.key);
          const result = e1.getComputedParents();
          assert.deepEqual(result, [e2]);
        });

        it('returns a parent with their parents', () => {
          const e2 = m1.addEntity('e2');
          const e3 = m1.addEntity('e3');
          e2.parents.push(e3.key);
          e1.parents.push(e2.key);
          const result = e1.getComputedParents(true);
          assert.deepEqual(result, [e2, e3]);
        });

        it('returns all parents and their parents', () => {
          const e2 = m1.addEntity('e2');
          const e3 = m1.addEntity('e3');
          const e4 = m1.addEntity('e4');
          e2.parents.push(e3.key);
          e1.parents.push(e2.key);
          e1.parents.push(e4.key);
          const result = e1.getComputedParents(true);
          assert.deepEqual(result, [e2, e3, e4]);
        });
      });
      
      describe('getComputedChildren()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('returns empty array when no children', () => {
          const result = e1.getComputedChildren();
          assert.deepEqual(result, []);
        });

        it('returns the direct children', () => {
          const e2 = m1.addEntity('e2');
          const e3 = m1.addEntity('e3');
          e2.parents.push(e1.key);
          e3.parents.push(e2.key);

          const result = e1.getComputedChildren();
          assert.deepEqual(result, [e2]);
        });
      });
      
      describe('getComputedAssociations()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('returns empty array when no association', () => {
          const result = e1.getComputedAssociations();
          assert.deepEqual(result, []);
        });

        it('returns the association targets', () => {
          const e2 = m1.addEntity('e2');
          const e3 = m1.addEntity('e3');
          e1.addTargetAssociation(e2.key);
          e2.addTargetAssociation(e3.key);

          const result = e1.getComputedAssociations();
          assert.deepEqual(result, [e2]);
        });

        it('ignores when the target is not defined', () => {
          e1.addNamedAssociation('hello');
          const result = e1.getComputedAssociations();
          assert.deepEqual(result, []);
        });

        it('ignores when the target schema is not defined', () => {
          e1.addTargetAssociation('other');
          const result = e1.getComputedAssociations();
          assert.deepEqual(result, []);
        });
      });

      describe('associationPath()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;
        let e3: DataEntity;
        let e4: DataEntity;
        let e5: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
          e3 = m1.addEntity('e3');
          e4 = m1.addEntity('e4');
          e5 = m1.addEntity('e5');
        });

        it('finds a direct connection', () => {
          e1.addTargetAssociation(e2.key);
          const paths: string[][] = [];
          for (const path of e1.associationPath(e2.key)) {
            paths.push(path);
          }
          assert.lengthOf(paths, 1, 'has a single path');
          assert.deepEqual(paths[0], [e1.key, e2.key], 'has the path');
        });

        it('finds a connection through another entity', () => {
          e1.addTargetAssociation(e2.key);
          e2.addTargetAssociation(e3.key);
          const paths: string[][] = [];
          for (const path of e1.associationPath(e3.key)) {
            paths.push(path);
          }
          assert.lengthOf(paths, 1, 'has a single path');
          assert.deepEqual(paths[0], [e1.key, e2.key, e3.key], 'has the path');
        });

        it('returns a connection to self', () => {
          e1.addTargetAssociation(e1.key);
          const paths: string[][] = [];
          for (const path of e1.associationPath(e1.key)) {
            paths.push(path);
          }
          assert.lengthOf(paths, 1, 'has a single path');
          assert.deepEqual(paths[0], [e1.key], 'has the path');
        });

        it('yields multiple directions', () => {
          e1.addTargetAssociation(e5.key);
          e1.addTargetAssociation(e2.key);
          e2.addTargetAssociation(e3.key);
          e3.addTargetAssociation(e4.key);
          e4.addTargetAssociation(e5.key);
          const paths: string[][] = [];
          for (const path of e1.associationPath(e5.key)) {
            paths.push(path);
          }
          assert.lengthOf(paths, 2, 'has both paths');
          assert.deepEqual(paths[0], [e1.key, e2.key, e3.key, e4.key, e5.key], 'has the 1st path');
          assert.deepEqual(paths[1], [e1.key, e5.key], 'has the 2nd path');
        });

        it('ignores broken paths', () => {
          e1.addTargetAssociation(e5.key);
          e1.addTargetAssociation(e2.key);
          e2.addTargetAssociation(e3.key);
          // no e3 -> e4
          e4.addTargetAssociation(e5.key);
          const paths: string[][] = [];
          for (const path of e1.associationPath(e5.key)) {
            paths.push(path);
          }
          assert.lengthOf(paths, 1, 'has both paths');
          assert.deepEqual(paths[0], [e1.key, e5.key], 'has the 1st path');
        });
      });

      describe('isAssociated()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let e2: DataEntity;
        let e3: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          e2 = m1.addEntity('e2');
          e3 = m1.addEntity('e3');
        });

        it('returns true when testing self', () => {
          const result = e1.isAssociated(e1.key);
          assert.isTrue(result);
        });

        it('returns true when has direct association', () => {
          e1.addTargetAssociation(e2.key);
          const result = e1.isAssociated(e2.key);
          assert.isTrue(result);
        });

        it('returns true when has an association', () => {
          e1.addTargetAssociation(e2.key);
          e2.addTargetAssociation(e3.key);
          const result = e1.isAssociated(e3.key);
          assert.isTrue(result);
        });

        it('returns false when has no association', () => {
          e1.addTargetAssociation(e2.key);
          const result = e1.isAssociated(e3.key);
          assert.isFalse(result);
        });
      });

      describe('breadcrumbs()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('adds root, data model, and self', () => {
          const m1 = root.addDataModel('m1');
          const e1 = m1.addEntity('e1');
          const result = e1.breadcrumbs();
          assert.lengthOf(result, 3, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, m1.key, 'has the model as parent');
          assert.equal(result[2].key, e1.key, 'has self last');
        });

        it('adds root, sub-ns, data model, and self', () => {
          const n1 = root.addNamespace('n1');
          const m1 = n1.addDataModel('m1');
          const e1 = m1.addEntity('e1');
          const result = e1.breadcrumbs();
          assert.lengthOf(result, 4, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, n1.key, 'has the child-namespace');
          assert.equal(result[2].key, m1.key, 'has the model as parent');
          assert.equal(result[3].key, e1.key, 'has self last');
        });

        it('adds root, sub-ns, sub-ns, data model, and self', () => {
          const n1 = root.addNamespace('n1');
          const n2 = n1.addNamespace('n2');
          const m1 = n2.addDataModel('m1');
          const e1 = m1.addEntity('e1');
          const result = e1.breadcrumbs();
          assert.lengthOf(result, 5, 'has the entire path');
          assert.equal(result[0].key, root.key, 'has the root as first');
          assert.equal(result[1].key, n1.key, 'has the child-namespace');
          assert.equal(result[2].key, n2.key, 'has the child-namespace');
          assert.equal(result[3].key, m1.key, 'has the model as parent');
          assert.equal(result[4].key, e1.key, 'has self last');
        });
      });

      describe('addTag()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('ignores when empty', () => {
          e1.addTag('');
          assert.deepEqual(e1.tags, []);
        });

        it('adds a tag to the property', () => {
          e1.addTag('Test');
          assert.deepEqual(e1.tags, ['Test']);
        });

        it('ignores a tag case insensitive', () => {
          e1.addTag('Test');
          e1.addTag('teSt');
          assert.deepEqual(e1.tags, ['Test']);
        });

        it('adds a tag the root definitions', () => {
          e1.addTag('Test');
          assert.deepEqual(root.definitions.tags, ['Test']);
        });

        it('ignores adding to root definitions when tag exists case insensitive', () => {
          e1.addTag('Test');
          e1.addTag('TeSt');
          assert.deepEqual(root.definitions.tags, ['Test']);
        });
      });

      describe('removeTag()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('ignores when empty', () => {
          e1.addTag('t1');
          e1.removeTag('');
          assert.deepEqual(e1.tags, ['t1']);
        });

        it('removes the tag from the property', () => {
          e1.addTag('t1');
          e1.removeTag('t1');
          assert.deepEqual(e1.tags, []);
        });

        it('removes only the selected tag', () => {
          e1.addTag('t1');
          e1.addTag('t2');
          e1.addTag('t3');
          e1.removeTag('t2');
          assert.deepEqual(e1.tags, ['t1', 't3']);
        });

        it('does not remove root tags', () => {
          e1.addTag('t1');
          e1.removeTag('t1');
          assert.deepEqual(root.definitions.tags, ['t1']);
        });
      });

      describe('createAdapted()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('returns the created entity', () => {
          const result = e1.createAdapted();
          assert.typeOf(result, 'object');
          assert.equal(result.kind, DataEntityKind);
        });

        it('sets the adapts association', () => {
          const result = e1.createAdapted();
          assert.equal(e1.adapts, result.key);
        });

        it('adds the association to the definitions', () => {
          const result = e1.createAdapted();
          assert.deepEqual(root.definitions.entities[1], result);
        });
      });

      describe('readAdapted()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('returns undefined when none', () => {
          assert.isUndefined(e1.readAdapted());
        });

        it('returns the association', () => {
          const result = e1.createAdapted();
          assert.deepEqual(e1.readAdapted(), result);
        });

        it('returns undefined when definition not found', () => {
          e1.adapts = '123';
          assert.isUndefined(e1.readAdapted());
        });
      });

      describe('toApiShape()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        // these tests only check whether the AmfShapeGenerator is called.
        // specific tests are performed elsewhere

        it('returns an object', () => {
          const result = e1.toApiShape();
          assert.typeOf(result, 'object');
          assert.typeOf(result.inherits, 'array');
        });
      });
    });
  });
});
