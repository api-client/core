import { AccessControlLevel } from "./User.js";
export const Kind = 'ARC#Space';
/**
 * A definition of the working space for users.
 * 
 * A working space is a logical container in the data store
 * created by the system users, where they can store their projects and other data.
 */
export interface IWorkspace {
  /**
   * The space identifier.
   */
  key: string;
  /**
   * The name of the space
   */
  name: string;
  /**
   * The list of users added to this space. May not be set when owner did not add anyone to the space.
   */
  users?: string[];
  /**
   * The owner of this space. The id of the User object.
   * Set to `default` when there are no users in the system (no authentication).
   */
  owner: string;
  /**
   * The list of keys of projects added to the workspace.
   */
  projects: string[];
}

/**
 * The workspace information set to a specific client what contains user specific data.
 */
export interface IUserWorkspace extends IWorkspace {
  access: AccessControlLevel;
}
