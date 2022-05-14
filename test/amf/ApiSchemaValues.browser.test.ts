import { assert } from '@esm-bundle/chai';
import { ApiSchemaValues } from '../../src/amf/ApiSchemaValues.js';
import { AmfDocument } from '../../src/amf/definitions/Amf.js';
import { AmfNamespace as ns } from '../../src/amf/definitions/Namespace.js';
import { IArrayShape, IScalarShape, scalarShape } from '../../src/amf/definitions/Shapes.js';
import { AmfLoader } from './AmfLoader.js';

describe('ApiSchemaValues', () => {
  const loader = new AmfLoader();

  describe('readInputValues()', () => {
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
    });

    it('generates the value for a string scalar with example', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'arrableStringWithExample');
      const result = ApiSchemaValues.readInputValues(param, param.schema, { fromExamples: true });
      assert.deepEqual(result,  [ 'example 1', 'example 2' ]);
    });

    it('generates the value for a string scalar with examples', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'arrableStringWithExamples');
      const result = ApiSchemaValues.readInputValues(param, param.schema, { fromExamples: true });
      assert.deepEqual(result,  [ 'example 1', 'example 2' ]);
    });

    it('generates the value for a number scalar with examples', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'arrableNumberWithExamples');
      const result = ApiSchemaValues.readInputValues(param, param.schema, { fromExamples: true });
      assert.deepEqual(result,  [ 1, 2 ]);
    });

    it('generates an empty array when no examples', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'arrableNumber');
      const result = ApiSchemaValues.readInputValues(param, param.schema);
      assert.deepEqual(result,  []);
    });

    it('ignores optional parameters', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequiredArray');
      const result = ApiSchemaValues.readInputValues(param, param.schema, { requiredOnly: true });
      assert.deepEqual(result,  []);
    });

    it('reads default value', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequiredArrayDefault');
      const result = ApiSchemaValues.readInputValues(param, param.schema);
      assert.deepEqual(result,  ["test default"]);
    });

    it('returns default value', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequiredArray');
      const result = ApiSchemaValues.readInputValues(param, param.schema);
      assert.deepEqual(result,  []);
    });
  });

  describe('readInputValue()', () => {
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
    });

    it('returns type default value for a string', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarString');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape);
      assert.typeOf(result,  'string');
    });

    it('returns schema default value for a string', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarStringWithDefault');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape);
      assert.strictEqual(result,  'test default');
    });

    it('returns schema example value for a string', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarStringWithExample');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape, { fromExamples: true });
      assert.strictEqual(result,  'a string');
    });

    it('returns schema example value from examples for a string', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarStringWithExamples');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape, { fromExamples: true });
      assert.strictEqual(result,  'a string 1');
    });

    it('returns type default value for a number', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarNumber');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape);
      assert.typeOf(result,  'number');
    });

    it('returns schema default value for a number', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarNumberWithDefault');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape);
      assert.strictEqual(result,  20);
    });

    it('returns schema example value for a number', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarNumberWithExample');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape, { fromExamples: true });
      assert.strictEqual(result,  10);
    });

    it('returns schema example value from examples for a number', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarNumberWithExamples');
      const result = ApiSchemaValues.readInputValue(param, (param.schema) as IScalarShape, { fromExamples: true });
      assert.strictEqual(result,  30);
    });

    it('returns type default value for a boolean', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarBoolean');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape));
      assert.typeOf(result,  'boolean');
    });

    it('returns schema default value for a boolean', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarBooleanWithDefault');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape));
      assert.strictEqual(result,  false);
    });

    it('returns schema example value for a boolean', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarBooleanWithExample');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape), { fromExamples: true });
      assert.strictEqual(result,  true);
    });

    it('returns schema example value from examples for a boolean', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'scalarBooleanWithExamples');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape), { fromExamples: true });
      assert.strictEqual(result,  true);
    });

    it('returns undefined when required only', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequired');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape), { requiredOnly: true });
      assert.strictEqual(result,  undefined);
    });

    it('returns default value when not required only', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequired');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape), { requiredOnly: false });
      assert.typeOf(result,  'string');
    });

    it('returns default value when not required only', async () => {
      const param = loader.getParameter(model, '/parameters', 'get', 'notRequiredDefault');
      const result = ApiSchemaValues.readInputValue(param, (param.schema as IScalarShape));
      assert.strictEqual(result,  'test default');
    });
  });

  describe('parseScalarInput()', () => {
    [
      [ns.w3.xmlSchema.number, 10, 10],
      [ns.w3.xmlSchema.number, '10', 10],
      [ns.w3.xmlSchema.number, 'test', undefined],
      [ns.aml.vocabularies.shapes.number, 'test', undefined],
      [ns.w3.xmlSchema.integer, '20', 20],
      [ns.aml.vocabularies.shapes.integer, '20', 20],
      [ns.w3.xmlSchema.float, 30.5, 30.5],
      [ns.aml.vocabularies.shapes.float, 30.5, 30.5],
      [ns.w3.xmlSchema.long, '40.75', 40.75],
      [ns.aml.vocabularies.shapes.long, '40.75', 40.75],
      [ns.w3.xmlSchema.double, '50', 50],
      [ns.aml.vocabularies.shapes.double, '50', 50],
    ].forEach(([key, value, expected]) => {
      it(`parses input for ${key}`, () => {
        const shape = scalarShape('');
        shape.dataType = key as string;
        const result = ApiSchemaValues.parseScalarInput(value, shape);
        assert.strictEqual(result,  expected);
      });
    });

    [
      [ns.w3.xmlSchema.boolean, true, true],
      [ns.w3.xmlSchema.boolean, 'true', true],
      [ns.w3.xmlSchema.boolean, false, false],
      [ns.w3.xmlSchema.boolean, 'false', false],
      [ns.aml.vocabularies.shapes.boolean, 'false', false],
      [ns.w3.xmlSchema.boolean, 'test', undefined],
    ].forEach(([key, value, expected]) => {
      it(`parses input for ${key} type with ${value}`, () => {
        const shape = scalarShape('');
        shape.dataType = key as string;
        const result = ApiSchemaValues.parseScalarInput(value, shape);
        assert.strictEqual(result,  expected);
      });
    });

    [
      [ns.w3.xmlSchema.date, '2021-08-03', '2021-08-03'],
      [ns.w3.xmlSchema.date, 'error', undefined],
      [ns.w3.xmlSchema.time, '20:21:22', '20:21:22'],
      [ns.w3.xmlSchema.time, '20:21', '20:21:00'],
      [ns.w3.xmlSchema.time, 'error', undefined],
      [ns.aml.vocabularies.shapes.dateTimeOnly, '2021-08-03T20:21:22.012Z', '2021-08-03T20:21:22'],
      [ns.aml.vocabularies.shapes.dateTimeOnly, 'invalid', undefined],
    ].forEach(([key, value, expected]) => {
      it(`parses input for ${key} type with ${value}`, () => {
        const shape = scalarShape('');
        shape.dataType = key as string;
        const result = ApiSchemaValues.parseScalarInput(value, shape);
        assert.strictEqual(result,  expected);
      });
    });

    it(`parses input for dateTime, rfc3339`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'rfc3339';
      const result = ApiSchemaValues.parseScalarInput('2021-08-03T20:21:22.012Z', shape);
      assert.strictEqual(result, '2021-08-03T20:21:22.012Z');
    });

    it(`parses input for dateTime, rfc3339 as OAS date-time`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'date-time';
      const result = ApiSchemaValues.parseScalarInput('2021-08-03T20:21:22.012Z', shape);
      assert.strictEqual(result, '2021-08-03T20:21:22.012Z');
    });

    it(`parses input for dateTime, rfc2616`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'rfc2616';
      const result = ApiSchemaValues.parseScalarInput('2021-08-03T20:21:22.012Z', shape);
      assert.strictEqual(result, 'Tue, 03 Aug 2021 20:21:22 GMT');
    });

    it(`parses input for dateTime with invalid value`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'rfc2616';
      const result = ApiSchemaValues.parseScalarInput('bla', shape);
      assert.strictEqual(result, undefined);
    });

    it(`parses input for dateTime with invalid format`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'invalid';
      const result = ApiSchemaValues.parseScalarInput('2021-08-03T20:21:22.012Z', shape);
      assert.strictEqual(result, undefined);
    });
  });

  describe('parseUserInput()', () => {
    let scalar: IScalarShape;
    let array: IArrayShape;
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
      scalar = loader.getShape(model, 'ScalarNumber') as IScalarShape;
      array = loader.getShape(model, 'NumberArray') as IArrayShape;
    });

    it('returns the value when no schema', () => {
      const result = ApiSchemaValues.parseUserInput('test', undefined);
      assert.strictEqual(result, 'test');
    });

    it('returns the value when value = undefined', () => {
      const result = ApiSchemaValues.parseUserInput(undefined, scalar);
      assert.strictEqual(result, undefined);
    });

    it('returns the value when value = null', () => {
      const result = ApiSchemaValues.parseUserInput(null, scalar);
      assert.strictEqual(result, null);
    });

    it('returns the parsed value', () => {
      const result = ApiSchemaValues.parseUserInput('125', scalar);
      assert.strictEqual(result, 125);
    });

    it('returns the parsed value for an array', () => {
      const result = ApiSchemaValues.parseUserInput('126', array);
      assert.strictEqual(result, 126);
    });

    it('returns string value when no "items"', () => {
      const cp = { ...array, items: undefined };
      const result = ApiSchemaValues.parseUserInput('126', cp);
      assert.strictEqual(result, '126');
    });

    it('returns the value for unsupported types', async () => {
      const type = loader.getShape(model, 'ScalarObjectUnion');
      const result = ApiSchemaValues.parseUserInput('126', type);
      assert.strictEqual(result, '126');
    });
  });

  describe('readInputType()', () => {
    [
      [ns.w3.xmlSchema.number, 'number'],
      [ns.aml.vocabularies.shapes.number, 'number'],
      [ns.w3.xmlSchema.integer, 'number'],
      [ns.aml.vocabularies.shapes.integer, 'number'],
      [ns.w3.xmlSchema.float, 'number'],
      [ns.aml.vocabularies.shapes.float, 'number'],
      [ns.w3.xmlSchema.long, 'number'],
      [ns.aml.vocabularies.shapes.long, 'number'],
      [ns.w3.xmlSchema.double, 'number'],
      [ns.aml.vocabularies.shapes.double, 'number'],
      [ns.w3.xmlSchema.date, 'date'],
      [ns.w3.xmlSchema.time, 'time'],
      [ns.w3.xmlSchema.dateTime, 'datetime-local'],
      [ns.aml.vocabularies.shapes.dateTimeOnly, 'datetime-local'],
      [ns.aml.vocabularies.shapes.boolean, 'boolean'],
      [ns.w3.xmlSchema.boolean, 'boolean'],
      [ns.w3.xmlSchema.string, 'text'],
    ].forEach(([key, expected]) => {
      it(`recognizes a type for ${key}`, () => {
        const result = ApiSchemaValues.readInputType(key);
        assert.strictEqual(result,  expected);
      });
    });
  });

  describe('readTypedValue()', () => {
    [
      [ns.w3.xmlSchema.number, 10, 10],
      [ns.w3.xmlSchema.number, '10', 10],
      [ns.w3.xmlSchema.number, 'test', 0],
      [ns.aml.vocabularies.shapes.number, 'test', 0],
      [ns.w3.xmlSchema.integer, '20', 20],
      [ns.aml.vocabularies.shapes.integer, '20', 20],
      [ns.w3.xmlSchema.float, 30.5, 30.5],
      [ns.aml.vocabularies.shapes.float, 30.5, 30.5],
      [ns.w3.xmlSchema.long, '40.75', 40.75],
      [ns.aml.vocabularies.shapes.long, '40.75', 40.75],
      [ns.w3.xmlSchema.double, '50', 50],
      [ns.aml.vocabularies.shapes.double, '50', 50],
      [ns.w3.xmlSchema.boolean, true, true],
      [ns.w3.xmlSchema.boolean, 'true', true],
      [ns.w3.xmlSchema.boolean, false, false],
      [ns.w3.xmlSchema.boolean, 'false', false],
      [ns.aml.vocabularies.shapes.boolean, 'false', false],
      [ns.w3.xmlSchema.boolean, 'test', false],
      [ns.aml.vocabularies.shapes.nil, 'null', null],
      [ns.w3.xmlSchema.nil, 'null', null],
      ['', null, null],
      ['', undefined, undefined],
      [ns.w3.xmlSchema.string, 'test', 'test'],
    ].forEach(([key, value, expected]) => {
      it(`reads value for ${key}`, () => {
        const result = ApiSchemaValues.readTypedValue(value, String(key));
        assert.strictEqual(result,  expected);
      });
    });
  });

  describe('arrayValuesFromExamples()', () => {
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
    });

    it('returns default value when no argument', () => {
      const result = ApiSchemaValues.arrayValuesFromExamples(undefined);
      assert.deepEqual(result, []);
    });

    it('returns default value when empty argument', () => {
      const result = ApiSchemaValues.arrayValuesFromExamples([]);
      assert.deepEqual(result, []);
    });

    it('returns default value when not an array', async () => {
      const scalar = (loader.getShape(model, 'ScalarWithExample') as IScalarShape);
      const result = ApiSchemaValues.arrayValuesFromExamples(scalar.examples);
      assert.deepEqual(result, []);
    });

    it('processes the structured value', async () => {
      const scalar = (loader.getShape(model, 'StringArrayExample') as IScalarShape);
      const result = ApiSchemaValues.arrayValuesFromExamples(scalar.examples);
      assert.deepEqual(result, ['test', 'other']);
    });

    it('applies data types', async () => {
      const scalar = (loader.getShape(model, 'NumberArrayExample') as IScalarShape);
      const result = ApiSchemaValues.arrayValuesFromExamples(scalar.examples);
      assert.deepEqual(result, [1, 2]);
    });
  });

  describe('inputValueFromExamples()', () => {
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
    });

    it('returns default value when no argument', () => {
      const result = ApiSchemaValues.inputValueFromExamples(undefined);
      assert.strictEqual(result, undefined);
    });

    it('returns default value when empty argument', () => {
      const result = ApiSchemaValues.inputValueFromExamples([]);
      assert.strictEqual(result, undefined);
    });

    it('returns default value when not a scalar', async () => {
      const scalar = (loader.getShape(model, 'StringArrayExample') as IScalarShape);
      const result = ApiSchemaValues.inputValueFromExamples(scalar.examples);
      assert.strictEqual(result, undefined);
    });

    it('processes the structured value', async () => {
      const scalar = (loader.getShape(model, 'ScalarWithExample') as IScalarShape);
      const result = ApiSchemaValues.inputValueFromExamples(scalar.examples);
      assert.strictEqual(result, 'A string');
    });

    it('applies data types', async () => {
      const scalar = (loader.getShape(model, 'ScalarNumberWithExample') as IScalarShape);
      const result = ApiSchemaValues.inputValueFromExamples(scalar.examples);
      assert.strictEqual(result, 24);
    });
  });

  describe('generateDefaultValue()', () => {
    [
      ns.w3.xmlSchema.number,
      ns.aml.vocabularies.shapes.number,
      ns.w3.xmlSchema.integer,
      ns.aml.vocabularies.shapes.integer,
      ns.w3.xmlSchema.float,
      ns.aml.vocabularies.shapes.float,
      ns.w3.xmlSchema.long,
      ns.aml.vocabularies.shapes.long,
      ns.w3.xmlSchema.double,
      ns.aml.vocabularies.shapes.double,
    ].forEach((key) => {
      it(`returns a default type value for ${key}`, () => {
        const shape = scalarShape('');
        shape.dataType = key as string;
        const result = ApiSchemaValues.generateDefaultValue(shape);
        assert.typeOf(result,  'number');
      });
    });

    [
      ns.w3.xmlSchema.boolean,
      ns.aml.vocabularies.shapes.boolean,
    ].forEach((key) => {
      it(`returns a default type value for ${key}`, () => {
        const shape = scalarShape('');
        shape.dataType = key as string;
        const result = ApiSchemaValues.generateDefaultValue(shape);
        assert.typeOf(result,  'boolean');
      });
    });

    it(`returns a random value for ${ns.w3.xmlSchema.date}`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.date;
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    });

    it(`returns a random value for ${ns.w3.xmlSchema.time}`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.time;
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/);
    });

    it(`returns a random value for ${ns.aml.vocabularies.shapes.dateTimeOnly}`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.aml.vocabularies.shapes.dateTimeOnly;
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/);
    });

    it(`returns a random value for ${ns.w3.xmlSchema.dateTime} without format`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/);
    });

    it(`returns a random value for ${ns.w3.xmlSchema.dateTime} with rfc3339 format`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'rfc3339';
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/);
    });

    it(`returns a random value for ${ns.w3.xmlSchema.dateTime} with date-time format`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'date-time';
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/);
    });

    it(`returns a random value for ${ns.w3.xmlSchema.dateTime} with rfc2616 format`, () => {
      const shape = scalarShape('');
      shape.dataType = ns.w3.xmlSchema.dateTime;
      shape.format = 'rfc2616';
      const result = ApiSchemaValues.generateDefaultValue(shape);
      assert.match(result, /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([0-3][0-9]) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]{4}) ([01][0-9]|2[0-3])(:[0-5][0-9]){2} GMT$/);
    });
  });
});
