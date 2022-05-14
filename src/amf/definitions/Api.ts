import { IDomainProperty } from "./Base.js";
import { IDataExample, IDataNode, IDataNodeUnion, IShapeUnion } from "./Shapes.js";

export type IScalarDataTypes = 'string' | 'base64Binary' | 'boolean' | 'date' | 'dateTime' | 'double' | 'float' | 'integer' | 'long' | 'number' | 'time';

export interface ApiSummary extends IDomainProperty {
  name?: string;
  description?: string;
  // identifier?: string; <- not sure what this is.
  schemes: string[];
  accepts: string[];
  contentType: string[];
  version?: string;
  termsOfService?: string;
  provider?: ApiOrganization;
  license?: ApiLicense;
  documentations: ApiDocumentation[];
  tags: ApiTag[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiBase extends ApiSummary {
  endPoints: ApiEndPoint[];
  servers: ApiServer[];
  security: ApiSecurityRequirement[];
}

export interface ApiWeb extends ApiBase {}
export interface ApiAsync extends ApiBase {}

export interface ApiOrganization extends IDomainProperty {
  url?: string;
  name?: string;
  email?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiLicense extends IDomainProperty {
  url?: string;
  name?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiEndPoint extends IDomainProperty {
  description?: string;
  name?: string;
  summary?: string;
  path: string;
  operations: ApiOperation[];
  parameters: ApiParameter[];
  payloads: ApiPayload[];
  servers: ApiServer[];
  security: ApiSecurityRequirement[];
  sourceMaps?: ApiDocumentSourceMaps;
  extends: ApiParametrizedDeclaration[];
}

export interface ApiOperation extends IDomainProperty {
  method: string;
  name?: string;
  description?: string;
  summary?: string;
  deprecated: boolean;
  schemes?: string[];
  accepts?: string[];
  contentType?: string[];
  operationId?: string;
  documentation?: ApiDocumentation;
  request?: ApiRequest;
  responses: ApiResponse[];
  security: ApiSecurityRequirement[];
  callbacks: ApiCallback[];
  servers: ApiServer[];
  tags: ApiTag[];
  sourceMaps?: ApiDocumentSourceMaps;
  extends: ApiParametrizedTrait[];
}

export interface ApiTag extends IDomainProperty {
  name: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiServer extends IDomainProperty {
  url: string;
  description?: string;
  variables: ApiParameter[];
  sourceMaps?: ApiDocumentSourceMaps;
  protocol?: string;
  protocolVersion?: string;
  security?: ApiSecurityRequirement[];
}

export interface ApiParameter extends IDomainProperty {
  name?: string;
  paramName?: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  binding?: string;
  schema?: IShapeUnion;
  payloads: ApiPayload[];
  examples: IDataExample[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiPayload extends IDomainProperty {
  name?: string;
  mediaType?: string;
  schema?: IShapeUnion;
  examples: IDataExample[];
  // encoding: ApiEncoding[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiResponse extends IDomainProperty {
  name?: string;
  description?: string;
  statusCode?: string;
  headers: ApiParameter[];
  payloads: ApiPayload[];
  examples: IDataExample[];
  links: ApiTemplatedLink[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiTemplatedLink extends IDomainProperty {
  name?: string;
  description?: string;
  template?: string;
  operationId?: string;
  requestBody?: string;
  mapping: ApiIriTemplateMapping[];
  server?: ApiServer;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiIriTemplateMapping extends IDomainProperty {
  templateVariable?: string;
  linkExpression?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityRequirement extends IDomainProperty {
  name?: string;
  schemes: ApiParametrizedSecurityScheme[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiParametrizedSecurityScheme extends IDomainProperty {
  name?: string;
  settings?: ApiSecuritySettingsUnion;
  scheme?: ApiSecurityScheme;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityScheme extends IDomainProperty {
  name?: string;
  type?: string;
  displayName?: string;
  description?: string;
  settings?: ApiSecuritySettingsUnion;
  headers: ApiParameter[];
  queryParameters: ApiParameter[];
  responses: ApiResponse[];
  queryString?: IShapeUnion;
  sourceMaps?: ApiDocumentSourceMaps;
}


export interface ApiSecuritySettings extends IDomainProperty {
  additionalProperties?: IDataNodeUnion;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityOAuth1Settings extends ApiSecuritySettings {
  requestTokenUri?: string;
  authorizationUri?: string;
  tokenCredentialsUri?: string;
  signatures: string[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityOAuth2Settings extends ApiSecuritySettings {
  authorizationGrants: string[];
  flows: ApiSecurityOAuth2Flow[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityApiKeySettings extends ApiSecuritySettings {
  name?: string;
  in?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityHttpSettings extends ApiSecuritySettings {
  scheme?: string;
  bearerFormat?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityOpenIdConnectSettings extends ApiSecuritySettings {
  url?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export type ApiSecuritySettingsUnion = ApiSecuritySettings | ApiSecurityOAuth1Settings | ApiSecurityOAuth2Settings | ApiSecurityApiKeySettings | ApiSecurityHttpSettings | ApiSecurityOpenIdConnectSettings;

export interface ApiSecurityOAuth2Flow extends IDomainProperty {
  authorizationUri?: string;
  accessTokenUri?: string;
  flow?: string;
  refreshUri?: string;
  scopes: ApiSecurityScope[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiSecurityScope extends IDomainProperty {
  name?: string;
  description?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiRequest extends IDomainProperty {
  description?: string;
  required?: boolean;
  queryParameters: ApiParameter[];
  headers: ApiParameter[];
  payloads: ApiPayload[];
  queryString?: IShapeUnion;
  uriParameters: ApiParameter[];
  cookieParameters: ApiParameter[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiCallback extends IDomainProperty {
  name?: string;
  expression?: string;
  endpoint?: ApiEndPoint;
  sourceMaps?: ApiDocumentSourceMaps;
}

/**
 * The definition of the domain extension
 */
export interface ApiCustomDomainExtension extends IDomainProperty {
  name?: string;
  displayName?: string;
  description?: string;
  domain: string[];
  schema?: IShapeUnion;
  sourceMaps?: ApiDocumentSourceMaps;
}

/**
 * Applies to an object domain extension
 */
export interface ApiDomainExtension extends IDomainProperty {
  name?: string;
  definedBy?: ApiCustomDomainExtension;
  extension?: IDataNodeUnion;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiDocumentation extends IDomainProperty {
  url?: string;
  description?: string;
  title?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiEncoding {
  propertyName?: string;
  contentType?: string;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  headers: ApiParameter[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiDocumentSourceMaps {
  id?: string;
  types?: string[];
  synthesizedField?: ApiSynthesizedField[];
  lexical?: ApiSynthesizedField[];
  trackedElement?: ApiSynthesizedField;
  autoGeneratedName?: ApiSynthesizedField[];
  parsedJsonSchema?: ApiSynthesizedField;
  declaredElement?: ApiSynthesizedField;
}

export interface ApiSynthesizedField {
  id: string;
  element?: string;
  value: string;
}

export interface ApiParametrizedDeclaration extends IDomainProperty {
  name?: string;
  target?: ApiAbstractDeclaration;
  variables: ApiVariableValue[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiVariableValue extends IDomainProperty {
  name: string;
  value?: IDataNode;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiAbstractDeclaration extends IDomainProperty {
  name: string;
  description?: string;
  dataNode?: IDataNode;
  variables: string[];
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface ApiParametrizedTrait extends ApiParametrizedDeclaration {}
export interface ApiParametrizedResourceType extends ApiParametrizedDeclaration {}

export interface ShapeProcessingOptions {
  /**
   * This is set when serializing a shape / parameter.
   * It is used to determine which example of the schema to include.
   * 
   * When an example has the `tracked-element` in the source maps then this
   * is used to determine the only examples included to the schema.
   * 
   * Note, the value of the tracked-element can be a list of IDs separated by coma.
   */
  trackedId?: string;
}

/**
 * The selected type
 * 
 * - `server`: server from the AMF model
 * - `custom`: custom base URI value (entered by the user)
 * - `extra`: an application controlled server value selected by the user.
 */
export type ServerType = 'server' | 'custom' | 'extra';
export type SelectionType = 'summary' | 'resource' | 'operation' | 'schema' | 'security' | 'documentation';
/**
 * API navigation layout options.
 * 
 * - tree - creates a tree structure from the endpoints list
 * - natural - behavior consistent with the previous version of the navigation. Creates a tree structure based on the previous endpoints.
 * - natural-sort - as `natural` but endpoints are sorted by name.
 * - off (or none) - just like in the API spec.
 */
export type NavigationLayout = 'tree' | 'natural' | 'natural-sort' | 'off';

export interface SelectableMenuItem {
  /**
   * Whether the item is a selected menu item.
   */
  selected?: boolean;
  /**
   * Whether the item has secondary selection.
   * This happens when a "passive" selection has been applied to the item.
   */
  secondarySelected?: boolean;
}

export interface EditableMenuItem {
  /**
   * When set the name editor for the item is enabled.
   */
  nameEditor?: boolean;
}

export interface ApiEndPointListItem {
  /**
   * The domain id of the endpoint.
   * It may be undefined when the endpoint is created "abstract" endpoint vor the visualization.
   */
  id?: string;
  path: string;
  name?: string;
}

export interface ApiEndPointWithOperationsListItem extends ApiEndPointListItem {
  operations: ApiOperationListItem[];
}

export interface ApiOperationListItem {
  id: string;
  method: string;
  name?: string;
}

export interface ApiEndpointsTreeItem extends ApiEndPointWithOperationsListItem {
  label: string;
  indent: number;
  hasShortPath?: boolean;
  hasChildren?: boolean;
}

export interface ApiSecuritySchemeListItem {
  id: string;
  type: string;
  name?: string;
  displayName?: string;
  types: string[];
}

export declare interface ApiNodeShapeListItem {
  id: string;
  name?: string;
  displayName?: string;
}

export interface EndpointItem extends ApiEndpointsTreeItem, SelectableMenuItem, EditableMenuItem {
  operations: OperationItem[];
}

export interface OperationItem extends ApiOperationListItem, SelectableMenuItem, EditableMenuItem {}
export interface NodeShapeItem extends ApiNodeShapeListItem, SelectableMenuItem, EditableMenuItem {}
export interface SecurityItem extends ApiSecuritySchemeListItem, SelectableMenuItem {}
export interface DocumentationItem extends ApiDocumentation, SelectableMenuItem, EditableMenuItem {}
export type SchemaAddType = 'scalar'|'object'|'file'|'array'|'union';
