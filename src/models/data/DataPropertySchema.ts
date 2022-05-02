export type NumberFormat = 'integer' | 'float' | 'long' | 'double' | 'int32' | 'int64' | 'uint32' | 'uint64' |
  'sint32' | 'sint64' | 'fixed32' | 'fixed64' | 'sfixed32' | 'sfixed64';
export const NumberFormats: NumberFormat[] = [
  'integer', 'float', 'long', 'double', 'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'fixed32', 'fixed64',
  'sfixed32', 'sfixed64'
];

export enum NumberFormatList {
  integer = 'integer',
  float = 'float',
  int32 = 'int32',
  int64 = 'int64',
  uint32 = 'uint32',
  uint64 = 'uint64',
  sint32 = 'sint32',
  sint64 = 'sint64',
  fixed32 = 'fixed32',
  fixed64 = 'fixed64',
  sfixed32 = 'sfixed32',
  sfixed64 = 'sfixed64',
  double = 'double',
}

export type DateFormat = 'rfc3339' | 'rfc2616';
export const DateFormats: DateFormat[] = ['rfc3339', 'rfc2616'];
export enum DateFormatList {
  /**
   * The "date-time" notation of RFC3339
   */
  rfc3339 = 'rfc3339',
  /**
   * The format defined in RFC2616.
   */
  rfc2616 = 'rfc2616',
}

/**
 * The difference between the DataProperty and this is that the `DataProperty` describes the general shape of 
 * the data and `IDataPropertySchema` describes how this property is translated into a specific format
 * (like JSON, Protocol Buffer, XML, etc)
 */
export interface IDataPropertySchema<T> {
  // Common

  /**
   * The default value for the property.
   */
  default?: T;

  /**
   * Enum values for the property.
   */
  enum?: T[];

  /**
   * The example value for the property.
   */
  examples?: T[];

  /**
   * The format of a `number` or `datetime` type.
   */
  format?: NumberFormat | DateFormat;

  /**
   * Minimum length of the string or a file. Value MUST be equal to or greater than 0.
   */
  minLength?: number;
  
  /**
   * The minimum length of the string or a file. Value MUST be equal to or greater than 0.
   */
  maxLength?: number;


  // STRING

  /**
   * Regular expression that this string MUST match.
   */
  pattern?: string;

  // NUMBER

  /**
   * The minimum value.
   */
  minimum?: number;

  /**
   * The maximum value.
   */
  maximum?: number;

  /**
   * A numeric instance is valid against "multipleOf" if the result of dividing the instance by this 
   * value is an integer.
   */
  multipleOf?: number;

  // File

  /**
   * A list of valid content-type strings for the file. The file type `*\/*` is a valid value.
   */
  fileTypes?: string[];

  // XML serialization

  /**
   * Describes XML specific serialization.
   */
  xml?: {
    /**
     * Whether is property should be represented as an attribute of the parent entity.
     * 
     * ```
     * <Person name="John Doe"></Person>
     * ```
     */
    attribute?: boolean;

    /**
     * The name of the attribute or a wrapped property to use when serializing the property.
     * 
     * ```
     * <Person fullName="John Doe"></Person>
     * ```
     */
    name?: string;

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
  }
}
