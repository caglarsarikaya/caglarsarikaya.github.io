// storage.js: web storage that never throws. In a private window, or with site data blocked,
// reads come back empty and writes are dropped. kind is 'local' or 'session'.

const store = kind => (kind === 'local' ? localStorage : sessionStorage);

export function load(kind, key) {
  try {
    return store(kind).getItem(key);
  } catch {
    return null;
  }
}

export function loadJSON(kind, key) {
  try {
    return JSON.parse(store(kind).getItem(key));
  } catch {
    return null;
  }
}

export function save(kind, key, value) {
  try {
    store(kind).setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch { /* storage unavailable */ }
}
