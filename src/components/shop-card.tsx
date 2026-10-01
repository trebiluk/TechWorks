import { useEffect, useState } from "react";
import { badgesOf, levelName, recentClears, weekXp, type ProgressMark } from "@/lib/app-progress";
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
  const band = levelName(xp);
  const badges = badgesOf(marks);
  const clears = recentClears(marks);
  const next = [0, 6, 12, 18, 24, 30, 36, 42].find((n) => n > xp) ?? xp + 6;
  const pct = Math.max(8, Math.min(100, Math.round((xp / next) * 100)));

  return (
    <section className="shrink-0 rounded-xl bg-surface p-3" data-shop-card>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-elevated text-3xl" aria-hidden>
          {session.picture || "🐾"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold tracking-tight">{session.alias}</p>
          <p className="text-sm font-semibold text-gold">{band} · {xp} XP</p>
        </div>
        <button type="button" onClick={() => clearShopSession()} className="tw-tap min-h-11 text-sm font-semibold text-muted">
          Sign out
        </button>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-elevated" aria-label={`${xp} XP`}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{week} XP this week</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {badges.length ? badges.map((b) => (
          <span key={b.app} className="inline-flex min-h-11 items-center rounded-full bg-elevated px-3 text-sm font-semibold">
            {b.name} · {b.clears} clear{b.clears === 1 ? "" : "s"} · ★{b.stars}
          </span>
        )) : <span className="text-sm text-muted">No badges yet. Finish a level in an app.</span>}
      </div>
      {clears.length ? (
        <ul className="mt-2 grid gap-1">
          {clears.map((line) => (
            <li key={line} className="text-sm">{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
