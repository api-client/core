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
}
