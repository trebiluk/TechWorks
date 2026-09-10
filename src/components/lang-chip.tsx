import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { CLASS_LANGS, commitLang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

export function LangChip() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const row = CLASS_LANGS.find((l) => l.id === lang) ?? CLASS_LANGS[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        title={t("Read in your language")}
        aria-label={t("Language")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "tw-hud-btn tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-elevated",
          open || lang !== "en" ? "bg-elevated text-fg" : "text-fg",
        )}
      >
        <Languages className="size-5" />
        <span className="sr-only">{row.native}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl bg-surface p-2 ring-1 ring-border">
          <p className="px-2 pt-1 text-sm font-semibold">{t("Read in your language")}</p>
          <p className="px-2 pb-2 text-xs leading-snug text-muted">{t("Shop words stay English. Help and Words change.")}</p>
          <ul className="grid gap-1">
            {CLASS_LANGS.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  dir={l.dir}
                  onClick={() => {
                    commitLang(l.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "tw-tap flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left",
                    lang === l.id ? "bg-gold text-bg" : "bg-elevated text-fg hover:bg-elevated",
                  )}
                >
                  <span className="w-8 font-mono text-xs font-bold tracking-wider">{l.short}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{l.native}</span>
                    <span className="block text-[11px] opacity-70">{t(l.label)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
