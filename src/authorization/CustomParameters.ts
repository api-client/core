import { IOAuth2AuthorizationRequestCustomData, IOAuth2CustomData } from "../models/Authorization.js";

/**
 * Applies custom properties defined in the OAuth settings object to the URL.
 *
 * @param url The instance of the URL class to use
 * @param data `customData.[type]` property from the settings object. The type is either `auth` or `token`.
 */
export function applyCustomSettingsQuery(url: URL, data: IOAuth2AuthorizationRequestCustomData): void {
  if (!data || !data.parameters) {
    return;
  }
  data.parameters.forEach((item) => {
    const { name, value='' } = item;
    if (!name) {
      return;
    }
    url.searchParams.set(name, value);
  });
}

/**
 * Applies custom body properties from the settings to the body value.
 *
 * @param body Already computed body for OAuth request. Custom properties are appended at the end of OAuth string.
 * @param data Value of settings' `customData` property
 * @returns Request body
 */
export function applyCustomSettingsBody(body: string, data: IOAuth2CustomData): string {
  if (!data || !data.token || !data.token.body) {
    return body;
  }
  const params = data.token.body.map((item) => {
    let { value } = item;
    if (value) {
      value = encodeURIComponent(value);
    } else {
      value = '';
    }
    return `${encodeURIComponent(item.name)}=${value}`;
  }).join('&');
  return `${body}&${params}`;
}

/**
 * Applies custom headers from the settings object
 *
 * @param headers A regular JS map with headers definition
 * @param data Value of settings' `customData` property
 * @returns The copy of the headers object, if it was altered. Otherwise the same object.
 */
export function applyCustomSettingsHeaders(headers: Record<string, string>, data: IOAuth2CustomData): Record<string, string> {
  if (!data || !data.token || !data.token.headers) {
    return headers;
  }
  const copy = { ...headers };
  data.token.headers.forEach((item) => {
    copy[item.name] = item.value;
  });
  return copy;
}
