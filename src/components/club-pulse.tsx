import { clubPulse, loadClub, type ClubPulse } from "@/lib/club";
import { todayIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function ClubPulse({
  onOpen,
  now,
}: {
  onOpen?: () => void;
  now?: Date;
}) {
  const pulse = useMemo(() => clubPulse(loadClub(), todayIso(), now ?? new Date()), [now]);
  if (!pulse) return null;
  return <ClubPulseCard pulse={pulse} onOpen={onOpen} />;
}

export function ClubPulseCard({ pulse, onOpen }: { pulse: ClubPulse; onOpen?: () => void }) {
  const hot = pulse.kind === "live" || pulse.kind === "cleanup";
  const cancel = pulse.kind === "cancelled";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left",
        cancel ? "bg-elevated" : hot ? (pulse.kind === "cleanup" ? "bg-cleanup text-accent-fg" : "bg-accent text-bg") : "bg-surface ring-1 ring-accent/40",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
          {pulse.kind === "next" ? "Upcoming" : pulse.kind === "cancelled" ? "Notice" : "Tech Club"}
        </span>
        <span className="block font-display text-base font-semibold leading-tight">{pulse.title}</span>
        <span className={cn("block text-sm", hot || cancel ? "opacity-90" : "text-muted")}>{pulse.sub}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide opacity-80">{onOpen ? "Open" : ""}</span>
    </button>
  );
}
