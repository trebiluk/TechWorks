import { useEffect, useState } from "react";

const KEY = "techworks-nav-v2";

/** Default ON — class wall: Dash / Teach / Learn / Other. Classic = Desk/Admin top-level. */
export function storedNavV2(): boolean {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "off" || v === "0") return false;
    return true;
  } catch {
    return true;
  }
}

export function commitNavV2(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* */
  }
  window.dispatchEvent(new Event("techworks-nav"));
}

export function useNavV2(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(storedNavV2());
    sync();
    window.addEventListener("techworks-nav", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("techworks-nav", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [on, commitNavV2];
}

export type AppSection = "dash" | "learn" | "crew" | "admin";

export const APP_SECTIONS: { id: AppSection; label: string; lock?: boolean }[] = [
  { id: "dash", label: "Dash" },
  { id: "learn", label: "Learn" },
  { id: "crew", label: "Crew", lock: true },
  { id: "admin", label: "Admin", lock: true },
];

export function sectionOf(view: string): AppSection {
  if (
    view === "overview" ||
    view === "week" ||
    view === "year" ||
    view === "polls" ||
    view === "data" ||
    view === "teach" ||
    view === "deck" ||
    view === "clubwall" ||
    view === "hallwall"
  )
    return "dash";
  if (view === "skills" || view === "grades" || view === "projects") return "learn";
  if (view === "score" || view === "crew") return "crew";
  return "admin";
}

export type NavTab = { id: string; label: string; on: boolean; onClick: () => void; hidden?: boolean };
