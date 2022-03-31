import v4 from '../../lib/uuid.js';

export const Kind = 'Core#Permission';

export type PermissionType = 'user' | 'group' | 'anyone';
export type PermissionRole = 'owner' | 'reader' | 'commenter' | 'writer';

interface IBasePermission {
  /**
   * The type of the permission. 
   * 
   * - `user` can access the file by a specific user
   * - `group` can access the file by a group of users
   * - `anyone` the object can be searched by anyone who has access to the store.
   * 
   * Note, the `anyone` object does not mean that the end-user sees the file when 
   * listing objects in the store. It means the file can be searched for.
   */
  type: PermissionType;
  /**
   * The id of the owner of the permission.
   * The value depends on the `type`. For the `user` type it is the user id.
   * The `group` means the group id. It is not set when the role is `anyone`.
   */
  owner?: string;
  /**
   * The role granted by this permission.
   */
  role: PermissionRole;
  /**
   * The "pretty" name to render with the permission.
   * 
   * - `user` type - user's full name
   * - `group` type - the name of the group
   * - `anyone` type - no render name
   */
  displayName?: string;
  /**
   * Optional expiration date of the permission. This is the timestamp when the permission expires.
   * When creating / updating the permission the expiration date must:
   * 
   * - be used on a user or a group
   * - the time must be in the future
   */
  expirationTime?: number;
  /**
   * The store id of the user that added this permission.
   */
  addingUser: string;

  /**
   * Whether the permission object is deleted.
   */
  deleted?: boolean;
  /**
   * The timestamp of when the permission was deleted.
   */
  deletedTime?: number;
  /**
   * The id of the user that has deleted the permission.
   */
  deletingUser?: string;
}

/**
 * A schema describing a permission to a store object.
 */
export interface IPermission extends IBasePermission{
  kind: typeof Kind;
  /**
   * The data store key of the permission.
   * This property is generated by the store and is not writable.
   */
  key: string;
}

export class Permission {
  kind = Kind;
  /**
   * The data store key of the permission.
   * This property is generated by the store and is not writable.
   */
  key = '';
  /**
   * The type of the permission. 
   * 
   * - `user` can access the file by a specific user
   * - `group` can access the file by a group of users
   * - `anyone` the object can be searched by anyone who has access to the store.
   * 
   * Note, the `anyone` object does not mean that the end-user sees the file when 
   * listing objects in the store. It means the file can be searched for.
   */
  type: PermissionType = 'user';
  /**
   * The id of the owner of the permission.
   * The value depends on the `type`. For the `user` type it is the user id.
   * The `group` means the group id. It is not set when the role is `anyone`.
   */
  owner?: string;
  /**
   * The role granted by this permission.
   */
  role: PermissionRole = 'reader';
  /**
   * The "pretty" name to render with the permission.
   * 
   * - `user` type - user's full name
   * - `group` type - the name of the group
   * - `anyone` type - no render name
   */
  displayName?: string;
  /**
   * Optional expiration date of the permission. This is the timestamp when the permission expires.
   * When creating / updating the permission the expiration date must:
   * 
   * - be used on a user or a group
   * - the time must be in the future
   */
  expirationTime?: number;

  /**
   * The store id of the user that added this permission.
   */
  addingUser: string = '';

  /**
   * Whether the file object is deleted.
   */
  deleted?: boolean;
  /**
   * The timestamp of when the file was deleted.
   */
  deletedTime?: number;
  /**
   * The id of the user that has deleted the file.
   */
  deletingUser?: string;

  /**
   * Creates a Permission object for a user.
   * 
   * @param role The user role to set.
   * @param user The user id that has the role.
   */
  static fromUserRole(role: PermissionRole, user: string, addingUser: string): Permission {
    const init: IPermission = {
      key: v4(),
      kind: Kind,
      owner: user,
      role,
      type: 'user',
      addingUser,
    };
    return new Permission(init);
  }

  /**
   * Creates a Permission object for a group.
   * 
   * @param role The group role to set.
   * @param group The group id that has the role.
   */
  static fromGroupRole(role: PermissionRole, group: string, addingUser: string): Permission {
    const init: IPermission = {
      key: v4(),
      kind: Kind,
      owner: group,
      role,
      type: 'group',
      addingUser,
    };
    return new Permission(init);
  }

  /**
   * Creates a Permission object for a group.
   * 
   * @param role The group role to set.
   * @param group The group id that has the role.
   */
  static fromAnyoneRole(role: PermissionRole, addingUser: string): Permission {
    const init: IPermission = {
      key: v4(),
      kind: Kind,
      role,
      type: 'anyone',
      addingUser,
    };
    return new Permission(init);
  }

  /**
   * Creates a permission object from other than key and kind values.
   */
  static fromValues(init: IBasePermission): Permission {
    return new Permission({
      ...init,
      key: v4(),
      kind: Kind,
    });
  }

  constructor(input?: string | IPermission) {
    let init: IPermission;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        owner: '',
        role: 'reader',
        type: 'user',
        addingUser: '',
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the environment is not a space. 
   */
  new(init: IPermission): void {
    if (!Permission.isPermission(init)) {
      throw new Error(`Not a permission.`);
    }
    const { key = v4(), owner, role, type, displayName, expirationTime, addingUser, deleted, deletedTime, deletingUser } = init;
    this.kind = Kind;
    this.key = key;
    this.owner = owner;
    this.role = role;
    this.type = type;
    this.addingUser = addingUser;
    if (displayName) {
      this.displayName = displayName;
    } else {
      this.displayName = undefined;
    }
    if (typeof expirationTime === 'number') {
      this.expirationTime = expirationTime;
    } else {
      this.expirationTime = undefined;
    }
    if (typeof deleted === 'boolean') {
      this.deleted = deleted;
      this.deletedTime = deletedTime;
      this.deletingUser = deletingUser;
    } else {
      this.deleted = undefined;
      this.deletedTime = undefined;
      this.deletingUser = undefined;
    }
  }

  /**
   * Checks whether the input is a definition of an user space.
   */
  static isPermission(input: unknown): boolean {
    const typed = input as IPermission;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IPermission {
    const result: IPermission = {
      kind: Kind,
      key: this.key,
      role: this.role,
      type: this.type,
      addingUser: this.addingUser,
    };
    if (this.owner) {
      result.owner = this.owner;
    }
    if (this.displayName) {
      result.displayName = this.displayName;
    }
    if (this.expirationTime) {
      result.expirationTime = this.expirationTime;
    }
    if (typeof this.deleted === 'boolean') {
      result.deleted = this.deleted;

      if (this.deletedTime) {
        result.deletedTime = this.deletedTime;
      }
      if (this.deletingUser) {
        result.deletingUser = this.deletingUser;
      }
    }
    return result;
  }
}

/**
 * This is used in the communication with the backend to add/change user's access to the resource.
 */
export interface IAccessOperation {
  /**
   * The user or group id. Not populated for `anyone` type.
   */
  id?: string;
  /**
   * The permission type
   */
  type: PermissionType;
}

export interface IAccessAddOperation extends IAccessOperation {
  op: "add";
  /**
   * The level that the user or the group has access to.
   */
  value: PermissionRole;
  /**
   * The timestamp when the permission expires.
   */
  expirationTime?: number;
}

export interface IAccessRemoveOperation extends IAccessOperation {
  op: "remove";
}

export type AccessOperation = IAccessAddOperation | IAccessRemoveOperation;
