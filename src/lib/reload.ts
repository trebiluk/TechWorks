export function isChunkError(msg: string): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed/i.test(msg);
}

export function hardReload() {
  try {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
    }
    if (typeof caches !== "undefined") {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
  } catch {
    /* */
  }
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("r", String(Date.now()));
    window.location.replace(u.toString());
  } catch {
    window.location.reload();
  }
}

export function reloadChunkOnce(msg: string) {
  if (!isChunkError(msg)) return;
  try {
    if (sessionStorage.getItem("tw-chunk-reload") === "1") return;
    sessionStorage.setItem("tw-chunk-reload", "1");
  } catch {
    /* */
  }
  hardReload();
}

export function clearChunkReload() {
  try {
    sessionStorage.removeItem("tw-chunk-reload");
  } catch {
    /* */
  }
}
