import { Kind as FolderKind, ProjectFolder } from './ProjectFolder.js';
import { Kind as ProjectRequestKind, ProjectRequest } from './ProjectRequest.js';
import { HttpProject } from './HttpProject.js';

export interface IProjectItem {
  /**
   * The kind of the item.
   */
  kind: typeof FolderKind | typeof ProjectRequestKind;
  /**
   * The identifier in the `definitions` array of the project.
   */
  key: string;
}

export class ProjectItem {
  /**
   * The kind of the item.
   */
  kind: typeof FolderKind | typeof ProjectRequestKind = ProjectRequestKind;
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
    if (!input || ![FolderKind, ProjectRequestKind].includes(typed.kind)) {
      return false;
    }
    return true;
  }

  /**
   * @return An instance that represents a request object
   */
  static projectRequest(project: HttpProject, key: string) : ProjectItem {
    const item = new ProjectItem(project, {
      kind: ProjectRequestKind,
      key,
    });
    return item;
  }

  /**
   * @return An instance that represents a folder object
   */
  static projectFolder(project: HttpProject, key: string) : ProjectItem {
    const item = new ProjectItem(project, {
      kind: FolderKind,
      key,
    });
    return item;
  }

  /**
   * @param project The top-most project.
   * @param input The project item definition used to restore the state.
   */
  constructor(project: HttpProject, input: string|IProjectItem) {
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
          kind: FolderKind,
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
   * Note, this throws an error when the project item is not an ARC project item. 
   */
  new(init: IProjectItem): void {
    if (!ProjectItem.isProjectItem(init)) {
      throw new Error(`Not an ARC project item.`);
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
  getItem(): ProjectFolder | ProjectRequest| undefined {
    const { project, key } = this;
    const { definitions } = project;
    return definitions.find(i => i.key === key);
  }

  /**
   * @returns The instance of the HttpProject or a ProjectFolder that is a closes parent of this item.
   */
  getParent(): ProjectFolder|HttpProject|undefined {
    const { project, key } = this;
    return project.findParent(key);
  }
}
