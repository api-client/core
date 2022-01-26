import { Headers } from '../../lib/headers/Headers.js';
import { ExecutionResponse } from './ExecutionResponse.js';
import applyCachedBasicAuthData, { applyRequestBasicAuthData } from './BasicAuthCache.js';
import { IHttpRequest } from '../../models/HttpRequest.js';
import { IBearerAuthorization, IBasicAuthorization, IOidcAuthorization, IOAuth2Authorization, ICCAuthorization } from '../../models/Authorization.js';
import { ExecutionContext } from './ModulesRegistry.js';

/**
 * Injects client certificate object into the request object
 */
async function processClientCertificate(config: ICCAuthorization, context: ExecutionContext): Promise<void> {
  const { id } = config;
  if (!id || !context.Events) {
    return;
  }
  const result = await context.Events.ClientCertificate.read(context.eventsTarget, id);
  if (!result) {
    return;
  }
  if (!Array.isArray(context.certificates)) {
    context.certificates = [];
  }
  context.certificates.push(result);
}

/**
 * Injects basic auth header into the request headers.
 */
function processBasicAuth(request: IHttpRequest, config: IBasicAuthorization): void {
  const { username } = config;
  if (!username) {
    return;
  }
  applyRequestBasicAuthData(request, config);
}

/**
 * Injects oauth 2 auth header into the request headers.
 */
function processOAuth2(request: IHttpRequest, config: IOAuth2Authorization): void {
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
function processOpenId(request: IHttpRequest, config: IOidcAuthorization): void {
  const { accessToken } = config;
  if (accessToken) {
    processOAuth2(request, config);
  }
  // todo - if AT is missing find the current token from the tokens list in the passed configuration.
  // Currently the authorization method UI sets the token when the requests is generated so it's not as much important.
}

/**
 * Injects bearer auth header into the request headers.
 */
function processBearer(request: IHttpRequest, config: IBearerAuthorization): void {
  const { token } = config;
  const value = `Bearer ${token}`;
  const headers = new Headers(request.headers || '');
  headers.append('authorization', value);
  request.headers = headers.toString();
}

/**
 * Processes authorization data from the authorization configuration and injects data into the request object when necessary.
 */
export default async function processAuth(request: IHttpRequest, context: ExecutionContext): Promise<number> {
  if (!Array.isArray(context.authorization) || !context.authorization.length) {
    return ExecutionResponse.OK;
  }
  for (const auth of context.authorization) {
    if (!auth.enabled || !auth.config) {
      continue;
    }
    switch (auth.type) {
      case 'client certificate': await processClientCertificate(auth.config as ICCAuthorization, context); break;
      case 'basic': processBasicAuth(request, auth.config as IBasicAuthorization); break;
      case 'oauth 2': processOAuth2(request, auth.config as IOAuth2Authorization); break;
      case 'open id': processOpenId(request, auth.config as IOidcAuthorization); break;
      case 'bearer': processBearer(request, auth.config as IBearerAuthorization); break;
      default:
    }
  }
  if (request.url && !/^authorization:\s?.+$/gim.test(request.headers || '')) {
    // Try to apply basic auth from the cached during this session values.
    applyCachedBasicAuthData(request, context);
  }
  return ExecutionResponse.OK;
}
