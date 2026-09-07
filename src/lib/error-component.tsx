import { useEffect } from "react";

function hardReload() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("r", String(Date.now()));
    window.location.replace(u.toString());
  } catch {
    window.location.reload();
  }
}

export function AppErrorComponent({ error }: { error: Error }) {
  const msg = error.message || "Reload the page.";
  const chunk = /Failed to fetch dynamically imported module/i.test(msg);
  useEffect(() => {
    if (!chunk) return;
    try {
      if (sessionStorage.getItem("tw-chunk-reload") === "1") return;
      sessionStorage.setItem("tw-chunk-reload", "1");
    } catch {
      /* */
    }
    hardReload();
  }, [chunk]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-fg">
      <p className="text-sm font-semibold">TechWorks hit a snag</p>
      <p className="max-w-md text-center text-sm text-muted">
        {chunk
          ? "The phone loaded an old script after a publish. Tap Reload."
          : msg}
      </p>
      <button
        type="button"
        onClick={hardReload}
        className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg"
      >
        Reload
      </button>
    </div>
  );
}
