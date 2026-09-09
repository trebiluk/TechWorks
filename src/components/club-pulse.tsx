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
        "flex w-full items-center gap-3 rounded-full px-3 py-1.5 text-left",
        cancel ? "bg-elevated" : hot ? (pulse.kind === "cleanup" ? "bg-cleanup text-accent-fg" : "bg-accent text-bg") : "bg-elevated",
      )}
    >
      <span className="min-w-0 truncate font-display text-sm font-semibold">
        {pulse.title}
        <span className={cn("ml-2 font-sans text-xs font-medium", hot || cancel ? "opacity-80" : "text-muted")}>{pulse.sub}</span>
      </span>
    </button>
  );
}
