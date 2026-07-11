/**
 * Persistence abstraction — a minimal key/value store.
 *
 * The engine depends on this narrow interface rather than the global
 * `localStorage`, so saves can be redirected to an in-memory store during
 * tests (Dependency Inversion + Interface Segregation).
 *
 * @typedef {{ getItem(key: string): string | null, setItem(key: string, value: string): void }} KeyValueStore
 */

/**
 * Adapter over the browser's `localStorage`.
 * @implements {KeyValueStore}
 */
export class LocalStorageAdapter {
  /** @param {Storage} [storage=globalThis.localStorage] */
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return this.storage.getItem(key);
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this.storage.setItem(key, value);
  }
}

/**
 * In-memory store for tests and non-browser environments. Interchangeable
 * with `LocalStorageAdapter` (Liskov).
 *
 * @implements {KeyValueStore}
 */
export class MemoryStorage {
  constructor() {
    /** @type {Map<string, string>} */
    this.map = new Map();
  }

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this.map.set(key, String(value));
  }
}
