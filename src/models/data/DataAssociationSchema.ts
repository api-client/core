export interface IDataAssociationSchema {
  /**
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
  embedded?: boolean;

  /**
   * Describes XML specific serialization.
   */
  xml?: {
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
