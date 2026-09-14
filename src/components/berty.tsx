import { useEffect, useState, type CSSProperties } from "react";
import { BERTY_LABEL, BERTY_SRC, bertyPose, showBerty, type BertyCue, type BertyPose } from "@/lib/berty";
import { BERTY_LOOK_EVENT, bertyBodyHex, bertyLookVars, loadBertyLook, type BertyLook } from "@/lib/berty-look";
import { paintBertySvg } from "@/lib/berty-paint";
import { BertyGear } from "@/components/berty-gear";
import { cn } from "@/lib/utils";

const H: Record<"icon" | "sm" | "md" | "lg" | "xl", string> = {
  icon: "1.5rem",
  sm: "2.75rem",
  md: "4.25rem",
  lg: "5.75rem",
  xl: "8.25rem",
};

const RAW = new Map<string, string>();

function useBertySvg(pose: BertyPose, alert: boolean | undefined, body: string): string {
  const src = BERTY_SRC[alert ? "point" : pose];
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    const paint = (raw: string) => {
      if (live) setSvg(paintBertySvg(raw, body));
    };
    const hit = RAW.get(src);
    if (hit) {
      paint(hit);
      return () => {
        live = false;
      };
    }
    void fetch(src)
      .then((r) => r.text())
      .then((t) => {
        RAW.set(src, t);
        paint(t);
      });
    return () => {
      live = false;
    };
  }, [src, body]);
  return svg;
}

function useBertyLook(): BertyLook {
  const [look, setLook] = useState<BertyLook>(loadBertyLook);
  useEffect(() => {
    const go = () => setLook(loadBertyLook());
    window.addEventListener(BERTY_LOOK_EVENT, go);
    window.addEventListener("storage", go);
    return () => {
      window.removeEventListener(BERTY_LOOK_EVENT, go);
      window.removeEventListener("storage", go);
    };
  }, []);
  return look;
}

export function Berty({
  pose,
  size = "md",
  float,
  corner = "br",
  alert,
  className,
  look: lookIn,
}: {
  pose: BertyPose;
  size?: "icon" | "sm" | "md" | "lg" | "xl";
  float?: boolean;
  corner?: "br" | "bl" | "tr" | "tl";
  alert?: boolean;
  className?: string;
  look?: BertyLook;
}) {
  const saved = useBertyLook();
  const look = lookIn ?? saved;
  const body = bertyBodyHex(look);
  const svg = useBertySvg(pose, alert, body);
  const vars = bertyLookVars(look) as CSSProperties;
  const figure = (
    <span
      className={cn("berty-figure", className)}
      data-finish={look.finish}
      data-size={size}
      style={{ ...vars, ["--berty-h" as string]: H[size] }}
    >
      {svg ? (
        <span className="berty-seat" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <img
          src={BERTY_SRC[alert ? "point" : pose]}
          alt=""
          title={alert ? "Berty · Cleanup" : `Berty · ${BERTY_LABEL[pose]}`}
          decoding="async"
          draggable={false}
          className="berty-seat"
        />
      )}
      {size === "icon" ? null : <BertyGear look={look} />}
    </span>
  );
  if (!float) return figure;
  const pin =
    corner === "bl"
      ? "bottom-0 left-2"
      : corner === "tr"
        ? "top-1 right-1"
        : corner === "tl"
          ? "top-1 left-1"
          : "bottom-0 right-2";
  return (
    <div className={cn("pointer-events-none absolute z-20 berty-seat-pad", pin)} aria-hidden>
      {figure}
    </div>
  );
}

/** Tiny chrome badge — not a floating PNG. */
export function BertyPeek({ pose = "icon", className }: { pose?: BertyPose; className?: string }) {
  return (
    <span className={cn("berty-badge", className)}>
      <Berty pose={pose} size="icon" />
    </span>
  );
}

/** Module-aware Berty. Cleanup / passing always win. Seated on the plate. */
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
  const bot = (
    <span className="berty-seat-pad">
      <Berty pose={pose} size={size} alert={Boolean(cue.cleanup || cue.slot === "clean")} className={className} />
    </span>
  );
  if (!onOpen) return bot;
  return (
    <button type="button" title="Berty’s profile" onClick={onOpen} className="tw-tap berty-seat-pad rounded-xl">
      <Berty pose={pose} size={size} alert={Boolean(cue.cleanup || cue.slot === "clean")} className={className} />
    </button>
  );
}
