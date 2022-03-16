import { IRequestLog, RequestLog, Kind as RequestLogKind } from './RequestLog.js';

export const Kind = 'ARC#HttpHistory';
export const createdSymbol = Symbol('created');
export const midnightSymbol = Symbol('midnight');

export interface IHttpHistory {
  kind: typeof Kind;
  /**
   * The application code. The same as used in `Application#code`.
   * Optional.
   */
  app?: string;
  /**
   * The user project the request belongs to.
   * Optional. Also note, the project may not exist anymore in the store or the request has been removed from the project.
   */
  project?: string;
  /**
   * The optional user id that made that request.
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
 * An HTTP history is an object containing an information of a request and response
 * made with the application.
 * It consist of the RequestLog and optional information about the application that made that request and the HTTP project
 * the request belongs to as well as the id of the request.
 * However, this object may not contain these information for general purpose of the history store.
 * 
 * Note, history object are not mutable. Can only be created or deleted.
 */
export class HttpHistory {
  [createdSymbol]: number;
  [midnightSymbol]: number;
  kind = Kind;
  /**
   * The application code. The same as used in `Application#code`.
   * Optional.
   */
  app?: string;
  /**
   * The user project the request belongs to.
   * Optional. Also note, the project may not exist anymore in the store or the request has been removed from the project.
   */
  project?: string;
  /**
   * The optional user id that made that request.
   */
  user?: string;
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
    d.setHours(0, 0, 0, 0)
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
        log: {
          kind: RequestLogKind,
        },
      };
    }
    this.new(init);
  }

  new(init: IHttpHistory): void {
    const { log, created = Date.now(), midnight, app, project, request, user } = init;
    this.log = new RequestLog(log);
    this.created = created;
    if (midnight) {
      this.midnight = midnight;
    }
    if (app) {
      this.app = app;
    } else {
      this.app = undefined;
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
      this.user = undefined;
    }
  }

  toJSON(): IHttpHistory {
    const result: IHttpHistory = {
      kind: Kind,
      created: this.created,
      midnight: this.midnight,
      log: this.log.toJSON(),
    };
    if (this.app) {
      result.app = this.app;
    }
    if (this.project) {
      result.project = this.project;
    }
    if (this.request) {
      result.request = this.request;
    }
    if (this.user) {
      result.user = this.user;
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
