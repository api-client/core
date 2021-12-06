import { find, store } from './Cache.js';

export const hasBuffer: boolean = typeof Buffer === 'function';

/**
 * A map of functions that evaluates values with native functions.
 */
export class EvalFunctions {
  static [key: string]: (cacheTarget: object, args?: string[]) => string | number;

  /**
   * Calls `encodeURIComponent()` function on the first item of arguments array
   * @param args List of expression arguments
   * @return Encoded value
   * @throws {Error} When input has no value.
   */
  static EncodeURIComponent(cacheTarget: object, args?: string[]): string {
    const value = args && args[0];
    if (!value) {
      throw new Error('encodeURIComponent() requires a value');
    }
    return encodeURIComponent(value);
  }

  /**
   * Calls `decodeURIComponent()` function on the first item of arguments array
   * @param args List of expression arguments
   * @return Decoded value
   * @throws {Error} When input has no value.
   */
  static DecodeURIComponent(cacheTarget: object, args?: string[]): string {
    const value = args && args[0];
    if (!value) {
      throw new Error('decodeURIComponent() requires a value');
    }
    return decodeURIComponent(value);
  }

  /**
   * Calls the `btoa()` function on the first item on the arguments array
   * @param args List of expression arguments
   * @return Decoded value
   * @throws {Error} When input has no value.
   */
  static Btoa(cacheTarget: object, args: string[] = []): string {
    const [value] = args;
    if (!value) {
      throw new Error('btoa() requires a value');
    }
    if (hasBuffer) {
      const b = Buffer.from(value);
      return b.toString('base64');
    }
    return btoa(value);
  }

  /**
   * Calls the `atob()` function on the first item on the arguments array
   * @param args List of expression arguments
   * @return Decoded value
   * @throws {Error} When input has no value.
   */
  static Atob(cacheTarget: object, args: string[] = []): string {
    const [value] = args;
    if (!value) {
      throw new Error('atob() requires a value');
    }
    if (hasBuffer) {
      const b = Buffer.from(value, 'base64');
      return b.toString('utf8');
    }
    return atob(value);
  }

  /**
   * Calls the `now()` function. Returns current timestamp.
   * If argument is passed is will try to retrieve existing cached value
   * or create new one.
   *
   * @param args Arguments passed to the function
   * @return Current timestamp
   */
  static Now(cacheTarget: object, args?: string[]): number {
    const key = '__evalFnNow';
    const hasGroup = !!(args && args[0]);
    let value;
    if (hasGroup) {
      value = find(cacheTarget, key, args[0]);
    }
    if (!value) {
      value = Date.now();
    }
    if (hasGroup) {
      store(cacheTarget, key, args[0], value);
    }
    return value as number;
  }

  /**
   * Generates random integer value. If a group is passed in the `args` then
   * it looks for the value in the cache and prefers it if available.
   *
   * @param args Arguments passed to the function
   * @returns Current timestamp
   */
  static Random(cacheTarget: object, args?: string[]): number {
    const key = '__evalFnRandom';
    const hasGroup = !!(args && args[0]);
    let value;
    if (hasGroup) {
      value = find(cacheTarget, key, args[0]);
    }
    if (!value) {
      value = EvalFunctions.randomInt();
    }
    if (hasGroup) {
      store(cacheTarget, key, args[0], value);
    }
    return value as number;
  }

  /**
   * Returns a random `int` between 0 (inclusive) and
   * `Number.MAX_SAFE_INTEGER` (exclusive) with roughly equal probability of
   * returning any particular `int` in this range.
   */
  static randomInt(): number {
    // "|0" forces the value to a 32 bit integer.
    // Number.MAX_SAFE_INTEGER
    return Math.abs(Math.floor(Math.random() * 9007199254740991) | 0);
  }
}
