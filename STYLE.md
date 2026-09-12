# TechWorks bot style guide

Read this **before** any edit. You are a guest in a live classroom app. Small diffs. Product language. No rebuilds.

Canonical live: `src/lib/version.ts` (`APP_VERSION`) + `src/data/changelog.ts`. Footer chip must match.

---

## 1. Who this is for

Richard Kulibert, Solvay Middle School, Tech 6/7/8 + Period 6 Study Hall.

- **Projector** (Dashboard) stays up all day. Kids see it. FERPA.
- **Desk** (Score) is the teacher pad. Fast taps. One screen.
- **Admin** is PIN-only (the PIN the teacher set). Crew override 2222. Never print 1111 as the teacher unlock.
- He talks in prompts, not tickets. `GO` / `PEACOCK` = build. `PAUSED` / `don’t work` / `read prompts` = intent only, wait.

Do **not** invent Flo, GrokBot, GitHub, hosting, or paid APIs unless he asks.

---

## 2. Before you type code

1. Classify: build vs question vs pause. Pause wins.
2. Open the **current** files. Do not copy 1.9 / 2.1 zips or chat memory.
3. One job per turn. Do not “while I’m here” restyle the app.
4. After edits: `npx tsc --noEmit`. Bump `APP_VERSION` patch. Add **one** changelog bullet.
5. Speak to him in product terms: Desk, Dashboard, Cycle, crew. Never ports, localhost, containers.

If the ask is large, show a 5-line plan and wait unless he already said GO.

---

## 3. Architecture (do not fork)

| Layer | Rule |
|---|---|
| Stack | React 18, Vite, Tailwind v4, TanStack Router. Local-only. |
| State | `EconomyFile` in `src/lib/store.ts`. Always `cloneFile`. Never mutate in place. |
| Tape | Marks live on `markTape`. Compact. Years go to IndexedDB archive (`src/lib/archive.ts`). |
| Calendar | `src/data/solvay-2026-27.ts` + `src/lib/calendar.ts`. Infer cycle and D1–D4 from **dates**, not guesses. |
| Skills | `SKILL_TRACK` in `src/lib/skills.ts`. Pedagogy is the source. Do not invent skill names. 1–4, blank ≠ 0. |
| Rank | Combo = **1.5 × skill + wallet**. Stocks are a **separate game**. |
| Shop vs SH | Shop = P1, P2, P3, P8, P9, P10. **P6 never contaminates shop XP, effort, or leaderboards.** SH has its own dash. |

PINs: teacher is the PIN they set (1111 is rejected). Crew override `2222`.

---

## 4. FERPA / names

- Walls and projector: **first / alias only**.
- Real last names, IEP, 504: profile, behind PIN, hide/show.
- IEP = blue dot, 504 = orange dot, mixed with decoy dots on profile only.
- Never log the confidential roster PDF. Never paste real names into changelog, Help, or Drive dumps.

---

## 5. Visual system

Tokens live in `src/styles.css` (`--bg`, `--fg`, `--gold`, `--accent`, `--loss`, `--gain`, `--cleanup`, `--surface`, `--elevated`, `--muted`, `--subtle`). Themes in `src/lib/theme.ts`. Do not hard-code hex in components.

| Meaning | Treatment |
|---|---|
| XP | Gold / `--gold`. `font-mono`. |
| Wallet $ | Muted, not competing with XP. |
| Due / overdue | Red (`--loss`). Not cute. |
| Cleanup | Coral / `--cleanup`. Not red. |
| Live / on | Accent fill, high contrast text (`text-accent-fg` or `text-bg`). |
| Edit mode | **Red borders on fields**, not a red page. Class `desk-edit`. |
| Unsaved | Visible. Remind export. |

**Type**
- Titles: `font-display`, tight tracking, 2xl–3xl. Not casual slogans.
- Body: `text-sm` (≈14px) on non-dash screens.
- Numbers: `font-mono tabular-nums`.
- Chips: **ALL CAPS**.

**Chrome**
- Use `Chip`, `Btn`, `TogglePair` from `src/components/ui.tsx`. Do not invent a third button.
- Tap targets `min-h-11` (mobile 48px).
- Cards: `rounded-xl bg-surface p-4`. Dash/YTD/Week should **look like the same family**.
- Left: nav, controls, period chips. Do not park primary actions on the far right unless they are “next”.
- **No empty hero space. No witty helper copy.** If it isn’t a control or a number, cut it.
- **BertyBot** (`public/berty/*.svg`, `src/lib/berty.ts`, `<Berty>`). Metal overlay mascot. Pose from `bertyPose()`. Feature `berty`. Do not drop the 1MB AI PNGs into the app.
- One screen, no scroll, for Desk scoring and projector dash. Collapse extras (`Daily settings`, `Fold`).

**Default theme:** Solvay (navy `#06122B`, royal `#1E4BAF`, white, paw orange `#E85820`). Light and dark both exist. Contrast on light themes is a real bug (lilac washed the clock). Test `data-kind="light"`.

---

## 6. Screen jobs

| Screen | Job | Do not |
|---|---|---|
| **Dashboard** | Projector wall. Now bar, this class, today’s goals, pulse, cycle 3s. Auto current period. Peek others. | Mix SH kids. Dump a shop roster. |
| **Week** | Six shop classes, cycle XP/$. Options chips. | Show P6. Tall skinny columns. |
| **YTD** | Sessions + year XP/$. Same card language as Week. | Career-of-one-kid story. Tech kids leave after the session. |
| **Desk / Score** | Score the current crew. 2×2 cells. Daily settings collapsed. | Recreate Admin. Scroll a form. |
| **Projects** | Dates, school cycles, pedagogy skills, goal vs current phase. | Fake cycle 1–2 if the calendar says 3. |
| **Skills** | 1–4 marks, XP, bands. PIN to edit. | Tie to wallet. |
| **Study Hall** | Productive or peaceful. Line leader. Notes / owes. Age-10 voice. | Shop effort language. |
| **Admin** | Everything that isn’t scoring. Categories, not a settings dump. | Duplicate Desk controls. |
| **Profile** | Alias first. Real name behind arrow. Grades, skills, wallet, stocks, history. | IEP as a selectable chip. |

---

## 7. Copy

- Short. Periods as `P8`. Cycles as `Cycle 3, Day 2` (not `D2` in teacher chrome if he asked for words).
- Teacher voice: direct. Kid voice: only on SH dash and Crew Leader.
- No “tips”, “pro tip”, “don’t forget :)”.
- Changelog: one line, what the teacher will see, not file names.

---

## 8. Edit recipe (do this every time)

```
1. Read STYLE.md + the target file. Do not restyle neighbors.
2. Patch the smallest surface. Reuse Chip/Btn/Fold.
3. APP_VERSION ++  (1.50.0 → 1.50.1)
4. src/data/changelog.ts  — one bullet at the top
5. npx tsc --noEmit
6. Reply in 3–8 lines. What changed. Where to tap.
```

Do **not** rewrite `store.ts` for a label change. Do **not** add a new tab when a `Fold` or chip will do. Do **not** add Apps Script, Google Sign-in, or a second database.

---

## 9. Known landmines

- Preview = this sandbox. School will not open port 8080. Keep it a static Vite app.
- `currentCycle` in config can drift. Prefer `cycleNow(today)` from the calendar for “what day is this project on”.
- Crew size is 3–4. Score cells are a **2×2**. Pad empties. Do not list 18 rows.
- Effort / engagement ignores shop purchases and P (personal). Wallet is not a grade.
- SUB voids the day; next class is the next cycle day. Subs never use the app.
- Fake/demo data is a debug toggle, not the live file.
- Confidential PDFs: process, then forget. Do not keep uploads.

---

## 10. If you are a new bot

You are **not** starting TechWorks 1.0. You are patching whatever `APP_VERSION` says.

Open:

1. `STYLE.md` (this file)
2. `src/lib/version.ts`
3. `src/data/changelog.ts` (last 10 versions)
4. The screen he named

Then do §8. If the live footer still says 1.0, the version chip or the build is wrong — fix that before adding features.
