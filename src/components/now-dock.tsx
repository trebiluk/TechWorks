import { leftClock, periodClock, periodNow } from "@/lib/bells";
import { useLang } from "@/lib/i18n-hook";
import { useShopClock } from "@/lib/use-clock";
import { BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

export function NowDock({
  schedule,
  lunch,
  onClick,
  liveOnly,
}: {
  schedule?: string;
  lunch?: string;
  onClick?: () => void;
  liveOnly?: boolean;
}) {
  const { t } = useLang();
  const now = useShopClock(schedule, "fine");
  const live = periodNow(schedule, now);
  const clock = live != null ? periodClock(live, schedule, now) : null;
  if (liveOnly && (live == null || !clock?.live)) return null;
  const hot = Boolean(clock?.cleanup);
  const tick = clock?.live ? leftClock(clock.left).label : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tw-hud-btn tw-tap relative z-30 flex min-h-12 min-w-0 items-center gap-1.5 rounded-md px-2 text-sm",
        hot ? "bg-cleanup text-accent-fg" : "bg-elevated",
      )}
      title={t("Now")}
    >
      <span aria-hidden>⏱</span>
      <span className="font-semibold">{live != null ? `P${live}` : t("Now")}</span>
      {hot ? <BertyPeek pose="point" /> : null}
      {clock?.live ? <span className="font-mono text-sm tabular-nums">{tick} {t("left")}</span> : null}
      {lunch ? <span className="max-w-[9rem] truncate text-xs opacity-80">{lunch}</span> : null}
    </button>
  );
}
