import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent, periodTitle, score } from "@/lib/economy";
import { decorateRank } from "@/lib/rank";
import { abOn, onAbRoster } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { lockPortal, portalOpen, unlockPortal } from "@/lib/pin";
import { PinField } from "@/components/pin-pad";
import { ReportCard } from "@/components/report-card";
import { workerCards } from "@/lib/report";
import { SKILL_MARKS } from "@/lib/skills";
import { cn } from "@/lib/utils";

function skillWord(n: number) {
  return SKILL_MARKS.find((m) => m.n === n)?.name ?? "";
}

/** Parents, crew leaders, students. Aliases only. No wallet. */
export function FamilyWeb({ file }: { file: EconomyFile }) {
  const [inGate, setInGate] = useState(() => !portalOpen());
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [pane, setPane] = useState<"me" | "crew" | "family">("me");
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
  const cards = useMemo(() => workerCards(file), [file]);
  const me = kids.find((s) => s.id === id) ?? null;
  const card = me ? cards.find((c) => c.id === me.id) : null;
  const mates = me ? kids.filter((s) => s.crewKey === me.crewKey) : [];
  const link = typeof window === "undefined" ? "?web=1" : `${window.location.origin}${window.location.pathname}?web=1`;

  function enter() {
    if (unlockPortal(code)) {
      setInGate(false);
      setCode("");
      setErr("");
      return;
    }
    setErr("Ask your teacher for the class web code. Not your name.");
    setCode("");
  }

  if (inGate) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">Family web</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Class code</h1>
          <p className="mt-2 text-sm text-muted">Parents, crew leaders, and students. Aliases only. Wallet stays off this page.</p>
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
            label="Class web code"
          />
          {err ? <p className="mt-2 text-sm text-loss">{err}</p> : null}
          <button type="button" onClick={enter} className="mt-4 min-h-12 w-full rounded-lg bg-accent text-sm font-semibold text-accent-fg">
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-2">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Family web</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Progress</h1>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="tw-tap min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold"
            onClick={() => {
              void navigator.clipboard?.writeText(link);
            }}
          >
            Copy link
          </button>
          <a href="./" className="tw-tap grid min-h-10 place-items-center rounded-full bg-elevated px-3 text-xs font-semibold">
            Wall
          </a>
          <button
            type="button"
            onClick={() => {
              lockPortal();
              setInGate(true);
              setId("");
            }}
            className="tw-tap min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold text-muted"
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
            className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated text-muted")}
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
            className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", id === s.id ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            {s.first}
          </button>
        ))}
      </div>
      {me ? (
        <>
          <div className="flex flex-wrap gap-1">
            {(["me", "crew", "family"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPane(p)}
                className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold", pane === p ? "bg-gold text-bg" : "bg-elevated")}
              >
                {p === "me" ? "My chart" : p === "crew" ? "Crew" : "Family sheet"}
              </button>
            ))}
          </div>
          {pane === "me" ? (
            <article className="tw-gadget p-5">
              <h2 className="font-display text-3xl font-semibold tracking-tight">{me.first}</h2>
              <p className="text-sm text-muted">
                {me.crewName} · P{me.period}
              </p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">Skills in words</p>
              <ul className="mt-2 grid gap-2">
                {(card?.skillMarks ?? [])
                  .filter((sk) => sk.score > 0)
                  .map((sk) => (
                    <li key={sk.id}>
                      <div className="flex justify-between text-sm">
                        <span>{sk.name}</span>
                        <span className="text-gold">{skillWord(sk.score)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-elevated">
                        <span className="block h-full rounded-full bg-gold" style={{ width: `${(sk.score / 4) * 100}%` }} />
                      </div>
                    </li>
                  ))}
              </ul>
              {!(card?.skillMarks ?? []).some((sk) => sk.score > 0) ? <p className="mt-2 text-sm text-muted">No skill marks yet.</p> : null}
              <p className="mt-5 text-xs text-muted">Time in class is on the family sheet. Wallet and Lucky stay off this page.</p>
            </article>
          ) : null}
          {pane === "crew" ? (
            <article className="tw-gadget p-5">
              <h2 className="font-display text-2xl font-semibold">{me.crewName}</h2>
              <p className="text-sm text-muted">Aliases only. Crew leaders check who is here.</p>
              <ul className="mt-3 grid gap-1">
                {mates.map((s) => (
                  <li key={s.id} className="flex min-h-11 items-center justify-between rounded-xl bg-elevated px-3">
                    <span className="font-semibold">{s.first}</span>
                    <span className="text-xs text-muted">P{s.period}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {pane === "family" ? <ReportCard file={file} id={me.id} names={false} /> : null}
        </>
      ) : (
        <p className="text-sm text-muted">Tap an alias. If it is not here, they are on the other A/B day.</p>
      )}
    </div>
  );
}
