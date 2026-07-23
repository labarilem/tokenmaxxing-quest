import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LocalStorageAdapter,
  MemoryStorage,
  getLocalStorage,
} from "../js/storage.js";

test("MemoryStorage roundtrips values", () => {
  const store = new MemoryStorage();
  assert.equal(store.getItem("missing"), null);
  store.setItem("k", "v");
  assert.equal(store.getItem("k"), "v");
  store.setItem("k", 12);
  assert.equal(store.getItem("k"), "12");
});

test("LocalStorageAdapter works with an injected Storage-like object", () => {
  const backing = new MemoryStorage();
  const adapter = new LocalStorageAdapter(backing);
  adapter.setItem("a", "b");
  assert.equal(adapter.getItem("a"), "b");
});

test("LocalStorageAdapter throws when storage is unavailable", () => {
  assert.throws(() => new LocalStorageAdapter(null), /not available/);
});

test("getLocalStorage returns null or a usable Storage in Node", () => {
  const storage = getLocalStorage();
  // Node typically has no localStorage; if a polyfill exists it must accept probes.
  if (storage === null) {
    assert.equal(storage, null);
    return;
  }
  storage.setItem("__probe__", "ok");
  assert.equal(storage.getItem("__probe__"), "ok");
  storage.removeItem("__probe__");
});
