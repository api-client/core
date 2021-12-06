import { HttpProject } from './HttpProject.js';
import { ProjectFolder } from './ProjectFolder.js';

export interface IProjectDefinitionProperty {
  kind: unknown;
  key: string;
}

export interface ProjectDefinitionProperty {
  kind: unknown;
  key: string;
  
  /**
   * A reference to the top level project object.
   */
  project: HttpProject;

  /**
   * The callback called when the object is attached to a parent.
   * This is called when the object is created and inserted to a project or a folder
   * and when the object is moved between folders.
   */
  attachedCallback(): void;

  /**
   * The callback called when the object is detached from its parent.
   * This callback is called when the item is deleted from a folder or a project,
   * or when the item is about to be moved to another folder.
   */
  detachedCallback(): void;

  /**
   * @returns The instance of the HttpProject or a ProjectFolder that is a closes parent of this instance.
   */
  getParent(): ProjectFolder|HttpProject|undefined;
  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): HttpProject;
}
