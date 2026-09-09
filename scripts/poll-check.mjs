import { launchPoll, votePoll, closePoll, pollHead, livePoll, pollForPeriod } from "../src/lib/polls.ts";

const file = {
  meta: { title: "T", quarterName: "Q1", currentWeek: 1, codes: {}, config: { currentCycle: 1 } },
  crews: [],
  students: [
    { id: "a", first: "Ace", last: "A", period: 1, crewKey: "Crew A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    { id: "b", first: "Bea", last: "B", period: 1, crewKey: "Crew A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    { id: "c", first: "Cal", last: "C", period: 2, crewKey: "Crew A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
  ],
};

let f = launchPoll(file, { prompt: "Ready?", kind: "yesno", period: 1, date: "2026-09-08" });
if (!livePoll(f)) throw new Error("live");
if (pollForPeriod(f, 2)) throw new Error("p2 should miss");
f = votePoll(f, "a", "yes");
f = votePoll(f, "c", "yes"); // wrong period
if (f.meta.polls.live.votes.c) throw new Error("cross period");
f = votePoll(f, "b", "no");
const h = pollHead(f, 1);
if (h.in !== 2 || h.of !== 2) throw new Error("head " + JSON.stringify(h));
f = closePoll(f);
if (livePoll(f)) throw new Error("still open");
if (!f.meta.polls.archive[0]) throw new Error("archive");
console.log("ok polls");
