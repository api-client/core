import { IPropertyBindings, IPropertySchema, IPropertyWebBindings } from "../models/data/Bindings.js";
import { DataAssociation } from "../models/data/DataAssociation.js";
import { DataEntity } from "../models/data/DataEntity.js";
import { DataProperty } from "../models/data/DataProperty.js";
import { ExampleTypes, modelTypeToAmfDataType } from "./AmfTypes.js";
import { AmfNamespace } from "./definitions/Namespace.js";
import { anyShape, arrayShape, fileShape, IAnyShape, IArrayShape, IDataExample, IFileShape, INodeShape, IPropertyShape, IRecursiveShape, IScalarShape, IShape, IShapeUnion, nodeShape, propertyShape, recursiveShape, scalarShape, unionShape } from "./definitions/Shapes.js";
import { AmfDataNode } from "./models/AmfDataNode.js";
import v4 from '../lib/uuid.js';

/**
 * Serializes Data shapes (DataEntity, DataProperty, DataAssociation) to AMF-related shapes.
 */
export class AmfShapeGenerator {
  /**
   * Serializes the Entity to the AMF node shape.
   * 
   * @param input The Property to serialize.
   * @param generatedEntities The list keys of already generated entities. This prohibits recursive shape generation.
   */
  entity(input: DataEntity, generatedEntities: string[] = []): INodeShape | IRecursiveShape {
    // const adapted = input.readAdapted();
    if (generatedEntities.includes(input.key)) {
      // create a recursive shape.
      return this._recursiveShape(input);
    }
    generatedEntities.push(input.key);
    const result = nodeShape(input.key);
    result.id = input.key;
    this._updateBaseProperties(input, result);
    result.properties = [];
    input.properties.forEach((item) => {
      // TODO: find adapted property in the adapted schema
      // and check whether the property is disabled.

      // we check whether the property is hidden.
      // This is not happening when calling the `property()` because this method
      // always returns the AMF shape.
      const adapted = item.readAdapted();
      if (adapted && adapted.hidden) {
        return;
      }
      const shape = this.property(item);
      result.properties.push(shape);
    });
    input.associations.forEach((assoc) => {
      const prop = this.associationProperty(assoc, generatedEntities);
      result.properties.push(prop);
    });
    input.getComputedParents().forEach((parent) => {
      const shape = this.entity(parent, generatedEntities);
      result.inherits.push(shape);
    });
    return result;
  }

  /**
   * Serializes an Entity Property to the AMF property shape.
   * 
   * @param input The Property to serialize.
   */
  property(input: DataProperty): IPropertyShape {
    const { required, key } = input;
    const result = propertyShape(key);
    result.path = `${AmfNamespace.aml.vocabularies.data.key}${input.info.name}`;
    if (required) {
      result.minCount = 1;
    }
    result.range = this._readPropertyRange(input);

    // for example, Example generator needs to know the name of the property 
    // as it does not look into the "range" object.
    this._updateBaseProperties(input, result);

    // sync the name of the property shape with the range, in case it was changed by the bindings
    if (result.range!.name) {
      result.name = result.range!.name;
    }
    return result;
  }

  /**
   * Serializes an Entity property to the AMF property shape with association targets as defined in the schema configuration.
   * 
   * @param input The Property to serialize.
   */
  associationProperty(input: DataAssociation, generatedEntities: string[] = []): IPropertyShape {
    const { required, key } = input;
    const result = propertyShape(key);
    result.path = `${AmfNamespace.aml.vocabularies.data.key}${input.info.name}`;
    if (required) {
      result.minCount = 1;
    }
    result.range = this.associationShape(input, generatedEntities);
    this._updateBaseProperties(input, result);
    return result;
  }

  /**
   * Generates a shape for an association. Most likely you want to use the `associationProperty()` method instead.
   * 
   * @param input The data association instance.
   * @returns The range value for the PropertyShape.
   */
  associationShape(input: DataAssociation, generatedEntities: string[] = []): IShapeUnion | undefined {
    const adapted = input.readAdapted();
    let schema = adapted && adapted.schema;
    if (schema && schema.linked) {
      // This is a link to the schema. In an API that would be the id
      // of a resource to request the data from.
      const range = scalarShape(input.key);
      range.id = `link-${input.key}`,
      range.dataType = modelTypeToAmfDataType('string');
      return range;
    }
    const items = this.associationUnion(input, generatedEntities);
    if (!items) {
      return;
    }
    const unionType = schema && schema.unionType || 'anyOf';
    if (Array.isArray(items)) {
      const range = unionShape(input.key);
      this._updateBaseProperties(input, range);
      range.anyOf = [];
      if (unionType === 'anyOf') {
        range.anyOf = items;
      } else if (unionType === 'allOf') {
        range.and = items;
      } else if (unionType === 'oneOf') {
        range.xone = items;
      } else { // not.
        range.not = items[0]; // ?
      }
      if (input.multiple) {
        return this.refactorShapeToArray(input.key, range);
      }
      return range;
    } 
    if (unionType === 'not') {
      const wrapper = anyShape(input.key);
      wrapper.id = `not-shape-${input.key}`
      wrapper.not = items;
      return wrapper;
    }
    if (input.multiple) {
      return this.refactorShapeToArray(input.key, items);
    }
    return items;
  }

  /**
   * Generates a shape list for an union. Most likely you want to use the `associationProperty()` method instead.
   * 
   * @param input The data association instance.
   * @returns The range value for the PropertyShape.
   */
  associationUnion(input: DataAssociation, generatedEntities: string[] = []): IShapeUnion | IShapeUnion[] | undefined {
    const targets = input.getTargets().map(i => this.entity(i, generatedEntities));
    if (!targets.length) {
      return undefined;
    }
    if (targets.length > 1) {
      return targets;
    }
    return targets[0];
  }

  /**
   * The DataProperty may have both the `schema` and the `bindings`. For AMF shape we read `schema` for 
   * default value, examples, and enum values. We also look for the `web` bindings for more detailed definition of a shape.
   * 
   * @param input 
   * @returns 
   */
  protected _readPropertyRange(input: DataProperty): IArrayShape | IFileShape | IScalarShape {
    const adapted = input.readAdapted();
    let bindings: IPropertyWebBindings | undefined;
    let schema: IPropertySchema | undefined;
    if (adapted) {
      if (adapted.schema) {
        schema = adapted.schema;
      }
      const findResult = adapted.bindings.find(b => b.type === 'web') as IPropertyBindings | undefined;
      if (findResult) {
        bindings = findResult.schema;
      }
    }
    return this._createAmfSchema(input, schema, bindings);
  }

  protected _createAmfSchema(input: DataProperty, schema?: IPropertySchema, bindings?: IPropertyWebBindings): IArrayShape | IFileShape | IScalarShape {
    const { multiple, type } = input;
    if (multiple) {
      return this._generateArrayShape(input, schema, bindings);
    }
    if (type === 'binary' && !(bindings && bindings.format === 'binary')) {
      return this._generateFileShape(input, schema, bindings);
    }
    return this._generateScalarShape(input, schema, bindings);
  }

  /**
   * Normally this would be part of generating a scalar schema but the the property is an array this
   * is generated on the array and not on the range.
   * 
   * @param result The scalar or array shape.
   * @param schema The adapted property schema
   * @param type The data type of the parent property as set on the `range`
   * @param isArray Whether the DataProperty is multiple
   */
  protected _setShapeSchema(result: IAnyShape, schema: IPropertySchema, type: string, isArray?: boolean): void {
    if (schema.defaultValue) {
      const dt = AmfDataNode.scalar(schema.defaultValue, type);
      result.defaultValue = dt.toJSON();
    }
    if (Array.isArray(schema.enum)) {
      result.values = schema.enum.map(i => AmfDataNode.scalar(i, type).toJSON());
    }
    if (Array.isArray(schema.examples)) {
      if (isArray) {
        result.examples = this._generateArrayExamples(schema.examples, type);
      } else {
        result.examples = this._generateExamples(schema.examples, type);
      }
    }
  }

  protected _generateArrayShape(input: DataProperty, schema?: IPropertySchema, bindings?: IPropertyWebBindings): IArrayShape {
    const result = arrayShape(input.key);
    const { type } = input;
    if (type === 'binary') {
      // we do not pass schema to the range generator as we set schema's properties on the array shape.
      result.items = this._generateFileShape(input, undefined, bindings);
    } else {
      result.items = this._generateScalarShape(input, undefined, bindings);
    }
    if (schema) {
      const type = (result.items as IScalarShape).dataType as string;
      this._setShapeSchema(result, schema, type, input.multiple);
    }
    return result;
  }

  protected _generateScalarShape(input: DataProperty, schema?: IPropertySchema, bindings?: IPropertyWebBindings): IScalarShape {
    const result = scalarShape(input.key);
    this._updateBaseProperties(input, result);
    if (bindings) {
      if (bindings.dataType) {
        result.dataType = bindings.dataType;
      }
      this._fillScalarShapeCommonProperties(result, input, bindings);
    }
    if (!result.dataType) {
      result.dataType = modelTypeToAmfDataType(input.type, bindings);
    }
    if (schema) {
      this._setShapeSchema(result, schema, result.dataType as string, input.multiple);
    }
    return result;
  }

  protected _generateExamples(examples: string[], type: string): IDataExample[] {
    return examples.map((current) => {
      const value = AmfDataNode.scalar(current, type).toJSON();
      const item: IDataExample = {
        id: v4(),
        customDomainProperties: [],
        strict: true,
        types: ExampleTypes,
        structuredValue: value,
      };
      return item;
    });
  }

  protected _generateArrayExamples(examples: string[], type: string): IDataExample[] {
    const item: IDataExample = {
      id: v4(),
      customDomainProperties: [],
      strict: true,
      types: ExampleTypes,
    };
    const value = new AmfDataNode('array');
    examples.forEach((item) => {
      const member = AmfDataNode.scalar(item, type);
      value.addMember(member);
    });
    item.structuredValue = value.toJSON();
    return [item];
  }

  protected _generateFileShape(input: DataProperty, schema?: IPropertySchema, bindings?: IPropertyWebBindings): IFileShape {
    if (bindings && bindings.dataType === AmfNamespace.w3.xmlSchema.base64Binary) {
      // this is a binary format of a string shape
    }
    const result = fileShape(input.key);
    this._updateBaseProperties(input, result);
    if (bindings) {
      if (Array.isArray(bindings.fileTypes)) {
        result.fileTypes = bindings.fileTypes;
      }
      this._fillScalarShapeCommonProperties(result, input, bindings);
    }
    return result;
  }

  protected _fillScalarShapeCommonProperties(result: IFileShape | IScalarShape, input: DataProperty, bindings: IPropertyWebBindings): void {
    if (bindings.name) {
      result.name = bindings.name;
    }
    if (bindings.xml) {
      result.xmlSerialization = bindings.xml;
    }
    if (bindings.pattern) {
      result.pattern = bindings.pattern;
    }
    if (typeof bindings.minLength === 'number') {
      result.minLength = bindings.minLength;
    }
    if (typeof bindings.maxLength === 'number') {
      result.maxLength = bindings.maxLength;
    }
    if (typeof bindings.minimum === 'number') {
      result.minimum = bindings.minimum;
    }
    if (typeof bindings.maximum === 'number') {
      result.maximum = bindings.maximum;
    }
    if (typeof bindings.multipleOf === 'number') {
      result.multipleOf = bindings.multipleOf;
    }
    if (typeof bindings.exclusiveMinimum === 'boolean') {
      result.exclusiveMinimum = bindings.exclusiveMinimum;
    }
    if (typeof bindings.exclusiveMaximum === 'boolean') {
      result.exclusiveMaximum = bindings.exclusiveMaximum;
    }
    if (bindings.format) {
      result.format = bindings.format;
    }
    if (typeof input.readOnly === 'boolean') {
      result.readOnly = input.readOnly;
    }
    if (typeof input.writeOnly === 'boolean') {
      result.writeOnly = input.writeOnly;
    }
  }

  protected _updateBaseProperties(input: DataProperty | DataAssociation | DataEntity, target: IShape): void {
    const adopted = input.readAdapted();
    if (adopted && adopted.info.name) {
      target.name = adopted.info.name;
    } else if (input.info.name) {
      target.name = input.info.name;
    }
    if (adopted && adopted.info.displayName) {
      target.displayName = adopted.info.displayName;
    } else if (input.info.displayName) {
      target.displayName = input.info.displayName;
    }
    if (adopted && adopted.info.description) {
      target.description = adopted.info.description;
    } else if (input.info.description) {
      target.description = input.info.description;
    }
    if (adopted && (adopted as DataProperty).deprecated) {
      target.deprecated = (adopted as DataProperty).deprecated;
    } else if ((input as DataProperty).deprecated) {
      target.deprecated = (input as DataProperty).deprecated;
    }
  }

  protected _recursiveShape(input: DataEntity): IRecursiveShape {
    return recursiveShape(input.key, input.key);
  }

  /**
   * Translates generated schema from an array shape to the shape defined in the `items` of the array.
   * 
   * @param array The source array.
   * @returns The definition of the `items` of the array.
   */
  refactorArrayToShape(array: IArrayShape): IShapeUnion {
    const { items } = array;
    return items!;
  }

  /**
   * Translates the shape to an array shape. This happens when data model property is changed from 'multiple' to not-multiple and back.
   * 
   * @param id The key of the parameter or an association
   * @param shape The shape to wrap as an array.
   * @returns Array shape.
   */
  refactorShapeToArray(id: string, shape: IShapeUnion): IArrayShape {
    const result = arrayShape(id);
    result.items = shape;
    return result;
  }
}
