import { IHttpRequest } from '../../models/HttpRequest.js';
import { IRequestAuthorization } from '../../models/RequestAuthorization.js';
import { IBearerAuthorization, IBasicAuthorization, IOidcAuthorization, IOAuth2Authorization, ICCAuthorization } from '../../models/Authorization.js';
import { HttpCertificate } from '../../models/ClientCertificate.js';
import { Headers } from '../../lib/headers/Headers.js';

/**
 * Applies authorization data to the HttpRequest from 
 * request authorization configuration.
 */
export class RequestAuthorizationProcessor {

  /**
   * Applies the auth data from the authorization config.
   * 
   * Note, this mutates the original request. Make a copy of you don't want to change 
   * the values in the source request.
   * 
   * Note, this does not process client certificates. Use the `#readCertificates()` method to 
   * get a certificate to use with the HTTP request,
   * 
   * @param request The request to apply the authorization to.
   * @returns The same request (a reference)
   */
  static setAuthorization(request: IHttpRequest, authorization?: IRequestAuthorization[]): IHttpRequest {
    if (!Array.isArray(authorization) || !authorization.length) {
      return request;
    }

    for (const auth of authorization) {
      if (auth.enabled === false || !auth.config) {
        continue;
      }
      switch (auth.type) {
        case 'basic': this.processBasicAuth(request, auth.config as IBasicAuthorization); break;
        case 'oauth 2': this.processOAuth2(request, auth.config as IOAuth2Authorization); break;
        case 'open id': this.processOpenId(request, auth.config as IOidcAuthorization); break;
        case 'bearer': this.processBearer(request, auth.config as IBearerAuthorization); break;
        default:
      }
    }
    return request;
  }

  /**
   * Reads the client certificate from the authorization configuration.
   * 
   * @param authorization The HTTP request authorization configuration.
   * @returns The certificate to use with the HTTP request or undefined when not configured.
   */
  static readCertificate(authorization?: IRequestAuthorization[]): HttpCertificate | undefined {
    if (!Array.isArray(authorization) || !authorization.length) {
      return undefined;
    }
    const item = authorization.find(i => i.enabled !== false && i.type === 'client certificate');
    if (!item || !item.config) {
      return undefined;
    }
    const init = item.config as ICCAuthorization;
    return init.certificate;
  }

  /**
   * Injects basic auth header into the request headers.
   */
  protected static processBasicAuth(request: IHttpRequest, config: IBasicAuthorization): void {
    const { username } = config;
    if (!username) {
      return;
    }
    this.applyRequestBasicAuthData(request, config);
  }

  /**
   * Injects oauth 2 auth header into the request headers.
   */
  protected static processOAuth2(request: IHttpRequest, config: IOAuth2Authorization): void {
    const { accessToken, tokenType='Bearer', deliveryMethod='header', deliveryName='authorization' } = config;
    if (!accessToken) {
      return;
    }
    const value = `${tokenType} ${accessToken}`;
    if (deliveryMethod === 'header') {
      const headers = new Headers(request.headers || '');
      headers.append(deliveryName, value);
      request.headers = headers.toString();
    } else if (deliveryMethod === 'query') {
      const { url } = request;
      try {
        const parsed = new URL(url);
        parsed.searchParams.append(deliveryName, value);
        request.url = parsed.toString();
      } catch (e) {
        // ...
      }
    }
  }

  /**
   * Injects OpenID Connect auth header into the request headers.
   */
  protected static processOpenId(request: IHttpRequest, config: IOidcAuthorization): void {
    const { accessToken } = config;
    if (accessToken) {
      this.processOAuth2(request, config);
    }
    // todo - if AT is missing find the current token from the tokens list in the passed configuration.
    // Currently the authorization method UI sets the token when the requests is generated so it's not as much important.
  }

  /**
   * Injects bearer auth header into the request headers.
   */
  protected static processBearer(request: IHttpRequest, config: IBearerAuthorization): void {
    const { token } = config;
    const value = `Bearer ${token}`;
    const headers = new Headers(request.headers || '');
    headers.append('authorization', value);
    request.headers = headers.toString();
  }

  /**
   * Applies the basic authorization data to the request.
   *
   * If the header value have changed then it fires `request-headers-changed` custom event.
   * It sets computed value of the readers to the event's detail object.
   *
   * @param request The event's detail object. Changes made here will be propagated to the event.
   * @param data The authorization data to apply.
   */
  protected static applyRequestBasicAuthData(request: IHttpRequest, data: IBasicAuthorization): void {
    const { username='', password='' } = data;
    const headers = new Headers(request.headers || '');
    let hash: string;
    const decoded = `${username}:${password}`;
    if (typeof Buffer === 'function' && typeof Buffer.from === 'function') {
      hash = Buffer.from(decoded).toString('base64');
    } else {
      hash = btoa(decoded);
    }
    headers.set('authorization', `Basic ${hash}`);
    request.headers = headers.toString();
  }
}
