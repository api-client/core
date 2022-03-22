import { Http as Base, Types, Lorem, Time, HttpRequestInit } from '@pawel-up/data-mock';
import { randomValue } from '@pawel-up/data-mock/build/src/lib/Http.js';
import { ArcDataMockInit } from '../LegacyInterfaces.js';
import { HttpResponse } from './HttpResponse.js';
import { ARCHistoryRequest, ARCSavedRequest, TransportRequest } from '../../models/legacy/request/ArcRequest.js';
import { ARCProject } from '../../models/legacy/models/ArcLegacyProject.js';

export interface RequestHistoryInit extends HttpRequestInit {
  noId?: boolean;
}

export interface RequestSavedInit extends HttpRequestInit {
  forceDescription?: boolean;
  noDescription?: boolean;
  project?: string;
  projects?: ARCProject[];
  forceProject?: boolean;
}

export interface ProjectCreateInit {
  /**
   * Request id to add to `requests` array
   */
  requestId?: string;
  /**
   * If set it generates request ID to add to `requests` array
   */
  autoRequestId?: boolean;
}

export declare interface GenerateSavedResult {
  projects: ARCProject[];
  requests: ARCSavedRequest[];
}

export interface TransportRequestInit extends HttpRequestInit {
  noHttpMessage?: boolean;
}

export class Http extends Base {
  LAST_TIME: number;
  types: Types;
  lorem: Lorem;
  response: HttpResponse;
  time: Time;

  constructor(init: ArcDataMockInit={}) {
    super(init);
    this.LAST_TIME = Date.now();
    this.types = new Types(init.seed);
    this.lorem = new Lorem(init);
    this.response = new HttpResponse(init);
    this.time = new Time(init);
  }

  history(opts: RequestHistoryInit={}): ARCHistoryRequest {
    const base = this.request(opts);
    this.LAST_TIME -= this.types.datetime().getTime();
    const midnight = this.time.midnight(this.LAST_TIME);

    const item: ARCHistoryRequest = {
      ...base,
      created: this.LAST_TIME,
      updated: this.LAST_TIME,
      type: 'history',
      midnight,
    };
    if (!opts.noId) {
      item._id = this.types.uuid();
    }
    return item;
  }

  saved(opts: RequestSavedInit={}): ARCSavedRequest {
    const base = this.request(opts);
    const time = this.types.datetime().getTime();
    const requestName = this.lorem.words(2);
    const description = this.description(opts);
    const midnight = this.time.midnight(this.LAST_TIME);
    const item: ARCSavedRequest = {
      ...base,
      created: time,
      updated: time,
      type: 'saved',
      name: requestName,
      midnight,
    };
    if (description) {
      item.description = description;
    }
    item._id = this.types.uuid();
    if (opts.project) {
      item.projects = [opts.project];
    }
    return item;
  }

  /**
   * Generates a description for a request.
   *
   * @param opts Configuration options
   * @returns Items description.
   */
  description(opts: RequestSavedInit={}): string|undefined {
    const { noDescription, forceDescription } = opts;
    if (noDescription) {
      return undefined;
    }
    if (forceDescription) {
      return this.lorem.paragraph();
    }
    return this.types.boolean({ likelihood: 70 }) ? this.lorem.paragraph() : undefined;
  }

  /**
   * @param size The number of requests to generate.
   * @param init History init options.
   */
  listHistory(size = 25, init: RequestHistoryInit={}): ARCHistoryRequest[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.history(init));
    }
    return result;
  }

  /**
   * @param size The number of requests to generate.
   * @param init Saved init options
   */
  listSaved(size = 25, init: RequestSavedInit = {}): ARCSavedRequest[] {
    const list = [];
    for (let i = 0; i < size; i++) {
      const project = this.pickProject(init);
      const opts = { ...init };
      if (project && project._id) {
        opts.project = project._id;
      }
      const item = this.saved(opts);
      if (project) {
        if (!project.requests) {
          project.requests = [];
        }
        project.requests.push(item._id as string);        
      }
      list.push(item);
    }
    return list;
  }

  /**
   * Picks a random project from the list of passed in `opts` projects.
   *
   * @param opts
   * @returns A project or undefined.
   */
  pickProject(opts: RequestSavedInit = {}): ARCProject|undefined {
    if (!opts.projects || !opts.projects.length) {
      return undefined;
    }
    let allow;
    if (opts.forceProject) {
      allow = true;
    } else {
      allow = this.types.boolean();
    }
    if (allow) {
      return this[randomValue].pickOne(opts.projects);
    }
    return undefined;
  }

  project(init: ProjectCreateInit={}): ARCProject {
    const project: ARCProject = {
      _id: this.types.uuid(),
      name: this.lorem.sentence({ words: 2 }),
      order: 0,
      description: this.lorem.paragraph(),
      requests: [],
    };
    if (init.requestId) {
      project.requests!.push(init.requestId);
    } else if (init.autoRequestId) {
      project.requests!.push(this.types.uuid());
    }
    return project;
  }

  listProjects(size = 5, init: ProjectCreateInit = {}): ARCProject[] {
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(this.project(init));
    }
    return result;
  }

  /**
   * @returns A map with `projects` and `requests` arrays.
   */
  savedData(requestsSize = 25, projectsSize = 5, requestsInit: RequestSavedInit = {}, projectInit: ProjectCreateInit = {}): GenerateSavedResult {
    const projects = this.listProjects(projectsSize, projectInit);
    const rCopy = { ...requestsInit };
    rCopy.projects = projects;
    const requests = this.listSaved(requestsSize, rCopy);
    return {
      requests,
      projects,
    };
  }

  /**
   * Generates a transport request object.
   * @param opts Generate options
   * @returns The transport request object
   */
  transportRequest(opts: TransportRequestInit={}): TransportRequest {
    const base = this.request(opts);
    const request: TransportRequest = {
      ...base,
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      httpMessage: '',
    };
    if (!opts.noHttpMessage) {
      request.httpMessage = `GET / HTTP 1.1\n${request.headers}\n`;
      if (request.payload) {
        request.httpMessage += `\n${request.payload}\n`;
      }
      request.httpMessage += '\n';
    } else {
      // @ts-ignore
      delete request.httpMessage;
    }
    return request;
  }
}
