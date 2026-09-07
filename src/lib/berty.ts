export type BertyPose = "standing" | "waving" | "celebrate" | "think" | "point" | "icon";

export const BERTY_SRC: Record<BertyPose, string> = {
  standing: "/berty/brand/bertybot_standing.svg?v=1796",
  waving: "/berty/brand/bertybot_waving.svg?v=1796",
  celebrate: "/berty/brand/bertybot_celebrate.svg?v=1796",
  think: "/berty/brand/bertybot_think.svg?v=1796",
  point: "/berty/brand/bertybot_point.svg?v=1796",
  icon: "/berty/brand/bertybot_icon.svg?v=1796",
};

export const BERTY_LABEL: Record<BertyPose, string> = {
  standing: "Standing",
  waving: "Waving",
  celebrate: "Celebrate",
  think: "Think",
  point: "Point",
  icon: "Icon",
};

export type BertyCue = {
  cleanup?: boolean;
  live?: boolean;
  closed?: boolean;
  due?: boolean;
  rewardHit?: boolean;
  greeting?: boolean;
  passing?: boolean;
};

/** One pose for the wall / pad. Cleanup, then passing procedure, then the rest. */
export function bertyPose(cue: BertyCue): BertyPose {
  if (cue.cleanup) return "point";
  if (cue.passing) return "point";
  if (cue.rewardHit) return "celebrate";
  if (cue.due) return "think";
  if (cue.closed) return "think";
  if (cue.greeting) return "waving";
  if (cue.live) return "waving";
  return "standing";
}

/** Cleanup and passing procedure show Berty even if the module is off. */
export function showBerty(on: boolean, cue?: { cleanup?: boolean; passing?: boolean }): boolean {
  return Boolean(cue?.cleanup || cue?.passing) || on;
}
