export type AccessControlLevel = 'read' | 'comment' | 'write' | 'admin' | 'owner';

/**
 * This is used in the communication with the backend to add/change user's access to the resource.
 */
export interface IUserAccessOperation {
  /**
   * The user id.
   */
  uid: string;
}

export interface IUserAccessAddOperation extends IUserAccessOperation {
  op: "add";
  /**
   * The level that the user has access to.
   */
  value: AccessControlLevel;
}

export interface IUserAccessRemoveOperation extends IUserAccessOperation {
  op: "remove";
}

export type UserAccessOperation = IUserAccessAddOperation | IUserAccessRemoveOperation;

/**
 * The definition of an access control.
 * The user may have access to a workspace so this is the object describing the level of the workspace.
 */
export interface IAccessControl {
  /**
   * The data store key of the referenced object the user has access to.
   */
  key: string;
  /**
   * The level that the user has access to.
   */
  level: AccessControlLevel;
}

export interface IEmail {
  /**
   * When available the email of the user.
   */
  email?: string;
  /**
   * Whether the `email` was verified.
   * Not verified emails should have limited use in the system.
   */
  verified?: boolean;
}

export interface IUserPicture {
  /**
   * When available, the URL to the user's picture image.
   */
  url?: string;
  /**
   * Alternative to the `imageUrl`. When set it is a data URL value of the image.
   */
  data?: string;
}

export const Kind = 'Core#User';

interface BaseUser {
  kind: typeof Kind;
  /**
   * Data store key of the user.
   */
  key: string;
  /**
   * The display name of the user.
   */
  name: string;
  /**
   * When available the email of the user.
   */
  email?: IEmail[];
  /**
   * The user picture to render.
   */
  picture?: IUserPicture;
  /**
   * General purpose tags field.
   */
  tags?: string[];
  /**
   * Optional user locale information.
   */
  locale?: string;
  /**
   * Optional metadata related to the auth provider.
   */
  provider?: unknown;
}

/**
 * Represents a user in the system.
 * This can be embedded in various situations like project's revision history,
 * ACL, Authorization, etc.
 * 
 * Note, the store implementation may have additional fields that support external 
 * identity providers. However, this is not exposed to the user through the API.
 */
export interface IUser extends BaseUser {
  /**
   * Optional metadata related to the auth provider.
   */
  provider?: unknown;
}

/**
 * This object may be created for each user in the system.
 * It describes to which spaces user has access to.
 */
export interface IUserSpaces {
  /**
   * The list of access to the spaces for the user.
   */
  spaces: IAccessControl[];
  /**
   * The data store key of the user that has access to the space.
   * This is also the key of the entry.
   */
  user: string;
}

/**
 * An abstract user object that contains access information to a space.
 */
export interface ISpaceUser extends BaseUser {
  /**
   * The level that the user has access to.
   */
  level: AccessControlLevel;
}
