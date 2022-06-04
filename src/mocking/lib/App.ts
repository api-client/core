import { IDataMockInit, IHttpRequestInit, Types, Lorem } from '@pawel-up/data-mock';
import { IAppRequest, Kind as AppRequestKind } from '../../models/AppRequest.js';
import { IAppProject, AppProject, AppProjectRequest } from '../../models/AppProject.js';
import { Request } from './Request.js';

export interface IAppRequestInit extends IHttpRequestInit {
  /**
   * The application id that generated the request.
   * When not set a random id is generated.
   */
  app?: string;
  /**
   * Whether the generated key should be an ISO time string.
   */
  isoKey?: boolean;
}

export interface IAppProjectInit {
  /**
   * The number of folders to generate with the project.
   * Set to 0 to not add folders.
   */
  foldersSize?: number;
  /**
   * Whether to prohibit adding requests to folders (randomly distributed).
   */
  noRequests?: boolean;
}

export class App {
  protected request: Request;
  protected types: Types;
  protected lorem: Lorem;

  constructor(init: IDataMockInit = {}) {
    this.request = new Request(init);
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
  }

  appRequest(init: IAppRequestInit = {}): IAppRequest {
    const cnf = { ...init } as IAppRequestInit;
    if (!cnf.app) {
      cnf.app = this.types.hash({ length: 6 });
    }
    const request = this.request.request(cnf);
    const key = init.isoKey ? new Date(request.created || Date.now()).toJSON() : this.types.uuid();
    return {
      key,
      ...request,
      kind: AppRequestKind,
      app: cnf.app,
    };
  }

  appRequests(size = 25, init: IAppRequestInit = {}): IAppRequest[] {
    const cnf = { ...init } as IAppRequestInit;
    if (!cnf.app) {
      cnf.app = this.types.hash({ length: 6 });
    }
    const result: IAppRequest[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.appRequest(cnf));
    }
    return result;
  }

  appProject(init: IAppProjectInit = {}): IAppProject {
    const {
      foldersSize = this.types.number({ min: 0, max: 10 })
    } = init;
    const project = AppProject.fromName(this.lorem.words());
    const requests = init.noRequests ? [] : this.appRequests(this.types.number({ min: foldersSize, max: foldersSize * 2 }));
    for (let j = 0; j < foldersSize; j++) {
      const folder = project.addFolder(this.lorem.words());
      const requestLen = init.noRequests ? 0 : this.types.number({ min: 0, max: 2 })
      if (requestLen) {
        const folderRequests = requests.splice(0, requestLen);
        folderRequests.forEach((item) => {
          const adapted = AppProjectRequest.fromRequest(item, project);
          folder.addRequest(adapted);
        });
      }
    }
    if (requests.length) {
      requests.forEach((item) => {
        const adapted = AppProjectRequest.fromRequest(item, project);
        project.addRequest(adapted);
      });
    }
    return project.toJSON();
  }

  appProjects(size = 25, init: IAppProjectInit = {}): IAppProject[] {
    const result: IAppProject[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.appProject(init))
    }
    return result;
  }
}
