"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type TeachTool = {
  id: string;
  label: string;
  title?: string;
  on?: boolean;
  onClick: () => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Left Edge Pocket on TEACH. Overlay — never a reserved right ribbon. Taps ≥44px. */
export function TeachPocket({ tools, extra }: { tools: TeachTool[]; extra?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      if (box.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <div ref={box} className={cn("tw-teach-pocket", open && "is-open")} data-teach-pocket={open ? "open" : "shut"}>
      <button
        type="button"
        className="tw-teach-pocket-tab tw-tap"
        aria-expanded={open}
        aria-controls="tw-teach-pocket-rail"
        title={open ? "Hide tools" : "Tools"}
        onClick={() => setOpen((v) => !v)}
      >
        <PanelLeft className="size-5" strokeWidth={2.2} aria-hidden />
        <span>{open ? "Hide" : "Tools"}</span>
      </button>
      <nav id="tw-teach-pocket-rail" className="tw-teach-pocket-rail" aria-label="Teach tools">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              title={t.title || t.label}
              data-on={t.on ? "on" : undefined}
              onClick={() => {
                t.onClick();
                if (t.id !== "arrange" && t.id !== "hang") setOpen(false);
              }}
              className="tw-tap tw-teach-pocket-btn"
            >
              <Icon className="size-5" strokeWidth={2.2} aria-hidden />
              <span>{t.label}</span>
            </button>
          );
        })}
        {extra ? <div className="tw-teach-pocket-extra">{extra}</div> : null}
      </nav>
    </div>
  );
}
