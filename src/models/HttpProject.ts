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
import { ARCSavedRequest, ARCHistoryRequest } from './legacy/request/ArcRequest.js';
import { ArcLegacyProject, ARCProject } from './legacy/models/ArcLegacyProject.js';
import { PostmanDataTransformer } from './transformers/PostmanDataTransformer.js';

export const Kind = 'Core#HttpProject';

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
   * By default it revalidates (re-creates) keys in the request.
   * Set this to true to not make any changes to the keys.
   */
  withoutRevalidate?: boolean;
}

export interface IFolderListOptions {
  /**
   * Folder name or key to list folders for.
   */
  folder?: string;
}

export interface ISchemaAddOptions {
  /**
   * Optionally the position at which to add the schema into the list of schemas.
   */
  index?: number;
}

export interface IProjectRequestIterator {
  /**
   * The parent folder key or name. Sets the starting point to iterate over the requests.
   */
  parent?: string
  /**
   * When set it includes requests in the current folder and sub-folder according to the order
   * defined in the folder.
   */
  recursive?: boolean;
  /**
   * Limits the number of requests to include in the iterator.
   * It is an array of request keys or names.
   */
  requests?: string[];
  /**
   * The opposite of the `requests`. The list of names or keys of requests or folders to ignore.
   * Note, ignore is tested before the `requests`.
   */
  ignore?: string[];
}

/**
 * The new definition of a project in API Client.
 * Note, this is not the same as future `ApiProject` which is reserved for building APIs
 * using RAML or OAS.
 */
export interface IHttpProject extends IProjectDefinitionProperty {
  kind: typeof Kind;
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
   * The ordered list of HTTP requests / folders in the projects.
   * The UI uses this to manipulate the view without changing the definitions.
   */
  items: IProjectItem[];
  /**
   * The project definitions.
   * This is where all the data are stored.
   */
  definitions: IHttpProjectDefinitions;
  /**
   * The list of environment keys to apply to the project.
   * Each key references an environment in the `definitions.environments` array.
   */
  environments?: string[];
}

export interface IHttpProjectDefinitions {
  requests?: IProjectRequest[];
  folders?: IProjectFolder[];
  schemas?: IProjectSchema[];
  environments?: IEnvironment[];
}

interface HttpProjectDefinitions {
  requests: ProjectRequest[];
  folders: ProjectFolder[];
  schemas: ProjectSchema[];
  environments: Environment[];
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
  definitions: HttpProjectDefinitions = HttpProject.defaultDefinitions();

  static defaultDefinitions(): HttpProjectDefinitions {
    return { environments: [], folders: [], requests: [], schemas: [] };
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

  /**
   * Creates an HTTP project instance from ARC's legacy project definition.
   */
  static async fromLegacy(project: ArcLegacyProject, requests: ARCSavedRequest[]): Promise<HttpProject> {
    const { name = 'Unnamed project', description, requests: ids } = project;
    const typedLegacyDb = project as ARCProject;
    const result = HttpProject.fromName(name);
    if (typedLegacyDb._id) {
      result.key = typedLegacyDb._id;
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
        const projectRequest = ProjectRequest.fromRequest(request.toJSON(), result);
        if (old._id) {
          projectRequest.key = old._id;
        }
        result.addRequest(projectRequest);
      });
      await Promise.allSettled(promises);
    }
    return result;
  }

  /**
   * Creates an HTTP project from a Postman collection
   * @param init The postman collection object or a string that can be parsed to one.
   */
  static async fromPostman(init: any): Promise<HttpProject> { 
    const result = await PostmanDataTransformer.transform(init);
    if (Array.isArray(result) && result.length > 1) {
      throw new Error(`Unable to process postman data. It contains multiple collections.`);
    }
    const project = Array.isArray(result) ? result[0] : result;
    return project;
  }

  /**
   * Creates a new project from a set of options.
   */
  static fromInitOptions(init: IProjectInitOptions): HttpProject {
    const { name = 'Unnamed project' } = init;
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
        definitions: {},
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
   * Note, this throws an error when the project is not an API Client project.
   */
  new(init: IHttpProject): void {
    if (!init || !init.definitions || !init.items) {
      throw new Error(`Not a project.`);
    }
    const { key = v4(), definitions = {}, items, info, license, provider, environments } = init;
    this.key = key;
    this.environments = [];
    if (Array.isArray(environments)) {
      this.environments = [...environments];
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
    this.definitions = HttpProject.defaultDefinitions();
    if (Array.isArray(definitions.environments)) {
      this.definitions.environments = definitions.environments.map(i => new Environment(i));
    }
    if (Array.isArray(definitions.requests)) {
      this.definitions.requests = definitions.requests.map(i => {
        const instance = new ProjectRequest(this, i);
        instance.attachedCallback();
        return instance;
      });
    }
    if (Array.isArray(definitions.folders)) {
      this.definitions.folders = definitions.folders.map(i => {
        const instance = new ProjectFolder(this, i);
        instance.attachedCallback();
        return instance;
      });
    }
    if (Array.isArray(definitions.schemas)) {
      this.definitions.schemas = definitions.schemas.map(i => new ProjectSchema(i));
    }
  }

  toJSON(): IHttpProject {
    const result: IHttpProject = {
      kind: Kind,
      key: this.key,
      definitions: {},
      environments: [],
      items: [],
      info: this.info.toJSON(),
    };
    if (Array.isArray(this.definitions.environments) && this.definitions.environments.length) {
      result.definitions.environments = this.definitions.environments.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.requests) && this.definitions.requests.length) {
      result.definitions.requests = this.definitions.requests.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.folders) && this.definitions.folders.length) {
      result.definitions.folders = this.definitions.folders.map(i => i.toJSON());
    }
    if (Array.isArray(this.definitions.schemas) && this.definitions.schemas.length) {
      result.definitions.schemas = this.definitions.schemas.map(i => i.toJSON());
    }
    if (Array.isArray(this.environments) && this.environments.length) {
      result.environments = [...this.environments];
    }
    if (Array.isArray(this.items) && this.items.length) {
      result.items = this.items.map(i => i.toJSON());
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
  addFolder(init: string | IProjectFolder | ProjectFolder = ProjectFolder.defaultName, opts: IFolderCreateOptions = {}): ProjectFolder {
    if (!Array.isArray(this.items)) {
      this.items = [];
    }
    if (!Array.isArray(this.definitions.folders)) {
      this.definitions.folders = [];
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
    let definition: ProjectFolder;
    if (typeof init === 'string') {
      definition = ProjectFolder.fromName(this, init);
    } else if (init instanceof ProjectFolder) {
      definition = init;
    } else {
      definition = new ProjectFolder(this, init);
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
    const { definitions } = this;
    const item = definitions.folders.find((i) => {
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
  moveFolder(key: string, opts: IProjectMoveOptions = {}): void {
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
    movedFolder.detachedCallback();

    if (hasIndex && target.items.length > index) {
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
    const { items = [] } = target;
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
  addRequest(request: IProjectRequest | ProjectRequest | string, opts: IRequestAddOptions = {}): ProjectRequest {
    if (!Array.isArray(this.definitions.requests)) {
      this.definitions.requests = [];
    }

    // the request can be already added to the project as the same method is used to refresh a request after 
    // a store update. From the system perspective it is the same event.

    if (typeof request === 'object' && request.key) {
      const existing = this.definitions.requests.find(i => i.key === request.key);
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

    this.definitions.requests.push(finalRequest);
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
   * Adds a request to the project that has been created for a previous version of ARC.
   * 
   * @param legacy The legacy request definition.
   * @returns The created project request.
   */
  async addLegacyRequest(legacy: ARCSavedRequest | ARCHistoryRequest): Promise<ProjectRequest> {
    const request = await Request.fromLegacy(legacy);
    const projectRequest = ProjectRequest.fromRequest(request.toJSON(), this);
    return this.addRequest(projectRequest);
  }

  /**
   * Searches for a request in the project.
   * 
   * @param nameOrKey The name or the key of the request.
   * @param opts Optional search options.
   * @returns Found project request or undefined.
   */
  findRequest(nameOrKey: string, opts: IRequestSearchOptions = {}): ProjectRequest | undefined {
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
  moveRequest(key: string, opts: IProjectMoveOptions = {}): void {
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
    request.detachedCallback();

    if (hasIndex && target.items.length > index) {
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
    const { items = [] } = this;
    return items.filter(i => i.kind === ProjectFolderKind);
  }

  /**
   * Lists items (not the actual definitions!) that are requests.
   */
  listRequestItems(): ProjectItem[] {
    const { items = [] } = this;
    return items.filter(i => i.kind === ProjectRequestKind);
  }

  /**
   * Lists folders from the project or a sub-folder.
   * @param opts Folder listing options.
   */
  listFolders(opts: IFolderListOptions = {}): ProjectFolder[] {
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
    const result: ProjectFolder[] = [];
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
  listDefinitions(folder?: string): (ProjectFolder | ProjectRequest | Environment)[] {
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
    const result: (ProjectFolder | ProjectRequest | Environment)[] = [];
    const { items = [] } = root;
    const { definitions } = this;
    items.forEach((item) => {
      let definition: ProjectFolder | ProjectRequest | undefined;
      if (item.kind === ProjectFolderKind) {
        definition = definitions.folders.find(d => item.key === d.key);
      } else if (item.kind === ProjectRequestKind) {
        definition = definitions.requests.find(d => item.key === d.key);
      }
      if (definition) {
        result.push(definition);
      }
    });
    if (Array.isArray(root.environments)) {
      root.environments.map((id) => {
        const definition = definitions.environments.find(d => d.key === id);
        if (definition) {
          result.push(definition);
        }
      });
    }
    return result;
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
      const environments = current.getEnvironments();
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
   * Makes a copy of this project.
   */
  clone(opts: IProjectCloneOptions = {}): HttpProject {
    const copy = new HttpProject(this.toJSON());
    if (!opts.withoutRevalidate) {
      copy.key = v4();
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
    const { items = [], definitions } = src;
    // create a flat list of all "items" in the project and all folders.
    let flatItems = [...items];
    (definitions.folders || []).forEach((folder) => {
      if (Array.isArray(folder.items) && folder.items.length) {
        flatItems = flatItems.concat(folder.items);
      }
    });
    const withEnvironments: (HttpProject | ProjectFolder)[] = [];
    if (Array.isArray(src.environments) && src.environments.length) {
      withEnvironments.push(src);
    }
    (definitions.folders || []).forEach((folder) => {
      if (Array.isArray(folder.environments) && folder.environments.length) {
        withEnvironments.push(folder);
      }
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
    (definitions.schemas || []).forEach((schema) => {
      schema.key = v4();
    });
    (definitions.environments || []).forEach((environment) => {
      // project or folder that has the environment.
      const parent = withEnvironments.find(item => item.environments.includes(environment.key));
      const oldKey = environment.key;
      const newKey = v4();
      environment.key = newKey;
      if (parent) {
        const index = parent.environments.indexOf(oldKey);
        parent.environments[index] = newKey;
      }
    });
  }

  /**
   * Adds an empty schema to the project.
   * 
   * @param name The name of the schema
   * @param opts The schema add options.
   * @returns The inserted into the schemas schema.
   */
  addSchema(url: string, opts?: ISchemaAddOptions): ProjectSchema;

  /**
   * Adds a schema to the project.
   * 
   * @param schema The schema to add.
   * @param opts The schema add options.
   * @returns The inserted into the schemas schema.
   */
  addSchema(schema: IProjectSchema | ProjectSchema, opts?: ISchemaAddOptions): ProjectSchema;

  /**
   * Adds a request to the project or a sub-folder.
   * @param schema The schema to add.
   * @param opts Thew schema add options.
   * @returns The inserted into the schemas schema.
   */
  addSchema(schema: IProjectSchema | ProjectSchema | string, opts: ISchemaAddOptions = {}): ProjectSchema {
    if (!Array.isArray(this.definitions.schemas)) {
      this.definitions.schemas = [];
    }

    // this renews existing schema
    if (typeof schema === 'object' && schema.key) {
      const existing = this.definitions.schemas.find(i => i.key === schema.key) as ProjectSchema | undefined;
      if (existing) {
        existing.new(schema as IProjectSchema);
        return existing;
      }
    }

    let finalSchema: ProjectSchema;
    if (typeof schema === 'string') {
      finalSchema = ProjectSchema.fromName(schema);
    } else if (schema instanceof ProjectSchema) {
      finalSchema = schema;
    } else {
      finalSchema = new ProjectSchema(schema);
    }
    if (!finalSchema.key) {
      finalSchema.key = v4();
    }
    const { index } = opts;
    const hasIndex = typeof index === 'number';
    if (hasIndex && this.definitions.schemas.length > index) {
      // comparing to the `.length` and not `.length - 1` in case we are adding at the end.
      const maxIndex = Math.max(this.definitions.schemas.length, 0);
      if (index > maxIndex) {
        throw new RangeError(`Index out of bounds. Maximum index is ${maxIndex}.`);
      }
      this.definitions.schemas.splice(index, 0, finalSchema);
    } else {
      this.definitions.schemas.push(finalSchema);
    }
    return finalSchema;
  }

  /**
   * @returns The current list of schemas in the project.
   */
  listSchemas(): ProjectSchema[] {
    if (!Array.isArray(this.definitions.schemas)) {
      return [];
    }
    return this.definitions.schemas;
  }

  getEnvironments(): Environment[] {
    if (Array.isArray(this.initEnvironments)) {
      return this.initEnvironments;
    }
    return super.getEnvironments();
  }

  /**
   * Iterates over requests in the project,
   */
  * requestIterator(opts: IProjectRequestIterator = {}): Generator<ProjectRequest> {
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
      if (item.kind === ProjectRequestKind) {
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
      } else if (recursive && item.kind === ProjectFolderKind) {
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

  [Symbol.iterator](): Generator<ProjectRequest> {
    return this.requestIterator({
      recursive: true,
    });
  }
}
