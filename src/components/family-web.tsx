import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, score } from "@/lib/economy";
import { decorateRank } from "@/lib/rank";
import { lockPortal, portalOpen, unlockPortal } from "@/lib/pin";
import { findByShop, publicHandle } from "@/lib/live";
import { PinField } from "@/components/pin-pad";
import { ReportCard } from "@/components/report-card";
import { workerCards } from "@/lib/report";
import { SKILL_MARKS } from "@/lib/skills";
import { Spark } from "@/lib/charts";
import { cn } from "@/lib/utils";

function skillWord(n: number) {
  return SKILL_MARKS.find((m) => m.n === n)?.name ?? "Not yet";
}

/** Parents, crew leaders, students. Aliases only. No wallet. */
export function FamilyWeb({ file }: { file: EconomyFile }) {
  const [inGate, setInGate] = useState(() => !portalOpen());
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [pane, setPane] = useState<"me" | "crew" | "family">("me");
  const [id, setId] = useState("");
  const [shop, setShop] = useState("");
  const kids = useMemo(
    () =>
      decorateRank(
        file,
        score(file).filter((s) => isLiveStudent(s, file.meta.quarterName)),
      ),
    [file],
  );
  const cards = useMemo(() => workerCards(file), [file]);
  const me = (id ? kids.find((s) => s.id === id) : findByShop(kids, shop)) ?? null;
  const card = me ? cards.find((c) => c.id === me.id) : null;
  const mates = me ? kids.filter((s) => s.crewKey === me.crewKey) : [];
  const link = typeof window === "undefined" ? "?web=1" : `${window.location.origin}${window.location.pathname}?web=1`;
  const spark = (card?.stamps ?? []).slice(-10).map((st) => Math.max(0, st.pay));

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
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4" data-family-web>
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-2" data-family-web>
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
              setShop("");
            }}
            className="tw-tap min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold text-muted"
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
          placeholder="From the codebook / family sheet"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1 min-h-12 w-full rounded-lg bg-elevated px-3 font-mono text-lg tracking-[0.18em] outline-none"
          aria-label="Shop ID"
        />
        <p className="mt-1 text-xs text-muted">Five letters from your teacher. Not a name. Not a class list.</p>
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
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Profile</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">{me.first}</h2>
              <p className="font-mono text-sm tracking-[0.2em] text-gold">{publicHandle(me.id)}</p>
              <p className="text-sm text-muted">
                {me.crewName} · P{me.period}
              </p>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-muted">Skill chart</p>
              <ul className="mt-2 grid gap-2">
                {(card?.skillMarks ?? []).map((sk) => (
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
              {!(card?.skillMarks ?? []).length ? <p className="mt-2 text-sm text-muted">No skill marks yet.</p> : null}
              {spark.length > 1 ? (
                <>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-muted">Days in class</p>
                  <Spark values={spark} className="mt-2 h-16 w-full" />
                </>
              ) : null}
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
        <p className="text-sm text-muted">Enter the Shop ID from the paper your teacher sent home. The class list is not on this page.</p>
      )}
    </div>
  );
}
