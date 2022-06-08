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
   * Alternative to the `url`. When set it is a data URL value of the image.
   */
  data?: string;
}

export const Kind = 'Core#User';

interface BaseUser {
  kind: typeof Kind;
  /**
   * The data store key of the user.
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
   * A general purpose tags field.
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
  /**
   * Whether the user is deleted from the system.
   */
  deleted?: boolean;
  /**
   * The timestamp of when the user was deleted.
   */
  deletedTime?: number;
  /**
   * The id of the user that deleted the user.
   */
  deletingUser?: string;
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
