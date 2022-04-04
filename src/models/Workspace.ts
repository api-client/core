import { IFile, File, DefaultOwner } from "./store/File.js";
import { Thing, Kind as ThingKind } from './Thing.js';
import v4 from '../lib/uuid.js';

export const Kind = 'Core#Space';
/**
 * A definition of the working space for users.
 * 
 * A working space is a logical container in the data store
 * created by the system users, where they can store their projects and other data.
 */
export interface IWorkspace extends IFile {
  kind: typeof Kind;
}

/**
 * A definition of the working space for users.
 * 
 * A working space is a logical container in the data store
 * created by the system users, where they can store their projects and other data.
 */
export class Workspace extends File {
  kind = Kind;
  
  /**
   * Creates a new Space object from a name.
   * 
   * @param name The name to set.
   * @param owner The user id that is the owner of the space.
   */
  static fromName(name: string, owner = DefaultOwner): Workspace {
    const key = v4();
    const info = new Thing({ kind: ThingKind, name });
    const definition = new Workspace({
      key,
      kind: Kind,
      info: info.toJSON(),
      owner,
      parents: [],
      permissionIds: [],
      permissions: [],
      lastModified: { user: '', time: 0, byMe: false },
    });
    return definition;
  }

  /**
   * @param input The environment definition used to restore the state.
   */
  constructor(input?: string | IWorkspace) {
    super();
    let init: IWorkspace;
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
  new(init: IWorkspace): void {
    if (!Workspace.isWorkspace(init)) {
      throw new Error(`Not a space.`);
    }
    super.new(init);
    this.kind = Kind;
  }

  /**
   * Checks whether the input is a definition of an user space.
   */
  static isWorkspace(input: unknown): boolean {
    const typed = input as IWorkspace;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IWorkspace {
    const result: IWorkspace = {
      ...super.toJSON(),
      kind: Kind,
    };
    return result;
  }
}
