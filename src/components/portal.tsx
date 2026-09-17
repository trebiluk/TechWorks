import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, score } from "@/lib/economy";
import { decorateRank } from "@/lib/rank";
import { findByShop, publicHandle } from "@/lib/live";
import { markOn } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { lockPortal, portalOpen, unlockPortal } from "@/lib/pin";
import { PinField } from "@/components/pin-pad";
import { QuarterChip } from "@/components/quarter-chip";
import { codeGlyph } from "@/lib/glyphs";
import { ReportCard } from "@/components/report-card";
import { cn } from "@/lib/utils";

export function WorkerPortal({ file }: { file: EconomyFile }) {
  const [inGate, setInGate] = useState(() => !portalOpen());
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [id, setId] = useState("");
  const [shop, setShop] = useState("");
  const today = todayIso();
  const kids = useMemo(
    () =>
      decorateRank(
        file,
        score(file).filter((s) => isLiveStudent(s, file.meta.quarterName)),
      ),
    [file],
  );
  const me = (id ? kids.find((s) => s.id === id) : findByShop(kids, shop)) ?? null;

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
          <PinField
            autoFocus
            value={code}
            onChange={(v) => {
              setCode(v);
              setErr("");
              if (v.length >= 4 && unlockPortal(v)) {
                setInGate(false);
                setCode("");
              }
            }}
            onEnter={enter}
            className="mt-4 [&_input]:min-h-12 [&_input]:text-2xl [&_span]:text-2xl"
            label="Portal PIN"
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
              setShop("");
            }}
            className="min-h-11 rounded-md bg-surface px-3 text-sm text-muted"
          >
            Lock
          </button>
        </div>
      </header>
      <div className="max-w-sm">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Shop ID</label>
        <input
          value={shop}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setShop(v);
            const hit = findByShop(kids, v);
            setId(hit?.id ?? "");
          }}
          placeholder="From your teacher"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1 min-h-12 w-full rounded-lg bg-elevated px-3 font-mono text-lg tracking-[0.18em] outline-none"
          aria-label="Shop ID"
        />
        <p className="mt-1 text-xs text-muted">Five letters. Not a name. The class list stays off this page.</p>
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
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Tile label="◆ XP" value={String(me.xp)} gold />
          </div>
          {(() => {
            const todayCode = markOn(me, today);
            return (
              <div className="mt-5 rounded-xl bg-elevated p-4">
                <p className="text-sm font-medium uppercase tracking-wider text-subtle">Today</p>
                <p className="mt-2 font-display text-4xl font-semibold">
                  {todayCode ? `${codeGlyph(todayCode)} ${todayCode}` : "Not scored yet"}
                </p>
              </div>
            );
          })()}
          <p className="mt-4 text-sm text-muted">XP is the class story. Wallet stays off this page. Family report is aliases only.</p>
          <ReportCard file={file} id={me.id} names={false} />
        </article>
      ) : (
        <p className="text-sm text-muted">Enter the Shop ID from your teacher. Not a class list.</p>
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
