"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 8 });
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ top: Math.round(r.bottom + 6), right: Math.round(Math.max(8, window.innerWidth - r.right)) });
    };
    place();
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (box.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
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

  const panel = open && mounted ? (
    createPortal(
      <div
        ref={menu}
        className="tw-edge-pocket-menu"
        role="menu"
        data-edge-pocket-menu=""
        style={{ top: pos.top, right: pos.right }}
        onClick={(e) => {
          const node = e.target as HTMLElement;
          if (node.closest("input, textarea, [data-keep-pocket]")) return;
          if (node.closest("button, a")) setOpen(false);
        }}
      >
        {children}
      </div>,
      document.body,
    )
  ) : null;

  return (
    <div ref={box} className={cn("tw-edge-pocket", className)} data-edge-pocket="more">
      <button
        ref={btn}
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
      {panel}
    </div>
  );
}
