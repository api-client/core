import { AmfMixin, expandKey, findAmfType, getArrayItems } from "./AmfMixin.js";
import { AnyShape, Api, ArrayNode, ArrayShape, AsyncApi, CreativeWork, DataArrangeShape, DataNode, DocumentSourceMaps, DomainElement, EndPoint, Example, FileShape, License, NodeShape, ObjectNode, Operation, Organization, Parameter, PropertyShape, RecursiveShape, ScalarNode, ScalarShape, SchemaShape, SecurityRequirement, Server, Shape, SynthesizedField, TupleShape, UnionShape, WebApi, XMLSerializer, Payload, Tag, Callback, Request, Response, TemplatedLink, IriTemplateMapping, ParametrizedSecurityScheme, SecurityScheme, Settings, OAuth1Settings, OAuth2Settings, ApiKeySettings, HttpSettings, OpenIdConnectSettings, OAuth2Flow, Scope, ParametrizedDeclaration, ParametrizedTrait, ParametrizedResourceType, VariableValue, AbstractDeclaration } from "./definitions/Amf.js";
import { ApiAbstractDeclaration, ApiAsync, ApiBase, ApiCallback, ApiDocumentation, ApiDocumentSourceMaps, ApiEndPoint, ApiEndPointWithOperationsListItem, ApiIriTemplateMapping, ApiLicense, ApiOperation, ApiOperationListItem, ApiOrganization, ApiParameter, ApiParametrizedDeclaration, ApiParametrizedResourceType, ApiParametrizedSecurityScheme, ApiParametrizedTrait, ApiPayload, ApiRequest, ApiResponse, ApiSecurityApiKeySettings, ApiSecurityHttpSettings, ApiSecurityOAuth1Settings, ApiSecurityOAuth2Flow, ApiSecurityOAuth2Settings, ApiSecurityOpenIdConnectSettings, ApiSecurityRequirement, ApiSecurityScheme, ApiSecuritySchemeListItem, ApiSecurityScope, ApiSecuritySettings, ApiSecuritySettingsUnion, ApiServer, ApiSummary, ApiSynthesizedField, ApiTag, ApiTemplatedLink, ApiVariableValue, ApiWeb, ShapeProcessingOptions } from "./definitions/Api.js";
import { ICustomDomainProperty } from "./definitions/Base.js";
import { AmfNamespace as ns } from './definitions/Namespace.js';
import { IAnyShape, IArrayNode, IArrayShape, IDataArrangeShape, IDataExample, IDataNode, IDataNodeUnion, IFileShape, INodeShape, IObjectNode, IPropertyShape, IRecursiveShape, IScalarNode, IScalarShape, ISchemaShape, IShape, IShapeUnion, ITupleShape, IUnionShape, IXmlSerializer } from "./definitions/Shapes.js";

/**
 * A class that takes AMF's ld+json model and outputs JavaScript interface of it.
 */
export class AmfSerializer extends AmfMixin(Object) {
  /**
   * @param graph Optional AMF generated graph model.
   */
  constructor(graph?: DomainElement) {
    super();
    if (graph) {
      this.amf = graph;
    }
  }

  /**
   * @param types The list of graph object types. When not defined it returns an empty array.
   * @returns The expanded types.
   */
  readTypes(types: string[], context?: Record<string, string>): string[] {
    let target = types;
    if (typeof target === 'string') {
      target = [target];
    }
    if (!Array.isArray(target)) {
      return [];
    }
    return target.map((type) => this[expandKey](type, context));
  }

  /**
   * @param object The API to serialize.
   * @returns API summary, without complex objects.
   */
  apiSummary(object: Api): ApiSummary {
    const context = object['@context'];
    const result: ApiSummary = {
      id: object['@id'],
      types: this.readTypes(object['@type'], context),
      customDomainProperties: this.customDomainProperties(object, context),
      sourceMaps: this.sourceMap(object),
      schemes: [],
      accepts: [],
      contentType: [],
      documentations: [],
      tags: [],
    };
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, context);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, context);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const version = this._getValue(object, ns.aml.vocabularies.core.version, context);
    if (version && typeof version === 'string') {
      result.version = version;
    }
    const termsOfService = this._getValue(object, ns.aml.vocabularies.core.termsOfService, context);
    if (termsOfService && typeof termsOfService === 'string') {
      result.termsOfService = termsOfService;
    }
    const accepts = object[this._getAmfKey(ns.aml.vocabularies.apiContract.accepts, context) as keyof Api] as any;
    if (Array.isArray(accepts) && accepts.length) {
      result.accepts = this._getValueArray(object, ns.aml.vocabularies.apiContract.accepts, context) as string[];
    }
    const contentType = object[this._getAmfKey(ns.aml.vocabularies.apiContract.contentType, context) as keyof Api];
    if (Array.isArray(contentType) && contentType.length) {
      result.contentType = this._getValueArray(object, ns.aml.vocabularies.apiContract.contentType, context) as string[];
    }
    const schemes = object[this._getAmfKey(ns.aml.vocabularies.apiContract.scheme, context) as keyof Api];
    if (Array.isArray(schemes) && schemes.length) {
      result.schemes = this._getValueArray(object, ns.aml.vocabularies.apiContract.scheme, context) as string[];
    }
    let provider = object[this._getAmfKey(ns.aml.vocabularies.core.provider, context) as keyof Api] as Organization[] | Organization;
    if (Array.isArray(provider)) {
      [provider] = provider;
    }
    if (provider) {
      result.provider = this.provider(provider);
    }
    let license = object[this._getAmfKey(ns.aml.vocabularies.core.license, context) as keyof Api] as License | License[];
    if (Array.isArray(license)) {
      [license] = license;
    }
    if (license) {
      result.license = this.license(license);
    }
    const tags = object[this._getAmfKey(ns.aml.vocabularies.apiContract.tag, context) as keyof Api] as Tag[] | undefined;
    if (Array.isArray(tags) && tags.length) {
      result.tags = tags.map(t => this.tag(t));
    }
    const docs = object[this._getAmfKey(ns.aml.vocabularies.core.documentation, context) as keyof Api] as CreativeWork[] | undefined;
    if (Array.isArray(docs) && docs.length) {
      result.documentations = docs.map(d => this.documentation(d));
    }
    return result;
  }

  api(object: Api, context?: Record<string, string>): ApiBase {
    const objectContext = context || object['@context'];
    const result = this.apiSummary(object) as ApiBase;
    result.endPoints = [];
    result.servers = [];
    result.security = [];
    
    const endPoints = object[this._getAmfKey(ns.aml.vocabularies.apiContract.endpoint, objectContext) as keyof Api] as EndPoint[] | undefined;
    if (Array.isArray(endPoints) && endPoints.length) {
      result.endPoints = endPoints.map(e => this.endPoint(e, objectContext));
    }
    const servers = object[this._getAmfKey(ns.aml.vocabularies.apiContract.server, objectContext) as keyof Api] as Server | Server[] | undefined;
    if (Array.isArray(servers) && servers.length) {
      result.servers = servers.map(s => this.server(s, objectContext));
    }
    const security = object[this._getAmfKey(ns.aml.vocabularies.security.security, objectContext) as keyof Api] as SecurityRequirement[] | undefined;
    if (Array.isArray(security) && security.length) {
      result.security = security.map(s => this.securityRequirement(s, objectContext));
    }
    return result;
  }

  webApi(object: WebApi, context?: Record<string, string>): ApiWeb {
    return this.api(object, context);
  }
  
  asyncApi(object: AsyncApi, context?: Record<string, string>): ApiAsync {
    return this.api(object, context);
  }

  provider(object: Organization, context?: Record<string, string>): ApiOrganization {
    const objectContext = context || object['@context'];
    const result: ApiOrganization = {
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    };
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const url = this._getLinkValue(object, ns.aml.vocabularies.core.url, objectContext);
    if (url && typeof url === 'string') {
      result.url = url;
    }
    const email = this._getValue(object, ns.aml.vocabularies.core.email, objectContext);
    if (email && typeof email === 'string') {
      result.email = email;
    }
    return result;
  }

  license(object: License, context?: Record<string, string>): ApiLicense {
    const objectContext = context || object['@context'];
    const result: ApiLicense = {
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    };
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const url = this._getLinkValue(object, ns.aml.vocabularies.core.url, objectContext);
    if (url && typeof url === 'string') {
      result.url = url;
    }
    return result;
  }

  /**
   * @param object The AMF Server to serialize.
   * @returns Serialized Server
   */
  server(object: Server, context?: Record<string, string>): ApiServer {
    const objectContext = context || object['@context'];
    
    const url = this._getValue(object, ns.aml.vocabularies.core.urlTemplate, objectContext) as string || '';
    const result: ApiServer = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      url,
      variables: [],
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const variables = (object[this._getAmfKey(ns.aml.vocabularies.apiContract.variable, objectContext) as keyof Server]) as Parameter[];
    if (Array.isArray(variables) && variables.length) {
      result.variables = variables.map((p) => this.parameter(p, objectContext));
    }
    const protocol = (this._getValue(object, ns.aml.vocabularies.apiContract.protocol, objectContext)) as string;
    const protocolVersion = (this._getValue(object, ns.aml.vocabularies.apiContract.protocolVersion, objectContext)) as string;
    if (protocol) {
      result.protocol = protocol;
    }
    if (protocolVersion) {
      result.protocolVersion = protocolVersion;
    }
    const security = (object[this._getAmfKey(ns.aml.vocabularies.security.security, objectContext) as keyof Server]) as SecurityRequirement[];
    if (Array.isArray(security) && security.length) {
      result.security = security.map((p) => this.securityRequirement(p, objectContext));
    }
    return result;
  }

  /**
   * @param object The Parameter to serialize.
   * @returns Serialized Parameter
   */
  parameter(object: Parameter, context?: Record<string, string>): ApiParameter {
    const objectContext = context || object['@context'];
    const result: ApiParameter = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      payloads: [],
      examples: [],
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const paramName = this._getValue(object, ns.aml.vocabularies.apiContract.paramName, objectContext);
    if (paramName && typeof paramName === 'string') {
      result.paramName = paramName;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const required = this._getValue(object, ns.aml.vocabularies.apiContract.required, objectContext);
    if (typeof required === 'boolean') {
      result.required = required;
    }
    const allowEmptyValue = this._getValue(object, ns.aml.vocabularies.apiContract.allowEmptyValue, objectContext);
    if (typeof allowEmptyValue === 'boolean') {
      result.allowEmptyValue = allowEmptyValue;
    }
    const deprecated = this._getValue(object, ns.aml.vocabularies.document.deprecated, objectContext);
    if (typeof deprecated === 'boolean') {
      result.deprecated = deprecated;
    }
    const explode = this._getValue(object, ns.aml.vocabularies.apiContract.explode, objectContext);
    if (typeof explode === 'boolean') {
      result.explode = explode;
    }
    const allowReserved = this._getValue(object, ns.aml.vocabularies.apiContract.allowReserved, objectContext);
    if (typeof allowReserved === 'boolean') {
      result.allowReserved = allowReserved;
    }
    const style = this._getValue(object, ns.aml.vocabularies.apiContract.style, objectContext);
    if (style && typeof style === 'string') {
      result.style = style;
    }
    const binding = this._getValue(object, ns.aml.vocabularies.apiContract.binding, objectContext);
    if (binding && typeof binding === 'string') {
      result.binding = binding;
    }
    const schemas = object[this._getAmfKey(ns.aml.vocabularies.shapes.schema, objectContext) as keyof Parameter] as Shape[];
    if (Array.isArray(schemas) && schemas.length) {
      const [schema] = schemas;
      result.schema = this.unknownShape(schema, {
        trackedId: object['@id'],
      }, objectContext);
    }
    const payloads = object[this._getAmfKey(ns.aml.vocabularies.apiContract.payload, objectContext) as keyof Parameter] as Payload[];
    if (Array.isArray(payloads) && payloads.length) {
      result.payloads = payloads.map(p => this.payload(p, objectContext));
    }
    const examples = object[this._getAmfKey(ns.aml.vocabularies.apiContract.examples, objectContext) as keyof Parameter] as Parameter[];
    if (Array.isArray(examples) && examples.length) {
      result.examples = examples.map(e => this.example(e, objectContext));
    }
    return result;
  }

  unknownShape(object: Shape, options?: ShapeProcessingOptions, context?: Record<string, string>): IShapeUnion {
    const objectContext = context || object['@context'];
    const types = this.readTypes(object['@type'], objectContext);
    
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return this.scalarShape(object as ScalarShape, options, objectContext);
    }
    if (types.includes(ns.w3.shacl.NodeShape)) {
      return this.nodeShape(object as NodeShape, options, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
      return this.unionShape((object as UnionShape), options, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.shapes.FileShape)) {
      return this.fileShape((object as FileShape), options, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.shapes.SchemaShape)) {
      return this.schemaShape((object as SchemaShape), options, objectContext);
    }
    // this must be before the ArrayShape
    if (types.includes(ns.aml.vocabularies.shapes.TupleShape)) {
      return this.tupleShape((object as TupleShape), options, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return this.arrayShape((object as ArrayShape), options, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.shapes.RecursiveShape)) {
      return this.recursiveShape((object as RecursiveShape), objectContext);
    }
    // recursiveShape
    return this.anyShape((object as AnyShape), options, objectContext);
  }

  isLink(object: DomainElement, context?: Record<string, string>): boolean {
    const objectContext = context || object['@context'];
    return !!this._getLinkValue(object, ns.aml.vocabularies.document.linkTarget, objectContext);
  }

  getLinkTarget<T extends DomainElement>(object: T, context?: Record<string, string>): T | undefined {
    const objectContext = context || object['@context'];
    const id = this._getLinkValue(object, ns.aml.vocabularies.document.linkTarget, objectContext);
    if (!id) {
      return undefined;
    }
    return this[findAmfType](id, objectContext) as T | undefined;
  }

  shape(object: Shape, context?: Record<string, string>): IShape {
    const objectContext = context || object['@context'];
    this._resolve(object);
    let linkLabel: string | undefined;
    let target = object;
    if (this.isLink(target)) {
      linkLabel = (this._getValue(target, ns.aml.vocabularies.document.linkLabel, objectContext)) as string;
      const id = this._getLinkValue(target, ns.aml.vocabularies.document.linkTarget, objectContext);
      const value = this[findAmfType](id, objectContext) as Shape | undefined;
      if (value) {
        target = value;
      }
    }
    const result: IShape = ({
      id: target['@id'],
      types: this.readTypes(object['@type'], objectContext),
      values: [],
      inherits: [],
      or: [],
      and: [],
      xone: [],
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    if (linkLabel) {
      result.linkLabel = linkLabel;
    }
    
    const name = this._getValue(target, ns.w3.shacl.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const displayName = this._getValue(target, ns.aml.vocabularies.core.displayName, objectContext);
    if (displayName && typeof displayName === 'string') {
      result.displayName = displayName;
    } else {
      const coreName = this._getValue(target, ns.aml.vocabularies.core.name, objectContext);
      if (coreName && typeof coreName === 'string') {
        result.displayName = coreName;
      }
    }
    const description = this._getValue(target, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const defaultValueStr = this._getValue(target, ns.w3.shacl.defaultValueStr, objectContext);
    if (defaultValueStr && typeof defaultValueStr === 'string') {
      result.defaultValueStr = defaultValueStr;
    }
    const deprecated = this._getValue(target, ns.aml.vocabularies.shapes.deprecated, objectContext);
    if (typeof deprecated === 'boolean') {
      result.deprecated = deprecated;
    }
    const readOnly = this._getValue(target, ns.aml.vocabularies.shapes.readOnly, objectContext);
    if (typeof readOnly === 'boolean') {
      result.readOnly = readOnly;
    }
    const writeOnly = this._getValue(target, ns.aml.vocabularies.shapes.writeOnly, objectContext);
    if (typeof writeOnly === 'boolean') {
      result.writeOnly = writeOnly;
    }
    const defValue = target[this._getAmfKey(ns.w3.shacl.defaultValue, objectContext) as keyof Shape];
    if (Array.isArray(defValue) && defValue.length) {
      result.defaultValue = this.unknownDataNode(defValue[0] as any, objectContext);
    }
    // @TODO:
    // if (Array.isArray(inherits) && inherits.length) {
    //   result.inherits = inherits.map((item) => this.unknownShape(item));
    // }
    const orKey = this._getAmfKey(ns.w3.shacl.or, objectContext) as keyof Shape;
    const orGroup = (target[orKey]) as Shape[];
    if (Array.isArray(orGroup) && orGroup.length) {
      result.or = orGroup.map((item) => this.unknownShape(item, undefined, objectContext));
    }
    const andKey = this._getAmfKey(ns.w3.shacl.and, objectContext) as keyof Shape;
    const andGroup = (target[andKey]) as Shape[];
    if (Array.isArray(andGroup) && andGroup.length) {
      result.and = andGroup.map((item) => this.unknownShape(item, undefined, objectContext));
    }
    const xoneKey = this._getAmfKey(ns.w3.shacl.xone, objectContext) as keyof Shape;
    const xone = (target[xoneKey]) as Shape[];
    if (Array.isArray(xone) && xone.length) {
      result.xone = xone.map((item) => this.unknownShape(item, undefined, objectContext));
    }
    
    const valuesList = target[this._getAmfKey(ns.w3.shacl.in, objectContext) as keyof Shape];
    if (Array.isArray(valuesList) && valuesList.length) {
      const [values] = valuesList;
      const prefix = ns.w3.rdfSchema.key;
      const prefixCompact = this._getAmfKey(prefix, objectContext) as string;
      Object.keys(values).forEach((key) => {
        if (key.startsWith(prefix) || key.startsWith(prefixCompact)) {
          let value = (values as any)[key];
          if (Array.isArray(value)) {
            [value] = value;
          }
          const processed = this.unknownDataNode(value, objectContext);
          if (processed) {
            result.values.push(processed);
          }
        }
      });
    }
    const notKey = this._getAmfKey(ns.w3.shacl.not, objectContext) as keyof Shape;
    let not = target[notKey] as Shape | undefined;
    if (not) {
      if (Array.isArray(not)) {
        [not] = not;
      }
      result.not = this.unknownShape(not!, undefined, objectContext);
    }
    return result;
  }

  anyShape(object: AnyShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IAnyShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.shape(target, objectContext)) as IAnyShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext)) as Shape | undefined;
      if (value) {
        target = value;
      }
    }
    result.examples = [];
    const examples = target[this._getAmfKey(ns.aml.vocabularies.apiContract.examples, objectContext) as keyof AnyShape] as Example[];
    
    if (Array.isArray(examples) && examples.length) {
      if (options.trackedId) {
        const filtered = this.filterTrackedExamples(examples, options.trackedId, objectContext);
        result.examples = filtered.map((item) => this.example(item, objectContext));
      } else {
        const filtered = this.filterNonTrackedExamples(examples, objectContext);
        result.examples = filtered.map((item) => this.example(item, objectContext));
      }
    }
    const docs = target[this._getAmfKey(ns.aml.vocabularies.core.documentation, objectContext) as keyof AnyShape] as CreativeWork[] | undefined;
    if (Array.isArray(docs) && docs.length) {
      const [documentation] = docs;
      result.documentation = this.documentation(documentation, objectContext);
    }
    const xml = target[this._getAmfKey(ns.aml.vocabularies.shapes.xmlSerialization, objectContext) as keyof AnyShape] as XMLSerializer[] | undefined;
    if (Array.isArray(xml) && xml.length) {
      result.xmlSerialization = this.xmlSerializer(xml[0] as XMLSerializer, objectContext);
    }
    return result;
  }

  /**
   * Filters examples that should be rendered for a payload identified by `trackedId`.
   * 
   * This function is copied from old `api-example-generator/ExampleGenerator`.
   */
  filterTrackedExamples(examples: Example[], trackedId: string, context?: Record<string, string>): Example[] {
    const { docSourceMaps } = ns.aml.vocabularies;
    const sourceKey = this._getAmfKey(docSourceMaps.sources, context) as keyof Example;
    const trackedKey = this._getAmfKey(docSourceMaps.trackedElement, context) as keyof DocumentSourceMaps;
    const longId = trackedId.indexOf('amf') === -1 ? `amf://id${trackedId}` : trackedId;
    return examples.filter((item) => {
      let example = item;
      if (Array.isArray(example)) {
        [example] = example;
      }
      let sm = example[sourceKey] as DocumentSourceMaps[] | DocumentSourceMaps | undefined;
      if (!sm) {
        return true
      }
      if (Array.isArray(sm)) {
        [sm] = sm;
      }
      let tracked = sm[trackedKey] as SynthesizedField[] | SynthesizedField | undefined;
      if (!tracked) {
        return true;
      }
      if (Array.isArray(tracked)) {
        [tracked] = tracked;
      }
      const { value } = this.synthesizedField(tracked, context);
      if (!value) {
        return true;
      }
      const ids = value.split(',');
      if (ids.indexOf(longId) !== -1 || ids.indexOf(trackedId) !== -1) {
        return true;
      }
      return false;
    });
  }

  /**
   * Kind of the opposite of the `filterTrackedExamples`. It gathers examples that only have been 
   * defined for the parent Shape (ed in the type declaration). It filters out all examples
   * defined in a payload.
   */
  filterNonTrackedExamples(examples: Example[], context?: Record<string, string>): Example[] {
    const { docSourceMaps } = ns.aml.vocabularies;
    const sourceKey = this._getAmfKey(docSourceMaps.sources, context) as keyof Example;
    const trackedKey = this._getAmfKey(docSourceMaps.trackedElement, context) as keyof DocumentSourceMaps;
    return examples.filter((item) => {
      let example = item;
      if (Array.isArray(example)) {
        [example] = example;
      }
      let sm = example[sourceKey] as DocumentSourceMaps[] | DocumentSourceMaps | undefined;
      if (!sm) {
        return true
      }
      if (Array.isArray(sm)) {
        [sm] = sm;
      }
      let tracked = sm[trackedKey] as SynthesizedField[] | SynthesizedField | undefined;
      if (!tracked) {
        return true;
      }
      if (Array.isArray(tracked)) {
        [tracked] = tracked;
      }
      const { value } = this.synthesizedField(tracked, context);
      if (!value) {
        return true;
      }
      return false;
    });
  }

  scalarShape(object: ScalarShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IScalarShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.anyShape(target, options, objectContext)) as IScalarShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext)) as ScalarShape | undefined;
      if (value) {
        target = value;
      }
    }
    
    const pattern = this._getValue(target, ns.w3.shacl.pattern, objectContext);
    if (pattern && typeof pattern === 'string') {
      result.pattern = pattern;
    }
    const dataType = this._getLinkValue(target, ns.w3.shacl.datatype, objectContext);
    if (dataType && typeof dataType === 'string') {
      result.dataType = dataType;
    }
    const format = this._getValue(target, ns.aml.vocabularies.shapes.format, objectContext);
    if (format && typeof format === 'string') {
      result.format = format;
    }
    const multipleOf = this._getValue(target, ns.aml.vocabularies.shapes.multipleOf, objectContext);
    if (typeof multipleOf === 'number') {
      result.multipleOf = multipleOf;
    }
    const minInclusive = this._getValue(target, ns.w3.shacl.minInclusive, objectContext);
    if (typeof minInclusive === 'number') {
      result.minimum = minInclusive;
      result.exclusiveMinimum = false;
    }
    const maxInclusive = this._getValue(target, ns.w3.shacl.maxInclusive, objectContext);
    if (typeof maxInclusive === 'number') {
      result.maximum = maxInclusive;
      result.exclusiveMaximum = false;
    }
    const minLength = this._getValue(target, ns.w3.shacl.minLength, objectContext);
    if (typeof minLength === 'number') {
      result.minLength = minLength;
    }
    const maxLength = this._getValue(target, ns.w3.shacl.maxLength, objectContext);
    if (typeof maxLength === 'number') {
      result.maxLength = maxLength;
    }
    return result;
  }

  nodeShape(object: NodeShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): INodeShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.anyShape(target, options, objectContext)) as INodeShape;
    if (this.isLink(target)) {
      const value = this.getLinkTarget(target, objectContext);
      if (value) {
        target = value;
      }
    }
    
    const discriminator = this._getValue(target, ns.aml.vocabularies.shapes.discriminator, objectContext);
    if (discriminator && typeof discriminator === 'string') {
      result.discriminator = discriminator;
    }
    const discriminatorValue = this._getValue(target, ns.aml.vocabularies.shapes.discriminatorValue, objectContext);
    if (discriminatorValue && typeof discriminatorValue === 'string') {
      result.discriminatorValue = discriminatorValue;
    }
    const closed = this._getValue(target, ns.w3.shacl.closed, objectContext);
    if (typeof closed === 'boolean') {
      result.closed = closed;
    }

    result.customShapeProperties = [];
    result.customShapePropertyDefinitions = [];
    result.dependencies = [];
    // todo: not sure what the keys are.
    // if (!minProperties.isNull) {
    //   result.minProperties = minProperties.value();
    // }
    // if (!maxProperties.isNull) {
    //   result.maxProperties = maxProperties.value();
    // }
    // if (Array.isArray(customShapeProperties) && customShapeProperties.length) {
    //   result.customShapeProperties = customShapeProperties.map((item) => item.id);
    // } else {
    //   result.customShapeProperties = [];
    // }
    // if (Array.isArray(customShapePropertyDefinitions) && customShapePropertyDefinitions.length) {
    //   result.customShapePropertyDefinitions = customShapePropertyDefinitions.map((item) => item.id);
    // } else {
    //   result.customShapePropertyDefinitions = [];
    // }
    const properties = (target[this._getAmfKey(ns.w3.shacl.property, objectContext) as keyof NodeShape]) as PropertyShape[];
    if (Array.isArray(properties) && properties.length) {
      result.properties = properties.map((item) => this.propertyShape(item, objectContext));
    } else {
      result.properties = [];
    }
    // if (Array.isArray(dependencies) && dependencies.length) {
    //   result.dependencies = dependencies.map((item) => item.id);
    // } else {
    //   result.dependencies = [];
    // }
    return result;
  }


  propertyShape(object: PropertyShape, context?: Record<string, string>): IPropertyShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.shape(target, objectContext)) as IPropertyShape;
    if (this.isLink(target)) {
      const value = this.getLinkTarget(target, objectContext);
      if (value) {
        target = value;
      }
    }
    
    const path = this._getLinkValue(target, ns.w3.shacl.path, objectContext);
    if (path && typeof path === 'string') {
      result.path = path;
    }
    const minCount = this._getValue(target, ns.w3.shacl.minCount, objectContext);
    if (typeof minCount === 'number') {
      result.minCount = minCount;
    }
    const maxCount = this._getValue(target, ns.w3.shacl.maxCount, objectContext);
    if (typeof maxCount === 'number') {
      result.maxCount = maxCount;
    }
    // if (!patternName.isNullOrEmpty) {
    //   result.patternName = patternName.value();
    // }
    
    const ranges = (target[this._getAmfKey(ns.aml.vocabularies.shapes.range, objectContext) as keyof PropertyShape]) as Shape[];
    if (Array.isArray(ranges) && ranges.length) {
      const [range] = ranges;
      result.range = this.unknownShape(range, undefined, objectContext);
    }
    return result;
  }

  unionShape(object: UnionShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IUnionShape {
    const objectContext = context || object['@context'];
    const anyOf = (object[this._getAmfKey(ns.aml.vocabularies.shapes.anyOf, objectContext) as keyof UnionShape]) as Shape[];
    const result = (this.anyShape(object, options, objectContext)) as IUnionShape;
    if (Array.isArray(anyOf) && anyOf.length) {
      const opt = { ...options, trackedId: undefined };
      result.anyOf = anyOf.map((shape) => this.unknownShape(shape, opt, objectContext));
    } else {
      result.anyOf = [];
    }
    return result;
  }

  fileShape(object: FileShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IFileShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.anyShape(target, options, objectContext)) as IFileShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }
    
    const pattern = this._getValue(target, ns.w3.shacl.pattern, objectContext);
    if (pattern && typeof pattern === 'string') {
      result.pattern = pattern;
    }
    const fileTypes = (this._getValueArray(target, ns.aml.vocabularies.shapes.fileType, objectContext)) as string[] | undefined;
    if (Array.isArray(fileTypes) && fileTypes.length) {
      result.fileTypes = fileTypes;
    }
    const minLength = this._getValue(target, ns.w3.shacl.minLength, objectContext);
    if (typeof minLength === 'number') {
      result.minLength = minLength;
    }
    const maxLength = this._getValue(target, ns.w3.shacl.maxLength, objectContext);
    if (typeof maxLength === 'number') {
      result.maxLength = maxLength;
    }
    const minInclusive = this._getValue(target, ns.w3.shacl.minInclusive, objectContext);
    if (typeof minInclusive === 'number') {
      result.minimum = minInclusive;
      result.exclusiveMinimum = false;
    }
    const maxInclusive = this._getValue(target, ns.w3.shacl.maxInclusive, objectContext);
    if (typeof maxInclusive === 'number') {
      result.maximum = maxInclusive;
      result.exclusiveMaximum = false;
    }
    const format = this._getValue(target, ns.aml.vocabularies.shapes.format, objectContext);
    if (format && typeof format === 'string') {
      result.format = format;
    }
    const multipleOf = this._getValue(target, ns.aml.vocabularies.shapes.multipleOf, objectContext);
    if (typeof multipleOf === 'number') {
      result.multipleOf = multipleOf;
    }
    return result;
  }

  schemaShape(object: SchemaShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): ISchemaShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.anyShape(target, options, objectContext)) as ISchemaShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }
    
    const mediaType = this._getValue(target, ns.aml.vocabularies.core.mediaType, objectContext);
    if (mediaType && typeof mediaType === 'string') {
      result.mediaType = mediaType;
    }
    const raw = this._getValue(target, ns.aml.vocabularies.document.raw, objectContext);
    if (raw && typeof raw === 'string') {
      result.raw = raw;
    }
    return result;
  }


  recursiveShape(object: RecursiveShape, context?: Record<string, string>): IRecursiveShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.shape(target, objectContext)) as IRecursiveShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }
    
    const fp = this._getLinkValue(object, ns.aml.vocabularies.shapes.fixPoint, objectContext);
    if (fp && typeof fp === 'string') {
      result.fixPoint = fp;
    }
    return result;
  }

  dataArrangeShape(object: DataArrangeShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IDataArrangeShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.anyShape(target, options, objectContext)) as IDataArrangeShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }
    // 
    // const { minItems, maxItems, uniqueItems } = object;
    // if (!minItems.isNull) {
    //   result.minItems = minItems.value();
    // }
    // if (!maxItems.isNull) {
    //   result.maxItems = maxItems.value();
    // }
    // if (!uniqueItems.isNull) {
    //   result.uniqueItems = uniqueItems.value();
    // }
    return result;
  }

  arrayShape(object: ArrayShape, options: ShapeProcessingOptions={}, context?: Record<string, string>): IArrayShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.dataArrangeShape(target, options, objectContext)) as IArrayShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }

    const items = target[this._getAmfKey(ns.aml.vocabularies.shapes.items, objectContext) as keyof ArrayShape] as Shape[] | undefined;
    if (Array.isArray(items) && items.length) {
      const [item] = items;
      result.items = this.unknownShape(item, undefined, objectContext);
    }
    return result;
  }

  tupleShape(object: TupleShape, options?: ShapeProcessingOptions, context?: Record<string, string>): ITupleShape {
    const objectContext = context || object['@context'];
    let target = object;
    const result = (this.dataArrangeShape(target, options, objectContext)) as ITupleShape;
    if (this.isLink(target)) {
      const value = (this.getLinkTarget(target, objectContext));
      if (value) {
        target = value;
      }
    }
    const items = target[this._getAmfKey(ns.aml.vocabularies.shapes.items, objectContext) as keyof TupleShape] as any[] | undefined;
    const prefix = this._getAmfKey(ns.w3.rdfSchema.key, objectContext) as string;
    if (Array.isArray(items) && items.length) {
      result.items = [];
      items.forEach((item) => {
        if (Array.isArray(item)) {
          [item] = item;
        }
        Object.keys(item).filter(k => k.startsWith(prefix)).forEach((key) => {
          let shape = item[key];
          if (Array.isArray(shape)) {
            [shape] = shape;
          }
          const value = this.unknownShape(shape, undefined, objectContext);
          result.items.push(value);
        });
      });
    } else {
      result.items = [];
    }
    return result;
  }

  /**
   * @param object The CreativeWork to serialize.
   * @returns Serialized CreativeWork
   */
  documentation(object: CreativeWork, context?: Record<string, string>): ApiDocumentation {
    const objectContext = context || object['@context'];
    const result: ApiDocumentation = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    const url = this._getLinkValue(object, ns.aml.vocabularies.core.url, objectContext);
    if (url && typeof url === 'string') {
      result.url = url;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const title = this._getValue(object, ns.aml.vocabularies.core.title, objectContext);
    if (title && typeof title === 'string') {
      result.title = title;
    }
    return result;
  }

  /**
   * @param object The Example to serialize.
   * @returns Serialized Example
   */
  example(object: Example, context?: Record<string, string>): IDataExample {
    const objectContext = context || object['@context'];
    this._resolve(object);
    const result: IDataExample = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      strict: false,
    });
    
    const strict = this._getValue(object, ns.aml.vocabularies.document.strict, objectContext);
    if (typeof strict === 'boolean') {
      result.strict = strict;
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const displayName = this._getValue(object, ns.aml.vocabularies.core.displayName, objectContext);
    if (displayName && typeof displayName === 'string') {
      result.displayName = displayName;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const raw = this._getValue(object, ns.aml.vocabularies.document.raw, objectContext);
    if (raw && typeof raw === 'string') {
      result.value = raw;
    }
    const location = this._getValue(object, ns.aml.vocabularies.document.location, objectContext);
    if (location && typeof location === 'string') {
      result.location = location;
    }
    // if (!mediaType.isNullOrEmpty) {
    //   result.mediaType = mediaType.value();
    // }
    const structuredValue = object[this._getAmfKey(ns.aml.vocabularies.document.structuredValue, objectContext) as keyof Example] as DataNode[] | undefined;
    if (Array.isArray(structuredValue) && structuredValue.length) {
      const [value] = structuredValue;
      result.structuredValue = this.unknownDataNode(value, objectContext);
    }
    return result;
  }

  xmlSerializer(object: XMLSerializer, context?: Record<string, string>): IXmlSerializer {
    const objectContext = context || object['@context'];
    const result: IXmlSerializer = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const xmlAttribute = this._getValue(object, ns.aml.vocabularies.shapes.xmlAttribute, objectContext);
    if (typeof xmlAttribute === 'boolean') {
      result.attribute = xmlAttribute;
    }
    const wrapped = this._getValue(object, ns.aml.vocabularies.shapes.xmlWrapped, objectContext);
    if (typeof wrapped === 'boolean') {
      result.wrapped = wrapped;
    }
    const name = this._getValue(object, ns.aml.vocabularies.shapes.xmlName, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const xmlNs = this._getValue(object, ns.aml.vocabularies.shapes.xmlNamespace, objectContext);
    if (xmlNs && typeof xmlNs === 'string') {
      result.namespace = xmlNs;
    }
    const xmlPrefix = this._getValue(object, ns.aml.vocabularies.shapes.xmlPrefix, objectContext);
    if (xmlPrefix && typeof xmlPrefix === 'string') {
      result.prefix = xmlPrefix;
    }
    return result;
  }

  unknownDataNode(object: DataNode, context?: Record<string, string>): IDataNodeUnion | undefined {
    const types = this.readTypes(object['@type'], context);
    
    if (types.includes(ns.aml.vocabularies.data.Scalar)) {
      return this.scalarNode((object as ScalarNode), context);
    }
    if (types.includes(ns.aml.vocabularies.data.Object)) {
      return this.objectNode((object as ObjectNode), context);
    }
    if (types.includes(ns.aml.vocabularies.data.Array)) {
      return this.arrayNode((object as ArrayNode), context);
    }
    return undefined;
  }

  dataNode(object: DataNode, context?: Record<string, string>): IDataNode {
    const result: IDataNode = {
      id: object['@id'],
      types: this.readTypes(object['@type'], context),
      customDomainProperties: this.customDomainProperties(object, context),
    };
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, context);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    return result;
  }

  scalarNode(object: ScalarNode, context?: Record<string, string>): IScalarNode {
    const objectContext = context || object['@context'];
    const result = (this.dataNode(object, context)) as IScalarNode;
    
    const value = this._getValue(object, ns.aml.vocabularies.data.value, objectContext);
    if (value && typeof value === 'string') {
      result.value = value;
    }
    const dataType = this._getLinkValue(object, ns.w3.shacl.datatype, objectContext);
    if (dataType && typeof dataType === 'string') {
      result.dataType = dataType;
    }
    return result;
  }

  objectNode(object: ObjectNode, context?: Record<string, string>): IObjectNode {
    const objectContext = context || object['@context'];
    const result = (this.dataNode(object, context)) as IObjectNode;
    result.properties = {};
    const prefix = ns.aml.vocabularies.data.key;
    const prefixCompact = `${this._getAmfKey(prefix, objectContext)}:`;
    Object.keys(object).forEach((key) => {
      if (key.startsWith(prefix) || key.startsWith(prefixCompact)) {
        let value = object[key as keyof ObjectNode] as any | undefined;
        if (Array.isArray(value)) {
          [value] = value;
        }
        const name = key.replace(prefix, '').replace(prefixCompact, '');
        const nodeValue = this.unknownDataNode(value, context);
        if (nodeValue) {
          result.properties[name] = nodeValue;
        }
      }
    });
    return result;
  }

  arrayNode(object: ArrayNode, context?: Record<string, string>): IArrayNode {
    const objectContext = context || object['@context'];
    const result = (this.dataNode(object, objectContext)) as IArrayNode;
    result.members = [];
    const members = (this._computePropertyArray(object, ns.w3.rdfSchema.member)) as DataNode[];
    if (Array.isArray(members) && members.length) {
      result.members = members.map((item) => this.unknownDataNode(item)!);
    }
    return result;
  }

  /**
   * Adds the custom domain properties to the currently processed property, a.k.a annotations.
   * @returns  The list of custom domain properties.
   */
  customDomainProperties(object: DomainElement, context?: Record<string, string>): ICustomDomainProperty[] {
    const result: ICustomDomainProperty[] = [];
    const objectContext = context || object['@context'];
    const ids = this._getLinkValues(object, ns.aml.vocabularies.document.customDomainProperties, objectContext);
    if (Array.isArray(ids) && ids.length) {
      ids.forEach((id) => {
        const key = `amf://id${id}`;
        let value = (object[id as keyof DomainElement] || object[key as keyof DomainElement]) as DomainElement[] | DomainElement | undefined;
        if (!value) {
          return;
        }
        if (Array.isArray(value)) {
          [value] = value;
        }
        const extension = this.unknownDataNode(value, objectContext);
        const name = this._getValue(value, ns.aml.vocabularies.core.extensionName, objectContext) as string | undefined;
        if (!name || !extension) {
          return;
        }
        const cdp: ICustomDomainProperty = ({
          id: key,
          name,
          extension,
        });
        result.push(cdp);
      });
    }
    return result;
  }

  endPoint(object: EndPoint, context?: Record<string, string>): ApiEndPoint {
    const objectContext = context || object['@context'];
    const result: ApiEndPoint = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object),
      path: '',
      operations: [],
      parameters: [],
      payloads: [],
      servers: [],
      security: [],
      extends: [],
    });
    
    const path = this._getValue(object, ns.aml.vocabularies.apiContract.path, objectContext);
    if (path && typeof path === 'string') {
      result.path = path;
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const summary = this._getValue(object, ns.aml.vocabularies.core.summary, objectContext);
    if (summary && typeof summary === 'string') {
      result.summary = summary;
    }
    const operations = this[getArrayItems](object, ns.aml.vocabularies.apiContract.supportedOperation, objectContext);
    if (Array.isArray(operations) && operations.length) {
      result.operations = operations.map(i => this.operation((i as Operation), objectContext));
    }
    const parameters = this[getArrayItems](object, ns.aml.vocabularies.apiContract.parameter, objectContext);
    if (Array.isArray(parameters) && parameters.length) {
      result.parameters = parameters.map(i => this.parameter(i, objectContext));
    }
    const payloads = this[getArrayItems](object, ns.aml.vocabularies.apiContract.payload, objectContext);
    if (Array.isArray(payloads) && payloads.length) {
      result.payloads = payloads.map(i => this.payload(/** @type Payload */(i as Payload), objectContext));
    }
    const servers = this[getArrayItems](object, ns.aml.vocabularies.apiContract.server, objectContext);
    if (Array.isArray(servers) && servers.length) {
      result.servers = servers.map(i => this.server(i, objectContext));
    }
    const security = this[getArrayItems](object, ns.aml.vocabularies.security.security, objectContext);
    if (Array.isArray(security) && security.length) {
      result.security = security.map(i => this.securityRequirement(i, objectContext));
    }
    const extensions = this[getArrayItems](object, ns.aml.vocabularies.document.extends, objectContext);
    if (Array.isArray(extensions) && extensions.length) {
      result.extends = [];
      extensions.forEach((ex) => {
        let extension = ex;
        if (Array.isArray(extension)) {
          [extension] = extension;
        }
        if (this._hasType(extension, ns.aml.vocabularies.apiContract.ParametrizedResourceType, objectContext)) {
          result.extends.push(this.parametrizedResourceType(extension, objectContext));
        } else if (this._hasType(extension, ns.aml.vocabularies.apiContract.ParametrizedTrait, objectContext)) {
          result.extends.push(this.parametrizedTrait(extension, objectContext));
        }
      });
    }
    return result;
  }

  operation(object: Operation, context?: Record<string, string>): ApiOperation {
    const objectContext = context || object['@context'];
    const result: ApiOperation = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object),
      method: '',
      deprecated: false,
      callbacks: [],
      responses: [],
      servers: [],
      security: [],
      accepts: [],
      schemes: [],
      contentType: [],
      tags: [],
      extends: [],
    });
    
    const method = this._getValue(object, ns.aml.vocabularies.apiContract.method, objectContext);
    if (method && typeof method === 'string') {
      result.method = method;
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const summary = this._getValue(object, ns.aml.vocabularies.apiContract.guiSummary, objectContext);
    if (summary && typeof summary === 'string') {
      result.summary = summary;
    }
    const deprecated = this._getValue(object, ns.aml.vocabularies.core.deprecated, objectContext);
    if (typeof deprecated === 'boolean') {
      result.deprecated = deprecated;
    }
    const operationId = this._getValue(object, ns.aml.vocabularies.apiContract.operationId, objectContext);
    if (operationId && typeof operationId === 'string') {
      result.operationId = operationId;
    }
    const accepts = (this._getValueArray(object, ns.aml.vocabularies.apiContract.accepts, objectContext)) as string[];
    if (Array.isArray(accepts)) {
      result.accepts = accepts;
    }
    const schemes = (this._getValueArray(object, ns.aml.vocabularies.apiContract.scheme, objectContext)) as string[];
    if (Array.isArray(schemes)) {
      result.schemes = schemes;
    }
    const contentType = (this._getValueArray(object, ns.aml.vocabularies.apiContract.contentType, objectContext)) as string[];
    if (Array.isArray(contentType)) {
      result.contentType = contentType;
    }

    let expects = object[this._getAmfKey(ns.aml.vocabularies.apiContract.expects, objectContext) as keyof Operation] as Request[] | Request | undefined;
    if (expects) {
      if (Array.isArray(expects)) {
        [expects] = expects;
      }
      result.request = this.request(expects, objectContext);
    }
    let documentation = object[this._getAmfKey(ns.aml.vocabularies.core.documentation, objectContext) as keyof Operation] as CreativeWork[] | CreativeWork | undefined;
    if (documentation) {
      if (Array.isArray(documentation)) {
        [documentation] = documentation;
      }
      result.documentation = this.documentation(documentation, objectContext);
    }
    const responses = object[this._getAmfKey(ns.aml.vocabularies.apiContract.returns, objectContext) as keyof Operation] as Response[] | undefined;
    if (Array.isArray(responses)) {
      result.responses = responses.map(r => this.response(r, objectContext));
    }
    const callbacks = object[this._getAmfKey(ns.aml.vocabularies.apiContract.callback, objectContext) as keyof Operation] as Callback[] | undefined;
    if (Array.isArray(callbacks)) {
      result.callbacks = callbacks.map(c => this.callback(c, objectContext));
    }
    const servers = object[this._getAmfKey(ns.aml.vocabularies.apiContract.server, objectContext) as keyof Operation] as Server[] | undefined;
    if (Array.isArray(servers)) {
      result.servers = servers.map(s => this.server(s));
    }
    const security = object[this._getAmfKey(ns.aml.vocabularies.security.security, objectContext) as keyof Operation] as SecurityRequirement[] | undefined;
    if (Array.isArray(security)) {
      result.security = security.map(s => this.securityRequirement(s, objectContext));
    }
    const tags = object[this._getAmfKey(ns.aml.vocabularies.apiContract.tag, objectContext) as keyof Operation] as Tag[] | undefined;
    if (Array.isArray(tags) && tags.length) {
      result.tags = tags.map(s => this.tag(s, objectContext));
    }
    const traits = object[this._getAmfKey(ns.aml.vocabularies.document.extends, objectContext) as keyof Operation] as ParametrizedTrait[] | undefined;
    if (Array.isArray(traits) && traits.length) {
      result.extends = traits.map(t => this.parametrizedTrait(t, objectContext));
    }
    return result;
  }

  tag(object: Tag, context?: Record<string, string>): ApiTag {
    const objectContext = context || object['@context'];
    const result: ApiTag = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object),
      name: '',
    });
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    return result;
  }

  callback(object: Callback, context?: Record<string, string>): ApiCallback {
    const objectContext = context || object['@context'];
    const result: ApiCallback = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object),
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const expression = this._getValue(object, ns.aml.vocabularies.apiContract.expression, objectContext);
    if (expression && typeof expression === 'string') {
      result.expression = expression;
    }
    let endpoint = object[this._getAmfKey(ns.aml.vocabularies.apiContract.endpoint, objectContext) as keyof Callback] as EndPoint[] | EndPoint | undefined;
    if (endpoint) {
      if (Array.isArray(endpoint)) {
        [endpoint] = endpoint;
      }
      result.endpoint = this.endPoint(endpoint, objectContext);
    }
    return result;
  }


  request(object: Request, context?: Record<string, string>): ApiRequest {
    const objectContext = context || object['@context'];
    const result: ApiRequest = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object),
      required: false,
      headers: [],
      queryParameters: [],
      payloads: [],
      uriParameters: [],
      cookieParameters: [],
    });
    
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const required = this._getValue(object, ns.aml.vocabularies.apiContract.required, objectContext);
    if (required && typeof required === 'boolean') {
      result.required = required;
    }
    let queryString = object[this._getAmfKey(ns.aml.vocabularies.apiContract.queryString, objectContext) as keyof Request] as Shape[] | Shape | undefined;
    if (queryString) {
      if (Array.isArray(queryString)) {
        [queryString] = queryString;
      }
      result.queryString = this.unknownShape(queryString, undefined, objectContext);
    }
    const headers = this[getArrayItems](object, ns.aml.vocabularies.apiContract.header, objectContext);
    if (Array.isArray(headers) && headers.length) {
      result.headers = headers.map(p => this.parameter(p, objectContext));
    }
    const queryParameters = this[getArrayItems](object, ns.aml.vocabularies.apiContract.parameter, objectContext);
    if (Array.isArray(queryParameters) && queryParameters.length) {
      result.queryParameters = queryParameters.map(p => this.parameter(p, objectContext));
    }
    const uriParameters = this[getArrayItems](object, ns.aml.vocabularies.apiContract.uriParameter, objectContext);
    if (Array.isArray(uriParameters) && uriParameters.length) {
      result.uriParameters = uriParameters.map(p => this.parameter(p, objectContext));
    }
    const cookieParameters = this[getArrayItems](object, ns.aml.vocabularies.apiContract.cookieParameter, objectContext);
    if (Array.isArray(cookieParameters) && cookieParameters.length) {
      result.cookieParameters = cookieParameters.map(p => this.parameter(p, objectContext));
    }
    const payloads = this[getArrayItems](object, ns.aml.vocabularies.apiContract.payload, objectContext) as Payload[] | undefined;
    if (Array.isArray(payloads) && payloads.length) {
      result.payloads = payloads.map(p => this.payload(p, objectContext));
    }
    return result;
  }

  response(object: Response, context?: Record<string, string>): ApiResponse {
    const objectContext = context || object['@context'];
    const result: ApiResponse = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      headers: [],
      payloads: [],
      examples: [],
      links: [],
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const statusCode = this._getValue(object, ns.aml.vocabularies.apiContract.statusCode, objectContext);
    if (statusCode && typeof statusCode === 'string') {
      result.statusCode = statusCode;
    }
    const headers = this[getArrayItems](object, ns.aml.vocabularies.apiContract.header, objectContext);
    if (Array.isArray(headers) && headers.length) {
      result.headers = headers.map(p => this.parameter(p, objectContext));
    }
    const payloads = this[getArrayItems](object, ns.aml.vocabularies.apiContract.payload, objectContext) as Payload[] | undefined;
    if (Array.isArray(payloads) && payloads.length) {
      result.payloads = payloads.map(p => this.payload(p, objectContext));
    }
    const examples = object[this._getAmfKey(ns.aml.vocabularies.apiContract.examples, objectContext) as keyof Response] as Example[] | undefined;
    if (Array.isArray(examples) && examples.length) {
      result.examples = examples.map(e => this.example(e, objectContext));
    }
    const links = object[this._getAmfKey(ns.aml.vocabularies.apiContract.link, objectContext) as keyof Response] as TemplatedLink[] | undefined;
    if (Array.isArray(links) && links.length) {
      result.links = links.map(p => this.templatedLink(p, objectContext));
    }
    return result;
  }

  payload(object: Payload, context?: Record<string, string>): ApiPayload {
    const objectContext = context || object['@context'];
    const result: ApiPayload = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      examples: [],
      // encoding: [],
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const mediaType = this._getValue(object, ns.aml.vocabularies.core.mediaType, objectContext);
    if (mediaType && typeof mediaType === 'string') {
      result.mediaType = mediaType;
    }
    let schema = object[this._getAmfKey(ns.aml.vocabularies.shapes.schema, objectContext) as keyof Payload] as Shape | Shape[] | undefined;
    if (schema) {
      if (Array.isArray(schema)) {
        [schema] = schema;
      }
      result.schema = this.unknownShape(schema, {
        trackedId: result.id,
      }, objectContext);
    }
    const examples = object[this._getAmfKey(ns.aml.vocabularies.apiContract.examples, objectContext) as keyof Payload] as Example[] | undefined;
    if (Array.isArray(examples) && examples.length) {
      result.examples = examples.map(e => this.example(e, objectContext));
    }
    // if (Array.isArray(encoding) && encoding.length) {
    //   result.encoding = encoding.map((p) => p.id);
    // }
    return result;
  }

  templatedLink(object: TemplatedLink, context?: Record<string, string>): ApiTemplatedLink {
    const objectContext = context || object['@context'];
    const result: ApiTemplatedLink = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      mapping: [],
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const operationId = this._getValue(object, ns.aml.vocabularies.apiContract.operationId, objectContext);
    if (operationId && typeof operationId === 'string') {
      result.operationId = operationId;
    }
    let server = object[this._getAmfKey(ns.aml.vocabularies.apiContract.server, objectContext) as keyof TemplatedLink] as Server[] | Server | undefined;
    if (server) {
      if (Array.isArray(server)) {
        [server] = server;
      }
      result.server = this.server(server, objectContext);
    }
    let mapping = (object[this._getAmfKey(ns.aml.vocabularies.apiContract.mapping, objectContext) as keyof TemplatedLink]) as IriTemplateMapping[] | undefined;
    if (mapping) {
      if (mapping && !Array.isArray(mapping)) {
        mapping = [mapping];
      }
      if (mapping) {
        result.mapping = mapping.map(item => this.iriTemplateMapping(item, objectContext));
      }
    }
    // if (!template.isNullOrEmpty) {
    //   result.template = template.value();
    // }
    // if (!requestBody.isNullOrEmpty) {
    //   result.requestBody = requestBody.value();
    // }
    return result;
  }

  iriTemplateMapping(object: IriTemplateMapping, context?: Record<string, string>): ApiIriTemplateMapping {
    const objectContext = context || object['@context'];
    const result: ApiIriTemplateMapping = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const templateVariable = this._getValue(object, ns.aml.vocabularies.apiContract.templateVariable, objectContext);
    if (templateVariable && typeof templateVariable === 'string') {
      result.templateVariable = templateVariable;
    }
    const linkExpression = this._getValue(object, ns.aml.vocabularies.apiContract.linkExpression, objectContext);
    if (linkExpression && typeof linkExpression === 'string') {
      result.linkExpression = linkExpression;
    }
    return result;
  }


  parametrizedSecurityScheme(object: ParametrizedSecurityScheme, context?: Record<string, string>): ApiParametrizedSecurityScheme {
    const objectContext = context || object['@context'];
    const result: ApiParametrizedSecurityScheme = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    let scheme = object[this._getAmfKey(ns.aml.vocabularies.security.scheme, objectContext) as keyof ParametrizedSecurityScheme] as SecurityScheme | SecurityScheme[] | undefined;
    if (scheme) {
      if (Array.isArray(scheme)) {
        [scheme] = scheme;
      }
      result.scheme = this.securityScheme(scheme, objectContext);
    }
    let settings = object[this._getAmfKey(ns.aml.vocabularies.security.settings, objectContext) as keyof ParametrizedSecurityScheme] as Settings | Settings[] | undefined;
    if (settings) {
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      result.settings = this.securitySettings(settings, objectContext);
    }
    return result;
  }


  securitySchemeListItem(object: SecurityScheme, context?: Record<string, string>): ApiSecuritySchemeListItem {
    const objectContext = context || object['@context'];
    
    const result: ApiSecuritySchemeListItem = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      type: '',
    });
    
    const type = this._getValue(object, ns.aml.vocabularies.security.type, objectContext);
    if (type && typeof type === 'string') {
      result.type = type;
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const displayName = this._getValue(object, ns.aml.vocabularies.core.displayName, objectContext);
    if (displayName && typeof displayName === 'string') {
      result.displayName = displayName;
    }
    return result;
  }

  securityScheme(object: SecurityScheme, context?: Record<string, string>): ApiSecurityScheme {
    const objectContext = context || object['@context'];
    const result: ApiSecurityScheme = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      headers: [],
      queryParameters: [],
      responses: [],
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const displayName = this._getValue(object, ns.aml.vocabularies.core.displayName, objectContext);
    if (displayName && typeof displayName === 'string') {
      result.displayName = displayName;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const type = this._getValue(object, ns.aml.vocabularies.security.type, objectContext);
    if (type && typeof type === 'string') {
      result.type = type;
    }
    let settings = object[this._getAmfKey(ns.aml.vocabularies.security.settings, objectContext) as keyof SecurityScheme] as Settings[] | Settings | undefined;
    if (settings) {
      if (Array.isArray(settings)) {
        [settings] = settings;
      }
      result.settings = this.securitySettings(settings, objectContext);
    }
    let queryString = object[this._getAmfKey(ns.aml.vocabularies.apiContract.queryString, objectContext) as keyof SecurityScheme] as Shape[] | Shape | undefined;
    if (queryString) {
      if (Array.isArray(queryString)) {
        [queryString] = queryString;
      }
      result.queryString = this.unknownShape(queryString, undefined, objectContext);
    }
    const headers = this[getArrayItems](object, ns.aml.vocabularies.apiContract.header, objectContext);
    if (Array.isArray(headers) && headers.length) {
      result.headers = headers.map(p => this.parameter(p, objectContext));
    }
    const queryParameters = this[getArrayItems](object, ns.aml.vocabularies.apiContract.parameter, objectContext);
    if (Array.isArray(queryParameters) && queryParameters.length) {
      result.queryParameters = queryParameters.map(p => this.parameter(p, objectContext));
    }
    const responses = this[getArrayItems](object, ns.aml.vocabularies.apiContract.response, objectContext) as Response[] | undefined;
    if (Array.isArray(responses) && responses.length) {
      result.responses = responses.map(p => this.response(p, objectContext));
    }
    return result;
  }

  securityRequirement(object: SecurityRequirement, context?: Record<string, string>): ApiSecurityRequirement {
    const objectContext = context || object['@context'];
    const result: ApiSecurityRequirement = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      schemes: [],
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const schemes = (object[this._getAmfKey(ns.aml.vocabularies.security.schemes, objectContext) as keyof SecurityRequirement]) as ParametrizedSecurityScheme[] | undefined;
    if (Array.isArray(schemes) && schemes.length) {
      result.schemes = schemes.map(p => this.parametrizedSecurityScheme(p, objectContext));
    }
    return result;
  }

  securitySettings(object: Settings, context?: Record<string, string>): ApiSecuritySettingsUnion {
    const objectContext = context || object['@context'];
    const types = this.readTypes(object['@type'], objectContext);
    if (types.includes(ns.aml.vocabularies.security.OAuth1Settings)) {
      return this.oAuth1Settings((object as OAuth1Settings), objectContext);
    }
    if (types.includes(ns.aml.vocabularies.security.OAuth2Settings)) {
      return this.oAuth2Settings((object as OAuth2Settings), objectContext);
    }
    if (types.includes(ns.aml.vocabularies.security.ApiKeySettings)) {
      return this.apiKeySettings((object as ApiKeySettings), objectContext);
    }
    if (types.includes(ns.aml.vocabularies.security.HttpSettings)) {
      return this.httpSettings(object as HttpSettings, objectContext);
    }
    if (types.includes(ns.aml.vocabularies.security.OpenIdConnectSettings)) {
      return this.openIdConnectSettings(object as OpenIdConnectSettings, objectContext);
    }
    return this.settings(object, objectContext);
  }

  /**
   * @param {Settings} object
   * @param context
   * @returns {ApiSecuritySettings}
   */
  settings(object: Settings, context?: Record<string, string>): ApiSecuritySettings {
    const objectContext = context || object['@context'];
    const result: ApiSecuritySettings = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    // if (additionalProperties && additionalProperties.id) {
    //   result.additionalProperties = this.unknownDataNode(additionalProperties);
    // }
    return result;
  }

  oAuth1Settings(object: OAuth1Settings, context?: Record<string, string>): ApiSecurityOAuth1Settings {
    const objectContext = context || object['@context'];
    const result = (this.settings(object, objectContext)) as ApiSecurityOAuth1Settings;
    
    const authorizationUri = this._getValue(object, ns.aml.vocabularies.security.authorizationUri, objectContext);
    if (authorizationUri && typeof authorizationUri === 'string') {
      result.authorizationUri = authorizationUri;
    }
    const requestTokenUri = this._getValue(object, ns.aml.vocabularies.security.requestTokenUri, objectContext);
    if (requestTokenUri && typeof requestTokenUri === 'string') {
      result.requestTokenUri = requestTokenUri;
    }
    const tokenCredentialsUri = this._getValue(object, ns.aml.vocabularies.security.tokenCredentialsUri, objectContext);
    if (tokenCredentialsUri && typeof tokenCredentialsUri === 'string') {
      result.tokenCredentialsUri = tokenCredentialsUri;
    }
    const signatures = (this._getValueArray(object, ns.aml.vocabularies.security.signature, objectContext)) as string[];
    if (Array.isArray(signatures) && signatures.length) {
      result.signatures = signatures;
    } else {
      result.signatures = [];
    }
    return result;
  }

  oAuth2Settings(object: OAuth2Settings, context?: Record<string, string>): ApiSecurityOAuth2Settings {
    const objectContext = context || object['@context'];
    const result = this.settings(object, objectContext) as ApiSecurityOAuth2Settings;
    
    const grants = (this._getValueArray(object, ns.aml.vocabularies.security.authorizationGrant, objectContext)) as string[];
    if (Array.isArray(grants) && grants.length) {
      result.authorizationGrants = grants;
    } else {
      result.authorizationGrants = [];
    }
    const flows = (object[this._getAmfKey(ns.aml.vocabularies.security.flows, objectContext) as keyof OAuth2Settings]) as OAuth2Flow[] | undefined;
    if (Array.isArray(flows) && flows.length) {
      result.flows = flows.map((p) => this.oAuth2Flow(p, objectContext));
    } else {
      result.flows = [];
    }
    return result;
  }

  oAuth2Flow(object: OAuth2Flow, context?: Record<string, string>): ApiSecurityOAuth2Flow {
    const objectContext = context || object['@context'];
    const result: ApiSecurityOAuth2Flow = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      scopes: [],
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const authorizationUri = this._getValue(object, ns.aml.vocabularies.security.authorizationUri, objectContext);
    if (authorizationUri && typeof authorizationUri === 'string') {
      result.authorizationUri = authorizationUri;
    }
    const accessTokenUri = this._getValue(object, ns.aml.vocabularies.security.accessTokenUri, objectContext);
    if (accessTokenUri && typeof accessTokenUri === 'string') {
      result.accessTokenUri = accessTokenUri;
    }
    const flow = this._getValue(object, ns.aml.vocabularies.security.flow, objectContext);
    if (flow && typeof flow === 'string') {
      result.flow = flow;
    }
    const refreshUri = this._getValue(object, ns.aml.vocabularies.security.refreshUri, objectContext);
    if (refreshUri && typeof refreshUri === 'string') {
      result.refreshUri = refreshUri;
    }
    const scopes = object[this._getAmfKey(ns.aml.vocabularies.security.scope, objectContext) as keyof OAuth2Flow] as Scope[] | undefined;
    if (Array.isArray(scopes) && scopes.length) {
      result.scopes = scopes.map((p) => this.scope(p, objectContext));
    }
    return result;
  }

  scope(object: Scope, context?: Record<string, string>): ApiSecurityScope {
    const objectContext = context || object['@context'];
    const result: ApiSecurityScope = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    return result;
  }

  apiKeySettings(object: ApiKeySettings, context?: Record<string, string>): ApiSecurityApiKeySettings {
    const objectContext = context || object['@context'];
    const result = (this.settings(object, objectContext)) as ApiSecurityApiKeySettings;
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const inParam = this._getValue(object, ns.aml.vocabularies.security.in, objectContext);
    if (inParam && typeof inParam === 'string') {
      result.in = inParam;
    }
    return result;
  }

  httpSettings(object: HttpSettings, context?: Record<string, string>): ApiSecurityHttpSettings {
    const objectContext = context || object['@context'];
    const result = (this.settings(object, objectContext)) as ApiSecurityHttpSettings;
    
    const scheme = this._getValue(object, ns.aml.vocabularies.security.scheme, objectContext);
    if (scheme && typeof scheme === 'string') {
      result.scheme = scheme;
    }
    const bearerFormat = this._getValue(object, ns.aml.vocabularies.security.bearerFormat, objectContext);
    if (bearerFormat && typeof bearerFormat === 'string') {
      result.bearerFormat = bearerFormat;
    }
    return result;
  }

  openIdConnectSettings(object: OpenIdConnectSettings, context?: Record<string, string>): ApiSecurityOpenIdConnectSettings {
    const objectContext = context || object['@context'];
    const result = (this.settings(object, objectContext)) as ApiSecurityOpenIdConnectSettings;
    
    const url = this._getValue(object, ns.aml.vocabularies.security.openIdConnectUrl, objectContext);
    if (url && typeof url === 'string') {
      result.url = url;
    }
    return result;
  }

  /**
   * Serializes source maps, when available.
   */
  sourceMap(object: DocumentSourceMaps, context?: Record<string, string>): ApiDocumentSourceMaps|undefined {
    const objectContext = context || object['@context'];
    let sm = object[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.sources, objectContext) as keyof DocumentSourceMaps] as DocumentSourceMaps[] | DocumentSourceMaps | undefined;
    if (!sm) {
      return undefined;
    }
    if (Array.isArray(sm)) {
      [sm] = sm;
    }
    const result: ApiDocumentSourceMaps = ({
      id: sm['@id'],
      types: this.readTypes(sm['@type']),
    });
    const synthesizedField = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.synthesizedField, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(synthesizedField) && synthesizedField.length) {
      result.synthesizedField = synthesizedField.map(i => this.synthesizedField(i, objectContext));
    }
    const lexical = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.lexical, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(lexical) && lexical.length) {
      result.lexical = lexical.map(i => this.synthesizedField(i, objectContext))
    }
    const trackedElement = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.trackedElement, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(trackedElement) && trackedElement.length) {
      result.trackedElement = this.synthesizedField(trackedElement[0], objectContext);
    }
    const autoName = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.autoGeneratedName, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(autoName) && autoName.length) {
      result.autoGeneratedName = autoName.map(i => this.synthesizedField(i, objectContext))
    }
    const jsonSchema = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.parsedJsonSchema, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(jsonSchema) && jsonSchema.length) {
      result.parsedJsonSchema = this.synthesizedField(jsonSchema[0], objectContext);
    }
    const declaredElement = sm[this._getAmfKey(ns.aml.vocabularies.docSourceMaps.declaredElement, objectContext) as keyof DocumentSourceMaps] as SynthesizedField[] | undefined;
    if (Array.isArray(declaredElement) && declaredElement.length) {
      result.declaredElement = this.synthesizedField(declaredElement[0], objectContext);
    }
    return result;
  }

  synthesizedField(object: SynthesizedField, context?: Record<string, string>): ApiSynthesizedField {
    // compact model
    if (typeof object === 'string') {
      return {
        id: 'synthesizedField/generated',
        value: object,
      } as ApiSynthesizedField;
    }
    const result: ApiSynthesizedField = {
      id: object['@id'],
      value: '',
    };
    const element = this._getValue(object as any, ns.aml.vocabularies.docSourceMaps.element, context) as string | undefined;
    if (typeof element === 'string') {
      result.element = element;
    }
    const value = this._getValue(object as any, ns.aml.vocabularies.docSourceMaps.value, context) as string | undefined;
    if (typeof value === 'string') {
      result.value = value
    }
    return result;
  }

  parametrizedDeclaration(object: ParametrizedDeclaration, context?: Record<string, string>): ApiParametrizedDeclaration {
    const objectContext = context || object['@context'];
    const result: ApiParametrizedDeclaration = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      variables: [],
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
    });
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    const variables = object[this._getAmfKey(ns.aml.vocabularies.document.variable, objectContext) as keyof ParametrizedDeclaration] as VariableValue[] | undefined;
    if (Array.isArray(variables)) {
      variables.forEach((item) => {
        result.variables.push(this.variableValue(item, objectContext));
      });
    }
    const targets = object[this._getAmfKey(ns.aml.vocabularies.document.target, objectContext) as keyof ParametrizedDeclaration] as AbstractDeclaration[] | undefined;
    if (Array.isArray(targets) && targets.length) {
      const [target] = targets;
      result.target = this.abstractDeclaration(target, objectContext);
    }
    return result;
  }

  parametrizedTrait(object: ParametrizedTrait, context?: Record<string, string>): ApiParametrizedTrait {
    const objectContext = context || object['@context'];
    const result = (this.parametrizedDeclaration(object, objectContext)) as ApiParametrizedTrait;
    return result;
  }

  parametrizedResourceType(object: ParametrizedResourceType, context?: Record<string, string>): ApiParametrizedResourceType {
    const objectContext = context || object['@context'];
    const result = (this.parametrizedDeclaration(object, objectContext)) as ApiParametrizedResourceType;
    return result;
  }

  variableValue(object: VariableValue, context?: Record<string, string>): ApiVariableValue {
    const objectContext = context || object['@context'];
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext) as string;
    const result: ApiVariableValue = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      name,
    });
    const values = object[this._getAmfKey(ns.aml.vocabularies.document.value, objectContext) as keyof VariableValue] as DataNode[] | undefined;
    if (Array.isArray(values)) {
      const [item] = values;
      result.value = this.unknownDataNode(item, objectContext);
    }
    return result;
  }

  abstractDeclaration(object: AbstractDeclaration, context?: Record<string, string>): ApiAbstractDeclaration {
    const objectContext = context || object['@context'];
    
    const name = this._getValue(object, ns.aml.vocabularies.core.name, objectContext) as string;
    const result: ApiAbstractDeclaration = ({
      id: object['@id'],
      types: this.readTypes(object['@type'], objectContext),
      customDomainProperties: this.customDomainProperties(object, objectContext),
      sourceMaps: this.sourceMap(object, objectContext),
      name,
      variables: [],
    });
    const variables = (this._getValueArray(object, ns.aml.vocabularies.document.variable, objectContext)) as string[];
    if (Array.isArray(variables)) {
      result.variables = variables;
    }
    const description = this._getValue(object, ns.aml.vocabularies.core.description, objectContext);
    if (description && typeof description === 'string') {
      result.description = description;
    }
    const dataNode = object[this._getAmfKey(ns.aml.vocabularies.document.dataNode, objectContext) as keyof AbstractDeclaration] as DataNode[] | undefined;
    if (Array.isArray(dataNode)) {
      const [item] = dataNode;
      result.dataNode = this.unknownDataNode(item, objectContext);
    }
    return result;
  }

  /**
   * @param object The EndPoint to serialize as a list item.
   * @returns Serialized EndPoint as a list item.
   */
  endPointWithOperationsListItem(object: EndPoint, context?: Record<string, string>): ApiEndPointWithOperationsListItem {
    const path = this._getValue(object, ns.aml.vocabularies.apiContract.path, context) as string;
    const result: ApiEndPointWithOperationsListItem = ({
      id: object['@id'],
      path,
      operations: [],
    });
    const operations = this[getArrayItems](object, ns.aml.vocabularies.apiContract.supportedOperation, context) as Operation[] | undefined;
    if (Array.isArray(operations) && operations.length) {
      result.operations = operations.map(i => this.operationListItem(i, context));
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, context);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    return result;
  }

  /**
   * @param object The Operation to serialize as a list item.
   * @param context A context to use. If not set, it looks for the context of the passed model
   * @returns Serialized Operation as a list item.
   */
  operationListItem(object: Operation, context?: Record<string, string>): ApiOperationListItem {
    const result: ApiOperationListItem = ({
      id: object['@id'],
      method: '',
    });
    
    const method = this._getValue(object, ns.aml.vocabularies.apiContract.method, context);
    if (method && typeof method === 'string') {
      result.method = method;
    }
    const name = this._getValue(object, ns.aml.vocabularies.core.name, context);
    if (name && typeof name === 'string') {
      result.name = name;
    }
    return result;
  }
}
