import { laySlots, slotNow, teachFocusPeriod, packOf } from "../src/lib/teach.ts";
import { setSubDay } from "../src/lib/store.ts";

const file = () => ({
  meta: { title: "T", quarterName: "Q1", currentWeek: 1, codes: {}, config: { currentCycle: 1, schedule: "regular" } },
  crews: [],
  students: [],
});
const at = (h, m, s = 0) => new Date(2026, 8, 8, h, m, s);
const f = file();
const rows = laySlots(f, "2026-09-08", 1);
const contiguous = rows.slice(1).every((r, i) => r.startMin === rows[i].endMin);
const fail = [];
if (rows[0].title !== "ENTER") fail.push("enter");
if (!rows.at(-1).clean) fail.push("clean");
if (!contiguous) fail.push("overlap " + rows.map((r) => `${r.title}:${r.startMin}-${r.endMin}`).join(" "));
if (rows[0].startMin !== 7 * 60 + 55 || rows.at(-1).endMin !== 8 * 60 + 35) fail.push("bell");
if (teachFocusPeriod(f, "2026-09-08", at(8, 10)) !== 1) fail.push("live1");
if (teachFocusPeriod(f, "2026-09-08", at(8, 36)) !== 2) fail.push("next2");
if (teachFocusPeriod(f, "2026-09-08", at(12, 40)) !== 8) fail.push("p8");
if (teachFocusPeriod(f, "2026-09-08", at(15, 0)) !== 10) fail.push("after");
if (slotNow(f, "2026-09-08", 1, at(7, 50))?.title !== "ENTER") fail.push("before");
if (!slotNow(f, "2026-09-08", 1, at(8, 33))?.clean) fail.push("late");
if (slotNow(f, "2026-09-08", 1, at(8, 36)) != null) fail.push("done");
if (packOf(setSubDay(f, "2026-09-08", true), "2026-09-08", 1).id !== "sub") fail.push("sub");
const half = file();
half.meta.config.schedule = "half";
const hrows = laySlots(half, "2026-09-08", 1);
if (!hrows.some((s) => s.clean)) fail.push("half");
if (fail.length) {
  console.error("FAIL", fail, rows);
  process.exit(1);
}
console.log("ok", rows.map((r) => `${r.title} ${r.mins}m`).join(" → "));
