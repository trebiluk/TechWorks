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
        "tw-tap flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-2xl px-3 py-2 text-left",
        cancel ? "bg-elevated" : hot ? (pulse.kind === "cleanup" ? "bg-cleanup text-accent-fg" : "bg-accent text-bg") : "bg-elevated",
      )}
    >
      <span className="w-full truncate font-display text-sm font-semibold">{pulse.title}</span>
      <span className={cn("w-full truncate font-sans text-xs font-medium", hot || cancel ? "opacity-80" : "text-muted")}>{pulse.sub}</span>
    </button>
  );
}
