import { Runnable, IRunnable } from './Runnable';
import { IDataSourceConfiguration } from '../Condition';
import { RequestDataSourceEnum } from '../Enums';

export const Kind = 'ARC#SetCookieAction';

export interface ISetCookieAction extends IRunnable {
  kind?: 'ARC#SetCookieAction';
  /**
   * Name of the cookie
   */
  name: string;
  /**
   * Source of the cookie value
   */
  source: IDataSourceConfiguration;
  /**
   * When set it uses request URL instead of defined URL in the action
   */
  useRequestUrl?: boolean;
  /**
   * An URL associated with the cookie
   */
  url?: string;
  /**
   * The cookie expiration time
   */
  expires?: string;
  /**
   * Whether the cookie is host only
   */
  hostOnly?: boolean;
  /**
   * Whether the cookie is HTTP only
   */
  httpOnly?: boolean;
  /**
   * Whether the cookie is HTTPS only
   */
  secure?: boolean;
  /**
   * Whether the cookie is a session cookie
   */
  session?: boolean;
}

export class SetCookieAction extends Runnable {
  kind = Kind;
  /**
   * Name of the cookie
   */
  name = '';
  /**
   * Source of the cookie value
   */
  source: IDataSourceConfiguration = { source: RequestDataSourceEnum.url, };
  /**
   * When set it uses request URL instead of defined URL in the action
   */
  useRequestUrl?: boolean;
  /**
   * An URL associated with the cookie
   */
  url?: string;
  /**
   * The cookie expiration time
   */
  expires?: string;
  /**
   * Whether the cookie is host only
   */
  hostOnly?: boolean;
  /**
   * Whether the cookie is HTTP only
   */
  httpOnly?: boolean;
  /**
   * Whether the cookie is HTTPS only
   */
  secure?: boolean;
  /**
   * Whether the cookie is a session cookie
   */
  session?: boolean;

  constructor(input?: string | ISetCookieAction) {
    super();
    let init: ISetCookieAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        name: '',
        source: { source: RequestDataSourceEnum.url, },
      };
    }
    this.new(init);
  }

  new(init: ISetCookieAction): void {
    const { source={ source: RequestDataSourceEnum.url, }, name, useRequestUrl, url, expires, hostOnly, httpOnly, secure, session } = init;
    this.source = source;
    this.name = name;
    if (typeof useRequestUrl === 'boolean') {
      this.useRequestUrl = useRequestUrl;
    }
    if (url) {
      this.url = url;
    } else {
      this.url = undefined;
    }
    if (expires) {
      this.expires = expires;
    } else {
      this.expires = undefined;
    }
    if (typeof hostOnly === 'boolean') {
      this.hostOnly = hostOnly;
    }
    if (typeof httpOnly === 'boolean') {
      this.httpOnly = httpOnly;
    }
    if (typeof secure === 'boolean') {
      this.secure = secure;
    }
    if (typeof session === 'boolean') {
      this.session = session;
    }
  }

  toJSON(): ISetCookieAction {
    const result: ISetCookieAction = {
      kind: Kind,
      source: this.source,
      name: this.name,
    };
    if (this.url) {
      result.url = this.url;
    }
    if (this.expires) {
      result.expires = this.expires;
    }
    if (typeof this.useRequestUrl === 'boolean') {
      result.useRequestUrl = this.useRequestUrl;
    }
    if (typeof this.hostOnly === 'boolean') {
      result.hostOnly = this.hostOnly;
    }
    if (typeof this.httpOnly === 'boolean') {
      result.httpOnly = this.httpOnly;
    }
    if (typeof this.secure === 'boolean') {
      result.secure = this.secure;
    }
    if (typeof this.session === 'boolean') {
      result.session = this.session;
    }
    return result;
  }

  isValid(): boolean {
    const hasTarget = !!this.useRequestUrl || !!this.url;
    if (!hasTarget) {
      return hasTarget;
    }
    const { source } = this.source;
    return !!source;
  }
}
