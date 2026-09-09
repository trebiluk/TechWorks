import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { bellFor, legalFirstOf, legalLastOf, type EconomyFile } from "@/lib/economy";
import { parseLegalRosterText } from "@/lib/alias-bank";
import { importLegalRoster, rerollAlias, setAlias } from "@/lib/store";
import { publicHandle } from "@/lib/live";
import { cn } from "@/lib/utils";

/** 4 taps: period → paste → aliases → desk. */
export function RosterOnboard({
  file,
  onChange,
  onClose,
  onDesk,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onClose: () => void;
  onDesk?: () => void;
}) {
  const bells = bellFor(file);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [paste, setPaste] = useState("");
  const [showLegal, setShowLegal] = useState(false);
  const parsed = useMemo(() => parseLegalRosterText(paste), [paste]);
  const recent = file.students.filter((s) => s.period === period).slice(-24);

  return (
    <div className="tw-scrim fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center">
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-subtle">Add a class · 4 taps</p>
            <p className="text-xs text-muted">1 period · 2 paste · 3 locked ids + aliases · 4 desk</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="size-11 rounded-lg bg-elevated">
            <X className="mx-auto size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          <p className="text-sm font-medium">1 · Period</p>
          <div className="flex flex-wrap gap-1">
            {bells.map((b) => (
              <button
                key={b.period}
                type="button"
                onClick={() => {
                  setPeriod(b.period);
                }}
                className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated")}
              >
                P{b.period}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium">2 · Paste names or CSV</p>
          <textarea
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
            }}
            rows={5}
            placeholder={"Last, First, Period\nSmith, Jordan, 1"}
            className="w-full rounded-md bg-elevated px-3 py-2 font-mono text-sm outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <label className="tw-tap inline-flex min-h-11 cursor-pointer items-center rounded-md bg-elevated px-3 text-sm font-semibold">
              Open CSV
              <input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setPaste(await f.text());
                }}
              />
            </label>
            <p className="self-center text-xs text-muted">Last, First, Period, IEP, 504 · Period in the file wins if present</p>
          </div>
          <p className="text-xs text-muted">
            {parsed.length} rows · missing period uses P{period} · id first, then alias · legal stays vault-only
          </p>
          <button
            type="button"
            disabled={!parsed.length}
            onClick={() => {
              onChange(importLegalRoster(file, parsed.map((r) => ({ ...r, period: r.period || period }))));
              setPaste("");
            }}
            className={cn(
              "min-h-11 w-full rounded-md px-3 text-sm font-semibold",
              parsed.length ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            3 · Mint ids + aliases
          </button>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium uppercase tracking-wider text-subtle">P{period} aliases</p>
            <button type="button" onClick={() => setShowLegal((v) => !v)} className="text-xs text-muted underline">
              {showLegal ? "Hide legal" : "Show legal"}
            </button>
          </div>
          <div className="overflow-auto rounded-lg bg-elevated">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-2 py-2">Alias</th>
                  <th className="px-2 py-2">P</th>
                  <th className="px-2 py-2">Class</th>
                  {showLegal ? <th className="px-2 py-2">Legal</th> : null}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="px-2 py-1.5">
                      <input
                        value={s.first}
                        onChange={(e) => onChange(setAlias(file, s.id, e.target.value))}
                        className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs">{s.period}</td>
                    <td className="px-2 py-1.5 font-mono text-xs text-subtle">{publicHandle(s.id)}</td>
                    {showLegal ? (
                      <td className="px-2 py-1.5 text-xs text-muted">
                        {legalLastOf(s)}, {legalFirstOf(s)}
                      </td>
                    ) : null}
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => onChange(rerollAlias(file, s.id))}
                        className="rounded bg-surface px-2 py-1 text-xs font-semibold"
                      >
                        ↻
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => {
              onDesk?.();
              onClose();
            }}
            className="min-h-11 w-full rounded-md bg-gold px-3 text-sm font-semibold text-bg"
          >
            4 · Open Desk
          </button>
        </div>
      </div>
    </div>
  );
}
