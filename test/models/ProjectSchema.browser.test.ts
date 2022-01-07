import { assert } from '@esm-bundle/chai';
import { ProjectSchema, IProjectSchema, Kind as ProjectSchemaKind } from '../../src/models/ProjectSchema.js';

describe('Models', () => {
  describe('ProjectSchema', () => {
    describe('ProjectSchema.fromName()', () => {
      it('creates the schema from the name', () => {
        const result = ProjectSchema.fromName('test');
        assert.equal(result.kind, ProjectSchemaKind);
        assert.equal(result.name, 'test');
        assert.typeOf(result.key, 'string');
        assert.isUndefined(result.properties);
        assert.isUndefined(result.content);
        assert.isUndefined(result.mime);
      });
    });

    describe('ProjectSchema.fromContent()', () => {
      it('creates the schema from the content', () => {
        const result = ProjectSchema.fromContent('test name', 'test-content', 'application/json');
        assert.equal(result.kind, ProjectSchemaKind);
        assert.equal(result.name, 'test name');
        assert.typeOf(result.key, 'string');
        assert.isUndefined(result.properties);
        assert.equal(result.content, 'test-content');
        assert.equal(result.mime, 'application/json');
      });
    });

    describe('constructor()', () => {
      it('creates a default schema', () => {
        const result = new ProjectSchema;
        assert.equal(result.kind, ProjectSchemaKind);
        assert.equal(result.name, '');
        assert.typeOf(result.key, 'string');
        assert.isUndefined(result.properties);
        assert.isUndefined(result.content);
        assert.isUndefined(result.mime);
      });

      it('creates an instance from a schema', () => {
        const info: IProjectSchema = {
          kind: ProjectSchemaKind,
          name: 'test-info',
          content: 'test-content',
          mime: 'application/json',
          key: '123',
          properties: [
            {
              name: 'p1',
              type: 'boolean',
            }
          ],
        };
        const result = new ProjectSchema(info);
        assert.equal(result.kind, ProjectSchemaKind);
        assert.equal(result.name, 'test-info');
        assert.equal(result.key, '123');
        assert.deepEqual(result.properties, info.properties);
        assert.equal(result.content, 'test-content');
        assert.equal(result.mime, 'application/json');
      });

      it('creates an instance from a JSON string', () => {
        const info: IProjectSchema = {
          kind: ProjectSchemaKind,
          name: 'test-info',
          key: '123',
        };
        const result = new ProjectSchema(JSON.stringify(info));
        assert.equal(result.kind, ProjectSchemaKind);
        assert.equal(result.name, 'test-info');
        assert.equal(result.key, '123');
      });

      it('creates the key when missing', () => {
        const info: IProjectSchema = {
          kind: ProjectSchemaKind,
          name: 'test-info',
          key: '123',
        };
        delete info.key;
        const result = new ProjectSchema(info);
        assert.typeOf(result.key, 'string');
      });
    });

    describe('toJSON()', () => {
      const base: IProjectSchema = {
        kind: ProjectSchemaKind,
        name: 'test-info',
        content: 'test-content',
        mime: 'application/json',
        key: '123',
        properties: [
          {
            name: 'p1',
            type: 'boolean',
          }
        ],
      };

      it('serializes the kind', () => {
        const instance = new ProjectSchema({  ...base });
        const result = instance.toJSON();
        assert.equal(result.kind, ProjectSchemaKind);
      });

      it('serializes the key', () => {
        const instance = new ProjectSchema({  ...base });
        const result = instance.toJSON();
        assert.equal(result.key, '123');
      });

      it('serializes the content', () => {
        const instance = new ProjectSchema({  ...base });
        const result = instance.toJSON();
        assert.equal(result.content, 'test-content');
      });

      it('serializes the mime', () => {
        const instance = new ProjectSchema({  ...base });
        const result = instance.toJSON();
        assert.equal(result.mime, 'application/json');
      });

      it('serializes the properties', () => {
        const instance = new ProjectSchema({  ...base });
        const result = instance.toJSON();
        assert.typeOf(result.properties, 'array');
        assert.lengthOf(result.properties, 1);
      });

      it('does not serialize the content when missing', () => {
        const instance = new ProjectSchema({  ...base, content: undefined });
        const result = instance.toJSON();
        assert.isUndefined(result.content);
      });

      it('does not serialize the mime when missing', () => {
        const instance = new ProjectSchema({  ...base, mime: undefined });
        const result = instance.toJSON();
        assert.isUndefined(result.mime);
      });

      it('does not serialize the properties when missing', () => {
        const instance = new ProjectSchema({  ...base, properties: undefined });
        const result = instance.toJSON();
        assert.isUndefined(result.properties);
      });
    });

    describe('addProperty()', () => {
      it('adds property by name and type when no properties', () => {
        const instance = new ProjectSchema();
        instance.addProperty('a', 'boolean');
        assert.typeOf(instance.properties, 'array');
        assert.lengthOf(instance.properties, 1);
        const [prop] = instance.properties;
        assert.equal(prop.name, 'a');
        assert.equal(prop.type, 'boolean');
      });

      it('adds property by name and type when existing properties', () => {
        const instance = new ProjectSchema();
        instance.addProperty('a', 'boolean');
        instance.addProperty('b', 'string');
        assert.lengthOf(instance.properties, 2);
        const [, prop] = instance.properties;
        assert.equal(prop.name, 'b');
        assert.equal(prop.type, 'string');
      });

      it('returns the created property', () => {
        const instance = new ProjectSchema();
        const result = instance.addProperty('a', 'boolean');
        const [prop] = instance.properties;
        assert.deepEqual(prop, result);
      });

      it('throws when the type is not defined', () => {
        const instance = new ProjectSchema();
        assert.throws(() => {
          // @ts-ignore
          instance.addProperty('a');
        });
      });

      it('adds a property from the schema', () => {
        const instance = new ProjectSchema();
        instance.addProperty({
          name: 'a',
          type: 'string',
        });
        assert.typeOf(instance.properties, 'array');
        assert.lengthOf(instance.properties, 1);
        const [prop] = instance.properties;
        assert.equal(prop.name, 'a');
        assert.equal(prop.type, 'string');
      });
    });
  });
});
