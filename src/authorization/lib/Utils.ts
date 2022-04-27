/**
 * Normalizes type name to a string identifier.
 * It casts input to a string and lowercase it.
 * @param type Type value
 * @return Normalized value.
 */
export const normalizeType = (type?: string): string => String(type).toLowerCase();

export const METHOD_BASIC = "basic";
export const METHOD_BEARER = "bearer";
export const METHOD_NTLM = "ntlm";
export const METHOD_DIGEST = "digest";
export const METHOD_OAUTH2 = "oauth 2";
export const METHOD_OIDC = "open id";
export const METHOD_CC = 'client certificate';
export const CUSTOM_CREDENTIALS = "Custom credentials";

/**
 * @param value The value to validate
 * @returns True if the redirect URI can be considered valid.
 */
export function validateRedirectUri(value: unknown): boolean {
  let result = true;
  if (!value || typeof value !== 'string') {
    result = false;
  }
  // the redirect URI can have any value, especially for installed apps which 
  // may use custom schemes. We do very basic sanity check for any script content 
  // validation to make sure we are not passing any script.
  if (result && String(value).startsWith('javascript:')) {
    result = false;
  }
  return result;
}

/**
 * Generates client nonce for Digest authorization.
 *
 * @return Generated client nonce.
 */
export function generateCnonce(): string {
  const characters = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    const randNum = Math.round(Math.random() * characters.length);
    token += characters.substring(randNum, 1);
  }
  return token;
}

/**
 * Generates `state` parameter for the OAuth2 call.
 *
 * @return Generated state string.
 */
export function generateState(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * When defined and the `url` is a relative path staring with `/` then it
 * adds base URI to the path and returns concatenated value.
 *
 * @param url The URL to process
 * @param baseUri Base URI to use.
 * @returns Final URL value.
 */
export function readUrlValue(url?: string, baseUri?: string): string {
  if (!url) {
    return '';
  }
  const result = String(url);
  if (!baseUri) {
    return result;
  }
  if (result[0] === '/') {
    let uri = baseUri;
    if (uri[uri.length - 1] === '/') {
      uri = uri.substring(0, uri.length - 1);
    }
    return `${uri}${result}`;
  }
  return result;
}
