"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/** Left hamburger. Same tools as the old More chip, in a side drawer. Tap only. */
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
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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
      <>
        <button type="button" className="tw-edge-pocket-scrim" aria-label="Close" onClick={() => setOpen(false)} />
        <div
          ref={menu}
          className="tw-edge-pocket-menu"
          role="menu"
          data-edge-pocket-menu=""
          onClick={(e) => {
            const node = e.target as HTMLElement;
            if (node.closest("input, textarea, [data-keep-pocket]")) return;
            if (node.closest("button, a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </>,
      document.body,
    )
  ) : null;

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
          "tw-edge-pocket-chip tw-hud-btn tw-tap relative z-30 inline-flex size-11 min-h-11 shrink-0 items-center justify-center rounded-xl text-fg hover:bg-elevated",
          open ? "bg-accent text-accent-fg" : "",
        )}
      >
        <Menu className="size-5" strokeWidth={2.2} aria-hidden />
        {lamp ? <span className="tw-edge-pocket-lamp" aria-hidden /> : null}
        {badge ? <span className="absolute -right-1 -top-1 rounded-full bg-loss px-1.5 py-0.5 text-[10px] font-bold text-accent-fg">{badge}</span> : null}
      </button>
      {panel}
    </div>
  );
}