import { SetCookieConfig } from '../../legacy/actions/Actions.js';
import { Runnable, IRunnable } from './Runnable.js';
import { IDataSource } from '../Condition.js';
import { RequestDataSourceEnum } from '../Enums.js';

export const Kind = 'Core#SetCookieAction';

export interface ISetCookieAction extends IRunnable {
  kind?: typeof Kind;
  /**
   * Name of the cookie
   */
  name: string;
  /**
   * Source of the cookie value
   */
  source: IDataSource;
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
  source: IDataSource = { source: RequestDataSourceEnum.url, };
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

  static fromLegacy(legacy: SetCookieConfig): SetCookieAction {
    const source = ({ ...legacy.source } as unknown) as IDataSource;
    // @ts-ignore
    delete source.iterator;
    // @ts-ignore
    delete source.iteratorEnabled;
    const init: ISetCookieAction = {
      kind: Kind,
      name: legacy.name,
      source,
    };
    if (legacy.url) {
      init.url = legacy.url;
    }
    if (typeof legacy.useRequestUrl === 'boolean') {
      init.useRequestUrl = legacy.useRequestUrl;
    }
    if (legacy.expires) {
      init.expires = legacy.expires;
    }
    if (typeof legacy.hostOnly === 'boolean') {
      init.hostOnly = legacy.hostOnly;
    }
    if (typeof legacy.httpOnly === 'boolean') {
      init.httpOnly = legacy.httpOnly;
    }
    if (typeof legacy.secure === 'boolean') {
      init.secure = legacy.secure;
    }
    if (typeof legacy.session === 'boolean') {
      init.session = legacy.session;
    }
    return new SetCookieAction(init);
  }

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
    } else {
      this.hostOnly = undefined;
    }
    if (typeof httpOnly === 'boolean') {
      this.httpOnly = httpOnly;
    } else {
      this.httpOnly = undefined;
    }
    if (typeof secure === 'boolean') {
      this.secure = secure;
    } else {
      this.secure = undefined;
    }
    if (typeof session === 'boolean') {
      this.session = session;
    } else {
      this.session = undefined;
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
