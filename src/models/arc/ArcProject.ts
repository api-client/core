/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable max-classes-per-file */
// import { ARCHistoryRequest, ARCSavedRequest } from "@api-client/core/build/legacy.js";

import v4 from "../../lib/uuid.js";
import { HttpRequest, IHttpRequest } from "../HttpRequest.js";
import { IRequest, Request } from "../Request.js";
import { IThing, Thing } from "../Thing.js";
import { ARCHistoryRequest, ARCSavedRequest } from "../legacy/request/ArcRequest.js";

export const ArcProjectKind = 'ARC#HttpProject';
export const ArcProjectFolderKind = 'ARC#HttpProjectFolder';
export const ArcProjectRequestKind = 'ARC#HttpProjectRequest';

export interface IArcRequestCloneOptions {
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

export interface IArcFolderAddOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IArcFolderCloneOptions {
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
  targetProject?: ArcProject;
  /**
   * The **key** of the target folder.
   * 
   * By default it clones the folder to its parent unless the clone is attached to another project. 
   * When the target folder is set then it places the clone under the passed target folder.
   */
  targetFolder?: string;
}

export interface IArcFolderCreateOptions {
  /**
   * Ignores the operation when the folder with the same name already exists. 
   * This command can be used used to ensure that the folder exists.
   */
  skipExisting?: boolean;
  /**
   * The id of the parent folder. When not set it adds the folder to the project root.
   */
  parent?: string;
  /**
   * Optionally the position at which to add the folder into the list of items.
   */
  index?: number;
}

export interface IArcFolderSearchOptions {
  /**
   * When set it searches for a folder using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IArcFolderDeleteOptions {
  /**
   * When set it won't throw an error when the folder is not found in the project.
   */
  safe?: boolean;
}

export interface IArcRequestAddOptions {
  /**
   * The id of the parent folder. When not set it adds the request to the project root.
   */
  parent?: string;
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IArcRequestSearchOptions {
  /**
   * When set it searches for a request using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IArcRequestDeleteOptions {
  /**
   * When set it won't throw an error when the request is not found in the project.
   */
  safe?: boolean;
}

export interface IArcProjectMoveOptions {
  /**
   * The position at which to insert the object in the destination. BY default it adds the object at the end.
   */
  index?: number;
  /**
   * The name or the key of the parent folder to move the item into. 
   * When not set it moves the item to the project's root.
   */
  parent?: string;
}

export interface IArcFolderListOptions {
  /**
   * Folder name or key to list folders for.
   */
  folder?: string;
}

export interface IArcProjectCloneOptions {
  /**
   * By default it revalidates (re-creates) keys in the request.
   * Set this to true to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
}

export interface IArcProjectRequest extends IRequest {
  kind: typeof ArcProjectRequestKind;
  key: string;
}

export interface IArcProjectItem {
  kind: typeof ArcProjectFolderKind | typeof ArcProjectRequestKind;
  key: string;
}

export interface IArcProjectDefinitions {
  /**
   * The list of all folders defined in the project.
   */
  folders?: IProjectParent[];
  /**
   * The list of all requests defined in the project.
   */
  requests?: IArcProjectRequest[];
}

export interface ArcProjectDefinitions {
  /**
   * The list of all folders defined in the project.
   */
  folders: ArcProjectFolder[];
  /**
   * The list of all requests defined in the project.
   */
  requests: ArcProjectRequest[];
}

export interface IArcProject extends IProjectParent {
  definitions: IArcProjectDefinitions;
}

export interface IProjectParent {
  key: string;
  /**
   * The auto-generated key for the folder object.
   * For the project root this is the same as the `_id`.
   */
  kind: typeof ArcProjectKind | typeof ArcProjectFolderKind;
  /**
   * Folder meta
   */
  info: IThing;
  /**
   * The list of items in the folder.
   * It is an ordered list of requests and folders.
   * The actual definition is kept in the root's `definitions`.
   */
  items: IArcProjectItem[];
  /**
   * Timestamp when the project was last updated.
   */
  updated?: number;
  /**
   * Timestamp when the project was created.
   */
  created?: number;
}

export class ArcProjectRequest extends Request {
  kind = ArcProjectRequestKind;

  /**
   * The identifier of the request.
   */
  key = '';

  /**
   * A reference to the top level project object.
   */
  project: ArcProject;

  /**
   * Creates a project request from an URL.
   * This does not manipulate the project.
   * 
   * @param url The Request URL. This is required.
   * @param project The parent project.
   */
  static fromUrl(url: string, project?: ArcProject): ArcProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new ArcProjectRequest(project, {
      key: v4(),
      kind: ArcProjectRequestKind,
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
  static fromName(name: string, project?: ArcProject): ArcProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new ArcProjectRequest(project, {
      key: v4(),
      kind: ArcProjectRequestKind,
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
  static fromHttpRequest(info: IHttpRequest, project?: ArcProject): ArcProjectRequest {
    if (!project) {
      throw new Error(`The project is required.`);
    }
    const now: number = Date.now();
    const request = new ArcProjectRequest(project, {
      key: v4(),
      kind: ArcProjectRequestKind,
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
  static fromRequest(request: IRequest, project: ArcProject): ArcProjectRequest {
    const key = v4();
    const init: IArcProjectRequest = { ...request, key, kind: ArcProjectRequestKind };
    const result = new ArcProjectRequest(project, init);
    return result;
  }

  constructor(project: ArcProject, input?: string | IArcProjectRequest) {
    super(input);
    this.project = project;

    let init: IArcProjectRequest | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key || v4();
    }
    this.kind = ArcProjectRequestKind;
  }

  new(init: IArcProjectRequest): void {
    super.new(init);

    const { key = v4() } = init;
    this.key = key;
    this.kind = ArcProjectRequestKind;
  }

  toJSON(): IArcProjectRequest {
    const request = super.toJSON();
    const result: IArcProjectRequest = { ...request, key: this.key, kind: ArcProjectRequestKind };
    return result;
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closes parent of this instance.
   */
  getParent(): ArcProjectFolder | ArcProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): ArcProject {
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
  clone(opts: IArcRequestCloneOptions = {}): ArcProjectRequest {
    const copy = new ArcProjectRequest(this.project, this.toJSON());
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
  static clone(request: IArcProjectRequest, project: ArcProject, opts: IArcRequestCloneOptions = {}): ArcProjectRequest {
    const obj = new ArcProjectRequest(project, request);
    return obj.clone(opts);
  }
}

export class ArcProjectItem {
  /**
   * The kind of the item.
   */
  kind: typeof ArcProjectFolderKind | typeof ArcProjectRequestKind = ArcProjectRequestKind;

  /**
   * The identifier of the object in the `definitions` array of the project.
   */
  key = '';

  /**
   * A reference to the top level project object.
   */
  project: ArcProject;

  /**
   * Checks whether the input is a definition of a project item.
   */
  static isProjectItem(input: unknown): boolean {
    const typed = input as IArcProjectItem;
    if (!input || ![ArcProjectFolderKind, ArcProjectRequestKind].includes(typed.kind)) {
      return false;
    }
    return true;
  }

  /**
   * @return An instance that represents a request item
   */
  static projectRequest(project: ArcProject, key: string): ArcProjectItem {
    const item = new ArcProjectItem(project, {
      kind: ArcProjectRequestKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents a folder item
   */
  static projectFolder(project: ArcProject, key: string): ArcProjectItem {
    const item = new ArcProjectItem(project, {
      kind: ArcProjectFolderKind,
      key,
    });
    return item;
  }

  /**
   * @param project The top-most project.
   * @param input The project item definition used to restore the state.
   */
  constructor(project: ArcProject, input: string | IArcProjectItem) {
    this.project = project;
    let init: IArcProjectItem;
    if (typeof input === 'string') {
      if (input === 'http-request') {
        init = {
          kind: ArcProjectRequestKind,
          key: '',
        };
      } else if (input === 'folder') {
        init = {
          kind: ArcProjectFolderKind,
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
  new(init: IArcProjectItem): void {
    if (!ArcProjectItem.isProjectItem(init)) {
      throw new Error(`Not a project item.`);
    }
    const { kind, key } = init;
    this.kind = kind;
    this.key = key;
  }

  toJSON(): IArcProjectItem {
    const result: IArcProjectItem = {
      kind: this.kind,
      key: this.key,
    };
    return result;
  }

  /**
   * @returns The instance of the definition associated with this item.
   */
  getItem(): ArcProjectFolder | ArcProjectRequest | undefined {
    const { project, key, kind } = this;
    const { definitions } = project;
    if (kind === ArcProjectRequestKind) {
      return definitions.requests.find(i => i.key === key);
    }
    if (kind === ArcProjectFolderKind) {
      return definitions.folders.find(i => i.key === key);
    }
    return undefined;
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closest parent of this item.
   */
  getParent(): ArcProjectFolder | ArcProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }
}

export abstract class ArcProjectParent {
  /**
   * The auto-generated key for the folder object.
   * For the project root this is the same as the `_id`.
   */
  kind: typeof ArcProjectKind | typeof ArcProjectFolderKind;

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
  items: ArcProjectItem[] = [];

  /**
   * Timestamp when the project was last updated.
   */
  updated: number = Date.now();

  /**
   * Timestamp when the project was created.
   */
  created: number = Date.now();

  constructor(kind: typeof ArcProjectKind | typeof ArcProjectFolderKind, input?: string | IProjectParent) {
    this.kind = kind;

    let init: IProjectParent;
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
  new(init: IProjectParent): void {
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

  abstract setItems(items?: IArcProjectItem[]): void;

  /**
   * Lists items (not the actual definitions!) that are folders.
   */
  listFolderItems(): ArcProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ArcProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): ArcProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ArcProjectRequestKind);
  }
}

export class ArcProjectFolder extends ArcProjectParent {

  project: ArcProject;

  /**
   * Creates a new ArcProjectFolder object from a name.
   * @param project The top-most project.
   * @param name The name to set.
   */
  static fromName(project: ArcProject, name = 'New folder'): ArcProjectFolder {
    const now = Date.now();
    const key = v4();
    const info = Thing.fromName(name);
    const definition = new ArcProjectFolder(project, {
      key,
      created: now,
      updated: now,
      items: [],
      kind: ArcProjectFolderKind,
      info: info.toJSON(),
    });
    return definition;
  }

  constructor(project: ArcProject, input?: string | IProjectParent) {
    super(ArcProjectFolderKind, input);
    this.project = project;

    let init: IProjectParent | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key || v4();
    }
    this.kind = ArcProjectFolderKind;
  }

  toJSON(): IProjectParent {
    const result: IProjectParent = {
      kind: ArcProjectFolderKind,
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

  setItems(items?: IArcProjectItem[]): void {
    if (Array.isArray(items)) {
      this.items = items.map(i => new ArcProjectItem(this.project, i));
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
  addFolder(folder: ArcProjectFolder): ArcProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @returns The added folder.
   */
  addFolder(folder: IProjectParent): ArcProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string): ArcProjectFolder;

  /**
   * Appends a new folder to the folder. It updates the project to add the request definition.
   * @param name The name to set. Optional.
   * @returns The key of newly inserted folder.
   */
  addFolder(name: string | IProjectParent | ArcProjectFolder | undefined): ArcProjectFolder {
    return this.project.addFolder(name as ArcProjectFolder, { parent: this.key });
  }

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param url The URL of the request.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(url: string, opts?: IArcFolderAddOptions): ArcProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IArcProjectRequest | ArcProjectRequest, opts?: IArcFolderAddOptions): ArcProjectRequest;

  /**
   * Appends a new request to the folder. It updates the project to add the request definition.
   * @param request The request to append to the folder.
   * @returns The key of newly inserted request.
   */
  addRequest(request: IArcProjectRequest | ArcProjectRequest | string, opts: IArcFolderAddOptions = {}): ArcProjectRequest {
    const addOptions = { parent: this.key, ...opts };
    if (typeof request === 'string') {
      return this.project.addRequest(request, addOptions);
    }
    return this.project.addRequest(request, addOptions);
  }

  /**
   * @returns The instance of the ArcProject or a ArcProjectFolder that is a closes parent of this instance.
   */
  getParent(): ArcProjectFolder | ArcProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): ArcProject {
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
  clone(opts: IArcFolderCloneOptions = {}): ArcProjectFolder {
    const { targetProject = this.project, targetFolder } = opts;
    const copy = new ArcProjectFolder(targetProject, this.toJSON());
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
  protected cloneRequests(folder: ArcProjectFolder, project: ArcProject): void {
    const requests = this.items.filter(i => i.kind === ArcProjectRequestKind);
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
  protected cloneSubFolders(folder: ArcProjectFolder, project: ArcProject, withRequests = true): void {
    const folders = this.items.filter(i => i.kind === ArcProjectFolderKind);
    folders.forEach(f => {
      const definition = project.findFolder(f.key, { keyOnly: true });
      if (!definition) {
        return;
      }
      const copy = new ArcProjectFolder(folder.getProject(), definition.toJSON());
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
  listFolders(): ArcProjectFolder[] {
    return this.project.listFolders({ folder: this.key });
  }

  /**
   * Lists requests in this folder.
   */
  listRequests(): ArcProjectRequest[] {
    return this.project.listRequests(this.key);
  }

  /**
   * Adds a request to the project that has been created for a previous version of ARC.
   * 
   * @param legacy The legacy request definition.
   * @returns The created project request.
   */
  async addLegacyRequest(legacy: ARCSavedRequest | ARCHistoryRequest): Promise<ArcProjectRequest> {
    const request = await Request.fromLegacy(legacy);
    const projectRequest = ArcProjectRequest.fromRequest(request.toJSON(), this.project);
    return this.addRequest(projectRequest);
  }
}

export class ArcProject extends ArcProjectParent {
  /**
   * Timestamp when the project was last updated.
   */
  updated: number = Date.now();

  /**
   * Timestamp when the project was created.
   */
  created: number = Date.now();

  definitions: ArcProjectDefinitions;

  /**
   * Creates a new ARC project from a name.
   * @param name The name to set.
   */
  static fromName(name: string): ArcProject {
    const project = new ArcProject();
    const info = Thing.fromName(name);
    project.info = info;
    return project;
  }

  constructor(input?: string | IArcProject) {
    super(ArcProjectKind);
    this.definitions = {
      folders: [],
      requests: [],
    };
    let init: IArcProject;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
      if (!init.kind) {
        init.kind = ArcProjectKind;
      }
    } else {
      init = {
        kind: ArcProjectKind,
        key: v4(),
        definitions: {},
        items: [],
        info: Thing.fromName('').toJSON(),
      }
    }
    this.new(init);
  }

  new(init: IArcProject): void {
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
    };
    if (Array.isArray(definitions.requests)) {
      this.definitions.requests = definitions.requests.map(i => {
        const instance = new ArcProjectRequest(this, i);
        return instance;
      });
    }
    if (Array.isArray(definitions.folders)) {
      this.definitions.folders = definitions.folders.map(i => {
        const instance = new ArcProjectFolder(this, i);
        return instance;
      });
    }
  }

  toJSON(): IArcProject {
    const result: IArcProject = {
      kind: ArcProjectKind,
      key: this.key,
      definitions: {},
      items: [],
      info: this.info.toJSON(),
    };
    if (Array.isArray(this.definitions.requests) && this.definitions.requests.length) {
      result.definitions.requests = this.definitions.requests.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.folders) && this.definitions.folders.length) {
      result.definitions.folders = this.definitions.folders.map(i => i.toJSON());
    }
    if (Array.isArray(this.items) && this.items.length) {
      result.items = this.items.map(i => i.toJSON());
    }
    return result;
  }

  setItems(items?: IArcProjectItem[]): void {
    if (Array.isArray(items)) {
      this.items = items.map(i => new ArcProjectItem(this, i));
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
  findParent(key: string): ArcProjectFolder | ArcProject | undefined {
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
  addFolder(folder: ArcProjectFolder, opts?: IArcFolderCreateOptions): ArcProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @param opts Optional folder add options.
   * @returns The added folder.
   */
  addFolder(folder: IProjectParent, opts?: IArcFolderCreateOptions): ArcProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @param opts Folder create options.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string, opts?: IArcFolderCreateOptions): ArcProjectFolder;

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
  addFolder(init: string | IProjectParent | ArcProjectFolder = 'New Folder', opts: IArcFolderCreateOptions = {}): ArcProjectFolder {
    if (!Array.isArray(this.items)) {
      this.items = [];
    }
    if (!Array.isArray(this.definitions.folders)) {
      this.definitions.folders = [];
    }
    const { skipExisting, parent } = opts;
    let root: ArcProjectFolder | ArcProject;
    if (parent) {
      const rootCandidate = this.findFolder(parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent folder ${parent}`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }
    let definition: ArcProjectFolder;
    if (typeof init === 'string') {
      definition = ArcProjectFolder.fromName(this, init);
    } else if (init instanceof ArcProjectFolder) {
      definition = init;
    } else {
      definition = new ArcProjectFolder(this, init);
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
    const item = ArcProjectItem.projectFolder(this, definition.key);
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
  findFolder(nameOrKey: string, opts: IArcFolderSearchOptions = {}): ArcProjectFolder | undefined {
    const { definitions } = this;
    const item = definitions.folders.find((i) => {
      if (i.kind !== ArcProjectFolderKind) {
        return false;
      }
      const folder = (i as ArcProjectFolder);
      if (folder.key === nameOrKey) {
        return true;
      }
      if (opts.keyOnly) {
        return false;
      }
      return !!folder.info && folder.info.name === nameOrKey;
    });
    if (item) {
      return item as ArcProjectFolder;
    }
    return undefined;
  }

  /**
   * Removes a folder from the project.
   * @param key The folder key. It ignores the name when searching to the folder to avoid ambiguity.
   * @param opts Folder remove options.
   * @returns The removed folder definition or undefined when not removed.
   */
  removeFolder(key: string, opts: IArcFolderDeleteOptions = {}): ArcProjectFolder | undefined {
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
  moveFolder(key: string, opts: IArcProjectMoveOptions = {}): void {
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
      if (item.kind === ArcProjectFolderKind) {
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
  addRequest(url: string, opts?: IArcRequestAddOptions): ArcProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IArcProjectRequest | ArcProjectRequest, opts?: IArcRequestAddOptions): ArcProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * @param request The request to add.
   * @param opts Thew request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IArcProjectRequest | ArcProjectRequest | string, opts: IArcRequestAddOptions = {}): ArcProjectRequest {
    if (!Array.isArray(this.definitions.requests)) {
      this.definitions.requests = [];
    }

    // the request can be already added to the project as the same method is used to refresh a request after 
    // a store update. From the system perspective it is the same event.

    if (typeof request === 'object' && request.key) {
      const existing = this.definitions.requests.find(i => i.key === request.key);
      if (existing) {
        existing.new(request as IArcProjectRequest);
        return existing;
      }
    }

    // if we got here, it means that we are adding a new request object to the project.

    let finalRequest;
    if (typeof request === 'string') {
      finalRequest = ArcProjectRequest.fromUrl(request, this);
    } else if (request instanceof ArcProjectRequest) {
      finalRequest = request;
      finalRequest.project = this;
    } else {
      finalRequest = new ArcProjectRequest(this, request);
    }
    if (!finalRequest.key) {
      finalRequest.key = v4();
    }

    let root: ArcProjectFolder | ArcProject;
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
    const item = ArcProjectItem.projectRequest(this, finalRequest.key);

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
  async addLegacyRequest(legacy: ARCSavedRequest | ARCHistoryRequest): Promise<ArcProjectRequest> {
    const request = await Request.fromLegacy(legacy);
    const projectRequest = ArcProjectRequest.fromRequest(request.toJSON(), this);
    return this.addRequest(projectRequest);
  }

  /**
   * Searches for a request in the project.
   * 
   * @param nameOrKey The name or the key of the request.
   * @param opts Optional search options.
   * @returns Found project request or undefined.
   */
  findRequest(nameOrKey: string, opts: IArcRequestSearchOptions = {}): ArcProjectRequest | undefined {
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
      return item as ArcProjectRequest;
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
  removeRequest(key: string, opts: IArcRequestDeleteOptions = {}): ArcProjectRequest | undefined {
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
  moveRequest(key: string, opts: IArcProjectMoveOptions = {}): void {
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
  listFolderItems(): ArcProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ArcProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): ArcProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ArcProjectRequestKind);
  }

  /**
   * Lists folders from the project or a sub-folder.
   * @param opts Folder listing options.
   */
  listFolders(opts: IArcFolderListOptions = {}): ArcProjectFolder[] {
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
    const result: ArcProjectFolder[] = [];
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
  listRequests(folder?: string): ArcProjectRequest[] {
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
    const result: ArcProjectRequest[] = [];
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
  listDefinitions(folder?: string): (ArcProjectFolder | ArcProjectRequest)[] {
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
    const result: (ArcProjectFolder | ArcProjectRequest)[] = [];
    const { items = [] } = root;
    const { definitions } = this;
    items.forEach((item) => {
      let definition: ArcProjectFolder | ArcProjectRequest | undefined;
      if (item.kind === ArcProjectFolderKind) {
        definition = definitions.folders.find(d => item.key === d.key);
      } else if (item.kind === ArcProjectRequestKind) {
        definition = definitions.requests.find(d => item.key === d.key);
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
  getParent(): ArcProjectFolder | ArcProject | undefined {
    return undefined;
  }

  getProject(): ArcProject {
    return this;
  }

  /**
   * Makes a copy of this project.
   */
  clone(opts: IArcProjectCloneOptions = {}): ArcProject {
    const copy = new ArcProject(this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
      ArcProject.regenerateKeys(copy);
    }
    return copy;
  }

  static clone(project: IArcProject, opts: IArcProjectCloneOptions = {}): ArcProject {
    const obj = new ArcProject(project);
    return obj.clone(opts);
  }

  /**
   * Re-generates keys in the project, taking care of the references.
   * 
   * Note, this changes the project properties. Make a copy of the project before calling this.
   * 
   * @param src The project instance to re-generate keys for.
   */
  static regenerateKeys(src: ArcProject): void {
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
  }
}
