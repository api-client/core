/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/**
 * User can export single request in ARC. In this case the app opens new tab
 * rather actually imports the data. This function tests if this is the case.
 * @param data Normalized import data
 */
export function isSingleRequest(data: any): boolean {
  if (!data.requests || !data.requests.length) {
    return false;
  }
  if (data.requests.length !== 1) {
    return false;
  }
  if (data.projects && data.projects.length === 0) {
    delete data.projects;
  }
  if (data.history && data.history.length === 0) {
    delete data.history;
  }
  if (Object.keys(data).length === 4) {
    return true;
  }
  return false;
}

/**
 * First export / import system had single request data only. This function checks if given
 * file is from this ancient system.
 *
 * @param object Decoded JSON data.
 */
export function isOldImport(object: any): boolean {
  if (!(object.projects || object.requests || object.history)) {
    if ('headers' in object && 'url' in object && 'method' in object) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the passed argument is an Object.
 *
 * @param object A value to test.
 */
export function isObject(object: any): boolean {
  return (
    object !== null &&
    typeof object === 'object' &&
    Object.prototype.toString.call(object) === '[object Object]'
  );
}

/**
 * Tests if data is a Postman file data
 * @param data Parsed file.
 */
export function isPostman(data: any): boolean {
  if (data.version && data.collections) {
    return true;
  }
  if (data.info && data.info.schema) {
    return true;
  }
  if (data.folders && data.requests) {
    return true;
  }
  if (data._postman_variable_scope) {
    return true;
  }
  return false;
}

/**
 * Checks if passed `object` is the ARC export data.
 *
 * @param object A parsed JSON data.
 * @return true if the passed object is an ARC file.
 */
export function isArcFile(object: any): boolean {
  if (!object || !isObject(object)) {
    return false;
  }
  if (object.kind) {
    if (object.kind.indexOf('ARC#') === 0) {
      return true;
    }
  }
  // Old export system does not have kind property.
  // Have to check if it has required properties.
  const arcEntries = [
    'projects',
    'requests',
    'history',
    'url-history',
    'websocket-url-history',
    'variables',
    'headers-sets',
    'auth-data',
    'cookies',
  ];
  for (let i = 0, len = arcEntries.length; i < len; i++) {
    if (arcEntries[i] in object) {
      return true;
    }
  }
  if (isOldImport(object)) {
    return true;
  }
  return false;
}

/**
 * Parses file data with JSON parser and throws an error if not a JSON.
 * If the passed `data` is JS object it does nothing.
 *
 * @param {string|object} data File content
 * @return {object} Parsed data.
 */
export function prepareImportObject(data: any): any {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      const err = e as Error;
      throw new Error(`Unable to read the file. Not a JSON: ${err.message}`);
    }
  }
  return data;
}

/**
 * Returns a promise resolved after a timeout.
 * @param timeout A timeout to wait.
 */
export async function aTimeout(timeout=0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
