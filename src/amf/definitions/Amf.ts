export declare interface DomainElement {
  '@id': string;
  '@type': string[];
  '@context'?: Record<string, string>;
  'http://a.ml/vocabularies/document#customDomainProperties'?: [];
}

export interface ExternalDomainElement extends DomainElement {
  'http://a.ml/vocabularies/document#raw': LdValueString[];
  'http://a.ml/vocabularies/core#mediaType': LdValueString[];
}

export declare interface Linkable {
  'http://a.ml/vocabularies/document#link-target'?: LdIdValue[];
  'http://a.ml/vocabularies/document#link-label'?: LdValueString[];
}

export declare interface LdValue<T> {
  '@value': T;
}

export declare interface LdIdValue {
  '@id': string;
}

export declare interface LdValueString extends LdValue<string> {
}

export declare interface LdValueBoolean extends LdValue<boolean> {
}

export declare interface LdValueNumber extends LdValue<number> {
}

export declare interface LdValueRange extends LdIdValue {
  '@type'?: string[];
}

export interface AmfDocument extends DomainElement {
  'http://a.ml/vocabularies/document#version'?: LdValueString[];
  'http://a.ml/vocabularies/document#root'?: LdValueBoolean[];
  'http://a.ml/vocabularies/document#encodes'?: DomainElement[];
  'http://a.ml/vocabularies/document#references'?: DomainElement[];
  'http://a.ml/vocabularies/document#declares'?: DomainElement[];
}

export interface Api extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#server'?: Server[];
  'http://a.ml/vocabularies/apiContract#accepts'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#contentType'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#scheme'?: LdValueString[];
  'http://a.ml/vocabularies/core#version'?: LdValueString[];
  'http://a.ml/vocabularies/core#documentation'?: CreativeWork[];
  'http://a.ml/vocabularies/apiContract#endpoint'?: EndPoint[];
  'http://a.ml/vocabularies/apiContract#tag'?: Tag[];
  'http://a.ml/vocabularies/core#provider'?: Organization[];
  'http://a.ml/vocabularies/core#license'?: License[];
}

export interface WebApi extends Api {}
export interface AsyncApi extends Api {}

export interface Module extends DomainElement {
  'http://a.ml/vocabularies/document#version'?: LdValueString[];
  'http://a.ml/vocabularies/document#root'?: LdValueBoolean[];
  'http://a.ml/vocabularies/document#declares'?: DomainElement[];
  'http://a.ml/vocabularies/document#usage'?: LdValueString[];
}

export interface DataTypeFragment extends DomainElement {
  'http://a.ml/vocabularies/document#version'?: LdValueString[];
  'http://a.ml/vocabularies/document#root'?: LdValueBoolean[];
  'http://a.ml/vocabularies/document#encodes'?: Shape[];
  'http://a.ml/vocabularies/document#references'?: DomainElement[];
}

export interface ExternalFragment extends DomainElement {
  'http://a.ml/vocabularies/document#version'?: LdValueString[];
  'http://a.ml/vocabularies/document#root'?: LdValueBoolean[];
  'http://a.ml/vocabularies/document#encodes'?: ExternalDomainElement[];
}

export interface Organization extends DomainElement {
  'http://a.ml/vocabularies/core#email'?: LdValueString[];
  'http://a.ml/vocabularies/core#url'?: LdValueString[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
}

export interface License extends DomainElement {
  'http://a.ml/vocabularies/core#url'?: LdValueString[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
}

export declare interface Server extends DomainElement {
  'http://a.ml/vocabularies/core#urlTemplate'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#variable'?: Parameter[];
}

export declare interface EndPoint extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#guiSummary'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#path'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#supportedOperation'?: Operation[];
  'http://a.ml/vocabularies/apiContract#parameter'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#payload'?: Payload[];
  'http://a.ml/vocabularies/apiContract#server'?: Server[];
  'http://a.ml/vocabularies/security#security'?: SecurityRequirement[];
  'http://a.ml/vocabularies/document#extends'?: ParametrizedDeclaration[];
}

export declare interface Operation extends DomainElement {
  'http://a.ml/vocabularies/apiContract#method': LdValueString[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/shapes#deprecated'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#guiSummary'?: LdValueString[];
  'http://a.ml/vocabularies/core#documentation'?: CreativeWork[];
  'http://a.ml/vocabularies/apiContract#scheme'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#accepts'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#contentType'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#expects'?: Request[];
  'http://a.ml/vocabularies/apiContract#returns'?: Response[];
  'http://a.ml/vocabularies/security#security'?: SecurityRequirement[];
  'http://a.ml/vocabularies/apiContract#callback'?: Callback[];
  'http://a.ml/vocabularies/apiContract#server'?: Server[];
  'http://a.ml/vocabularies/document#extends'?: ParametrizedTrait[];
}

export interface Payload extends DomainElement {
  'http://a.ml/vocabularies/core#mediaType': LdValueString[];
  'http://a.ml/vocabularies/shapes#schema'?: DomainElement[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#examples'?: Example[];
  // encoding: Encoding[]
}

export interface Request extends DomainElement {
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#payload'?: Payload[];
  'http://a.ml/vocabularies/apiContract#required'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#parameter'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#uriParameter'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#header'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#cookieParameter'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#queryString'?: Shape;
}

export interface Response extends DomainElement {
  'http://a.ml/vocabularies/apiContract#statusCode': LdValueString[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#payload'?: Payload[];
  'http://a.ml/vocabularies/apiContract#header'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#examples'?: Example[];
  'http://a.ml/vocabularies/apiContract#link'?: TemplatedLink[];
}

export declare interface Parameter extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/shapes#schema'?: DomainElement[];
  'http://a.ml/vocabularies/shapes#deprecated'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#paramName'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#required'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#binding'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#allowEmptyValue'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#style'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#explode'?: LdValueBoolean[];
  'http://a.ml/vocabularies/apiContract#allowReserved'?: LdValueBoolean[];
  
  // payloads: Payload[]
  // examples: Example[]
}

export interface TemplatedLink extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#operationId': LdValueString[];
  'http://a.ml/vocabularies/apiContract#mapping': IriTemplateMapping[];
  'http://a.ml/vocabularies/apiContract#server'?: Server[];
  // not sure what this is
  // template: StrField
  // requestBody: StrField
}

export interface IriTemplateMapping extends DomainElement {
  'http://a.ml/vocabularies/apiContract#templateVariable'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#linkExpression'?: LdValueString[];
}

export declare interface Shape extends DomainElement, Linkable {
  'http://www.w3.org/ns/shacl#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/core#displayName'?: LdValueString[];
  'http://www.w3.org/ns/shacl#defaultValueStr'?: LdValueString[];
  'http://www.w3.org/ns/shacl#defaultValue'?: DataNode[];
  'http://a.ml/vocabularies/shapes#readOnly'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#writeOnly'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#deprecated'?: LdValueBoolean[];
  'http://a.ml/vocabularies/document#location'?: LdValueString[];
  'http://www.w3.org/ns/shacl#or'?: Shape[];
  'http://www.w3.org/ns/shacl#and'?: Shape[];
  'http://www.w3.org/ns/shacl#xone'?: Shape[];
  'http://www.w3.org/ns/shacl#not'?: Shape[];
  // values: DataNode[]
  // inherits: Shape[]
}

export declare interface PropertyShape extends Shape {
  'http://www.w3.org/ns/shacl#path'?: LdIdValue[];
  'http://a.ml/vocabularies/shapes#range'?: Shape[];
  'http://www.w3.org/ns/shacl#minCount'?: LdValueNumber[];
  'http://www.w3.org/ns/shacl#maxCount'?: LdValueNumber[];
  // patternName: StrField
}

export declare interface AnyShape extends Shape {
  'http://a.ml/vocabularies/core#documentation'?: CreativeWork[];
  'http://a.ml/vocabularies/shapes#xmlSerialization'?: DomainElement[];
  'http://a.ml/vocabularies/apiContract#examples'?: DomainElement[];
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
}

export declare interface DataArrangeShape extends AnyShape {
  // minItems: IntField
  // maxItems: IntField
  // uniqueItems: BoolField
}

export declare interface ArrayShape extends DataArrangeShape {
  'http://a.ml/vocabularies/shapes#items'?: Shape[];
}

export declare interface UnionShape extends AnyShape {
  'http://a.ml/vocabularies/shapes#anyOf'?: Shape[];
}

export declare interface TupleShape extends AnyShape {
  'http://a.ml/vocabularies/shapes#items'?: Shape[];
}

export declare interface FileShape extends AnyShape {
  'http://a.ml/vocabularies/shapes#fileType'?: LdValueString[];
  'http://www.w3.org/ns/shacl#pattern'?: LdValueString[];
  'http://www.w3.org/ns/shacl#minLength'?: LdValueNumber[];
  'http://www.w3.org/ns/shacl#maxLength'?: LdValueNumber[];
  'http://a.ml/vocabularies/shapes#minimum'?: LdValueNumber[];
  'http://a.ml/vocabularies/shapes#maximum'?: LdValueNumber[];
  'http://a.ml/vocabularies/shapes#exclusiveMinimum'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#exclusiveMaximum'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#format'?: LdValueString[];
  'http://a.ml/vocabularies/shapes#multipleOf'?: LdValueNumber[];
}

export declare interface NilShape extends AnyShape {
}

export declare interface RecursiveShape extends Shape {
  'http://a.ml/vocabularies/shapes#fixPoint'?: LdIdValue[];
  'http://a.ml/vocabularies/document#recursive'?: LdValueBoolean[];
}

export declare interface ScalarShape extends Shape {
  'http://www.w3.org/ns/shacl#datatype'?: LdIdValue[]; 
  'http://www.w3.org/ns/shacl#pattern'?: LdValueString[];
  'http://www.w3.org/ns/shacl#minLength'?: LdValueNumber[];
  'http://www.w3.org/ns/shacl#maxLength'?: LdValueNumber[];
  'http://a.ml/vocabularies/shapes#minimum': LdValueNumber[];
  'http://a.ml/vocabularies/shapes#maximum': LdValueNumber[];
  'http://a.ml/vocabularies/shapes#exclusiveMinimum': LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#exclusiveMaximum': LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#format'?: LdValueString[];
  'http://a.ml/vocabularies/shapes#multipleOf'?: LdValueNumber[];
}

export declare interface SchemaShape extends Shape {
  'http://a.ml/vocabularies/core#mediaType': LdValueString[];
  'http://a.ml/vocabularies/document#raw'?: LdValueString[];
}

export declare interface NodeShape extends AnyShape {
  // minProperties: IntField
  // maxProperties: IntField
  'http://www.w3.org/ns/shacl#closed'?: LdValueBoolean[];
  // customShapeProperties?: PropertyShape[]
  // customShapePropertyDefinitions?: PropertyShape[]
  'http://a.ml/vocabularies/shapes#discriminator'?: LdValueString[];
  'http://a.ml/vocabularies/shapes#discriminatorValue'?: LdValueString[];
  'http://www.w3.org/ns/shacl#property'?: PropertyShape[];
  // dependencies: PropertyDependencies[]
}

export declare interface DataNode extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
}

export declare interface ObjectNode extends DataNode {
  // [key: string]: DataNode[];
}

export declare interface ArrayNode extends DataNode {
}

export declare interface ScalarNode extends DataNode {
  'http://a.ml/vocabularies/data#value'?: LdValueString[];
  'http://www.w3.org/ns/shacl#datatype'?: LdIdValue[]; 
}

export declare interface Example extends DomainElement, Linkable {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#displayName'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/data#value'?: LdIdValue[];
  'http://a.ml/vocabularies/document#structuredValue'?: DataNode[];
  'http://a.ml/vocabularies/document#strict'?: LdValueBoolean[];
  'http://a.ml/vocabularies/core#mediaType'?: LdValueString[];
  'http://a.ml/vocabularies/document#raw'?: LdValueString[];
}

export interface CreativeWork extends DomainElement {
  'http://a.ml/vocabularies/core#title'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
}

export interface SecurityRequirement extends DomainElement {
  'http://a.ml/vocabularies/security#schemes'?: ParametrizedSecurityScheme[];
  // not sure if this is the right key. Can't generate an example.
  'http://a.ml/vocabularies/security#name'?: LdValueString[];
}

export interface ParametrizedSecurityScheme extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/security#scheme'?: SecurityScheme[];
  'http://a.ml/vocabularies/security#settings': Settings[];
}

export interface SecurityScheme extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/security#type'?: LdValueString[];
  'http://a.ml/vocabularies/core#displayName'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#parameter'?: Parameter[];
  'http://a.ml/vocabularies/apiContract#header'?: Parameter[];
  'http://a.ml/vocabularies/security#settings'?: Settings[];
  'http://a.ml/vocabularies/apiContract#response'?: Response[];
  'http://a.ml/vocabularies/apiContract#queryString'?: Shape;
}

export interface Settings extends DomainElement {
  // additionalProperties: DataNode;
}

export interface OAuth1Settings extends Settings {
  'http://a.ml/vocabularies/security#requestTokenUri'?: LdValueString[];
  'http://a.ml/vocabularies/security#authorizationUri'?: LdValueString[];
  'http://a.ml/vocabularies/security#tokenCredentialsUri'?: LdValueString[];
  'http://a.ml/vocabularies/security#signature': LdValueString[];
}

export interface OAuth2Settings extends Settings {
  'http://a.ml/vocabularies/security#authorizationGrant': LdValueString[];
  'http://a.ml/vocabularies/security#flows'?: OAuth2Flow[];
}

export interface OAuth2Flow extends Settings {
  'http://a.ml/vocabularies/security#authorizationUri'?: LdValueString[];
  'http://a.ml/vocabularies/security#accessTokenUri': LdValueString[];
  'http://a.ml/vocabularies/security#flow'?: LdValueString[];
  'http://a.ml/vocabularies/security#refreshUri': LdValueString[];
  'http://a.ml/vocabularies/security#scope'?: Scope[];
}

export interface ApiKeySettings extends Settings {
  'http://a.ml/vocabularies/core#name': LdValueString[];
  'http://a.ml/vocabularies/security#in': LdValueString[];
}

export interface HttpSettings extends Settings {
  'http://a.ml/vocabularies/security#scheme'?: LdValueString[];
  'http://a.ml/vocabularies/security#bearerFormat'?: LdValueString[];
}

export interface OpenIdConnectSettings extends Settings {
  'http://a.ml/vocabularies/security#openIdConnectUrl': LdValueString[];
}

export interface Scope extends DomainElement {
  'http://a.ml/vocabularies/core#name': LdValueString[];
  'http://a.ml/vocabularies/core#description': LdValueString[];
}

export interface Callback extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#expression'?: LdValueString[];
  'http://a.ml/vocabularies/apiContract#endpoint'?: EndPoint[];
}

export interface XMLSerializer extends DomainElement {
  'http://a.ml/vocabularies/shapes#xmlAttribute'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#xmlWrapped'?: LdValueBoolean[];
  'http://a.ml/vocabularies/shapes#xmlName'?: LdValueBoolean[];
}

export interface Tag extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
}

export interface DocumentSourceMaps extends DomainElement {
  'http://a.ml/vocabularies/document-source-maps#synthesized-field'?: SynthesizedField[];
  'http://a.ml/vocabularies/document-source-maps#lexical'?: SynthesizedField[];
  'http://a.ml/vocabularies/document-source-maps#tracked-element'?: SynthesizedField[];
}

export interface SynthesizedField {
  '@id': string;
  'http://a.ml/vocabularies/document-source-maps#element'?: LdValueString[];
  'http://a.ml/vocabularies/document-source-maps#value'?: LdValueString[];
}

export interface ParametrizedDeclaration extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/document#target'?: AbstractDeclaration[];
  'http://a.ml/vocabularies/document#variable'?: VariableValue[];
}

export interface VariableValue extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/document#value'?: DataNode[];
}

export interface AbstractDeclaration extends DomainElement {
  'http://a.ml/vocabularies/core#name'?: LdValueString[];
  'http://a.ml/vocabularies/core#description'?: LdValueString[];
  'http://a.ml/vocabularies/document#dataNode'?: DataNode[];
  'http://a.ml/vocabularies/document#variable'?: LdValueString[];
}

export interface ParametrizedTrait extends ParametrizedDeclaration {}
export interface ParametrizedResourceType extends ParametrizedDeclaration {}
