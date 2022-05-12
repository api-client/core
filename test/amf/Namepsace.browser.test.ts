import { assert } from '@esm-bundle/chai';
import { AmfNamespace as ns } from '../../src/amf/definitions/Namespace.js';

describe('Namespace', () => {
  describe('AMF keys namespace', () => {
    it('namespace has all keys', () => {
      const keys = Object.keys(ns);
      const compare = ['aml', 'w3'];
      assert.deepEqual(keys, compare);
    });

    it('aml properties are set', () => {
      const r = ns.aml;
      assert.equal(r.key, 'http://a.ml/');
      assert.typeOf(r.vocabularies, 'object');
    });

    it('aml.vocabularies properties are set', () => {
      const v = ns.aml.vocabularies;
      const key = 'http://a.ml/vocabularies/';
      assert.equal(v.key, key, 'key is set');
      assert.typeOf(v.document, 'object', 'document is set');
      assert.equal(v.document.key, `${key}document#`, 'document key is set');
      assert.typeOf(v.core, 'object', 'core is set');
      assert.equal(v.core.key, `${key}core#`, 'core key is set');
      assert.typeOf(v.apiContract, 'object', 'apiContract is set');
      assert.equal(v.apiContract.key, `${key}apiContract#`, 'apiContract.key is set');
      assert.typeOf(v.security, 'object', 'security is set');
      assert.equal(v.security.key, `${key}security#`, 'security.key is set');
      assert.typeOf(v.shapes, 'object', 'shapes is set');
      assert.equal(v.shapes.key, `${key}shapes#`, 'shapes.key is set');
      assert.typeOf(v.data, 'object', 'data is set');
      assert.equal(v.data.key, `${key}data#`, 'data.key is set');
    });

    it('w3 properties are set', () => {
      const r = ns.w3;
      const {key} = r;
      assert.equal(r.key, 'http://www.w3.org/', 'key is set');
      assert.typeOf(r.rdfSyntax, 'object', 'rdfSyntax is set');
      assert.equal(r.rdfSyntax.key, `${key}1999/02/22-rdf-syntax-ns#`, 'rdfSyntax.key is set');
      assert.typeOf(r.rdfSchema, 'object', 'rdfSchema is set');
      assert.equal(r.rdfSchema.key, `${key}2000/01/rdf-schema#`, 'rdfSchema.key is set');
      assert.typeOf(r.xmlSchema, 'object', 'xmlSchema is set');
      assert.equal(r.xmlSchema.key, `${key}2001/XMLSchema#`, 'xmlSchema.key is set');
      assert.typeOf(r.shacl, 'object', 'shacl is set');
      assert.equal(r.shacl.key, `${key}ns/shacl#`, 'shacl.key is set');
    });

    it('shacl properties are set', () => {
      const s = ns.w3.shacl;
      const key = 'http://www.w3.org/ns/shacl#';
      assert.equal(s.key, key, 'key is set');
      [
        'in',
        'defaultValue',
        'defaultValueStr',
        'pattern',
        'minInclusive',
        'maxInclusive',
        'multipleOf',
        'minLength',
        'maxLength',
        'fileType',
        'and',
        'property',
        'name',
        'raw',
        'datatype',
        'minCount',
        'Shape',
        'NodeShape',
        'SchemaShape',
        'PropertyShape',
        'xone',
        'not',
        'or',
      ].forEach((name) => {
        assert.equal(s[name], key + name, `${name  } is set`);
      });
    });
  });

  describe('vocabularies.document namespace', () => {
    const key = 'http://a.ml/vocabularies/document#';
    
    [
      ['Module', `${key}Module`],
      ['Document', `${key}Document`],
      ['SecuritySchemeFragment', `${key}SecuritySchemeFragment`],
      ['UserDocumentation', `${key}UserDocumentation`],
      ['DataType', `${key}DataType`],
      ['NamedExamples', `${key}NamedExamples`],
      ['DomainElement', `${key}DomainElement`],
      ['customDomainProperties', `${key}customDomainProperties`],
      ['encodes', `${key}encodes`],
      ['declares', `${key}declares`],
      ['references', `${key}references`],
      ['examples', `${key}examples`],
      ['linkTarget', `${key}link-target`],
      ['linkLabel', `${key}link-label`],
      ['referenceId', `${key}reference-id`],
      ['structuredValue', `${key}structuredValue`],
      ['raw', `${key}raw`],
      ['extends', `${key}extends`],
      ['value', `${key}value`],
      ['name', `${key}name`],
      ['strict', `${key}strict`],
      ['deprecated', `${key}deprecated`],
      ['location', `${key}location`],
      ['variable', `${key}variable`],
      ['target', `${key}target`],
      ['dataNode', `${key}dataNode`],
      ['root', `${key}root`],
      ['usage', `${key}usage`],
      ['version', `${key}version`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.document[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.security namespace', () => {
    const key = 'http://a.ml/vocabularies/security#';

    [
      ['ParametrizedSecurityScheme', `${key}ParametrizedSecurityScheme`],
      ['SecuritySchemeFragment', `${key}SecuritySchemeFragment`],
      ['SecurityScheme', `${key}SecurityScheme`],
      ['OAuth1Settings', `${key}OAuth1Settings`],
      ['OAuth2Settings', `${key}OAuth2Settings`],
      ['Scope', `${key}Scope`],
      ['Settings', `${key}Settings`],
      ['HttpSettings', `${key}HttpSettings`],
      ['ApiKeySettings', `${key}ApiKeySettings`],
      ['OpenIdConnectSettings', `${key}OpenIdConnectSettings`],
      ['security', `${key}security`],
      ['scheme', `${key}scheme`],
      ['settings', `${key}settings`],
      ['name', `${key}name`],
      ['type', `${key}type`],
      ['scope', `${key}scope`],
      ['accessTokenUri', `${key}accessTokenUri`],
      ['authorizationUri', `${key}authorizationUri`],
      ['authorizationGrant', `${key}authorizationGrant`],
      ['flows', `${key}flows`],
      ['flow', `${key}flow`],
      ['signature', `${key}signature`],
      ['tokenCredentialsUri', `${key}tokenCredentialsUri`],
      ['requestTokenUri', `${key}requestTokenUri`],
      ['refreshUri', `${key}refreshUri`],
      ['securityRequirement', `${key}SecurityRequirement`],
      ['openIdConnectUrl', `${key}openIdConnectUrl`],
      ['bearerFormat', `${key}bearerFormat`],
      ['in', `${key}in`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.security[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.core namespace', () => {
    const key = 'http://a.ml/vocabularies/core#';

    [
      ['CreativeWork', `${key}CreativeWork`],
      ['version', `${key}version`],
      ['urlTemplate', `${key}urlTemplate`],
      ['displayName', `${key}displayName`],
      ['title', `${key}title`],
      ['name', `${key}name`],
      ['description', `${key}description`],
      ['summary', `${key}summary`],
      ['documentation', `${key}documentation`],
      ['version', `${key}version`],
      ['provider', `${key}provider`],
      ['email', `${key}email`],
      ['url', `${key}url`],
      ['termsOfService', `${key}termsOfService`],
      ['license', `${key}license`],
      ['mediaType', `${key}mediaType`],
      ['extensionName', `${key}extensionName`],
      ['deprecated', `${key}deprecated`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.core[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.apiContract namespace', () => {
    const key = 'http://a.ml/vocabularies/apiContract#';

    [
      ['Payload', `${key}Payload`],
      ['Request', `${key}Request`],
      ['Response', `${key}Response`],
      ['EndPoint', `${key}EndPoint`],
      ['Parameter', `${key}Parameter`],
      ['Operation', `${key}Operation`],
      ['WebAPI', `${key}WebAPI`],
      ['AsyncAPI', `${key}AsyncAPI`],
      ['API', `${key}API`],
      ['UserDocumentationFragment', `${key}UserDocumentationFragment`],
      ['Example', `${key}Example`],
      ['Server', `${key}Server`],
      ['ParametrizedResourceType', `${key}ParametrizedResourceType`],
      ['ParametrizedTrait', `${key}ParametrizedTrait`],
      ['TemplatedLink', `${key}TemplatedLink`],
      ['IriTemplateMapping', `${key}IriTemplateMapping`],
      ['Tag', `${key}Tag`],
      ['Callback', `${key}Callback`],
      ['header', `${key}header`],
      ['parameter', `${key}parameter`],
      ['paramName', `${key}paramName`],
      ['uriParameter', `${key}uriParameter`],
      ['cookieParameter', `${key}cookieParameter`],
      ['variable', `${key}variable`],
      ['payload', `${key}payload`],
      ['path', `${key}path`],
      ['url', `${key}url`],
      ['scheme', `${key}scheme`],
      ['endpoint', `${key}endpoint`],
      ['queryString', `${key}queryString`],
      // ['mediaType', key + 'mediaType'],
      ['accepts', `${key}accepts`],
      ['guiSummary', `${key}guiSummary`],
      ['binding', `${key}binding`],
      ['response', `${key}response`],
      ['returns', `${key}returns`],
      ['expects', `${key}expects`],
      ['examples', `${key}examples`],
      ['supportedOperation', `${key}supportedOperation`],
      ['statusCode', `${key}statusCode`],
      ['method', `${key}method`],
      ['required', `${key}required`],
      ['callback', `${key}callback`],
      ['expression', `${key}expression`],
      ['link', `${key}link`],
      ['linkExpression', `${key}linkExpression`],
      ['templateVariable', `${key}templateVariable`],
      ['mapping', `${key}mapping`],
      ['operationId', `${key}operationId`],
      ['protocol', `${key}protocol`],
      ['protocolVersion', `${key}protocolVersion`],
      ['Message', `${key}Message`],
      ['contentType', `${key}contentType`],
      ['allowEmptyValue', `${key}allowEmptyValue`],
      ['style', `${key}style`],
      ['explode', `${key}explode`],
      ['allowReserved', `${key}allowReserved`],
      ['tag', `${key}tag`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.apiContract[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.shapes namespace', () => {
    const key = 'http://a.ml/vocabularies/shapes#';

    [
      ['ScalarShape', `${key}ScalarShape`],
      ['ArrayShape', `${key}ArrayShape`],
      ['UnionShape', `${key}UnionShape`],
      ['NilShape', `${key}NilShape`],
      ['FileShape', `${key}FileShape`],
      ['AnyShape', `${key}AnyShape`],
      ['SchemaShape', `${key}SchemaShape`],
      ['MatrixShape', `${key}MatrixShape`],
      ['TupleShape', `${key}TupleShape`],
      ['DataTypeFragment', `${key}DataTypeFragment`],
      ['RecursiveShape', `${key}RecursiveShape`],
      ['XMLSerializer', `${key}XMLSerializer`],
      ['range', `${key}range`],
      ['items', `${key}items`],
      ['anyOf', `${key}anyOf`],
      ['fileType', `${key}fileType`],
      ['number', `${key}number`],
      ['integer', `${key}integer`],
      ['long', `${key}long`],
      ['double', `${key}double`],
      ['boolean', `${key}boolean`],
      ['float', `${key}float`],
      ['nil', `${key}nil`],
      ['dateTimeOnly', `${key}dateTimeOnly`],
      ['password', `${key}password`],
      ['schema', `${key}schema`],
      ['xmlSerialization', `${key}xmlSerialization`],
      ['xmlName', `${key}xmlName`],
      ['xmlAttribute', `${key}xmlAttribute`],
      ['xmlWrapped', `${key}xmlWrapped`],
      ['xmlNamespace', `${key}xmlNamespace`],
      ['xmlPrefix', `${key}xmlPrefix`],
      ['readOnly', `${key}readOnly`],
      ['writeOnly', `${key}writeOnly`],
      ['deprecated', `${key}deprecated`],
      ['fixPoint', `${key}fixPoint`],
      ['discriminator', `${key}discriminator`],
      ['discriminatorValue', `${key}discriminatorValue`],
      ['format', `${key}format`],
      ['multipleOf', `${key}multipleOf`],
      ['uniqueItems', `${key}uniqueItems`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.shapes[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.data namespace', () => {
    const key = 'http://a.ml/vocabularies/data#';

    [
      ['Scalar', `${key}Scalar`],
      ['Object', `${key}Object`],
      ['Array', `${key}Array`],
      ['value', `${key}value`],
      ['description', `${key}description`],
      ['required', `${key}required`],
      ['displayName', `${key}displayName`],
      ['minLength', `${key}minLength`],
      ['maxLength', `${key}maxLength`],
      ['default', `${key}default`],
      ['multipleOf', `${key}multipleOf`],
      ['minimum', `${key}minimum`],
      ['maximum', `${key}maximum`],
      ['enum', `${key}enum`],
      ['pattern', `${key}pattern`],
      ['items', `${key}items`],
      ['format', `${key}format`],
      ['example', `${key}example`],
      ['examples', `${key}examples`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.data[property];
        assert.equal(result, value);
      });
    });
  });

  describe('vocabularies.docSourceMaps namespace', () => {
    const key = 'http://a.ml/vocabularies/document-source-maps#';

    [
      ['SourceMap', `${key}SourceMap`],
      ['sources', `${key}sources`],
      ['element', `${key}element`],
      ['value', `${key}value`],
      ['declaredElement', `${key}declared-element`],
      ['trackedElement', `${key}tracked-element`],
      ['parsedJsonSchema', `${key}parsed-json-schema`],
      ['autoGeneratedName', `${key}auto-generated-name`],
      ['lexical', `${key}lexical`],
      ['synthesizedField', `${key}synthesized-field`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.aml.vocabularies.docSourceMaps[property];
        assert.equal(result, value);
      });
    });
  });

  describe('w3.shacl namespace', () => {
    const key = 'http://www.w3.org/ns/shacl#';

    [
      ['Shape', `${key}Shape`],
      ['NodeShape', `${key}NodeShape`],
      ['SchemaShape', `${key}SchemaShape`],
      ['PropertyShape', `${key}PropertyShape`],
      ['in', `${key}in`],
      ['defaultValue', `${key}defaultValue`],
      ['defaultValueStr', `${key}defaultValueStr`],
      ['pattern', `${key}pattern`],
      ['minInclusive', `${key}minInclusive`],
      ['maxInclusive', `${key}maxInclusive`],
      ['multipleOf', `${key}multipleOf`],
      ['minLength', `${key}minLength`],
      ['maxLength', `${key}maxLength`],
      ['fileType', `${key}fileType`],
      ['and', `${key}and`],
      ['property', `${key}property`],
      ['name', `${key}name`],
      ['raw', `${key}raw`],
      ['datatype', `${key}datatype`],
      ['minCount', `${key}minCount`],
      ['maxCount', `${key}maxCount`],
      ['xone', `${key}xone`],
      ['not', `${key}not`],
      ['or', `${key}or`],
      ['closed', `${key}closed`],
      ['path', `${key}path`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.w3.shacl[property];
        assert.equal(result, value);
      });
    });
  });

  describe('w3.xmlSchema namespace', () => {
    const key = 'http://www.w3.org/2001/XMLSchema#';

    [
      ['boolean', `${key}boolean`],
      ['string', `${key}string`],
      ['number', `${key}number`],
      ['integer', `${key}integer`],
      ['long', `${key}long`],
      ['double', `${key}double`],
      ['float', `${key}float`],
      ['nil', `${key}nil`],
      ['dateTime', `${key}dateTime`],
      ['time', `${key}time`],
      ['date', `${key}date`],
      ['base64Binary', `${key}base64Binary`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.w3.xmlSchema[property];
        assert.equal(result, value);
      });
    });
  });

  describe('w3.rdfSyntax namespace', () => {
    const key = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

    [
      ['member', `${key}member`],
      ['Seq', `${key}Seq`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.w3.rdfSyntax[property];
        assert.equal(result, value);
      });
    });
  });

  describe('w3.rdfSchema namespace', () => {
    const key = 'http://www.w3.org/2000/01/rdf-schema#';

    [
      ['member', `${key}member`],
      ['Seq', `${key}Seq`],
    ].forEach(([property, value]) => {
      it(`has value for ${property}`, () => {
        const result = ns.w3.rdfSchema[property];
        assert.equal(result, value);
      });
    });
  });
});
