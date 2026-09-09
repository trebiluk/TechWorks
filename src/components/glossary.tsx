import { useMemo, useState } from "react";
import { GLOSSARY_CATS, glossaryLetters, searchGlossary, type GlossaryCat, type GlossaryEntry } from "@/data/glossary";
import { useLang } from "@/lib/i18n-hook";
import { skillTrackOf } from "@/lib/skills";
import { cn } from "@/lib/utils";

export function GlossaryDesk() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GlossaryCat | "All">("All");
  const [pick, setPick] = useState<string>("ppe");
  const { t, lang, gloss } = useLang();
  const hits = useMemo(() => {
    const base = searchGlossary(q, cat);
    if (!q.trim() || lang === "en") return base;
    const n = q.trim().toLowerCase();
    const extra = searchGlossary("", cat).filter((e) => {
      const copy = gloss(e.id, e.def, e.use);
      const blob = `${copy.def} ${copy.use}`.toLowerCase();
      return n.split(/\s+/).every((w) => blob.includes(w));
    });
    const ids = new Set(base.map((e) => e.id));
    return [...base, ...extra.filter((e) => !ids.has(e.id))];
  }, [q, cat, lang, gloss]);
  const letters = useMemo(() => glossaryLetters(), []);
  const card = hits.find((e) => e.id === pick) ?? hits[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 space-y-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Find a word — kerf, grit, proficient…")}
          className="min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {(["All", ...GLOSSARY_CATS] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn("tw-tap min-h-9 rounded-md px-2.5 text-xs font-semibold", cat === c ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              {c === "All" ? t("All") : t(c)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-0.5">
          {letters.map((L) => (
            <button
              key={L}
              type="button"
              onClick={() => {
                const hit = searchGlossary("", cat).find((e) => e.term[0]?.toUpperCase() === L);
                if (hit) setPick(hit.id);
              }}
              className="tw-tap size-8 rounded-md text-xs font-bold text-muted hover:bg-elevated hover:text-fg"
            >
              {L}
            </button>
          ))}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
        {card ? <TermCard entry={card} /> : <p className="text-sm text-muted">{t("No words match.")}</p>}
        <ul className="min-h-0 overflow-auto rounded-xl bg-surface p-2">
          {hits.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setPick(e.id)}
                className={cn("tw-tap flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-2 text-left", card?.id === e.id ? "bg-elevated text-fg" : "text-muted")}
              >
                <span className="font-semibold">{e.term}</span>
                <span className="text-[10px] uppercase tracking-wider text-subtle">{t(e.cat)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TermCard({ entry }: { entry: GlossaryEntry }) {
  const skill = entry.skill ? skillTrackOf(entry.skill) : undefined;
  const { t, gloss } = useLang();
  const copy = gloss(entry.id, entry.def, entry.use);
  return (
    <article className="tw-gadget tw-hud flex min-h-0 flex-col overflow-auto p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">{t(entry.cat)}</p>
      <h2 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{entry.term}</h2>
      {entry.say ? <p className="mt-1 font-mono text-sm text-gold">say · {entry.say}</p> : null}
      <p className="mt-4 text-lg leading-snug text-fg sm:text-xl">{copy.def}</p>
      <p className="mt-3 rounded-lg bg-elevated px-3 py-2 text-sm text-muted">
        <span className="font-semibold text-fg">{t("In the shop")}. </span>
        {copy.use}
      </p>
      {skill ? <p className="mt-3 text-xs uppercase tracking-wider text-subtle">Skill · {skill.name}</p> : null}
    </article>
  );
}
