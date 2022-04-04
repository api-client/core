/**
 * A schema describing the delete action performed on an entity.
 */
export interface IDeletion {
  /**
   * The timestamp of when the entity was deleted.
   */
  time: number;
  /**
   * The id of the user that has deleted the entity.
   */
  user?: string;
  /**
   * User name deleting the entity. May not be set when there's no actual user.
   */
  name?: string;
  /**
   * Whether the deletion was performed by the requesting the data user.
   * 
   * Note for store implementers, this field should not be stored and populated every time the 
   * record is requested.
   */
  byMe: boolean;
}
