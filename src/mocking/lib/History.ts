import { Internet, Types, IDataMockInit, Person, Random, ITypeDateTimeInit } from '@pawel-up/data-mock';
// import { randomValue } from '@pawel-up/data-mock/src/lib/Http.js';
import { IHttpHistory, Kind as HttpHistoryKind } from '../../models/HttpHistory.js';
import { Request, IRequestLogInit } from './Request.js';


export interface IHttpHistoryInit {
  /**
   * Either space id, list of spaces to pick one or whether to generate a space.
   */
  space?: boolean | string | string[];
  /**
   * User is always generated per store requirements.
   */
  user?: string | string[];
  /**
   * Either project id, list of projects to pick one or whether to generate a project.
   */
  project?: boolean | string | string[];
  /**
   * Either request id, list of requests to pick one or whether to generate a request.
   */
  request?: boolean | string | string[];
  /**
   * Either app id, list of apps to pick one or whether to generate an app.
   */
  app?: boolean | string | string[];
  /**
   * The log init options
   */
  log?: IRequestLogInit;
  /**
   * The created time init options.
   */
  created?: ITypeDateTimeInit;
}

export interface IHttpHistoryListInit extends IHttpHistoryInit {
  /**
   * When set it generates as many user IDs.
   * Ignored when the `user` is set.
   */
  usersSize?: number;
  /**
   * When set it generates as many space ids.
   * Ignored when the `space` is set.
   */
  spacesSize?: number;
  /**
   * When set it generates as many project ids.
   * Ignored when the `project` is set.
   */
  projectsSize?: number;
  /**
   * When set it generates as many request ids.
   * Ignored when the `request` is set.
   */
  requestsSize?: number;
  /**
   * When set it generates as many app ids.
   * Ignored when the `app` is set.
   */
  appsSize?: number;
}

export class History {
  person: Person;
  types: Types;
  internet: Internet;
  random: Random;
  request: Request;

  constructor(init: IDataMockInit={}) {
    this.person = new Person(init);
    this.types = new Types(init.seed);
    this.internet = new Internet(init);
    this.random = new Random(init.seed);
    this.request = new Request(init);
  }

  async httpHistory(init: IHttpHistoryInit = {}): Promise<IHttpHistory> {
    const date = this.types.datetime(init.created);
    const result: IHttpHistory = {
      kind: HttpHistoryKind,
      created: date.getTime(),
      log: await this.request.log(init.log),
      user: '',
    }
    date.setHours(0, 0, 0, 0);
    result.midnight = date.getTime();

    if (typeof init.space === 'string') {
      result.space = init.space;
    } else if (Array.isArray(init.space)) {
      result.space = this.random.pickOne(init.space);
    } else if (init.space) {
      result.space = this.types.string(10);
    }
    
    if (typeof init.user === 'string') {
      result.user = init.user;
    } else if (Array.isArray(init.user)) {
      result.user = this.random.pickOne(init.user);
    } else {
      result.user = this.types.uuid();
    }
    
    if (typeof init.project === 'string') {
      result.project = init.project;
    } else if (Array.isArray(init.project)) {
      result.project = this.random.pickOne(init.project);
    } else if (init.project) {
      result.project = this.types.uuid();
    }
    
    if (typeof init.request === 'string') {
      result.request = init.request;
    } else if (Array.isArray(init.request)) {
      result.request = this.random.pickOne(init.request);
    } else if (init.request) {
      result.request = this.types.uuid();
    }
    
    if (typeof init.app === 'string') {
      result.app = init.app;
    } else if (Array.isArray(init.app)) {
      result.app = this.random.pickOne(init.app);
    } else if (init.app) {
      result.app = this.types.uuid();
    }
    return result;
  }

  async httpHistoryList(size=25, init: IHttpHistoryListInit = {}): Promise<IHttpHistory[]> {
    const { usersSize, spacesSize, projectsSize, requestsSize, appsSize } = init;
    const copy = { ...init };
    if (usersSize && typeof init.user === 'undefined') {
      const users: string[] = [];
      for (let i = 0; i < usersSize; i++) {
        users.push(this.types.uuid());
      }
      copy.user = users;
    }
    if (spacesSize && typeof init.space === 'undefined') {
      const space: string[] = [];
      for (let i = 0; i < spacesSize; i++) {
        space.push(this.types.string(10));
      }
      copy.space = space;
    }
    if (projectsSize && typeof init.project === 'undefined') {
      const project: string[] = [];
      for (let i = 0; i < projectsSize; i++) {
        project.push(this.types.uuid());
      }
      copy.project = project;
    }
    if (requestsSize && typeof init.request === 'undefined') {
      const requests: string[] = [];
      for (let i = 0; i < requestsSize; i++) {
        requests.push(this.types.uuid());
      }
      copy.request = requests;
    }
    if (appsSize && typeof init.app === 'undefined') {
      const apps: string[] = [];
      for (let i = 0; i < appsSize; i++) {
        apps.push(this.types.uuid());
      }
      copy.app = apps;
    }

    const result: IHttpHistory[] = [];
    for (let i = 0; i < size; i++) {
      result.push(await this.httpHistory(copy));
    }
    return result;
  }
}
