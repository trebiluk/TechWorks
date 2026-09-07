import { BERTY_LABEL, BERTY_SRC, type BertyPose } from "@/lib/berty";
import { cn } from "@/lib/utils";

const PX: Record<"icon" | "sm" | "md" | "lg", number> = {
  icon: 24,
  sm: 44,
  md: 64,
  lg: 88,
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
  size?: "icon" | "sm" | "md" | "lg";
  float?: boolean;
  corner?: "br" | "bl" | "tr" | "tl";
  alert?: boolean;
  className?: string;
}) {
  const px = PX[size];
  const h = size === "icon" ? px : Math.round(px * 1.15);
  const img = (
    <img
      src={BERTY_SRC[alert ? "point" : pose]}
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