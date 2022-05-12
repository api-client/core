import { assert } from '@esm-bundle/chai';
import { DataProperty } from '../../src/models/data/DataProperty.js';
import { DataEntity } from '../../src/models/data/DataEntity.js';
import { DataNamespace } from '../../src/models/data/DataNamespace.js';
import { DataModel } from '../../src/models/data/DataModel.js';
import { IArrayShape, IDataExample, IFileShape, INodeShape, IScalarNode, IScalarShape, IUnionShape, IXmlSerializer } from '../../src/amf/definitions/Shapes.js';
import { AnyTypes, ArrayTypes, ExampleTypes, FileTypes, NodeTypes, PropertyTypes, ScalarTypes, UnionTypes } from '../../src/amf/AmfTypes.js';
import { AmfNamespace } from '../../src/amf/definitions/Namespace.js';
import { AmfShapeGenerator } from '../../src/amf/AmfShapeGenerator.js';
import { DataAssociation } from '../../src/models/data/DataAssociation.js';

describe('amf', () => {
  describe('AmfShapeGenerator', () => {
    describe('entity()', () => {
      let root: DataNamespace;
      let m1: DataModel;
      let e1: DataEntity;

      beforeEach(() => {
        root = new DataNamespace();
        m1 = root.addDataModel('m1');
        e1 = m1.addEntity('e1');
      });

      it('returns the basic shape', () => {
        const result = e1.toApiShape() as INodeShape;
        
        assert.equal(result.id, e1.key, 'has the id');
        assert.deepEqual(result.types, NodeTypes, 'has the types');
        assert.deepEqual(result.values, [], 'has the values');
        assert.deepEqual(result.inherits, [], 'has the inherits');
        assert.deepEqual(result.or, [], 'has the or');
        assert.deepEqual(result.and, [], 'has the and');
        assert.deepEqual(result.xone, [], 'has the xone');
        assert.deepEqual(result.examples, [], 'has the examples');
        assert.deepEqual(result.properties, [], 'has the properties');
        assert.typeOf(result.xmlSerialization, 'object', 'has the xmlSerialization');
        assert.equal(result.name, 'e1', 'has the name');
      });

      it('returns the display name', () => {
        e1.info.displayName = 'e 1 name';
        const result = e1.toApiShape() as INodeShape;
        
        assert.equal(result.displayName, 'e 1 name');
      });

      it('returns the description', () => {
        e1.info.description = 'e 1 description';
        const result = e1.toApiShape() as INodeShape;
        
        assert.equal(result.description, 'e 1 description');
      });

      it('returns the deprecated', () => {
        e1.deprecated = true;
        const result = e1.toApiShape() as INodeShape;
        
        assert.isTrue(result.deprecated);
      });

      it('returns empty properties', () => {
        e1.info.description = 'e 1 description';
        const result = e1.toApiShape() as INodeShape;
        
        assert.deepEqual(result.properties, []);
      });

      it('returns defined properties', () => {
        e1.addNamedProperty('test');
        const result = e1.toApiShape() as INodeShape;
        
        assert.lengthOf(result.properties, 1);
      });

      it('adds associations to the properties', () => {
        e1.addNamedProperty('test');
        e1.addNamedAssociation('test association');
        const result = e1.toApiShape() as INodeShape;
        
        assert.lengthOf(result.properties, 2);
        assert.equal(result.properties[1].name, 'test association');
      });

      it('adds parents to the inherits', () => {
        const e2 = m1.addEntity('e2');
        e1.parents = [e2.key];
        const result = e1.toApiShape() as INodeShape;
        
        assert.lengthOf(result.inherits, 1);
        assert.equal(result.inherits[0].name, 'e2');
      });
    });

    describe('property()', () => {
      describe('just data model', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
        let p1: DataProperty;
  
        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
          p1 = e1.addNamedProperty('p1');
        });
  
        it('returns the basic shape', () => {
          const result = p1.toApiShape();
          assert.equal(result.id, p1.key, 'has the id');
          assert.deepEqual(result.types, PropertyTypes, 'has the types');
          assert.deepEqual(result.values, [], 'has the values');
          assert.deepEqual(result.inherits, [], 'has the inherits');
          assert.deepEqual(result.or, [], 'has the or');
          assert.deepEqual(result.and, [], 'has the and');
          assert.deepEqual(result.xone, [], 'has the xone');
          assert.equal(result.path, AmfNamespace.aml.vocabularies.data.key + 'p1', 'has the path');
          assert.equal(result.name, 'p1', 'has the name');
        });
  
        it('sets the minCount', () => {
          p1.required = true;
          const result = p1.toApiShape();
          
          assert.equal(result.minCount, 1);
        });
  
        it('has the default range for a string', () => {
          p1.info.displayName = 'string dn';
          p1.info.description = 'string desc';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.id, `scalar-shape-${p1.key}`, 'has the id');
          assert.deepEqual(range.types, ScalarTypes, 'has the types');
          assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.string, 'has the dataType');
          assert.equal(range.name, 'p1', 'has the name');
          assert.equal(range.displayName, 'string dn', 'has the displayName');
          assert.equal(range.description, 'string desc', 'has the description');
        });
  
        it('has the default range for a number', () => {
          p1.type = 'number';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.number, 'has the dataType');
        });

        it('has the default range for an integer', () => {
          p1.type = 'integer';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.integer, 'has the dataType');
        });
  
        it('has the default range for a date', () => {
          p1.type = 'date';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.date, 'has the dataType');
        });
  
        it('has the default range for a datetime', () => {
          p1.type = 'datetime';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.dateTime, 'has the dataType');
        });
  
        it('has the default range for a time', () => {
          p1.type = 'time';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.aml.vocabularies.shapes.dateTimeOnly, 'has the dataType');
        });
  
        it('has the default range for a nil', () => {
          p1.type = 'nil';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.aml.vocabularies.shapes.nil, 'has the dataType');
        });
  
        it('has the default range for a boolean', () => {
          p1.type = 'boolean';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.aml.vocabularies.shapes.boolean, 'has the dataType');
        });
  
        it('has the default range for an any', () => {
          p1.type = 'any';
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.dataType, AmfNamespace.aml.vocabularies.shapes.AnyShape, 'has the dataType');
        });
  
        it('has the default range for a file', () => {
          p1.type = 'binary';
          p1.info.displayName = 'string dn';
          p1.info.description = 'string desc';
          const result = p1.toApiShape();
          const range = result.range as IFileShape;
          
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.id, `file-shape-${p1.key}`, 'has the id');
          assert.deepEqual(range.types, FileTypes, 'has the types');
          assert.equal(range.name, 'p1', 'has the name');
          assert.equal(range.displayName, 'string dn', 'has the displayName');
          assert.equal(range.description, 'string desc', 'has the description');
        });
  
        it('has the default range for a string when a multiple', () => {
          p1.multiple = true;
          p1.info.displayName = 'string dn';
          p1.info.description = 'string desc';
          const result = p1.toApiShape();
          const range = result.range as IArrayShape;
  
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.id, `array-shape-${p1.key}`, 'has the id');
          assert.deepEqual(range.types, ArrayTypes, 'has the types');
  
          const items = range.items as IScalarShape;
          
          assert.typeOf(items, 'object', 'has the items');
          assert.equal(items.id, `scalar-shape-${p1.key}`, 'has the id');
          assert.deepEqual(items.types, ScalarTypes, 'has the types');
          
          assert.equal(items.name, 'p1', 'has the name');
          assert.equal(items.displayName, 'string dn', 'has the displayName');
          assert.equal(items.description, 'string desc', 'has the description');
        });
  
        it('has the default range for a file when a multiple', () => {
          p1.multiple = true;
          p1.type = 'binary';
          p1.info.displayName = 'string dn';
          p1.info.description = 'string desc';
          const result = p1.toApiShape();
          const range = result.range as IArrayShape;
  
          assert.typeOf(range, 'object', 'has the range');
          assert.equal(range.id, `array-shape-${p1.key}`, 'has the id');
          assert.deepEqual(range.types, ArrayTypes, 'has the types');
  
          const items = range.items as IFileShape;
          
          assert.typeOf(items, 'object', 'has the items');
          assert.equal(items.id, `file-shape-${p1.key}`, 'has the id');
          assert.deepEqual(items.types, FileTypes, 'has the types');
          
          assert.equal(items.name, 'p1', 'has the name');
          assert.equal(items.displayName, 'string dn', 'has the displayName');
          assert.equal(items.description, 'string desc', 'has the description');
        });
      });

      describe('with web bindings', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
  
        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('updates the name when changed', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                name: 'other'
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          
          assert.equal(string.name, 'other', 'the range has the changed name');
          assert.equal(result.name, 'other', 'the property has the changed name');
        });
  
        it('sets the dataType', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                dataType: AmfNamespace.w3.xmlSchema.date,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.dataType, AmfNamespace.w3.xmlSchema.date);
        });
  
        it('sets the xml serialization', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          const value: IXmlSerializer = {
            id: '',
            types: [],
            customDomainProperties: [],
            name: 'test',
          };
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                xml: value,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.deepEqual(string.xmlSerialization, value);
        });
  
        it('sets the file types', () => {
          const p1 = e1.addTypedProperty('binary', 'p1');
          const adapted = p1.createAdapted();
          const value: string[] = ['a'];
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                fileTypes: value,
              }
            }
          ];
          const result = p1.toApiShape();
          const file = result.range as IFileShape;
          assert.deepEqual(file.fileTypes, value);
        });

        it('sets the pattern', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                pattern: 'a-z',
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.pattern, 'a-z');
        });

        it('sets the minLength', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                minLength: 1,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.minLength, 1);
        });

        it('sets the maxLength', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                maxLength: 1,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.maxLength, 1);
        });

        it('sets the minimum', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                minimum: 1,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.minimum, 1);
        });

        it('sets the maximum', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                maximum: 1,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.maximum, 1);
        });

        it('sets the multipleOf', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                multipleOf: 1,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.multipleOf, 1);
        });

        it('sets the exclusiveMinimum', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                exclusiveMinimum: true,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.isTrue(string.exclusiveMinimum);
        });

        it('sets the exclusiveMaximum', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                exclusiveMaximum: false,
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.isFalse(string.exclusiveMaximum);
        });

        it('sets the format', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.bindings = [
            {
              type: 'web',
              schema: {
                format: 'float',
              }
            }
          ];
          const result = p1.toApiShape();
          const string = result.range as IScalarShape;
          assert.equal(string.format, 'float');
        });
      });

      describe('with schema', () => {
        let root: DataNamespace;
        let m1: DataModel;
        let e1: DataEntity;
  
        beforeEach(() => {
          root = new DataNamespace();
          m1 = root.addDataModel('m1');
          e1 = m1.addEntity('e1');
        });

        it('sets the default value', () => {
          const p1 = e1.addTypedProperty('integer', 'p1');
          const adapted = p1.createAdapted();
          adapted.schema = {
            defaultValue: '123',
          };
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          assert.typeOf(range.defaultValue, 'object', 'has the defaultValue');
          const value = range.defaultValue as IScalarNode;
          assert.strictEqual(value.value, '123', 'has the value');
          assert.equal(value.dataType, AmfNamespace.w3.xmlSchema.integer, 'has the range data type');
        });

        it('sets the enum value', () => {
          const p1 = e1.addTypedProperty('number', 'p1');
          const adapted = p1.createAdapted();
          adapted.schema = {
            enum: ['123'],
          };
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          assert.typeOf(range.values, 'array', 'has the values');
          const value = range.values[0] as IScalarNode;
          assert.strictEqual(value.value, '123', 'has the value');
          assert.equal(value.dataType, AmfNamespace.w3.xmlSchema.number, 'has the range data type');
        });

        it('sets the examples value', () => {
          const p1 = e1.addTypedProperty('string', 'p1');
          const adapted = p1.createAdapted();
          adapted.schema = {
            examples: ['123'],
          };
          const result = p1.toApiShape();
          const range = result.range as IScalarShape;
          assert.typeOf(range.examples, 'array', 'has the examples');
          const example = range.examples[0] as IDataExample;

          assert.typeOf(example.id, 'string', 'has the example.id')
          assert.isNotEmpty(example.id, 'the example.id is not empty')
          assert.deepEqual(example.types, ExampleTypes, 'the example.types')
          assert.typeOf(example.structuredValue, 'object', 'has the example.structuredValue')
          
          const value = example.structuredValue as IScalarNode;
          assert.strictEqual(value.value, '123', 'has the value');
          assert.equal(value.dataType, AmfNamespace.w3.xmlSchema.string, 'has the range data type');
        });
      });
    });

    describe('refactorArrayToShape()', () => {
      let root: DataNamespace;
      let m1: DataModel;
      let e1: DataEntity;
      let p1: DataProperty;

      beforeEach(() => {
        root = new DataNamespace();
        m1 = root.addDataModel('m1');
        e1 = m1.addEntity('e1');
        p1 = e1.addNamedProperty('p1');
      });

      it('returns the array items', () => {
        p1.multiple = true;
        const parameter = p1.toApiShape();
        const range = parameter.range as IArrayShape;
        const shape = range.items as IScalarShape;
        const generator = new AmfShapeGenerator();
        const result = generator.refactorArrayToShape(range);
        assert.deepEqual(result, shape);
      });
    });

    describe('refactorShapeToArray()', () => {
      let root: DataNamespace;
      let m1: DataModel;
      let e1: DataEntity;
      let p1: DataProperty;

      beforeEach(() => {
        root = new DataNamespace();
        m1 = root.addDataModel('m1');
        e1 = m1.addEntity('e1');
        p1 = e1.addNamedProperty('p1');
      });

      it('returns the array items', () => {
        const parameter = p1.toApiShape();
        const range = parameter.range as IScalarShape;
        const generator = new AmfShapeGenerator();
        const result = generator.refactorShapeToArray(p1.key, range);

        assert.typeOf(result, 'object', 'has the range');
        assert.equal(result.id, `array-shape-${p1.key}`, 'has the id');
        assert.deepEqual(result.types, ArrayTypes, 'has the types');

        const items = result.items as IScalarShape;
        assert.deepEqual(items, range);
      });
    });

    describe('associationProperty()', () => {
      let root: DataNamespace;
      let m1: DataModel;
      let e1: DataEntity;
      let e2: DataEntity;
      let a1: DataAssociation;
      let p2: DataProperty;

      beforeEach(() => {
        root = new DataNamespace();
        m1 = root.addDataModel('m1');
        e1 = m1.addEntity('e1');
        e2 = m1.addEntity('e2');
        a1 = e1.addTargetAssociation(e2.key, 'a1');
        e1.addTypedProperty('boolean', 'p1');
        p2 = e2.addTypedProperty('number', 'p2');
      });

      it('returns basic shape definition', () => {
        const result = a1.toApiShape();
        assert.typeOf(result, 'object');
        
        assert.equal(result.id, a1.key, 'has the id');
        assert.deepEqual(result.types, PropertyTypes, 'has the types');
        assert.deepEqual(result.values, [], 'has the values');
        assert.deepEqual(result.inherits, [], 'has the inherits');
        assert.deepEqual(result.or, [], 'has the or');
        assert.deepEqual(result.and, [], 'has the and');
        assert.deepEqual(result.xone, [], 'has the xone');
        assert.equal(result.path, AmfNamespace.aml.vocabularies.data.key + 'a1', 'has the path');

        const range = result.range as INodeShape;
        assert.typeOf(range, 'object', 'has the range');
        assert.deepEqual(range.types, NodeTypes, 'range has the types');
        assert.equal(range.name, 'e2', 'range has the name');
        assert.lengthOf(range.properties, 1, 'range has the properties');

        const [prop] = range.properties;
        assert.equal(prop.id, p2.key, 'property has the id');
        assert.deepEqual(prop.types, PropertyTypes, 'property has the types');

        const pRange = prop.range as IScalarShape;
        assert.typeOf(pRange, 'object', 'property range is an object');
        assert.deepEqual(pRange.types, ScalarTypes, 'property range has the types');
        assert.equal(pRange.name, 'p2', 'property range has the name');
        assert.equal(pRange.dataType, AmfNamespace.w3.xmlSchema.number, 'property range has the dataType');
      });

      it('sets property description', () => {
        a1.info.displayName = 'dn a1';
        a1.info.description = 'desc a1';
        const result = a1.toApiShape();
        assert.equal(result.name, 'a1');
        assert.equal(result.displayName, 'dn a1');
        assert.equal(result.description, 'desc a1');
      });

      it('sets the minCount', () => {
        a1.required = true;
        const result = a1.toApiShape();
        assert.equal(result.minCount, 1);
      });

      it('sets the path', () => {
        a1.required = true;
        const result = a1.toApiShape();
        assert.equal(result.path, AmfNamespace.aml.vocabularies.data.key + 'a1', 'has the path');
      });

      it('returns a link definition when created on the schema', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { linked: true };
        const result = a1.toApiShape();
        const range = result.range as IScalarShape;
        assert.equal(range.id, `link-${a1.key}`);
        assert.deepEqual(range.types, ScalarTypes);
        assert.equal(range.dataType, AmfNamespace.w3.xmlSchema.string);
      });

      it('returns a default union type', () => {
        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IUnionShape;
        
        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `union-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, UnionTypes, 'the range has the types');
        assert.lengthOf(range.anyOf, 2, 'has the anyOf array');
        const [p1, p2] = range.anyOf as INodeShape[];
        
        assert.deepEqual(p1.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(p2.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(p1.properties, 1, 'p1 has the properties');
        assert.lengthOf(p2.properties, 0, 'p2 has the properties');
      });

      it('has no range when no associations', () => {
        a1.removeTarget(e2);
        const result = a1.toApiShape();
        assert.isUndefined(result.range);
      });

      it('returns an array shape when multiple', () => {
        a1.multiple = true;
        const result = a1.toApiShape();
        const range = result.range as IArrayShape;
        assert.deepEqual(range.types, ArrayTypes);

        const arrayRange = range.items as INodeShape;
        assert.typeOf(arrayRange, 'object', 'has the range');
        assert.deepEqual(arrayRange.types, NodeTypes, 'range has the types');
        assert.equal(arrayRange.name, 'e2', 'range has the name');
        assert.lengthOf(arrayRange.properties, 1, 'range has the properties');
      });

      it('creates the "anyOf" union', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'anyOf' };

        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IUnionShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `union-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, UnionTypes, 'the range has the types');
        assert.lengthOf(range.anyOf, 2, 'has the anyOf array');
        const [p1, p2] = range.anyOf as INodeShape[];
        
        assert.deepEqual(p1.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(p2.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(p1.properties, 1, 'p1 has the properties');
        assert.lengthOf(p2.properties, 0, 'p2 has the properties');
      });

      it('creates the "allOf" union', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'allOf' };

        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IUnionShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `union-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, UnionTypes, 'the range has the types');
        assert.lengthOf(range.and, 2, 'has the anyOf array');
        const [p1, p2] = range.and as INodeShape[];
        
        assert.deepEqual(p1.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(p2.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(p1.properties, 1, 'p1 has the properties');
        assert.lengthOf(p2.properties, 0, 'p2 has the properties');
      });

      it('creates the "oneOf" union', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'oneOf' };

        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IUnionShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `union-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, UnionTypes, 'the range has the types');
        assert.lengthOf(range.xone, 2, 'has the oneOf array');
        const [p1, p2] = range.xone as INodeShape[];
        
        assert.deepEqual(p1.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(p2.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(p1.properties, 1, 'p1 has the properties');
        assert.lengthOf(p2.properties, 0, 'p2 has the properties');
      });

      it('creates the "not" union', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'not' };

        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IUnionShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `union-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, UnionTypes, 'the range has the types');
        assert.typeOf(range.not, 'object', 'has the not object');
        
        const not = range.not as INodeShape;
        assert.deepEqual(not.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(not.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(not.properties, 1, 'p1 has the properties');
      });

      it('creates the "not" shape', () => {
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'not' };

        const result = a1.toApiShape();
        const range = result.range as IUnionShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `not-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, AnyTypes, 'the range has the types');
        assert.typeOf(range.not, 'object', 'has the not object');
        
        const not = range.not as INodeShape;
        assert.deepEqual(not.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(not.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(not.properties, 1, 'p1 has the properties');
      });

      it('wraps the union in the array shape', () => {
        a1.multiple = true;
        const adapted = a1.createAdapted();
        adapted.schema = { unionType: 'anyOf' };

        const e3 = m1.addEntity('e3');
        a1.addTarget(e3);
        const result = a1.toApiShape();
        const range = result.range as IArrayShape;

        assert.typeOf(range, 'object', 'has the range');
        assert.equal(range.id, `array-shape-${a1.key}`, 'the range has the id');
        assert.deepEqual(range.types, ArrayTypes, 'the range has the types');

        const items = range.items as IUnionShape;

        assert.lengthOf(items.anyOf, 2, 'has the anyOf array');
        const [p1, p2] = items.anyOf as INodeShape[];
        
        assert.deepEqual(p1.types, NodeTypes, 'p1 has the types');
        assert.deepEqual(p2.types, NodeTypes, 'p2 has the types');
        assert.lengthOf(p1.properties, 1, 'p1 has the properties');
        assert.lengthOf(p2.properties, 0, 'p2 has the properties');
      });
    });
  });
});
