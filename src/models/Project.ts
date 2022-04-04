import { IFile, File, DefaultOwner } from "./store/File.js";
import { Kind as ThingKind } from './Thing.js';
import { HttpProject, IHttpProject } from './HttpProject.js';
import v4 from '../lib/uuid.js';

export const Kind = 'Core#Project';

/**
 * This model represents a meta data for an HTTP project stored with the data store.
 * This does not include the HTTP project entity, though, it is referenced through the same key.
 * 
 * A concept of a project is similar to a Workspace. It is an object that is rendered in the UIs
 * like a workspace but has a different meaning. On the store side, when listing workspace items,
 * both spaces and projects are returned in a single query.
 */
export interface IProject extends IFile {
  kind: typeof Kind;
}

/**
 * This model represents a meta data for an HTTP project stored with the data store.
 * This does not include the HTTP project entity, though, it is referenced through the same key.
 * 
 * A concept of a project is similar to a Workspace. It is an object that is rendered in the UIs
 * like a workspace but has a different meaning. On the store side, when listing workspace items,
 * both spaces and projects are returned in a single query.
 */
export class Project extends File {
  kind = Kind;

  static fromProject(project: HttpProject | IHttpProject): Project {
    let final: IHttpProject;
    if (typeof (project as HttpProject).toJSON === 'function') {
      final = (project as HttpProject).toJSON();
    } else {
      final = project as IHttpProject;
    }
    const init: IProject = {
      kind: Kind,
      key: final.key,
      info: { ...final.info },
      lastModified: { user: '', time: 0, byMe: false },
      owner: DefaultOwner,
      parents: [],
      permissionIds: [],
      permissions: [],
    };
    return new Project(init);
  }

  /**
   * @param input The environment definition used to restore the state.
   */
  constructor(input?: string | IProject) {
    super();
    let init: IProject;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: v4(),
        info: {
          kind: ThingKind,
          name: '',
        },
        owner: DefaultOwner,
        parents: [],
        permissionIds: [],
        permissions: [],
        lastModified: { user: '', time: 0, byMe: false },
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the environment is not a space. 
   */
  new(init: IProject): void {
    if (!Project.isWorkspace(init)) {
      throw new Error(`Not a space.`);
    }
    super.new(init);
    this.kind = Kind;
  }

  /**
   * Checks whether the input is a definition of an user space.
   */
  static isWorkspace(input: unknown): boolean {
    const typed = input as IProject;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IProject {
    const result: IProject = {
      ...super.toJSON(),
      kind: Kind,
    };
    return result;
  }
}
