import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { hardReload, isChunkError, reloadChunkOnce } from "@/lib/reload";

function CrashCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const chunk = isChunkError(message);
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
      <p className="font-semibold tracking-wide text-gold">TechWorks {VERSION_LABEL}</p>
      <p className="text-[11px] text-muted">{COPYRIGHT_LINE}</p>
      <p className="max-w-md text-sm text-fg">
        {chunk ? "This tab had an old script after a publish. Reload pulls the new desk." : message}
      </p>
      <button type="button" onClick={chunk ? hardReload : onRetry} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg">
        {chunk ? "Reload" : "Try again"}
      </button>
    </div>
  );
}

export class ErrorGate extends Component<{ children: ReactNode; label?: string }, { err: string }> {
  state = { err: "" };

  static getDerivedStateFromError(err: Error) {
    return { err: err.message || "The wall failed to paint." };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[TechWorks]", this.props.label ?? "gate", err, info.componentStack);
    reloadChunkOnce(err.message || "");
  }

  render() {
    if (this.state.err) {
      return <CrashCard message={this.state.err} onRetry={() => this.setState({ err: "" })} />;
    }
    return this.props.children;
  }
}

export function CrashBanner() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    function onError(e: ErrorEvent) {
      const text = e.message || "Script error";
      if (/Minified React error #418|#423|#425|Hydration|did not match/i.test(text)) return;
      if (isChunkError(text)) {
        reloadChunkOnce(text);
        return;
      }
      setMsg(text);
    }
    function onReject(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const text = reason instanceof Error ? reason.message : String(reason || "Promise failed");
      if (/Minified React error #418|#423|#425|Hydration|did not match/i.test(text)) return;
      if (isChunkError(text)) {
        reloadChunkOnce(text);
        return;
      }
      setMsg(text);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-3 bg-loss px-3 py-2 text-sm font-medium text-accent-fg">
      <span className="min-w-0 truncate">
        {VERSION_LABEL} · {msg}
      </span>
      <button type="button" className="tw-btn-2 shrink-0 rounded-md px-3 py-1" onClick={hardReload}>
        Reload
      </button>
    </div>
  );
}
