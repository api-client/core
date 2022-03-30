import { IPermission } from './Permission.js';

export interface IStoredFile {
  /**
   * The list of parents of the object. It is an ordered list of parents
   * from the top (first element) to the lowest parent in the tree (last element).
   * 
   * After creating the object, this property cannot be manipulated directly by the client. 
   * Should be treated as opaque value.
   */
  parents: string[];
  /**
   * The list of permissions to this file object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  permissionIds: string[];
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
}

/**
 * An interface describing an object in the data store that
 * describes a file or an object that can be treated as a file or a folder.
 */
export interface IFile extends IStoredFile {
  /**
   * Populated by the server when reading the file. The list of permissions to the object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   * 
   * Data store implementation note, this is not stored in the store but it is populated
   * when reading the object.
   */
  permissions: IPermission[];
}

export class StoredFile {
  /**
   * The list of parents of the object. It is an ordered list of parents
   * from the top (first element) to the lowest parent in the tree (last element).
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  parents: string[] = [];
  /**
   * The list of permissions to this file object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  permissionIds: string[] = [];
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

  new(init: IStoredFile): void {
    const { parents=[], permissionIds=[], deleted, deletedTime, deletingUser } = init;
    this.parents = parents;
    this.permissionIds = permissionIds;
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

  toJSON(): IStoredFile {
    const result: IStoredFile = {
      parents: this.parents,
      permissionIds: this.permissionIds,
    };
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

export class File extends StoredFile {
  /**
   * Populated by the server when reading the file. The list of permissions to the object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  permissions: IPermission[] = [];
  
  new(init: IFile): void {
    super.new(init);
    const { permissions=[] } = init;
    this.permissions = permissions;
  }

  toJSON(): IFile {
    const result: IFile = {
      ...super.toJSON(),
      permissions: this.permissions,
    };
    return result;
  }
}
