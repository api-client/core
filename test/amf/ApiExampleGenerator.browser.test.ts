import { assert } from '@esm-bundle/chai';
import { AmfNamespace as ns } from '../../src/amf/definitions/Namespace.js';
import { ApiExampleGenerator } from '../../src/amf/ApiExampleGenerator.js';
import { AmfLoader } from './AmfLoader.js';
import { AmfDocument } from '../../src/amf/definitions/Amf.js';
import { IAnyShape, IDataExample } from '../../src/amf/definitions/Shapes.js';

describe('ApiExampleGenerator', () => {
  const loader = new AmfLoader();

  const jsonMime = 'application/json';
  const xmlMime = 'application/xml';
  const urlEncodedMime = 'application/x-www-form-urlencoded';

  describe('read()', () => {
    let reader: ApiExampleGenerator;
    let model: AmfDocument;

    before(async () => {
      model = await loader.getGraph('schema-api');
      reader = new ApiExampleGenerator();
    });

    describe(jsonMime, () => {
      it('returns null when no value and no structured value', () => {
        const example: IDataExample = ({
          id: '',
          strict: true,
          types: [ns.aml.vocabularies.document.NamedExamples],
          customDomainProperties: [],
        });
        const result = reader.read(example, jsonMime);
        assert.isUndefined(result);
      });

      it('returns the value when no mime type', () => {
        const example: IDataExample = ({
          id: '',
          strict: true,
          types: [ns.aml.vocabularies.document.NamedExamples],
          value: 'test',
          customDomainProperties: [],
        });
        const result = reader.read(example);
        assert.strictEqual(result, 'test');
      });

      it('returns the value when corresponds to the mime type', () => {
        const example: IDataExample = ({
          id: '',
          strict: true,
          types: [ns.aml.vocabularies.document.NamedExamples],
          value: '[]',
          customDomainProperties: [],
        });
        const result = reader.read(example, jsonMime);
        assert.strictEqual(result, '[]');
      });

      it('reads a number scalar value', () => {
        const shape = (loader.getShape(model, 'ScalarNumberWithExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], jsonMime);
        assert.strictEqual(result, '24');
      });

      it('reads a string array value', async () => {
        const shape = (loader.getShape(model, 'StringArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], jsonMime);
        const parsed = JSON.parse(result);
        assert.deepEqual(parsed, ["test", "other"]);
      });

      it('reads a number array value', async () => {
        const shape = (loader.getShape(model, 'NumberArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], jsonMime);
        const parsed = JSON.parse(result);
        assert.deepEqual(parsed, [1, 2]);
      });

      it('reads a complex value value', async () => {
        const shape = (loader.getShape(model, 'ScalarObjectUnionExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], jsonMime);
        const parsed = JSON.parse(result);
        assert.strictEqual(parsed.name, 'Pawel Uchida-Psztyc', 'has example.name');
        assert.strictEqual(parsed.id, '128a654bc54d898e43f', 'has example.id');
        assert.strictEqual(parsed.age, 30, 'has example.age');
        assert.strictEqual(parsed.sex, 'male', 'has example.sex');
        assert.strictEqual(parsed.newsletter, false, 'has example.newsletter');
        assert.strictEqual(parsed.tosAccepted, true, 'has example.tosAccepted');
      });
    });

    describe(xmlMime, () => {
      it('returns the value when corresponds to the mime type', () => {
        const example: IDataExample = ({
          id: '',
          strict: true,
          types: [ns.aml.vocabularies.document.NamedExamples],
          value: '<feed></feed>',
          customDomainProperties: [],
        });
        const result = reader.read(example, xmlMime);
        assert.strictEqual(result, '<feed></feed>');
      });

      it('reads a number scalar value', async () => {
        const shape = (loader.getShape(model, 'ScalarNumberWithExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], xmlMime, shape);
        assert.strictEqual(result, '<ScalarNumberWithExample>24</ScalarNumberWithExample>');
      });
      
      it('reads a string array value', async () => {
        const shape = (loader.getShape(model, 'StringArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], xmlMime, shape);
        
        const parser = new DOMParser();
        const schema = parser.parseFromString(`<root>${result}</root>`, xmlMime);

        const nodes = schema.querySelectorAll('StringArrayExample');
        assert.lengthOf(nodes, 2, 'has both example values');
        assert.equal(nodes[0].textContent.trim(), 'test', 'has first example value');
        assert.equal(nodes[1].textContent.trim(), 'other', 'has second example value');
      });

      it('reads an object array value', async () => {
        const shape = (loader.getShape(model, 'XmlArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], xmlMime, shape);

        const parser = new DOMParser();
        const schema = parser.parseFromString(result, xmlMime);

        const root = schema.querySelector('XmlArrayExample');
        assert.ok(root, 'has the root node');
        const street = root.querySelector('street');
        const city = root.querySelector('city');
        assert.ok(street, 'has the street node');
        assert.ok(city, 'has the city node');
        assert.equal(street.textContent.trim(), '1234 Market street');
        assert.equal(city.textContent.trim(), 'San Francisco');
      });

      it('reads a number array value', async () => {
        const shape = (loader.getShape(model, 'NumberArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], xmlMime, shape);
        
        const parser = new DOMParser();
        const schema = parser.parseFromString(`<root>${result}</root>`, xmlMime);

        const nodes = schema.querySelectorAll('NumberArrayExample');
        assert.lengthOf(nodes, 2, 'has both example values');
        assert.equal(nodes[0].textContent.trim(), '1', 'has first example value');
        assert.equal(nodes[1].textContent.trim(), '2', 'has second example value');
      });

      it('reads a complex value value', async () => {
        const shape = (loader.getShape(model, 'ScalarObjectUnionExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], xmlMime, shape);
        
        const parser = new DOMParser();
        const schema = parser.parseFromString(result, xmlMime);

        const root = schema.querySelector('ScalarObjectUnionExample');
        assert.ok(root, 'has the root node');
        const name = root.querySelector('name');
        const id = root.querySelector('id');
        const age = root.querySelector('age');
        const sex = root.querySelector('sex');
        const newsletter = root.querySelector('newsletter');
        const tosAccepted = root.querySelector('tosAccepted');
        assert.ok(name, 'has the name node');
        assert.ok(id, 'has the id node');
        assert.ok(age, 'has the age node');
        assert.ok(sex, 'has the sex node');
        assert.ok(newsletter, 'has the newsletter node');
        assert.ok(tosAccepted, 'has the tosAccepted node');
        assert.equal(name.textContent.trim(), 'Pawel Uchida-Psztyc');
        assert.equal(id.textContent.trim(), '128a654bc54d898e43f');
        assert.equal(age.textContent.trim(), '30');
        assert.equal(sex.textContent.trim(), 'male');
        assert.equal(newsletter.textContent.trim(), 'false');
        assert.equal(tosAccepted.textContent.trim(), 'true');
      });
    });

    describe(urlEncodedMime, () => {
      it('returns the value when corresponds to the mime type', () => {
        const example: IDataExample = ({
          id: '',
          strict: true,
          types: [ns.aml.vocabularies.document.NamedExamples],
          value: 'a=b&c=d',
          customDomainProperties: [],
        });
        const result = reader.read(example, urlEncodedMime);
        assert.strictEqual(result, 'a=b&c=d');
      });

      it('reads a number scalar value', async () => {
        const shape = (loader.getShape(model, 'ScalarNumberWithExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], urlEncodedMime, shape);
        assert.strictEqual(result, 'ScalarNumberWithExample=24');
      });
      
      it('reads a string array value', async () => {
        const shape = (loader.getShape(model, 'StringArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], urlEncodedMime, shape);

        assert.strictEqual(result, 'StringArrayExample[]=test&StringArrayExample[]=other');
      });

      it('reads an object array value', async () => {
        const shape = (loader.getShape(model, 'XmlArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], urlEncodedMime, shape);
        
        assert.strictEqual(result, 'street=1234+Market+street&city=San+Francisco');
      });

      it('reads a number array value', async () => {
        const shape = (loader.getShape(model, 'NumberArrayExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], urlEncodedMime, shape);

        assert.strictEqual(result, 'NumberArrayExample[]=1&NumberArrayExample[]=2');
      });

      it('reads a complex value value', async () => {
        const shape = (loader.getShape(model, 'ScalarObjectUnionExample')) as IAnyShape;
        const result = reader.read(shape.examples[0], urlEncodedMime, shape);
        const parsed = new URLSearchParams(result);
        assert.equal(parsed.get('name'), 'Pawel Uchida-Psztyc');
        assert.equal(parsed.get('id'), '128a654bc54d898e43f');
        assert.equal(parsed.get('age'), '30');
        assert.equal(parsed.get('sex'), 'male');
        assert.equal(parsed.get('newsletter'), 'false');
        assert.equal(parsed.get('tosAccepted'), 'true');
      });
    });
  });
});
