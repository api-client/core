import { HttpProject } from "./HttpProject.js";
import { ProjectFolder } from "./ProjectFolder.js";
import { ProjectItem } from "./ProjectItem.js";
import { Thing, Kind as ThingKind } from "./Thing.js";
import { ProjectDefinitionProperty } from "./ProjectDefinitionProperty.js";
import { Environment, IEnvironment } from "./Environment.js";
import v4 from '../lib/uuid.js';

/**
 * A class that contains a common properties and methods of an `HttpProject` and
 * a `ProjectFolder`.
 */
export abstract class ProjectParent implements ProjectDefinitionProperty {
  kind: unknown;
  key: string = '';
  /**
   * The environments defined for this project.
   * If not set it is inherited from the parent.
   */
  environments: string[] = [];
  /**
   * The ordered list of HTTP requests / folders in the projects.
   * The UI uses this to manipulate the view without changing the definitions.
   */
  items: ProjectItem[] = [];
  /**
   * The basic information about the project / folder.
   */
  info: Thing = new Thing({ kind: ThingKind, name: '' });

  get effectiveEnvironments(): Environment[] {
    const { environments } = this;
    if (!environments.length) {
      return [];
    }
    const project = this.getProject();
    if (!project.definitions.environments) {
      return [];
    }
    const result: Environment[] = [];
    environments.forEach((key) => {
      const env = project.definitions.environments.find(i => i.key === key);
      if (env) {
        result.push(env);
      }
    });
    return result;
  }

  abstract attachedCallback(): void;

  abstract detachedCallback(): void;

  abstract getParent(): HttpProject | ProjectFolder | undefined;

  abstract getProject(): HttpProject;

  /**
   * Adds an environment to the project.
   * 
   * @param env The definition of the environment to use to create the environment
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The instance of the environment to add
   * @returns The same or created environment.
   */
  addEnvironment(env: Environment): Environment;

  /**
   * Adds an environment to the project.
   * 
   * @param env The name of the environment to create
   * @returns The same or created environment.
   */
  addEnvironment(env: string): Environment;

  /**
   * Adds an environment to the project.
   * @returns The same or created environment.
   */
  addEnvironment(env: IEnvironment | Environment | string): Environment {
    if (!Array.isArray(this.environments)) {
      this.environments = [];
    }
    let finalEnv;
    if (env instanceof Environment) {
      finalEnv = env;
    } else if (typeof env === 'string') {
      finalEnv = Environment.fromName(env);
    } else {
      finalEnv = new Environment(env);
    }
    if (!finalEnv.key) {
      finalEnv.key = v4();
    }
    const project = this.getProject();
    if (!project.definitions.environments) {
      project.definitions.environments = [];
    }
    project.definitions.environments.push(finalEnv);
    this.environments.push(finalEnv.key);
    return finalEnv;
  }
}
