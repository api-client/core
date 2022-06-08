import { ProjectParent } from './ProjectParent.js';
import { IProjectDefinitionProperty } from './ProjectDefinitionProperty.js';
import { ProjectItem, IProjectItem } from './ProjectItem.js';
import { ProjectRequest, Kind as ProjectRequestKind, IProjectRequest } from './ProjectRequest.js';
import { HttpProject, IEnvironmentCreateOptions } from './HttpProject.js';
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import { Environment, IEnvironment } from './Environment.js';
import v4 from '../lib/uuid.js';
import { IAppProjectParent } from './AppProject.js';

export const Kind = 'Core#ProjectFolder';
export const DefaultFolderName = 'New folder';

export interface IFolderAddOptions {
  /**
   * Optionally the position at which to add the request into the list of items.
   */
  index?: number;
}

export interface IFolderCloneOptions {
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
  targetProject?: HttpProject;
  /**
   * The **key** of the target folder.
   * 
   * By default it clones the folder to its parent unless the clone is attached to another project. 
   * When the target folder is set then it places the clone under the passed target folder.
   */
  targetFolder?: string;
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

  static fromAppProject(project: HttpProject, init: IAppProjectParent): ProjectFolder {
    const result = new ProjectFolder(project);
    const { key = v4(), created = Date.now(), updated = Date.now(), items, info } = init;
    result.key = key;
    result.created = created;
    result.updated = updated;
    if (info) {
      result.info = new Thing(info);
    }
    if (Array.isArray(items)) {
      result.items = items.map(i => ProjectItem.fromAppProject(project, i));
    }
    return result;
  }

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
   * Note, this throws an error when the project folder is not a project folder.
   */
  new(init: IProjectFolder): void {
    if (!ProjectFolder.isProjectFolder(init)) {
      throw new Error(`Not a project folder.`);
    }
    const { key = v4(), created = Date.now(), updated = Date.now(), items, info } = init;
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
    };
    if (Array.isArray(this.items)) {
      result.items = this.items.map(i => i.toJSON());
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
   * Adds an environment to the project.
   * 
   * @param env The definition of the environment to use to create the environment
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment, opts?: IEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The instance of the environment to add
   * @returns The same or created environment.
   */
  addEnvironment(env: Environment, opts?: IEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The name of the environment to create
   * @returns The same or created environment.
   */
  addEnvironment(env: string, opts?: IEnvironmentCreateOptions): Environment;

  /**
   * Adds an environment to the project.
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment | Environment | string, opts: IEnvironmentCreateOptions = {}): Environment {
    const newOptions: IEnvironmentCreateOptions = { ...opts, parent: this.key };
    return this.project.addEnvironment(env as Environment, newOptions);
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
    return this.project.listFolders({ folder: this.key });
  }

  /**
   * Lists requests in this folder.
   */
  listRequests(): ProjectRequest[] {
    return this.project.listRequests(this.key);
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
   * @returns The list of environments defined in this folder
   */
  getEnvironments(): Environment[] {
    return this.project.getEnvironments({ parent: this.key });
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
   * Makes a copy of this folder.
   * By default it attaches the copied folder to the same parent.
   * It also, by default, copies requests declared in this folder.
   * 
   * Use the options dictionary to control these behaviors.
   * 
   * @param opts Cloning options
   */
  clone(opts: IFolderCloneOptions = {}): ProjectFolder {
    const { targetProject=this.project, targetFolder } = opts;
    const copy = new ProjectFolder(targetProject, this.toJSON());
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
  protected cloneRequests(folder: ProjectFolder, project: HttpProject): void {
    const requests = this.items.filter(i => i.kind === ProjectRequestKind);
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
  protected cloneSubFolders(folder: ProjectFolder, project: HttpProject, withRequests = true): void {
    const folders = this.items.filter(i => i.kind === Kind);
    folders.forEach(f => {
      const definition = project.findFolder(f.key, { keyOnly: true });
      if (!definition) {
        return;
      }
      const copy = new ProjectFolder(folder.getProject(), definition.toJSON());
      copy.key = v4();
      copy.items = [];
      folder.addFolder(copy);
      if (withRequests) {
        definition.cloneRequests(copy, project);
      }
      definition.cloneSubFolders(copy, project, withRequests);
    });
  }
}
