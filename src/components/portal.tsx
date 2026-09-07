import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent, marketFactor, money, periodTitle, score } from "@/lib/economy";
import { decorateRank } from "@/lib/rank";
import { publicHandle } from "@/lib/live";
import { abOn, markOn, onAbRoster } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { lockPortal, portalOpen, unlockPortal } from "@/lib/pin";
import { QuarterChip } from "@/components/quarter-chip";
import { codeGlyph } from "@/lib/glyphs";
import { cn } from "@/lib/utils";

export function WorkerPortal({ file }: { file: EconomyFile }) {
  const [inGate, setInGate] = useState(() => !portalOpen());
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const bells = bellFor(file);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [id, setId] = useState("");
  const today = todayIso();
  const letter = abOn(file, today);
  const kids = useMemo(
    () =>
      decorateRank(
        file,
        score(file).filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter)),
      ),
    [file, period, letter],
  );
  const me = kids.find((s) => s.id === id) ?? null;

  function enter() {
    if (unlockPortal(code)) {
      setInGate(false);
      setCode("");
      setErr("");
      return;
    }
    setErr("That class code is not it. Ask your crew leader — not your real name.");
    setCode("");
  }

  if (inGate) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">Worker portal</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Class code</h1>
          <p className="mt-2 text-sm text-muted">
            Private class. Aliases only — your real name never shows here. Enter the class portal PIN to see your badge.
          </p>
          <input
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            className="mt-4 min-h-12 w-full rounded-md bg-elevated px-3 font-mono text-2xl tracking-[0.5em] outline-none"
            placeholder="••••"
            aria-label="Portal PIN"
          />
          {err ? <p className="mt-2 text-sm text-loss">{err}</p> : null}
          <button type="button" onClick={enter} className="mt-4 min-h-12 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg">
            Enter class
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Worker portal</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Pick your badge</h1>
        </div>
        <div className="flex items-center gap-2">
          <QuarterChip />
          <button
            type="button"
            onClick={() => {
              lockPortal();
              setInGate(true);
              setId("");
            }}
            className="min-h-11 rounded-md bg-surface px-3 text-sm text-muted"
          >
            Lock
          </button>
        </div>
      </header>
      <div className="flex flex-wrap gap-1">
        {bells.map((b) => (
          <button
            key={b.period}
            type="button"
            onClick={() => {
              setPeriod(b.period);
              setId("");
            }}
            className={cn("min-h-11 rounded-md px-3 text-sm", period === b.period ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {kids.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setId(s.id)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", id === s.id ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {s.first}
          </button>
        ))}
      </div>
      {me ? (
        <article className="rounded-2xl bg-surface p-5">
          <p className="text-sm text-muted">Hi,</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight">{me.first}</h2>
          <p className="mt-1 text-sm text-muted">
            {me.crewName} · P{me.period}
          </p>
          <p className="mt-3 font-mono text-sm tracking-[0.3em] text-gain">{publicHandle(me.id)}</p>
          <p className="text-xs uppercase tracking-wider text-subtle">Class ID · not your name</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="◆ XP" value={String(me.xp)} gold />
            <Tile label="$ Perks" value={money(me.quarter)} />
            <Tile label="▲ Stock" value={money(me.stock)} />
          </div>
          {(() => {
            const todayCode = markOn(me, today);
            const factor = marketFactor(file);
            return (
              <div className="mt-5 rounded-xl bg-elevated p-4">
                <p className="text-sm font-medium uppercase tracking-wider text-subtle">Today</p>
                <p className="mt-2 font-display text-4xl font-semibold">
                  {todayCode ? `${codeGlyph(todayCode)} ${todayCode}` : "Not scored yet"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Market ×{factor.toFixed(2)} · $ and ▲ are games · ◆ XP is the class story
                </p>
              </div>
            );
          })()}
          <p className="mt-4 text-sm text-muted">At home with a parent: look at today and ◆ XP. Real names stay off this portal.</p>
        </article>
      ) : (
        <p className="text-sm text-muted">Tap your alias. If it is not here, you are on the other A/B day.</p>
      )}
    </div>
  );
}

function Tile({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-lg bg-elevated p-3">
      <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", gold ? "text-gain" : "")}>{value}</p>
    </div>
  );
}
