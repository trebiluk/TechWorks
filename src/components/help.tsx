import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { APP_VERSION, VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE, TRADEMARK_NOTICE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { HELP_CATEGORIES, helpMarkdown, searchHelp } from "@/data/help";
import { useLang } from "@/lib/i18n-hook";
import { downloadText } from "@/lib/live";
import { cn } from "@/lib/utils";

function WelcomeArea({ wallOnly }: { wallOnly?: boolean }) {
  const { t } = useLang();
  return (
    <section className="mb-4 rounded-2xl bg-elevated p-4">
      <div className="flex items-start gap-3">
        <BertyPeek pose="waving" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{t("Welcome")}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("What is TechWorks?")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("This is a real workshop class. You build in a crew. You get better at tools and teamwork. The board is a scoreboard for that work — friendly, not a report card on the wall.")}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { k: t("Gold XP"), v: t("Skill. Measure, cut, finish, teach a friend. This is the main thing.") },
          { k: t("Class $"), v: t("Perks for showing up and doing the job. A game. Not your grade.") },
          { k: "3 · 2 · 1", v: t("Crew lead: on the job, needs a nudge, or not with the crew.") },
          { k: t("Coral"), v: t("Cleanup time. Tools, scraps, seats. Berty will point.") },
        ].map((row) => (
          <li key={row.k} className="rounded-xl bg-surface px-3 py-2">
            <p className="text-sm font-semibold">{row.k}</p>
            <p className="text-xs leading-relaxed text-muted">{row.v}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {t("Names on the projector are shop aliases. Families: tap a name → Family for the real project grade in plain words.")}
        {wallOnly ? "" : " Teachers: Unlock desk for scoring, skills, and the store."}
      </p>
    </section>
  );
}

export function HelpPanel({ onClose, wallOnly }: { onClose: () => void; wallOnly?: boolean }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Welcome");
  const { t, lang, article } = useLang();
  const hits = useMemo(() => {
    const list = searchHelp(q, wallOnly);
    const shown = cat === "All" ? [...list] : list.filter((a) => a.category === cat);
    if (!q.trim() || lang === "en") return shown;
    const n = q.trim().toLowerCase();
    const extra = searchHelp("", wallOnly).filter((a) => {
      const copy = article(a.id, a.title, a.body);
      const blob = `${copy.title} ${copy.body}`.toLowerCase();
      return n.split(/\s+/).every((w) => blob.includes(w));
    });
    const ids = new Set(shown.map((a) => a.id));
    for (const a of extra) if (!ids.has(a.id) && (cat === "All" || a.category === cat)) shown.push(a);
    return shown;
  }, [q, cat, wallOnly, lang, article]);
  const cats = wallOnly ? ["All", "Welcome", "Wall"] : ["All", ...HELP_CATEGORIES];

  return (
    <div className="tw-scrim fixed inset-0 z-[80] flex items-start justify-center overflow-auto p-4 pt-12">
      <div className="tw-gadget tw-hud flex max-h-[88dvh] w-full max-w-3xl flex-col bg-surface">
        <header className="flex items-center gap-2 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-subtle">
              {wallOnly ? t("How this class works") : `Help · ${VERSION_LABEL}`}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">{COPYRIGHT_LINE}</p>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={wallOnly ? `${t("What is TechWorks?")} XP, ${t("Cleanup")}…` : `${t("What is TechWorks?")} PIN, ${t("Skills")}…`}
              className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
            />
          </div>
          <button type="button" aria-label="Close help" onClick={onClose} className="size-11 rounded-lg bg-elevated">
            <X className="mx-auto size-4" />
          </button>
        </header>
        <div className="flex flex-wrap gap-1 px-4 py-2">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn("min-h-9 rounded-md px-2 text-sm", cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {c === "All" ? t("All") : t(c)}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {!q.trim() && (cat === "All" || cat === "Welcome" || cat === "Wall") ? <WelcomeArea wallOnly={wallOnly} /> : null}
          {hits.length === 0 ? (
            <p className="py-8 text-sm text-muted">{t("No articles for")} “{q}”.</p>
          ) : (
            hits
              .filter((a) => q.trim() || cat === "Welcome" || a.category !== "Welcome")
              .map((a) => {
                const copy = article(a.id, a.title, a.body);
                return (
              <article key={a.id} className="border-t border-border py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle">{t(a.category)}</p>
                <h2 className="mt-1 text-base font-semibold">{copy.title}</h2>
                <p className="mt-1 text-sm text-muted">{copy.body}</p>
              </article>
                );
              })
            )}
        </div>
        <footer className="border-t border-border p-3">
          <p className="mb-2 flex items-center gap-2 text-[11px] text-muted">
            <BertyPeek />
            {TRADEMARK_NOTICE}
          </p>
          {wallOnly ? null : (
          <button
            type="button"
            onClick={() => downloadText(`TECHWORKS-HELP-v${APP_VERSION}.md`, helpMarkdown(), "text/markdown")}
            className="min-h-11 w-full rounded-md bg-fg text-sm font-semibold text-bg"
          >
            Download help file
          </button>
          )}
        </footer>
      </div>
    </div>
  );
}
