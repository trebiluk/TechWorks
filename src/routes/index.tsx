import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/board";
import { CrashBanner, ErrorGate } from "@/components/error-gate";
import { VERSION_LABEL } from "@/lib/version";
import { clearChunkReload, hardReload, isChunkError, reloadChunkOnce } from "@/lib/reload";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
  errorComponent: BootError,
});

function BootError({ error }: { error: Error; reset: () => void }) {
  const msg = error.message || "The wall failed to paint.";
  const chunk = isChunkError(msg);
  useEffect(() => {
    reloadChunkOnce(msg);
  }, [msg]);
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
      <p className="font-semibold text-gold">TechWorks {VERSION_LABEL}</p>
      <p className="max-w-md text-sm text-fg">
        {chunk ? "This tab kept an old script after a publish. Reload." : msg}
      </p>
      <button type="button" onClick={hardReload} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg">
        Reload
      </button>
    </div>
  );
}

function Home() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
    clearChunkReload();
  }, []);
  if (!on) return <div className="min-h-svh bg-bg" aria-busy="true" />;
  return (
    <ErrorGate label="board">
      <CrashBanner />
      <Board />
    </ErrorGate>
  );
}
