import { Kind as ThingKind } from './Thing.js';
import { ProjectDefinitionProperty, IProjectDefinitionProperty } from './ProjectDefinitionProperty.js';
import { ProjectFolder } from './ProjectFolder.js';
import { IHttpRequest, Kind as HttpRequestKind } from './HttpRequest.js';
import { HttpProject } from './HttpProject.js';
import v4 from '../lib/uuid.js';
import { IRequest, Request } from './Request.js';

export const Kind = 'ARC#ProjectRequest';

export interface IProjectRequest extends IProjectDefinitionProperty, IRequest {
  kind: 'ARC#ProjectRequest';
  /**
   * The identifier of the request.
   */
  key: string;
}

/**
 * **Note about the payload.**
 * 
 * The payload is **always** stored in the request object in its serialized form.
 * Use the `readPayload()` to read the correct data type and the `writePayload()` to
 * safely store the payload.
 */
export class ProjectRequest extends Request implements ProjectDefinitionProperty {
  kind = Kind;
  /**
   * The identifier of the request.
   */
  key = '';
  /**
   * A reference to the top level project object.
   */
  project: HttpProject;
  /**
   * Checks whether the input is a definition of a project folder.
   */
  static isProjectRequest(input: unknown): boolean {
    const typed = input as IProjectRequest;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  /**
   * Creates a project request from an URL.
   * This does not manipulate the project.
   * 
   * @param url The Request URL. This is required.
   * @param project The parent project.
   */
  static fromUrl(url: string, project?: HttpProject): ProjectRequest {
    if (!project) {
      throw new Error(`project is required.`);
    }
    const now:number = Date.now();
    const request = new ProjectRequest(project, {
      key: v4(),
      kind: Kind,
      created: now,
      updated: now,
      expects: {
        kind: HttpRequestKind,
        method: 'GET',
        url,
      },
      info: {
        kind: ThingKind,
        name: url,
      },
    });
    return request;
  }

  /**
   * Creates a project request from a name.
   * This does not manipulate the project.
   * 
   * @param name The Request name.
   * @param project The parent project.This is required.
   */
  static fromName(name: string, project?: HttpProject): ProjectRequest {
    if (!project) {
      throw new Error(`project is required.`);
    }
    const now:number = Date.now();
    const request = new ProjectRequest(project, {
      key: v4(),
      kind: Kind,
      created: now,
      updated: now,
      expects: {
        kind: HttpRequestKind,
        method: 'GET',
        url: '',
      },
      info: {
        kind: ThingKind,
        name,
      },
    });
    return request;
  }

  /**
   * Creates a project request from an HttpRequest definition.
   * This does not manipulate the project.
   * 
   * @param project The parent project This is required.
   * @param info The request data.
   */
  static fromHttpRequest(info: IHttpRequest, project?: HttpProject): ProjectRequest {
    if (!project) {
      throw new Error(`project is required.`);
    }
    const now:number = Date.now();
    const request = new ProjectRequest(project, {
      key: v4(),
      kind: Kind,
      created: now,
      updated: now,
      expects: {
        kind: HttpRequestKind,
        method: info.method,
        url: info.url,
        headers: info.headers,
        payload: info.payload,
      },
      info: {
        kind: ThingKind,
        name: info.url,
      },
    });
    return request;
  }

  /**
   * Creates a project request for a schema of a Request.
   */
  static fromRequest(request: IRequest, project: HttpProject): ProjectRequest {
    const key = v4();
    const init: IProjectRequest = { ...request, key, kind: Kind };
    const result = new ProjectRequest(project, init);
    return result;
  }
  
  constructor(project: HttpProject, input?: string|IProjectRequest) {
    super(input);
    this.project = project;
    let init: IProjectRequest;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      const now:number = Date.now();
      init = {
        key: v4(),
        kind: Kind,
        created: now,
        updated: now,
        expects: {
          kind: HttpRequestKind,
          method: 'GET',
          url: '',
        },
        info: {
          kind: ThingKind,
          name: '',
        },
      };
    }
    this.new(init);
  }

  new(init: IProjectRequest): void {
    super.new(init);
    
    const { key } = init;
    this.key = key || v4();
  }

  toJSON(): IProjectRequest {
    const request = super.toJSON();
    const result: IProjectRequest = { ...request, key: this.key, kind: Kind };
    return result;
  }

  /**
   * The callback called when the object is attached to a parent.
   * This is called when the object is created and inserted to a project or a folder
   * and when the object is moved between folders.
   */
  attachedCallback(): void {
    // ...
  }

  /**
   * The callback called when the object is detached from its parent.
   * This callback is called when the item is deleted from a folder or a project,
   * or when the item is about to be moved to another folder.
   */
  detachedCallback(): void {
    // ...
  }

  /**
   * @returns The instance of the HttpProject or a ProjectFolder that is a closes parent of this instance.
   */
  getParent(): ProjectFolder|HttpProject|undefined {
    const { project, key } = this;
    return project.findParent(key);
  }

  /**
   * @returns A reference to the parent folder or the top-level HTTP project.
   */
  getProject(): HttpProject {
    return this.project;
  }

  /**
   * Removes this request from the project.
   */
  remove(): void {
    this.project.removeRequest(this.key);
  }
}
