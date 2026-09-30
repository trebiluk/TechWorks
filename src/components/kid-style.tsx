import { useEffect, useState } from "react";
import { Bolt, Cog, Shield, Star } from "lucide-react";
import { KID_BENCHES, KID_STICKERS, kidBlip, loadKidStyle, nextBuild, saveKidStyle, type KidStyle } from "@/lib/kid-style";
import { cn } from "@/lib/utils";

const ICON = {
  gear: Cog,
  bolt: Bolt,
  star: Star,
  shield: Shield,
} as const;

/** Signed-out Chromebook. Pick a look. The build name is from a list, never typed. */
export function KidStyleBar() {
  const [style, setStyle] = useState<KidStyle>(() => loadKidStyle());
  const [pop, setPop] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.kidBench = style.bench;
    return () => {
      delete document.documentElement.dataset.kidBench;
    };
  }, [style.bench]);

  function set(next: KidStyle) {
    setStyle(saveKidStyle(next));
    setPop(true);
    if (next.sound) kidBlip();
    window.setTimeout(() => setPop(false), 200);
  }

  const Mark = ICON[style.sticker];

  return (
    <section className={cn("tw-kid-style shrink-0 rounded-xl bg-surface p-2", pop && "tw-pop")} data-kid-style>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">My style</p>
        <span className="inline-flex min-h-11 items-center gap-1 rounded-full bg-elevated px-3 text-sm font-semibold">
          <Mark className="size-4" aria-hidden />
          {style.build}
        </span>
        <button
          type="button"
          className="tw-tap min-h-11 rounded-full bg-elevated px-3 text-sm font-semibold"
          onClick={() => set({ ...style, build: nextBuild(style.build) })}
        >
          Next build
        </button>
        <button
          type="button"
          aria-pressed={style.sound}
          className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", style.sound ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          onClick={() => set({ ...style, sound: !style.sound })}
        >
          Sound {style.sound ? "on" : "off"}
        </button>
      </div>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="Bench color">
        {KID_BENCHES.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={b.label}
            aria-pressed={style.bench === b.id}
            onClick={() => set({ ...style, bench: b.id })}
            className={cn("tw-tap tw-kid-swatch min-h-11 min-w-11 rounded-full", style.bench === b.id && "ring-2 ring-fg")}
            data-swatch={b.id}
          />
        ))}
        {KID_STICKERS.map((s) => {
          const Icon = ICON[s.id];
          return (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              aria-pressed={style.sticker === s.id}
              onClick={() => set({ ...style, sticker: s.id })}
              className={cn("tw-tap inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-elevated", style.sticker === s.id && "bg-fg text-bg")}
            >
              <Icon className="size-5" aria-hidden />
            </button>
          );
        })}
      </div>
    </section>
  );
}
