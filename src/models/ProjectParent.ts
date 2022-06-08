import { HttpProject } from "./HttpProject.js";
import { ProjectFolder } from "./ProjectFolder.js";
import { ProjectItem } from "./ProjectItem.js";
import { Thing, Kind as ThingKind } from "./Thing.js";
import { ProjectDefinitionProperty } from "./ProjectDefinitionProperty.js";

/**
 * A class that contains a common properties and methods of an `HttpProject` and
 * a `ProjectFolder`.
 */
export abstract class ProjectParent implements ProjectDefinitionProperty {
  kind: unknown;

  key = '';

  /**
   * The ordered list of HTTP requests, folders, or environments in the projects.
   * The UI uses this to manipulate the view without changing the definitions.
   */
  items: ProjectItem[] = [];
  
  /**
   * The basic information about the project / folder.
   */
  info: Thing = new Thing({ kind: ThingKind, name: '' });

  abstract attachedCallback(): void;

  abstract detachedCallback(): void;

  abstract getParent(): HttpProject | ProjectFolder | undefined;

  abstract getProject(): HttpProject;
}
