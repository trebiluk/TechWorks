import { useState } from "react";

const FIRST: { title: string; hint: string; items: [string, string][] }[] = [
  {
    title: "Show",
    hint: "After the hour is written",
    items: [
      ["week", "Week"],
      ["clubwall", "Club"],
      ["hallwall", "Hall"],
    ],
  },
  {
    title: "Class",
    hint: "Run the room, or the words",
    items: [
      ["teach", "Run the room"],
      ["words", "Words"],
    ],
  },
  {
    title: "Desk",
    hint: "Today and the backup",
    items: [
      ["today", "Today"],
      ["vault", "Backups"],
    ],
  },
];

const MORE: [string, string][] = [
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["crib", "Crib"],
  ["prints", "Prints"],
  ["store", "Store"],
  ["lucky", "Lucky"],
  ["crews", "Crews"],
  ["room", "Theme"],
];

/** Every door that is not Wall, This hour, Score, or People. */
export function ShopMenu({ onGo }: { onGo: (id: string) => void }) {
  const [more, setMore] = useState(false);
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-2">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Shop</p>
        <h1 className="font-display text-2xl font-semibold">The other jobs</h1>
        <p className="mt-1 text-sm text-muted">The hour is This hour. The grade is on People.</p>
      </header>
      {FIRST.map((g) => (
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
      <button type="button" onClick={() => setMore((v) => !v)} className="tw-tap min-h-11 text-left text-sm font-semibold text-muted">
        {more ? "Less" : "More"}
      </button>
      {more ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MORE.map(([id, label]) => (
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
      ) : null}
    </div>
  );
}
