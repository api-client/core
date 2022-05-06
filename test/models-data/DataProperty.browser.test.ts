import { assert } from '@esm-bundle/chai';
import { DataProperty, IDataProperty, IPropertySchema, Kind as DataPropertyKind, } from '../../src/models/data/DataProperty.js';
import { DataEntity } from '../../src/models/data/DataEntity.js';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';
import { Thing } from '../../src/models/Thing.js';
import { DataModel } from '../../src/models/data/DataModel.js';

describe('models', () => {
  describe('data', () => {
    describe('DataProperty', () => {
      describe('constructor()', () => {
        describe('defaults', () => {
          let root: DataNamespace;
          beforeEach(() => {
            root = new DataNamespace();
          });

          it('sets the kind', () => {
            const assoc = new DataProperty(root);
            assert.equal(assoc.kind, DataPropertyKind);
          });

          it('sets the key', () => {
            const assoc = new DataProperty(root);
            assert.typeOf(assoc.key, 'string');
            assert.isNotEmpty(assoc.key);
          });

          it('sets the default "info"', () => {
            const assoc = new DataProperty(root);
            assert.typeOf(assoc.info, 'object');
            assert.equal(assoc.info.name, '');
          });

          it('sets the default "type"', () => {
            const assoc = new DataProperty(root);
            assert.equal(assoc.type, 'string');
          });

          it('sets the default "tags"', () => {
            const assoc = new DataProperty(root);
            assert.deepEqual(assoc.tags, []);
          });

          it('sets the default "taxonomy"', () => {
            const assoc = new DataProperty(root);
            assert.deepEqual(assoc.taxonomy, []);
          });

          it('sets the default "schemas"', () => {
            const assoc = new DataProperty(root);
            assert.deepEqual(assoc.schemas, []);
          });

          it('does not set multiple', () => {
            const assoc = new DataProperty(root);
            assert.isUndefined(assoc.multiple);
          });

          it('does not set required', () => {
            const assoc = new DataProperty(root);
            assert.isUndefined(assoc.required);
          });

          it('does not set primary', () => {
            const assoc = new DataProperty(root);
            assert.isUndefined(assoc.primary);
          });

          it('does not set index', () => {
            const assoc = new DataProperty(root);
            assert.isUndefined(assoc.index);
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
            const orig = new DataProperty(root).toJSON();
            orig.key = 'test';
            const instance = new DataProperty(root, orig);
            assert.equal(instance.key, 'test');
          });
  
          it('sets the info', () => {
            const orig = new DataProperty(root).toJSON();
            orig.info.name = 'test';
            const instance = new DataProperty(root, orig);
            assert.equal(instance.info.name, 'test');
          });
  
          it('sets the multiple', () => {
            const orig = new DataProperty(root).toJSON();
            orig.multiple = true;
            const instance = new DataProperty(root, orig);
            assert.isTrue(instance.multiple);
          });
  
          it('sets the required', () => {
            const orig = new DataProperty(root).toJSON();
            orig.required = true;
            const instance = new DataProperty(root, orig);
            assert.isTrue(instance.required);
          });

          it('sets the "type"', () => {
            const orig = new DataProperty(root).toJSON();
            orig.type = 'datetime';
            const assoc = new DataProperty(root, orig);
            assert.equal(assoc.type, 'datetime');
          });

          it('sets the "tags"', () => {
            const orig = new DataProperty(root).toJSON();
            orig.tags = ['test'];
            const assoc = new DataProperty(root, orig);
            assert.deepEqual(assoc.tags, ['test']);
          });

          it('sets the "taxonomy"', () => {
            const orig = new DataProperty(root).toJSON();
            orig.taxonomy = ['test'];
            const assoc = new DataProperty(root, orig);
            assert.deepEqual(assoc.taxonomy, ['test']);
          });

          it('sets the "schemas"', () => {
            const orig = new DataProperty(root).toJSON();
            orig.schemas = [
              {
                value: {
                  maximum: 10,
                }
              }
            ];
            const assoc = new DataProperty(root, orig);
            assert.deepEqual(assoc.schemas, orig.schemas);
          });

          it('sets the primary', () => {
            const orig = new DataProperty(root).toJSON();
            orig.primary = true;
            const assoc = new DataProperty(root, orig);
            assert.isTrue(assoc.primary);
          });

          it('sets the index', () => {
            const orig = new DataProperty(root).toJSON();
            orig.index = true;
            const assoc = new DataProperty(root, orig);
            assert.isTrue(assoc.index);
          });

          it('sets the deprecated', () => {
            const orig = new DataProperty(root).toJSON();
            orig.deprecated = true;
            const assoc = new DataProperty(root, orig);
            assert.isTrue(assoc.deprecated);
          });
  
          it('initializes from JSON schema ', () => {
            const orig = new DataProperty(root).toJSON();
            orig.required = true;
            const instance = new DataProperty(root, JSON.stringify(orig));
            assert.isTrue(instance.required);
          });
        });
      });

      describe('fromName()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the name', () => {
          const assoc = DataProperty.fromName(root, 'test');
          assert.equal(assoc.info.name, 'test');
        });
      });

      describe('fromType()', () => {
        let root: DataNamespace;
        beforeEach(() => {
          root = new DataNamespace();
        });

        it('sets the type', () => {
          const assoc = DataProperty.fromType(root, 'number');
          assert.equal(assoc.type, 'number');
        });
      });

      describe('new()', () => {
        let root: DataNamespace;
        let base: IDataProperty;
        beforeEach(() => {
          root = new DataNamespace();
          base = {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataPropertyKind,
            type: 'file'
          };
        });

        it('sets the key', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.equal(assoc.key, 'test123');
        });

        it('sets the info', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.equal(assoc.info.name, 'test name');
        });

        it('sets the type', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.equal(assoc.type, 'file');
        });

        it('sets default info', () => {
          const assoc = new DataProperty(root);
          delete base.info;
          assoc.new(base);
          assert.equal(assoc.info.name, '');
        });

        it('sets the multiple', () => {
          const assoc = new DataProperty(root);
          assoc.new({ ...base, multiple: true });
          assert.isTrue(assoc.multiple);
        });

        it('does not set multiple when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.isUndefined(assoc.multiple);
        });

        it('sets the required', () => {
          const assoc = new DataProperty(root);
          assoc.new({ ...base, required: true });
          assert.isTrue(assoc.required);
        });

        it('does not set required when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.isUndefined(assoc.required);
        });

        it('sets the index', () => {
          const assoc = new DataProperty(root);
          assoc.new({ ...base, index: true });
          assert.isTrue(assoc.index);
        });

        it('does not set index when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.isUndefined(assoc.index);
        });

        it('sets the deprecated', () => {
          const assoc = new DataProperty(root);
          assoc.new({ ...base, deprecated: true });
          assert.isTrue(assoc.deprecated);
        });

        it('does not set deprecated when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.isUndefined(assoc.deprecated);
        });

        it('sets the primary', () => {
          const assoc = new DataProperty(root);
          assoc.new({ ...base, primary: true });
          assert.isTrue(assoc.primary);
        });

        it('does not set primary when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.new(base);
          assert.isUndefined(assoc.primary);
        });

        it('sets the tags as a copy', () => {
          const assoc = new DataProperty(root);
          const init = { ...base, tags: ['a'] };
          assoc.new(init);
          assert.deepEqual(assoc.tags, ['a']);
          init.tags.push('b')
          assert.deepEqual(assoc.tags, ['a']);
        });

        it('resets tags when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.tags = ['a'];
          assoc.new(base);
          assert.deepEqual(assoc.tags, []);
        });

        it('sets the taxonomy as a copy', () => {
          const assoc = new DataProperty(root);
          const init = { ...base, taxonomy: ['a'] };
          assoc.new(init);
          assert.deepEqual(assoc.taxonomy, ['a']);
          init.taxonomy.push('b')
          assert.deepEqual(assoc.taxonomy, ['a']);
        });

        it('resets taxonomy when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.taxonomy = ['a'];
          assoc.new(base);
          assert.deepEqual(assoc.taxonomy, []);
        });

        it('sets the schemas as a copy', () => {
          const assoc = new DataProperty(root);
          const schema: IPropertySchema<string> = {
            value: {},
          };
          const init = { ...base, schemas: [schema] };
          assoc.new(init);
          assert.deepEqual(assoc.schemas, [schema]);
          init.schemas.push({ value: { default: 'test' } })
          assert.deepEqual(assoc.schemas, [schema]);
        });

        it('resets schemas when not in the input', () => {
          const assoc = new DataProperty(root);
          assoc.schemas = [{ value: {} }];
          assoc.new(base);
          assert.deepEqual(assoc.schemas, []);
        });

        it('throws when unknown input', () => {
          const assoc = new DataProperty(root);
          assert.throws(() => {
            // @ts-ignore
            assoc.new({});
          }, 'Not a data property.');
        });
      });

      describe('toJSON()', () => {
        let root: DataNamespace;
        let base: DataProperty;
        beforeEach(() => {
          root = new DataNamespace();
          base = new DataProperty(root, {
            info: Thing.fromName('test name').toJSON(),
            key: 'test123',
            kind: DataPropertyKind,
            type: 'number',
          });
        });

        it('serializes the kind', () => {
          const result = base.toJSON();
          assert.equal(result.kind, DataPropertyKind);
        });

        it('serializes the key', () => {
          const result = base.toJSON();
          assert.equal(result.key, base.key);
        });

        it('serializes the info', () => {
          const result = base.toJSON();
          assert.equal(result.info.name, 'test name');
        });

        it('does not serialize the multiple by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.multiple);
        });

        it('does not serialize the required by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.required);
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

        it('does not serialize taxonomy by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.taxonomy);
        });

        it('does not serialize tags by default', () => {
          const result = base.toJSON();
          assert.isUndefined(result.tags);
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
      });

      describe('remove()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let p1: DataProperty;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          p1 = e1.addNamedProperty('test prop');
        });

        it('removes self from the parent entity', () => {
          p1.remove();
          assert.deepEqual(e1.properties, []);
        });

        it('removes self from the root definitions', () => {
          p1.remove();
          assert.deepEqual(root.definitions.properties, []);
        });

        it('does not serialize properties', () => {
          p1.remove();
          const schema = root.toJSON();
          assert.isUndefined(schema.definitions.properties);
          assert.isUndefined(schema.definitions.entities[0].properties);
        });

        it('removes self only', () => {
          const p2 = e1.addNamedProperty('other');
          p1.remove();
          assert.deepEqual(e1.properties, [p2]);
          assert.deepEqual(root.definitions.properties, [p2]);
        });
      });

      describe('addTag()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let p1: DataProperty;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          p1 = e1.addNamedProperty('test prop');
        });

        it('ignores when empty', () => {
          p1.addTag('');
          assert.deepEqual(p1.tags, []);
        });

        it('adds a tag to the property', () => {
          p1.addTag('Test');
          assert.deepEqual(p1.tags, ['Test']);
        });

        it('ignores a tag case insensitive', () => {
          p1.addTag('Test');
          p1.addTag('teSt');
          assert.deepEqual(p1.tags, ['Test']);
        });

        it('adds a tag the root definitions', () => {
          p1.addTag('Test');
          assert.deepEqual(root.definitions.tags, ['Test']);
        });

        it('ignores adding to root definitions when tag exists case insensitive', () => {
          p1.addTag('Test');
          p1.addTag('TeSt');
          assert.deepEqual(root.definitions.tags, ['Test']);
        });
      });

      describe('removeTag()', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let p1: DataProperty;

        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          p1 = e1.addNamedProperty('test prop');
        });

        it('ignores when empty', () => {
          p1.addTag('t1');
          p1.removeTag('');
          assert.deepEqual(p1.tags, ['t1']);
        });

        it('removes the tag from the property', () => {
          p1.addTag('t1');
          p1.removeTag('t1');
          assert.deepEqual(p1.tags, []);
        });

        it('removes only the selected tag', () => {
          p1.addTag('t1');
          p1.addTag('t2');
          p1.addTag('t3');
          p1.removeTag('t2');
          assert.deepEqual(p1.tags, ['t1', 't3']);
        });

        it('does not remove root tags', () => {
          p1.addTag('t1');
          p1.removeTag('t1');
          assert.deepEqual(root.definitions.tags, ['t1']);
        });
      });
    });
  });
});
