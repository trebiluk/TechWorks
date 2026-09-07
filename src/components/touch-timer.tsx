import { useEffect, useRef, useState } from "react";
import { ringBell } from "@/lib/bells";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 15, 20];

export function TouchTimer({
  title = "Timer",
  className,
}: {
  title?: string;
  className?: string;
}) {
  const [left, setLeft] = useState(10 * 60);
  const [run, setRun] = useState(false);
  const rang = useRef(false);

  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          setRun(false);
          if (!rang.current) {
            rang.current = true;
            ringBell();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [run]);

  const m = Math.floor(left / 60);
  const s = left % 60;

  return (
    <section className={cn("rounded-xl bg-surface p-3", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">{title}</p>
      <p className={cn("font-display text-5xl font-semibold tabular-nums", left === 0 ? "text-cleanup" : "text-fg")}>
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              rang.current = false;
              setRun(false);
              setLeft(n * 60);
            }}
            className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            {n}m
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={() => {
            if (left <= 0) return;
            rang.current = false;
            setRun((v) => !v);
          }}
          className={cn("tw-tap min-h-12 flex-1 rounded-md text-sm font-semibold", run ? "bg-elevated text-muted" : "bg-accent text-accent-fg")}
        >
          {run ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRun(false);
            rang.current = false;
            setLeft(10 * 60);
          }}
          className="tw-tap min-h-12 rounded-md bg-elevated px-4 text-sm font-semibold"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
