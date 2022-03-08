import { AccessControlLevel } from "./User.js";
import { IThing, Thing, Kind as ThingKind } from './Thing.js';
import v4 from '../lib/uuid.js';

export const Kind = 'ARC#Space';
/**
 * A definition of the working space for users.
 * 
 * A working space is a logical container in the data store
 * created by the system users, where they can store their projects and other data.
 */
export interface IWorkspace {
  kind: 'ARC#Space';
  /**
   * The space identifier.
   */
  key: string;
  /**
   * The environment's meta info.
   */
  info: IThing;
  /**
   * The list of users added to this space. May not be set when owner did not add anyone to the space.
   */
  users?: string[];
  /**
   * The owner of this space. The id of the User object.
   * Set to `default` when there are no users in the system (no authentication).
   */
  owner: string;
  /**
   * The list of project keys added to the workspace.
   * @deprecated This is not actually used.
   */
  projects: string[];
}

/**
 * The workspace information set to a specific client what contains user specific data.
 */
export interface IUserWorkspace extends IWorkspace {
  access: AccessControlLevel;
}

export const DefaultOwner = 'default';

/**
 * A definition of the working space for users.
 * 
 * A working space is a logical container in the data store
 * created by the system users, where they can store their projects and other data.
 */
export class Workspace {
  kind = Kind;
  /**
   * The space identifier.
   */
  key = '';
  /**
   * The name of the environment.
   */
  info: Thing = new Thing({ kind: ThingKind });
  /**
   * The list of users added to this space. May not be set when owner did not add anyone to the space.
   */
  users?: string[];
  /**
   * The owner of this space. The id of the User object.
   * Set to `default` when there are no users in the system (no authentication).
   */
  owner = '';
  /**
   * The list of keys of projects added to the workspace.
   * @deprecated This is not actually used.
   */
  projects: string[] = [];
  /**
   * Only set when the object was created from the data received by the ARC backend.
   * Level access of the current user to the space.
   * Note, this information is never serialized with the object.
   */
  access?: AccessControlLevel;

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
      projects: [],
    });
    return definition;
  }

  /**
   * @param input The environment definition used to restore the state.
   */
  constructor(input?: string | IWorkspace | IUserWorkspace) {
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
        projects: [],
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the environment is not an ARC environment. 
   */
  new(init: IWorkspace | IUserWorkspace): void {
    if (!Workspace.isWorkspace(init)) {
      throw new Error(`Not an ARC space.`);
    }
    const { key = v4(), projects = [], info, owner = DefaultOwner, users } = init;
    this.kind = Kind;
    this.key = key;
    this.projects = projects;
    this.owner = owner;
    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = new Thing({ kind: ThingKind, name: '' });
    }
    if (Array.isArray(users)) {
      this.users = users;
    } else {
      this.users = [];
    }
    const typed = init as IUserWorkspace;
    if (typed.access) {
      this.access = typed.access;
    }
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
    const { projects = [], owner = DefaultOwner, users } = this;
    const result: IWorkspace = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
      projects,
      owner,
    };
    if (Array.isArray(users) && users.length) {
      result.users = users;
    }
    return result;
  }
}
