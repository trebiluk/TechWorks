import type { EconomyFile } from "@/lib/economy";
import { FEATURES, FEATURE_GROUPS, featureOn, setFeature } from "@/lib/features";
import { cn } from "@/lib/utils";

const DOORS: { title: string; items: [string, string][] }[] = [
  {
    title: "Open",
    items: [
      ["week", "Week"],
      ["teach", "Run the room"],
      ["words", "Words"],
      ["skills", "Skills"],
      ["projects", "Projects"],
      ["clubwall", "Club"],
      ["hallwall", "Hall"],
    ],
  },
  {
    title: "Room",
    items: [
      ["crib", "Crib"],
      ["prints", "Prints"],
      ["store", "Store"],
      ["lucky", "Lucky"],
      ["crews", "Crews"],
      ["room", "Theme"],
    ],
  },
  {
    title: "Desk",
    items: [
      ["today", "Today"],
      ["vault", "Backups"],
      ["cloud", "Cloud"],
    ],
  },
];

/** One panel. Switches and doors, grouped, all visible. */
export function ShopMenu({
  file,
  onChange,
  onGo,
  onHelp,
  onWeb,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onGo: (id: string) => void;
  onHelp?: () => void;
  onWeb?: () => void;
}) {
  return (
    <div className="tw-shuttle" data-shuttle>
      <header className="tw-shuttle-lead">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Admin</p>
        <h1 className="font-display text-2xl font-semibold">The panel</h1>
        <p className="text-sm text-muted">On is lit. Off is dim. Open is a door.</p>
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
                  aria-pressed={on}
                  title={f.hint}
                  onClick={() => onChange(setFeature(file, f.id, !on))}
                  className={cn("tw-shuttle-key", on && "is-on")}
                >
                  {f.label}
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
            {g.items.map(([id, label]) => (
              <button key={id} type="button" onClick={() => onGo(id)} className="tw-shuttle-key">
                {label}
              </button>
            ))}
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