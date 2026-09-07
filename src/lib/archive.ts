/** Cold store for old day logs and prior years. IndexedDB, with a RAM fallback. */

const DB = "techworks-years";
const STORE = "blobs";
const mem = new Map<string, string>();
let dbp: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  if (typeof indexedDB === "undefined") {
    dbp = Promise.resolve(null);
    return dbp;
  }
  dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => {
        req.result.onclose = () => {
          dbp = null;
        };
        resolve(req.result);
      };
      req.onerror = () => {
        dbp = null;
        resolve(null);
      };
    } catch {
      dbp = null;
      resolve(null);
    }
  });
  return dbp;
}

export async function archivePut(key: string, value: unknown): Promise<void> {
  const json = typeof value === "string" ? value : JSON.stringify(value);
  await archivePutMany([[key, json]]);
}

export async function archivePutMany(pairs: [string, string][]): Promise<void> {
  const dirty: [string, string][] = [];
  for (const [key, json] of pairs) {
    if (mem.get(key) === json) continue;
    mem.set(key, json);
    dirty.push([key, json]);
  }
  if (!dirty.length) return;
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const [key, json] of dirty) store.put(json, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function archiveGet<T>(key: string): Promise<T | null> {
  const hit = mem.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      /* */
    }
  }
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const raw = req.result;
        if (typeof raw !== "string") return resolve(null);
        mem.set(key, raw);
        try {
          resolve(JSON.parse(raw) as T);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function archiveYears(): Promise<string[]> {
  const keys = await archiveKeys("year:");
  return keys.sort();
}

export async function archiveKeys(prefix = ""): Promise<string[]> {
  const db = await openDb();
  const local = [...mem.keys()];
  const take = (list: string[]) => (prefix ? list.filter((k) => k.startsWith(prefix)) : list);
  if (!db) return take(local).sort();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => {
        const found = (req.result as IDBValidKey[]).map(String);
        resolve([...new Set(take([...local, ...found]))].sort());
      };
      req.onerror = () => resolve(take(local).sort());
    } catch {
      resolve(take(local).sort());
    }
  });
}

export async function archiveDel(key: string): Promise<void> {
  mem.delete(key);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export type YearBlob = {
  year: string;
  days: string[];
  students: { id: string; tape?: string; first?: string; period?: number }[];
};

export function yearKey(year: string) {
  return `year:${year}`;
}

export function logKey(date: string) {
  return `log:${date}`;
}