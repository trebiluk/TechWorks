import { cn } from "@/lib/utils";

/** Workstation top nav. Phone uses the dock. Projector has none. */
export type Mode = "board" | "desk" | "learn" | "admin";

export type ModeSub = {
  id: string;
  label: string;
  on: boolean;
  onClick: () => void;
  hidden?: boolean;
};

const MODES: { id: Mode; label: string }[] = [
  { id: "board", label: "Dashboard" },
  { id: "desk", label: "Desk" },
  { id: "learn", label: "Learn" },
  { id: "admin", label: "Admin" },
];

export function modeOf(view: string): Mode {
  if (view === "overview" || view === "week" || view === "year") return "board";
  if (view === "score" || view === "crew") return "desk";
  if (view === "skills" || view === "grades" || view === "projects") return "learn";
  return "admin";
}

export function ModeBar({
  mode,
  onMode,
  subs,
  allow,
  onWarm,
  className,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  subs: ModeSub[];
  allow?: Mode[];
  onWarm?: (m: Mode) => void;
  className?: string;
}) {
  const modes = allow?.length ? MODES.filter((m) => allow.includes(m.id)) : MODES;
  const shown = subs.filter((s) => !s.hidden);
  return (
    <div className={cn("desk-modes pointer-events-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <nav className="tw-gadget pointer-events-auto flex shrink-0 items-center gap-0.5 p-0.5" aria-label="Mode">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.label}
            onClick={() => onMode(m.id)}
            onPointerEnter={() => onWarm?.(m.id)}
            onFocus={() => onWarm?.(m.id)}
            className={cn(
              "tw-tap min-h-11 shrink-0 rounded-md px-3 text-xs font-bold uppercase tracking-[0.14em] sm:min-h-9 sm:px-3.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              mode === m.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>
      {shown.length >= 2 ? (
        <>
          <span className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden />
          <nav className="pointer-events-auto flex min-w-0 items-center gap-1" aria-label="Section">
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.label}
                onClick={s.onClick}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-semibold sm:min-h-8 sm:px-2.5",
                  s.on ? "bg-elevated text-fg ring-1 ring-gold" : "bg-elevated/60 text-muted hover:text-fg",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
