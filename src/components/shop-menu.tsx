import type { EconomyFile } from "@/lib/economy";
import { FEATURES, FEATURE_GROUPS, featureOn, setFeature, type FeatureId } from "@/lib/features";
import { commitContrast } from "@/lib/theme";
import { commitDescribe } from "@/lib/describe";
import { commitDemo, storedDemo } from "@/lib/demo";
import { cn } from "@/lib/utils";

const DOORS: { title: string; items: [string, string, FeatureId | ""][] }[] = [
  {
    title: "Open",
    items: [
      ["week", "Week", ""],
      ["teach", "Run the room", "teach"],
      ["words", "Words", "vocab"],
      ["skills", "Skills", ""],
      ["projects", "Projects", "projects"],
      ["clubwall", "Club", "club"],
      ["hallwall", "Hall", "studyhall"],
    ],
  },
  {
    title: "Room",
    items: [
      ["crib", "Crib", "crib"],
      ["prints", "Prints", "prints"],
      ["store", "Store", "store"],
      ["lucky", "Lucky", "lucky"],
      ["crews", "Crews", "crews"],
      ["room", "Theme", ""],
    ],
  },
  {
    title: "Desk",
    items: [
      ["today", "Today", ""],
      ["vault", "Backups", ""],
      ["cloud", "Cloud", ""],
    ],
  },
];

/** One panel. A switch moves. A dim door stays put until its switch is on. */
export function ShopMenu({
  file,
  onChange,
  onGo,
  onHelp,
  onWeb,
  onPaint,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onGo: (id: string) => void;
  onHelp?: () => void;
  onWeb?: () => void;
  onPaint?: (id: FeatureId, on: boolean) => void;
}) {
  function flip(id: FeatureId, on: boolean) {
    onChange(setFeature(file, id, !on));
    const next = !on;
    if (id === "debug") commitDemo(next ? (storedDemo() === "off" ? "week" : storedDemo()) : "off");
    if (id === "tips") commitDescribe(next);
    if (id === "contrast") commitContrast(next);
    onPaint?.(id, next);
  }

  return (
    <div className="tw-shuttle" data-shuttle>
      <header className="tw-shuttle-lead">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Admin</p>
        <h1 className="font-display text-2xl font-semibold">The panel</h1>
        <p className="text-sm text-muted">The knob is the switch. A dim door does nothing until its switch is on.</p>
      </header>
      {FEATURE_GROUPS.map((group) => (
        <section key={group} className="tw-shuttle-bay" data-bay={group}>
          <h2>{group}</h2>
          <div className="tw-shuttle-grid">
            {FEATURES.filter((f) => f.group === group).map((f) => {
              const on = featureOn(file, f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  title={f.hint}
                  onClick={() => flip(f.id, on)}
                  className="tw-switch"
                >
                  <span>{f.label}</span>
                  <span className="tw-switch-track" aria-hidden>
                    <span className="tw-switch-knob" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {DOORS.map((g) => (
        <section key={g.title} className="tw-shuttle-bay" data-bay={g.title}>
          <h2>{g.title}</h2>
          <div className="tw-shuttle-grid">
            {g.items.map(([id, label, need]) => {
              const live = !need || featureOn(file, need);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!live}
                  onClick={() => {
                    if (!live) return;
                    onGo(id);
                  }}
                  className={cn("tw-shuttle-key", !live && "is-off")}
                >
                  {label}
                </button>
              );
            })}
            {g.title === "Desk" && onHelp ? (
              <button type="button" onClick={onHelp} className="tw-shuttle-key">
                Help
              </button>
            ) : null}
            {g.title === "Desk" && onWeb ? (
              <button type="button" onClick={onWeb} className="tw-shuttle-key">
                Web
              </button>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}