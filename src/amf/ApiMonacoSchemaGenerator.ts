import { AmfNamespace as ns } from "./definitions/Namespace.js";
import { IArrayShape, INodeShape, IPropertyShape, IScalarNode, IScalarShape, IShapeUnion } from "./definitions/Shapes.js";
import { collectNodeProperties } from './Utils.js';

export interface IMonacoSchema {
  uri: string;
  schema: IMonacoProperty;
  fileMatch?: string[];
}

export interface IMonacoProperty {
  $id?: string;
  title: string;
  type: string;
  description?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export interface IMonacoScalarProperty extends IMonacoProperty {
  default?: string;
  pattern?: string;
  format?: string;
  exclusiveMaximum?: boolean;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  enum?: string[];
}

export interface IMonacoObjectProperty extends IMonacoProperty {
  properties: Record<string, IMonacoProperty>;
  required: string[];
  additionalProperties?: boolean;
  minProperties?: number;
  maxProperties?: number;
}

export interface IMonacoArrayProperty extends IMonacoProperty {
  additionalItems?: boolean;
  items: {
    anyOf: IMonacoProperty[]
  }
  uniqueItems?: boolean;
  minItems?: number;
  maxItems?: number;
  required: string[];
}

function cleanName(name?: string): string {
  if (!name) {
    return '';
  }
  return name.replace('?', '');
}

/**
 * A class to generate JSON schema from an ApiShapeUnion declaration to use with the Monaco editor schemas.
 */
export class ApiMonacoSchemaGenerator {
  schemas: IMonacoSchema[] = [];

  /**
   * @param parentUri The URI for the fileMatch property.
   */
  generate(schema: IShapeUnion, parentUri: string): IMonacoSchema[] {
    this.schemas = [];
    if (!schema) {
      return [];
    }
    const { types } = schema;
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this.fromNodeShape(schema as INodeShape, parentUri);
    }
    return [];
  }

  /**
   * @param parentUri The URI for the fileMatch property.
   */
  fromNodeShape(schema: INodeShape, parentUri?: string): IMonacoSchema[] {
    const { id, name } = schema;
    const properties = collectNodeProperties(schema);
    const content: IMonacoObjectProperty = {
      title: cleanName(name),
      type: "object",
      properties: {},
      required: [],
    };
    const result: IMonacoSchema = {
      uri: id,
      schema: content,
    };
    if (parentUri) {
      result.fileMatch = [parentUri];
    }
    this.schemas.push(result);
    if (!Array.isArray(properties) || !properties.length) {
      return this.schemas;
    }
    properties.forEach(property => this.appendSchemaProperty(content, property));
    return this.schemas;
  }

  appendSchemaProperty(content: IMonacoObjectProperty, property: IPropertyShape): void {
    const { name, range, minCount } = property;
    if (!range) {
      return;
    }
    const value = this.rangeToPropertySchema(range);
    if (value && name) {
      content.properties[name] = value;
      if (minCount === 1) {
        content.required.push(name);
      }
    }
  }

  rangeToPropertySchema(range: IShapeUnion): IMonacoScalarProperty | IMonacoObjectProperty | IMonacoArrayProperty | undefined {
    const { types } = range;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this.scalarRangeToPropertySchema(range as IScalarShape);
    }
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this.nodeShapeRangeToPropertySchema(range as INodeShape);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape)) {
      return this.arrayShapeRangeToPropertySchema(range as IArrayShape);
    }
    return undefined;
  }

  scalarRangeToPropertySchema(schema: IScalarShape): IMonacoScalarProperty {
    const { values, description, name, displayName, defaultValueStr, exclusiveMaximum, exclusiveMinimum, minimum, maximum, minLength, maxLength, id, multipleOf, pattern, readOnly, writeOnly } = schema;
    const type = this.schemaTypeToJsonDataType(schema.dataType);
    const result: IMonacoScalarProperty = {
      '$id': id,
      type,
      title: cleanName(displayName || name),
    };
    if (description) {
      result.description = description;
    }
    if (defaultValueStr) {
      result.default = defaultValueStr;
    }
    if (typeof exclusiveMaximum === 'boolean') {
      result.exclusiveMaximum = exclusiveMaximum;
    }
    if (typeof exclusiveMinimum === 'boolean') {
      result.exclusiveMinimum = exclusiveMinimum;
    }
    if (typeof maxLength === 'number') {
      result.maxLength = maxLength;
    }
    if (typeof minLength === 'number') {
      result.minLength = minLength;
    }
    if (typeof minimum === 'number') {
      result.minimum = minimum;
    }
    if (typeof maximum === 'number') {
      result.maximum = maximum;
    }
    if (typeof multipleOf === 'number') {
      result.multipleOf = multipleOf;
    }
    if (typeof pattern === 'string') {
      result.pattern = pattern;
    }
    if (typeof readOnly === 'boolean') {
      result.readOnly = readOnly;
    }
    if (typeof writeOnly === 'boolean') {
      result.writeOnly = writeOnly;
    }
    switch (schema.dataType) {
      case ns.aml.vocabularies.shapes.dateTimeOnly: result.format = 'date-time'; break;
      case ns.w3.xmlSchema.date: result.format = 'date'; break;
      case ns.w3.xmlSchema.time: result.format = 'time'; break;
      default:
    }
    if (Array.isArray(values) && values.length) {
      // enum properties
      result.enum = [];
      values.forEach((value) => {
        const { types } = value;
        if (types.includes(ns.aml.vocabularies.data.Scalar)) {
          const typed = value as IScalarNode;
          if (typed.value) {
            result.enum!.push(typed.value);
          }
        }
      });
    }
    return result;
  }

  /**
   * Translates AMF data type to JSON schema data type.
   */
  schemaTypeToJsonDataType(schemaType?: string): string {
    switch (schemaType) {
      case ns.aml.vocabularies.shapes.number:
      case ns.aml.vocabularies.shapes.integer:
      case ns.aml.vocabularies.shapes.float:
      case ns.aml.vocabularies.shapes.long:
      case ns.aml.vocabularies.shapes.double:
      case ns.w3.xmlSchema.number:
      case ns.w3.xmlSchema.integer:
      case ns.w3.xmlSchema.float:
      case ns.w3.xmlSchema.long:
      case ns.w3.xmlSchema.double: return 'number';
      case ns.w3.xmlSchema.boolean:
      case ns.aml.vocabularies.shapes.boolean: return 'boolean';
      case ns.aml.vocabularies.shapes.nil:
      case ns.w3.xmlSchema.nil: return 'null';
      default: return 'string';
    }
  }

  nodeShapeRangeToPropertySchema(schema: INodeShape): IMonacoObjectProperty {
    const { description, name, displayName, id, readOnly, writeOnly, closed, minProperties, maxProperties } = schema;
    const properties = collectNodeProperties(schema);

    const result: IMonacoObjectProperty = {
      '$id': id,
      type: 'object',
      title: cleanName(displayName || name),
      properties: {},
      required: [],
    };
    if (description) {
      result.description = description;
    }
    if (typeof readOnly === 'boolean') {
      result.readOnly = readOnly;
    }
    if (typeof writeOnly === 'boolean') {
      result.writeOnly = writeOnly;
    }
    if (typeof closed === 'boolean') {
      result.additionalProperties = !closed;
    }
    if (typeof minProperties === 'number') {
      result.minProperties = minProperties;
    }
    if (typeof maxProperties === 'number') {
      result.maxProperties = maxProperties;
    }
    properties.forEach(property => this.appendSchemaProperty(result, property));
    return result;
  }

  arrayShapeRangeToPropertySchema(schema: IArrayShape): IMonacoArrayProperty {
    const { description, name, displayName, id, readOnly, writeOnly, items, minItems, maxItems, uniqueItems } = schema;
    const result: IMonacoArrayProperty = {
      '$id': id,
      type: 'array',
      title: cleanName(displayName || name),
      items: {
        anyOf: [],
      },
      required: [],
      additionalItems: false,
    };
    if (description) {
      result.description = description;
    }
    if (typeof readOnly === 'boolean') {
      result.readOnly = readOnly;
    }
    if (typeof writeOnly === 'boolean') {
      result.writeOnly = writeOnly;
    }
    if (typeof uniqueItems === 'boolean') {
      result.uniqueItems = uniqueItems;
    }
    if (items) {
      const value = this.rangeToPropertySchema(items);
      if (value) {
        result.items.anyOf.push(value);
      }
    }
    if (typeof minItems === 'number') {
      result.minItems = minItems;
    }
    if (typeof maxItems === 'number') {
      result.maxItems = maxItems;
    }
    return result;
  }
}
