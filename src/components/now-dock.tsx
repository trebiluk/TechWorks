import { leftClock, periodClock, periodNow } from "@/lib/bells";
import { useLang } from "@/lib/i18n-hook";
import { useShopClock } from "@/lib/use-clock";
import { BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

export function NowDock({
  schedule,
  lunch,
  onClick,
}: {
  schedule?: string;
  lunch?: string;
  onClick?: () => void;
}) {
  const { t } = useLang();
  const now = useShopClock(schedule, "fine");
  const live = periodNow(schedule, now);
  const clock = live != null ? periodClock(live, schedule, now) : null;
  const hot = Boolean(clock?.cleanup);
  const tick = clock?.live ? leftClock(clock.left).label : "—";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 min-w-0 items-center gap-1.5 rounded-md px-2 sm:min-h-9",
        hot ? "bg-cleanup text-accent-fg" : "bg-elevated",
      )}
      title={t("Now")}
    >
      <span className="hidden text-[10px] font-semibold uppercase tracking-widest opacity-70 sm:inline">{t("Now")}</span>
      <span className="font-display text-sm font-semibold">{live != null ? `P${live}` : "—"}</span>
      {hot ? <BertyPeek pose="point" /> : null}
      <span className="font-mono text-sm tabular-nums">{clock?.live ? tick : t("idle")}</span>
      {lunch ? <span className="hidden max-w-[9rem] truncate text-xs opacity-80 lg:inline">{lunch}</span> : null}
    </button>
  );
}
