import { IHttpProject, IProjectInitOptions, IProjectMoveOptions, IHttpProjectIndex, IFolderCreateOptions, IRequestAddOptions } from "../../models/HttpProject.js";
import { IProjectFolder } from "../../models/ProjectFolder.js";
import { IProjectRequest } from "../../models/ProjectRequest.js";
import { IEnvironment } from "../../models/Environment.js";
import { ContextChangeRecord, ContextEvent, ContextReadEvent, ContextUpdateEvent, ContextDeleteRecord, ContextDeleteEvent, ContextEventDetailWithResult } from "../BaseEvents.js";
import { ModelEventTypes } from './ModelEventTypes.js';
import CustomEvent from '../CustomEvent.js';

export interface ProjectMoveEventDetail {
  type: 'request' | 'folder';
  key: string;
  opts?: IProjectMoveOptions;
}

export interface ProjectCloneEventDetail {
  /**
   * The id of the project to clone in the data store.
   */
  id: string;
}

/**
 * A list of options to initialize a folder in a project.
 */
export interface IFolderInitOptions extends IFolderCreateOptions {
  /**
   * The store id of the project.
   */
  id: string;
  /**
   * Optional name of the new folder.
   */
  name?: string;
}

/**
 * A list of options to initialize a request in a project.
 */
export interface IRequestInitOptions extends IRequestAddOptions {
  /**
   * The store id of the project.
   */
  id: string;
  /**
   * The URL of the request.
   */
  url: string;
}

export interface IEnvironmentInitOptions {
  /**
   * The store id of the project.
   */
  id: string;
  /**
   * The name of the environment to create.
   */
  name: string;
  /**
   * The optional key of the parent folder.
   */
  key?: string;
}

class ProjectFolderEvents {
  /**
   * Creates a folder in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The store id of the project
   * @param name Optionally, name of the folder to create.
   * @param opts Optional options to create a folder.
   * @returns The change record of the created folder. Note, the client should either refresh the project from the store or append the change record to the instance of the project.
   */
  static async create(target: EventTarget, id: string, name?: string, opts: IFolderCreateOptions = {}): Promise<ContextChangeRecord<IProjectFolder> | undefined> {
    const init: IFolderInitOptions = { ...opts, id, name, };
    const e = new ContextEvent<IFolderInitOptions, ContextChangeRecord<IProjectFolder>>(ModelEventTypes.Project.Folder.create, init);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes a folder from a project
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param key The key of the folder to delete.
   */
  static async delete(target: EventTarget, id: string, key: string): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.Project.Folder.delete, key, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates the entire folder schema in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param folder The folder to replace the schema for.
   * @returns The change record of the updated folder.
   */
  static async update(target: EventTarget, id: string, folder: IProjectFolder): Promise<ContextChangeRecord<IProjectFolder> | undefined> {
    const e = new ContextUpdateEvent(ModelEventTypes.Project.Folder.update, { item: folder, parent: id });
    target.dispatchEvent(e);
    return e.detail.result;
  }
}

class ProjectRequestEvents {
  /**
   * Creates a request in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The store id of the project
   * @param url The URL of the request.
   * @param opts Optional options to create a request.
   * @returns The change record of the created request. Note, the client should either refresh the project from the store or append the change record to the instance of the project.
   */
  static async create(target: EventTarget, id: string, url: string, opts: IRequestAddOptions = {}): Promise<ContextChangeRecord<IProjectRequest> | undefined> {
    const init: IRequestInitOptions = { ...opts, id, url, };
    const e = new ContextEvent<IRequestInitOptions, ContextChangeRecord<IProjectRequest>>(ModelEventTypes.Project.Request.create, init);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes a request from a project
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param key The key of the request to delete.
   */
  static async delete(target: EventTarget, id: string, key: string): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.Project.Request.delete, key, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates the entire request schema in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param request The request to replace the schema for.
   * @returns The change record of the updated request.
   */
  static async update(target: EventTarget, id: string, request: IProjectRequest): Promise<ContextChangeRecord<IProjectRequest> | undefined> {
    const e = new ContextUpdateEvent(ModelEventTypes.Project.Request.update, { item: request, parent: id });
    target.dispatchEvent(e);
    return e.detail.result;
  }
}

class ProjectEnvironmentEvents {
  /**
   * Creates an environment in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The store id of the project
   * @param name The name of the environment.
   * @param key The optional key of the parent folder.
   * @returns The change record of the created environment. Note, the client should either refresh the project from the store or append the change record to the instance of the project.
   */
  static async create(target: EventTarget, id: string, name: string, key?: string): Promise<ContextChangeRecord<IEnvironment> | undefined> {
    const init: IEnvironmentInitOptions = { id, name, key };
    const e = new ContextEvent<IEnvironmentInitOptions, ContextChangeRecord<IEnvironment>>(ModelEventTypes.Project.Environment.create, init);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes an environment from a project
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param key The key of the environment to delete.
   */
  static async delete(target: EventTarget, id: string, key: string): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.Project.Environment.delete, key, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates the entire environment schema in a project.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project
   * @param environment The environment to replace the schema for.
   * @returns The change record of the updated environment.
   */
  static async update(target: EventTarget, id: string, environment: IEnvironment): Promise<ContextChangeRecord<IEnvironment> | undefined> {
    const e = new ContextUpdateEvent(ModelEventTypes.Project.Environment.update, { item: environment, parent: id });
    target.dispatchEvent(e);
    return e.detail.result;
  }
}

/**
 * ARC's HTTP project events.
 * 
 * Note, `id`s refers to datastore ids but `key`s are internal identifiers inside the project.
 * Whenever id is used it refers to the store's ids. When `key` is used it is the id of the project or any of its components.
 */
export class ProjectEvents {
  /** 
   * Creates a new project in the data store.
   * 
   * @param target The target on which to dispatch the event
   * @param name The name of the project to create
   * @returns The change record of the created project.
   */
  static async create(target: EventTarget, name: string): Promise<ContextChangeRecord<IHttpProject> | undefined> {
    const e = new ContextEvent<IProjectInitOptions, ContextChangeRecord<IHttpProject>>(ModelEventTypes.Project.create, { name });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Reads a project from the data store.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project to read.
   * @param rev Optional revision version, when supported.
   */
  static async read(target: EventTarget, id: string, rev?: string): Promise<IHttpProject | undefined> {
    const e = new ContextReadEvent<IHttpProject>(ModelEventTypes.Project.read, id, rev);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Updates the entire object in the store.
   * 
   * @param target The target on which to dispatch the event
   * @param project The project to replace the value for.
   * @returns The change record of the updated project.
   */
  static async update(target: EventTarget, project: IHttpProject): Promise<ContextChangeRecord<IHttpProject> | undefined> {
    const e = new ContextUpdateEvent(ModelEventTypes.Project.update, { item: project });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Deletes a project from the data store.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project to delete.
   */
  static async delete(target: EventTarget, id: string): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ModelEventTypes.Project.delete, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Moves a request or a folder inside the project.
   * 
   * @param target The target on which to dispatch the event
   * @param type The type of the object to move within the project.
   * @param key The `key` of the request of the folder
   * @param opts The move options. When omitted then it moves the object to the project root at the last position.
   * @returns The change record of the updated project.
   */
  static async move(target: EventTarget, type: 'request' | 'folder', key: string, opts?: IProjectMoveOptions): Promise<ContextChangeRecord<IHttpProject> | undefined> {
    const e = new ContextEvent<ProjectMoveEventDetail, ContextChangeRecord<IHttpProject>>(ModelEventTypes.Project.move, {
      key,
      type,
      opts,
    });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /** 
   * Clones a project that is stored in the data store.
   * 
   * @param target The target on which to dispatch the event
   * @param id The data store id of the project to clone.
   * @returns The cloned project (the copy).
   */
  static async clone(target: EventTarget, id: string): Promise<ContextChangeRecord<IHttpProject> | undefined> {
    const e = new ContextEvent<ProjectCloneEventDetail, ContextChangeRecord<IHttpProject>>(ModelEventTypes.Project.clone, {
      id,
    });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Lists all projects in the data store.
   * This does not return the whole project record. Instead it only returns the index object of the project.
   * 
   * @param target The target on which to dispatch the event
   * @returns The list of project index objects.
   */
  static async listAll(target: EventTarget): Promise<IHttpProjectIndex[] | undefined> {
    const detail: ContextEventDetailWithResult<IHttpProjectIndex[]> = {};
    const e = new CustomEvent(ModelEventTypes.Project.listAll, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Events related to a folder manipulation in a project.
   */
  static get Folder(): typeof ProjectFolderEvents {
    return ProjectFolderEvents;
  }

  /**
   * Events related to a request manipulation in a project.
   */
  static get Request(): typeof ProjectRequestEvents {
    return ProjectRequestEvents;
  }

  /**
   * Events related to an environment manipulation in a project.
   */
  static get Environment(): typeof ProjectEnvironmentEvents {
    return ProjectEnvironmentEvents;
  }
};
