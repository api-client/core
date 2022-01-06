import { ProjectParent } from './ProjectParent.js';
import { IProjectDefinitionProperty } from './ProjectDefinitionProperty.js';
import { Environment, IEnvironment } from './Environment.js';
import { ProjectItem, IProjectItem } from './ProjectItem.js';
import { ProjectRequest, Kind as ProjectRequestKind, IProjectRequest } from './ProjectRequest.js';
import { HttpProject } from './HttpProject.js';
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import v4 from '../lib/uuid.js';
import * as PatchUtils from './PatchUtils.js';

export const Kind = 'ARC#ProjectFolder';
export const DefaultFolderName = 'New folder';

export interface IFolderAddOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IFolderCloneOptions {
  /**
   * By default it revalidates (re-creates) keys in the folder.
   * Set this to `true` to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
  /**
   * By default it attaches the folder to the same parent as the original folder.
   * Set this to `true` when moving a folder between projects to prevent adding the folder to the project. 
   * 
   * Note, the folder still have a reference to the original project. You need to update the `project` property.
   * 
   * Note, this also applies to all requests when included in the clone.
   */
  withoutAttach?: boolean;
  /**
   * By default it clones the folder with all requests in it.
   * Set this to `true` to skip copying the requests along with the folder.
   */
  withoutRequests?: boolean;
  /**
   * By default it clones the folder with all folders in it.
   * Set this to `true` to skip copying the folders along with the folder.
   */
  withoutFolders?: boolean;
}

export interface IProjectFolder extends IProjectDefinitionProperty {
  kind: typeof Kind;
  /**
   * The identifier of the folder.
   */
  key: string;
  /**
   * Folder meta
   */
  info: IThing;
  /**
   * The ordered list of HTTP requests / folders in the projects.
   * The UI uses this to manipulate the view without changing the definitions.
   */
  items: IProjectItem[];
  /**
   * The environments defined for this project.
   * If not set it is inherited from the parent.
   */
  environments?: IEnvironment[];
  /**
   * Timestamp when the folder was last updated.
   */
  updated: number;
  /**
   * Timestamp when the folder was created.
   */
  created: number;
}

/**
 * Represents a folder, a group of requests or other folders, in a folder.
 */
export class ProjectFolder extends ProjectParent {
  /**
   * The default name of the folder.
   */
  static get defaultName(): string {
    return DefaultFolderName;
  }

  kind = Kind;
  /**
   * A reference to the top level project object.
   */
  project: HttpProject;
  /**
   * Timestamp when the folder was last updated.
   */
  updated = 0;
  /**
   * Timestamp when the folder was created.
   */
  created = 0;

  constructor(project: HttpProject, input?: string | IProjectFolder) {
    super();
    this.project = project;
    let init: IProjectFolder;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      const now: number = Date.now();
      init = {
        kind: Kind,
        info: {
          kind: ThingKind,
          name: DefaultFolderName,
        },
        created: now,
        updated: now,
        items: [],
        key: v4(),
      };
    }
    this.new(init);
  }

  /**
   * Creates a new project folder clearing anything that is so far defined.
   * 
   * Note, this throws an error when the project folder is not an ARC project folder.
   */
  new(init: IProjectFolder): void {
    if (!ProjectFolder.isProjectFolder(init)) {
      throw new Error(`Not an ARC project folder.`);
    }
    const { key = v4(), created = Date.now(), updated = Date.now(), items, environments, info } = init;
    this.kind = Kind;
    this.key = key;
    this.created = created;
    this.updated = updated;
    if (Array.isArray(items)) {
      this.items = items.map(i => new ProjectItem(this.project, i));
    } else {
      this.items = [];
    }
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = new Thing({ kind: ThingKind, name: DefaultFolderName });
    }
    if (Array.isArray(environments)) {
      this.environments = environments.map(i => new Environment(i));
    } else {
      this.environments = [];
    }
  }

  /**
   * Checks whether the input is a definition of a project folder.
   */
  static isProjectFolder(input: unknown): boolean {
    const typed = input as IProjectFolder;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IProjectFolder {
    const result: IProjectFolder = {
      kind: Kind,
      info: this.info.toJSON(),
      key: this.key,
      created: this.created,
      updated: this.updated,
      items: [],
      environments: [],
    };
    if (Array.isArray(this.items)) {
      result.items = this.items.map(i => i.toJSON());
    }
    if (Array.isArray(this.environments)) {
      result.environments = this.environments.map(i => i.toJSON());
    }
    return result;
  }

  /**
   * Creates a new ProjectFolder object from a name.
   * @param project The top-most project.
   * @param name The name to set.
   */
  static fromName(project: HttpProject, name = DefaultFolderName): ProjectFolder {
    const now = Date.now();
    const key = v4();
    const info = new Thing({ kind: ThingKind, name });
    const definition = new ProjectFolder(project, {
      key,
      created: now,
      updated: now,
      items: [],
      environments: [],
      kind: Kind,
      info: info.toJSON(),
    });
    return definition;
  }

  /**
   * Appends an instance of a folder to a project.
   * 
   * @param folder The folder to add to this project.
   * @returns The added folder.
   */
  addFolder(folder: ProjectFolder): ProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @returns The added folder.
   */
  addFolder(folder: IProjectFolder): ProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string): ProjectFolder;

  /**
   * Appends a new folder to the folder. It updates the project to add the request definition.
   * @param name The name to set. Optional.
   * @returns The key of newly inserted folder.
   */
  addFolder(name: string | IProjectFolder | ProjectFolder | undefined): ProjectFolder {
    return this.project.addFolder(name as ProjectFolder, { parent: this.key });
  }

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param url The URL of the request.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(url: string, opts?: IFolderAddOptions): ProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IProjectRequest | ProjectRequest, opts?: IFolderAddOptions): ProjectRequest;

  /**
   * Appends a new request to the folder. It updates the project to add the request definition.
   * @param request The request to append to the folder.
   * @returns The key of newly inserted request.
   */
  addRequest(request: IProjectRequest | ProjectRequest | string, opts: IFolderAddOptions = {}): ProjectRequest {
    const addOptions = { parent: this.key, ...opts };
    if (typeof request === 'string') {
      return this.project.addRequest(request, addOptions);
    }
    return this.project.addRequest(request, addOptions);
  }

  /**
   * Lists items (not the actual definitions!) that are folders.
   */
  listFolderItems(): ProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === Kind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): ProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ProjectRequestKind);
  }

  /**
   * Lists folders in this folder.
   */
  listFolders(): ProjectFolder[] {
    return this.project.listFolders(this.key);
  }

  /**
   * Lists requests in this folder.
   */
  listRequests(): ProjectRequest[] {
    return this.project.listRequests(this.key);
  }

  /**
   * Patches the folder.
   * @param operation The operation to perform.
   * @param path The path to the value to update.
   * @param value Optional, the value to set.
   */
  patch(operation: PatchUtils.PatchOperation, path: string, value?: unknown): void {
    if (!PatchUtils.patchOperations.includes(operation)) {
      throw new Error(`Unknown operation: ${operation}.`);
    }
    if (PatchUtils.valueRequiredOperations.includes(operation) && typeof value === 'undefined') {
      throw new Error(PatchUtils.TXT_value_required);
    }
    const parts = path.split('.');
    this.validatePatch(operation, parts, value);
    const root: keyof IProjectFolder = parts[0] as keyof IProjectFolder;
    if (root === 'info') {
      this.info.patch(operation, parts.slice(1).join('.'), value);
      return;
    }
    if (['created', 'updated'].includes(root)) {
      switch (operation) {
        case 'append': this.patchAppend(root); break;
        case 'set': this.patchSet(root, value); break;
      }
    }
  }

  protected patchSet(property: keyof IProjectFolder, value: unknown): void {
    switch (property) {
      case 'created':
      case 'updated':
        this[property] = Number(value);
        break;
    }
  }

  protected patchAppend(property: keyof IProjectFolder): void {
    throw new Error(`Unable to "append" to the "${property}" property. Did you mean "set"?`);
  }

  validatePatch(operation: PatchUtils.PatchOperation, path: string[], value?: unknown): void {
    if (!path.length) {
      throw new Error(PatchUtils.TXT_unknown_path);
    }
    const root: keyof IProjectFolder = path[0] as keyof IProjectFolder;
    switch (root) {
      case 'created':
      case 'updated':
        PatchUtils.validateDateInput(operation, value);
        break;
      case 'items':
      case 'environments':
        throw new Error(PatchUtils.TXT_use_command_instead);
      case 'kind':
        throw new Error(PatchUtils.TXT_delete_kind);
      case 'info':
        // the "info" has it's own validator.
        break;
      case 'key':
        throw new Error(PatchUtils.TXT_key_is_immutable);
      default:
        throw new Error(PatchUtils.TXT_unknown_path);
    }
  }

  /**
   * The callback called when the object is attached to a parent.
   * This is called when the object is created and inserted to a project or a folder
   * and when the object is moved between folders.
   */
  attachedCallback(): void {
    // ...
  }

  /**
   * The callback called when the object is detached from its parent.
   * This callback is called when the item is deleted from a folder or a project,
   * or when the item is about to be moved to another folder.
   */
  detachedCallback(): void {
    // ...
  }

  /**
   * @returns The instance of the HttpProject or a ProjectFolder that is a closes parent of this instance.
   */
  getParent(): ProjectFolder | HttpProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): HttpProject {
    return this.project;
  }

  /**
   * Removes this folder from the project.
   */
  remove(): void {
    this.project.removeFolder(this.key);
  }

  /**
   * Makes a copy of this folder.
   * By default it attaches the copied folder to the same parent.
   * It also, by default, copies requests declared in this folder.
   * 
   * Use the options dictionary to control these behaviors.
   */
  clone(opts: IFolderCloneOptions = {}): ProjectFolder {
    const copy = new ProjectFolder(this.project, this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
    }
    if (!opts.withoutAttach) {
      // if the parent is the project then add the request to the project.
      const parent = this.getParent();
      if (parent) {
        parent.addFolder(copy);
      }
    }
    const requests = copy.items.filter(i => i.kind === ProjectRequestKind);
    const folders = copy.items.filter(i => i.kind === Kind);
    // remove all items. Depending on the passed option we re-add them next.
    copy.items = [];

    if (!opts.withoutRequests) {
      requests.forEach(r => {
        const { key } = r;
        const request = this.project.findRequest(key, { keyOnly: true });
        if (!request) {
          // Should we throw an error here?
          // CONS:
          // - It's not really related to the operation. It means there is an inconsistency in the project. That's the role of the project class.
          // - Ignoring this would allow us to make a copy that is error free.
          // - The error may occur in a situation when the user does not expect it (giving the nature of the error)
          // Pros:
          // - There's an inconsistency in the project definition that should be reported back to the UI for the user to inspect
          return;
        }
        const requestCopy = request.clone({ withoutAttach: true, withoutRevalidate: true });
        if (!opts.withoutRevalidate) {
          requestCopy.key = v4();
        }
        
        if (!opts.withoutAttach) {
          this.project.addRequest(requestCopy, { parent: copy.key });
        }
      });
    }
    if (!opts.withoutFolders) {
      folders.forEach(f => {
        const { key } = f;
        const folder = this.project.findFolder(key, { keyOnly: true });
        if (!folder) {
          // see above the same for the request
          return;
        }
        const folderCopy = folder.clone({ ...opts, withoutAttach: true, withoutRevalidate: true });
        if (!opts.withoutRevalidate) {
          folderCopy.key = v4();
        }
        if (!opts.withoutAttach) {
          this.project.addFolder(folderCopy, { parent: copy.key });
        }
      });
    }
    return copy;
  }
}
