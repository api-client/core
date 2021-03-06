import { IRequest, Request } from "./Request.js";
import { HttpRequest, IHttpRequest } from "./HttpRequest.js";
import { Thing } from "./Thing.js";

export const Kind = 'Core#AppRequest';

export interface IAppRequest extends IRequest {
  kind: typeof Kind;
  key: string;
  /**
   * The application id that created this request.
   */
  app: string;
  /**
   * May be used internally by the application that generated this entry 
   * to distinguish between different types of requests.
   */
  type?: string;
}

/**
 * An App request is an HTTP request that has been generated by an application that is 
 * not related to a concept of project.
 * You can think of it as a stand-alone request definition in an application.
 * In HttpClient this represents a history entry. Another application can use it to stor a request data
 * without any additional structure.
 */
export class AppRequest extends Request {
  kind = Kind;

  /**
   * The identifier of the request.
   * The key is related to the `created` property. It should be the `new Date(created).toJSON()` value.
   */
  key = '';

  /**
   * The application id that created this request.
   */
  app = '';

  /**
   * May be used internally by the application that generated this entry 
   * to distinguish between different types of requests.
   */
  type?: string;

  /**
   * Creates a project request from an URL.
   * 
   * @param url The Request URL. This is required.
   * @param app The application id that generated this request. This is a required argument, even though, typings marks it as optional.
   */
  static fromUrl(url: string, app?: string): AppRequest {
    if (!app) {
      throw new Error(`The app argument is required.`);
    }
    const d = new Date();
    const now: number = d.getTime();
    const request = new AppRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ url, method: 'GET' }).toJSON(),
      info: Thing.fromName(url).toJSON(),
      app,
    });
    return request;
  }

  /**
   * Creates a project request from a name.
   * 
   * @param name The Request name.
   * @param app The application id that generated this request. This is a required argument, even though, typings marks it as optional.
   */
  static fromName(name: string, app?: string): AppRequest {
    if (!app) {
      throw new Error(`The app argument is required.`);
    }
    const d = new Date();
    const now: number = d.getTime();
    const request = new AppRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: new HttpRequest().toJSON(),
      info: Thing.fromName(name).toJSON(),
      app,
    });
    return request;
  }

  /**
   * Creates a request from an HttpRequest definition.
   * 
   * @param info The request data.
   * @param app The application id that generated this request. This is a required argument, even though, typings marks it as optional.
   */
  static fromHttpRequest(info: IHttpRequest, app?: string): AppRequest {
    if (!app) {
      throw new Error(`The app argument is required.`);
    }
    const d = new Date();
    const now: number = d.getTime();
    const request = new AppRequest({
      key: d.toJSON(),
      kind: Kind,
      created: now,
      updated: now,
      expects: HttpRequest.fromBaseValues({ method: info.method, url: info.url, headers: info.headers, payload: info.payload }).toJSON(),
      info: Thing.fromName(info.url).toJSON(),
      app,
    });
    return request;
  }

  /**
   * Creates a request for a schema of a Request.
   * @param app The application id that generated this request.
   */
  static fromRequest(request: IRequest, app: string): AppRequest {
    const d = new Date(request.created || Date.now());
    const now: number = d.getTime();
    const init: IAppRequest = {
      ...request,
      key: d.toJSON(),
      kind: Kind,
      created: now,
      app,
    };
    const result = new AppRequest(init);
    return result;
  }

  constructor(input?: string | IAppRequest) {
    super(input);

    let init: IAppRequest | undefined;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    }
    if (init) {
      this.key = init.key;
      this.app = init.app;
    }
    if (!this.key) {
      this.key = new Date(this.created || Date.now()).toJSON();
    }
    this.kind = Kind;
  }

  new(init: IAppRequest): void {
    super.new(init);

    const { key, app } = init;
    this.key = key || new Date(init.created || Date.now()).toJSON();
    this.kind = Kind;
    this.app = app;
  }

  toJSON(): IAppRequest {
    const request = super.toJSON();
    const result: IAppRequest = {
      ...request,
      key: this.key,
      kind: Kind,
      app: this.app,
    };
    return result;
  }
}
