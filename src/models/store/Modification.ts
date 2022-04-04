/**
 * Information about a modification of a File.
 */
export interface IModification {
  /**
   * The key of the user modifying the record.
   */
  user: string;
  /**
   * User name modifying the record. May not be set when there's no actual user.
   */
  name?: string;
  /**
   * Whether the modification was performed by the requesting the data user.
   * 
   * Note for store implementers, this field should not be stored and populated every time the 
   * record is requested.
   */
  byMe: boolean;
  /**
   * A timestamp when the object was modified.
   */
  time: number;
}
