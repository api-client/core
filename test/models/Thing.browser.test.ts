import { assert } from '@esm-bundle/chai';
import { Thing, IThing, Kind as ThingKind } from '../../src/models/Thing.js';

describe('Models', () => {
  describe('Thing', () => {
    describe('Thing.fromName()', () => {
      it('sets the kind', () => {
        const result = Thing.fromName('a name');
        assert.equal(result.kind, ThingKind);
      });

      it('sets the name', () => {
        const result = Thing.fromName('a name');
        assert.equal(result.name, 'a name');
      });

      it('ignores other properties', () => {
        const result = Thing.fromName('a name');
        assert.isUndefined(result.description);
        assert.isUndefined(result.version);
      });
    });

    describe('constructor()', () => {
      it('creates an empty Thing', () => {
        const result = new Thing();
        assert.equal(result.kind, ThingKind);
        assert.isUndefined(result.name);
        assert.isUndefined(result.description);
        assert.isUndefined(result.version);
      });

      it('creates a Thing from the schema values', () => {
        const schema: IThing = {
          kind: ThingKind,
          name: 'a name',
          description: 'a desc',
          version: 'a ver',
        };
        const result = new Thing(schema);
        assert.equal(result.kind, ThingKind);
        assert.equal(result.name, 'a name');
        assert.equal(result.description, 'a desc');
        assert.equal(result.version, 'a ver');
      });

      it('creates a Thing from the JSON schema string', () => {
        const schema: IThing = {
          kind: ThingKind,
          name: 'a name',
          description: 'a desc',
          version: 'a ver',
        };
        const result = new Thing(JSON.stringify(schema));
        assert.equal(result.kind, ThingKind);
        assert.equal(result.name, 'a name');
        assert.equal(result.description, 'a desc');
        assert.equal(result.version, 'a ver');
      });

      it('throws when invalid schema', () => {
        assert.throws(() => {
          new Thing(JSON.stringify({
            name: 'a name',
          }));
        });
      });
    });

    describe('toJSON()', () => {
      let thing: Thing;
      beforeEach(() => {
        thing = new Thing();
      });

      it('serializes the kind', () => {
        const result = thing.toJSON();
        assert.equal(result.kind, ThingKind);
      });

      it('serializes the name', () => {
        thing.name = 'a name';
        const result = thing.toJSON();
        assert.equal(result.name, 'a name');
      });

      it('does not serialize name when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.name);
      });

      it('serializes the description', () => {
        thing.description = 'a description';
        const result = thing.toJSON();
        assert.equal(result.description, 'a description');
      });

      it('does not serialize description when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.description);
      });

      it('serializes the version', () => {
        thing.version = 'a version';
        const result = thing.toJSON();
        assert.equal(result.version, 'a version');
      });

      it('does not serialize version when missing', () => {
        const result = thing.toJSON();
        assert.isUndefined(result.version);
      });
    });
  });
});
