import { IRequestLog, RequestLog, Kind as RequestLogKind } from './RequestLog.js';

export const Kind = 'Core#HttpHistory';
export const createdSymbol = Symbol('created');
export const midnightSymbol = Symbol('midnight');

export interface IHttpHistory {
  kind: typeof Kind;
  /**
   * The data store key. Only present when the object was already inserted into the data store.
   * In majority of cases this value is set. It is not set when generating the history object before sending it to the store.
   * 
   * Note for data store implementations. This must be a URL-safe value so the id should be encoded if needed.
   * 
   * @readonly
   */
  key?: string;
  /**
   * Optional user space id. When set the history will become available to all space users.
   */
  space?: string;
  /**
   * Optional project id. When set the history will become available to all project users.
   */
  project?: string;
  /**
   * Optional application id. Must be set when the application that created this record does not use the concept of a user space.
   */
  app?: string;
  /**
   * The user id that made that request.
   * Note, the default API Client's store automatically adds the user information to the record overriding any pre-set user id, making it a read-only
   * value.
   * 
   * @readonly
   */
  user?: string;
  /**
   * The optional request id in the project that generated this log.
   */
  request?: string;
  /**
   * The request log.
   */
  log: IRequestLog;
  /**
   * The timestamp when this history request has been created.
   */
  created: number;
  /**
   * A timestamp of the midnight when the object was created
   */
  midnight?: number;
}

/**
 * An interface used when adding a history in bulk.
 * The store creates a history object propagating meta values defined here
 * onto the history objects.
 * Because of that, bulk operation can only be performed when the requests are made in similar 
 * context (app, space, project).
 */
export interface IHttpHistoryBulkAdd {
  /**
   * Optional user space id. Must be set when the originating request belongs to a user space.
   */
  space?: string;
  /**
   * Optional project id. Must be set when the originating request belongs to a user space.
   */
  project?: string;
  /**
   * Optional application id. Must be set when the application that created this record does not use the concept of a user space.
   */
  app?: string;
  /**
   * The optional request id in the project that generated this log.
   */
  request?: string;
  /**
   * The list of request logs.
   */
  log: IRequestLog[];
}

/**
 * An HTTP history is an object containing an information of a request and response
 * made by an application.
 * 
 * Note, history object are not mutable. Can only be created or deleted.
 */
export class HttpHistory {
  [createdSymbol] = 0;

  [midnightSymbol] = 0;
  
  kind = Kind;
  /**
   * The data store key. Only present when the object was already inserted into the data store.
   * In majority of cases this value is set. It is not set when generating the history object before sending it to the store.
   * 
   * Note for data store implementations. This must be a URL-safe value so the id should be encoded if needed.
   */
  key?: string;
  /**
   * Optional user space id. Must be set when the originating request belongs to a user space.
   */
  space?: string;
  /**
   * Optional project id. Must be set when the originating request belongs to a user space.
   */
  project?: string;
  /**
   * Optional application id. Must be set when the application that created this record does not use the concept of a user space.
   */
  app?: string;
  /**
   * The user id that made that request.
   * Note, the default API Client's store automatically adds the user information to the record overriding any pre-set user id.
   */
  user = '';
  /**
   * The optional request id in the project that generated this log.
   */
  request?: string;
  /**
   * The execution log of the HTTP request with a response.
   */
  log: RequestLog = new RequestLog();

  /**
   * @param value The timestamp when the request was created.
   */
  set created(value: number | undefined) {
    if (!value) {
      this[createdSymbol] = Date.now();
    } else {
      this[createdSymbol] = value;
    }
    const d = new Date(this[createdSymbol]);
    d.setHours(0, 0, 0, 0);
    this[midnightSymbol] = d.getTime();
  }

  /**
   * @returns The timestamp when the request was created.
   */
  get created(): number {
    return this[createdSymbol] || Date.now();
  }

  /**
   * @param value The timestamp of the midnight when the request object was updated
   */
  set midnight(value: number | undefined) {
    if (!value) {
      this[midnightSymbol] = this.defaultMidnight();
    } else {
      this[midnightSymbol] = value;
    }
  }

  /**
   * @returns The timestamp of the midnight when the request object was updated
   */
  get midnight(): number {
    if (this[midnightSymbol]) {
      return this[midnightSymbol];
    }
    return this.defaultMidnight();
  }

  constructor(input?: string|IHttpHistory) {
    let init: IHttpHistory;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      const now:number = Date.now();
      init = {
        kind: Kind,
        created: now,
        user: '',
        log: {
          kind: RequestLogKind,
        },
      };
    }
    this.new(init);
  }

  new(init: IHttpHistory): void {
    const { log, created = Date.now(), midnight, space, project, request, user, key, app } = init;
    this.log = new RequestLog(log);
    this.created = created;
    if (key) {
      this.key = key;
    } else {
      this.key = undefined;
    }
    if (app) {
      this.app = app;
    } else {
      this.app = undefined;
    }
    if (midnight) {
      this.midnight = midnight;
    }
    if (space) {
      this.space = space;
    } else {
      this.space = undefined;
    }
    if (project) {
      this.project = project;
    } else {
      this.project = undefined;
    }
    if (request) {
      this.request = request;
    } else {
      this.request = undefined;
    }
    if (user) {
      this.user = user;
    } else {
      this.user = '';
    }
  }

  toJSON(): IHttpHistory {
    const result: IHttpHistory = {
      kind: Kind,
      created: this.created,
      midnight: this.midnight,
      log: this.log.toJSON(),
      user: this.user,
    };
    if (this.key) {
      result.key = this.key;
    }
    if (this.space) {
      result.space = this.space;
    }
    if (this.project) {
      result.project = this.project;
    }
    if (this.request) {
      result.request = this.request;
    }
    if (this.app) {
      result.app = this.app;
    }
    return result;
  }

  /**
   * @returns The default value for the midnight when the request was last updated.
   */
  defaultMidnight(): number {
    const d = new Date(this.created);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
}
