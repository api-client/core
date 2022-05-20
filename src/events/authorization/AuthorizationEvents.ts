import { IOAuth2Authorization, ITokenRemoveOptions, IOidcTokenInfo, IOidcTokenError, ITokenInfo } from '../../models/Authorization.js';
import { AuthorizationEventTypes } from './AuthorizationEventTypes.js';
import { ContextEvent } from "../BaseEvents.js";

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
   * @param config Authorization options.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved with authorization result
   */
  static async authorize(config: IOAuth2Authorization, target: EventTarget = window): Promise<ITokenInfo | undefined> {
    const e = new ContextEvent<IOAuth2Authorization, ITokenInfo>(AuthorizationEventTypes.OAuth2.authorize, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param config Authorization options.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved when the token is removed
   */
  static async removeToken(config: ITokenRemoveOptions, target: EventTarget = window): Promise<void> {
    const e = new ContextEvent<ITokenRemoveOptions, void>(AuthorizationEventTypes.OAuth2.removeToken, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}

class OidcEvents {
  /**
   * @param config Authorization options.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved with authorization result
   */
  static async authorize(config: IOAuth2Authorization, target: EventTarget = window): Promise<(IOidcTokenInfo|IOidcTokenError)[] | undefined> {
    const e = new ContextEvent<IOAuth2Authorization, (IOidcTokenInfo|IOidcTokenError)[]>(AuthorizationEventTypes.Oidc.authorize, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param config Authorization options.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved when the token is removed
   */
  static async removeToken(config: ITokenRemoveOptions, target: EventTarget = window): Promise<void> {
    const e = new ContextEvent<ITokenRemoveOptions, void>(AuthorizationEventTypes.Oidc.removeTokens, config);
    target.dispatchEvent(e);
    return e.detail.result;
  }
}
