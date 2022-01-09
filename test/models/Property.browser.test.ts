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

    describe('Property.Int32()', () => {
      it('creates an int32 property with defaults', () => {
        const result = Property.Int32('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'int32');
      });

      it('creates an int32 property with a value', () => {
        const result = Property.Int32('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an int32 property with the enabled flag', () => {
        const result = Property.Int32('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Int64()', () => {
      it('creates an int64 property with defaults', () => {
        const result = Property.Int64('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'int64');
      });

      it('creates an int64 property with a value', () => {
        const result = Property.Int64('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an int64 property with the enabled flag', () => {
        const result = Property.Int64('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Uint32()', () => {
      it('creates an uint32 property with defaults', () => {
        const result = Property.Uint32('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'uint32');
      });

      it('creates an uint32 property with a value', () => {
        const result = Property.Uint32('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an uint32 property with the enabled flag', () => {
        const result = Property.Uint32('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Uint64()', () => {
      it('creates an uint64 property with defaults', () => {
        const result = Property.Uint64('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'uint64');
      });

      it('creates an uint64 property with a value', () => {
        const result = Property.Uint64('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an uint64 property with the enabled flag', () => {
        const result = Property.Uint64('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Sint32()', () => {
      it('creates an sint32 property with defaults', () => {
        const result = Property.Sint32('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sint32');
      });

      it('creates an sint32 property with a value', () => {
        const result = Property.Sint32('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an sint32 property with the enabled flag', () => {
        const result = Property.Sint32('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Sint64()', () => {
      it('creates an sint64 property with defaults', () => {
        const result = Property.Sint64('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sint64');
      });

      it('creates an sint64 property with a value', () => {
        const result = Property.Sint64('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an sint64 property with the enabled flag', () => {
        const result = Property.Sint64('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Fixed32()', () => {
      it('creates an fixed32 property with defaults', () => {
        const result = Property.Fixed32('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'fixed32');
      });

      it('creates an fixed32 property with a value', () => {
        const result = Property.Fixed32('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an fixed32 property with the enabled flag', () => {
        const result = Property.Fixed32('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Fixed64()', () => {
      it('creates an fixed64 property with defaults', () => {
        const result = Property.Fixed64('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'fixed64');
      });

      it('creates an fixed64 property with a value', () => {
        const result = Property.Fixed64('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an fixed64 property with the enabled flag', () => {
        const result = Property.Fixed64('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Sfixed32()', () => {
      it('creates an sfixed32 property with defaults', () => {
        const result = Property.Sfixed32('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sfixed32');
      });

      it('creates an sfixed32 property with a value', () => {
        const result = Property.Sfixed32('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an sfixed32 property with the enabled flag', () => {
        const result = Property.Sfixed32('a', 1, false);
        assert.equal(result.enabled, false);
      });
    });

    describe('Property.Sfixed64()', () => {
      it('creates an sfixed64 property with defaults', () => {
        const result = Property.Sfixed64('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sfixed64');
      });

      it('creates an sfixed64 property with a value', () => {
        const result = Property.Sfixed64('a', 1);
        assert.equal(result.value, 1);
      });

      it('creates an sfixed64 property with the enabled flag', () => {
        const result = Property.Sfixed64('a', 1, false);
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

    describe('Property.Bytes()', () => {
      it('creates a bytes property with defaults', () => {
        const result = Property.Bytes('a');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'bytes');
      });
    });

    describe('Property.fromTypeDefault()', () => {
      it('creates a string property', () => {
        const result = Property.fromTypeDefault('a', 'string');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'string');
      });

      it('creates a boolean property', () => {
        const result = Property.fromTypeDefault('a', 'boolean');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, false);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'boolean');
      });

      it('creates a date property', () => {
        const result = Property.fromTypeDefault('a', 'date');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'date');
      });

      it('creates a datetime property', () => {
        const result = Property.fromTypeDefault('a', 'datetime');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'datetime');
      });

      it('creates a time property', () => {
        const result = Property.fromTypeDefault('a', 'time');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'time');
      });

      it('creates a float property', () => {
        const result = Property.fromTypeDefault('a', 'float');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0.0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'float');
      });

      it('creates a double property', () => {
        const result = Property.fromTypeDefault('a', 'double');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0.0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'double');
      });

      it('creates an integer property', () => {
        const result = Property.fromTypeDefault('a', 'integer');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'integer');
      });

      it('creates an int32 property', () => {
        const result = Property.fromTypeDefault('a', 'int32');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'int32');
      });

      it('creates an int64 property', () => {
        const result = Property.fromTypeDefault('a', 'int64');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'int64');
      });

      it('creates an uint32 property', () => {
        const result = Property.fromTypeDefault('a', 'uint32');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'uint32');
      });

      it('creates an uint64 property', () => {
        const result = Property.fromTypeDefault('a', 'uint64');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'uint64');
      });

      it('creates an sint32 property', () => {
        const result = Property.fromTypeDefault('a', 'sint32');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sint32');
      });

      it('creates an sint64 property', () => {
        const result = Property.fromTypeDefault('a', 'sint64');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sint64');
      });

      it('creates an fixed32 property', () => {
        const result = Property.fromTypeDefault('a', 'fixed32');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'fixed32');
      });

      it('creates an fixed64 property', () => {
        const result = Property.fromTypeDefault('a', 'fixed64');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'fixed64');
      });

      it('creates an sfixed32 property', () => {
        const result = Property.fromTypeDefault('a', 'sfixed32');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sfixed32');
      });

      it('creates an sfixed64 property', () => {
        const result = Property.fromTypeDefault('a', 'sfixed64');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, 0);
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'sfixed64');
      });

      it('creates an bytes property', () => {
        const result = Property.fromTypeDefault('a', 'bytes');
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.value, '');
        assert.equal(result.enabled, true);
        assert.equal(result.type, 'bytes');
      });

      it('throws for an unknown type', () => {
        assert.throws(() => {
          // @ts-ignore
          Property.fromTypeDefault('a', 'unknown');
        });
      });
    });

    describe('constructor()', () => {
      it('creates a default instance', () => {
        const result = new Property();
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, '');
        assert.equal(result.value, '');
        assert.equal(result.type, 'string');
      });

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

      it('creates an instance from JSON schema', () => {
        const init: IProperty = {
          kind: PropertyKind,
          name: 'a',
          type: 'string',
          value: '',
        };
        const result = new Property(JSON.stringify(init));
        assert.equal(result.kind, PropertyKind);
        assert.equal(result.name, 'a');
        assert.equal(result.type, 'string');
        assert.equal(result.value, '');
      });
    });

    describe('new()', () => {
      let property: Property;
      beforeEach(() => {
        property = Property.String('test-name', 'test-value', false);
      });

      it('throws when not an IProperty', () => {
        assert.throws(() => {
          // @ts-ignore
          property.new({});
        });
      });

      it('sets the name', () => {
        const schema = property.toJSON();
        schema.name = 'updated';
        property.new(schema);
        assert.equal(property.name, 'updated');
      });

      it('sets the value', () => {
        const schema = property.toJSON();
        schema.value = 'updated';
        property.new(schema);
        assert.equal(property.value, 'updated');
      });

      it('sets the description', () => {
        const schema = property.toJSON();
        schema.description = 'updated';
        property.new(schema);
        assert.equal(property.description, 'updated');
      });

      it('sets the default', () => {
        const schema = property.toJSON();
        schema.default = 'updated';
        property.new(schema);
        assert.equal(property.default, 'updated');
      });

      it('sets the enabled', () => {
        const schema = property.toJSON();
        schema.enabled = true;
        property.new(schema);
        assert.equal(property.enabled, true);
      });

      it('sets the required', () => {
        const schema = property.toJSON();
        schema.required = true;
        property.new(schema);
        assert.equal(property.required, true);
      });

      it('sets the repeated', () => {
        const schema = property.toJSON();
        schema.repeated = true;
        property.new(schema);
        assert.equal(property.repeated, true);
      });

      it('sets the enum', () => {
        const schema = property.toJSON();
        schema.enum = 'updated';
        property.new(schema);
        assert.equal(property.enum, 'updated');
      });
    });

    describe('isProperty()', () => {
      it('returns false when no input', () => {
        const result = Property.isProperty(undefined);
        assert.isFalse(result);
      });

      it('returns false when no name', () => {
        const schema = Property.String('test').toJSON();
        delete schema.name;
        const result = Property.isProperty(schema);
        assert.isFalse(result);
      });

      it('returns false when no type', () => {
        const schema = Property.String('test').toJSON();
        delete schema.type;
        const result = Property.isProperty(schema);
        assert.isFalse(result);
      });

      it('returns false when invalid kind', () => {
        const schema = Property.String('test').toJSON();
        // @ts-ignore
        schema.kind = 'test';
        const result = Property.isProperty(schema);
        assert.isFalse(result);
      });

      it('returns false when unknown type', () => {
        const schema = Property.String('test').toJSON();
        // @ts-ignore
        schema.type = 'test';
        const result = Property.isProperty(schema);
        assert.isFalse(result);
      });

      it('returns true when a valid property', () => {
        const schema = Property.String('test').toJSON();
        const result = Property.isProperty(schema);
        assert.isTrue(result);
      });
    });

    describe('toJSON()', () => {
      it('sets the kind', () => {
        const result = Property.String();
        assert.equal(result.toJSON().kind, PropertyKind);
      });

      it('sets the name', () => {
        const result = Property.String('test');
        assert.equal(result.toJSON().name, 'test');
      });

      it('sets the value', () => {
        const result = Property.String('', 'test');
        assert.equal(result.toJSON().value, 'test');
      });

      it('sets the type', () => {
        const result = Property.String();
        assert.equal(result.toJSON().type, 'string');
      });

      it('does not set the description when missing', () => {
        const result = Property.String();
        assert.isUndefined(result.toJSON().description);
      });

      it('sets the description', () => {
        const result = Property.String();
        result.description = 'test'
        assert.equal(result.toJSON().description, 'test');
      });

      it('does not set the default when missing', () => {
        const result = Property.String();
        assert.isUndefined(result.toJSON().default);
      });

      it('sets the default', () => {
        const result = Property.String();
        result.default = 'test'
        assert.equal(result.toJSON().default, 'test');
      });

      it('does not set the enum when missing', () => {
        const result = Property.String();
        assert.isUndefined(result.toJSON().enum);
      });

      it('sets the enum', () => {
        const result = Property.String();
        result.enum = ['test'];
        assert.deepEqual(result.toJSON().enum, ['test']);
      });

      it('does not set the enabled when missing', () => {
        const result = new Property();
        assert.isUndefined(result.toJSON().enabled);
      });

      it('sets the enabled', () => {
        const result = Property.String();
        result.enabled = true;
        assert.isTrue(result.toJSON().enabled);
      });

      it('does not set the required when missing', () => {
        const result = new Property();
        assert.isUndefined(result.toJSON().required);
      });

      it('sets the required', () => {
        const result = Property.String();
        result.required = true;
        assert.isTrue(result.toJSON().required);
      });

      it('does not set the repeated when missing', () => {
        const result = new Property();
        assert.isUndefined(result.toJSON().repeated);
      });

      it('sets the repeated', () => {
        const result = Property.String();
        result.repeated = true;
        assert.isTrue(result.toJSON().repeated);
      });
    });
  });
});
