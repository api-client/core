import { IHttpProject, IProjectInitOptions, IProjectMoveOptions, IHttpProjectIndex } from "../../models/HttpProject.js";
import { ContextChangeRecord, ContextEvent, ContextReadEvent, ContextUpdateEvent, ContextDeleteRecord, ContextDeleteEvent, ContextEventDetailWithResult } from "../BaseEvents.js";
import { ModelEventTypes } from './ModelEventTypes.js';

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
    const e = new ContextEvent<ProjectCloneEventDetail, ContextChangeRecord<IHttpProject>>(ModelEventTypes.Project.move, {
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
};
