import { useEffect, useState } from "react";
import { periodClock, periodNow } from "@/lib/bells";

type Precision = "fine" | "beat";
type Listener = (now: Date) => void;

const fine = new Set<Listener>();
const beat = new Set<Listener>();
let timer = 0;
let schedule = "";
let lastBeat = "";
let lastNow = new Date();

function stamp(n: Date) {
  const live = periodNow(schedule, n);
  const clock = live != null ? periodClock(live, schedule, n) : null;
  const min = n.getHours() * 60 + n.getMinutes();
  return {
    n,
    live,
    clock,
    beatKey: `${min}|${live ?? "-"}|${clock?.cleanup ? 1 : 0}|${clock?.live ? 1 : 0}`,
    wait: clock?.cleanup ? 1000 : clock?.live ? 1000 : 15000,
  };
}

function arm() {
  window.clearTimeout(timer);
  const s = stamp(new Date());
  lastNow = s.n;
  if (s.clock?.live || s.clock?.cleanup) fine.forEach((fn) => fn(s.n));
  if (s.beatKey !== lastBeat) {
    lastBeat = s.beatKey;
    beat.forEach((fn) => fn(s.n));
  }
  timer = window.setTimeout(arm, s.wait);
}

function listen(fn: Listener, precision: Precision, sched?: string) {
  if (sched) schedule = sched;
  const bag = precision === "fine" ? fine : beat;
  bag.add(fn);
  if (fine.size + beat.size === 1) arm();
  fn(lastNow);
  return () => {
    bag.delete(fn);
    if (!fine.size && !beat.size) window.clearTimeout(timer);
  };
}

/** One timer for the shop. `fine` ticks each second while a period is live. `beat` only on minute / period / cleanup. */
export function useShopClock(sched?: string, precision: Precision = "fine") {
  const [now, setNow] = useState(lastNow);
  useEffect(() => listen((n) => setNow(n), precision, sched), [sched, precision]);
  return now;
}
