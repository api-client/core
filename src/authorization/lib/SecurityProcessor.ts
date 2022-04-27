import { IBasicAuthorization, IBearerAuthorization, IOAuth2Authorization, IOidcAuthorization, IOidcTokenInfo } from "../../models/Authorization.js";
import { IRequestAuthorization, RequestAuthorization } from "../../models/RequestAuthorization.js";
import { IHttpRequest } from "../../models/HttpRequest.js";
import { Headers } from '../../lib/headers/Headers.js';
import { UrlProcessor } from "../../lib/parsers/UrlProcessor.js";
import { UrlEncoder } from "../../lib/parsers/UrlEncoder.js";
import { hasBuffer } from '../../Platform.js';
import {
  normalizeType,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_OAUTH2,
  METHOD_OIDC,
} from "./Utils.js";

export interface IAuthApplyOptions {
  /**
   * When set it won't change the originating authorization objects.
   * By default it sets the authorization's `enabled` property to `false` after applying the 
   * value to the request.
   */
  immutable?: boolean;
}

export class SecurityProcessor {
  /**
   * Applies authorization configuration to the request object.
   */
  static applyAuthorization(request: IHttpRequest, authorization: (IRequestAuthorization | RequestAuthorization)[], opts: IAuthApplyOptions = {}): void {
    if (!Array.isArray(authorization) || !authorization.length) {
      return;
    }

    for (const auth of authorization) {
      if (!auth.enabled || !auth.config) {
        continue;
      }

      switch (normalizeType(auth.type)) {
        case METHOD_BASIC:
          SecurityProcessor.applyBasicAuth(request, auth.config as IBasicAuthorization);
          if (!opts.immutable) {
            auth.enabled = false;
          }
          break;
        case METHOD_OAUTH2:
          SecurityProcessor.applyOAuth2(request, auth.config as IOAuth2Authorization);
          if (!opts.immutable) {
            auth.enabled = false;
          }
          break;
        case METHOD_OIDC:
          SecurityProcessor.applyOpenId(request, auth.config as IOidcAuthorization);
          if (!opts.immutable) {
            auth.enabled = false;
          }
          break;
        case METHOD_BEARER:
          SecurityProcessor.applyBearer(request, auth.config as IBearerAuthorization);
          if (!opts.immutable) {
            auth.enabled = false;
          }
          break;
        default:
      }
    }
  }

  /**
   * Injects basic auth header into the request headers.
   */
  static applyBasicAuth(request: IHttpRequest, config: IBasicAuthorization): void {
    const { username, password } = config;
    if (!username) {
      return;
    }
    const hash = `${username}:${password || ''}`;
    const value = hasBuffer ? Buffer.from(hash).toString('base64') : btoa(hash);

    const headers = new Headers(request.headers || '');
    headers.append('authorization', `Basic ${value}`);
    request.headers = headers.toString();
  }

  /**
   * Injects oauth 2 auth header into the request headers.
   */
  static applyOAuth2(request: IHttpRequest, config: IOAuth2Authorization): void {
    const { accessToken, tokenType = 'Bearer', deliveryMethod = 'header', deliveryName = 'authorization' } = config;
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
        const parser = new UrlProcessor(url);
        parser.search.append(UrlEncoder.encodeQueryString(deliveryName, true), UrlEncoder.encodeQueryString(value, true));
        request.url = parser.toString();
      } catch (e) {
        // ...
      }
    }
  }

  /**
   * Injects OpenID Connect auth header into the request headers.
   */
  static applyOpenId(request: IHttpRequest, config: IOidcAuthorization): void {
    const { accessToken, tokens, tokenInUse } = config;
    if (accessToken) {
      SecurityProcessor.applyOAuth2(request, config);
    } else if (Array.isArray(tokens) && typeof tokenInUse === 'number') {
      const data = tokens[tokenInUse] as IOidcTokenInfo;
      if (data && data.accessToken) {
        const copy = { ...config };
        copy.accessToken = data.accessToken;
        SecurityProcessor.applyOAuth2(request, copy);
      }
    }
  }

  /**
   * Injects bearer auth header into the request headers.
   */
  static applyBearer(request: IHttpRequest, config: IBearerAuthorization): void {
    const { token } = config;
    if (!token) {
      return;
    }
    const value = `Bearer ${token}`;

    const headers = new Headers(request.headers || '');
    headers.append('authorization', value);
    request.headers = headers.toString();
  }
}
