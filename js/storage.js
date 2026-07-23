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
 * Resolve `localStorage` when available. Some privacy modes throw on access.
 * @returns {Storage | null}
 */
export function getLocalStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) {
      return null;
    }
    // Probe write access — Safari private mode can expose a Storage that throws.
    const probeKey = "__tmq_storage_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

/**
 * Adapter over the browser's `localStorage`.
 * @implements {KeyValueStore}
 */
export class LocalStorageAdapter {
  /**
   * @param {Storage} [storage] defaults to a probed `localStorage` when omitted
   */
  constructor(storage = getLocalStorage() ?? undefined) {
    if (!storage) {
      throw new Error("localStorage is not available");
    }
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
