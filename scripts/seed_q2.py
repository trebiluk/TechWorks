#!/usr/bin/env python3
"""Build Q2 (S2) roster + 13 instructional weeks of marks. Writes src/data and public economy.json."""
from __future__ import annotations

import json
import random
from copy import deepcopy
from datetime import date, timedelta
from pathlib import Path

ROOT = Path("/workspace")
SRC = ROOT / "src/data/economy.json"
PUB = ROOT / "public/economy.json"

FIRST = date(2026, 9, 8)
LAST = date(2027, 6, 24)
NO = {
    date(2026, 9, 2), date(2026, 9, 7), date(2026, 10, 12), date(2026, 11, 3),
    date(2026, 11, 11), date(2026, 11, 25), date(2026, 11, 26), date(2026, 11, 27),
    date(2027, 1, 18), date(2027, 1, 26), date(2027, 1, 27), date(2027, 1, 28), date(2027, 1, 29),
    date(2027, 3, 9), date(2027, 3, 26), date(2027, 5, 14), date(2027, 5, 31),
    date(2027, 6, 15), date(2027, 6, 16), date(2027, 6, 17), date(2027, 6, 19),
    date(2027, 6, 21), date(2027, 6, 22), date(2027, 6, 23), date(2027, 6, 25),
}
for d0, d1 in [(date(2026, 12, 24), date(2027, 1, 1)), (date(2027, 2, 15), date(2027, 2, 19)), (date(2027, 4, 12), date(2027, 4, 16))]:
    d = d0
    while d <= d1:
        NO.add(d)
        d += timedelta(days=1)

PAY = {"3": 25, "2": 20, "1": 15, "A": 0, "E": 0, "P": -25}
SKILLS = ["safety", "measure", "draw", "model", "material", "tools", "finish", "present", "digital", "team"]
TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM", "V", "XOM", "HD", "DIS"]
GOALS = ["IDEA STAGE", "DESIGN STAGE", "MODELING STAGE", "FINISHING STAGE", "PRESENTATION PREP", "CRITIQUE DAY", "TRAINING", "DEMONSTRATION", "DRAWING", "FREE DAY"]
ACTS = ["PROJ-W", "PROJ-PC", "P", "PTO", "OFF TASK"]
LUNCH = [
    "Chicken Poppers", "Mac & Cheese", "Chicken Patty", "Walking Taco", "Pizza",
    "Nachos", "Cheeseburger", "Chicken Bowl", "Mozz Sticks", "PB Uncrustable",
]

CREW_NAMES = {
    1: [("Crew A", "Sprocket"), ("Crew B", "Rivet"), ("Crew C", "Truss"), ("Crew D", "Plumb")],
    2: [("Crew A", "Bit"), ("Crew B", "Kernel"), ("Crew C", "Latch"), ("Crew D", "Flux")],
    3: [("Crew A", "Bevel"), ("Crew B", "Kerf"), ("Crew C", "Jig"), ("Crew D", "Fence")],
    6: [("Crew A", "Quiet"), ("Crew B", "Focus"), ("Crew C", "Anchor"), ("Crew D", "Pulse")],
    8: [("Crew A", "Cope"), ("Crew B", "Miter"), ("Crew C", "Rabbet"), ("Crew D", "Spline")],
    9: [("Crew A", "Pixel"), ("Crew B", "Frame"), ("Crew C", "Layer"), ("Crew D", "Mask")],
    10: [("Crew A", "Cam"), ("Crew B", "Idler"), ("Crew C", "Gear"), ("Crew D", "Belt")],
}

# 12 aliases per period — not the Q1 set
NAMES = {
    1: ["Wren", "Sage", "Pico", "Vale", "Moss", "Kit", "Ember", "Lark", "Joss", "Nell", "Brix", "Cove"],
    2: ["Onyx", "Pearl", "Flint", "Jade", "Slate", "Iris", "Theo", "Nash", "Remy", "Cleo", "Pike", "Wynn"],
    3: ["Arlo", "Bess", "Cruz", "Dax", "Eden", "Faye", "Gwen", "Holt", "Indi", "Jules", "Kade", "Lux"],
    6: ["Mira", "Nico", "Opal", "Penn", "Quinn", "Rory", "Sol", "Tess", "Uma", "Vera", "Wes", "Xan"],
    8: ["Yael", "Zed", "Asha", "Bo", "Cora", "Drew", "Ellis", "Fox", "Gia", "Hank", "Inez", "Jo"],
    9: ["Kira", "Leo", "Mae", "Ned", "Ora", "Paz", "Ren", "Sky", "Tate", "Uri", "Vesper", "Willa"],
    10: ["Axel", "Blair", "Cass", "Dell", "Eve", "Finn", "Gray", "Haze", "Ivy", "Jem", "Koa", "Liv"],
}

PERIODS = [
    (1, 6, "TECH 6", 2, "Q2"),
    (2, 8, "TECH 8", 2, "Q2"),
    (3, 7, "TECH 7", 2, "Q2"),
    (6, 5, "STUDY HALL", 10, "YEAR"),
    (8, 7, "TECH 7", 6, "Q2"),
    (9, 8, "TECH 8", 6, "Q2"),
    (10, 6, "TECH 6", 6, "Q2"),
]


def iso(d: date) -> str:
    return d.isoformat()


def is_school(d: date) -> bool:
    if d < FIRST or d > LAST:
        return False
    if d.weekday() >= 5:
        return False
    if d in NO:
        return False
    return True


def school_days() -> list[date]:
    out = []
    d = FIRST
    while d <= LAST:
        if is_school(d):
            out.append(d)
        d += timedelta(days=1)
    return out


def instructional_weeks() -> list[list[date]]:
    weeks: list[list[date]] = []
    cur: list[date] = []
    last_mon = None
    for d in school_days():
        mon = d - timedelta(days=d.weekday())
        if last_mon is None or mon != last_mon:
            if cur:
                weeks.append(cur)
            cur = [d]
            last_mon = mon
        else:
            cur.append(d)
    if cur:
        weeks.append(cur)
    return weeks


def pick_code(rng: random.Random, week_i: int, kind: str) -> str:
    # kind: star, solid, grow, miss, pto
    early = week_i < 4
    late = week_i >= 9
    roll = rng.random()
    if kind == "star":
        if roll < 0.88:
            return "3"
        if roll < 0.96:
            return "2"
        return "1" if roll < 0.98 else "E"
    if kind == "grow":
        if early:
            if roll < 0.35:
                return "1"
            if roll < 0.8:
                return "2"
            return "3"
        if late:
            if roll < 0.75:
                return "3"
            if roll < 0.93:
                return "2"
            return "1"
        if roll < 0.55:
            return "3"
        if roll < 0.85:
            return "2"
        return "1"
    if kind == "miss":
        if roll < 0.62:
            return "3"
        if roll < 0.82:
            return "2"
        return "1"
    if kind == "pto":
        if roll < 0.8:
            return "3"
        if roll < 0.93:
            return "2"
        return "1"
    # solid
    if roll < 0.7:
        return "3"
    if roll < 0.9:
        return "2"
    return "1"


def main() -> None:
    rng = random.Random(42)
    weeks_all = instructional_weeks()
    # S2 = year weeks 9–21 (13 weeks). Index 8..21
    q2 = weeks_all[8:21]
    assert len(q2) == 13, len(q2)
    all_days = [d for w in q2 for d in w]
    last_week = q2[-1]
    slot_days = last_week[:4]
    sub_day = q2[3][0]  # week 4 of Q2, first school day
    print("Q2 weeks", iso(q2[0][0]), "→", iso(q2[-1][-1]), "days", len(all_days), "sub", iso(sub_day))
    print("week lengths", [len(w) for w in q2])

    src = json.loads(SRC.read_text())
    meta = src["meta"]
    meta["quarterName"] = "S2"
    meta["currentWeek"] = 8
    meta["market"]["index"] = 46280
    meta["market"]["baseline"] = 45000
    meta["market"]["factor"] = round(46280 / 45000, 4)
    meta["config"]["currentCycle"] = 8
    meta["config"]["cycleGoals"] = {
        "5": "PRODUCTIVITY",
        "6": "FINISHING STAGE",
        "7": "PRESENTATION PREP",
        "8": "CRITIQUE DAY",
    }
    meta["abAnchor"] = {"date": iso(q2[0][0]), "letter": "A"}
    meta["sessions"] = [
        {
            "label": "S1",
            "cash": 18640,
            "xp": 512,
            "headcount": 84,
            "start": "2026-09-08",
            "end": iso(weeks_all[7][-1]),
        }
    ]
    meta["ledger"] = []

    day_log = {}
    for wi, w in enumerate(q2):
        goal = GOALS[wi % len(GOALS)]
        act = ACTS[wi % len(ACTS)]
        for di, d in enumerate(w):
            rec = {
                "periodGoals": {str(p): goal for p, *_ in PERIODS},
                "crewGoals": {},
                "periodActivity": {str(p): act for p, *_ in PERIODS},
                "lunch": LUNCH[(wi * 5 + di) % len(LUNCH)],
                "schooltool": {str(p): True for p, *_ in PERIODS},
            }
            if d == sub_day:
                rec["sub"] = True
            day_log[iso(d)] = rec
    meta["dayLog"] = day_log

    crews = []
    for p, names in CREW_NAMES.items():
        for key, name in names:
            crews.append({"period": p, "key": key, "name": name})

    students = []
    roles = {}
    kcode = 80
    kinds_cycle = ["star", "solid", "grow", "solid", "miss", "solid", "star", "grow", "solid", "pto", "solid", "grow"]

    for p, grade, course, section, sem in PERIODS:
        names = NAMES[p]
        for i, first in enumerate(names):
            crew_i = i // 3
            crew_key = CREW_NAMES[p][crew_i][0]
            kind = kinds_cycle[i]
            ab = "BOTH"
            if p == 6:
                ab = "A" if i % 2 == 0 else "B"
            sid = f"TW-P{p}-S2-{i + 1:02d}"
            kcode += 1
            marks: dict[str, str] = {}
            invest: dict[str, int] = {}
            assist: dict[str, bool] = {}
            affect: dict[str, str] = {}
            cleanup: dict[str, str] = {}
            notes: dict[str, str] = {}

            # 3-day streak for miss kids
            streak_start = None
            if kind == "miss":
                streak_start = rng.choice(all_days[8:-8])

            pto_day = None
            if kind == "pto":
                pto_day = rng.choice(all_days[10:-5])

            earned = 0
            parked = 0
            bonus = 5 if kind == "star" and rng.random() < 0.5 else 0
            deduct = 0
            clutch = 0
            if kind == "star" and rng.random() < 0.3:
                clutch = 5

            for wi, w in enumerate(q2):
                # one absence-ish per class handled below after we know the day
                for d in w:
                    ds = iso(d)
                    if d == sub_day:
                        continue
                    if p == 6:
                        # A/B: only present on matching letter. Alternate from anchor A.
                        letter = "A" if (all_days.index(d) % 2 == 0) else "B"
                        if ab != letter:
                            continue
                    code = pick_code(rng, wi, kind)
                    if streak_start and 0 <= (d - streak_start).days <= 2:
                        code = "A"
                    if pto_day and d == pto_day:
                        code = "P"
                    marks[ds] = code
                    earned += PAY[code]
                    if code == "3" and kind in {"star", "solid"} and rng.random() < (0.28 if kind == "star" else 0.12):
                        invest[ds] = 25
                        parked += 25
                    if code == "3" and kind == "star" and rng.random() < 0.08:
                        assist[ds] = True
                        earned += 10
                    if rng.random() < 0.04:
                        affect[ds] = rng.choice(["🙂", "😄", "😐"])
                    if code == "1" and rng.random() < 0.15:
                        cleanup[ds] = "miss"
                        deduct += 10
                        notes[ds] = "station not cleaned"

            # sprinkle class absences: ~1 kid per period per week
            for wi, w in enumerate(q2):
                if rng.random() < 0.75:
                    d = rng.choice(w)
                    if d == sub_day:
                        continue
                    ds = iso(d)
                    if ds in marks and marks[ds] in {"3", "2", "1"}:
                        old = marks[ds]
                        marks[ds] = "A" if rng.random() < 0.7 else "E"
                        earned -= PAY[old]
                        if ds in invest:
                            parked -= invest.pop(ds)

            days4 = [marks.get(iso(d), "") for d in slot_days]
            while len(days4) < 4:
                days4.append("")

            # skills grow with kind
            skills = {}
            n_sk = {"star": 8, "solid": 5, "grow": 6, "miss": 3, "pto": 4}[kind]
            chosen = SKILLS[: n_sk] if kind == "star" else rng.sample(SKILLS, n_sk)
            for j, sk in enumerate(chosen):
                if kind == "star":
                    skills[sk] = 3 if j < 4 else 2
                elif kind == "grow":
                    skills[sk] = 2 if j < 3 else 1
                elif kind == "miss":
                    skills[sk] = 1
                else:
                    skills[sk] = rng.choice([1, 2, 2, 3])

            picks = rng.sample(TICKERS, 3)
            opening = earned + bonus - deduct + clutch - parked
            # current week pay lives in days/marks too; opening should be prior weeks so double-count?
            # score() = opening + this calendar week's pay - this week's invest.
            # Today is Sep 4, so this week's pay is 0. Put ALL net in opening.
            student = {
                "id": sid,
                "first": first,
                "last": f"K{kcode}",
                "period": p,
                "grade": grade,
                "crewKey": crew_key,
                "section": section,
                "course": course,
                "sem": sem,
                "days": days4,
                "marks": marks,
                "investDays": invest,
                "investAsk": {},
                "assistDays": assist,
                "bonus": bonus,
                "deduct": deduct,
                "clutch": clutch,
                "opening": opening,
                "flags": {"iep": i == 2, "plan504": i == 7} if i in {2, 7} else {},
                "abDay": ab,
                "affect": affect,
                "notes": notes,
                "skills": skills,
                "cleanupDays": cleanup,
                "picks": picks,
                "purchases": [],
            }
            students.append(student)
            if crew_key == "Crew A" and i % 3 == 0:
                roles[f"8|{p}|Crew A"] = sid

    meta["config"]["crewRoles"] = roles

    # class-level absence already sprinkled; verify counts
    live = [s for s in students if s["sem"] in {"Q2", "YEAR"}]
    print("students", len(live), "tech", sum(1 for s in live if s["sem"] == "Q2"), "SH", sum(1 for s in live if s["sem"] == "YEAR"))
    absences = sum(1 for s in live for c in s["marks"].values() if c == "A")
    print("A marks", absences, "avg per kid", round(absences / len(live), 1))
    print("mean opening", round(sum(s["opening"] for s in live) / len(live)))

    out = deepcopy(src)
    out["meta"] = meta
    out["crews"] = crews
    out["students"] = students
    text = json.dumps(out, indent=2)
    SRC.write_text(text + "\n")
    PUB.write_text(text + "\n")
    print("wrote", SRC, "bytes", len(text))


if __name__ == "__main__":
    main()
