export interface IBasicAuthorization {
  /**
   * User name value.
   */
  username?: string;
  /**
   * User password value.
   */
  password?: string;
}

export interface IBearerAuthorization {
  /**
   * Bearer token value
   */
  token: string;
}

export interface INtlmAuthorization {
  /**
   * User name value.
   */
  username?: string;
  /**
   * User password value.
   */
  password?: string;
  /**
   * Authorization domain
   */
  domain: string;
}

export interface IDigestAuthorization {
  username?: string;
  password?: string;
  realm: string;
  nonce: string;
  uri: string;
  qop: string;
  opaque: string;
  response: string;
  nc: string | number;
  cnonce: string;
  algorithm: string;
}

export interface IOAuth1Authorization {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
  timestamp: string | number;
  nonce: string;
  realm: string;
  signatureMethod: string;
  requestTokenUri: string;
  accessTokenUri: string;
  redirectUri: string;
  authParamsLocation: string;
  authTokenMethod: string;
  authorizationUri: string;
  type: string;
}

/**
 * Client Certificate Authorization
 */
export interface ICCAuthorization {
  /**
   * The ID of the certificate to use.
   * Because the certificates are stored by the application 
   * this configuration only returns an ID of the certificate 
   * to use when making the request.
   */
  id: string;
}

export declare interface IOAuth2CustomParameter {
  /**
   * The name of the parameter
   */
  name: string;
  /**
   * The value of the parameter. It is ALWAYS a string.
   */
  value: string;
}

export interface IOAuth2TokenRequestCustomData {
  /**
   * The query parameters to use with the token request
   */
  parameters?: IOAuth2CustomParameter[];
  /**
   * The headers to use with the token request
   */
  headers?: IOAuth2CustomParameter[];
  /**
   * The body parameters to use with the token request.
   * This is x-www-urlencoded parameters to be added to the message.
   */
  body?: IOAuth2CustomParameter[];
}

export interface IOAuth2AuthorizationRequestCustomData {
  /**
   * The query parameters to add to the authorization URI
   */
  parameters?: IOAuth2CustomParameter[];
}

export interface IOAuth2CustomData {
  /**
   * The custom data to set on the authorization URI when opening the auth popup.
   */
  auth?: IOAuth2AuthorizationRequestCustomData;
  /**
   * The custom data to be set on the token request.
   */
  token?: IOAuth2TokenRequestCustomData;
}

declare interface IBaseOAuth2Authorization {
  /**
   * OAuth flow with `interactive` option set to `false` allows to quietly request for the token from the cache or form the authorization server
   * without notifying the user (without bringing the authorization pop-up).
   *
   * This is to be used to check if valid session exists for current user and update the UI accordingly.
   */
  interactive?: boolean;
  /**
   * List of scopes to be used with the token request.
   * This parameter is not required per OAuth2 spec.
   */
  scopes?: string[];
}

/**
 * OAuth 2 configuration object used in Advanced REST Client and API Components.
 */
export interface IOAuth2Authorization extends IBaseOAuth2Authorization {
  /**
   * The grant type of the OAuth 2 flow.
   *
   * Can be:
   * - implicit - deprecated and legacy
   * - authorization_code
   * - password - deprecated and legacy
   * - client_credentials
   * - refresh_token
   * - any custom grant supported by the authorization server
   */
  grantType?: 'implicit' | 'authorization_code' | 'password' | 'client_credentials' | 'refresh_token' | string;
  /**
   * Optional value to set on the `response_type` parameter.
   */
  responseType?: string;
  /**
   * The client ID registered in the OAuth2 provider.
   */
  clientId?: string;
  /**
   * The client ID registered in the OAuth2 provider.
   * This value is not required for select grant types.
   */
  clientSecret?: string;
  /**
   * The user authorization URI as defined by the authorization server.
   * This is required for the `implicit` and `authorization_code` grant types
   */
  authorizationUri?: string;
  /**
   * The token request URI as defined by the authorization server.
   * This is not required for the `implicit` grant type
   */
  accessTokenUri?: string;
  /**
   * The user redirect URI as configured in the authorization server.
   * This is required for the `implicit` and `authorization_code` grant types.
   */
  redirectUri?: string;
  /**
   * Required for the `password` grant type
   */
  username?: string;
  /**
   * Required for the `password` grant type
   */
  password?: string;
  /**
   * The state parameter as defined in the OAuth2 spec.
   * The state is returned back with the token response.
   */
  state?: string;
  /**
   * Additional data defined outside the scope of the OAuth2 protocol to be set
   * on both authorization and token requests.
   */
  customData?: IOAuth2CustomData;
  /**
   * This is not a standard OAuth 2 parameter.
   * Used by Google's oauth 2 server to include already granted to this app
   * scopes to the list of this scopes.
   */
  includeGrantedScopes?: boolean;
  /**
   * This is not a standard OAuth 2 parameter.
   * Used by Google's oauth 2 server. It's the user email, when known.
   */
  loginHint?: string;
  /**
   * When set the `authorization_code` will use the PKCE extension of the OAuth2 
   * to perform the authorization. Default to `false`.
   * This is only relevant when the `authorization_code` grant type is used.
   */
  pkce?: boolean;
  /**
   * The access token type. Default to `Bearer`
   */
  tokenType?: string;
  /**
   * The last access token received from the authorization server. 
   * This is optional and indicates that the token has been already received.
   * This property should not be stored anywhere.
   */
  accessToken?: string;
  /**
   * Informs about what filed of the authenticated request the token property should be set.
   * By default the value is `header` which corresponds to the `authorization` by default,
   * but it is configured by the `deliveryName` property.
   * 
   * This can be used by the AMF model when the API spec defines where the access token should be
   * put in the authenticated request.
   * 
   * @default header
   */
  deliveryMethod?: OAuth2DeliveryMethod;

  /**
   * The name of the authenticated request property that carries the token.
   * By default it is `authorization` which corresponds to `header` value of the `deliveryMethod` property.
   * 
   * By setting both `deliveryMethod` and `deliveryName` you instruct the application (assuming it reads this values)
   * where to put the authorization token.
   * 
   * @default authorization
   */
  deliveryName?: string;
  /** 
   * The assertion parameter for the JWT token authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
   */
  assertion?: string;
  /** 
   * The device_code parameter for the device code authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
   */
  deviceCode?: string;
}

export type OAuth2DeliveryMethod = 'header' | 'query' | 'body';

/**
 * Options for removing the OAuth 2 token from the cache.
 */
export interface ITokenRemoveOptions {
  /**
   * The client id used to issue the token.
   */
  clientId: string;
  /**
   * The authorization URI used to issue the token.
   * For the request that do not have `authorizationUrl` a value for
   * `accessTokenUri` should be used.
   */
  authorizationUri: string;
}

declare interface ITokenBase {
  /**
   * Whether the token request was marked as interactive.
   */
  interactive?: boolean;
  /**
   * The request state parameter, if used with the request.
   */
  state: string;
}

/**
 * OAuth 2 token response object.
 */
export interface ITokenInfo extends ITokenBase {
  /**
   * The access token.
   */
  accessToken: string;
  /**
   * The access token type.
   */
  tokenType?: string;
  /**
   * Access token expiration timeout.
   */
  expiresIn: number;
  /**
   * Access token expiration timestamp
   */
  expiresAt: number;
  /**
   * When `true` the `expires_in` and `expires_at` are assumed values (1 hour).
   */
  expiresAssumed?: boolean;
  /**
   * The list of scopes the token has been granted
   */
  scope?: string[];
  /**
   * The refresh token, when requested
   */
  refreshToken?: string;
}

interface IOidcToken {
  /**
   * The response type of the token.
   */
  responseType: string;
  /**
   * The state passed by the authorization server,
   */
  state: string;
}

export interface IOidcTokenInfo extends IOidcToken {
  /**
   * The timestamp when the token response was read.
   * With the combination with `expiresIn` this tells when the token 
   * expires +- few seconds (depending onm the network).
   */
  time: number;
  /**
   * The received access token.
   */
  accessToken?: string;
  /**
   * The received refresh token.
   */
  refreshToken?: string;
  /**
   * The received ID token.
   */
  idToken?: string;
  /**
   * The received from the authorization server code.
   * The code has no use as it probably was exchanged for the token,
   * which invalidates the code.
   */
  code?: string;
  /**
   * The received from the authorization server token type
   */
  tokenType?: string;
  /**
   * The received from the authorization server expires_in parameter.
   */
  expiresIn?: number;
  /**
   * The received from the authorization server scope parameter processed to an array.
   */
  scope?: string[];
}

export interface IOidcTokenError extends IOidcToken {
  /**
   * Whether the token has error when processing it. This is the error message to render to the user.
   */
  errorDescription?: string;
  /**
   * Whether the token has error when processing it. This is the error code received from the server.
   */
  error?: string;
}

export interface IOauth2GrantType {
  type: string;
  label: string;
}

export interface IOauth2ResponseType {
  type: string;
  label: string;
}

/**
 * OpenID Connect configuration object used in Advanced REST Client and API Components.
 */
export interface IOidcAuthorization extends IOAuth2Authorization {
  /**
   * The URL of the issuer for discovery.
   */
  issuerUri?: string;
  /**
   * The list of mist recent tokens requested from the auth server.
   */
  tokens?: (IOidcTokenInfo | IOidcTokenError)[];
  /**
   * The array index of the token to be used with HTTP request.
   */
  tokenInUse?: number;
  /**
   * The list of response types supported by the authorization server.
   * Optional, used to restore state.
   */
  supportedResponses?: IOauth2ResponseType[][];
  /**
   * The list of grant types supported by the authorization server.
   * Optional, used to restore state.
   */
  grantTypes?: IOauth2GrantType[];
  /**
   * The list of scopes supported by the authorization server.
   * Optional, used to restore state.
   */
  serverScopes?: string[];
}

/**
 * Token response object.
 */
export interface ITokenError {
  /**
   * The error message
   */
  message: string;
  /**
   * One of the application error codes.
   */
  code: string;
}

export interface IAuthorizationParams {
  header?: Record<string, string>;
  query?: Record<string, string>;
  path?: Record<string, string>;
  cookie?: Record<string, string>;
}

/**
 * Authorization configuration for OAS' APiKey
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IApiKeyAuthorization extends IAuthorizationParams {
}

/**
 * Authorization configuration for the PassThrough authorization
 */
export interface IPassThroughAuthorization {
  /**
   * List of headers to apply to the request
   */
  header?: Record<string, string>;
  /**
   * List of query parameters to apply to the request
   */
  query?: Record<string, string>;
}

/**
 * Authorization configuration for RAML's custom scheme
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IRamlCustomAuthorization extends IPassThroughAuthorization {
}

export type IAuthorizationSettingsUnion = IBasicAuthorization | IBearerAuthorization | INtlmAuthorization | IDigestAuthorization | IOAuth1Authorization | IOAuth2Authorization | ICCAuthorization | IApiKeyAuthorization | IPassThroughAuthorization | IRamlCustomAuthorization | IOidcAuthorization;
export type AuthorizationType = 'basic' | 'bearer' | 'ntlm' | 'digest' | 'oauth 1' | 'oauth 2' | 'client certificate' | 'api key' | 'pass through' | 'raml custom' | 'open id';
