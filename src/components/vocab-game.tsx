import { useEffect, useState } from "react";
import { GLOSSARY_CATS, type GlossaryCat, type GlossaryEntry } from "@/data/glossary";
import {
  dealFlash,
  dealHeat,
  dealHeatFrom,
  dealMatch,
  FLASH_SIZES,
  heatScore,
  HEAT_SECS,
  HEAT_SIZES,
  MATCH_SIZES,
  spellOk,
  type MatchTile,
  type VocabQ,
} from "@/lib/vocab-game";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4"] as const;
type GameId = "heat" | "match" | "flash" | "spell";

function typingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return Boolean(el.closest("input, textarea, select, [contenteditable], [role='textbox']"));
}

function BankChips({ cat, onCat }: { cat: GlossaryCat | "All"; onCat: (c: GlossaryCat | "All") => void }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Bank</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {(["All", ...GLOSSARY_CATS] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCat(c)}
            className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeChips<T extends number>({ sizes, size, onSize }: { sizes: readonly T[]; size: T; onSize: (n: T) => void }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">How many</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {sizes.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSize(n)}
            className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", size === n ? "bg-gold text-bg" : "bg-elevated text-muted")}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function BackGames({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
      All games
    </button>
  );
}

const GAMES: { id: GameId; name: string; blurb: string }[] = [
  { id: "heat", name: "Word Heat", blurb: "Timed 1–4. Streak score this run." },
  { id: "match", name: "Match", blurb: "Tap a term, then its meaning." },
  { id: "flash", name: "Flash", blurb: "Projector cards. Got it / Again." },
  { id: "spell", name: "Spell", blurb: "Type the shop word from the definition." },
];

function GamePicker({ onPick }: { onPick: (id: GameId) => void }) {
  return (
    <section className="tw-gadget space-y-3 p-4" data-vocab-games>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Shop games</p>
        <p className="mt-1 text-sm text-muted">Same bank as Words. Not a grade. Not wallet.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(g.id)}
            className="tw-tap min-h-24 rounded-2xl bg-elevated px-4 py-3 text-left"
          >
            <p className="font-display text-2xl font-semibold tracking-tight text-gold">{g.name}</p>
            <p className="mt-1 text-sm text-muted">{g.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function VocabGame() {
  const [game, setGame] = useState<GameId | null>(null);
  const [seed, setSeed] = useState<string[] | undefined>(undefined);

  if (!game) return <GamePicker onPick={(id) => { setSeed(undefined); setGame(id); }} />;
  if (game === "heat") return <HeatRun seed={seed} onBack={() => { setGame(null); setSeed(undefined); }} />;
  if (game === "match") return <MatchRun onBack={() => setGame(null)} />;
  if (game === "flash") {
    return (
      <FlashRun
        onBack={() => setGame(null)}
        onHeat={(ids) => {
          setSeed(ids);
          setGame("heat");
        }}
      />
    );
  }
  return <SpellRun onBack={() => setGame(null)} />;
}

function HeatRun({ seed, onBack }: { seed?: string[]; onBack: () => void }) {
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [size, setSize] = useState<(typeof HEAT_SIZES)[number]>(10);
  const [qs, setQs] = useState<VocabQ[]>([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [left, setLeft] = useState(HEAT_SECS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [miss, setMiss] = useState<VocabQ[]>([]);
  const [useSeed, setUseSeed] = useState(Boolean(seed?.length));

  const q = qs[i];
  const done = qs.length > 0 && i >= qs.length;
  const revealed = pick !== null || (Boolean(q) && left <= 0);

  function start() {
    setQs(useSeed && seed?.length ? dealHeatFrom(seed, cat) : dealHeat(size, cat));
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
    if (!seed?.length) return;
    setUseSeed(true);
    setQs(dealHeatFrom(seed, cat));
    setI(0);
    setPick(null);
    setLeft(HEAT_SECS);
    setScore(0);
    setStreak(0);
    setMiss([]);
  }, [seed]);

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
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Word Heat</p>
            <p className="mt-1 text-sm text-muted">Shop vocab, projector-size. 1–4 on the keys. Not a grade.</p>
          </div>
          <BackGames onBack={onBack} />
        </div>
        <BankChips cat={cat} onCat={setCat} />
        <SizeChips sizes={HEAT_SIZES} size={size} onSize={setSize} />
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
          <button type="button" onClick={() => { setUseSeed(false); setQs([]); }} className="tw-tap min-h-12 rounded-xl bg-elevated px-4 text-base font-semibold">
            Change bank
          </button>
          <BackGames onBack={onBack} />
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
        <button type="button" onClick={() => { setUseSeed(false); setQs([]); }} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
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

function MatchRun({ onBack }: { onBack: () => void }) {
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [size, setSize] = useState<(typeof MATCH_SIZES)[number]>(6);
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [misses, setMisses] = useState(0);

  const pairs = tiles.length / 2;
  const done = tiles.length > 0 && matched.length === pairs;

  function start() {
    setTiles(dealMatch(size, cat));
    setPicked(null);
    setMatched([]);
    setWrong(null);
    setMisses(0);
  }

  function tap(key: string) {
    if (done || wrong) return;
    const tile = tiles.find((t) => t.key === key);
    if (!tile || matched.includes(tile.pair)) return;
    if (!picked) {
      setPicked(key);
      return;
    }
    if (picked === key) {
      setPicked(null);
      return;
    }
    const a = tiles.find((t) => t.key === picked);
    if (!a) {
      setPicked(key);
      return;
    }
    if (a.pair === tile.pair && a.face !== tile.face) {
      setMatched((m) => [...m, tile.pair]);
      setPicked(null);
      return;
    }
    setWrong([picked, key]);
    setMisses((n) => n + 1);
    setPicked(null);
  }

  useEffect(() => {
    if (!wrong) return;
    const t = window.setTimeout(() => setWrong(null), 700);
    return () => window.clearTimeout(t);
  }, [wrong]);

  if (!tiles.length) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-match>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Match</p>
            <p className="mt-1 text-sm text-muted">Tap a term, then the meaning that belongs with it. Not a grade.</p>
          </div>
          <BackGames onBack={onBack} />
        </div>
        <BankChips cat={cat} onCat={setCat} />
        <SizeChips sizes={MATCH_SIZES} size={size} onSize={setSize} />
        <button type="button" onClick={start} className="tw-tap min-h-14 rounded-xl bg-gold px-5 text-lg font-bold text-bg">
          Deal pairs
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-match>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Match done</p>
        <p className="font-display text-5xl font-semibold tracking-tight text-gold">{pairs}</p>
        <p className="text-sm text-muted">
          {pairs} pairs · {misses} miss{misses === 1 ? "" : "es"} · not the wallet
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={start} className="tw-tap min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg">
            Deal again
          </button>
          <button type="button" onClick={() => setTiles([])} className="tw-tap min-h-12 rounded-xl bg-elevated px-4 text-base font-semibold">
            Change bank
          </button>
          <BackGames onBack={onBack} />
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-2" data-vocab-match data-vocab-play>
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
            Match · {matched.length}/{pairs}
            {misses ? ` · ${misses} miss` : ""}
          </p>
        </div>
        <button type="button" onClick={() => setTiles([])} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
          End
        </button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 lg:grid-cols-3">
        {tiles.map((t) => {
          const on = picked === t.key;
          const hit = matched.includes(t.pair);
          const miss = Boolean(wrong?.includes(t.key));
          return (
            <button
              key={t.key}
              type="button"
              disabled={hit || Boolean(wrong)}
              onClick={() => tap(t.key)}
              className={cn(
                "tw-tap min-h-24 rounded-2xl px-3 py-3 text-left",
                hit ? "bg-gain text-bg" : miss ? "bg-cleanup text-accent-fg" : on ? "bg-gold text-bg" : "bg-elevated",
              )}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{t.face === "term" ? "Term" : "Means"}</p>
              <p className={cn("mt-1 font-semibold leading-snug", t.face === "term" ? "font-display text-2xl tracking-tight" : "text-base")}>{t.text}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FlashRun({ onBack, onHeat }: { onBack: () => void; onHeat: (ids: string[]) => void }) {
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [size, setSize] = useState<(typeof FLASH_SIZES)[number]>(12);
  const [cards, setCards] = useState<GlossaryEntry[]>([]);
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [again, setAgain] = useState<GlossaryEntry[]>([]);

  const card = cards[i];
  const done = cards.length > 0 && i >= cards.length;

  function start() {
    setCards(dealFlash(size, cat));
    setI(0);
    setShow(false);
    setAgain([]);
  }

  function mark(keep: boolean) {
    if (!card || !show) return;
    if (keep) setAgain((a) => (a.some((x) => x.id === card.id) ? a : [...a, card]));
    setShow(false);
    setI((n) => n + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (typingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!card || done) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!show) setShow(true);
        return;
      }
      if (!show) return;
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        mark(false);
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        mark(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cards.length) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-flash>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Flash</p>
            <p className="mt-1 text-sm text-muted">Big cards for the wall. Tap to flip. Got it or Again. Not a grade.</p>
          </div>
          <BackGames onBack={onBack} />
        </div>
        <BankChips cat={cat} onCat={setCat} />
        <SizeChips sizes={FLASH_SIZES} size={size} onSize={setSize} />
        <button type="button" onClick={start} className="tw-tap min-h-14 rounded-xl bg-gold px-5 text-lg font-bold text-bg">
          Flip the deck
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-flash>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Flash done</p>
        <p className="font-display text-5xl font-semibold tracking-tight text-gold">{cards.length - again.length}/{cards.length}</p>
        <p className="text-sm text-muted">Got it this pass. Again pile is for Heat, not the wallet.</p>
        {again.length ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Again</p>
            <ul className="mt-1 grid gap-1">
              {again.map((m) => (
                <li key={m.id} className="rounded-xl bg-elevated px-3 py-2">
                  <span className="font-semibold">{m.term}</span>
                  <span className="mt-0.5 block text-sm text-muted">{m.def}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg font-semibold">Clean pass. Every card stuck.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {again.length ? (
            <button type="button" onClick={() => onHeat(again.map((a) => a.id))} className="tw-tap min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg">
              Heat the again pile
            </button>
          ) : null}
          <button type="button" onClick={start} className="tw-tap min-h-12 rounded-xl bg-elevated px-4 text-base font-semibold">
            Flip again
          </button>
          <BackGames onBack={onBack} />
        </div>
      </section>
    );
  }

  if (!card) return null;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-2" data-vocab-flash data-vocab-play>
      <header className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-wider text-gold">
          Flash · {i + 1}/{cards.length} · {card.cat}
        </p>
        <button type="button" onClick={() => setCards([])} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
          End
        </button>
      </header>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="tw-tap tw-gadget flex min-h-0 flex-1 flex-col justify-center px-5 py-6 text-left"
      >
        <p className="font-display text-balance text-[clamp(2.4rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-tight">{card.term}</p>
        {card.say ? <p className="mt-2 font-mono text-sm text-gold">say · {card.say}</p> : null}
        {show ? (
          <>
            <p className="mt-6 text-[clamp(1.15rem,3vw,1.85rem)] font-semibold leading-snug">{card.def}</p>
            <p className="mt-3 text-base text-muted">
              <span className="font-semibold text-fg">In the shop. </span>
              {card.use}
            </p>
          </>
        ) : (
          <p className="mt-8 text-sm text-muted">Tap the card · Space to flip. Crew can shout first.</p>
        )}
      </button>
      {show ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => mark(false)} className="tw-tap min-h-14 flex-1 rounded-xl bg-gold px-4 text-lg font-bold text-bg">
            Got it
          </button>
          <button type="button" onClick={() => mark(true)} className="tw-tap min-h-14 flex-1 rounded-xl bg-elevated px-4 text-lg font-semibold">
            Again
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SpellRun({ onBack }: { onBack: () => void }) {
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [size, setSize] = useState<(typeof HEAT_SIZES)[number]>(10);
  const [cards, setCards] = useState<GlossaryEntry[]>([]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [hit, setHit] = useState(false);
  const [miss, setMiss] = useState<GlossaryEntry[]>([]);

  const card = cards[i];
  const done = cards.length > 0 && i >= cards.length;

  function start() {
    setCards(dealFlash(size, cat));
    setI(0);
    setTyped("");
    setRevealed(false);
    setHit(false);
    setMiss([]);
  }

  function check() {
    if (!card || revealed) return;
    const ok = spellOk(typed, card.term);
    setHit(ok);
    setRevealed(true);
    if (!ok) setMiss((m) => [...m, card]);
  }

  function next() {
    if (!revealed) return;
    setTyped("");
    setRevealed(false);
    setHit(false);
    setI((n) => n + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (done) {
        if (e.key === "Enter") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (!card) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (revealed) next();
        else check();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cards.length) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-spell>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Spell</p>
            <p className="mt-1 text-sm text-muted">Type the shop word. Kerf is kerf — the say-alike does not count. Not a grade.</p>
          </div>
          <BackGames onBack={onBack} />
        </div>
        <BankChips cat={cat} onCat={setCat} />
        <SizeChips sizes={HEAT_SIZES} size={size} onSize={setSize} />
        <button type="button" onClick={start} className="tw-tap min-h-14 rounded-xl bg-gold px-5 text-lg font-bold text-bg">
          Start spell
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="tw-gadget space-y-3 p-4" data-vocab-spell>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Spell done</p>
        <p className="font-display text-5xl font-semibold tracking-tight text-gold">
          {cards.length - miss.length}/{cards.length}
        </p>
        <p className="text-sm text-muted">Right spellings this run. Not the wallet.</p>
        {miss.length ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Review</p>
            <ul className="mt-1 grid gap-1">
              {miss.map((m) => (
                <li key={m.id} className="rounded-xl bg-elevated px-3 py-2">
                  <span className="font-semibold">{m.term}</span>
                  {m.say ? <span className="ml-2 font-mono text-sm text-gold">say · {m.say}</span> : null}
                  <span className="mt-0.5 block text-sm text-muted">{m.def}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg font-semibold">Clean spell. Every letter stuck.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={start} className="tw-tap min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg">
            Spell again
          </button>
          <button type="button" onClick={() => setCards([])} className="tw-tap min-h-12 rounded-xl bg-elevated px-4 text-base font-semibold">
            Change bank
          </button>
          <BackGames onBack={onBack} />
        </div>
      </section>
    );
  }

  if (!card) return null;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-2" data-vocab-spell data-vocab-play>
      <header className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-wider text-gold">
          Spell · {i + 1}/{cards.length} · {card.cat}
        </p>
        <button type="button" onClick={() => setCards([])} className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-xs font-semibold">
          End
        </button>
      </header>
      <p className="font-display text-balance text-[clamp(1.6rem,4.2vw,3.25rem)] font-semibold leading-[1.12] tracking-tight">{card.def}</p>
      <p className="text-sm text-muted">Shop word. Hyphens and caps do not matter.</p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (revealed) next();
          else check();
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={revealed}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          placeholder="type it"
          className="min-h-14 min-w-48 flex-1 rounded-2xl bg-elevated px-4 font-display text-2xl font-semibold outline-none"
        />
        <button type="submit" className="tw-tap min-h-14 rounded-xl bg-gold px-5 text-lg font-bold text-bg">
          {revealed ? "Next" : "Check"}
        </button>
      </form>
      {revealed ? (
        <p className={cn("text-lg font-semibold", hit ? "text-gain" : "text-cleanup")}>
          {hit ? "Hit." : "Miss."} {card.term}
          {card.say ? ` · say ${card.say}` : ""}
        </p>
      ) : null}
    </section>
  );
}
