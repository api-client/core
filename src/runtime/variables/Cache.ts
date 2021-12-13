/**
 * In-memory cache store for evaluated values.
 */
const cache = new WeakMap();

/**
 * Removes cached values from the store.
 * @param target The cache target, element or object extending the mixin
 */
export function clear(target: object): void {
  if (cache.has(target)) {
    cache.delete(target);
  }
}

/**
 * Finds a cached group.
 *
 * @param target The cache target, element or object extending the mixin
 * @param key A key where a function keeps cached objects
 * @param group Group name. Defined by user as an argument.
 * @return Cached value.
 */
export function find(target: object, key: string, group: string): string|number|null {
  const value = cache.get(target);
  if (!value) {
    return null;
  }
  if (!value[key]) {
    return null;
  }
  return value[key][group];
}

/**
 * Stores value in cache.
 *
 * @param target The cache target, element or object extending the mixin
 * @param key A key where a function keeps cached objects
 * @param group Group name. Defined by user as an argument.
 * @param value Cached value.
 */
export function store(target: object, key: string, group: string, value: string|number): void {
  let cacheValue = cache.get(target);
  if (!cacheValue) {
    cacheValue = {};
    cache.set(target, cacheValue);
  }
  if (!cacheValue[key]) {
    cacheValue[key] = {};
  }
  cacheValue[key][group] = value;
}
