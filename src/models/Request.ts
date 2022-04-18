import { IRequestConfig, RequestConfig } from './RequestConfig.js';
import { Thing, IThing, Kind as ThingKind } from './Thing.js';
import { IRequestActions, RequestActions } from './RequestActions.js';
import { HttpCertificate, Certificate } from './ClientCertificate.js';
import { IRequestAuthorization, RequestAuthorization } from './RequestAuthorization.js';
import { IRequestLog, RequestLog, Kind as LogKind } from './RequestLog.js';
import { SentRequest } from './SentRequest.js';
import { ErrorResponse } from './ErrorResponse.js';
import { Response } from './Response.js';
import { RequestsSize } from './RequestsSize.js';
import { IHttpRequest, HttpRequest, Kind as HttpRequestKind } from './HttpRequest.js';
import { ARCSavedRequest, ARCHistoryRequest } from './legacy/request/ArcRequest.js';
import { ErrorResponse as LegacyErrorResponse, Response as LegacyResponse } from './legacy/request/ArcResponse.js';
import { PayloadSerializer } from '../lib/transformers/PayloadSerializer.js';
import { Normalizer } from './legacy/Normalizer.js';

export const Kind = 'Core#Request';
export const createdSymbol = Symbol('created');
export const updatedSymbol = Symbol('updated');
export const midnightSymbol = Symbol('midnight');

/**
 * The definition of a request object that functions inside API Client
 * with the full configuration.
 */
export interface IRequest {
  kind: string;
  /**
   * The basic information about the project.
   */
  info: IThing;
  /**
   * The HTTP definition of the request.
   */
  expects: IHttpRequest;
  /**
   * The execution log of the last HTTP request with a response.
   */
  log?: IRequestLog;
  /**
   * Timestamp when the request was last updated.
   */
  updated?: number;
  /**
   * Timestamp when the request was created.
   */
  created?: number;
  /**
   * A timestamp of the midnight when the request object was updated
   */
  midnight?: number;
  /**
   * Request processing configuration.
   */
  config?: IRequestConfig;
  /**
   * Request authorization configuration
   */
  authorization?: IRequestAuthorization[];
  /**
   * Actions to be performed when the request is executed.
   */
  actions?: IRequestActions;
  /**
   * The list of certificates to use with the request.
   */
  clientCertificate?: HttpCertificate;
}

export class Request {
  [createdSymbol]: number;
  [updatedSymbol]: number;
  [midnightSymbol]: number;
  kind = Kind;
  /**
   * The basic information about the project.
   */
  info: Thing = new Thing();
  /**
   * The HTTP definition of the request.
   */
  expects: HttpRequest = new HttpRequest();
  /**
   * The execution log of the last HTTP request with a response.
   */
  log?: RequestLog;
  /**
   * Request processing configuration.
   */
  config?: RequestConfig;
  /**
   * Request authorization configuration
   */
  authorization?: RequestAuthorization[];
  /**
   * Actions to be performed when the request is executed.
   */
  actions?: RequestActions;
  /**
   * The list of certificates to use with the request.
   */
  clientCertificate?: Certificate;

  /**
   * Creates a request from an URL.
   * 
   * @param url The Request URL.
   */
  static fromUrl(url: string): Request {
    const now:number = Date.now();
    const request = new Request({
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
   * Creates a request from a name.
   * 
   * @param name The Request name.
   */
  static fromName(name: string): Request {
    const now:number = Date.now();
    const request = new Request({
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
   * Creates a request from an HttpRequest definition.
   * 
   * @param info The request data.
   */
  static fromHttpRequest(info: IHttpRequest): Request {
    const now:number = Date.now();
    const request = new Request({
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

  static async fromLegacy(request: ARCSavedRequest|ARCHistoryRequest): Promise<Request> {
    const normalized = Normalizer.normalizeRequest(request) as ARCSavedRequest;
    if (!normalized) {
      throw new Error(`Unknown object.`);
    }
    const init:IRequest = {
      kind: Kind,
      expects: {
        kind: HttpRequestKind,
        method: normalized.method || 'GET',
        url: normalized.url || '',
        headers: normalized.headers,
      },
      info: {
        kind: ThingKind,
        name: normalized.name || 'Unnamed request',
      },
    };
    init.created = normalized.created;
    init.updated = normalized.updated;
    if (normalized.actions) {
      init.actions = RequestActions.fromLegacy(normalized.actions).toJSON();
    }
    if (Array.isArray(normalized.authorization) && normalized.authorization.length) {
      init.authorization = normalized.authorization.map((i) => RequestAuthorization.fromLegacy(i).toJSON());
    }
    if (normalized.config) {
      init.config = RequestConfig.fromLegacy(normalized.config).toJSON();
    }
    if (normalized.payload) {
      init.expects.payload = await PayloadSerializer.serialize(normalized.payload);
    } else if (normalized.blob) {
      init.expects.payload = {
        type: 'blob',
        data: normalized.blob,
      };
    } else if (normalized.multipart) {
      init.expects.payload = {
        type: 'formdata',
        data: normalized.multipart,
      };
    }
    const log = new RequestLog();
    if (normalized.transportRequest) {
      const sent = await SentRequest.fromLegacy(normalized.transportRequest);
      log.request = sent;
    }
    if (normalized.response) {
      const typedError = normalized.response as LegacyErrorResponse;
      if (typedError.error) {
        log.response = await ErrorResponse.fromLegacy(typedError);
      } else {
        const typedResponse = normalized.response as LegacyResponse;
        log.response = await Response.fromLegacy(typedResponse);
        if (Array.isArray(typedResponse.redirects) && typedResponse.redirects.length) {
          const promises = typedResponse.redirects.map((redirect) => log.addLegacyRedirect(redirect));
          await Promise.allSettled(promises);
        }
        if (typedResponse.size) {
          log.size = new RequestsSize(typedResponse.size);
        }
      }
    }
    init.log = log.toJSON();
    return new Request(init);
  }

  /**
   * @param value The timestamp when the request was created.
   */
  set created(value: number | undefined) {
    if (!value) {
      this[createdSymbol] = Date.now();
    } else {
      this[createdSymbol] = value;
    }
  }

  /**
   * @returns The timestamp when the request was created.
   */
  get created(): number {
    return this[createdSymbol] || Date.now();
  }

  /**
   * @param value The timestamp when the request was last updated.
   */
  set updated(value: number | undefined) {
    if (!value) {
      this[updatedSymbol] = this.created;
    } else {
      this[updatedSymbol] = value;
    }
    const d = new Date(this[updatedSymbol]);
    d.setHours(0, 0, 0, 0)
    this[midnightSymbol] = d.getTime();
  }

  /**
   * @returns The timestamp when the request was last updated.
   */
  get updated(): number {
    return this[updatedSymbol] || this.created;
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

  constructor(input?: string|IRequest) {
    let init: IRequest;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      const now:number = Date.now();
      init = {
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

  new(init: IRequest): void {
    const { expects, log, updated, created = Date.now(), midnight, config, authorization, actions, clientCertificate, info } = init;
    if (expects) {
      this.expects = new HttpRequest(expects);
    } else {
      this.expects = new HttpRequest();
    }
    if (info) {
      if (!info.kind) {
        info.kind = ThingKind;
      }
      this.info = new Thing(info);
    } else {
      this.info = new Thing({ kind: ThingKind, name: '' });
    }
    if (log) {
      this.log = new RequestLog(log);
    } else {
      this.log = undefined;
    }
    if (config) {
      this.config = new RequestConfig(config);
    } else {
      this.config = undefined;
    }
    if (Array.isArray(authorization)) {
      this.authorization = authorization.map(i => new RequestAuthorization(i));
    } else {
      this.authorization = undefined;
    }
    this.created = created;
    if (updated) {
      this.updated = updated;
    } else {
      this.updated = this.created;
    }
    if (midnight) {
      this.midnight = midnight;
    }
    if (actions) {
      this.actions = new RequestActions(actions);
    } else {
      this.actions = undefined;
    }
    if (clientCertificate) {
      this.clientCertificate = new Certificate(clientCertificate);
    } else {
      this.clientCertificate = undefined;
    }
  }

  toJSON(): IRequest {
    const result: IRequest = {
      kind: Kind,
      expects: this.expects.toJSON(),
      info: this.info.toJSON(),
      created: this.created,
      updated: this.updated,
      midnight: this.midnight,
    };
    if (this.log) {
      result.log = this.log.toJSON();
    }
    if (this.config) {
      result.config = this.config.toJSON();
    }
    if (Array.isArray(this.authorization)) {
      result.authorization = this.authorization.map(i => i.toJSON());
    }
    if (this.actions) {
      result.actions = this.actions.toJSON();
    }
    if (this.clientCertificate) {
      result.clientCertificate = this.clientCertificate.toJSON();
    }
    return result;
  }

  /**
   * Sets the basic information about a project.
   */
  setInfo(info: IThing): void {
    this.info = new Thing(info);
    this.updated = Date.now();
  }

  /**
   * If the info object does not exist it is being created.
   * @return The instance of an HTTP request information.
   */
  getExpects(): HttpRequest {
    if (!this.expects) {
      this.expects = new HttpRequest();
    }
    return this.expects;
  }

  /**
   * @returns The default value for the midnight when the request was last updated.
   */
  defaultMidnight(): number {
    const d = new Date(this.updated);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /**
   * Reads the config from the request. If the config object does not exists it creates one.
   */
  getConfig(): RequestConfig {
    if (!this.config) {
      this.config = new RequestConfig();
    }
    return this.config;
  }

  setLog(log: IRequestLog): void {
    const info: IRequestLog = { ...log, kind: LogKind };
    this.log = new RequestLog(info);
    this.updated = Date.now();
  }
}
