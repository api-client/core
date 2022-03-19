import { DeleteCookieConfig } from '../../legacy/actions/Actions.js';
import { Runnable, IRunnable } from './Runnable.js';

export const Kind = 'Core#DeleteCookieAction';

export interface IDeleteCookieAction extends IRunnable {
  kind?: typeof Kind;
  /**
   * When set it uses request URL instead of defined URL in the action.
   */
  useRequestUrl?: boolean;
  /**
   * An URL associated with the cookie.
   * Only used when `useRequestUrl` is not `true`.
   * Either `url` or `useRequestUrl` must be set for the action to be considered valid.
   */
  url?: string;
  /**
   * Name of the cookie to remove.
   * When not set it removes all cookies.
   */
  name?: string;
}

export class DeleteCookieAction extends Runnable {
  kind = Kind;
  /**
   * When set it uses request URL instead of defined URL in the action.
   */
  useRequestUrl?: boolean;
  /**
   * An URL associated with the cookie.
   * Only used when `useRequestUrl` is not `true`.
   * Either `url` or `useRequestUrl` must be set for the action to be considered valid.
   */
  url?: string;
  /**
   * Name of the cookie to remove.
   * When not set it removes all cookies.
   */
  name?: string;

  isValid(): boolean {
    return !!this.useRequestUrl || !!this.url;
  }

  static fromLegacy(legacy: DeleteCookieConfig): DeleteCookieAction {
    const init: IDeleteCookieAction = {
      kind: Kind,
      name: legacy.name,
    };
    if (legacy.url) {
      init.url = legacy.url;
    }
    if (typeof legacy.useRequestUrl === 'boolean') {
      init.useRequestUrl = legacy.useRequestUrl;
    }
    if (legacy.removeAll) {
      delete init.name;
    }
    return new DeleteCookieAction(init);
  }

  constructor(input?: string | IDeleteCookieAction) {
    super();
    let init: IDeleteCookieAction;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
      };
    }
    this.new(init);
  }

  new(init: IDeleteCookieAction): void {
    const { useRequestUrl, url, name } = init;
    if (typeof useRequestUrl === 'boolean') {
      this.useRequestUrl = useRequestUrl;
    } else {
      this.useRequestUrl = undefined;
    }
    if (url) {
      this.url = url;
    } else {
      this.url = undefined;
    }
    if (name) {
      this.name = name;
    } else {
      this.name = undefined;
    }
  }

  toJSON(): IDeleteCookieAction {
    const result: IDeleteCookieAction = {
      kind: Kind,
    };
    if (this.url) {
      result.url = this.url;
    }
    if (this.name) {
      result.name = this.name;
    }
    if (typeof this.useRequestUrl === 'boolean') {
      result.useRequestUrl = this.useRequestUrl;
    }
    return result;
  }
}
