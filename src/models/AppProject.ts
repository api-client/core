/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable max-classes-per-file */
// import { ARCHistoryRequest, ARCSavedRequest } from "@api-client/core/build/legacy.js";

import v4 from "../lib/uuid.js";
import { HttpRequest, IHttpRequest } from "./HttpRequest.js";
import { IRequest, Request } from "./Request.js";
import { Environment, IEnvironment, Kind as EnvironmentKind } from './Environment.js';
import { IThing, Thing } from "./Thing.js";
import { ARCHistoryRequest, ARCSavedRequest } from "./legacy/request/ArcRequest.js";
import { ARCProject } from "./legacy/models/ArcLegacyProject.js";
import { Certificate, HttpCertificate } from "./ClientCertificate.js";
import { ICCAuthorization } from "./Authorization.js";
import { IProjectRequestIterator } from "./HttpProject.js";

export const AppProjectKind = 'Core#AppProject';
export const AppProjectFolderKind = 'Core#AppProjectFolder';
export const AppProjectRequestKind = 'Core#AppProjectRequest';

export interface IAppProjectItemOptions {
  /**
   * The parent folder to add the item to.
   */
  parent?: string;
}

export interface IAppProjectItemCreateOptions extends IAppProjectItemOptions {
  /**
   * The position at which to add the item.
   */
  index?: number;
}

export interface IAppProjectRequestCloneOptions {
  /**
   * By default it revalidates (re-creates) keys in the request.
   * Set this to true to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
  /**
   * By default it attaches the request to the same parent as the original request.
   * Set this to `true` when moving a request between projects to prevent adding the request to the project. 
   * Note, the request still have a reference to the original project. You need to update the `project` property.
   */
  withoutAttach?: boolean;
}

export interface IAppProjectFolderAddOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IAppProjectFolderCloneOptions {
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
  /**
   * The target project where to put the copied folder.
   * When the target project is not the same as the source project then the folder 
   * is put into the project root rather than the parent folder (as it would when cloning
   * a folder inside the same project).
   */
  targetProject?: AppProject;
  /**
   * The **key** of the target folder.
   * 
   * By default it clones the folder to its parent unless the clone is attached to another project. 
   * When the target folder is set then it places the clone under the passed target folder.
   */
  targetFolder?: string;
}

export interface IAppProjectFolderCreateOptions extends IAppProjectItemOptions {
  /**
   * Ignores the operation when the folder with the same name already exists. 
   * This command can be used used to ensure that the folder exists.
   */
  skipExisting?: boolean;
  /**
   * Optionally the position at which to add the folder into the list of items.
   */
  index?: number;
}

export interface IAppProjectFolderSearchOptions {
  /**
   * When set it searches for a folder using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IAppProjectFolderDeleteOptions {
  /**
   * When set it won't throw an error when the folder is not found in the project.
   */
  safe?: boolean;
}

export interface IAppProjectRequestAddOptions extends IAppProjectItemOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IAppProjectRequestSearchOptions {
  /**
   * When set it searches for a request using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IAppProjectRequestDeleteOptions {
  /**
   * When set it won't throw an error when the request is not found in the project.
   */
  safe?: boolean;
}

export interface IAppProjectProjectMoveOptions extends IAppProjectItemOptions {
  /**
   * The position at which to insert the object in the destination. BY default it adds the object at the end.
   */
  index?: number;
}

export interface IAppProjectFolderListOptions {
  /**
   * Folder name or key to list folders for.
   */
  folder?: string;
}

export interface IAppProjectProjectCloneOptions {
  /**
   * By default it revalidates (re-creates) keys in the request.
   * Set this to true to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
}

export interface IAppProjectEnvironmentCreateOptions extends IAppProjectItemOptions {
  /**
   * The position at which to add the item.
   */
  index?: number;
}

export interface IAppProjectReadEnvironmentOptions extends IAppProjectItemOptions {
  /**
   * The name or the key of the environment to select.
   * 
   * When the name is not specified it selects: 
   * - the first environment from the project, if any
   * - any parent folder's first environment to the requested folder, if any (if parent is set)
   * - the requested folder's first environment, if any (if parent is set)
   */
  nameOrKey?: string;
}

export interface IAppProjectRequest extends IRequest {
  kind: typeof AppProjectRequestKind;
  key: string;
}

export interface IAppProjectItem {
  kind: typeof AppProjectFolderKind | typeof AppProjectRequestKind | typeof EnvironmentKind;
  key: string;
}

export interface IAppProjectDefinitions {
  /**
   * The list of all folders defined in the project.
   */
  folders?: IAppProjectParent[];
  /**
   * The list of all requests defined in the project.
   */
  requests?: IAppProjectRequest[];
  environments?: IEnvironment[];
  certificates?: HttpCertificate[];
}

export interface AppProjectDefinitions {
  /**
   * The list of all folders defined in the project.
   */
  folders: AppProjectFolder[];
  /**
   * The list of all requests defined in the project.
   */
  requests: AppProjectRequest[];
  environments: Environment[];
  certificates: Certificate[];
}

/**
 * An app project is similar to the HttpProject but stored for a single application
 * and has no sharing options. The AppProject can be upgraded to an HttpProject.
 */
export interface IAppProject extends IAppProjectParent {
  definitions: IAppProjectDefinitions;
}

export interface IAppProjectParent {
  key: string;
  kind: typeof AppProjectKind | typeof AppProjectFolderKind;
  /**
   * Folder meta
   */
  info: IThing;
  /**
   * The list of items in the folder.
   * It is an ordered list of requests and folders.
   * The actual definition is kept in the root's `definitions`.
   */
  items: IAppProjectItem[];
  /**
   * Timestamp when the project was last updated.
   */
  updated?: number;
  /**
   * Timestamp when the project was created.
   */
  created?: number;
}

export class AppProjectRequest extends Request {
  kind = AppProjectRequestKind;

  /**
   * The identifier of the request.
   */
  key = '';

  /**
   * A reference to the top level project object.
   */
  project: AppProject;

  /**
   * Creates a project request from an URL.
   * This does not manipulate the project.
   * 
   * @param url The Request URL. This is required.
   * @param project The parent project.
   */
  static fromUrl(url: string, project?: AppProject): AppProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new AppProjectRequest(project, {
      key: v4(),
      kind: AppProjectRequestKind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ url, method: 'GET' }).toJSON(),
      info: Thing.fromName(url).toJSON(),
    });
    return request;
  }

  /**
   * Creates a project request from a name.
   * This does not manipulate the project.
   * 
   * @param name The Request name.
   * @param project The parent project.This is required.
   */
  static fromName(name: string, project?: AppProject): AppProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new AppProjectRequest(project, {
      key: v4(),
      kind: AppProjectRequestKind,
      created: now,
      updated: now,
      expects: new HttpRequest().toJSON(),
      info: Thing.fromName(name).toJSON(),
    });
    return request;
  }

  /**
   * Creates a project request from an HttpRequest definition.
   * This does not manipulate the project.
   * 
   * @param project The parent project This is required.
   * @param info The request data.
   */
  static fromHttpRequest(info: IHttpRequest, project?: AppProject): AppProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new AppProjectRequest(project, {
      key: v4(),
      kind: AppProjectRequestKind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ method: info.method, url: info.url, headers: info.headers, payload: info.payload }).toJSON(),
      info: Thing.fromName(info.url).toJSON(),
    });
    return request;
  }

  /**
   * Creates a project request for a schema of a Request.
   */
  static fromRequest(request: IRequest, project: AppProject): AppProjectRequest {
    const key = v4();
    const init: IAppProjectRequest = { ...request, key, kind: AppProjectRequestKind };
    const result = new AppProjectRequest(project, init);
    return result;
  }

  constructor(project: AppProject, input?: string | IAppProjectRequest) {
    super(input);
    this.project = project;

    let init: IAppProjectRequest | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key || v4();
    }
    this.kind = AppProjectRequestKind;
  }

  new(init: IAppProjectRequest): void {
    super.new(init);

    const { key = v4() } = init;
    this.key = key;
    this.kind = AppProjectRequestKind;
  }

  toJSON(): IAppProjectRequest {
    const request = super.toJSON();
    const result: IAppProjectRequest = { ...request, key: this.key, kind: AppProjectRequestKind };
    return result;
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closes parent of this instance.
   */
  getParent(): AppProjectFolder | AppProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): AppProject {
    return this.project;
  }

  /**
   * Removes this request from the project.
   */
  remove(): void {
    this.project.removeRequest(this.key);
  }

  /**
   * Makes a copy of this request.
   * By default it attaches the copied request to the same parent.
   * Use the options dictionary to control this behavior.
   */
  clone(opts: IAppProjectRequestCloneOptions = {}): AppProjectRequest {
    const copy = new AppProjectRequest(this.project, this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
    }
    if (!opts.withoutAttach) {
      // if the parent is the project then add the request to the project.
      const parent = this.getParent();
      if (parent) {
        parent.addRequest(copy);
      }
    }
    return copy;
  }

  /**
   * The static version of the `clone()` method.
   * 
   * @param request The request schema to clone.
   * @param project The project to add the request to.
   * @param opts Optional options.
   * @returns The copied request.
   */
  static clone(request: IAppProjectRequest, project: AppProject, opts: IAppProjectRequestCloneOptions = {}): AppProjectRequest {
    const obj = new AppProjectRequest(project, request);
    return obj.clone(opts);
  }
}

export class AppProjectItem {
  /**
   * The kind of the item.
   */
  kind: typeof AppProjectFolderKind | typeof AppProjectRequestKind | typeof EnvironmentKind = AppProjectRequestKind;

  /**
   * The identifier of the object in the `definitions` array of the project.
   */
  key = '';

  /**
   * A reference to the top level project object.
   */
  project: AppProject;

  /**
   * Checks whether the input is a definition of a project item.
   */
  static isProjectItem(input: unknown): boolean {
    const typed = input as IAppProjectItem;
    if (!input || ![AppProjectFolderKind, AppProjectRequestKind, EnvironmentKind].includes(typed.kind)) {
      return false;
    }
    return true;
  }

  /**
   * @return An instance that represents a request item
   */
  static projectRequest(project: AppProject, key: string): AppProjectItem {
    const item = new AppProjectItem(project, {
      kind: AppProjectRequestKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents a folder item
   */
  static projectFolder(project: AppProject, key: string): AppProjectItem {
    const item = new AppProjectItem(project, {
      kind: AppProjectFolderKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents an environment item
   */
  static projectEnvironment(project: AppProject, key: string): AppProjectItem {
    const item = new AppProjectItem(project, {
      kind: EnvironmentKind,
      key,
    });
    return item;
  }

  /**
   * @param project The top-most project.
   * @param input The project item definition used to restore the state.
   */
  constructor(project: AppProject, input: string | IAppProjectItem) {
    this.project = project;
    let init: IAppProjectItem;
    if (typeof input === 'string') {
      if (input === 'http-request') {
        init = {
          kind: AppProjectRequestKind,
          key: '',
        };
      } else if (input === 'folder') {
        init = {
          kind: AppProjectFolderKind,
          key: '',
        };
      } else if (input === 'environment') {
        init = {
          kind: EnvironmentKind,
          key: '',
        };
      } else {
        init = JSON.parse(input);
      }
    } else if (typeof input === 'object') {
      init = input;
    } else {
      throw new Error('Specify the type of the item.');
    }
    this.new(init);
  }

  /**
   * Creates a new project item clearing anything that is so far defined.
   * 
   * Note, this throws an error when the project item is not a project item. 
   */
  new(init: IAppProjectItem): void {
    if (!AppProjectItem.isProjectItem(init)) {
      throw new Error(`Not a project item.`);
    }
    const { kind, key } = init;
    this.kind = kind;
    this.key = key;
  }

  toJSON(): IAppProjectItem {
    const result: IAppProjectItem = {
      kind: this.kind,
      key: this.key,
    };
    return result;
  }

  /**
   * @returns The instance of the definition associated with this item.
   */
  getItem(): AppProjectFolder | AppProjectRequest | Environment | undefined {
    const { project, key, kind } = this;
    const { definitions } = project;
    if (kind === AppProjectRequestKind) {
      return definitions.requests.find(i => i.key === key);
    }
    if (kind === AppProjectFolderKind) {
      return definitions.folders.find(i => i.key === key);
    }
    if (kind === EnvironmentKind) {
      return definitions.environments.find(i => i.key === key);
    }
    return undefined;
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closest parent of this item.
   */
  getParent(): AppProjectFolder | AppProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }
}

export abstract class AppProjectParent {
  /**
   * The auto-generated key for the folder object.
   * For the project root this is the same as the `_id`.
   */
  kind: typeof AppProjectKind | typeof AppProjectFolderKind;

  /**
   * The key of the project / folder.
   */
  key = '';

  /**
   * The basic information about the project / folder.
   */
  info: Thing = Thing.fromName('');

  /**
   * The list of items in the folder.
   * It is an ordered list of requests and folders.
   * The actual definition is kept in the root's `definitions`.
   */
  items: AppProjectItem[] = [];

  /**
   * Timestamp when the project was last updated.
   */
  updated: number = Date.now();

  /**
   * Timestamp when the project was created.
   */
  created: number = Date.now();

  constructor(kind: typeof AppProjectKind | typeof AppProjectFolderKind, input?: string | IAppProjectParent) {
    this.kind = kind;

    let init: IAppProjectParent;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      const now: number = Date.now();
      init = {
        kind,
        created: now,
        updated: now,
        items: [],
        key: v4(),
        info: Thing.fromName('New folder').toJSON(),
      };
    }
    this.new(init);
  }

  /**
   * Creates a new project folder clearing anything that is so far defined.
   * 
   * Note, this throws an error when the project folder is not a project folder.
   */
  new(init: IAppProjectParent): void {
    const { key = v4(), created = Date.now(), updated = Date.now(), items, info, kind } = init;
    this.kind = kind;
    this.key = key;
    this.created = created;
    this.updated = updated;
    this.setItems(items);
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('New folder');
    }
  }

  abstract setItems(items?: IAppProjectItem[]): void;

  /**
   * Lists items (not the actual definitions!) that are folders.
   */
  listFolderItems(): AppProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === AppProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): AppProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === AppProjectRequestKind);
  }
}

export class AppProjectFolder extends AppProjectParent {

  project: AppProject;

  /**
   * Creates a new ArcProjectFolder object from a name.
   * @param project The top-most project.
   * @param name The name to set.
   */
  static fromName(project: AppProject, name = 'New folder'): AppProjectFolder {
    const now = Date.now();
    const key = v4();
    const info = Thing.fromName(name);
    const definition = new AppProjectFolder(project, {
      key,
      created: now,
      updated: now,
      items: [],
      kind: AppProjectFolderKind,
      info: info.toJSON(),
    });
    return definition;
  }

  constructor(project: AppProject, input?: string | IAppProjectParent) {
    super(AppProjectFolderKind, input);
    this.project = project;

    let init: IAppProjectParent | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key || v4();
    }
    this.kind = AppProjectFolderKind;
  }

  toJSON(): IAppProjectParent {
    const result: IAppProjectParent = {
      kind: AppProjectFolderKind,
      info: this.info.toJSON(),
      key: this.key,
      created: this.created,
      updated: this.updated,
      items: [],
    };
    if (Array.isArray(this.items)) {
      result.items = this.items.map(i => i.toJSON());
    }
    return result;
  }

  setItems(items?: IAppProjectItem[]): void {
    if (Array.isArray(items)) {
      this.items = items.map(i => new AppProjectItem(this.project, i));
    } else {
      this.items = [];
    }
  }

  /**
   * Appends an instance of a folder to a project.
   * 
   * @param folder The folder to add to this project.
   * @returns The added folder.
   */
  addFolder(folder: AppProjectFolder): AppProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @returns The added folder.
   */
  addFolder(folder: IAppProjectParent): AppProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string): AppProjectFolder;

  /**
   * Appends a new folder to the folder. It updates the project to add the request definition.
   * @param name The name to set. Optional.
   * @returns The key of newly inserted folder.
   */
  addFolder(name: string | IAppProjectParent | AppProjectFolder | undefined): AppProjectFolder {
    return this.project.addFolder(name as AppProjectFolder, { parent: this.key });
  }

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param url The URL of the request.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(url: string, opts?: IAppProjectFolderAddOptions): AppProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IAppProjectRequest | AppProjectRequest, opts?: IAppProjectFolderAddOptions): AppProjectRequest;

  /**
   * Appends a new request to the folder. It updates the project to add the request definition.
   * @param request The request to append to the folder.
   * @returns The key of newly inserted request.
   */
  addRequest(request: IAppProjectRequest | AppProjectRequest | string, opts: IAppProjectFolderAddOptions = {}): AppProjectRequest {
    const addOptions = { parent: this.key, ...opts };
    if (typeof request === 'string') {
      return this.project.addRequest(request, addOptions);
    }
    return this.project.addRequest(request, addOptions);
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closes parent of this instance.
   */
  getParent(): AppProjectFolder | AppProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): AppProject {
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
   * 
   * @param opts Cloning options
   */
  clone(opts: IAppProjectFolderCloneOptions = {}): AppProjectFolder {
    const { targetProject = this.project, targetFolder } = opts;
    const copy = new AppProjectFolder(targetProject, this.toJSON());
    copy.key = v4();

    const extProject = targetProject !== this.project;
    if (extProject) {
      if (targetFolder) {
        const parent = targetProject.findFolder(targetFolder, { keyOnly: true });
        if (!parent) {
          throw new Error(`The target project does not contain the folder ${targetFolder}`);
        }
        parent.addFolder(copy);
      } else {
        targetProject.addFolder(copy);
      }
    } else {
      const parent = targetFolder ? this.project.findFolder(targetFolder, { keyOnly: true }) : this.getParent();
      if (parent) {
        parent.addFolder(copy);
      } else {
        throw new Error(`Unable to locate a parent of the folder.`);
      }
    }
    // removes all items. Depending on the passed option we re-add them next.
    copy.items = [];

    if (!opts.withoutRequests) {
      this.cloneRequests(copy, this.project);
    }
    if (!opts.withoutFolders) {
      this.cloneSubFolders(copy, this.project, !opts.withoutRequests);
    }
    return copy;
  }

  /**
   * Clones the current requests to the target folder.
   * 
   * @param folder The target folder into which to put the requests. The folder has to have the target project attached to it.
   * @param project The originating project where the definitions are stored
   */
  protected cloneRequests(folder: AppProjectFolder, project: AppProject): void {
    const requests = this.items.filter(i => i.kind === AppProjectRequestKind);
    requests.forEach(r => {
      const request = project.findRequest(r.key, { keyOnly: true });
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
      const copy = request.clone({ withoutAttach: true });
      copy.project = folder.getProject();
      folder.addRequest(copy);
    });
  }

  /**
   * Clones the sub-folders to the target folder.
   * 
   * @param folder The target folder into which to put the sub-folders. The folder has to have the target project attached to it.
   * @param project The originating project where the definitions are stored
   * @param withRequests Whether to clone requests with the folder.
   */
  protected cloneSubFolders(folder: AppProjectFolder, project: AppProject, withRequests = true): void {
    const folders = this.items.filter(i => i.kind === AppProjectFolderKind);
    folders.forEach(f => {
      const definition = project.findFolder(f.key, { keyOnly: true });
      if (!definition) {
        return;
      }
      const copy = new AppProjectFolder(folder.getProject(), definition.toJSON());
      copy.key = v4();
      copy.items = [];
      folder.addFolder(copy);
      if (withRequests) {
        definition.cloneRequests(copy, project);
      }
      definition.cloneSubFolders(copy, project, withRequests);
    });
  }

  /**
   * Lists folders in this folder.
   */
  listFolders(): AppProjectFolder[] {
    return this.project.listFolders({ folder: this.key });
  }

  /**
   * Lists requests in this folder.
   */
  listRequests(): AppProjectRequest[] {
    return this.project.listRequests(this.key);
  }

  /**
   * Adds a request to the project that has been created for a previous version of ARC.
   * 
   * @param legacy The legacy request definition.
   * @returns The created project request.
   */
  async addLegacyRequest(legacy: ARCSavedRequest | ARCHistoryRequest): Promise<AppProjectRequest> {
    const request = await Request.fromLegacy(legacy);
    const projectRequest = AppProjectRequest.fromRequest(request.toJSON(), this.project);
    return this.addRequest(projectRequest);
  }

  /**
   * Adds an environment to the project.
   * 
   * @param env The definition of the environment to use to create the environment
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The instance of the environment to add
   * @returns The same or created environment.
   */
  addEnvironment(env: Environment, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The name of the environment to create
   * @returns The same or created environment.
   */
  addEnvironment(env: string, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment | Environment | string, opts: IAppProjectEnvironmentCreateOptions = {}): Environment {
    const newOptions: IAppProjectEnvironmentCreateOptions = { ...opts, parent: this.key };
    return this.project.addEnvironment(env as Environment, newOptions);
  }

  /**
   * @param key The environment key to read.
   */
  getEnvironment(key: string): Environment | undefined {
    return this.project.getEnvironment(key, { parent: this.key });
  }

  /**
   * Removes an environment from the folder or a sub-folder.
   * 
   * @param key the key of the environment to remove
   * @returns The removed environment, if any.
   */
  removeEnvironment(key: string): Environment | undefined {
    return this.project.removeEnvironment(key, { parent: this.key });
  }

  /**
   * This is a link to the `getEnvironments()`. The difference is that on the 
   * project level it won't return environments defined with the class initialization.
   */
  listEnvironments(): Environment[] {
    return this.project.listEnvironments({ parent: this.key });
  }

  /**
   * @returns The list of environments defined in this folder
   */
  getEnvironments(): Environment[] {
    return this.project.getEnvironments({ parent: this.key });
  }
}

/**
 * An app project is similar to the HttpProject but stored for a single application
 * and has no sharing options. The AppProject can be upgraded to an HttpProject.
 */
export class AppProject extends AppProjectParent {
  /**
   * Timestamp when the project was last updated.
   */
  updated: number = Date.now();

  /**
   * Timestamp when the project was created.
   */
  created: number = Date.now();

  definitions: AppProjectDefinitions;

  /**
   * Creates a new ARC project from a name.
   * @param name The name to set.
   */
  static fromName(name: string): AppProject {
    const project = new AppProject();
    const info = Thing.fromName(name);
    project.info = info;
    return project;
  }

  /**
   * Creates an HTTP project instance from ARC's legacy project definition.
   * 
   * Note, the `requests` should be processed and the payload restored to it's original value.
   */
  static async fromLegacyProject(project: ARCProject, requests: ARCSavedRequest[]): Promise<AppProject> {
    const { name = 'Unnamed project', description, requests: ids } = project;
    const result = AppProject.fromName(name);
    if (project._id) {
      result.key = project._id;
    }
    if (description) {
      result.info.description = description;
    }
    if (Array.isArray(ids) && ids.length) {
      const promises = ids.map(async (id) => {
        const old = requests.find((item) => item._id === id);
        if (!old) {
          return;
        }
        const request = await Request.fromLegacy(old);
        const projectRequest = AppProjectRequest.fromRequest(request.toJSON(), result);
        if (old._id) {
          projectRequest.key = old._id;
        }
        result.addRequest(projectRequest);
      });
      await Promise.allSettled(promises);
    }
    return result;
  }

  constructor(input?: string | IAppProject) {
    super(AppProjectKind);
    this.definitions = {
      folders: [],
      requests: [],
      environments: [],
      certificates: [],
    };
    let init: IAppProject;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
      if (!init.kind) {
        init.kind = AppProjectKind;
      }
    } else {
      const now = Date.now();
      init = {
        kind: AppProjectKind,
        key: v4(),
        definitions: {},
        items: [],
        info: Thing.fromName('').toJSON(),
        created: now,
        updated: now,
      }
    }
    this.new(init);
  }

  new(init: IAppProject): void {
    if (!init || !init.items) {
      throw new Error(`Not a project.`);
    }
    const { key = v4(), definitions = {}, items, info, created = Date.now(), updated = Date.now() } = init;
    this.key = key;
    this.created = created;
    this.updated = updated;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }
    this.setItems(items);
    this.definitions = {
      folders: [],
      requests: [],
      environments: [],
      certificates: [],
    };
    if (Array.isArray(definitions.requests)) {
      this.definitions.requests = definitions.requests.map(i => {
        const instance = new AppProjectRequest(this, i);
        return instance;
      });
    }
    if (Array.isArray(definitions.folders)) {
      this.definitions.folders = definitions.folders.map(i => {
        const instance = new AppProjectFolder(this, i);
        return instance;
      });
    }
    if (Array.isArray(definitions.environments)) {
      this.definitions.environments = definitions.environments.map(i => new Environment(i));
    }
    if (Array.isArray(definitions.certificates)) {
      this.definitions.certificates = definitions.certificates.map(i => new Certificate(i));
    }
  }

  toJSON(): IAppProject {
    const result: IAppProject = {
      kind: AppProjectKind,
      key: this.key,
      definitions: {},
      items: [],
      info: this.info.toJSON(),
      created: this.created,
      updated: this.updated,
    };
    if (Array.isArray(this.definitions.requests) && this.definitions.requests.length) {
      result.definitions.requests = this.definitions.requests.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.folders) && this.definitions.folders.length) {
      result.definitions.folders = this.definitions.folders.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.environments) && this.definitions.environments.length) {
      result.definitions.environments = this.definitions.environments.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.certificates) && this.definitions.certificates.length) {
      result.definitions.certificates = this.definitions.certificates.map(i => i.toJSON());
    }
    if (Array.isArray(this.items) && this.items.length) {
      result.items = this.items.map(i => i.toJSON());
    }
    return result;
  }

  setItems(items?: IAppProjectItem[]): void {
    if (Array.isArray(items)) {
      this.items = items.map(i => new AppProjectItem(this, i));
    } else {
      this.items = [];
    }
  }

  /**
   * Finds a parent of a definition.
   * 
   * @param  key The key of the definition.
   * @returns The parent or undefine when not found.
   */
  findParent(key: string): AppProjectFolder | AppProject | undefined {
    const { definitions, items = [] } = this;
    const projectItemsIndex = items.findIndex(i => i.key === key);
    if (projectItemsIndex > -1) {
      return this;
    }
    const definition = definitions.folders.find(i => i.items.some(item => item.key === key));
    if (definition) {
      return definition;
    }
    return undefined;
  }

  /**
   * Appends an instance of a folder to a project.
   * 
   * @param folder The folder to add to this project.
   * @param opts Optional folder add options.
   * @returns The added folder.
   */
  addFolder(folder: AppProjectFolder, opts?: IAppProjectFolderCreateOptions): AppProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @param opts Optional folder add options.
   * @returns The added folder.
   */
  addFolder(folder: IAppProjectParent, opts?: IAppProjectFolderCreateOptions): AppProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @param opts Folder create options.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string, opts?: IAppProjectFolderCreateOptions): AppProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * Passing the folder schema as the fist argument is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param init The name or a folder schema. When not set a default name is assumed.
   * @param opts Folder create options.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(init: string | IAppProjectParent | AppProjectFolder = 'New Folder', opts: IAppProjectFolderCreateOptions = {}): AppProjectFolder {
    if (!Array.isArray(this.items)) {
      this.items = [];
    }
    if (!Array.isArray(this.definitions.folders)) {
      this.definitions.folders = [];
    }
    const { skipExisting, parent } = opts;
    let root: AppProjectFolder | AppProject;
    if (parent) {
      const rootCandidate = this.findFolder(parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent folder ${parent}`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }
    let definition: AppProjectFolder;
    if (typeof init === 'string') {
      definition = AppProjectFolder.fromName(this, init);
    } else if (init instanceof AppProjectFolder) {
      definition = init;
    } else {
      definition = new AppProjectFolder(this, init);
    }
    if (skipExisting) {
      const folders = root.listFolderItems();
      for (const item of folders) {
        const existing = this.findFolder(item.key, { keyOnly: true });
        if (existing && existing.info.name === definition.info.name) {
          return existing;
        }
      }
    }

    this.definitions.folders.push(definition);
    const item = AppProjectItem.projectFolder(this, definition.key);
    if (!Array.isArray(root.items)) {
      root.items = [];
    }
    if (typeof opts.index === 'number') {
      root.items.splice(opts.index, 0, item);
    } else {
      root.items.push(item);
    }
    return definition;
  }

  /**
   * Searches for a folder in the structure.
   * 
   * @param nameOrKey The name or the key of the folder.
   * @param opts Optional search options.
   * @returns Found project folder or undefined.
   */
  findFolder(nameOrKey: string, opts: IAppProjectFolderSearchOptions = {}): AppProjectFolder | undefined {
    const { definitions } = this;
    const item = definitions.folders.find((i) => {
      if (i.kind !== AppProjectFolderKind) {
        return false;
      }
      const folder = (i as AppProjectFolder);
      if (folder.key === nameOrKey) {
        return true;
      }
      if (opts.keyOnly) {
        return false;
      }
      return !!folder.info && folder.info.name === nameOrKey;
    });
    if (item) {
      return item as AppProjectFolder;
    }
    return undefined;
  }

  /**
   * Removes a folder from the project.
   * @param key The folder key. It ignores the name when searching to the folder to avoid ambiguity.
   * @param opts Folder remove options.
   * @returns The removed folder definition or undefined when not removed.
   */
  removeFolder(key: string, opts: IAppProjectFolderDeleteOptions = {}): AppProjectFolder | undefined {
    const { definitions } = this;
    const folder = this.findFolder(key, { keyOnly: true });
    if (!folder) {
      if (opts.safe) {
        return undefined;
      }
      throw new Error(`Unable to find the folder ${key}`);
    }
    const parent = this.findParent(key);
    if (!parent) {
      if (opts.safe) {
        return undefined;
      }
      throw new Error(`Unable to find a parent of the folder ${key}`);
    }

    const requests = folder.listRequests();
    requests.forEach(r => r.remove());
    const folders = folder.listFolders();
    folders.forEach(f => f.remove());

    const itemIndex = parent.items.findIndex(i => i.key === key);
    const definitionIndex = definitions.folders.findIndex(i => i.key === key);
    definitions.folders.splice(definitionIndex, 1);
    if (itemIndex >= 0) {
      parent.items.splice(itemIndex, 1);
    }
    return folder;
  }

  /**
   * Moves a folder between folders and the project or between items inside a folder or a project
   * 
   * Note, when the `parent` option is not specified it moved the folder to the project's root.
   * 
   * @param key The key of the request to move.
   * @param opts The moving options.
   */
  moveFolder(key: string, opts: IAppProjectProjectMoveOptions = {}): void {
    const { index, parent } = opts;
    const movedFolder = this.findFolder(key);
    if (!movedFolder) {
      throw new Error(`Unable to locate the folder ${key}`);
    }
    const parentFolder = this.findParent(key);
    if (!parentFolder) {
      throw new Error(`Unable to locate a parent of the folder ${key}`);
    }
    if (parent) {
      // check if moving a folder into another folder that is a child of the moved folder.
      if (this.hasChild(parent, key)) {
        throw new RangeError(`Unable to move a folder to its child.`);
      }
    }
    const target = parent ? this.findFolder(parent) : this;
    if (!target) {
      throw new Error(`Unable to locate the new parent folder ${parent}`);
    }
    const hasIndex = typeof index === 'number';
    if (hasIndex) {
      // comparing to the `.length` and not `.length - 1` in case we are adding at the end.
      const maxIndex = Math.max(target.items.length, 0);
      if (index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
    }

    const itemIndex = parentFolder.items.findIndex(i => i.key === key);
    const item = parentFolder.items.splice(itemIndex, 1)[0];

    if (hasIndex && target.items.length > index) {
      target.items.splice(index, 0, item);
    } else {
      target.items.push(item);
    }
  }

  /**
   * Checks whether a folder has a child (anywhere down the structure).
   * 
   * @param child The **key** of the child.
   * @param folder The **key** of the folder. When not set it searches from the project root.
   * @returns True when the child is located somewhere down the structure.
   */
  hasChild(child: string, folder?: string): boolean {
    const target = folder ? this.findFolder(folder) : this;
    if (!target) {
      throw new Error(`Unable to locate the folder ${folder}`);
    }
    const { items = [] } = target;
    for (const item of items) {
      if (item.key === child) {
        return true;
      }
      if (item.kind === AppProjectFolderKind) {
        const hasChild = this.hasChild(child, item.key);
        if (hasChild) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param url The URL of the request.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(url: string, opts?: IAppProjectRequestAddOptions): AppProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IAppProjectRequest | AppProjectRequest, opts?: IAppProjectRequestAddOptions): AppProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * @param request The request to add.
   * @param opts Thew request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IAppProjectRequest | AppProjectRequest | string, opts: IAppProjectRequestAddOptions = {}): AppProjectRequest {
    if (!Array.isArray(this.definitions.requests)) {
      this.definitions.requests = [];
    }

    // the request can be already added to the project as the same method is used to refresh a request after 
    // a store update. From the system perspective it is the same event.

    if (typeof request === 'object' && request.key) {
      const existing = this.definitions.requests.find(i => i.key === request.key);
      if (existing) {
        existing.new(request as IAppProjectRequest);
        return existing;
      }
    }

    // if we got here, it means that we are adding a new request object to the project.

    let finalRequest;
    if (typeof request === 'string') {
      finalRequest = AppProjectRequest.fromUrl(request, this);
    } else if (request instanceof AppProjectRequest) {
      finalRequest = request;
      finalRequest.project = this;
    } else {
      finalRequest = new AppProjectRequest(this, request);
    }
    if (!finalRequest.key) {
      finalRequest.key = v4();
    }

    let root: AppProjectFolder | AppProject;
    if (opts.parent) {
      const rootCandidate = this.findFolder(opts.parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent folder ${opts.parent}.`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }

    if (!Array.isArray(root.items)) {
      root.items = [];
    }

    if (typeof opts.index === 'number') {
      const maxIndex = Math.max(root.items.length - 1, 0);
      if (opts.index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
    }

    this.definitions.requests.push(finalRequest);
    const item = AppProjectItem.projectRequest(this, finalRequest.key);

    if (typeof opts.index === 'number') {
      root.items.splice(opts.index, 0, item);
    } else {
      root.items.push(item);
    }
    return finalRequest;
  }

  /**
   * Adds a request to the project that has been created for a previous version of ARC.
   * 
   * @param legacy The legacy request definition.
   * @returns The created project request.
   */
  async addLegacyRequest(legacy: ARCSavedRequest | ARCHistoryRequest): Promise<AppProjectRequest> {
    const request = await Request.fromLegacy(legacy);
    const projectRequest = AppProjectRequest.fromRequest(request.toJSON(), this);
    return this.addRequest(projectRequest);
  }

  /**
   * Searches for a request in the project.
   * 
   * @param nameOrKey The name or the key of the request.
   * @param opts Optional search options.
   * @returns Found project request or undefined.
   */
  findRequest(nameOrKey: string, opts: IAppProjectRequestSearchOptions = {}): AppProjectRequest | undefined {
    const { definitions } = this;
    const item = definitions.requests.find((request) => {
      if (request.key === nameOrKey) {
        return true;
      }
      if (opts.keyOnly) {
        return false;
      }
      return !!request.info && request.info.name === nameOrKey;
    });
    if (item) {
      return item as AppProjectRequest;
    }
    return undefined;
  }

  /**
   * Removes a request from the project.
   * 
   * @param key The request key. It ignores the name when searching to the request to avoid ambiguity.
   * @param opts Request remove options.
   * @returns The removed request definition or undefined when not removed.
   */
  removeRequest(key: string, opts: IAppProjectRequestDeleteOptions = {}): AppProjectRequest | undefined {
    const { definitions } = this;
    const request = this.findRequest(key, { keyOnly: true });
    if (!request) {
      if (opts.safe) {
        return undefined;
      }
      throw new Error(`Unable to find the request ${key}`);
    }
    const parent = this.findParent(key);
    if (!parent) {
      if (opts.safe) {
        return undefined;
      }
      throw new Error(`Unable to find a parent of the request ${key}`);
    }
    const itemIndex = parent.items.findIndex(i => i.key === key);
    const definitionIndex = definitions.requests.findIndex(i => i.key === key);
    definitions.requests.splice(definitionIndex, 1);
    if (itemIndex >= 0) {
      parent.items.splice(itemIndex, 1);
    }
    return request;
  }

  /**
   * Moves a request between folders and the project or between items inside a folder or a project.
   * 
   * Note, when the `parent` option is not specified it moved the request to the project's root.
   * 
   * @param key The key of the request to move.
   * @param opts The moving options.
   */
  moveRequest(key: string, opts: IAppProjectProjectMoveOptions = {}): void {
    const { index, parent } = opts;
    const request = this.findRequest(key);
    if (!request) {
      throw new Error(`Unable to locate the request ${key}`);
    }
    const parentFolder = this.findParent(key);
    if (!parentFolder) {
      throw new Error(`Unable to locate a parent of the request ${key}`);
    }
    const target = parent ? this.findFolder(parent) : this;
    if (!target) {
      throw new Error(`Unable to locate the new parent folder ${parent}`);
    }
    const hasIndex = typeof index === 'number';
    if (hasIndex) {
      // comparing to the `.length` and not `.length - 1` in case we are adding at the end.
      const maxIndex = Math.max(target.items.length, 0);
      if (index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
    }

    const itemIndex = parentFolder.items.findIndex(i => i.key === key);
    const item = parentFolder.items.splice(itemIndex, 1)[0];

    if (hasIndex && target.items.length > index) {
      target.items.splice(index, 0, item);
    } else {
      target.items.push(item);
    }
  }

  /**
   * Lists items (not the actual definitions!) that are folders.
   */
  listFolderItems(): AppProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === AppProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): AppProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === AppProjectRequestKind);
  }

  /**
   * Lists folders from the project or a sub-folder.
   * @param opts Folder listing options.
   */
  listFolders(opts: IAppProjectFolderListOptions = {}): AppProjectFolder[] {
    let root;
    if (opts.folder) {
      const parent = this.findFolder(opts.folder);
      if (!parent) {
        throw new Error(`Unable to find the folder ${opts.folder}.`);
      }
      root = parent;
    } else {
      root = this;
    }
    const items = root.listFolderItems();
    const result: AppProjectFolder[] = [];
    const { definitions } = this;
    items.forEach((i) => {
      const definition = definitions.folders.find(d => i.key === d.key);
      if (definition) {
        result.push(definition);
      }
    });
    return result;
  }

  /**
   * Lists requests in this project or a sub-folder.
   * @param folder The optional folder name or the key to list requests for.
   */
  listRequests(folder?: string): AppProjectRequest[] {
    let root;
    if (folder) {
      const parent = this.findFolder(folder);
      if (!parent) {
        throw new Error(`Unable to find the folder ${folder}.`);
      }
      root = parent;
    } else {
      root = this;
    }
    const items = root.listRequestItems();
    const result: AppProjectRequest[] = [];
    const { definitions } = this;
    items.forEach((i) => {
      const definition = definitions.requests.find(d => i.key === d.key);
      if (definition) {
        result.push(definition);
      }
    });
    return result;
  }

  /**
   * Lists definitions for the `items` of the project or a folder.
   * @param folder Optionally the folder name to list the definitions for.
   */
  listDefinitions(folder?: string): (AppProjectFolder | AppProjectRequest | Environment)[] {
    let root;
    if (folder) {
      const parent = this.findFolder(folder);
      if (!parent) {
        throw new Error(`Unable to find the folder ${folder}`);
      }
      root = parent;
    } else {
      root = this;
    }
    const result: (AppProjectFolder | AppProjectRequest | Environment)[] = [];
    const { items = [] } = root;
    const { definitions } = this;
    items.forEach((item) => {
      let definition: AppProjectFolder | AppProjectRequest | Environment | undefined;
      if (item.kind === AppProjectFolderKind) {
        definition = definitions.folders.find(d => item.key === d.key);
      } else if (item.kind === AppProjectRequestKind) {
        definition = definitions.requests.find(d => item.key === d.key);
      } else if (item.kind === EnvironmentKind) {
        definition = definitions.environments.find(d => item.key === d.key);
      }
      if (definition) {
        result.push(definition);
      }
    });
    return result;
  }

  /**
   * @returns On the project level this always returns undefined.
   */
  getParent(): AppProjectFolder | AppProject | undefined {
    return undefined;
  }

  getProject(): AppProject {
    return this;
  }

  /**
   * Makes a copy of this project.
   */
  clone(opts: IAppProjectProjectCloneOptions = {}): AppProject {
    const copy = new AppProject(this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
      AppProject.regenerateKeys(copy);
    }
    return copy;
  }

  static clone(project: IAppProject, opts: IAppProjectProjectCloneOptions = {}): AppProject {
    const obj = new AppProject(project);
    return obj.clone(opts);
  }

  /**
   * Re-generates keys in the project, taking care of the references.
   * 
   * Note, this changes the project properties. Make a copy of the project before calling this.
   * 
   * @param src The project instance to re-generate keys for.
   */
  static regenerateKeys(src: AppProject): void {
    const { items = [], definitions } = src;
    // create a flat list of all "items" in the project and all folders.
    let flatItems = [...items];
    (definitions.folders || []).forEach((folder) => {
      if (Array.isArray(folder.items) && folder.items.length) {
        flatItems = flatItems.concat(folder.items);
      }
    });
    (definitions.folders || []).forEach((folder) => {
      // if (Array.isArray(folder.environments) && folder.environments.length) {
      //   withEnvironments.push(folder);
      // }
      const oldKey = folder.key;
      const indexObject = flatItems.find(i => i.key === oldKey);
      if (!indexObject) {
        return;
      }
      const newKey = v4();
      indexObject.key = newKey;
      folder.key = newKey;
    });
    (definitions.requests || []).forEach((request) => {
      const oldKey = request.key;
      const indexObject = flatItems.find(i => i.key === oldKey);
      if (!indexObject) {
        return;
      }
      const newKey = v4();
      indexObject.key = newKey;
      request.key = newKey;
    });
    (definitions.environments || []).forEach((environment) => {
      const oldKey = environment.key;
      const indexObject = flatItems.find(i => i.key === oldKey);
      if (!indexObject) {
        return;
      }
      const newKey = v4();
      indexObject.key = newKey;
      environment.key = newKey;
    });
    (definitions.certificates || []).forEach((cert) => {
      cert.key = v4();
    });
  }

  /**
   * Adds an environment to the project.
   * 
   * @param env The definition of the environment to use to create the environment
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The instance of the environment to add
   * @returns The same or created environment.
   */
  addEnvironment(env: Environment, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The name of the environment to create
   * @returns The same or created environment.
   */
  addEnvironment(env: string, opts?: IAppProjectEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment | Environment | string, opts: IAppProjectEnvironmentCreateOptions = {}): Environment {
    const environment = this._createEnv(env);
    const root = this._getRoot(opts);
    const project = this.getProject();
    if (!project.definitions.environments) {
      project.definitions.environments = [];
    }
    project.definitions.environments.push(environment);
    const item = AppProjectItem.projectEnvironment(project, environment.key);
    this._insertItem(item, root, opts);
    return environment;
  }

  protected _createEnv(env: IEnvironment | Environment | string): Environment {
    let finalEnv: Environment;
    if (env instanceof Environment) {
      finalEnv = env;
    } else if (typeof env === 'string') {
      finalEnv = Environment.fromName(env);
    } else {
      finalEnv = new Environment(env);
    }
    if (!finalEnv.key) {
      finalEnv.key = v4();
    }
    return finalEnv;
  }

  /**
   * @param key The environment key to read.
   */
  getEnvironment(key: string, opts: IAppProjectItemOptions = {}): Environment | undefined {
    const root = this._getRoot(opts);
    const item = root.items.find(i => i.key === key);
    if (!item) {
      return undefined;
    }
    const project = this.getProject();
    if (!Array.isArray(project.definitions.environments)) {
      project.definitions.environments = [];
    }
    return project.definitions.environments.find(e => e.key === key);
  }

  /**
   * Removes an environment from the folder or a sub-folder.
   * 
   * @param key the key of the environment to remove
   * @returns The removed environment, if any.
   */
  removeEnvironment(key: string, opts: IAppProjectItemOptions = {}): Environment | undefined {
    const root = this._getRoot(opts);
    const itemIndex = root.items.findIndex(i => i.key === key);
    if (itemIndex < 0) {
      return undefined;
    }
    root.items.splice(itemIndex, 1);
    const project = this.getProject();
    if (!Array.isArray(project.definitions.environments)) {
      project.definitions.environments = [];
    }
    const defIndex = project.definitions.environments.findIndex(i => i.key === key);
    if (defIndex < 0) {
      return undefined;
    }
    const env = project.definitions.environments[defIndex];
    project.definitions.environments.splice(defIndex, 1);
    return env;
  }

  /**
   * This method is a link to `listEnvironments()` to be compatible with the HttpProject.
   * 
   * @returns The list of environments defined in this folder
   */
  getEnvironments(opts?: IAppProjectItemOptions): Environment[] {
    return this.listEnvironments(opts);
  }

  /**
   * This is a link to the `getEnvironments()`. The difference is that on the 
   * project level it won't return environments defined with the class initialization.
   */
  listEnvironments(opts: IAppProjectItemOptions = {}): Environment[] {
    const root = this._getRoot(opts);
    const items = root.items.filter(i => i.kind === EnvironmentKind).map(i => i.key);
    const project = this.getProject();
    if (!Array.isArray(project.definitions.environments)) {
      project.definitions.environments = [];
    }
    return project.definitions.environments.filter(e => items.includes(e.key));
  }

  /**
   * Reads the list of environments from then selected folder up to the project root.
   * It stops going up in the project structure when selected environment has the `encapsulated`
   * property set to true.
   * The environments are ordered from the top-most level to the selected folder.
   * 
   * @param opts The environment read options
   */
  readEnvironments(opts: IAppProjectReadEnvironmentOptions = {}): Environment[] {
    const result: Environment[] = [];
    const { parent, nameOrKey } = opts;

    const root = parent ? this.findFolder(parent, { keyOnly: true }) : this;
    if (!root) {
      return result;
    }

    let current: AppProject | AppProjectFolder | undefined = root;
    while (current) {
      const environments = current.listEnvironments();
      if (environments.length) {
        const selected = nameOrKey ? environments.find(i => i.key === nameOrKey || i.info.name === nameOrKey) : environments[0];
        if (selected) {
          result.push(selected);
          if (selected.encapsulated) {
            break;
          }
        }
      }
      current = current.getParent();
    }

    return result.reverse();
  }

  /**
   * Finds a definition for an environment regardless of its parent.
   * 
   * @param key The Key of the environment to find.
   * @returns The environment definition or undefined if not found.
   */
  findEnvironment(key: string): Environment | undefined {
    return this.definitions.environments.find(i => i.key === key);
  }

  /**
   * Depending on the options returns a project or a folder.
   * It throws when parent folder cannot ber found.
   */
  protected _getRoot(opts: { parent?: string }): AppProjectFolder | AppProject {
    const project = this.getProject();
    if (opts.parent) {
      const parent = project.findFolder(opts.parent);
      if (!parent) {
        throw new Error(`Unable to find the parent folder ${opts.parent}.`);
      }
      return parent;
    }
    return project;
  }

  protected _insertItem(item: AppProjectItem, root: AppProjectFolder | AppProject, opts: IAppProjectItemCreateOptions): void {
    if (!Array.isArray(root.items)) {
      root.items = [];
    }
    if (typeof opts.index === 'number') {
      root.items.splice(opts.index, 0, item);
    } else {
      root.items.push(item);
    }
  }

  /**
   * Finds a definition for a certificate.
   * 
   * @param key The key of the certificate to find.
   * @returns The certificate definition or undefined if not found.
   */
  findCertificate(key: string): Certificate | undefined {
    return this.definitions.certificates.find(i => i.key === key);
  }

  /**
   * Adds a certificate to the project.
   * 
   * @param init Either an instance of a certificate or its definition.
   * @returns The inserted certificate.
   */
  addCertificate(init: Certificate | HttpCertificate): Certificate {
    let finalCert: Certificate;
    if (init instanceof Certificate) {
      finalCert = init;
    } else {
      finalCert = new Certificate(init);
    }
    if (!this.definitions.certificates) {
      this.definitions.certificates = [];
    }
    this.definitions.certificates.push(finalCert);
    return finalCert;
  }

  /**
   * Removes a certificate from the project.
   * 
   * @param key the key of the certificate to remove
   * @returns The removed certificate, if any.
   */
  removeCertificate(key: string): Certificate | undefined {
    if (!Array.isArray(this.definitions.certificates)) {
      return undefined
    }
    const defIndex = this.definitions.certificates.findIndex(i => i.key === key);
    if (defIndex < 0) {
      return undefined;
    }
    const cert = this.definitions.certificates[defIndex];
    this.definitions.certificates.splice(defIndex, 1);
    return cert;
  }

  /**
   * Finds the requests that are using the certificate identified by the key.
   * 
   * @param key The key of the certificate to find the usage for.
   * @returns The list of requests that use this certificate.
   */
  findCertificateRequests(key: string): AppProjectRequest[] {
    return this.definitions.requests.filter((request) => {
      if (!Array.isArray(request.authorization)) {
        return false;
      }
      const ccAuth = request.authorization.find(auth => auth.type === 'client certificate');
      if (!ccAuth) {
        return false;
      }
      const cnf = ccAuth.config as ICCAuthorization;
      return !!cnf && !!cnf.certificate && cnf.certificate.key === key;
    });
  }

  /**
   * Iterates over requests in the project.
   */
  * requestIterator(opts: IProjectRequestIterator = {}): Generator<AppProjectRequest> {
    const { definitions } = this;
    const { ignore=[], parent, recursive, requests=[] } = opts;
    const root = parent ? this.findFolder(parent) : this;
    if (!root) {
      throw new Error(`The parent folder not found: ${parent}.`);
    }
    const items = root.items;
    if (!items || !items.length) {
      return;
    }
    for (const item of items) {
      if (ignore.includes(item.key)) {
        continue;
      }
      if (item.kind === AppProjectRequestKind) {
        const request = definitions.requests.find(i => i.key === item.key);
        if (!request) {
          continue;
        }
        const name = request.info.name || '';
        if (ignore.includes(name)) {
          continue;
        }
        if (requests.length && !requests.includes(item.key) && !requests.includes(name)) {
          continue;
        }
        yield request;
      } else if (recursive && item.kind === AppProjectFolderKind) {
        const folder = definitions.folders.find(i => i.key === item.key);
        if (!folder) {
          continue;
        }
        const name = folder.info.name || '';
        if (ignore.includes(name)) {
          continue;
        }
        const it = this.requestIterator({
          parent: item.key,
          recursive,
          ignore,
          requests,
        });
        for (const request of it) {
          yield request;
        }
      }
    }
  }
}
