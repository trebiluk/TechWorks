"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";

/** Baboo-family Edge Pocket: one More chip on the row; extras open as an overlay. Tap only — no hover-only power. */
export function EdgePocket({
  label,
  lamp,
  badge,
  children,
  className,
}: {
  label: string;
  lamp?: boolean;
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={cn("tw-edge-pocket", className)} data-edge-pocket="more">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "tw-edge-pocket-chip tw-hud-btn tw-tap relative z-30 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-fg hover:bg-elevated",
          open ? "bg-accent text-accent-fg" : "",
        )}
      >
        <Ellipsis className="size-5" strokeWidth={2.2} aria-hidden />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        {lamp ? <span className="tw-edge-pocket-lamp" aria-hidden /> : null}
        {badge ? <span className="rounded-full bg-loss px-1.5 py-0.5 text-[10px] font-bold text-accent-fg">{badge}</span> : null}
      </button>
      {open ? (
        <div
          className="tw-edge-pocket-menu"
          role="menu"
          onClick={(e) => {
            const node = e.target as HTMLElement;
            if (node.closest("input, textarea, [data-keep-pocket]")) return;
            if (node.closest("button, a")) setOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
