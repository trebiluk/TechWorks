import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { APP_VERSION, VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE, TRADEMARK_NOTICE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { HELP_CATEGORIES, helpMarkdown, searchHelp } from "@/data/help";
import { downloadText } from "@/lib/live";
import { cn } from "@/lib/utils";

export function HelpPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const hits = useMemo(() => {
    const list = searchHelp(q);
    return cat === "All" ? list : list.filter((a) => a.category === cat);
  }, [q, cat]);

  return (
    <div className="tw-scrim fixed inset-0 z-[80] flex items-start justify-center overflow-auto p-4 pt-12">
      <div className="flex max-h-[88dvh] w-full max-w-3xl flex-col rounded-xl bg-surface">
        <header className="flex items-center gap-2 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-subtle">Help · {VERSION_LABEL}</p>
            <p className="mt-0.5 text-[11px] text-muted">{COPYRIGHT_LINE}</p>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search features, PINs, skills, lunch…"
              className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
            />
          </div>
          <button type="button" aria-label="Close help" onClick={onClose} className="size-11 rounded-lg bg-elevated">
            <X className="mx-auto size-4" />
          </button>
        </header>
        <div className="flex flex-wrap gap-1 px-4 py-2">
          {["All", ...HELP_CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn("min-h-9 rounded-md px-2 text-sm", cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {hits.length === 0 ? (
            <p className="py-8 text-sm text-muted">No articles for “{q}”.</p>
          ) : (
            hits.map((a) => (
              <article key={a.id} className="border-t border-border py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle">{a.category}</p>
                <h2 className="mt-1 text-base font-semibold">{a.title}</h2>
                <p className="mt-1 text-sm text-muted">{a.body}</p>
              </article>
            ))
          )}
        </div>
        <footer className="border-t border-border p-3">
          <p className="mb-2 flex items-center gap-2 text-[11px] text-muted">
            <BertyPeek />
            {TRADEMARK_NOTICE}
          </p>
          <button
            type="button"
            onClick={() => downloadText(`TECHWORKS-HELP-v${APP_VERSION}.md`, helpMarkdown(), "text/markdown")}
            className="min-h-11 w-full rounded-md bg-fg text-sm font-semibold text-bg"
          >
            Download help file
          </button>
        </footer>
      </div>
    </div>
  );
}
