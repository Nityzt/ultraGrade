// Vitest global setup (jsdom environment).
//
// jsdom in this toolchain exposes a hollow `localStorage` (no clear/getItem/etc.),
// so we install a small spec-compliant Storage polyfill on window/globalThis.
// This keeps storage-backed code (migrationUtils, useLocalStorage) testable and
// deterministic regardless of jsdom quirks.
import { afterEach } from 'vitest';

class MemoryStorage {
  #map = new Map();
  get length() {
    return this.#map.size;
  }
  clear() {
    this.#map.clear();
  }
  getItem(key) {
    return this.#map.has(String(key)) ? this.#map.get(String(key)) : null;
  }
  setItem(key, value) {
    this.#map.set(String(key), String(value));
  }
  removeItem(key) {
    this.#map.delete(String(key));
  }
  key(index) {
    return Array.from(this.#map.keys())[index] ?? null;
  }
}

function installStorage(name) {
  const store = new MemoryStorage();
  Object.defineProperty(globalThis, name, { value: store, configurable: true, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, { value: store, configurable: true, writable: true });
  }
}

installStorage('localStorage');
installStorage('sessionStorage');

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
