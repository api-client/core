import { DataMock, ILoremWordInit, ITypeHashInit, ITypeNumberInit, Time } from '@pawel-up/data-mock';
import { AmfNamespace as ns } from "./definitions/Namespace.js";
import { JsonDataNodeGenerator } from "./data-node/JsonDataNodeGenerator.js";
import { parseBooleanInput, parseNumberInput, readTypedValue } from "./Utils.js";
import { ApiParameter } from './definitions/Api.js';
import { IAnyShape, IArrayNode, IArrayShape, IDataExample, IScalarNode, IScalarShape, IShapeUnion } from './definitions/Shapes.js';

export interface IApiSchemaReadOptions {
  /**
   * Whether the value should be read only when the required property is set.
   */
  requiredOnly?: boolean;
  /**
   * Whether to read the examples to generate the value.
   */
  fromExamples?: boolean;
}

/**
 * A utility class with helper functions to read values from a schema definition
 */
export class ApiSchemaValues {
  static mocking = new DataMock();
  
  /**
   * Reads the value to be set on an input. This is for Scalar shapes only.
   *
   * @returns The value to set on the input. Note, it is not cast to the type.
   */
  static readInputValue(parameter: ApiParameter, schema: IScalarShape, opts: IApiSchemaReadOptions = {}): any {
    const { required } = parameter;
    const { defaultValueStr, values } = schema;
    if (!required && opts.requiredOnly === true) {
      return undefined;
    }
    if (defaultValueStr) {
      return ApiSchemaValues.readTypedValue(defaultValueStr, schema.dataType);
    }
    if (Array.isArray(values) && values.length) {
      const firstEnum = values[0] as IScalarNode;
      return ApiSchemaValues.readTypedValue(firstEnum.value, firstEnum.dataType);
    }
    if (opts.fromExamples) {
      let examples: IDataExample[] | undefined;
      if (Array.isArray(parameter.examples) && parameter.examples.length) {
        // just in case when an ApiParameter was passed.
        examples = parameter.examples.filter(i => typeof i !== 'string');
      } else if (Array.isArray(schema.examples) && schema.examples.length) {
        examples = schema.examples;
      }
      if (examples && examples.length) {
        return ApiSchemaValues.inputValueFromExamples(examples);
      }
    }
    return ApiSchemaValues.generateDefaultValue(schema);
  }

  /**
   * @param parameter The parameter that has the array schema.
   * @param schema The final schema to use to read the data from.
   */
  static readInputValues(parameter: ApiParameter, schema: IShapeUnion, opts: IApiSchemaReadOptions={}): any {
    if (!parameter.required && opts.requiredOnly === true) {
      // for a non required array items just skip showing example values
      // as they are not crucial to make an HTTP request.
      return [];
    }
    const { defaultValue } = schema;
    if (defaultValue) {
      const gen = new JsonDataNodeGenerator();
      const result = gen.processNode(defaultValue);
      if (Array.isArray(result)) {
        return result;
      }
    }
    const anySchema = schema as IAnyShape;
    if (opts.fromExamples) {
      let examples: IDataExample[] | undefined;
      if (Array.isArray(parameter.examples) && parameter.examples.length) {
        // just in case when an ApiParameter was passed.
        examples = parameter.examples.filter(i => typeof i !== 'string');
      } else if (Array.isArray(anySchema.examples) && anySchema.examples.length) {
        examples = anySchema.examples;
      }
      return ApiSchemaValues.arrayValuesFromExamples(examples);
    }
    return [];
  }

  /**
   * Reads the value for the form input(s) from examples.
   */
  static inputValueFromExamples(examples: IDataExample[]): any | null | undefined {
    if (!Array.isArray(examples) || !examples.length) {
      return undefined;
    }
    const [example] = examples;
    const { structuredValue } = example;
    if (!structuredValue) {
      return undefined;
    }
    if (structuredValue.types.includes(ns.aml.vocabularies.data.Scalar)) {
      const value = structuredValue as IScalarNode;
      return ApiSchemaValues.readTypedValue(value.value, value.dataType);
    }
    return undefined;
  }

  /**
   * Reads the array value from examples.
   * @param examples Examples set on an array item.
   */
  static arrayValuesFromExamples(examples?: IDataExample[]): any[] {
    const defaultReturn: any[] = [];
    if (!Array.isArray(examples) || !examples.length) {
      return defaultReturn;
    }
    const [example] = examples;
    if (!example.structuredValue || !example.structuredValue.types.includes(ns.aml.vocabularies.data.Array)) {
      return defaultReturn;
    }
    const value = example.structuredValue as IArrayNode;
    const { members } = value;
    if (!Array.isArray(members) || !members.length) {
      return defaultReturn;
    }
    const result: any[] = [];
    members.forEach((item) => {
      const scalar = item as IScalarNode;
      if (!scalar.value) {
        return;
      }
      const typedValue = ApiSchemaValues.readTypedValue(scalar.value, scalar.dataType);
      if (typeof value !== 'undefined' && value !== null) {
        result.push(typedValue);
      }
    });
    return result;
  }

  /**
   * Generates a default value from the schema type.
   * For booleans it returns `false`, for numbers `0`, nulls `null`, etc.
   * It does not generate a value for `string` types!
   */
  static generateDefaultValue(schema: IScalarShape): any {
    const { dataType } = schema;
    return this.defaultValue(dataType);
  }

  /**
   * Generates a default value from the schema type.
   * For booleans it returns `false`, for numbers `0`, nulls `null`, etc.
   * It does not generate a value for `string` types!
   */
  static generateMockedValue(schema: IScalarShape): any {
    const { dataType } = schema;
    switch (dataType) {
      case ns.w3.xmlSchema.string: return this.generateStringValue(schema);
      // XML schema, for DataNode
      case ns.w3.xmlSchema.number:
      case ns.w3.xmlSchema.integer:
      case ns.w3.xmlSchema.float:
      case ns.w3.xmlSchema.long:
      case ns.w3.xmlSchema.double:
      case ns.aml.vocabularies.shapes.number:
      case ns.aml.vocabularies.shapes.integer:
      case ns.aml.vocabularies.shapes.float:
      case ns.aml.vocabularies.shapes.long:
      case ns.aml.vocabularies.shapes.double: return this.generateNumberValue(schema);
      case ns.aml.vocabularies.shapes.boolean:
      case ns.w3.xmlSchema.boolean: return this.mocking.types.boolean();
      case ns.aml.vocabularies.shapes.nil:
      case ns.w3.xmlSchema.nil: return null;
      case ns.w3.xmlSchema.date: return new Time().dateOnly();
      case ns.w3.xmlSchema.dateTime: return new Time().dateTime((schema.format === 'date-time' ? 'rfc3339' : schema.format) as "rfc3339" | "rfc2616");
      case ns.aml.vocabularies.shapes.dateTimeOnly: return new Time().dateTimeOnly();
      case ns.w3.xmlSchema.time: return new Time().timeOnly();
      default: return undefined;
    }
  }

  static defaultValue(dataType?: string): any {
    switch (dataType) {
      case ns.w3.xmlSchema.string: return '';
      // XML schema, for DataNode
      case ns.w3.xmlSchema.number:
      case ns.w3.xmlSchema.integer:
      case ns.w3.xmlSchema.float:
      case ns.w3.xmlSchema.long:
      case ns.w3.xmlSchema.double:
      case ns.aml.vocabularies.shapes.number:
      case ns.aml.vocabularies.shapes.integer:
      case ns.aml.vocabularies.shapes.float:
      case ns.aml.vocabularies.shapes.long:
      case ns.aml.vocabularies.shapes.double: return 0;
      case ns.aml.vocabularies.shapes.boolean:
      case ns.w3.xmlSchema.boolean: return false;
      case ns.aml.vocabularies.shapes.nil:
      case ns.w3.xmlSchema.nil: return null;
      case ns.w3.xmlSchema.date: return '';
      case ns.w3.xmlSchema.dateTime: return '';
      case ns.aml.vocabularies.shapes.dateTimeOnly: return '';
      case ns.w3.xmlSchema.time:  return '';
      default: return undefined;
    }
  }

  /**
   * Generates a random number value given the schema definition for a number scalar.
   */
  static generateNumberValue(schema: IScalarShape): number {
    const { minimum, maximum, format, multipleOf } = schema;
    const init: ITypeNumberInit = {};
    if (typeof minimum === 'number') {
      init.min = minimum;
    }
    if (typeof maximum === 'number') {
      init.max = maximum;
    }
    let generator: ((init?: number | ITypeNumberInit | undefined) => number) | undefined;
    if (format && ['float', 'double'].includes(format)) {
      generator = this.mocking.types.float.bind(this.mocking.types);
    } else if (format && ['uint32', 'uint64', 'fixed32', 'fixed64'].includes(format)) {
      // these are unsigned numbers, make sure the generate anything above 0
      init.min = 0;
      if (init.max && init.max < 0) {
        delete init.max;
      }
    }

    if (!generator) {
      // by default generate an integer
      generator = this.mocking.types.number.bind(this.mocking.types);
    }
    if (typeof multipleOf === 'number') {
      init.precision = multipleOf;
    }
    return generator(init);
  }

  static generateStringValue(schema: IScalarShape): string {
    const { minLength, maxLength, name='', format } = schema;
    const lowerName = name.toLowerCase();
    // we employ some heuristics to generate content based on the property name.
    if (lowerName === 'description') {
      return this.mocking.lorem.paragraph();
    }
    if (format === 'uuid') {
      return this.mocking.types.uuid();
    }
    if (lowerName === 'id') {
      const init: ITypeHashInit = { length: 12 };
      const hasMin = typeof minLength === 'number';
      if (hasMin) {
        init.length = minLength;
      } else if (!hasMin && typeof maxLength === 'number') {
        init.length = maxLength;
      }
      return this.mocking.types.hash(init);
    }
    if (['name', 'fullname'].includes(lowerName)) {
      return this.mocking.person.name();
    }
    if (lowerName === 'firstname') {
      return this.mocking.person.firstName()
    }
    if (lowerName === 'lastname') {
      return this.mocking.person.lastName()
    }
    // if (['zip', 'postcode', 'postalcode', 'zipcode'].includes(lowerName)) {
    //   return this.mocking.word
    // }

    const init: ILoremWordInit = {};
    const hasMin = typeof minLength === 'number';
    if (hasMin) {
      init.length = minLength;
    } else if (!hasMin && typeof maxLength === 'number') {
      init.length = maxLength;
    }
    
    return this.mocking.lorem.word(init);
  }

  /**
   * Casts the `value` to the corresponding data type
   * @param type The w3 schema type
   */
  static readTypedValue(value: any, type?: string): any {
    return readTypedValue(value, type);
  }

  /**
   * @param schemaType Data type encoded in the parameter schema.
   * @returns One of the HTML input element type values.
   */
  static readInputType(schemaType: string): 'number'|'boolean'|'date'|'time'|'datetime-local'|'text' {
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
      case ns.w3.xmlSchema.date: return 'date';
      case ns.w3.xmlSchema.time: return 'time';
      case ns.w3.xmlSchema.dateTime:
      case ns.aml.vocabularies.shapes.dateTimeOnly: return 'datetime-local';
      case ns.aml.vocabularies.shapes.boolean:
      case ns.w3.xmlSchema.boolean: return 'boolean';
      default: return 'text';
    }
  }

  /**
   * Processes a value that should be a number.
   */
  static parseNumberInput(value: unknown, defaultValue?: number): number | undefined {
    return parseNumberInput(value, defaultValue);
  }

  /**
   * Processes a value that should be a number.
   */
  static parseBooleanInput(value: unknown, defaultValue?: boolean): boolean | undefined {
    return parseBooleanInput(value, defaultValue);
  }

  /**
   * Processes a value that should be a date formatted as yyyy-MM-dd.
   */
  static parseDateOnlyInput(value: any): string | undefined {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return undefined;
    }
    const result = d.toJSON();
    const timeSeparator = result.indexOf('T');
    return result.substring(0, timeSeparator);
  }

  /**
   * Processes a value that should be a date formatted as hh:mm:ss.
   */
  static parseTimeOnlyInput(input: unknown): string|undefined {
    const value = String(input).trim();
    if (/^\d\d:\d\d$/.test(value)) {
      return `${value}:00`;
    }
    if (/^\d\d:\d\d:\d\d$/.test(value)) {
      return value;
    }
    return undefined;
  }

  /**
   * Processes a value that should be a date formatted in one of the supported formats:
   * - rfc3339 (default): 2016-02-28T16:41:41.090Z
   * - rfc2616: Sun, 28 Feb 2016 16:41:41 GMT
   */
  static parseDateTimeInput(value: any, format = 'rfc3339'): string | undefined {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return undefined;
    }
    if (format === 'rfc2616') {
      return d.toUTCString();
    }
    // OAS has the `date-time` format describing rfc3339.
    if (['rfc3339', 'date-time'].includes(format)) {
      return d.toISOString();
    }
    return undefined;
  }

  /**
   * Processes a value that should be a date formatted as yyyy-MM-ddThh:mm
   */
  static parseDateTimeOnlyInput(value: any): string | undefined {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return undefined;
    }
    const jsonDate = d.toJSON(); // "yyyy-MM-ddThh:mm:ss.090Z"
    const dot = jsonDate.indexOf('.');
    return jsonDate.substring(0, dot);
  }

  /**
   * Parses the the value according to array schema value.
   */
  static parseArrayInput(value: any, schema: IArrayShape): string|number|boolean|null|undefined {
    const { items } = schema;
    if (!items) {
      return String(value);
    }
    return ApiSchemaValues.parseUserInput(value, items);
  }

  /**
   * Parses the user entered value according to the schema definition.
   */
  static parseUserInput(value: any, schema: IShapeUnion): string|number|boolean|null|undefined {
    if (!schema || value === undefined || value === null) {
      return value;
    }
    const { types } = schema;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return ApiSchemaValues.parseScalarInput(value, schema as IScalarShape);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return ApiSchemaValues.parseArrayInput(value, schema as IArrayShape);
    }
    return value;
  }

  /**
   * Parses the user entered value as scalar value.
   */
  static parseScalarInput(value: unknown, schema: IScalarShape): string|number|boolean|null|undefined {
    switch (schema.dataType) {
      // AML shapes, for Shape
      case ns.aml.vocabularies.shapes.number:
      case ns.aml.vocabularies.shapes.integer:
      case ns.aml.vocabularies.shapes.float:
      case ns.aml.vocabularies.shapes.long:
      case ns.aml.vocabularies.shapes.double:
      case ns.w3.xmlSchema.number:
      case ns.w3.xmlSchema.integer:
      case ns.w3.xmlSchema.float:
      case ns.w3.xmlSchema.long:
      case ns.w3.xmlSchema.double: return ApiSchemaValues.parseNumberInput(value);
      case ns.aml.vocabularies.shapes.boolean:
      case ns.w3.xmlSchema.boolean: return ApiSchemaValues.parseBooleanInput(value);
      case ns.w3.xmlSchema.date: return ApiSchemaValues.parseDateOnlyInput(value);
      case ns.w3.xmlSchema.time: return ApiSchemaValues.parseTimeOnlyInput(value);
      case ns.w3.xmlSchema.dateTime: return ApiSchemaValues.parseDateTimeInput(value, schema.format);
      case ns.aml.vocabularies.shapes.dateTimeOnly: return ApiSchemaValues.parseDateTimeOnlyInput(value);
      default: return String(value);
    }
  }
}
