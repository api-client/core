import { IOAuth2Authorization, ITokenRemoveOptions, IOidcTokenInfo, IOidcTokenError, ITokenInfo } from '../../models/Authorization.js';
import { AuthorizationEventTypes } from './AuthorizationEventTypes.js';
import { ContextEventDetailWithResult, ContextEvent, ContextChangeRecord, ContextUpdateEvent, ContextStateUpdateEvent } from "../BaseEvents.js";

export class AuthorizationEvents {
  static get OAuth2(): typeof OAuth2Events {
    return OAuth2Events;
  }

  static get Oidc(): typeof OidcEvents {
    return OidcEvents;
  }
}

class OAuth2Events {
  /**
   * @param target A node on which to dispatch the event.
   * @param config Authorization options.
   * @returns Promise resolved with authorization result
   */
  static async authorize(target: EventTarget, config: IOAuth2Authorization): Promise<ITokenInfo | undefined> {
    const e = new ContextEvent<IOAuth2Authorization, ITokenInfo>(AuthorizationEventTypes.OAuth2.authorize, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param target A node on which to dispatch the event.
   * @param config Authorization options.
   * @returns Promise resolved when the token is removed
   */
  static async removeToken(target: EventTarget, config: ITokenRemoveOptions): Promise<void> {
    const e = new ContextEvent<ITokenRemoveOptions, void>(AuthorizationEventTypes.OAuth2.removeToken, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}

class OidcEvents {
  /**
   * @param target A node on which to dispatch the event.
   * @param config Authorization options.
   * @returns Promise resolved with authorization result
   */
  static async authorize(target: EventTarget, config: IOAuth2Authorization): Promise<(IOidcTokenInfo|IOidcTokenError)[] | undefined> {
    const e = new ContextEvent<IOAuth2Authorization, (IOidcTokenInfo|IOidcTokenError)[]>(AuthorizationEventTypes.Oidc.authorize, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param target A node on which to dispatch the event.
   * @param config Authorization options.
   * @returns Promise resolved when the token is removed
   */
  static async removeToken(target: EventTarget, config: ITokenRemoveOptions): Promise<void> {
    const e = new ContextEvent<ITokenRemoveOptions, void>(AuthorizationEventTypes.Oidc.removeTokens, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}
