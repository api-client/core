import { IPermission } from './Permission.js';
import { IModification } from './Modification.js';
import { IDeletion } from './Deletion.js';
import { IUser, Kind as UserKind } from './User.js';
import { IThing, Thing } from '../Thing.js';
import v4 from '../../lib/uuid.js';

export const DefaultOwner = 'default';

export interface IStoredFile {
  /**
   * The kind of the File
   */
  kind: string;
  /**
   * The identifier of the entity
   */
  key: string;
  /**
   * The projects's meta info.
   */
  info: IThing;
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
   * The information about the delete information.
   * Always set when the `delete` is true.
   */
  deletedInfo?: IDeletion;
  /**
   * The owner of this object. The id of the User object.
   */
  owner: string;
  /**
   * The last modification made to this file.
   */
  lastModified: IModification;
  /**
   * An arbitrary list of labels applied to the file.
   */
  labels?: string[];
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
   * The kind of the File
   */
  kind = '';
  /**
   * The identifier of the entity
   */
  key = '';
  /**
   * The name of the environment.
   */
  info: Thing = Thing.fromName('');
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
   * The information about the delete information.
   * Always set when the `delete` is true.
   */
  deletedInfo?: IDeletion;
  /**
   * The owner of this space. The id of the User object.
   * Set to `default` when there are no users in the system (no authentication).
   */
  owner = DefaultOwner;
  /**
   * The last modification made to this file.
   */
  lastModified: IModification = { user: '', time: 0, byMe: false };
  /**
   * An arbitrary list of labels applied to the file.
   */
  labels?: string[];

  new(init: IStoredFile): void {
    const { key = v4(), info, kind, parents=[], permissionIds=[], deleted, deletedInfo, owner = DefaultOwner, lastModified, labels } = init;
    this.key = key;
    this.kind = kind;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    this.parents = parents;
    this.permissionIds = permissionIds;
    this.owner = owner;
    this.lastModified = lastModified || { user: '', time: 0, byMe: false };
    if (typeof deleted === 'boolean') {
      this.deleted = deleted;
      this.deletedInfo = deletedInfo;
    } else {
      this.deleted = undefined;
      this.deletedInfo = undefined;
    }
    if (Array.isArray(labels)) {
      this.labels = labels;
    } else {
      this.labels = undefined; 
    }
  }

  toJSON(): IStoredFile {
    const { owner = DefaultOwner } = this;
    const result: IStoredFile = {
      key: this.key,
      kind: this.kind,
      info: this.info.toJSON(),
      parents: this.parents,
      permissionIds: this.permissionIds,
      lastModified: this.lastModified,
      owner,
    };
    if (this.deleted) {
      result.deleted = this.deleted;
      result.deletedInfo = this.deletedInfo;
    }
    if (Array.isArray(this.labels)) {
      result.labels = this.labels;
    }
    return result;
  }

  /**
   * Updates the "lastModified" value.
   * A helper method for a common task.
   * 
   * @param user The user that modifies the entity.
   */
  setLastModified(user: IUser): void {
    if (!user) {
      throw new Error(`The user is required.`);
    }
    if (user.kind !== UserKind) {
      throw new Error(`Invalid value for the user when setting "lastModified".`);
    }
    this.lastModified = {
      byMe: false,
      time: Date.now(),
      user: user.key,
      name: user.name,
    };
  }

  /**
   * Adds a label to the list of labels.
   * 
   * It makes sure the value is a valid, non-empty string and the `labels` array is set.
   * 
   * It does nothing when the label already exists.
   * 
   * @param label The label to set.
   */
  addLabel(label: string): void {
    if (typeof label !== 'string') {
      throw new Error(`The label must be a string.`);
    }
    if (!label.trim()) {
      throw new Error(`The label is required.`);
    }
    if (!Array.isArray(this.labels)) {
      this.labels = [];
    }
    if (this.labels.includes(label)) {
      return;
    }
    this.labels.push(label);
  }

  /**
   * Marks the entity as deleted.
   * 
   * A helper method for a common task.
   * 
   * @param user The user that deletes the entity.
   */
  setDeleted(user: IUser): void {
    if (!user) {
      throw new Error(`The user is required.`);
    }
    if (user.kind !== UserKind) {
      throw new Error(`Invalid value for the user when setting "lastModified".`);
    }
    this.deleted = true;
    this.deletedInfo = {
      byMe: false,
      time: Date.now(),
      user: user.key,
      name: user.name,
    };
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
