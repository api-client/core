/**
 * An object representing a user group.
 */
export interface IGroup {
  /**
   * The key of the group.
   */
  key: string;
  /**
   * The name of the group
   */
  name: string;
  /**
   * The id of the user that created this group.
   */
  owner: string;
  /**
   * The list of users in this group.
   */
  users: string[];
}
