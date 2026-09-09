import { useEffect } from "react";
import { hardReload, isChunkError, reloadChunkOnce } from "@/lib/reload";

export function AppErrorComponent({ error }: { error: Error }) {
  const msg = error.message || "Reload the page.";
  const chunk = isChunkError(msg);
  useEffect(() => {
    reloadChunkOnce(msg);
  }, [msg]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-fg">
      <p className="text-sm font-semibold">TechWorks hit a snag</p>
      <p className="max-w-md text-center text-sm text-muted">
        {chunk ? "An old script was still on this phone after a publish. Tap Reload." : msg}
      </p>
      <button type="button" onClick={hardReload} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg">
        Reload
      </button>
    </div>
  );
}
