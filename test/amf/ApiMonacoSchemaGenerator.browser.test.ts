import { assert } from '@esm-bundle/chai';
import { AmfNamespace as ns } from '../../src/amf/definitions/Namespace.js';
import { ApiMonacoSchemaGenerator, IMonacoArrayProperty, IMonacoObjectProperty, IMonacoScalarProperty } from '../../src/amf/ApiMonacoSchemaGenerator.js';
import { AmfLoader } from './AmfLoader.js';
import { AmfDocument } from '../../src/amf/definitions/Amf.js';

describe('ApiMonacoSchemaGenerator', () => {
  const loader = new AmfLoader();

  describe('generate()', () => {
    const parentUri = 'https://domain.com';

    let reader: ApiMonacoSchemaGenerator;
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
      reader = new ApiMonacoSchemaGenerator();
    });

    it('creates a schema for an object', async () => {
      const shape = loader.getShape(model, 'SimpleObject');
      const result = reader.generate(shape, parentUri);

      assert.typeOf(result, 'array', 'result is an array');
      const [object] = result;
      assert.equal(object.uri, shape.id, 'has uri');
      assert.deepEqual(object.fileMatch, [parentUri], 'has fileMatch');
      const schema = (object.schema) as IMonacoObjectProperty;
      assert.typeOf(schema, 'object', 'has schema');
      
      assert.equal(schema.title, 'SimpleObject', 'has schema.title');
      assert.equal(schema.type, 'object', 'has schema.type');
      assert.typeOf(schema.properties, 'object', 'has schema.properties');
      assert.deepEqual(schema.required, [ 'id', 'name', 'sex', 'tosAccepted' ], 'has schema.required');

      const id = (schema.properties.id) as IMonacoScalarProperty;
      assert.typeOf(id.$id, 'string', 'id.$id is set');
      assert.equal(id.type, 'string', 'id.type is set');
      assert.equal(id.title, 'id', 'id.title is set');

      const name = (schema.properties.name) as IMonacoScalarProperty;
      assert.typeOf(name.$id, 'string', 'name.$id is set');
      assert.equal(name.type, 'string', 'name.type is set');
      assert.equal(name.title, 'Name', 'name.title is set');

      const age = (schema.properties.age) as IMonacoScalarProperty;
      assert.typeOf(age.$id, 'string', 'age.$id is set');
      assert.equal(age.type, 'number', 'age.type is set');
      assert.equal(age.title, 'age', 'age.title is set');
      assert.equal(age.description, 'Optional person age.', 'age.description is set');
      assert.equal(age.minimum, 18, 'age.minimum is set');

      const sex = (schema.properties.sex) as IMonacoScalarProperty;
      assert.typeOf(sex.$id, 'string', 'sex.$id is set');
      assert.equal(sex.type, 'string', 'sex.type is set');
      assert.equal(sex.title, 'sex', 'sex.title is set');
      assert.equal(sex.description, 'An example of an enum.', 'sex.description is set');
      assert.deepEqual(sex.enum, ['male', 'female'], 'sex.enum is set');

      const newsletter = (schema.properties.newsletter) as IMonacoScalarProperty;
      assert.typeOf(newsletter.$id, 'string', 'newsletter.$id is set');
      assert.equal(newsletter.type, 'boolean', 'newsletter.type is set');
      assert.equal(newsletter.title, 'newsletter', 'newsletter.title is set');
      assert.equal(newsletter.description, 'Whether the user wants to be added to the newsletter', 'newsletter.description is set');

      const tosAccepted = (schema.properties.tosAccepted) as IMonacoScalarProperty;
      assert.typeOf(tosAccepted.$id, 'string', 'tosAccepted.$id is set');
      assert.equal(tosAccepted.type, 'boolean', 'tosAccepted.type is set');
      assert.equal(tosAccepted.title, 'tosAccepted', 'tosAccepted.title is set');
      assert.equal(tosAccepted.description, 'Whether terms of service is accepted by the user.', 'tosAccepted.description is set');
      assert.equal(tosAccepted.default, 'false', 'tosAccepted.default is set');
    });

    it('creates a schema for an object with a parent', async () => {
      const shape = loader.getShape(model, 'ObjectWithParent');
      const result = reader.generate(shape, parentUri);
      
      assert.typeOf(result, 'array', 'result is an array');
      const [object] = result;
      assert.equal(object.uri, shape.id, 'has uri');
      assert.deepEqual(object.fileMatch, [parentUri], 'has fileMatch');
      const schema = (object.schema) as IMonacoObjectProperty;
      assert.typeOf(schema, 'object', 'has schema');

      assert.equal(schema.title, 'ObjectWithParent', 'has schema.title');
      assert.equal(schema.type, 'object', 'has schema.type');
      assert.typeOf(schema.properties, 'object', 'has schema.properties');
      const required = [ 'addedProperty', 'age', 'id', 'name', 'sex', 'tosAccepted' ];
      schema.required.forEach(r => assert.include(required, r, `required has ${r}`));

      const id = (schema.properties.id);
      const name = (schema.properties.name);
      const sex = (schema.properties.sex);
      const newsletter = (schema.properties.newsletter);
      const tosAccepted = (schema.properties.tosAccepted);
      assert.ok(id, 'has parent id property');
      assert.ok(name, 'has parent name property');
      assert.ok(sex, 'has parent sex property');
      assert.ok(newsletter, 'has parent newsletter property');
      assert.ok(tosAccepted, 'has parent tosAccepted property');

      const addedProperty = (schema.properties.addedProperty) as IMonacoScalarProperty;
      assert.typeOf(addedProperty.$id, 'string', 'addedProperty.$id is set');
      assert.equal(addedProperty.type, 'string', 'addedProperty.type is set');
      assert.equal(addedProperty.title, 'addedProperty', 'addedProperty.title is set');
      assert.equal(addedProperty.format, 'time', 'addedProperty.format is set');

      const age = (schema.properties.age) as IMonacoScalarProperty;
      assert.typeOf(age.$id, 'string', 'age.$id is set');
      assert.equal(age.type, 'number', 'age.type is set');
      assert.equal(age.title, 'age', 'age.title is set');
      assert.equal(age.description, 'Age is not optional anymore.', 'age.description is set');
      assert.equal(age.minimum, 18, 'age.minimum is set');
    });

    it('creates a schema for an object with array values', async () => {
      const shape = loader.getShape(model, 'ObjectWithArray');
      const result = reader.generate(shape, parentUri);
      
      assert.typeOf(result, 'array', 'result is an array');
      const [object] = result;
      assert.equal(object.uri, shape.id, 'has uri');
      assert.deepEqual(object.fileMatch, [parentUri], 'has fileMatch');
      const schema = (object.schema) as IMonacoObjectProperty;
      assert.typeOf(schema, 'object', 'has schema');
      
      const tags = (schema.properties.tags) as IMonacoArrayProperty;
      assert.typeOf(tags.$id, 'string', 'tags.$id is set');
      assert.equal(tags.type, 'array', 'tags.type is set');
      assert.equal(tags.title, 'tags', 'tags.title is set');
      assert.equal(tags.description, 'These are tags', 'tags.description is set');
      assert.deepEqual(tags.required, [], 'tags.required is set');
      assert.isFalse(tags.additionalItems, 'tags.additionalItems is set');
      const { items } = tags;
      assert.equal(items.anyOf[0].type, 'string');
    });
  });

  describe('schemaTypeToJsonDataType()', () => {
    let reader: ApiMonacoSchemaGenerator;

    before(async () => {
      reader = new ApiMonacoSchemaGenerator();
    });

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
      [ns.aml.vocabularies.shapes.boolean, 'boolean'],
      [ns.w3.xmlSchema.boolean, 'boolean'],
      [ns.w3.xmlSchema.date, 'string'],
      [ns.w3.xmlSchema.time, 'string'],
      [ns.w3.xmlSchema.dateTime, 'string'],
      [ns.aml.vocabularies.shapes.dateTimeOnly, 'string'],
      [ns.w3.xmlSchema.string, 'string'],
      [ns.aml.vocabularies.shapes.nil, 'null'],
      [ns.w3.xmlSchema.nil, 'null'],
    ].forEach(([key, expected]) => {
      it(`recognizes a type for ${key}`, () => {
        const result = reader.schemaTypeToJsonDataType(key);
        assert.strictEqual(result,  expected);
      });
    });
  });
});
