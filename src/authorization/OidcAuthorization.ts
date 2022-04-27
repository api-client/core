import { IOidcTokenInfo, IOidcTokenError, ITokenInfo } from '../models/Authorization.js';
import { Tokens } from './lib/Tokens.js';
import { OAuth2Authorization, grantResponseMapping, reportOAuthError, resolveFunction, rejectFunction, handleTokenInfo } from './OAuth2Authorization.js';
import { nonceGenerator } from './Utils.js';

export class OidcAuthorization extends OAuth2Authorization {
  authorize(): Promise<(IOidcTokenInfo|IOidcTokenError)[]> {
    return super.authorize();
  }

  /**
   * @returns The parameters to build popup URL.
   */
  async buildPopupUrlParams(): Promise<URL | null> {
    const url = await super.buildPopupUrlParams();
    if (url === null) {
      return url;
    }
    const type = (this.settings.responseType || grantResponseMapping[this.settings.grantType!]);
    // ID token nonce
    if (type.includes('id_token')) {
      url.searchParams.set('nonce', nonceGenerator());
    }
    return url;
  }

  /**
   * @param params The instance of search params with the response from the auth dialog.
   * @returns true when the params qualify as an authorization popup redirect response.
   */
  validateTokenResponse(params: URLSearchParams): boolean {
    if (params.has('id_token')) {
      return true;
    }
    return super.validateTokenResponse(params);
  }

  /**
   * Processes the response returned by the popup or the iframe.
   */
  async processTokenResponse(params: URLSearchParams): Promise<void> {
    this.clearObservers();
    const state = params.get('state');
    if (!state) {
      this[reportOAuthError]('Server did not return the state parameter.', 'no_state');
      return;
    }
    if (state !== this.state) {
      // The authorization class (this) is created per token request so this can only have one state.
      // When the app requests for more tokens at the same time is should create multiple instances of this.
      this[reportOAuthError]('The state value returned by the authorization server is invalid.', 'invalid_state');
      return;
    }
    if (params.has('error')) {
      const info = this.createTokenResponseError(params);
      // @ts-ignore
      this[reportOAuthError](...info);
      return;
    }
    // this is the time when the tokens are received. +- a few ms.
    const time = Date.now();
    const tokens: (IOidcTokenInfo|IOidcTokenError)[] | null = this.prepareTokens(params, time);
    if (!Array.isArray(tokens) || !tokens.length) {
      this[reportOAuthError]('The authorization response has unknown response type configuration.', 'unknown_state');
      return;
    }
    const codeIndex = tokens.findIndex(i => i.responseType === 'code');
    if (codeIndex >= 0) {
      const codeToken = tokens[codeIndex] as IOidcTokenInfo;
      try {
        const info = await this.getCodeInfo(codeToken.code!);
        if (info.error) {
          tokens[codeIndex] = {
            responseType: codeToken.responseType,
            state: codeToken.state,
            error: info.error,
            errorDescription: info.errorDescription,
          } as IOidcTokenError;
        } else {
          codeToken.accessToken = info.accessToken;
          codeToken.refreshToken = info.refreshToken;
          codeToken.idToken = info.idToken;
          codeToken.tokenType = info.tokenType;
          codeToken.expiresIn = info.expiresIn;
          codeToken.scope = Tokens.computeTokenInfoScopes(this.settings.scopes, info.scope);
        }
      } catch (e) {
        tokens[codeIndex] = {
          responseType: codeToken.responseType,
          state: codeToken.state,
          error: 'unknown_state',
          errorDescription: (e as Error).message,
        } as IOidcTokenError;
      }
    }
    this.finish(tokens);
  }

  /**
   * Creates a token info object for each requested response type. These are created from the params received from the 
   * redirect URI. This means that it might not be complete (for code response type).
   * @param params
   * @param time Timestamp when the tokens were created
   */
  prepareTokens(params: URLSearchParams, time: number): IOidcTokenInfo[] | null {
    const { grantType, responseType='', scopes } = this.settings;
    let type = responseType;
    if (!type) {
      type = grantResponseMapping[grantType!];
    }
    if (!type) {
      return null;
    }
    const types = type.split(' ').map(i => i.trim()).filter(i => !!i);
    const result: IOidcTokenInfo[] = [];
    types.forEach(item => {
      const info = Tokens.createTokenInfo(item, params, time, scopes);
      if (info) {
        result.push(info);
      }
    });
    return result;
  }

  /**
   * Finishes the authorization.
   */
  finish(tokens: (IOidcTokenInfo|IOidcTokenError)[]): void {
    if (this[resolveFunction]) {
      this[resolveFunction]!(tokens as any);
    }
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Processes token info object when it's ready.
   *
   * @param info Token info returned from the server.
   */
  [handleTokenInfo](info: ITokenInfo): void {
    const { responseType } = this.settings;
    const token = Tokens.fromTokenInfo(info);
    token.responseType = responseType || '';
    this.finish([token]);
  }
}
