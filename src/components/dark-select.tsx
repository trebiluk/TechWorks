import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** In-app list so dark themes never get a white OS menu with light text. */
export function DarkSelect({
  value,
  onChange,
  options,
  placeholder = "—",
  className,
  onOpen,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  onOpen?: () => boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    function down(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={root} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        className="edit-field flex min-h-11 w-full items-center gap-2 bg-transparent text-left text-sm uppercase tracking-wide text-fg outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (onOpen && !onOpen()) return;
          setOpen((v) => !v);
        }}
      >
        <span className="min-w-0 flex-1 truncate">{current?.label || placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-subtle" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 min-w-full overflow-auto rounded-lg bg-elevated py-1 shadow-lg ring-1 ring-border"
        >
          {options.map((o) => (
            <li key={o.value || "empty"} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center px-3 text-left text-sm uppercase tracking-wide text-fg",
                  o.value === value ? "bg-surface" : "hover:bg-surface",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
