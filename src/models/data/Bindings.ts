/* eslint-disable import/export */
import { IXmlSerializer } from "../../amf/definitions/Shapes.js";

/**
 * A general schema definition for a property. This is propagated to all bindings (when they support these properties).
 */
export interface IPropertySchema {
  /**
   * The enum values for the property.
   * They are always encoded as strings. The actual type is defined in the `dataType` property.
   */
  enum?: string[];
  /**
   * The default value for the property.
   * This is always encoded as a string. The actual type is defined in the `dataType` property.
   */
  defaultValue?: string;
  /**
   * The example values for the property.
   * They are always encoded as strings. The actual type is defined in the `dataType` property.
   */
  examples?: string[];
}

/**
 * Binding for web API schema types (RAML, OAS)
 * 
 * Data type translation (type to dataType)
 * 
 * - `string` -> `string` with appropriate format
 * - `number` -> `number` with format `float`, `double`, or none for OAS
 * - `integer` -> `int32`, `int64`, or none for OAS
 * - `nil` -> `nullable` property on OAS or `nil` type in RAML
 * - `boolean` -> `boolean` (both the same)
 * - `date` -> 
 * - `any` -> `any` in RAML, `{}` shorthand in OAS
 * 
 * 
 * 
 * The `binary` type
 * 
 * OAS
 * 
 * `http://www.w3.org/2001/XMLSchema#byte` For a file
 * `http://www.w3.org/2001/XMLSchema#base64Binary` for base 64
 * 
 * RAML
 * 
 * HAs it's own AMF shape: FileShape.
 * 
 * The `data` type
 * 
 * OAS
 * 
 * `http://www.w3.org/2001/XMLSchema#date` for a `date`
 * `http://www.w3.org/2001/XMLSchema#dateTime` for a `datetime` and `time`. 
 * Note, OAS has no concept of `time` do we add `time` as the `format which is a custom thing.
 * 
 * RAML
 * 
 * `http://www.w3.org/2001/XMLSchema#date` for a `date` (raml's date-only)
 * `http://a.ml/vocabularies/shapes#dateTimeOnly` for a `time` (raml's time-only)
 * `http://www.w3.org/2001/XMLSchema#dateTime` for a `datetime` (raml's datetime) + format
 * 
 * Note, we won't support RAML's `datetime-only`.
 */
export interface IPropertyWebBindings {
  /**
   * When set it overrides the `name` of the property.
   */
  name?: string;
  /**
   * The data type of the property consistent with AMF's data types.
   * This is not set when the property type  is `binary`
   */
  dataType?: string;
  /**
   * The XML encoding instructions.
   */
  xml?: IXmlSerializer;
  /**
   * Only valid for the `file` property type.
   * The list of file mime types.
   */
  fileTypes?: string[];
  /**
   * The patter to use wit a string scalar
   */
  pattern?: string;
  /**
   * Minimum length of a string scalar or a file type.
   */
  minLength?: number;
  /**
   * Maximum length of a string scalar or a file type.
   */
  maxLength?: number;
  /**
   * Minimum value for a number scalar.
   */
  minimum?: number;
  /**
   * Maximum value for a number scalar.
   */
  maximum?: number;
  /**
   * The multiplier value for a number scalar.
   */
  multipleOf?: number;
  /**
   * When `false`: value ≥ minimum.
   * When `true`: value > minimum.
   */
  exclusiveMinimum?: boolean;
  /**
   * When `false`: value ≤ maximum.
   * When `true`: value < minimum.
   */
  exclusiveMaximum?: boolean;

  format?:
  //
  // OAS 3 formats
  //

  // numbers
  'float' | 'double' | 'int32' | 'int64' |
  // string
  'date' | 'date-time' | 'password' |
  // files
  'binary' | 'byte' |
  // non-standard
  'email' | 'uuid' | 'uri' | 'hostname' | 'ipv4' | 'ipv6' | string |

  // 
  // RAML formats
  // 

  'rfc3339' | 'rfc2616'
}


/**
 * Binding to the protocol buffer.
 * 
 * Data type translation (type to dataType)
 * 
 * - `string` -> `string`
 * - `number` -> `double`, `float`
 * - `integer` -> `int32`, `int64`, `uint32`, `uint64`, `sint32`, `sint64`, `fixed32`, `fixed64`, `sfixed32`, `sfixed64`
 * - `nil` -> No translation.
 * - `boolean` -> `boolean`
 * - `date` -> No translation, we allow string or number (date string or a timestamp with a combination with format but this is not standard for ProtoBuf)
 * - `any` -> No translation, the user has to pick any of the data formats.
 * - `binary` -> `bytes`
 */
export interface IPropertyProtobufBindings {
  /**
   * The field number in a protocol buffer message
   */
  field?: number;
  /**
   * Whether this property (field) is reserved
   */
  reserved?: boolean;
  /**
   * The data type of the property consistent with AMF's data types.
   */
  dataType?: string;
}

export interface IPropertyBindings {
  /**
   * The type of the bindings
   * 
   * - Protocol buffers: `protobuf`
   * - RAML or OAS - `web`
   */
  type: 'protobuf' | 'web';
  /**
   * The definition of the bindings.
   * The bindings tells how to translated the DataProperty to a specific format.
   * For example, it allows to define the `dataType` and `format` for RAML / OAS (via the AMF shapes)
   * or the field number for protocol buffer.
   */
  schema: IPropertyProtobufBindings | IPropertyWebBindings;
}
