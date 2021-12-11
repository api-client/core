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

export interface IRequestAddOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
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
   * Appends a new folder to the folder. It updates the project to add the request definition.
   * @param name The name to set. Optional.
   * @returns The key of newly inserted folder.
   */
  addFolder(name?: string): ProjectFolder {
    return this.project.addFolder(name, { parent: this.key });
  }

  /**
   * Appends a new request to the folder. It updates the project to add the request definition.
   * @param request The request to append to the folder.
   * @returns The key of newly inserted request.
   */
  addRequest(request: IProjectRequest | ProjectRequest, opts: IRequestAddOptions = {}): ProjectRequest {
    const addOptions = { parent: this.key, ...opts };
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
}
