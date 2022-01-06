import { ProjectParent } from './ProjectParent.js';
import { IProjectDefinitionProperty } from './ProjectDefinitionProperty.js';
import { Environment, IEnvironment } from './Environment.js';
import { License, ILicense } from './License.js';
import { Provider, IProvider } from './Provider.js';
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import { ProjectItem, IProjectItem } from './ProjectItem.js';
import { IProjectFolder, ProjectFolder, Kind as ProjectFolderKind } from './ProjectFolder.js';
import { IProjectRequest, ProjectRequest, Kind as ProjectRequestKind } from './ProjectRequest.js';
import { ProjectSchema, IProjectSchema } from './ProjectSchema.js';
import { Request } from './Request.js';
import v4 from '../lib/uuid.js';
import * as PatchUtils from './PatchUtils.js';
import { ARCSavedRequest } from './legacy/request/ArcRequest.js';
import { ArcLegacyProject } from './legacy/models/ArcLegacyProject.js';

export type HttpProjectKind = 'ARC#HttpProject';
export const Kind = 'ARC#HttpProject';

/**
 * A list of options to initialize a project in various situations.
 */
export interface IProjectInitOptions {
  /**
   * The name of the project.
   */
  name: string;
}

export interface IFolderCreateOptions {
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

export interface IFolderSearchOptions {
  /**
   * When set it searches for a folder using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IFolderDeleteOptions {
  /**
   * When set it won't throw an error when the folder is not found in the project.
   */
  safe?: boolean;
}

export interface IRequestAddOptions {
  /**
   * The id of the parent folder. When not set it adds the request to the project root.
   */
  parent?: string;
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IRequestSearchOptions {
  /**
   * When set it searches for a request using keys only. 
   * By default it searches for a key and the name.
   */
  keyOnly?: boolean;
}

export interface IRequestDeleteOptions {
  /**
   * When set it won't throw an error when the request is not found in the project.
   */
  safe?: boolean;
}

export interface IProjectMoveOptions {
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

export interface IReadEnvironmentOptions {
  /**
   * The name or the key of the environment to select.
   * 
   * When the name is not specified it selects: 
   * - the first environment from the project, if any
   * - any parent folder's first environment to the requested folder, if any (if folderKey is set)
   * - the requested folder's first environment, if any (if folderKey is set)
   */
  nameOrKey?: string;
  /**
   * The key of the folder to collect the environments for.
   */
  folderKey?: string;
}

/**
 * The object stored as a list index for the projects.
 * This is used to list projects in the store and in the UI.
 */
export interface IHttpProjectIndex {
  key: string;
  name: string;
  version?: string;
}

export interface IProjectCloneOptions {
  /**
   * Revalidates (re-creates) keys for all object that have keys.
   * @default true
   */
  revalidate?: boolean;
}

/**
 * The new definition of a project in ARC.
 * Note, this is not the same as future `ApiProject` which is reserved for building APIs
 * using RAML or OAS.
 */
export interface IHttpProject extends IProjectDefinitionProperty {
  kind: HttpProjectKind;
  /**
   * The license information for this HTTP project.
   */
  license?: ILicense;
  /**
   * The basic information about the project.
   */
  info: IThing;
  /**
   * Information about project provider.
   */
  provider?: IProvider;
  /**
   * The environments defined for this project.
   */
  environments: IEnvironment[];
  /**
   * The ordered list of HTTP requests / folders in the projects.
   * The UI uses this to manipulate the view without changing the definitions.
   */
  items: IProjectItem[];
  /**
   * The list of all requests stored in this project.
   * Note, this is not used to visualized the request in the UI.
   * This is just the source of data.
   * The `items` property is used to build the view.
   */
  definitions: (IProjectRequest | IProjectFolder)[];
  /**
   * The list of schemas in the HTTP project.
   */
  schemas?: IProjectSchema[];
}

/**
 * An instance of an HttpProject.
 */
export class HttpProject extends ProjectParent {
  kind = Kind;
  private initEnvironments?: Environment[];
  /**
   * The license information for this HTTP project.
   */
  license?: License;
  /**
   * Information about project provider.
   */
  provider?: Provider;
  /**
   * The list of all requests stored in this project.
   * Note, this is not used to visualized the request in the UI.
   * This is just the source of data.
   * The `items` property is used to build the view.
   */
  definitions: (ProjectRequest | ProjectFolder)[] = [];
  /**
   * May be set post project loading. THe list of items id that have no corresponding definitions.
   */
  missingDefinitions?: string[];
  /**
   * The list of schemas in the HTTP project.
   */
  schemas: ProjectSchema[] = [];

  get effectiveEnvironments(): Environment[] {
    if (Array.isArray(this.initEnvironments)) {
      return this.initEnvironments;
    }
    return this.environments;
  }

  /**
   * Creates a new HTTP project from a name.
   * @param {string} name The name to set.
   */
  static fromName(name: string): HttpProject {
    const project = new HttpProject();
    const info = Thing.fromName(name);
    project.info = info;
    return project;
  }

  static async fromLegacy(project: ArcLegacyProject, requests: ARCSavedRequest[]): Promise<HttpProject> {
    const { name='Unnamed project', description, requests: ids } = project;
  
    const result = HttpProject.fromName(name);
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
        const projectRequest = ProjectRequest.fromRequest(request.toJSON(), result);
        result.addRequest(projectRequest);
      });
      await Promise.allSettled(promises);
    }
  
    return result;
  }

  static fromInitOptions(init: IProjectInitOptions): HttpProject {
    const { name='Unnamed project' } = init;
    return HttpProject.fromName(name);
  }

  /**
   * @param input The project definition used to restore the state.
   * @param environments Optional list of environments to use with this project. It overrides environments stored in the project definition.
   */
  constructor(input?: string | IHttpProject, environments?: IEnvironment[]) {
    super();
    if (Array.isArray(environments)) {
      this.initEnvironments = environments.map(i => new Environment(i));
    }
    let init: IHttpProject;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
      if (!init.kind) {
        init.kind = Kind;
      }
    } else {
      init = {
        kind: Kind,
        key: v4(), 
        definitions: [],
        environments: [],
        items: [],
        info: {
          kind: ThingKind,
          name: '',
        },
      }
    }
    this.new(init);
  }

  /**
   * Creates a new project definition clearing anything that is so far defined.
   * 
   * Note, this throws an error when the project is not an ARC project.
   */
  new(init: IHttpProject): void {
    if (!init || !init.definitions || !init.environments || !init.items) {
      throw new Error(`Not an ARC project.`);
    }
    const { key = v4(), definitions, environments, items, info, license, provider, schemas } = init;
    this.key = key;
    this.environments = [];
    if (Array.isArray(environments)) {
      this.environments = environments.map(i => new Environment(i));
    }
    if (license) {
      this.license = new License(license);
    } else {
      this.license = undefined;
    }
    if (provider) {
      this.provider = new Provider(provider);
    } else {
      this.provider = undefined;
    }
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = new Thing({ kind: ThingKind, name: '' });
    }
    this.items = [];
    if (Array.isArray(items)) {
      this.items = items.map(i => new ProjectItem(this, i));
    }
    this.definitions = [];
    if (Array.isArray(definitions)) {
      definitions.forEach((item) => {
        if (ProjectFolder.isProjectFolder(item)) {
          const instance = new ProjectFolder(this, item as IProjectFolder);
          this.definitions.push(instance);
          instance.attachedCallback();
        } else if (ProjectRequest.isProjectRequest(item)) {
          const instance = new ProjectRequest(this, item as IProjectRequest);
          this.definitions.push(instance);
          instance.attachedCallback();
        } else {
          console.warn('Unknown definition', item);
        }
      });
    }
    this.schemas = [];
    if (Array.isArray(schemas)) {
      this.schemas = schemas.map(i => new ProjectSchema(i));
    }
    this.postCreate();
  }

  /**
   * A function that can be overwritten and is called when the project was created.
   */
  postCreate(): void {
    const { items, definitions } = this;
    const missingDefinitions: string[] = [];
    items.forEach((i) => {
      const definition = definitions.find(d => d.key === i.key);
      if (!definition) {
        missingDefinitions.push(i.key);
      }
    });
    if (missingDefinitions.length) {
      this.missingDefinitions = missingDefinitions;
    } else {
      this.missingDefinitions = undefined;
    }
  }

  toJSON(): IHttpProject {
    const result: IHttpProject = {
      kind: Kind,
      key: this.key,
      definitions: [],
      environments: [],
      items: [],
      info: this.info.toJSON(),
    };
    if (Array.isArray(this.definitions) && this.definitions.length) {
      result.definitions = this.definitions.map(i => i.toJSON());
    }
    if (Array.isArray(this.environments) && this.environments.length) {
      result.environments = this.environments.map(i => i.toJSON());
    }
    if (Array.isArray(this.items) && this.items.length) {
      result.items = this.items.map(i => i.toJSON());
    }
    if (Array.isArray(this.schemas) && this.schemas.length) {
      result.schemas = this.schemas.map(i => i.toJSON());
    }
    if (this.provider) {
      result.provider = this.provider.toJSON();
    }
    if (this.license) {
      result.license = this.license.toJSON();
    }
    return result;
  }

  /**
   * @returns JSON representation of the project
   */
  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Finds a parent of a definition.
   * 
   * @param  key The key of the definition.
   * @returns The parent or undefine when not found.
   */
  findParent(key: string): ProjectFolder | HttpProject | undefined {
    const { definitions = [], items = [] } = this;
    const projectItemsIndex = items.findIndex(i => i.key === key);
    if (projectItemsIndex > -1) {
      return this;
    }
    const definition = definitions.find(i => {
      if (i.kind === ProjectFolderKind) {
        const project = (i as ProjectFolder);
        return project.items.some(item => item.key === key);
      }
      return false;
    });
    if (definition) {
      return definition as ProjectFolder;
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
  addFolder(folder: ProjectFolder, opts?: IFolderCreateOptions): ProjectFolder;

  /**
   * Appends new folder to a project from a full folder schema.
   * This is primarily used to insert a folder on the client side
   * after a folder was created in the store.
   * 
   * @param folder The folder schema to add to this project.
   * @param opts Optional folder add options.
   * @returns The added folder.
   */
  addFolder(folder: IProjectFolder, opts?: IFolderCreateOptions): ProjectFolder;

  /**
   * Appends a new folder to the project or a sub-folder.
   * 
   * @param name The name to set. Optional.
   * @param opts Folder create options.
   * @returns The newly inserted folder. If the folder already existed it returns its instance.
   */
  addFolder(name?: string, opts?: IFolderCreateOptions): ProjectFolder;

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
  addFolder(init: string | IProjectFolder | ProjectFolder = ProjectFolder.defaultName, opts: IFolderCreateOptions={}): ProjectFolder {
    if (!Array.isArray(this.items)) {
      this.items = [];
    }
    if (!Array.isArray(this.definitions)) {
      this.definitions = [];
    }
    const { skipExisting, parent } = opts;
    let root: ProjectFolder | HttpProject;
    if (parent) {
      const rootCandidate = this.findFolder(parent);
      if (!rootCandidate) {
        throw new Error(`Unable to find the parent folder ${parent}`);
      }
      root = rootCandidate;
    } else {
      root = this;
    }
    if (skipExisting) {
      const folders = root.listFolderItems();
      for (const item of folders) {
        const existing = this.findFolder(item.key, { keyOnly: true });
        if (existing && existing.info.name === name) {
          return existing;
        }
      }
    }
    let definition: ProjectFolder;
    if (typeof init === 'string') {
      definition = ProjectFolder.fromName(this, init);
    } else if (init instanceof ProjectFolder) {
      definition = init;
    } else {
      definition = new ProjectFolder(this, init);
    }
    this.definitions.push(definition);
    const item = ProjectItem.projectFolder(this, definition.key);
    if (!Array.isArray(root.items)) {
      root.items = [];
    }
    if (typeof opts.index === 'number') {
      root.items.splice(opts.index, 0, item);
    } else {
      root.items.push(item);
    }
    definition.attachedCallback();
    return definition;
  }

  /**
   * Searches for a folder in the structure.
   * 
   * @param nameOrKey The name or the key of the folder.
   * @param opts Optional search options.
   * @returns Found project folder or undefined.
   */
  findFolder(nameOrKey: string, opts: IFolderSearchOptions = {}): ProjectFolder | undefined {
    const { definitions = [] } = this;
    const item = definitions.find((i) => {
      if (i.kind !== ProjectFolderKind) {
        return false;
      }
      const folder = (i as ProjectFolder);
      if (folder.key === nameOrKey) {
        return true;
      }
      if (opts.keyOnly) {
        return false;
      }
      return !!folder.info && folder.info.name === nameOrKey;
    });
    if (item) {
      return item as ProjectFolder;
    }
  }

  /**
   * Removes a folder from the project.
   * @param key The folder key. It ignores the name when searching to the folder to avoid ambiguity.
   * @param opts Folder remove options.
   * @returns The removed folder definition or undefined when not removed.
   */
  removeFolder(key: string, opts: IFolderDeleteOptions = {}): ProjectFolder | undefined {
    const { definitions = [] } = this;
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
    const itemIndex = parent.items.findIndex(i => i.key === key);
    const definitionIndex = definitions.findIndex(i => i.key === key);
    definitions.splice(definitionIndex, 1);
    folder.detachedCallback();
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
  moveFolder(key: string, opts: IProjectMoveOptions={}): void {
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

    if (typeof index === 'number') {
      const maxIndex = Math.max(target.items.length - 1, 0);
      if (index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
    }

    const itemIndex = parentFolder.items.findIndex(i => i.key === key);
    const item = parentFolder.items.splice(itemIndex, 1)[0];
    movedFolder.detachedCallback();

    if (typeof index === 'number') {
      target.items.splice(index, 0, item);
    } else {
      target.items.push(item);
    }
    movedFolder.attachedCallback();
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
    const { items=[] } = target;
    for (const item of items) {
      if (item.key === child) {
        return true;
      }
      if (item.kind === ProjectFolderKind) {
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
  addRequest(url: string, opts?: IRequestAddOptions): ProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * 
   * @param request The request to add.
   * @param opts The request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IProjectRequest | ProjectRequest, opts?: IRequestAddOptions): ProjectRequest;

  /**
   * Adds a request to the project or a sub-folder.
   * @param request The request to add.
   * @param opts Thew request add options.
   * @returns The inserted into the definitions request.
   */
  addRequest(request: IProjectRequest | ProjectRequest | string, opts: IRequestAddOptions={}): ProjectRequest {
    if (!Array.isArray(this.definitions)) {
      this.definitions = [];
    }

    // the request can be already added to the project as the same method is used to refresh a request after 
    // a store update. From the system perspective it is the same event.

    if (typeof request === 'object' && request.key) {
      const existing = this.definitions.find(i => i.key === request.key) as ProjectRequest | undefined;
      if (existing) {
        existing.new(request as IProjectRequest);
        return existing;
      }
    }

    // if we got here, it means that we are adding a new request object to the project.

    let finalRequest;
    if (typeof request === 'string') {
      finalRequest = ProjectRequest.fromUrl(request, this);
    } else if (request instanceof ProjectRequest) {
      finalRequest = request;
      if (finalRequest.project && finalRequest.project !== this) {
        finalRequest.detachedCallback();
      }
      finalRequest.project = this;
    } else {
      finalRequest = new ProjectRequest(this, request);
    }
    if (!finalRequest.key) {
      finalRequest.key = v4();
    }
    
    let root: ProjectFolder | HttpProject;
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

    this.definitions.push(finalRequest);
    const item = ProjectItem.projectRequest(this, finalRequest.key);
    
    if (typeof opts.index === 'number') {
      root.items.splice(opts.index, 0, item);
    } else {
      root.items.push(item);
    }
    finalRequest.attachedCallback();
    return finalRequest;
  }

  /**
   * Searches for a request in the project.
   * 
   * @param nameOrKey The name or the key of the request.
   * @param opts Optional search options.
   * @returns Found project request or undefined.
   */
  findRequest(nameOrKey: string, opts: IRequestSearchOptions = {}): ProjectRequest | undefined {
    const { definitions = [] } = this;
    const item = definitions.find((i) => {
      if (i.kind !== ProjectRequestKind) {
        return false;
      }
      const request = (i as ProjectRequest);
      if (request.key === nameOrKey) {
        return true;
      }
      if (opts.keyOnly) {
        return false;
      }
      return !!request.info && request.info.name === nameOrKey;
    });
    if (item) {
      return item as ProjectRequest;
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
  removeRequest(key: string, opts: IRequestDeleteOptions = {}): ProjectRequest | undefined {
    const { definitions = [] } = this;
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
    const definitionIndex = definitions.findIndex(i => i.key === key);
    definitions.splice(definitionIndex, 1);
    request.detachedCallback();
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
  moveRequest(key: string, opts: IProjectMoveOptions={}): void {
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

    if (typeof index === 'number') {
      const maxIndex = Math.max(target.items.length - 1, 0);
      if (index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
    }

    const itemIndex = parentFolder.items.findIndex(i => i.key === key);
    const item = parentFolder.items.splice(itemIndex, 1)[0];
    request.detachedCallback();

    if (typeof index === 'number') {
      target.items.splice(index, 0, item);
    } else {
      target.items.push(item);
    }
    request.attachedCallback();
  }

  /**
   * Lists items (not the actual definitions!) that are folders.
   */
  listFolderItems(): ProjectItem[] {
    const { items=[] } = this;
    return items.filter(i => i.kind === ProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): ProjectItem[] {
    const { items=[] } = this;
    return items.filter(i => i.kind === ProjectRequestKind);
  }

  /**
   * Lists folders from the project or a sub-folder.
   * @param folder The optional folder name or the key to list folders for.
   */
  listFolders(folder?: string): ProjectFolder[] {
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
    const items = root.listFolderItems();
    const result: ProjectFolder[] = [];
    const { definitions } = this;
    items.forEach((i) => {
      const definition = definitions.find(d => i.key === d.key);
      if (definition) {
        result.push(definition as ProjectFolder);
      }
    });
    return result;
  }

  /**
   * Lists requests in this project or a sub-folder.
   * @param folder The optional folder name or the key to list requests for.
   */
  listRequests(folder?: string): ProjectRequest[] {
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
    const result: ProjectRequest[] = [];
    const { definitions } = this;
    items.forEach((i) => {
      const definition = definitions.find(d => i.key === d.key);
      if (definition) {
        result.push(definition as ProjectRequest);
      }
    });
    return result;
  }

  /**
   * Lists definitions for the `items` of the project or a folder.
   * @param folder Optionally the folder name to list the definitions for.
   */
  listDefinitions(folder?: string): (ProjectFolder | ProjectRequest)[] {
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
    const result: (ProjectFolder | ProjectRequest)[] = [];
    const { items=[] } = root;
    const { definitions=[] } = this;
    items.forEach((item) => {
      const definition = definitions.find(d => item.key === d.key);
      if (definition) {
        result.push(definition);
      }
    });
    return result;
  }

  /**
   * Patches the project.
   * @param operation The operation to perform.
   * @param path The path to the value to update.
   * @param value Optional, the value to set.
   */
  patch(operation: PatchUtils.PatchOperation, path: string, value?: unknown): PatchUtils.StorePatchResult | undefined {
    if (!PatchUtils.patchOperations.includes(operation)) {
      throw new Error(`Unknown operation: ${operation}.`);
    }
    if (PatchUtils.valueRequiredOperations.includes(operation) && typeof value === 'undefined') {
      throw new Error(PatchUtils.TXT_value_required);
    }
    const parts = path.split('.');
    this.validatePatch(parts);
    // const root: keyof HttpProject = parts[0] as keyof HttpProject;
    const root: string = parts[0];

    let oldValue: unknown | undefined;
    if (root === 'info') {
      oldValue = this.info.patch(operation, parts.slice(1).join('.'), value);
    } else if (root === 'license') {
      oldValue = this.patchLicense(operation, parts.slice(1).join('.'), value);
    } else if (root === 'provider') {
      oldValue = this.patchProvider(operation, parts.slice(1).join('.'), value);
    } else if (root === 'requests') {
      oldValue = this.patchRequest(operation, value);
    }
    return {
      path,
      time: Date.now(),
      operation,
      oldValue,
      value,
      id: this.key,
      kind: Kind,
    };
  }

  validatePatch(path: string[]): void {
    if (!path.length) {
      throw new Error(PatchUtils.TXT_unknown_path);
    }
    // const root: keyof HttpProject = path[0] as keyof HttpProject;
    const root: string = path[0];
    switch (root) {
      case 'items':
      case 'environments':
      case 'definitions':
        throw new Error(PatchUtils.TXT_use_command_instead);
      case 'kind':
        throw new Error(PatchUtils.TXT_delete_kind);
      case 'info': 
      case 'license': 
      case 'provider': 
        // they have their own validators.
        return;
      case 'requests':
        // allowed for now
        return;
      default:
        throw new Error(PatchUtils.TXT_unknown_path);
    }
  }

  /**
   * Shortcut to read provider info, create it if missing, and calling patch on the provider.
   */
  patchProvider(operation: PatchUtils.PatchOperation, path: string, value?: unknown): any | undefined {
    return this.ensureProvider().patch(operation, path, value);
  }

  /**
   * Shortcut to read license info, create it if missing, and calling patch on the license.
   */
  patchLicense(operation: PatchUtils.PatchOperation, path: string, value?: unknown): any | undefined {
    return this.ensureLicense().patch(operation, path, value);
  }

  /**
   * Performs the PATCH operation on a request.
   * 
   * @returns The old value, if applicable.
   */
  patchRequest(operation: PatchUtils.PatchOperation, value: unknown): any | undefined {
    if (operation === 'append') {
      if (!value) {
        throw new Error(`The value for the "append" operation must be set.`);
      }
      const pr = value as IProjectRequest;
      if (!pr.key) {
        // this will pass this by-reference to the caller so the changelog
        // is created with the key.
        pr.key = v4();
      }
      this.addRequest(value as IProjectRequest);
      // old value does not exist
      return undefined;
    }
    if (operation === 'delete') {
      const request = this.findRequest(value as string, { keyOnly: true });
      if (!request) {
        throw new Error(`Unable to find a request identified by ${value}`);
      }
      const oldValue = request.toJSON();
      request.remove();
      return oldValue;
    }
    throw new Error(`Unsupported operation: ${operation}`);
  }

  /**
   * Makes sure the license information exists.
   * @returns The set license.
   */
  ensureLicense(): License {
    if (!this.license) {
      this.license = new License();
    }
    return this.license;
  }

  /**
   * Makes sure the Provider information exists.
   * @returns The set provider.
   */
  ensureProvider(): Provider {
    if (!this.provider) {
      this.provider = new Provider();
    }
    return this.provider;
  }

  /**
   * @returns On the project level this always returns undefined.
   */
  getParent(): ProjectFolder | HttpProject | undefined {
    return undefined;
  }

  attachedCallback(): void {
    // ...
  }

  detachedCallback(): void {
    // ...
  }

  getProject(): HttpProject {
    return this;
  }

  /**
   * Reads the list of environments from then selected folder up to the project environments.
   * It stops going up in the project structure when selected environment has the `encapsulated`
   * property set to true.
   * The environments are ordered from the top-most level to the selected folder.
   * 
   * @param opts The environment read options
   */
  async readEnvironments(opts: IReadEnvironmentOptions = {}): Promise<Environment[]> {
    const result: Environment[] = [];
    const { folderKey, nameOrKey } = opts;

    const root = folderKey ? this.findFolder(folderKey, { keyOnly: true }) : this;
    if (!root) {
      return result;
    }

    let current: HttpProject | ProjectFolder | undefined = root;
    while (current) {
      const { environments } = current;
      if (Array.isArray(environments) && environments.length) {
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
   * Makes a copy of this project.
   */
  clone(opts: IProjectCloneOptions = {}): HttpProject {
    const copy = new HttpProject(this.toJSON());
    if (opts.revalidate !== false) {
      HttpProject.regenerateKeys(copy);
    }
    return copy;
  }

  static clone(project: IHttpProject, opts: IProjectCloneOptions = {}): HttpProject {
    const obj = new HttpProject(project);
    return obj.clone(opts);
  }

  /**
   * Re-generates keys in the project, taking care of the references.
   * 
   * Note, this changes the project properties. Make a copy of the project before calling this.
   * 
   * @param src The project instance to re-generate keys for.
   */
  static regenerateKeys(src: HttpProject): void {
    const { items=[], definitions=[], schemas=[], environments=[] } = src;

    // create a flat list of all "items" in the project and all folders.
    let flatItems = [...items];
    definitions.forEach((item) => {
      if (item.kind === ProjectFolderKind) {
        const folder = (item as ProjectFolder);
        if (Array.isArray(folder.items) && folder.items.length) {
          flatItems = flatItems.concat(folder.items);
        }
      }
    });

    // iterates over definitions and changes the keys in the definition and the related "item".
    definitions.forEach((item) => {
      const oldKey = item.key;
      if (!oldKey) {
        return;
      }
      const indexObject = flatItems.find(i => i.key === oldKey);
      if (!indexObject) {
        return;
      }
      const newKey = v4();
      indexObject.key = newKey;
      item.key = newKey;
    });

    environments.forEach((env) => {
      env.key = v4();
    });

    schemas.forEach((env) => {
      env.key = v4();
    });
  }
}
