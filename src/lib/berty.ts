export type BertyPose = "standing" | "waving" | "celebrate" | "think" | "point" | "icon";

export const BERTY_SRC: Record<BertyPose, string> = {
  standing: "/berty/brand/bertybot_standing.svg?v=1805",
  waving: "/berty/brand/bertybot_waving.svg?v=1805",
  celebrate: "/berty/brand/bertybot_celebrate.svg?v=1805",
  think: "/berty/brand/bertybot_think.svg?v=1805",
  point: "/berty/brand/bertybot_point.svg?v=1805",
  icon: "/berty/brand/bertybot_icon.svg?v=1805",
};

export const BERTY_LABEL: Record<BertyPose, string> = {
  standing: "Standing",
  waving: "Waving",
  celebrate: "Celebrate",
  think: "Think",
  point: "Point",
  icon: "Icon",
};

export type BertySlot = "enter" | "listen" | "work" | "clean" | "demo" | "share";

export type BertyCue = {
  cleanup?: boolean;
  live?: boolean;
  closed?: boolean;
  due?: boolean;
  rewardHit?: boolean;
  greeting?: boolean;
  passing?: boolean;
  slot?: BertySlot;
};

/** One pose for the wall / pad. Cleanup, then passing, then the lesson slot. */
export function bertyPose(cue: BertyCue): BertyPose {
  if (cue.cleanup || cue.slot === "clean") return "point";
  if (cue.passing) return "point";
  if (cue.rewardHit || cue.slot === "share") return "celebrate";
  if (cue.slot === "demo") return "point";
  if (cue.due || cue.closed || cue.slot === "listen") return "think";
  if (cue.greeting || cue.slot === "enter") return "waving";
  if (cue.slot === "work") return "standing";
  if (cue.live) return "waving";
  return "standing";
}

/** Cleanup and passing procedure show Berty even if the module is off. */
export function showBerty(on: boolean, cue?: { cleanup?: boolean; passing?: boolean }): boolean {
  return Boolean(cue?.cleanup || cue?.passing) || on;
}
