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
      const name = line.substr(0, sepPosition);
      const value = line.substr(sepPosition + 1).trim();
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
  map: Record<string, RawValue> = {};
  /**
   * @param headers The headers to parse.
   */
  constructor(headers?: string | Record<string, string> | Headers) {
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
  append(name: string, value: string): void {
    const normalizedName = normalizeName(name);
    value = normalizeValue(value);
    let item = this.map[normalizedName];
    if (item) {
      const oldValue = item.value;
      item.value = oldValue ? `${oldValue},${value}` : value;
    } else {
      item = {
        name,
        value,
      };
    }
    this.map[normalizedName] = item;
  }

  /**
   * Removes a header from the list of headers.
   * @param name The header name
   */
  delete(name: string): void {
    delete this.map[normalizeName(name)];
  }

  /**
   * Returns the current value of the header
   * @param name Header name
   */
  get(name: string): string | undefined {
    name = normalizeName(name);
    return this.has(name) ? this.map[name].value : undefined;
  }

  /**
   * Checks if the header exists.
   */
  has(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.map, normalizeName(name));
  }

  /**
   * Creates a new header. If the header exist it replaces the value.
   */
  set(name: string, value: string): void {
    const normalizedName = normalizeName(name);
    this.map[normalizedName] = {
      value: normalizeValue(value),
      name,
    };
  }

  /**
   * Iterates over each header.
   */
  forEach(callback: (value: string, name: string, headers: Headers) => void, thisArg?: unknown): void {
    for (const name in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, name)) {
        callback.call(thisArg, this.map[name].value, this.map[name].name, this);
      }
    }
  }

  /**
   * @return The headers HTTP string
   */
  toString(): string {
    const result: string[] = [];
    this.forEach((value, name) => {
      let tmp = `${name}: `;
      if (value) {
        tmp += value;
      }
      result.push(tmp);
    });
    return result.join('\n');
  }

  /**
   * Iterates over keys.
   */
  *keys(): IterableIterator<string> {
    for (const name in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, name)) {
        yield this.map[name].name;
      }
    }
  }

  /**
   * Iterates over values.
   */
  *values(): IterableIterator<string> {
    for (const name in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, name)) {
        yield this.map[name].value;
      }
    }
  }

  /**
   * Iterates over headers.
   */
  *entries(): IterableIterator<string[]> {
    for (const name in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, name)) {
        yield [this.map[name].name, this.map[name].value];
      }
    }
  }

  /**
   * Iterates over headers.
   */
  *[Symbol.iterator](): IterableIterator<string[]> {
    for (const name in this.map) {
      if (Object.prototype.hasOwnProperty.call(this.map, name)) {
        yield [this.map[name].name, this.map[name].value];
      }
    }
  }
}
