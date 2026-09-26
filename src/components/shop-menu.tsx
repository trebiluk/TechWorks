const GROUPS: { title: string; hint: string; items: [string, string][] }[] = [
  {
    title: "Show",
    hint: "After the hour is written",
    items: [
      ["week", "Week"],
      ["clubwall", "Club"],
      ["hallwall", "Hall"],
      ["teach", "Run the room"],
    ],
  },
  {
    title: "Class",
    hint: "Words, skills, and longer makes",
    items: [
      ["words", "Words"],
      ["skills", "Skills"],
      ["projects", "Projects"],
    ],
  },
  {
    title: "Room",
    hint: "The shop around the lesson",
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
    hint: "This computer",
    items: [
      ["today", "Today"],
      ["vault", "Backups"],
      ["cloud", "Cloud"],
    ],
  },
];

/** The wrench. One list. Nothing here is also a button on the wall. */
export function ShopMenu({
  onGo,
  onHelp,
  onWeb,
}: {
  onGo: (id: string) => void;
  onHelp?: () => void;
  onWeb?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-2">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Admin</p>
        <h1 className="font-display text-2xl font-semibold">One wrench</h1>
        <p className="mt-1 text-sm text-muted">Wall, This hour, Score, and People stay on the bar. Everything else is here.</p>
      </header>
      {GROUPS.map((g) => (
        <section key={g.title} className="grid gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">{g.title}</h2>
            <p className="text-xs text-muted">{g.hint}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {g.items.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onGo(id)}
                className="tw-tap min-h-11 rounded-2xl bg-elevated px-3 text-left text-sm font-semibold"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        {onHelp ? (
          <button type="button" onClick={onHelp} className="tw-tap min-h-11 rounded-2xl bg-elevated px-4 text-sm font-semibold">
            Help
          </button>
        ) : null}
        {onWeb ? (
          <button type="button" onClick={onWeb} className="tw-tap min-h-11 rounded-2xl bg-elevated px-4 text-sm font-semibold">
            Web
          </button>
        ) : null}
      </div>
    </div>
  );
}