import { assert } from '@esm-bundle/chai';
import { Property, IProperty, Kind as PropertyKind } from '../../src/models/Property.js';

describe('Models', () => {
  describe('Property', () => {
    describe('Property.fromType()', () => {
      it('creates a type from a boolean value', () => {
        const result = Property.fromType('a', false);
        assert.equal(result.name, 'a');
        assert.equal(result.value, false);
        assert.equal(result.type, 'boolean');
        assert.equal(result.enabled, true);
      });

      it('creates a type from a boolean value with the enabled flag', () => {
        const result = Property.fromType('a', false, false);
        assert.equal(result.name, 'a');
        assert.equal(result.type, 'boolean');
        assert.equal(result.enabled, false);
      });

      it('creates a type from an integer value', () => {
        const result = Property.fromType('a', 1);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 1);
        assert.equal(result.type, 'integer');
        assert.equal(result.enabled, true);
      });

      it('creates a type from an integer value with the enabled flag', () => {
        const result = Property.fromType('a', 2, false);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 2);
        assert.equal(result.type, 'integer');
        assert.equal(result.enabled, false);
      });

      it('creates a type from a string value', () => {
        const result = Property.fromType('a', 'b');
        assert.equal(result.name, 'a');
        assert.equal(result.value, 'b');
        assert.equal(result.type, 'string');
        assert.equal(result.enabled, true);
      });

      it('creates a type from a string value with the enabled flag', () => {
        const result = Property.fromType('a', 'b', false);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 'b');
        assert.equal(result.type, 'string');
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.String()', () => {
      it('creates a string property with defaults', () => {
        const result = Property.String('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'string');
      });

      it('creates a string property with a value', () => {
        const result = Property.String('a', 'b');
        assert.equal(result.value, 'b');
      });

      it('creates a string property with the enabled flag', () => {
        const result = Property.String('a', 'b', false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Integer()', () => {
      it('creates an integer property with defaults', () => {
        const result = Property.Integer('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'integer');
      });

      it('creates an integer property with a value', () => {
        const result = Property.Integer('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an integer property with the enabled flag', () => {
        const result = Property.Integer('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Float()', () => {
      it('creates a float property with defaults', () => {
        const result = Property.Float('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0.0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'float');
      });

      it('creates a float property with a value', () => {
        const result = Property.Float('a', 1.3);
        assert.equal(result.value, 1.3);
      });

      it('creates a float property with the enabled flag', () => {
        const result = Property.Float('a', 1.3, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Boolean()', () => {
      it('creates a boolean property with defaults', () => {
        const result = Property.Boolean('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, false);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'boolean');
      });

      it('creates a boolean property with a value', () => {
        const result = Property.Boolean('a', false);
        assert.equal(result.value, false);
      });

      it('creates a boolean property with the enabled flag', () => {
        const result = Property.Boolean('a', true, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Date()', () => {
      it('creates a date property with defaults', () => {
        const result = Property.Date('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'date');
      });
    });

    describe('Property.Datetime()', () => {
      it('creates a datetime property with defaults', () => {
        const result = Property.Datetime('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'datetime');
      });
    });

    describe('Property.Time()', () => {
      it('creates a time property with defaults', () => {
        const result = Property.Time('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'time');
      });
    });

    describe('constructor()', () => {
      it('creates an instance from schema', () => {
        const init: IProperty = {
          kind: PropertyKind,
          name: 'a',
          type: 'string',
          value: '',
        };
        const result = new Property(init);
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.type, 'string');
        assert.equal(result.value, '');
      });
    });
  });
});
