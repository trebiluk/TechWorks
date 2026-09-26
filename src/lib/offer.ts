import type { EconomyFile } from "@/lib/economy";
import { deskBellId, isSubDay } from "@/lib/store";
import { featureOn } from "@/lib/features";
import { periodClock, periodNext, periodNow } from "@/lib/bells";
import { todayIso } from "@/lib/calendar";

export type StudentScreen = {
  view: "overview" | "hallwall" | "clubwall";
  label: string;
  why: string;
};

/** The screen a locked Chromebook should be on. The teacher unlocks to choose. */
export function studentScreen(file: EconomyFile, now = new Date(), clubLive = false): StudentScreen {
  const date = todayIso();
  if (isSubDay(file, date)) {
    return { view: "overview", label: "Wall", why: "Sub day. Read the board." };
  }
  const bellsId = deskBellId(file, date);
  const live = periodNow(bellsId, now);
  if (live === 6) {
    return { view: "hallwall", label: "Hall", why: "Study hall is up." };
  }
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  if (clock?.cleanup) {
    return { view: "overview", label: "Cleanup", why: "Reset the shop." };
  }
  if (live != null) {
    return { view: "overview", label: "Wall", why: `P${live}. Read the hour.` };
  }
  if (clubLive && featureOn(file, "club") && periodNext(bellsId, now) == null) {
    return { view: "clubwall", label: "Club", why: "Tech Club is open." };
  }
  return { view: "overview", label: "Wall", why: "The board is up." };
}
