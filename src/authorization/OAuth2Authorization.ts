/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { sanityCheck, randomString, camel, generateCodeChallenge } from './Utils.js';
import { applyCustomSettingsQuery, applyCustomSettingsBody, applyCustomSettingsHeaders } from './CustomParameters.js';
import { AuthorizationError, CodeError } from './AuthorizationError.js';
import { IframeAuthorization } from './lib/IframeAuthorization.js';
import { PopupAuthorization } from './lib/PopupAuthorization.js';
import * as KnownGrants from './lib/KnownGrants.js';
import { IOAuth2Authorization, ITokenInfo } from 'src/models/Authorization.js';
import { OauthProcessingOptions } from './types.js';

export const resolveFunction = Symbol('resolveFunction');
export const rejectFunction = Symbol('rejectFunction');
export const settingsValue = Symbol('settingsValue');
export const optionsValue = Symbol('optionsValue');
export const prepareSettings = Symbol('prepareSettings');
export const prepareOptions = Symbol('prepareOptions');
export const authorize = Symbol('authorize');
export const stateValue = Symbol('stateValue');
export const authorizeImplicitCode = Symbol('authorizeImplicitCode');
export const authorizeClientCredentials = Symbol('authorizeClientCredentials');
export const authorizePassword = Symbol('authorizePassword');
export const authorizeCustomGrant = Symbol('authorizeCustomGrant');
export const authorizeDeviceCode = Symbol('authorizeDeviceCode');
export const authorizeJwt = Symbol('authorizeJwt');
export const popupValue = Symbol('popupValue');
export const popupUnloadHandler = Symbol('popupUnloadHandler');
export const tokenResponse = Symbol('tokenResponse');
export const messageHandler = Symbol('messageHandler');
export const iframeValue = Symbol('iframeValue');
export const processPopupRawData = Symbol('processPopupRawData');
export const handleTokenInfo = Symbol('handleTokenInfo');
export const computeTokenInfoScopes = Symbol('computeTokenInfoScopes');
export const computeExpires = Symbol('computeExpires');
export const codeValue = Symbol('codeValue');
export const frameTimeoutHandler = Symbol('frameTimeoutHandler');
export const reportOAuthError = Symbol('reportOAuthError');
export const authorizePopup = Symbol('authorizePopup');
export const authorizeTokenNonInteractive = Symbol('authorizeTokenNonInteractive');
export const createErrorParams = Symbol('createErrorParams');
export const handleTokenCodeError = Symbol('handleTokenCodeError');
export const codeVerifierValue = Symbol('codeVerifierValue');
export const tokenInfoFromParams = Symbol('tokenInfoFromParams');

export const grantResponseMapping: Record<string, string> = {
  implicit: 'token',
  authorization_code: 'code',
};

/**
 * A library that performs OAuth 2 authorization.
 * 
 * It is build for API components ecosystem and the configuration is defined in `@advanced-rest-client/events`
 * so all components use the same configuration.
 */
export class OAuth2Authorization {
  [settingsValue]: IOAuth2Authorization;

  /**
   * @returns The authorization settings used to initialize this class.
   */
  get settings(): IOAuth2Authorization {
    return this[settingsValue];
  }

  [optionsValue]: OauthProcessingOptions;

  /**
   * @returns The processing options used to initialize this object.
   */
  get options(): OauthProcessingOptions {
    return this[optionsValue];
  }

  [stateValue]?: string;

  /**
   * @returns The request state parameter. If the state is not passed with the configuration one is generated.
   */
  get state(): string {
    if (!this[stateValue]) {
      this[stateValue] = this.settings.state || randomString();
    }
    return this[stateValue]!;
  }

  /**
   * @type The main resolve function
   */
  [resolveFunction]?: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void;

  /**
   * @type The main reject function
   */
  [rejectFunction]?: (reason?: Error) => void;

  [codeVerifierValue]?: string;

  [popupValue]?: PopupAuthorization;

  [iframeValue]?: IframeAuthorization;

  [tokenResponse]?: ITokenInfo;

  [codeValue]?: string;

  /**
   * @param {OAuth2Settings} settings The authorization configuration.
   * @param {OauthProcessingOptions=} options Additional processing options to configure the behavior of this library.
   */
  constructor(settings: IOAuth2Authorization, options: OauthProcessingOptions = {}) {
    if (!settings) {
      throw new TypeError('Expected one argument.');
    }
    this[settingsValue] = this[prepareSettings](settings);
    this[optionsValue] = this[prepareOptions](options);

    this[messageHandler] = this[messageHandler].bind(this);
    this[frameTimeoutHandler] = this[frameTimeoutHandler].bind(this);
    this[popupUnloadHandler] = this[popupUnloadHandler].bind(this);
  }

  /**
   * @param settings
   * @returns Processed settings
   */
  [prepareSettings](settings: IOAuth2Authorization): IOAuth2Authorization {
    const copy = { ...settings };
    Object.freeze(copy);
    return copy;
  }

  /**
   * @param options
   * @returns Processed options
   */
  [prepareOptions](options: OauthProcessingOptions): OauthProcessingOptions {
    const copy = {
      popupPullTimeout: 50,
      messageTarget: window,
      ...options,
    };
    Object.freeze(copy);
    return copy;
  }

  /**
   * A function that should be called before the authorization.
   * It checks configuration integrity, and performs some sanity checks 
   * like proper values of the request URIs.
   */
  checkConfig(): void {
    // @todo(pawel): perform settings integrity tests.
    sanityCheck(this.settings);
  }

  /**
   * Performs the authorization.
   * @returns Promise resolved to the token info.
   */
  authorize(): Promise<ITokenInfo> {
    return new Promise((resolve, reject) => {
      this[resolveFunction] = resolve;
      this[rejectFunction] = reject;
      this[authorize]();
    });
  }

  /**
   * Reports authorization error back to the application.
   *
   * This operation clears the promise object.
   *
   * @param {string} message The message to report
   * @param {string} code Error code
   */
  [reportOAuthError](message: string, code: string): void {
    this.clearObservers();
    if (!this[rejectFunction]) {
      return;
    }
    const interactive = typeof this.settings.interactive === 'boolean' ? this.settings.interactive : true;
    const e = new AuthorizationError(
      message,
      code,
      this.state,
      interactive,
    );
    this[rejectFunction]!(e);
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Starts the authorization process.
   */
  [authorize](): void {
    const { settings } = this;
    switch (settings.grantType) {
      case KnownGrants.implicit:
      case KnownGrants.code:
        this[authorizeImplicitCode]();
        break;
      case KnownGrants.clientCredentials:
        this[authorizeClientCredentials]();
        break;
      case KnownGrants.password:
        this[authorizePassword]();
        break;
      case KnownGrants.deviceCode:
        this[authorizeDeviceCode]();
        break;
      case KnownGrants.jwtBearer:
        this[authorizeJwt]();
        break;
      default:
        this[authorizeCustomGrant]();
    }
  }

  /**
   * Starts the authorization flow for the `implicit` and `authorization_code` flows.
   * If the `interactive` flag is configured it  then it chooses between showing the UI (popup)
   * or non-interactive iframe.
   */
  async [authorizeImplicitCode](): Promise<void> {
    const { settings } = this;
    const url = await this.constructPopupUrl();
    try {
      if (!url) {
        throw new Error(`Unable to construct the authorization URL.`);
      }
      if (settings.interactive === false) {
        this[authorizeTokenNonInteractive](url);
      } else {
        this[authorizePopup](url);
      }
      this.options.messageTarget?.addEventListener('message', this[messageHandler] as any);
    } catch (e) {
      this[rejectFunction]!(e as Error);
      this[rejectFunction] = undefined;
      this[resolveFunction] = undefined;
    }
  }

  /**
   * Constructs the popup/iframe URL for the `implicit` or `authorization_code` grant types.
   * @return Full URL for the endpoint.
   */
  async constructPopupUrl(): Promise<string | null> {
    const url = await this.buildPopupUrlParams();
    if (!url) {
      return null;
    }
    return url.toString();
  }

  /**
   * @returns The parameters to build popup URL.
   */
  async buildPopupUrlParams(): Promise<URL | null> {
    const { settings } = this;
    const type = (settings.responseType || grantResponseMapping[settings.grantType!]);
    if (!type) {
      return null;
    }
    const url = new URL(settings.authorizationUri!);
    url.searchParams.set('response_type', type);
    url.searchParams.set('client_id', settings.clientId!);
    // Client secret cannot be ever exposed to the client (browser)!
    // if (settings.clientSecret) {
    //   url.searchParams.set('client_secret', settings.clientSecret);
    // }
    url.searchParams.set('state', this.state);
    if (settings.redirectUri) {
      url.searchParams.set('redirect_uri', settings.redirectUri);
    }
    const { scopes } = settings;
    if (Array.isArray(scopes) && scopes.length) {
      url.searchParams.set('scope', scopes.join(' '));
    }
    if (settings.includeGrantedScopes) {
      // this is Google specific
      url.searchParams.set('include_granted_scopes', 'true');
    }
    if (settings.loginHint) {
      // this is Google specific
      url.searchParams.set('login_hint', settings.loginHint);
    }
    if (settings.interactive === false) {
      // this is Google specific
      url.searchParams.set('prompt', 'none');
    }
    if (settings.pkce && String(type).includes('code')) {
      this[codeVerifierValue] = randomString();
      const challenge = await generateCodeChallenge(this[codeVerifierValue]!);
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    // custom query parameters from the `api-authorization-method` component
    if (settings.customData) {
      const cs = settings.customData.auth;
      if (cs) {
        applyCustomSettingsQuery(url, cs);
      }
    }
    return url;
  }

  /**
   * Opens a popup to request authorization from the user.
   * @param url The URL to open.
   */
  [authorizePopup](url: string): void {
    const popup = new PopupAuthorization(this.options.popupPullTimeout);
    try {
      popup.load(url);
    } catch (e) {
      const cause = e as Error;
      throw new AuthorizationError(
        cause.message,
        'popup_blocked',
        this.state,
        this.settings.interactive || false,
      );
    }
    popup.addEventListener('close', this[popupUnloadHandler]);
    this[popupValue] = popup;
  }

  /**
   * Tries to authorize the user in a non interactive way (iframe rather than a popup).
   * 
   * This method always result in a success response. When there's an error or
   * user is not logged in then the response won't contain auth token info.
   *
   * @param url Complete authorization url
   */
  [authorizeTokenNonInteractive](url: string): void {
    const iframe = new IframeAuthorization(this.options.iframeTimeout);
    iframe.addEventListener('timeout', this[frameTimeoutHandler]);
    iframe.load(url);
    this[iframeValue] = iframe;
  }

  /**
   * Event handler for the the iframe timeout event.
   * If there's the reject function then it is called with the error details.
   */
  [frameTimeoutHandler](): void {
    if (!this[rejectFunction]) {
      return;
    }
    const e = new AuthorizationError(
      'Non-interactive authorization failed.',
      'iframe_load_error',
      this.state,
      false,
    );
    this[rejectFunction]!(e);
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Clears all registered observers:
   * - popup/iframe message listeners
   * - popup info pull interval
   */
  clearObservers(): void {
    this.options.messageTarget?.removeEventListener('message', this[messageHandler] as any);
    if (this[popupValue]) {
      this[popupValue]!.cleanUp();
      this[popupValue] = undefined;
    }
    if (this[iframeValue]) {
      this[iframeValue]!.cancel();
      this[iframeValue]!.cleanUp();
      this[iframeValue] = undefined;
    }
  }

  /**
   * This is called when the popup info pull interval detects that the window was closed.
   * It checks whether the token info has been set by the redirect page and if not then it reports an error.
   */
  [popupUnloadHandler](): void {
    if (this[tokenResponse] || (this.settings.grantType === 'authorization_code' && this[codeValue])) {
      // everything seems to be ok.
      return;
    }
    if (!this[rejectFunction]) {
      // someone already called it.
      return;
    }
    this[reportOAuthError]('No response has been recorded.', 'no_response');
  }

  /**
   * A handler for the `message` event registered when performing authorization that involves the popup
   * of the iframe.
   */
  [messageHandler](e: MessageEvent): void {
    const popup = this[popupValue];
    const iframe = this[iframeValue];
    if (!popup && !iframe) {
      return;
    }
    this[processPopupRawData](e.data);
  }

  /**
   * @param {any} raw The data from the `MessageEvent`. Might not be the data returned by the auth popup/iframe.
   */
  [processPopupRawData](raw: any): void {
    if (!raw) {
      return;
    }
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(raw);
    } catch (e) {
      // @ts-ignore
      this[reportOAuthError]('Invalid response from the redirect page');
      return;
    }
    if (this.validateTokenResponse(params)) {
      this.processTokenResponse(params);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Unprocessable authorization response', raw);
    }
  }

  /**
   * @param {URLSearchParams} params The instance of search params with the response from the auth dialog.
   * @returns {boolean} true when the params qualify as an authorization popup redirect response.
   */
  validateTokenResponse(params: URLSearchParams): boolean {
    const oauthParams = [
      'state',
      'error',
      'access_token',
      'code',
    ];
    return oauthParams.some(name => params.has(name));
  }

  /**
   * Processes the response returned by the popup or the iframe.
   */
  async processTokenResponse(oauthParams: URLSearchParams): Promise<void> {
    this.clearObservers();
    const state = oauthParams.get('state');
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
    if (oauthParams.has('error')) {
      const args = this.createTokenResponseError(oauthParams);
      // @ts-ignore
      this[reportOAuthError](...args);
      return;
    }
    const { grantType, responseType } = this.settings;
    if (grantType === 'implicit' || responseType === 'id_token') {
      this[handleTokenInfo](this[tokenInfoFromParams](oauthParams));
      return;
    }
    if (grantType === 'authorization_code') {
      const code = oauthParams.get('code');
      if (!code) {
        this[reportOAuthError]('The authorization server did not returned the authorization code.', 'no_code');
        return;
      }
      this[codeValue] = code;
      let tokenInfo;
      try {
        tokenInfo = await this.exchangeCode(code);
      } catch (e) {
        this[handleTokenCodeError](e as Error);
        return;
      }
      this[handleTokenInfo](tokenInfo);
      return;
    }

    this[reportOAuthError]('The authorization process has an invalid state. This should never happen.', 'unknown_state');
  }

  /**
   * Processes the response returned by the popup or the iframe.
   * @returns Parameters for the [reportOAuthError]() function
   */
  createTokenResponseError(oauthParams: URLSearchParams): string[] {
    const code = oauthParams.get('error')!;
    const message = oauthParams.get('error_description')!;
    return this[createErrorParams](code, message);
  }

  /**
   * Creates arguments for the error function from error response
   * @param code Returned from the authorization server error code
   * @param description Returned from the authorization server error description
   * @returns Parameters for the [reportOAuthError]() function
   */
  [createErrorParams](code: string, description?: string): string[] {
    let message;
    if (description) {
      message = description;
    } else {
      switch (code) {
        case 'interaction_required':
          message = 'The request requires user interaction.';
          break;
        case 'invalid_request':
          message = 'The request is missing a required parameter.';
          break;
        case 'invalid_client':
          message = 'Client authentication failed.';
          break;
        case 'invalid_grant':
          message = 'The provided authorization grant or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.';
          break;
        case 'unauthorized_client':
          message = 'The authenticated client is not authorized to use this authorization grant type.';
          break;
        case 'unsupported_grant_type':
          message = 'The authorization grant type is not supported by the authorization server.';
          break;
        case 'invalid_scope':
          message = 'The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.';
          break;
        default:
          message = 'Unknown error';
      }
    }
    return [message, code];
  }

  /**
   * Creates a token info object from query parameters
   */
  [tokenInfoFromParams](oauthParams: URLSearchParams): ITokenInfo {
    const accessToken = oauthParams.get('access_token')!;
    const idToken = oauthParams.get('id_token')!;
    const refreshToken = oauthParams.get('refresh_token')!;
    const tokenType = oauthParams.get('token_type')!;
    const expiresIn = Number(oauthParams.get('expires_in')!);
    const scope = this[computeTokenInfoScopes](oauthParams.get('scope')!);
    const tokenInfo: ITokenInfo = {
      accessToken,
      // FIXME: This should be set in the OIDC class.
      // @ts-ignore
      idToken,
      refreshToken,
      tokenType,
      expiresIn,
      state: oauthParams.get('state')!,
      scope,
      expiresAt: 0,
      expiresAssumed: false,
    };
    return this[computeExpires](tokenInfo);
  }

  /**
   * Processes token info object when it's ready.
   *
   * @param info Token info returned from the server.
   */
  [handleTokenInfo](info: ITokenInfo): void {
    this[tokenResponse] = info;
    if (this[resolveFunction]) {
      this[resolveFunction]!(info);
    }
    this[rejectFunction] = undefined;
    this[resolveFunction] = undefined;
  }

  /**
   * Computes token expiration time.
   * It sets `expires_at` property on the token info object which is the time
   * in the future when when the token expires.
   *
   * @param tokenInfo Token info object
   * @returns A copy with updated properties.
   */
  [computeExpires](tokenInfo: ITokenInfo): ITokenInfo {
    const copy = { ...tokenInfo };
    let { expiresIn } = copy;
    if (!expiresIn || Number.isNaN(expiresIn)) {
      expiresIn = 3600;
      copy.expiresAssumed = true;
    }
    copy.expiresIn = expiresIn;
    const expiresAt = Date.now() + (expiresIn * 1000);
    copy.expiresAt = expiresAt;
    return copy;
  }

  /**
   * Computes the final list of granted scopes.
   * It is a list of scopes received in the response or the list of requested scopes.
   * Because the user may change the list of scopes during the authorization process
   * the received list of scopes can be different than the one requested by the user.
   *
   * @param scope The `scope` parameter received with the response. It's null safe.
   * @returns The list of scopes for the token.
   */
  [computeTokenInfoScopes](scope: string): string[] {
    const requestedScopes = this.settings.scopes;
    if (!scope && requestedScopes) {
      return requestedScopes;
    }
    let listScopes: string[] = [];
    if (scope) {
      listScopes = scope.split(' ');
    }
    return listScopes;
  }

  /**
   * Exchanges the authorization code for authorization token.
   *
   * @param code Returned code from the authorization endpoint.
   * @returns The response from the server.
   */
  async getCodeInfo(code: string): Promise<Record<string, any>> {
    const body = this.getCodeRequestBody(code);
    const url = this.settings.accessTokenUri!;
    return this.requestTokenInfo(url, body);
  }

  /**
   * Requests for token from the authorization server for `code`, `password`, `client_credentials` and custom grant types.
   *
   * @param url Base URI of the endpoint. Custom properties will be applied to the final URL.
   * @param body Generated body for given type. Custom properties will be applied to the final body.
   * @param optHeaders Optional headers to add to the request. Applied after custom data.
   * @returns Promise resolved to the response string.
   */
  async requestTokenInfo(url: string, body: string, optHeaders?: Record<string, string>): Promise<Record<string, any>> {
    const urlInstance = new URL(url);
    const { settings, options } = this;
    let headers: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded',
    };
    if (settings.customData) {
      if (settings.customData.token) {
        applyCustomSettingsQuery(urlInstance, settings.customData.token);
      }
      body = applyCustomSettingsBody(body, settings.customData);
      headers = applyCustomSettingsHeaders(headers, settings.customData);
    }
    if (optHeaders) {
      headers = { ...headers, ...optHeaders };
    }
    const init: RequestInit = {
      headers,
      body,
      method: 'POST',
      cache: 'no-cache',
    };
    let authTokenUrl = urlInstance.toString();
    if (options.tokenProxy) {
      const suffix = options.tokenProxyEncode ? encodeURIComponent(authTokenUrl) : authTokenUrl;
      authTokenUrl = `${options.tokenProxy}${suffix}`;
    }
    const response = await fetch(authTokenUrl, init);
    const { status } = response;
    if (status === 404) {
      throw new Error('Authorization URI is invalid. Received status 404.');
    }
    if (status >= 500) {
      throw new Error(`Authorization server error. Response code is: ${status}`)
    }
    let responseBody;
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = 'No response has been recorded';
    }
    if (!responseBody) {
      throw new Error('Code response body is empty.');
    }
    if (status >= 400 && status < 500) {
      throw new Error(`Client error: ${responseBody}`)
    }

    const mime = response.headers.get('content-type') || '';
    return this.processCodeResponse(responseBody, mime);
  }

  /**
   * Processes body of the code exchange to a map of key value pairs.
   */
  processCodeResponse(body: string, mime = ''): Record<string, any> {
    let tokenInfo: Record<string, any> = {};
    if (mime.includes('json')) {
      const info = JSON.parse(body);
      Object.keys(info).forEach((key) => {
        let name: string | undefined = key;
        if (name.includes('_') || name.includes('-')) {
          name = camel(name);
        }
        if (name) {
          tokenInfo[name] = info[key];
        }
      });
    } else {
      tokenInfo = {};
      const params = new URLSearchParams(body);
      params.forEach((value, key) => {
        let name: string | undefined = key;
        if (key.includes('_') || key.includes('-')) {
          name = camel(key);
        }
        if (name) {
          tokenInfo[name] = value;
        }
      });
    }
    return tokenInfo;
  }

  /**
   * @returns The token info when the request was a success.
   */
  mapCodeResponse(info: Record<string, any>): ITokenInfo {
    if (info.error) {
      throw new CodeError(info.errorDescription, info.error);
    }
    const expiresIn = Number(info.expiresIn);
    const scope = this[computeTokenInfoScopes](info.scope);
    const result: ITokenInfo = {
      ...(info as ITokenInfo),
      expiresIn,
      scope,
      expiresAt: 0,
      expiresAssumed: false,
    };
    return this[computeExpires](result);
  }

  /**
   * Exchanges the authorization code for authorization token.
   *
   * @param code Returned code from the authorization endpoint.
   * @returns The token info when the request was a success.
   */
  async exchangeCode(code: string): Promise<ITokenInfo> {
    const info = await this.getCodeInfo(code);
    return this.mapCodeResponse(info);
  }

  /**
   * Returns a body value for the code exchange request.
   * @param code Authorization code value returned by the authorization server.
   * @return Request body.
   */
  getCodeRequestBody(code: string): string {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('client_id', settings.clientId!);
    if (settings.redirectUri) {
      params.set('redirect_uri', settings.redirectUri);
    }
    params.set('code', code);
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    } else {
      params.set('client_secret', '');
    }
    if (settings.pkce) {
      params.set('code_verifier', this[codeVerifierValue]!);
    }
    return params.toString();
  }

  /**
   * A handler for the error that happened during code exchange.
   */
  [handleTokenCodeError](e: Error): void {
    if (e instanceof CodeError) {
      // @ts-ignore
      this[reportOAuthError](...this[createErrorParams](e.code, e.message));
    } else {
      this[reportOAuthError](`Couldn't connect to the server. ${e.message}`, 'request_error');
    }
  }

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return Promise resolved to a token info object.
   */
  async [authorizeClientCredentials](): Promise<void> {
    const { settings } = this;
    const { accessTokenUri, deliveryMethod = 'body', deliveryName = 'authorization' } = settings;
    const body = this.getClientCredentialsBody();
    let headers: Record<string, string> | undefined = undefined;
    const headerTransport = deliveryMethod === 'header';
    if (headerTransport) {
      headers = {
        [deliveryName]: this.getClientCredentialsHeader(settings),
      };
    }
    try {
      const info = await this.requestTokenInfo(accessTokenUri!, body, headers);
      const tokenInfo = this.mapCodeResponse(info);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause as Error);
    }
  }

  /**
   * Generates a payload message for client credentials.
   *
   * @return Message body as defined in OAuth2 spec.
   */
  getClientCredentialsBody(): string {
    const { settings } = this;
    const headerTransport = settings.deliveryMethod === 'header';
    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');
    if (!headerTransport && settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (!headerTransport && settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    return params.toString();
  }

  /**
   * Builds the authorization header for Client Credentials grant type.
   * According to the spec the authorization header for this grant type
   * is the Base64 of `clientId` + `:` + `clientSecret`.
   * 
   * @param settings The OAuth 2 settings to use
   */
  getClientCredentialsHeader(settings: IOAuth2Authorization): string {
    const { clientId = '', clientSecret = '' } = settings;
    const hash = btoa(`${clientId}:${clientSecret}`);
    return `Basic ${hash}`;
  }

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return Promise resolved to a token info object.
   */
  async [authorizePassword](): Promise<void> {
    const { settings } = this;
    const url = settings.accessTokenUri!;
    const body = this.getPasswordBody();
    try {
      const info = await this.requestTokenInfo(url, body);
      const tokenInfo = this.mapCodeResponse(info);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause as Error);
    }
  }

  /**
   * Generates a payload message for password authorization.
   *
   * @return Message body as defined in OAuth2 spec.
   */
  getPasswordBody(): string {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', 'password');
    params.set('username', settings.username || '');
    params.set('password', settings.password || '');
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    return params.toString();
  }

  /**
   * Performs authorization on custom grant type.
   * This extension is described in OAuth 2.0 spec.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return Promise resolved when the request finish.
   */
  async [authorizeCustomGrant](): Promise<void> {
    const { settings } = this;
    const url = settings.accessTokenUri!;
    const body = this.getCustomGrantBody();
    try {
      const info = await this.requestTokenInfo(url, body);
      const tokenInfo = this.mapCodeResponse(info);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause as Error);
    }
  }

  /**
   * Generates a payload message for the custom grant.
   *
   * @returns Message body as defined in OAuth2 spec.
   */
  getCustomGrantBody(): string {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', settings.grantType!);
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    if (settings.redirectUri) {
      params.set('redirect_uri', settings.redirectUri);
    }
    if (settings.username) {
      params.set('username', settings.username);
    }
    if (settings.password) {
      params.set('password', settings.password);
    }
    return params.toString();
  }

  /**
   * Requests a token for the `urn:ietf:params:oauth:grant-type:device_code` response type.
   *
   * @returns Promise resolved to a token info object.
   */
  async [authorizeDeviceCode](): Promise<void> {
    const { settings } = this;
    const url = settings.accessTokenUri!;
    const body = this.getDeviceCodeBody();
    try {
      const info = await this.requestTokenInfo(url, body);
      const tokenInfo = this.mapCodeResponse(info);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause as Error);
    }
  }

  /**
   * Generates a payload message for the `urn:ietf:params:oauth:grant-type:device_code` authorization.
   *
   * @returns Message body as defined in OAuth2 spec.
   */
  getDeviceCodeBody(): string {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', KnownGrants.deviceCode);
    params.set('device_code', settings.deviceCode || '');
    if (settings.clientId) {
      params.set('client_id', settings.clientId);
    }
    if (settings.clientSecret) {
      params.set('client_secret', settings.clientSecret);
    }
    return params.toString();
  }

  /**
   * Requests a token for the `urn:ietf:params:oauth:grant-type:jwt-bearer` response type.
   *
   * @return Promise resolved to a token info object.
   */
  async [authorizeJwt](): Promise<void> {
    const { settings } = this;
    const url = settings.accessTokenUri!;
    const body = this.getJwtBody();
    try {
      const info = await this.requestTokenInfo(url, body);
      const tokenInfo = this.mapCodeResponse(info);
      this[handleTokenInfo](tokenInfo);
    } catch (cause) {
      this[handleTokenCodeError](cause as Error);
    }
  }

  /**
   * Generates a payload message for the `urn:ietf:params:oauth:grant-type:jwt-bearer` authorization.
   *
   * @return {string} Message body as defined in OAuth2 spec.
   */
  getJwtBody(): string {
    const { settings } = this;
    const params = new URLSearchParams();
    params.set('grant_type', KnownGrants.jwtBearer);
    params.set('assertion', settings.assertion || '');
    if (Array.isArray(settings.scopes) && settings.scopes.length) {
      params.set('scope', settings.scopes.join(' '));
    }
    return params.toString();
  }
}
