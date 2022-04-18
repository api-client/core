import { IOAuth2Authorization } from "../models/Authorization.js";

/**
 * Checks if the URL has valid scheme for OAuth flow.
 * 
 * Do not use this to validate redirect URIs as they can use any protocol.
 *
 * @param url The url value to test
 * @throws {TypeError} When passed value is not set, empty, or not a string
 * @throws {Error} When passed value is not a valid URL for OAuth 2 flow
 */
 export function checkUrl(url: string): void {
  if (!url) {
    throw new TypeError("the value is missing");
  }
  if (typeof url !== "string") {
    throw new TypeError("the value is not a string");
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("the value has invalid scheme");
  }
}

/**
 * Checks if basic configuration of the OAuth 2 request is valid an can proceed
 * with authentication.
 * @param settings authorization settings
 * @throws {Error} When settings are not valid
 */
export function sanityCheck(settings: IOAuth2Authorization): void {
  if (["implicit", "authorization_code"].includes(settings.grantType!)) {
    try {
      checkUrl(settings.authorizationUri!);
    } catch (e) {
      throw new Error(`authorizationUri: ${(e as Error).message}`);
    }
    if (settings.accessTokenUri) {
      try {
        checkUrl(settings.accessTokenUri);
      } catch (e) {
        throw new Error(`accessTokenUri: ${(e as Error).message}`);
      }
    }
  } else if (settings.accessTokenUri) {
    try {
      checkUrl(settings.accessTokenUri);
    } catch (e) {
      throw new Error(`accessTokenUri: ${(e as Error).message}`);
    }
  }
}

/**
 * Generates a random string of characters.
 *
 * @returns A random string.
 */
export function randomString(): string {
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => `0${dec.toString(16)}`.substr(-2)).join("");
}

/**
 * Replaces `-` or `_` with camel case.
 * @param {string} name The string to process
 * @return {String|undefined} Camel cased string or `undefined` if not transformed.
 */
export function camel(name: string): string | undefined {
  let i = 0;
  let l;
  let changed = false;
  // eslint-disable-next-line no-cond-assign
  while ((l = name[i])) {
    if ((l === "_" || l === "-") && i + 1 < name.length) {
      // eslint-disable-next-line no-param-reassign
      name = name.substr(0, i) + name[i + 1].toUpperCase() + name.substr(i + 2);
      changed = true;
    }
    // eslint-disable-next-line no-plusplus
    i++;
  }
  return changed ? name : undefined;
}

/**
 * Computes the SHA256 hash ogf the given input.
 * @param value The value to encode.
 */
export async function sha256(value: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return window.crypto.subtle.digest("SHA-256", data);
}

/**
 * Encoded the array buffer to a base64 string value.
 */
export function base64Buffer(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  const str = String.fromCharCode.apply(null, view as any);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates code challenge for the PKCE extension to the OAuth2 specification.
 * @param verifier The generated code verifier.
 * @returns The code challenge string
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64Buffer(hashed);
}

/**
 * Generates cryptographically significant random string.
 * @param size The size of the generated nonce.
 * @returns A nonce (number used once).
 */
export function nonceGenerator(size = 20): string {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let array = new Uint8Array(size);
  window.crypto.getRandomValues(array);
  array = array.map(x => validChars.charCodeAt(x % validChars.length));
  return String.fromCharCode.apply(null, array as any);
}
