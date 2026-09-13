import { useEffect, useState } from "react";
import { GLOSSARY_CATS, type GlossaryCat } from "@/data/glossary";
import { dealHeat, heatScore, HEAT_SECS, HEAT_SIZES, type VocabQ } from "@/lib/vocab-game";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4"] as const;

function typingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return Boolean(el.closest("input, textarea, select, [contenteditable], [role='textbox']"));
}

export function VocabGame() {
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [size, setSize] = useState<(typeof HEAT_SIZES)[number]>(10);
  const [qs, setQs] = useState<VocabQ[]>([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [left, setLeft] = useState(HEAT_SECS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [miss, setMiss] = useState<VocabQ[]>([]);

  const q = qs[i];
  const done = qs.length > 0 && i >= qs.length;
  const revealed = pick !== null || (Boolean(q) && left <= 0);

  function start() {
    setQs(dealHeat(size, cat));
    setI(0);
    setPick(null);
    setLeft(HEAT_SECS);
    setScore(0);
    setStreak(0);
    setMiss([]);
  }

  function answer(choice: string) {
    if (!q || revealed) return;
    setPick(choice);
    const ok = choice === q.answer;
    setStreak((s) => (ok ? s + 1 : 0));
    setScore((n) => n + heatScore(ok, left, ok ? streak : 0));
    if (!ok) setMiss((m) => [...m, q]);
  }

  function next() {
    if (!revealed) return;
    setPick(null);
    setLeft(HEAT_SECS);
    setI((n) => n + 1);
  }

  useEffect(() => {
    if (!q || revealed) return;
    const t = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(t);
          setStreak(0);
          setMiss((m) => (m.some((x) => x.id === q.id) ? m : [...m, q]));
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [q, revealed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (typingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (done) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (!q) return;
      const idx = KEYS.indexOf(e.key as (typeof KEYS)[number]);
      if (idx >= 0 && q.choices[idx] && !revealed) {
        e.preventDefault();
        answer(q.choices[idx]);
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && revealed) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!qs.length) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-heat>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Word Heat</p>
          <p className="mt-1 text-sm text-muted">Shop vocab, projector-size. 1–4 on the keys. Not a grade.</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Bank</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["All", ...GLOSSARY_CATS] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">How many</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {HEAT_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSize(n)}
                className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", size === n ? "bg-gold text-bg" : "bg-elevated text-muted")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={start} className="tw-tap min-h-14 rounded-xl bg-gold px-5 text-lg font-bold text-bg">
          Start heat
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-heat>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Heat done</p>
        <p className="font-display text-5xl font-semibold tracking-tight text-gold">{score}</p>
        <p className="text-sm text-muted">
          {qs.length - miss.length} of {qs.length} right · best streak lives in the run, not the wallet
        </p>
        {miss.length ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Review</p>
            <ul className="mt-1 grid gap-1">
              {miss.map((m) => (
                <li key={m.id} className="rounded-xl bg-elevated px-3 py-2">
                  <span className="font-semibold">{m.term}</span>
                  <span className="mt-0.5 block text-sm text-muted">{m.def}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg font-semibold">Clean heat. Every word stuck.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={start} className="tw-tap min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg">
            Run it again
          </button>
          <button type="button" onClick={() => setQs([])} className="tw-tap min-h-12 rounded-xl bg-elevated px-4 text-base font-semibold">
            Change bank
          </button>
        </div>
      </section>
    );
  }

  if (!q) return null;
  const ok = pick === q.answer;
  const timedOut = left <= 0 && pick === null;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-2" data-vocab-heat data-vocab-play>
      <header className="flex flex-wrap items-center gap-3">
        <ProgressRing pct={(left / HEAT_SECS) * 100} label={`${left}`} sub="sec" tone={left <= 3 ? "warn" : "gold"} size="md" live />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
            Word Heat · {i + 1}/{qs.length} · {q.cat}
          </p>
          <p className="font-mono text-sm text-muted">
            {score} pts{streak > 1 ? ` · streak ${streak}` : ""}
          </p>
        </div>
        <button type="button" onClick={() => setQs([])} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
          End
        </button>
      </header>
      <p className="font-display text-balance text-[clamp(1.6rem,4.2vw,3.25rem)] font-semibold leading-[1.12] tracking-tight">{q.prompt}</p>
      {q.say && q.kind === "def" ? <p className="text-sm text-muted">Say it · {q.say}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {q.choices.map((c, n) => {
          const on = pick === c;
          const right = revealed && c === q.answer;
          const wrong = revealed && on && c !== q.answer;
          return (
            <button
              key={`${q.id}-${n}`}
              type="button"
              disabled={revealed}
              onClick={() => answer(c)}
              className={cn(
                "tw-tap min-h-20 rounded-2xl px-4 py-3 text-left text-lg font-semibold leading-snug",
                right ? "bg-gain text-bg" : wrong ? "bg-cleanup text-accent-fg" : on ? "bg-gold text-bg" : "bg-elevated",
              )}
            >
              <span className="mr-2 font-mono text-sm text-gold">{n + 1}</span>
              {c}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">
            {ok ? "Hit." : timedOut ? "Time." : "Miss."} {q.term}
            {q.say ? ` · ${q.say}` : ""}
          </p>
          <button type="button" onClick={next} className="tw-tap ml-auto min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg">
            Next
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">Keys 1–4. Wall reads the answers from the back row.</p>
      )}
    </section>
  );
}
