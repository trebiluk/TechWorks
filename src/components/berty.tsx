import { BERTY_LABEL, BERTY_SRC, bertyPose, showBerty, type BertyCue, type BertyPose } from "@/lib/berty";
import { cn } from "@/lib/utils";

const PX: Record<"icon" | "sm" | "md" | "lg" | "xl", number> = {
  icon: 24,
  sm: 44,
  md: 64,
  lg: 88,
  xl: 148,
};

export function Berty({
  pose,
  size = "md",
  float,
  corner = "br",
  alert,
  className,
}: {
  pose: BertyPose;
  size?: "icon" | "sm" | "md" | "lg" | "xl";
  float?: boolean;
  corner?: "br" | "bl" | "tr" | "tl";
  alert?: boolean;
  className?: string;
}) {
  const px = PX[size];
  const h = size === "icon" ? px : Math.round(px * 1.15);
  const src = BERTY_SRC[alert ? "point" : pose];
  const img = (
    <img
      src={src}
      alt=""
      title={alert ? "Berty · Cleanup" : `Berty · ${BERTY_LABEL[pose]}`}
      width={px}
      height={h}
      decoding="async"
      fetchPriority={alert ? "high" : "low"}
      draggable={false}
      className={cn("pointer-events-none select-none object-contain", float && "berty-float-img", className)}
    />
  );
  if (!float) return img;
  const pin =
    corner === "bl"
      ? "bottom-1 left-1"
      : corner === "tr"
        ? "top-1 right-1"
        : corner === "tl"
          ? "top-1 left-1"
          : "bottom-1 right-1";
  return (
    <div className={cn("pointer-events-none absolute z-20 berty-float", pin)} aria-hidden>
      {img}
    </div>
  );
}

/** Tiny footer / card peek. */
export function BertyPeek({ pose = "icon", className }: { pose?: BertyPose; className?: string }) {
  return <Berty pose={pose} size="icon" className={cn("opacity-90", className)} />;
}

/** Module-aware Berty. Cleanup / passing always win. */
export function BertyCueBot({
  on,
  cue,
  size = "md",
  className,
  onOpen,
}: {
  on: boolean;
  cue: BertyCue;
  size?: "icon" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onOpen?: () => void;
}) {
  if (!showBerty(on, cue)) return null;
  const pose = bertyPose(cue);
  const bot = <Berty pose={pose} size={size} alert={Boolean(cue.cleanup || cue.slot === "clean")} className={className} />;
  if (!onOpen) return bot;
  return (
    <button type="button" title="Berty’s profile" onClick={onOpen} className="tw-tap rounded-xl">
      {bot}
    </button>
  );
}
