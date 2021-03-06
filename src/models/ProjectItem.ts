import { Kind as ProjectFolderKind, ProjectFolder } from './ProjectFolder.js';
import { Kind as ProjectRequestKind, ProjectRequest } from './ProjectRequest.js';
import { Kind as EnvironmentKind, Environment } from './Environment.js';
import { HttpProject } from './HttpProject.js';
import { AppProjectFolderKind, AppProjectRequestKind, IAppProjectItem } from './AppProject.js';

type Kind = typeof ProjectFolderKind | typeof ProjectRequestKind | typeof EnvironmentKind;

export interface IProjectItem {
  /**
   * The kind of the item.
   */
  kind: Kind;
  /**
   * The identifier in the `definitions` array of the project.
   */
  key: string;
}

export class ProjectItem {
  /**
   * The kind of the item.
   */
  kind: Kind = ProjectRequestKind;
  /**
   * The identifier of the object in the `definitions` array of the project.
   */
  key = '';
  /**
   * A reference to the top level project object.
   */
  private project: HttpProject;

  /**
   * Checks whether the input is a definition of a project item.
   */
  static isProjectItem(input: unknown): boolean {
    const typed = input as IProjectItem;
    if (!input || ![ProjectFolderKind, ProjectRequestKind, EnvironmentKind].includes(typed.kind)) {
      return false;
    }
    return true;
  }

  /**
   * @return An instance that represents a request item
   */
  static projectRequest(project: HttpProject, key: string): ProjectItem {
    const item = new ProjectItem(project, {
      kind: ProjectRequestKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents a folder item
   */
  static projectFolder(project: HttpProject, key: string): ProjectItem {
    const item = new ProjectItem(project, {
      kind: ProjectFolderKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents an environment item
   */
  static projectEnvironment(project: HttpProject, key: string): ProjectItem {
    const item = new ProjectItem(project, {
      kind: EnvironmentKind,
      key,
    });
    return item;
  }

  static fromAppProject(project: HttpProject, item: IAppProjectItem): ProjectItem {
    let kind: Kind;
    if (item.kind === AppProjectFolderKind) {
      kind = ProjectFolderKind
    } else if (item.kind === AppProjectRequestKind) {
      kind = ProjectRequestKind
    } else if (item.kind === EnvironmentKind) {
      kind = EnvironmentKind
    } else {
      throw new Error(`Invalid item kind: ${item.kind}`);
    }
    return new ProjectItem(project, {
      kind,
      key: item.key,
    });
  }

  /**
   * @param project The top-most project.
   * @param input The project item definition used to restore the state.
   */
  constructor(project: HttpProject, input: string | IProjectItem) {
    this.project = project;
    let init: IProjectItem;
    if (typeof input === 'string') {
      if (input === 'http-request') {
        init = {
          kind: ProjectRequestKind,
          key: '',
        };
      } else if (input === 'folder') {
        init = {
          kind: ProjectFolderKind,
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
  new(init: IProjectItem): void {
    if (!ProjectItem.isProjectItem(init)) {
      throw new Error(`Not a project item.`);
    }
    const { kind, key } = init;
    this.kind = kind;
    this.key = key;
  }

  toJSON(): IProjectItem {
    const result: IProjectItem = {
      kind: this.kind,
      key: this.key,
    };
    return result;
  }

  /**
   * @returns The instance of the definition associated with this item.
   */
  getItem(): ProjectFolder | ProjectRequest | Environment | undefined {
    const { project, key, kind } = this;
    const { definitions } = project;
    if (kind === ProjectRequestKind) {
      return definitions.requests.find(i => i.key === key);
    }
    if (kind === ProjectFolderKind) {
      return definitions.folders.find(i => i.key === key);
    }
    if (kind === EnvironmentKind) {
      return definitions.environments.find(i => i.key === key);
    }
  }

  /**
   * @returns The instance of the HttpProject or a ProjectFolder that is a closest parent of this item.
   */
  getParent(): ProjectFolder | HttpProject | undefined {
    const { project, key } = this;
    return project.findParent(key);
  }
}
