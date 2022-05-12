import { AnyTypes, ArrayTypes, FileTypes, NodeTypes, PropertyTypes, ScalarTypes, TupleTypes, UnionTypes, XmlSerializationTypes } from '../AmfTypes.js';
import { ApiDocumentation, ApiDocumentSourceMaps } from './Api.js';
import { IDomainProperty } from './Base.js';

export type IShapeUnion = IScalarShape | INodeShape | IUnionShape | IFileShape | ISchemaShape | IAnyShape | IArrayShape | ITupleShape | IRecursiveShape;

export interface IAssociationShape {
  /**
   * This is custom property not available in AMF and used with data associations.
   * 
   * Whether the target entity should be embedded under the property name.
   * When false, this association is just an information that one entity depend on another.
   * When true, it changes the definition of the schema having this association to 
   * add the target schema properties inline with this property.
   * 
   * **When true**
   * 
   * ```javascript
   * // generated schema for `address` association
   * {
   *  "name": "example value",
   *  "address": {
   *    "city": "example value",
   *    ...
   *  }
   * }
   * ```
   * 
   * **When false**
   * 
   * ```javascript
   * // generated schema for `address` association
   * {
   *  "name": "example value",
   *  "address": "the key of the referenced schema"
   * }
   * ```
   */
  linked?: boolean;
  /**
   * When the association has multiple targets the union type should be
   * set to describe which union this is.
   * 
   * Possible values are:
   * 
   * - allOf - To validate against `allOf`, the given data must be valid against all of the given sub-schemas. When generating, it's a sum of all properties.
   * - anyOf - To validate against `anyOf`, the given data must be valid against any (one or more) of the given sub-schemas. When generation a schema, it takes first union schema.
   * - oneOf - To validate against `oneOf`, the given data must be valid against exactly one of the given sub-schemas. It behaves the same as `oneOf` when generating a schema
   * - not - The `not` keyword declares that an instance validates if it doesn’t validate against the given sub-schema. It has no use when generating a schema.
   * 
   * @default anyOf
   */
  unionType?: 'allOf' | 'anyOf' | 'oneOf' | 'not';
}

export interface IDataExample extends IDomainProperty {
  name?: string;
  displayName?: string;
  description?: string;
  /**
   * This is the "raw" property of AMF
   */
  value?: string;
  structuredValue?: IDataNodeUnion;
  strict: boolean;
  mediaType?: string;
  location?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export function xmlSerializer(id: string): IXmlSerializer {
  return {
    id: `xml-serializer-${id}`,
    types: XmlSerializationTypes,
    customDomainProperties: [],
  };
}

export function anyShape(id: string): IAnyShape {
  const result: IAnyShape = {
    id,
    types: AnyTypes,
    values: [], 
    inherits: [], 
    or: [], 
    and: [], 
    xone: [],
    examples: [],
    xmlSerialization: xmlSerializer(id),
    customDomainProperties: [],
  };
  return result;
}

export function nodeShape(id: string): INodeShape {
  const result = anyShape(id);
  result.types = NodeTypes;
  result.id = `node-shape-${id}`;
  return { 
    ...result, 
    properties: [], 
    dependencies: [], 
    customShapeProperties: [], 
    customShapePropertyDefinitions: [],
  };
}

export function scalarShape(id: string): IScalarShape {
  const result = anyShape(id);
  result.id = `scalar-shape-${id}`;
  result.types = ScalarTypes;
  return result;
}

export function unionShape(id: string): IUnionShape {
  const result = anyShape(id);
  result.id = `union-shape-${id}`;
  result.types = UnionTypes;
  return { ...result, anyOf: [] };
}

export function fileShape(id: string): IFileShape {
  const result = anyShape(id);
  result.id = `file-shape-${id}`;
  result.types = FileTypes;
  return result;
}

export function arrayShape(id: string): IArrayShape {
  const result = anyShape(id);
  result.id = `array-shape-${id}`;
  result.types = ArrayTypes;
  return result;
}

export function tupleShape(id: string): ITupleShape {
  const result = anyShape(id);
  result.id = `tuple-shape-${id}`;
  result.types = TupleTypes;
  return { ...result, items: [] };
}

export function propertyShape(id: string): IPropertyShape {
  const result = anyShape(id);
  result.types = PropertyTypes;
  return result;
}

export interface IShape extends IDomainProperty {
  /**
   * Enum values for this shape.
   */
  values: IDataNodeUnion[];
  /**
   * The list of shapes that this shape inherits from
   */
  inherits: IShapeUnion[];
  /**
   * The `anyOf` union type.
   */
  or: IShapeUnion[];
  /**
   * The `allOf` union type.
   */
  and: IShapeUnion[];
  /**
   * The `oneOf` union type.
   */
  xone: IShapeUnion[];
  /**
   * The name of the shape in the system.
   */
  name?: string;
  /**
   * The display name for the shape in the UI.
   */
  displayName?: string;
  /**
   * The description of the shape.
   */
  description?: string;
  /**
   * The default value encoded as a string
   */
  defaultValueStr?: string;
  /**
   * The description of the default value of the shape.
   */
  defaultValue?: IDataNodeUnion;
  /**
   * Whether the shape is deprecated.
   */
  deprecated?: boolean;
  /**
   * Whether the shape is a read only shape (disallow writes to the value)
   */
  readOnly?: boolean;
  /**
   * Whether the shape can only be written to (disallow reading the value)
   */
  writeOnly?: boolean;
  not?: IShapeUnion;
  /**
   * A label that appeared on a link.
   */
  linkLabel?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

/**
 * A property of an API operation.
 */
export interface IPropertyShape<T = IShapeUnion> extends IShape {
  /**
   * The path of the property. Essentially, it is link generated by the AMF library
   * where the fragment part is the name of the property.
   */
  path?: string;
  /**
   * The parameter shape definition
   */
  range?: T;
  /**
   * When > 0 then the parameter is required.
   */
  minCount?: number;
  maxCount?: number;
}

export interface IAnyShape extends IShape {
  documentation?: ApiDocumentation;
  /**
   * Description of how the shape should be serialized as XML.
   */
  xmlSerialization: IXmlSerializer;
  /**
   * Examples defined for the shape.
   */
  examples: IDataExample[];
}

/**
 * Describes an object shape.
 */
export interface INodeShape extends IAnyShape {
  minProperties?: number;
  maxProperties?: number;
  closed?: boolean;
  customShapeProperties: string[];
  customShapePropertyDefinitions: string[];
  discriminator?: string;
  discriminatorValue?: string;
  properties: IPropertyShape[];
  dependencies: string[];
}

export interface IXmlSerializer extends IDomainProperty {
  /**
   * Whether this property should be represented as an attribute of the parent shape.
   * 
   * ```
   * <Person name="John Doe"></Person>
   * ```
   */
  attribute?: boolean;
  /**
   * When the property is an array (has the `multiple` set to true)
   * then it tells that the list of values should be wrapped with a parent
   * element:
   * 
   * ```
   * <Person>
   *  <Person fullName="John Doe"></Person>
   * </Person>
   * ```
   * 
   * Use this with the combination with `name` to describe the name of the wrapped
   * element
   * 
   * ```
   * <people>
   *  <Person fullName="John Doe"></Person>
   * </people>
   * ```
   * 
   * Note, this is mutually exclusive with `attribute`.
   */
  wrapped?: boolean;
  /**
   * The name of the attribute or a wrapped property to use when serializing the property.
   * 
   * Attribute name
   * ```xml
   * <Person fullName="John Doe"></Person>
   * ```
   * 
   * Wrapped name
   * ```xml
   * <people>
   *  <Person name="John Doe"></Person>
   * </people>
   * ```
   */
  name?: string;
  /**
   * The XML namespace to use.
   * 
   * ```xml
   * <Person ns:name="John Doe"></Person>
   * ```
   */
  namespace?: string;
  /**
   * Name prefix
   * 
   * ```xml
   * <ns:Person name="John Doe"></ns:Person>
   * ```
   */
  prefix?: string;
  sourceMaps?: ApiDocumentSourceMaps;
}

export interface IScalarShape extends IAnyShape {
  dataType?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  format?: string;
  multipleOf?: number;
}

export interface IFileShape extends IAnyShape {
  fileTypes?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  format?: string;
  multipleOf?: number;
}

export interface ISchemaShape extends IAnyShape {
  mediaType?: string;
  raw?: string;
}

export interface IUnionShape extends IAnyShape {
  anyOf: IShapeUnion[];
}

export interface IDataArrangeShape extends IAnyShape {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export interface IArrayShape<T = IShapeUnion> extends IDataArrangeShape {
  items?: T;
}

export interface ITupleShape<T = IShapeUnion> extends IDataArrangeShape {
  items: T[];
  additionalItems?: boolean;
}

export interface IRecursiveShape extends IShape {
  fixPoint: string;
}

export interface IDataNode extends IDomainProperty {
  name?: string;
}

export interface IObjectNode extends IDataNode {
  properties: { [key: string]: IDataNodeUnion };
}

export interface IScalarNode extends IDataNode {
  value?: string;
  dataType?: string;
}

export interface IArrayNode extends IDataNode {
  members: IDataNodeUnion[];
}

export type IDataNodeUnion = IDataNode | IObjectNode | IScalarNode | IArrayNode;
