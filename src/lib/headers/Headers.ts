import http from 'http';

/* eslint-disable no-unused-vars */
interface RawValue {
  name: string;
  value: string;
}

/**
 * Normalizes name of a header.
 * 
 * @param name
 * @return Normalized name
 */
function normalizeName(name: string): string {
  if (typeof name !== 'string') {
    name = String(name);
  }
  return name.toLowerCase();
}

/**
 * Normalizes value of a header.
 * @param value
 * @return Normalized name
 */
function normalizeValue(value: string): string {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value;
}

/**
 * A generator for list of headers from a string.
 *
 * ```javascript
 * for (let [name, value] of headersStringToList('a:b')) {
 *  ...
 * }
 * ```
 * @param string Headers string to parse
 */
function* headersStringToList(string: string): Generator<string[]> {
  if (!string || string.trim() === '') {
    return [];
  }
  const headers = string.split(/\n(?=[^ \t]+)/gim);
  for (let i = 0, len = headers.length; i < len; i++) {
    const line = headers[i].trim();
    if (line === '') {
      continue;
    }
    const sepPosition = line.indexOf(':');
    if (sepPosition === -1) {
      yield [line, ''];
    } else {
      const name = line.substring(0, sepPosition);
      const value = line.substring(sepPosition + 1).trim();
      yield [name, value];
    }
  }
}

/**
 * The same interface as Web platform's Headers but without 
 * CORS restrictions.
 */
export class Headers {
  /**
   * The keys are canonical keys and the values are the input values.
   */
  _map: Record<string, RawValue> = {};

  /**
   * @param headers The headers to parse.
   */
  constructor(headers?: string | Record<string, string> | Headers | http.IncomingHttpHeaders) {
    if (headers instanceof Headers) {
      headers.forEach((value, name) => this.append(name, value));
    } else if (typeof headers === 'string') {
      const iterator = headersStringToList(headers);
      let result = iterator.next();
      while (!result.done) {
        this.append(result.value[0], result.value[1]);
        result = iterator.next();
      }
    } else if (headers) {
      Object.keys(headers).forEach((name) => this.append(name, headers[name]));
    }
  }

  /**
   * Adds value to existing header or creates new header
   */
  append(name: string, value: string | string[] | undefined): void {
    if (Array.isArray(value)) {
      value.forEach(v => this.append(name, v));
      return;
    }
    const normalizedName = normalizeName(name);
    value = value ? normalizeValue(value) : '';
    let item = this._map[normalizedName];
    if (item) {
      const oldValue = item.value;
      item.value = oldValue ? `${oldValue},${value}` : value;
    } else {
      item = {
        name,
        value,
      };
    }
    this._map[normalizedName] = item;
  }

  /**
   * Removes a header from the list of headers.
   * @param name The header name
   */
  delete(name: string): void {
    delete this._map[normalizeName(name)];
  }

  /**
   * Returns the current value of the header
   * @param name Header name
   */
  get(name: string): string | undefined {
    name = normalizeName(name);
    return this.has(name) ? this._map[name].value : undefined;
  }

  /**
   * Checks if the header exists.
   */
  has(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this._map, normalizeName(name));
  }

  /**
   * Creates a new header. If the header exist it replaces the value.
   */
  set(name: string, value: string): void {
    const normalizedName = normalizeName(name);
    this._map[normalizedName] = {
      value: normalizeValue(value),
      name,
    };
  }

  /**
   * Iterates over each header.
   */
  forEach(callback: (value: string, name: string, headers: Headers) => void, thisArg?: unknown): void {
    const keys = Object.keys(this._map);
    keys.forEach((key) => {
      const item = this._map[key];
      callback.call(thisArg, item.value, item.name, this);
    });
  }

  /**
   * Calls a defined callback function on each element of the headers, and returns an array that contains the results.
   * 
   * @param callbackfn A function that accepts up to two arguments. The map method calls the callbackfn function one time for each header.
   * @param thisArg An object to which the `this` keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  map<U>(callbackfn: (name: string, value: string) => U, thisArg?: any): U[] {
    const keys = Object.keys(this._map);
    const results: U[] = [];
    for (const name of keys) {
      const item = this._map[name];
      const cbReturn = callbackfn.call(thisArg, item.value, item.name);
      results.push(cbReturn);
    }
    return results;
  }

  /**
   * @return The headers HTTP string
   */
  toString(): string {
    const result: string[] = [];
    const keys = Object.keys(this._map);
    for (const name of keys) {
      const item = this._map[name];
      let tmp = `${item.name}: `;
      if (item.value) {
        tmp += item.value;
      }
      result.push(tmp);
    }
    return result.join('\n');
  }

  /**
   * Iterates over keys.
   */
  *keys(): IterableIterator<string> {
    const keys = Object.keys(this._map);
    for (const name of keys) {
      yield this._map[name].name;
    }
  }

  /**
   * Iterates over values.
   */
  *values(): IterableIterator<string> {
    const keys = Object.keys(this._map);
    for (const name of keys) {
      yield this._map[name].value;
    }
  }

  /**
   * Iterates over headers.
   */
  *entries(): IterableIterator<string[]> {
    const keys = Object.keys(this._map);
    for (const name of keys) {
      yield [this._map[name].name, this._map[name].value];
    }
  }

  /**
   * Iterates over headers.
   */
  *[Symbol.iterator](): IterableIterator<string[]> {
    const keys = Object.keys(this._map);
    for (const name of keys) {
      yield [this._map[name].name, this._map[name].value];
    }
  }
}
