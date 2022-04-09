import { IPermission, Permission, PermissionRole } from './Permission.js';
import { IModification } from './Modification.js';
import { IDeletion } from './Deletion.js';
import { IUser, Kind as UserKind } from './User.js';
import { IThing, Thing } from '../Thing.js';
import v4 from '../../lib/uuid.js';
import { ICapabilities } from './Capabilities.js';

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
  /**
   * This is populated when reading a file from the store.
   * A list of actions the user can perform on the file.
   * 
   * This is a readonly field and it is ignored when creating / updating the file.
   */
  capabilities?: ICapabilities;
  /**
   * The color of the icon to render for this file in the file explorer.
   * This should be a hex format, e.g.: #c00 for red.
   */
  iconColor?: string;
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

const parentsSymbol = Symbol('parents');
const deletedSymbol = Symbol('deleted');
const deletedInfoSymbol = Symbol('deletedInfo');
const ownerSymbol = Symbol('owner');
const lastModifiedSymbol = Symbol('lastModified');
const capabilitiesSymbol = Symbol('capabilities');
const permissionsSymbol = Symbol('permissions');
const permissionIdsSymbol = Symbol('permissionIds');

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
  
  [parentsSymbol]: string[] = [];
  
  /**
   * The list of parents of the object. It is an ordered list of parents
   * from the top (first element) to the lowest parent in the tree (last element).
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  get parents(): string[] {
    return this[parentsSymbol];
  }

  [permissionIdsSymbol]: ReadonlyArray<string> = [];

  /**
   * The list of permissions to this file object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  get permissionIds(): ReadonlyArray<string> {
    return this[permissionIdsSymbol];
  }

  [deletedSymbol]?: boolean;

  /**
   * Whether the file object is deleted.
   */
  get deleted(): boolean {
    return this[deletedSymbol] || false;
  }

  [deletedInfoSymbol]?: Readonly<IDeletion>;

  /**
   * The information about the delete information.
   * Always set when the `delete` is true.
   */
  get deletedInfo(): Readonly<IDeletion> | undefined {
    return this[deletedInfoSymbol];
  }

  [ownerSymbol]: string = DefaultOwner;

  /**
   * The owner of this space. The id of the User object.
   * Set to `default` when there are no users in the system (no authentication).
   */
  get owner(): string {
    return this[ownerSymbol];
  }

  [lastModifiedSymbol]: Readonly<IModification> = { user: '', time: 0, byMe: false };

  /**
   * The last modification made to this file.
   */
  get lastModified(): Readonly<IModification> {
    return this[lastModifiedSymbol];
  }

  /**
   * An arbitrary list of labels applied to the file.
   */
  labels?: string[];

  [capabilitiesSymbol]?: Readonly<ICapabilities>;

  /**
   * This is populated when reading a file from the store.
   * A list of actions the user can perform on the file.
   * 
   * This is a readonly field and it is ignored when creating / updating the file.
   */
  get capabilities(): Readonly<ICapabilities> | undefined {
    return this[capabilitiesSymbol];
  }

  /**
   * The color of the icon to render for this file in the file explorer.
   */
  iconColor?: string;

  new(init: IStoredFile): void {
    const { key = v4(), info, kind, parents=[], permissionIds=[], deleted, deletedInfo, owner = DefaultOwner, lastModified, labels, iconColor } = init;
    this.key = key;
    this.kind = kind;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    this[parentsSymbol] = [...parents];
    this[permissionIdsSymbol] = [...permissionIds];
    this[ownerSymbol] = owner;
    this[lastModifiedSymbol] = lastModified ? Object.freeze({ ...lastModified }) : Object.freeze({ user: '', time: 0, byMe: false });
    if (typeof deleted === 'boolean') {
      this[deletedSymbol] = deleted;
      this[deletedInfoSymbol] = deletedInfo ? Object.freeze({ ...deletedInfo }) : undefined;
    } else {
      this[deletedSymbol] = undefined;
      this[deletedInfoSymbol] = undefined;
    }
    if (Array.isArray(labels)) {
      this.labels = [...labels];
    } else {
      this.labels = undefined; 
    }
    if (iconColor) {
      this.iconColor = iconColor;
    } else {
      this.iconColor = undefined;
    }
  }

  toJSON(): IStoredFile {
    const { owner = DefaultOwner } = this;
    const result: IStoredFile = {
      key: this.key,
      kind: this.kind,
      info: this.info.toJSON(),
      parents: [...this.parents],
      permissionIds: [...this.permissionIds],
      lastModified: { ...this.lastModified },
      owner,
    };
    if (this.deleted) {
      result.deleted = this.deleted;
      result.deletedInfo = { ...this.deletedInfo } as IDeletion;
    }
    if (Array.isArray(this.labels)) {
      result.labels = [...this.labels];
    }
    if (this.iconColor) {
      result.iconColor = this.iconColor;
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
    this[lastModifiedSymbol] = {
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
    this[deletedSymbol] = true;
    this[deletedInfoSymbol] = {
      byMe: false,
      time: Date.now(),
      user: user.key,
      name: user.name,
    };
  }

  /**
   * Creates the Capabilities object for a file giving user level.
   * 
   * @param file The file object to create the capabilities to. The object is not mutated.
   * @param role The user role to the file.
   */
  static createFileCapabilities(file: IStoredFile | StoredFile, role?: PermissionRole): ICapabilities {
    const isCommenter = Permission.hasRole('commenter', role);
    const isOwner = Permission.hasRole('owner', role);
    const isReader = Permission.hasRole('reader', role);
    const isWriter = Permission.hasRole('writer', role);
    const result: ICapabilities = {
      canEdit: isWriter,
      canComment: isCommenter,
      // This is open to discussion. Technically sharing is writing to a file resource.
      // However, should we allow to share the file by a user that has read access?
      canShare: isWriter,
      // not yet supported in the store
      canCopy: false,
      // not yet supported in the store. Currently the user can read revisions when they have read access to the file.
      canReadRevisions: isReader,
      canAddChildren: false,
      // debatable, can writer permanently delete a file?
      canDelete: isOwner,
      canListChildren: false,
      canRename: isWriter,
      // debatable, can writer trash a file?
      canTrash: isOwner,
      canUntrash: isOwner,
      canReadMedia: false,
    };
    // Do not use the `WorkspaceKind` reference here as it's circular and creates
    // an error.
    if (file.kind === 'Core#Space' && isWriter) {
      result.canAddChildren = true;
    }
    if (file.kind === 'Core#Space') {
      result.canListChildren = isReader;
    }
    if (file.kind !== 'Core#Space') {
      result.canReadMedia = isReader;
    }
    return result;
  }

  createFileCapabilities(role: PermissionRole): ICapabilities {
    return File.createFileCapabilities(this, role);
  }

  /**
   * Mutates the file object by setting the `byMe` properties (on deleted and modified info)
   * 
   * Note, this can be done only on file schema (IFile). The `File` object has
   * this properties frozen.
   * 
   * @param file The file to mutate
   * @param user The user key to compare.
   */
  static updateByMeMeta(file: IFile, user: string): void {
    if (file.deletedInfo) {
      file.deletedInfo.byMe = file.deletedInfo.user === user;
    }
    if (file.lastModified) {
      file.lastModified.byMe = file.lastModified.user === user;
    }
  }
}

export class File extends StoredFile {
  [permissionsSymbol]: ReadonlyArray<IPermission> = [];

  /**
   * Populated by the server when reading the file. The list of permissions to the object.
   * 
   * This property cannot be manipulated directly by the client. Should be treated as 
   * opaque value.
   */
  get permissions(): ReadonlyArray<IPermission> {
    return this[permissionsSymbol];
  }
  
  new(init: IFile): void {
    super.new(init);
    const { permissions=[] } = init;
    this[permissionsSymbol] = permissions.map(i => ({ ...i }));
  }

  toJSON(): IFile {
    const result: IFile = {
      ...super.toJSON(),
      permissions: [...this.permissions],
    };
    return result;
  }
}
