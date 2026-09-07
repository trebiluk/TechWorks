import { useEffect, useState } from "react";
import { Dices, Timer, X } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent, periodTitle } from "@/lib/economy";
import { abOn, onAbRoster } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function NamePicker({
  file,
  onClose,
}: {
  file: EconomyFile;
  onClose: () => void;
}) {
  const bells = bellFor(file);
  const letter = abOn(file, todayIso());
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const pool = file.students.filter(
    (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
  );
  const [pick, setPick] = useState<(typeof pool)[number] | null>(null);

  function draw() {
    if (!pool.length) return;
    const i = Math.floor(Math.random() * pool.length);
    setPick(pool[i] ?? null);
  }

  return (
    <div className="tw-scrim fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wider text-subtle">Name picker</p>
          <button type="button" onClick={onClose} className="size-11 rounded-md bg-elevated" aria-label="Close">
            <X className="mx-auto size-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {bells.map((b) => (
            <button
              key={b.period}
              type="button"
              onClick={() => {
                setPeriod(b.period);
                setPick(null);
              }}
              className={cn("min-h-11 rounded-md px-3 text-sm", period === b.period ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {periodTitle(b.period, bells)}
            </button>
          ))}
        </div>
        <p className="mt-8 text-center font-display text-5xl font-semibold tracking-tight">{pick ? pick.first : "—"}</p>
        <p className="mt-2 text-center text-sm text-subtle">{pool.length} aliases · wall names only</p>
        <button type="button" onClick={draw} className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
          <Dices className="size-4" /> Draw
        </button>
      </div>
    </div>
  );
}

export function FocusTimer({
  onClose,
}: {
  onClose: () => void;
}) {
  const [left, setLeft] = useState(5 * 60);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return;
    const t = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setRun(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [run]);

  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  const done = left === 0;

  return (
    <div className="tw-scrim fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className={cn("w-full max-w-sm rounded-xl p-5", done ? "bg-cleanup text-bg" : "bg-surface")}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-wider">{done ? "Time" : "Focus timer"}</p>
          <button type="button" onClick={onClose} className="size-11 rounded-md bg-elevated/40" aria-label="Close">
            <X className="mx-auto size-4" />
          </button>
        </div>
        <p className="mt-6 text-center font-display text-6xl font-semibold tabular-nums">
          {m}:{s}
        </p>
        <div className="mt-6 flex gap-2">
          {[3, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setLeft(n * 60);
                setRun(false);
              }}
              className="min-h-11 flex-1 rounded-md bg-elevated px-2 text-sm"
            >
              {n} min
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRun((v) => !v)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-gold px-3 text-sm font-semibold text-bg"
        >
          <Timer className="size-4" />
          {run ? "Pause" : done ? "Reset 5" : "Start"}
        </button>
      </div>
    </div>
  );
}
