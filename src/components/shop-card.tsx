import { useEffect, useState } from "react";
import { badgesOf, weekXp, type ProgressMark } from "@/lib/app-progress";
import { doorName } from "@/lib/hub-doors";
import { LEVEL_MAX, XP_PER_LEVEL } from "@/lib/skills";
import { clearShopSession, loadShopSession, type ShopSession } from "@/lib/shop-session";

export function ShopName() {
  const [alias, setAlias] = useState("");
  useEffect(() => {
    const sync = () => setAlias(loadShopSession()?.alias ?? "");
    sync();
    window.addEventListener("tw-shop", sync);
    return () => window.removeEventListener("tw-shop", sync);
  }, []);
  if (!alias) return null;
  return <span className="max-w-32 truncate text-sm font-semibold">{alias}</span>;
}
export function ShopCard({ pinned = false }: { pinned?: boolean }) {
  const [session, setSession] = useState<ShopSession | null>(null);
  const [marks, setMarks] = useState<ProgressMark[]>([]);

  useEffect(() => {
    const sync = () => setSession(loadShopSession());
    sync();
    window.addEventListener("tw-shop", sync);
    return () => window.removeEventListener("tw-shop", sync);
  }, []);

  useEffect(() => {
    if (!session) return;
    let stop = false;
    void fetch(`/api/marks?code=${encodeURIComponent(session.code)}`)
      .then((res) => res.json())
      .then((body: { marks?: ProgressMark[] }) => {
        if (!stop) setMarks(Array.isArray(body.marks) ? body.marks : []);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [session]);

  if (!session) return pinned ? null : <p className="text-sm text-muted">Sign in with your code to see your card.</p>;

  const xp = marks.reduce((sum, row) => sum + Math.max(0, Number(row.xp) || 0), 0);
  const week = weekXp(marks);
  const level = Math.min(LEVEL_MAX, Math.floor(xp / XP_PER_LEVEL) + 1);
  const badges = badgesOf(marks);
  const rows = marks
    .slice()
    .sort((a, b) => Date.parse(b.ts || "") - Date.parse(a.ts || ""))
    .slice(0, 5);

  return (
    <section className="shrink-0 rounded-xl bg-surface p-3" data-shop-card data-alias={session.alias}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-elevated text-3xl" aria-hidden>
          {session.picture || "🐾"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight tracking-tight">{session.alias} · {xp} XP · Level {level}</p>
          <p className="text-xs text-muted">{week} XP this week</p>
        </div>
        <button type="button" onClick={() => clearShopSession()} className="tw-tap min-h-11 text-sm font-semibold text-muted">
          Sign out
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {badges.length ? badges.map((b) => (
          <span key={b.app} className="inline-flex min-h-11 items-center rounded-full bg-elevated px-3 text-sm font-semibold">
            {b.name} · {b.clears} clear{b.clears === 1 ? "" : "s"} · ★{b.stars}
          </span>
        )) : <span className="text-sm text-muted">No badges yet. Finish a level in an app.</span>}
      </div>
      {rows.length ? (
        <ul className="mt-2 grid gap-1">
          {rows.map((row, i) => {
            const stars = Math.max(0, Number(row.stars) || 0);
            const score = Number(row.score) || 0;
            const max = Number(row.max) || 0;
            return (
              <li key={`${row.app}-${row.ts}-${i}`} className="flex min-h-11 items-center gap-2">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-elevated text-xs font-bold" aria-hidden>
                  {doorName(row.app || "").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{doorName(row.app || "")}</span>
                <span className="text-sm text-gold">{"★".repeat(Math.min(5, stars)) || "—"}</span>
                {max ? <span className="font-mono text-sm">{score}/{max}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
