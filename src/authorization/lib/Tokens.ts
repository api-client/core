import { IOidcTokenInfo, ITokenInfo } from "../../models/Authorization.js";

export class Tokens {
  /**
   * Creates a OidcTokenInfo object for the corresponding response type.
   * 
   * @param responseType The response type of the token to prepare the info for.
   * @param params params received from the authorization endpoint.
   * @param time Timestamp when the tokens were created
   * @param requestedScopes The list of requested scopes. Optional.
   * @returns 
   */
  static createTokenInfo(responseType: string, params: URLSearchParams, time: number, requestedScopes?: string[]): IOidcTokenInfo | null {
    switch (responseType) {
      case 'code': return Tokens.createCodeToken(params, time, requestedScopes);
      case 'token': return Tokens.createTokenToken(params, time, requestedScopes);
      case 'id_token': return Tokens.createIdTokenToken(params, time, requestedScopes);
      default: return null;
    }
  }

  /**
   * Creates a "code" response type token info.
   * @param params
   * @param time Timestamp when the tokens were created
   * @param requestedScopes The list of requested scopes. Optional.
   * @returns 
   */
  static createBaseToken(params: URLSearchParams, time: number, requestedScopes?: string[]): IOidcTokenInfo {
    const scope = Tokens.computeTokenInfoScopes(requestedScopes, params.get('scope')!);
    const tokenInfo: IOidcTokenInfo = {
      state: params.get('state')!,
      expiresIn: Number(params.get('expires_in')),
      tokenType: params.get('token_type')!,
      scope,
      time,
      responseType: '',
    };
    return tokenInfo;
  }

  /**
   * Creates a "code" response type token info.
   * @param params
   * @param time Timestamp when the tokens were created
   * @param requestedScopes The list of requested scopes. Optional.
   * @returns 
   */
  static createCodeToken(params: URLSearchParams, time: number, requestedScopes?: string[]): IOidcTokenInfo {
    const token = Tokens.createBaseToken(params, time, requestedScopes);
    token.responseType = 'code';
    token.code = params.get('code')!;
    return token;
  }

  /**
   * Creates a "token" response type token info.
   * @param params
   * @param time Timestamp when the tokens were created
   * @param requestedScopes The list of requested scopes. Optional.
   * @returns 
   */
  static createTokenToken(params: URLSearchParams, time: number, requestedScopes?: string[]): IOidcTokenInfo {
    const token = Tokens.createBaseToken(params, time, requestedScopes);
    token.responseType = 'token';
    token.accessToken = params.get('access_token')!;
    token.refreshToken = params.get('refresh_token')!;
    return token;
  }

  /**
   * Creates a "id_token" response type token info.
   * @param time Timestamp when the tokens were created
   * @param requestedScopes The list of requested scopes. Optional.
   */
  static createIdTokenToken(params: URLSearchParams, time: number, requestedScopes?: string[]): IOidcTokenInfo {
    const token = Tokens.createBaseToken(params, time, requestedScopes);
    token.responseType = 'id_token';
    token.accessToken = params.get('access_token')!;
    token.refreshToken = params.get('refresh_token')!;
    token.idToken = params.get('id_token')!;
    return token;
  }

  /**
   * Computes the final list of granted scopes.
   * It is a list of scopes received in the response or the list of requested scopes.
   * Because the user may change the list of scopes during the authorization process
   * the received list of scopes can be different than the one requested by the user.
   *
   * @param requestedScopes The list of requested scopes. Optional.
   * @param tokenScopes The `scope` parameter received with the response. It's null safe.
   * @returns The list of scopes for the token.
   */
  static computeTokenInfoScopes(requestedScopes?: string[], tokenScopes?: string): string[] {
    if (!tokenScopes && requestedScopes) {
      return requestedScopes;
    }
    let listScopes: string[] = [];
    if (typeof tokenScopes === 'string') {
      listScopes = tokenScopes.split(' ');
    }
    return listScopes;
  }

  static fromTokenInfo(info: ITokenInfo): IOidcTokenInfo {
    const result: IOidcTokenInfo = {
      responseType: '',
      state: info.state,
      accessToken: info.accessToken,
      time: Date.now(),
    };
    if (info.scope) {
      result.scope = info.scope;
    }
    if (info.tokenType) {
      result.tokenType = info.tokenType;
    }
    if (info.expiresIn) {
      result.expiresIn = info.expiresIn;
    }
    return result;
  }
}
