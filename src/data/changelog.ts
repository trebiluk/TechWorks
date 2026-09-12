import { APP_VERSION } from "@/lib/version";

export { APP_VERSION };

export const CHANGELOG_MD = `# TechWorks changelog

App version **${APP_VERSION}**. Newest first. Sheets stay the archive; this desk is the tap pad.

## 1.92.14 — 2026-09-12

- Diego lock: About / Privacy / wall copy never print 1111 as the teacher unlock. Unlock path is Set teacher PIN. Crew 2222 stays off the student-facing About card.

## 1.92.13 — 2026-09-12

- Punch list: teacher PIN copy is the PIN you set (not 1111). Wall cold-start shows Job, Enter → Listen → Crew work → Clean up, and leftover minutes. Rank Cards is an optional gilded Top XP / Top $ view. Wall / Teach / Deck stay on the top rail. Club says Sign in → Brief → Work → Clean up. Themes paint a full token set — no white walls, hover mixes toward the wall, Projector is a dark high-contrast kit. SchoolTool sleeps on non-school days.

## 1.92.12 — 2026-09-11

- Dash chrome is one row: logo, Wall/Teach/Deck/Week/Club/Hall, then one Now clock. Cleanup no longer stacks a second chip. Workshop and Classroom jobs fill the wall so the back row can read them.

## 1.92.11 — 2026-09-11

- Tech Club dates are a month you tap to SET. Each meeting has Talk / Stations / Contest / Workshop. Brief holds the projector until you tap Work. Then stations and contests. Cleanup still 3:00.

## 1.92.10 — 2026-09-11

- Admin → Day is one date: Sub, bells, lunch, meeting, two wall cards, then copy. Shop defaults (usual bells, cycle, cleanup, A/B, Teach pack) stay folded. Passes stay on Today. Units stay on Learn → Projects → Plan.

## 1.92.9 — 2026-09-11

- Teach has a Wall chip to hang the projector when class is done. Dash → Wall stays cards even while the desk is unlocked — Score, Rank XP/$, and SchoolTool stay off that screen. Admin → Wall is the only editor.

## 1.92.8 — 2026-09-11

- Wall projector stays cards. Dash → Wall never opens the editor — Now and the job fill leftover space like Teach. Admin → Wall is the one screen to drag plates and Show hidden ones. Rank XP/$ and “tap = in” stay off the locked wall. Teach during class, then put the Wall up.

## 1.92.7 — 2026-09-11

- Plan book on Learn → Projects. Each activity is 1–4 shop days (Modeling starts at 2). Drag to reorder. The sequence fills the unit. Tap an activity, then a day, to park just that class. Teach has a Plan book chip. Admin → Day still sets lunch, sub, and wall cards.

## 1.92.6 — 2026-09-10

- Club on Dash stays on Club. Locked projector used to bounce that tab back to the Wall.
- Dash strip is Wall · Teach · Deck · Week · Club · Hall. Year and Data sit on Week. Polls sit on Teach and on the wall when a vote is live.
- Wall edit is drag plus a Show row for hidden plates — no On/Off grid, no chevron list, no dump of every Off module.

## 1.92.5 — 2026-09-10

- Daily schedule · passes actually tap in Admin. Unlock used to freeze wall chips so OPEN / MEETING / CLOSED / SUB did nothing. Fake data overlay no longer throws away a pass change. Pad sits on Admin → Today and at the top of Day.

## 1.92.4 — 2026-09-10

- Features pass: Admin → Modules actually hides what it says. Weather on the wall/score. Class reward bar off when the module is off. Screen guide starts Off (it was On in the list but the strip was hidden). Every module has a pass test.

## 1.92.3 — 2026-09-10

- Monday-safe saves: an empty PC will not auto-push over a cloud roster. Empty shop PC with the desk key loads the cloud names. Pushing 0 workers asks first. Storage-full flashes so you download a backup. Import writes to this PC immediately. Google book / JSON / snapshots never include Fake data workers.
- Fake data Messy / week / cycle now paints Score, Crews, Learn, Wallet, Rosters, Cleanup, and the wall — still not saved. Gold chip on every size.
- Manual: TECHWORKS TECHNICAL DETAILS v7.1.

## 1.92.2 — 2026-09-10

- Fake data (Messy / week / cycle) actually paints the wall, week, year, crews, and data. Empty desk gets a throwaway Forge/Volt shop. Gold chip: not saved. Overlay workers never write to the gradebook.
- Roster import: same legal name keeps the alias. Cloud will not replace a real roster with an empty cloud copy.
- Manual: TECHWORKS TECHNICAL DETAILS v7.0 — Monday backup (this PC, cloud key, Drive folder). Help: Do not lose Monday’s roster.

## 1.92.1 — 2026-09-10

- Prints bin starts empty. Add a piece, copy the line for the next size. No factory dragon set. Gallery tiles are half size, still square.
- Unlock is a full editor: stay on this screen, Settings gear on the HUD, wall plates drag in place. Lock returns the projector. PIN no longer dumps you on Admin Today.

## 1.92.0 — 2026-09-10

- Learn is project-based: Options (pick a unit) → Floor (put it on a period, more than one at a time) → crews take a slot. Crew lead can pick the slot. Write the job is the five lines, not a wall of chips. Learn opens on Projects. Hide-card toggles and Guide are off the everyday menu.

## 1.91.4 — 2026-09-10

- Deck edit: spacebar types a space again. Slide fields were trimming on every key, so a space at the end of a word never stuck. Present mode still uses space for next slide.

## 1.91.3 — 2026-09-10

- Phone pass: the job plate is full-width again (it had borrowed the HUD chip’s max-width). Header is one swipe row, not a wrapped stack. Version number hides; paw stays. Period strip and Admin segments swipe. Goggles chip fills the plate. Dock sits on the home bar. Safe-area padding on the shell.

## 1.91.2 — 2026-09-09

- Job card from every seat: gold look-for 3, goggles on the rules. Tap goggles (PIN) to open tools — until then the timer and name-draw stay closed. Teacher cycle goal (Modeling) beats the calendar day if it is further along. Empty visitors do not see a school board of zeros. Modules stay off the live wall (turn them on in Admin → Wall). Lucky Bench starts off. Teach work slot uses today’s job line, not a second copy of the card.

## 1.91.1 — 2026-09-09

- The Goals plate is the job, not the filing cabinet. P1 shows the driving question, rules, today, done, and look-for a 3. One STEM sentence under the question — not SCIENCE · TECHNOLOGY · ENGINEERING · MATH. Lucky Bench $0, pizza 0%, empty polls, and Top 3 with nobody stay off until someone has a score. Empty browsers say this desk lives on the shop PC. Edit the five lines in Learn → Projects. Theme → Size Fill preview is the job card.

## 1.91.0 — 2026-09-09

- Year plan plus the desk beats. Admin → Day: set any school day through June (wall cards, lunch, sub, bells, period goals). Copy that day onto the next school day, the rest of the quarter, or through June. Copy Q1 → Q2 (or Q2 → Q3, Q3 → Q4) duplicates projects, planned days, and the Deck so you can edit the next quarter without losing this one. Job chip is two lines: SchoolTool then I'm in; Looks good after the last crew; Save names the cloud. Unlock during a Tech period opens Score; otherwise Admin → Today. Records inner bar is Backups / Names / Cloud.

## 1.90.17 — 2026-09-09

- Controls overhaul. HUD is icon-only (lock, help, language, cloud) plus one job chip. Admin is a 4-column tile pad, not a wrapping pill pile. Inner panes (Backups / Roster / Cloud) are one equal bar. Dash and Learn tabs are a single swipe row.

## 1.90.16 — 2026-09-09

- Full pictogram pass: Goals stages, Admin tabs, Records filters, Wall On/Off plates, Tools, Rank XP/$, Prints, Learn cards. Word still sits next to the mark.

## 1.90.15 — 2026-09-09

- Every place-chip has a pictogram next to the word (Wall, Teach, Deck, Week, Rosters, Admin, Learn). Same marks on the dock. Words stay so a phone still shows every option.

## 1.90.14 — 2026-09-09

- Do this now is off the live Dash. It was eating the phone and you could not scroll or hide it. Teach still has the beats. Turn the plate on in Admin → Wall if the projector needs it.
- Rosters sits on the bottom dock (PIN): class yearbook of crew banners and worker cards (gold if you lead). Legal names stay in Admin → Records. Wall arrange stays Admin only.

## 1.90.13 — 2026-09-09

- Wall arrange is Admin only (Admin → Wall). The live Dash no longer opens an editor, so the projector can scroll. Do this now is a real plate with a grip. Rosters sits on the bottom dock (PIN). Profiles and crews are trading cards: gold frame if you lead the shop, crew color banner, titles from Cub → Legend.

## 1.90.12 — 2026-09-09

- Unlock → Wall: Do this now, Club, Specials, Announce, and the live poll are plates — drag them with Now, Goals, Schedule, Modules, School, and Tools. Empty ones hide until they have something (they stay visible while you arrange). Grab the grip or empty space. The four beats fill the Do this now strip so the back row can read ENTER / LISTEN / CREW WORK / CLEAN UP. Theme → Size Fill preview includes that strip. SchoolTool stays the P1 chip.

## 1.90.11 — 2026-09-09

- Globe next to Help: English, Ukrainian, Russian at grade-6 reading. Help and Words switch. Shop words (kerf, grit, XP) stay English. Locked Learn opens Words (no PIN). Theme → Language still has Cubano, Arabic, and Farsi.

## 1.90.10 — 2026-09-09

- Week race feels like a shop championship. Gold shop lead and first crew (Berty celebrates). Everyone else sees how far back they are. Today’s strip is project, activity, and the Classroom assignment. Standings still lock as of yesterday. Empty board is a starting grid — score today, crown tomorrow.

## 1.90.9 — 2026-09-09

- Week race: classes and crews ranked on earned vs possible as of yesterday (today stays off the board on purpose). Today’s project, activity, and “look for a 3” sit on the strip. Shop lead and first crew get the gold — hold it. Classes / Roster tables are still there.

## 1.90.8 — 2026-09-09

- Separate is a roster rule: pick two names already on Admin → Records → Roster. They will not sit in the same crew. If they already do, the second name moves. Crew manager, the roster crew column, and a class move all honor it. Never on the wall.

## 1.90.7 — 2026-09-09

- Unlock → Wall: drag plates by the grip (Now, Goals, Schedule, Modules, School, Tools). Now and Goals stay two cards; they sit side by side when they are neighbors. SchoolTool, club, specials, and the live poll stay pinned. ↑↓ still works. Admin → Theme → Size Fill is from 1.90.6.

## 1.90.6 — 2026-09-09

- Wall plates fill: Now / Goals grow into leftover widescreen. Type and rings scale to the plate so the back row can read it. Teach slots do the same. Admin → Theme → Size: new Fill slider. Scale / Titles / Pad / Corners now actually drive the plates.

## 1.90.5 — 2026-09-09

- Polish: Now matches the class card on the wall. Columns start at 900px. Module On/Off is a chip. Teach slots fill the remaining board. SchoolTool and club share one strip. Cloud chip stays quiet.

## 1.90.4 — 2026-09-09

- Modules are back on the wall (Weather, Teach, Club…). Unlock: each card has On / Off. Admin → Modules is its own chip again (not buried under Class).
- Dash: Now sits beside the clock; module row + schedule fit on a widescreen. Teach: next class if this bell isn’t shop; slots fill the grid.

## 1.90.3 — 2026-09-09

- One desk. Bottom dock (Dash · Learn · Crew · Admin) on every screen. Widescreen is columns; portrait wraps the same cards. Web/Mobile switch is gone.

## 1.90.2 — 2026-09-09

- Cloud desk: every local save also writes to the internet. New room: Admin → Records → Cloud, paste the desk key, Pull. Names are locked with that key. This PC still saves if the pipe misses.

## 1.90.1 — 2026-09-09

- Deck: teacher Edit types on the slide. Save keeps it on this desk. Duplicate / add slide. Present still has no PIN. Factory deck restores the original. JSON download is your copy. PowerPoint is still the branded original.

## 1.90.0 — 2026-09-09

- Shop URL is live: tw.kulibert.net (Cloudflare). Google book, Deck, STEM skills, empty roster (FERPA). Class uses that address — not pages.dev.

## 1.83.1 — 2026-09-09

- Deck stays on the projector without a teacher PIN (it was snapping back to the wall).

## 1.83.0 — 2026-09-09

- Default deck: Dash → Deck. Navy + violet 16:9 slides (how the class works, four beats, 3/2/1, skills 1–4, STEM, safety, Do this now, cleanup, blank master). Present full screen. PowerPoint download. Aliases only.

## 1.82.0 — 2026-09-09

- Google book: one 2026-27 workbook from Admin → Records (also Data). Tabs: README, LOCK, YEAR, a mini dashboard per class (P1 / P2 / P3 / P8 / P9 / P10), study hall, club, UNITS, STEM stems, SKILLS, full-year YEAR MARKS (C1D1–C8D4), LOG, MASTER, LEDGER, VAULT, CALENDAR, CONFIG.
- Gold headers (tw_ keys) are locked for the desk. extra_1–extra_8 are yours — rename the label, type anything. Do not insert columns between gold headers. VAULT is legal names; class tabs are aliases only. No Apps Script.

## 1.81.0 — 2026-09-08

- Skills are STEM units now: every workshop and soft skill (and subskill) has a 1–4 evidence stem — one sentence you can see in the room. Watch shows the four stems, gold-rings the expected mark, and stores the sentence on the skill log.
- Projects are units: a driving question plus S/T/E/M chips. Activities carry the expected Watch mark. Dash and Watch show the question. Gradebook hover and the family sheet quote the stem, not just Beginning/Developing.
- Learn → Guide lists the four stems per skill. Words covers STEM, driving question, and evidence stem. Not a second MST score — Standard 5 stays on NY Tech.

## 1.80.99 — 2026-09-08

- Cleanup: dropped unused scoring leftovers (dead shop/skill lists, changelog/embed cards, unused pin state). ESLint prefer-const and unused imports across desk files.

## 1.80.98 — 2026-09-08

- Admin is Today · Records · Crews · Day · Class · Theme · About. Records opens Backups then Roster (snapshot → download → import). Day (cycle, bells, sub) is its own chip again.
- Cloudflare Pages: when CF_PAGES is set, Nitro uses cloudflare_pages (not Vercel). Build on GitHub: Node 22, command npm run build, output .output/public. npm run build:pages locally. Classroom book still lives on this device until the live pipe is wired.
- Modules stay Wall · Crew · Learn · Tools · After school · Games · Extra.

## 1.80.97 — 2026-09-08

- Day 0: seed roster is empty. Clear workers (Roster or Admin → Backups) snapshots first, then wipes workers and the ledger. Crews, bells, theme, and projects stay.
- Local backups manager: named snapshots, daily autos (30 days), download full backup (desk + Tech Club), restore from file, download all snapshots, CSV template. Empty desks save and reload — an older bigger roster cannot overwrite a newer clear.
- Import: CSV or paste Last, First, Period, IEP, 504. Period in the file is kept. Ready for real names.

## 1.80.96 — 2026-09-08

- Roster: every worker gets a locked unique id first; the wall alias is generated after add (not from the legal name). Type Last, First on the roster to add. Edit alias, legal names, crew, and flags in the table. Auto-save on this device plus a Save chip; leaving the page flushes a pending save.
- Existing ids stay put. Missing or duplicate ids are repaired on load without rewriting unique rows. Scores, XP, cash, skills, and ledger stay keyed to the id.

## 1.80.95 — 2026-09-08

- Menus wrap. Nothing scrolls sideways. Phone Dash chips: Wall · Teach · Week · YTD.
- Crew lead PIN opens a gold **CREW LEAD · SIGNED IN** kiosk: 1 Daily scoring, 2 Our crew (roster, avatar, notes, here/nurse/library, color, logo). No Admin, no Dash tools.
- Teacher keeps seating, bans, color, and logo in Admin → People. The Crew tab is daily scoring only.
- Admin Today is side-by-side: My day on the left, schedule / meetings / announcements on the right. The extra Day tab is gone.
- Modules regrouped: Wall · Crew · Learn · Tools · After school · Games · Extra.

## 1.80.94 — 2026-09-08

- Phone Learn: one nav (bottom dock + Book/Projects/Skills chips). Duplicate Learn rows gone. 1–4 skill pads are full-width and taller.

## 1.80.93 — 2026-09-08

- Week / Teach / after-school Dash actually scroll. Wall show-hide is one **Wall** button (On/Off + ↑↓), not a row of tiny ‹ › chips on every card.

## 1.80.92 — 2026-09-08

- Performance: scoring no longer deep-clones the whole desk on every tap. IndexedDB save waits for idle. Teach no longer re-paints the lesson every second (only the ring ticks).

## 1.80.91 — 2026-09-08

- One next-job chip (duplicate Score Pixel gone). Find is not a red “edit” field. Teach pad is lesson shapes only; objective edits on the CREW WORK card. Draw/Crew tools say Tap until you roll.

## 1.80.90 — 2026-09-08

- Next-job chip (unlock): one tap for SchoolTool, score the open crew, cleanup, or save this period. Scoring skips finished crews and stays in the period when the last crew is done.

## 1.80.89 — 2026-09-08

- Teach no longer turns into a giant CLEAN UP card (cleanup stays a chip; the lesson stays on screen). Shop pack is Workshop. Empty Settings strip is gone from Dash/Teach — settings live in Admin. Teach pad is one compact row.

## 1.80.88 — 2026-09-08

- Wall CSS is inlined in the page (plus /tw.css) so a missing hashed stylesheet cannot leave a white unstyled desk. Logo is 44px tall in HTML even if CSS is late.

## 1.80.87 — 2026-09-08

- Stale-script snag after a publish: Reload (not Try again) pulls a fresh desk, drops old caches, auto-retries once. HTML is not cached so the next open gets the new files.

## 1.80.86 — 2026-09-08

- Ribbon is only DASH · LEARN · CREW · ADMIN. Teach/walls under Dash. Check-in under Crew. Club/Hall/games under Admin. Settings drawer on every unlocked module (hide/show). Modules are on/off cards with Open. Look renamed Theme. Hover a theme paints the whole desk except the logo. Theme → Type: title, body, muted, chip, gold colors.

## 1.80.85 — 2026-09-08

- Roster for a class is a gradebook: alias, crew, this-cycle D1–D4, quarter 3/2/1 counts, XP, wallet $, one column per project, session mark. Same override as Learn → Book.

## 1.80.84 — 2026-09-08

- Admin is five tabs: Today · People · Room · Class · Device. People = Roster + Crews. Room = Day + Look. Class = Pay + Modules. Device = Backup + About. Club/Hall/Stocks stay under Other.

## 1.80.83 — 2026-09-08

- Roster now matches SchoolTool: 24 Tech sections (room 13, A/B, section 1–4 AM / 5–8 PM) plus Study Hall section 10 in room 136 for Q1–Q4. Tech Club stays extra (not ST). SchoolTool table view. Kids stamp course + section on load.

## 1.80.82 — 2026-09-08

- Theme Tools: hover only paints the Dash/Data preview. Click applies the theme, clears leftover palette locks, and loads those colors into the editor. Apply / Revert / Save custom. Daylight, Manila, Polar, Projector, Wrapping, Valentine, Pumpkin now have real CSS so chips aren’t dead.

## 1.80.81 — 2026-09-08

- Theme Tools: chip selector with wall / accent / type dots. No hover cards. Studio sits in the same Look section.

## 1.80.80 — 2026-09-08

- Roster module (Admin → Roster): all 24 Tech sections (6 periods × Q1–Q4) plus Study Hall and Tech Club. Year list of every kid — live, later-quarter, or club-only. Club names can be held on a worker id so skills stay until they have a Tech class. Place a held kid into a future section. Aliases only.

## 1.80.79 — 2026-09-08

- Teach Pad is off unless you tap Pad. Learn has the same card chips as Club/Dash: Book · Projects · Skills · Words · Guide, strike to hide.

## 1.80.78 — 2026-09-08

- Today’s goal card: project name, one “do this now” line, period + stage. No more Shop / Crew Work Day / skill stack. Crew rings only if crews are on different stages.

## 1.80.77 — 2026-09-08

- Copy: students do not carry bags. Enter / cleanup / help say sit with crew and keep aisles clear.

## 1.80.76 — 2026-09-08

- Club wall: competitions, upcoming events, activity timer. Cards toggle in Club settings. Cleanup wall owns 3:00–3:05 (jobs, stations, late bus) — class cleanup does not override club.

## 1.80.75 — 2026-09-08

- Cleanup wall only on the main Dashboard (kids all day). Teach / Learn / Desk / Other stay themselves — Teach gets a small Cleanup chip, not an orange takeover. Cleanup board now fills: jobs, project + goal, crews, next bell, extra-tidy cash.

## 1.80.74 — 2026-09-08

- Wall layout is back on the dash (unlocked): ‹ › reorder, tap a chip to hide/show, ▾ collapse a row in place. Order actually moves the cards.

## 1.80.73 — 2026-09-08

- Fewer taps: PIN opens when the digits are right. Unlocked period strip goes straight to Score on the first incomplete crew. Teach editor is always on (no Pad). New menu lives in Look, not the header.

## 1.80.72 — 2026-09-08

- Dash: Wall chip no longer owns a blank row. Now/class pack to content; school/year don’t stretch empty. Teach: hero isn’t a full-screen empty plate — period slots fill the rest.

## 1.80.71 — 2026-09-08

- One Admin submenu (Today · Crews · Look · Day · People · Class · Modules · Device). Duplicate Admin/Settings chip rows gone. Club/Hall/Prints stay under Other; Data lives on Dashboard. Theme swatches apply on tap — no hover preview cards.

## 1.80.70 — 2026-09-08

- Teach → Plans: date picker + week chips. Tap a period (with grade) to park the selected plan on that day in advance. Tap again to clear. Dashboard still reads the parked plan.

## 1.80.69 — 2026-09-08

- PIN fields show asterisks, not digits (desk lock, new PIN, portal, settings).

## 1.80.68 — 2026-09-08

- Dashboard info card reads Teach: lesson plan, current slot, objective. Project · stage · skill sit on the same card. Tap the title to open Teach.

## 1.80.67 — 2026-09-08

- Menu strip is its own full-width row. Tabs no longer sit in the logo/tools cluster or get clipped. Scroll sideways if the board is narrow.

## 1.80.66 — 2026-09-08

- New menu (toggle): **Dashboard · Teach · Learn · Other**. Tabs under each. Club + Study Hall under Other. Teach → Plans are reusable lesson cards (apply to any period / next quarter). Classic menu still available.

## 1.80.65 — 2026-09-08

- Cleanup on a phone: full-screen overlay, stacked jobs (not two empty columns), big type, catch chips scroll sideways. Works even if Web layout is on.

## 1.80.64 — 2026-09-08

- Projector pass: no export / due nags on Dashboard or Teach. SchoolTool is a chip. Module grid off by default. Teach fills the wall (big type, Berty, Pad folded). Empty $0 / same-phase crew rings cleaned up. Off-class periods on the strip stay quiet.

## 1.80.63 — 2026-09-08

- House profiles: **Berty** (mascot, poses, no wallet) and **Mr. K** (teacher card). Open from the version chip, Find, Teach tap, or Admin → About. Not student records.

## 1.80.62 — 2026-09-08

- Full class polls: Yes/No, A–D, 1–4, emoji, custom. Wall = bars only. Crew pad takes votes. History + question bank. Never touches grades, XP, or cash.

## 1.80.61 — 2026-09-08

- Save path stringifies the desk once (localStorage + IndexedDB). Clock default is beat; only countdown chips tick each second.

## 1.80.60 — 2026-09-08

- Dashboard stays the goals wall. Teach is the live pad (DO THIS NOW). Same Tools on both: timer, draw worker, draw crew. Unlock Teach to show/hide Slots · Tools · Packs · Objective.

## 1.80.59 — 2026-09-08

- Teach check for today: slots no longer overlap cleanup; after the bell it follows the next class (not leftover CLEAN UP on P1). Phone has a Teach chip. Empty schedule shows a fix hint.

## 1.80.58 — 2026-09-08

- Projects: left-column library. Drag titles into Grade 6 / 7 / 8. Click a title for every setting on the right. Save is the file. Assign to a grade or a crew from there.
- Seeds in Library: Logo design, Crew logo, Minecraft contest, Sanding challenge.
- Skill scaffold: each mark is dated, year-stamped, and tagged with crew/project/source. Profile → Skills shows year columns + best-ever. Crew changes do not reset the skill.

## 1.80.57 — 2026-09-08

- Crew leaders tap **Our crew** to set name, mark, and motto. Seats still teacher-only. Admin Crews has the same fields.

## 1.80.56 — 2026-09-08

- Settings: Look · Day · People · Class · Modules · Device · About. Lunch, privacy, and skill bands live in those. Default Teach pack is on Day.
- Skills Watch: 2×2 crew, gold ring if not seen, auto next crew, groups match today’s seats. Unseen ≠ Beginning.

## 1.80.55 — 2026-09-08

- Berty is one pose map everywhere: Teach, procedure, crew kiosk, Now dock, phone, cleanup. Cleanup / passing still win if the module is off.

## 1.80.54 — 2026-09-08

- Teach mode: Do this now. Shop / Demo / Critique / Training / Short / Sub packs stretch to the bell (delays included). Pin a slot, set today’s objective. Cleanup always wins. FERPA wall — no names.

## 1.80.53 — 2026-09-08

- Faster dash: module cards are light plates (ON only, no nested widgets). Reward meters computed once. Phone shows 8 cards max.

## 1.80.52 — 2026-09-08

- Dashboard Modules row: a card for every feature. Wall shows safe ON modules. Unlocked desk shows all (off cards dim). Tap opens the module.

## 1.80.51 — 2026-09-08

- Crew manager: daily group history, 3–4 seats, principal do-not-pair lock (off the wall). Scoring uses that date’s crew, not today’s.

## 1.80.50 — 2026-09-07

- Workflow polish: Admin Today is SchoolTool → Score → Save first. Assemblies folded away. Desk ST chip always on. Help opens on What is TechWorks? Trace hides idle rows.

## 1.80.49 — 2026-09-07

- Help: friendly “What is TechWorks?” welcome — XP, class $, 3·2·1, cleanup — for the wall and families.

## 1.80.48 — 2026-09-07

- Specials are a list: Grade 6 / 7 / 8 / All, any period (even not yours). Full 10-period strip marks ASM. Kids can read who/where/when.

## 1.80.47 — 2026-09-07

- Special / assembly days: pin title, place, and window on the dash for one date. Bell pack (Assembly, delay, half, or custom) applies that date only — default bells stay.

## 1.80.46 — 2026-09-07

- Role trace: Admin Today lists SchoolTool, crew scores, save, nurse, hall, club, cash. Help → Roles is the path for each person.

## 1.80.45 — 2026-09-07

- Lucky Bench: d6 (house ~8%) and Friday pot. Class cash only, 3 rolls/day. PIN. Not XP or grades.

## 1.80.44 — 2026-09-07

- Nurse / out-of-room: stamps leave and return time. Sets attendance. Tech with no 3/2/1 becomes Excused. Admin Today lists who is out.

## 1.80.43 — 2026-09-07

- Fidget census: variants, wild cards, made / released / in-wild / bin counts. Add pieces on the fly. +Var duplicates a color/finish.

## 1.80.42 — 2026-09-07

- Print catalog: Dragon / Axolotl / Snake S-M-L, Cheese Clicker, Keychain, Custom Choice S-M-L, Teacher Gift (grant, not cash).

## 1.80.41 — 2026-09-07

- Prints: 3D collection gallery (public photos + rarity). Cash buys. 2 rare or 3 shiny smalls → one large. Teacher bin + print-run log. Not XP.

## 1.80.40 — 2026-09-07

- Phone boot: crew kiosk no longer sticks after refresh. Dock stays. Heavy chunks wait until you unlock.

## 1.80.39 — 2026-09-07

- Crew lead kiosk: PIN 2222 on phone/iPad opens only the 2×2 for the live period. Auto-next crew. Projector stays the wall. Lock to exit.

## 1.80.38 — 2026-09-07

- Visuals pass: token text on Now/phone (no forced white), nested plate radii, no white CLOSED chip, dock mark, inputs stay on-theme, light-kind plates.

## 1.80.37 — 2026-09-06

- Look / themes: one page scroll (no nested max-height box). Preview sticks. Swatch grid + optional color tools.

## 1.80.36 — 2026-09-06

- Learn → Words: shop glossary (safety, measure, tools, materials, process, design, crew, grades, class). Kid definition + in-the-shop sentence. Project the card.

## 1.80.35 — 2026-09-06

- Tech Club IN pays class perks $10 and +2 XP once per day when the alias matches a class worker. Not effort, not the project grade. OUT does not claw it back.

## 1.80.34 — 2026-09-06

- Dashboard Tools toggle: focus timer, draw a worker, draw a crew, Ambient Chaos if that module is on. Off by default so the wall stays clean.

## 1.80.33 — 2026-09-06

- Berty back on cleanup (large, pointing) and between classes (procedure: enter → listen → work → clean). Always, even if the mascot module is off.
- Technical spec in Drive: TECHWORKS TECHNICAL DETAILS, VERSION 6.0 (HTML). Changelog twin: TECHWORKS-CHANGELOG-v1.80.33.md.

## 1.80.32 — 2026-09-06

- Public help: ? on chrome. Wall articles only (no PINs). Teacher help still full after unlock.

## 1.80.31 — 2026-09-06

- Profile: HUD sheet with Now / Skills / Family / Desk. KPI row. Roster + money stay behind PIN.

## 1.80.30 — 2026-09-06

- Family view: one project mark, 1–4 skill words, presence not averaged, no wallet/IEP on the print sheet. Portal shows the same card under the badge.

## 1.80.29 — 2026-09-06

- Cool factor: HUD corners, live LED + breathe on Now, podium glow on #1, one-shot logo shine.

## 1.80.28 — 2026-09-06

- Desk save: one pack, one stringify, one IDB transaction. DJIA 90s cache, weather 10 min, shared in-flight fetch.

## 1.80.27 — 2026-09-06

- Chrome padlock: mode strip no longer eats clicks. PIN pad portals to the body.

## 1.80.26 — 2026-09-06

- Admin Today/Data/Hall stay in Admin, not the chrome row with Find. My Day card: SchoolTool, score, save, meetings pin.

## 1.80.25 — 2026-09-06

- Published clicks: clock no longer re-renders the whole wall every second. Crew marks clone once. Saves debounce. Desk/Learn chunks prefetch.

## 1.80.24 — 2026-09-06

- Desk = daily check-in and pay. Learn = Book, Projects, Skills, Guide. Daily score pad no longer lives in Learn.

## 1.80.23 — 2026-09-06

- Projects tab: today + crew rings, one project editor, plan book, cycle-crew assign. Setup (dates, skills) folds away.

## 1.80.22 — 2026-09-06

- Web chrome matches the wall: Dashboard · Desk · Learn · Admin in a gadget strip. Projector keeps the same four; Desk/Learn/Admin still ask for PIN.

## 1.80.21 — 2026-09-06

- Progress is loops now: cycle / quarter / year rings, crew race rings, period leftover ring. Visitor stays a chip.

## 1.80.20 — 2026-09-06

- Visitor OPEN/CLOSED is a chip, not a giant dial. Web/mobile toggle sits next to the padlock.

## 1.80.19 — 2026-09-06

- Projector wall is an instrument panel again: bezel plates, LED race bars, OFF/live dial, readout ranks.

## 1.80.18 — 2026-09-06

- One gradebook mark per project. Each activity still averages its own 3/2/1 days + skill. Scoring follows the crew assigned that cycle (Projects → Crews).

## 1.80.17 — 2026-09-06

- Theme picker: fake card on the left, swatch grid on the right. Hover no longer paints the whole wall.

## 1.80.16 — 2026-09-06

- Phone Board is a wall: live period + time bar, goal hero, 2×2 crew tiles, school medals. Tap XP/$ to flip rank.

## 1.80.15 — 2026-09-06

- Faster first paint: default fonts only (others load if you pick them), desk loads once, phone cards skip off-screen work, hydration no longer blanks the wall.

## 1.80.14 — 2026-09-06

- Phone Board is readable: bigger lockup (no empty navy plate), larger names/XP, Hall/Admin chips, tighter cards. Dock labels are white, not gray.

## 1.80.13 — 2026-09-06

- Phone header shows the full TECHWORKS lockup on its own row. Hall and Admin sit under it. The old 32px cap only showed the T.

## 1.80.12 — 2026-09-06

- Live: final purple–blue kit + web Board fill (Now · Goals · bells · School). Fold stack gone on the projector wall. Undo theme: 1.80.11 tgz. Undo wall: 1.80.9 tgz.

## 1.80.11 — 2026-09-06

- FINAL default tokens: bg #06122B, accent #22D3EE, royal #3B82F6, indigo #6366F1, violet #A855F7. Paw still Bearcat only. NOT published. Undo: artifacts/restore/TECHWORKS-RESTORE-1.80.10.tgz or 1.80.9.tgz.

## 1.80.10 — 2026-09-06

- Default theme is the purple–blue logo kit (cyan CTA, royal, violet). Paw orange is Bearcat only. One specular + one glow. Lockup stays brand/techworks.png. NOT published until GO. Undo: unpack artifacts/restore/TECHWORKS-RESTORE-1.80.9.tgz over src/ and public/.

## 1.80.9 — 2026-09-06

- GUI rescue. No white/5 panes. Hydration banner stays off. Today's goals stays on a Tech period (not empty P6). Now extras on by default for new layouts. Undo: unpack artifacts/restore/TECHWORKS-RESTORE-1.80.8.tgz over src/ and set APP_VERSION 1.80.8.

## 1.80.8 — 2026-09-06

- StyleBot grafts. Default wall is paw #E85820 + royal #1E4BAF (lockup stays cyan). **Roll the Dice** is the neon alt kit (Admin → Look). Solid PIN/Help/drawer scrims. Cancel buttons are fg + 2px ring. Version chip lives in chrome, not over TOP 3. Hard press rings. No white-flash hovers.

## 1.80.7 — 2026-09-06

- Publish pack. Hall wall (projector) does not ask for PIN. Hall Manager still does. A+B grafts live.

## 1.80.6 — 2026-09-06

- Study Hall Manager is a real desk (Admin Hall Mgr, P6 tap, phone Hall). Check-in pad plus a student drawer (where, ready, on-task, note). P6 on the clock is not the manager.

## 1.80.5 — 2026-09-06

- Version honesty. Chip, About, Help, changelog header, and copyright line are one string from APP_VERSION. No live “TechWorks 1.0” footer.

## 1.80.4 — 2026-09-06

- Diego punch (incremental, not the 2.1.0 zip). Cub→Legend toasts on Desk and Skills. Store / hall store flash when they can't afford (wallet only). DHH/ELL/supports are quiet chips on profile (PIN). Names vault frozen via VAULT_FIELDS. Due count is a red chip next to Lock. Study Hall still off class boards unless Data → Mix.

## 1.80.3 — 2026-09-06

- Study hall is an iPad check-in pad: fat HERE / NURSE / LIBRARY / TEACHER / TEST tiles. Notes and timer on the left. Tech Club is two columns — left: today’s goal, custom timer, cleanup alarm; right: roster tap IN/OUT (save names once). Calendar tucked away.

## 1.80.2 — 2026-09-06

- Local-first vault. Saves on this device (storage + daily snapshots). Schema upgrades migrate — they do not wipe. Admin → Device: save now, download desk backup (names, private), restore from file, restore a snapshot. Live wall export still exists (aliases only). Drive later.

## 1.80.1 — 2026-09-06

- Hydration snag (React #418): the wall is client-only, layout/embed/PIN read after mount, and the red banner ignores hydration noise. Phone still becomes the app after the first paint.

## 1.80.0 — 2026-09-06

- Three screens, one app. **Phone** = dock (Board · Crew · Skills · Projects · Desk). **Projector** = FERPA wall, lock only. **Workstation** = Board · Desk · Learn · Admin with short subs. Desk is Effort/Skill/Crew. Learn is Evaluate/Book/Projects/Sit-down. Admin holds Data, Stocks, Hall, Club.

## 1.79.18 — 2026-09-06

- Evaluate / Desk is the recording pad: Effort (3/2/1) and Skill (1–4, today's project skill) on the same crew walk. Skills dock opens the skill pad. Book and Projects stay next door. Sit-down skill map remains under Learning → Skills.

## 1.79.17 — 2026-09-06

- Phone Desk: no empty 4th cell, 3/2/1 stay large, More no longer crushes the pad, Crew 3 chip gone (All 3s stays). Skills Watch is the same walk as Desk — this period, one crew, 1–4 taps, Next crew.

## 1.79.16 — 2026-09-06

- Phone snag “Failed to fetch dynamically imported module / orbit-…/routes-….js”: route code-splitting is off so the wall is one bundle. Snag screen has Reload (and one auto-retry).

## 1.79.15 — 2026-09-06

- Phone feed matches the card-stack idea: ▲▼ sit above each card, crews show top 3 XP, goal is a sentence + watch skill. Our navy/cyan lockup, Admin + lock, and Board · Crew · Skills · Projects · Desk dock. Projector wall unchanged.

## 1.79.14 — 2026-09-06

- Phone Board is a card feed (goal, this period's crews, school top 5) with Skills/Perks and ▲▼. Dock is Board · Crew · Skills · Projects · Desk. Projector wall unchanged.

## 1.79.13 — 2026-09-06

- Phone layout keys off the real screen (Galaxy S22 360px), not the Grok iframe width. Embed no longer forces projector on a phone. Bottom dock + filled School row so the navy hole is gone.
- Technical spec in Drive: TECHWORKS TECHNICAL DETAILS, VERSION 4.0 (HTML). Changelog twin: TECHWORKS-CHANGELOG-v1.79.13.md.

## 1.79.12 — 2026-09-06

- Phone shell for Galaxy S22 / Android Chrome: Android Mobile UA always uses the pad layout (not a squeezed projector). Bottom thumb dock Wall · Score · Crew · More. Score fills the screen. 16px fields so Samsung does not zoom. Safe-area and 100dvh.

## 1.79.11 — 2026-09-06

- Score pad fills the phone: 2×2 crew cards stretch, 3/2/1 are large taps, Next crew sits on the bottom. Learning nav is icons on mobile so the pad gets the screen.

## 1.79.10 — 2026-09-06

- Dashboard density: no empty stretch in Today's goals. Crews 2×2. Reward and top 3 sit beside the race. Schedule is two rows of five. Now no longer duplicates the project. Type contrast up. Study hall off the class-pizza strip.

## 1.79.9 — 2026-09-06

- Caught-cleaning bonus is +$5 wallet (max 2/day), not XP. Miss remains −$10. Skill marks stay about craft.

## 1.79.8 — 2026-09-06

- Learning Center polish: one nav bar, accent for the live pane, Skills Watch is 2×2 marks per worker, Guide splits Benchmarks vs class means. Period chips match the rest of the desk.

## 1.79.7 — 2026-09-06

- Cleanup is a full-screen coral card: Workshop jobs vs Classroom tidy (Hall has its own list). Berty points. Teacher taps an alias for +1 bonus XP when they catch extra cleanup in any space (max 2/day). Desk hides the card until the next period.

## 1.79.6 — 2026-09-06

- Berty is lockup-colored (cyan / violet). He only works cleanup: pointing on the daily-goal card and the cleanup bar. Otherwise he peeks as a 24px icon in the version chip, Help, Week, YTD, PIN, and Study Hall.

## 1.79.5 — 2026-09-06

- Phone layout: smaller lockup, wrapping header, 44px taps, 2-col period strip, version chip out of Berty’s corner. Berty is about half the old size, and even smaller on a phone.

## 1.79.4 — 2026-09-06

- Copyright and trademark notices: © 2026 Richard Kulibert. TECHWORKS™. Help, logo hover, version chip, LICENSE.

## 1.79.3 — 2026-09-06

- Dashboard is quieter. LAYOUT is a small Arrange control (unlocked only). Row move/hide tools appear only while arranging. Now extras default to showing the project. Labels are sentence-style; chips are round.

## 1.79.2 — 2026-09-06

- Default TechWorks theme matches the lockup: deep navy, electric cyan, violet. XP stays champagne gold. Cleanup stays coral. Old Solvay orange palettes no longer override the brand.

## 1.79.1 — 2026-09-06

- Club calendar is week-by-week: default days (Tue on), skip / extra, overlay per day, a note for the week. Dashboard shows Tech Club Today when it meets, cleanup when it is live, or Next club · date otherwise. Half days stay off unless you add them.

## 1.79.0 — 2026-09-06

- Technology Club module. Isolated from class XP and wallet. Sign in (first + last initial), four stations, late-bus call list, 3:00 cleanup / 3:05 door, optional 8-meeting Workshop overlay, minutes export. Admin → Club. Does not mix with Tech rankings.

## 1.78.0 — 2026-09-06

- Full rebrand to the cyan–violet T lockup. Default wall is navy / cyan / violet. Outfit type. Cleanup stays coral. Share card and tab icon match.

## 1.77.6 — 2026-09-06

- The word “shop” is gone from the wall, pad, portal, help, and lockup. It is a workshop / class. Store stays Store. Berty’s pointing hand is on the artboard this time (mitt + finger, left of the body).

## 1.77.5 — 2026-09-06

- One shop clock. Score pad and Dashboard only redraw when the period or minute changes. Now / cleanup still tick each second. Scoring no longer restarts the SchoolTool alarm on every mark.

## 1.77.4 — 2026-09-06

- Admin Today is one class strip (period, scored, due, SchoolTool link, Score). Evaluate is one row: Score · Book · Guide · Skills · Projects. Score pad is date / A-B / period / Daily+. Settings still live under Daily+ and Admin Look/Day/More.

## 1.77.3 — 2026-09-06

- Admin SchoolTool **open** / **in** opens Solvay SchoolTool in a new tab.

## 1.77.2 — 2026-09-06

- Berty’s pointing pose had no hand — the claw was drawn off the artboard. Pointing arm now has a palm and a finger, in front of the body.

## 1.77.1 — 2026-09-06

- Lockup and Solvay Dark share one brand: navy plate, royal edge, orange blade, TECHWORKS / SHOP. Wallpaper is ember + royal, not lime. XP gold stays on amounts. Logo still ignores every other theme.

## 1.77.0 — 2026-09-06

- Wall Dashboard is the slide: period + time, Goals row, School board open. Passing still gets Daily Procedure. Teacher extras (Now goal, calendar bars, visit, weather, live procedure chips, rank toggles, Layout) stay as Layout toggles — off by default, never deleted. Layout strip is collapsed until you tap it. SchoolTool alarm unchanged.

## 1.76.6 — 2026-09-06

- Dashboard layout (Admin only): show/hide each row, ▲▼ order, School top 5/10, procedure chips on/off, Reset. Saved on this device. Wall stays clean.

## 1.76.5 — 2026-09-06

- Unlock Admin to reorder Dashboard rows (▲ ▼). Order is saved on this device. SchoolTool alarm stays on top.

## 1.76.4 — 2026-09-06

- Between classes, Berty points at Daily Procedure: 1 Enter 2 Listen 3 Crew work 4 Clean up. Current step stays gold during the period.

## 1.76.3 — 2026-09-06

- Cleanup alert puts Berty on the coral bar, pointing. That pose wins over every other Berty setting, including the module toggle.

## 1.76.2 — 2026-09-06

- Cleanup lead is ±1 minute (default 5). Pick BELL / CHIME / BUZZ / WOOD / TONE and tap Preview. Admin → Day.

## 1.76.1 — 2026-09-06

- TECHWORKS lockup is a navy rectangle with orange underbar. Same on every screen. Themes cannot recolor it.

## 1.76.0 — 2026-09-06

- Projects now have Activities. The plan book maps Cycle × Day 1–4 (a 4-day cycle can be four different days). Gradebook columns are those activities. Dashboard shows today’s activity. Action Figure is a Grade 6 option. Skills stay 1–4 XP.

## 1.75.2 — 2026-09-05

- Lighter taps: no gold glow on chips, idle clocks share one 30s tick, Crew/Stats warm on hover, Berty SVGs drop the shadow filter. Find shows from tablet width.

## 1.75.1 — 2026-09-05

- Phone wall: Overview/Week/YTD labels show again. Berty stays small in Now on phones (no overlay on the roster). Idle clock ticks slower. Stocks fetch waits until that module is on.

## 1.75.0 — 2026-09-05

- BertyBot on the wall and pad. Pose follows the shop: wave when class is live, point at cleanup, think when closed or due, celebrate when the class reward hits. Off in Admin → More → BertyBot.

## 1.74.0 — 2026-09-05

- Closed-shop wall (weekend / after bell). Projector mast is Dashboard only. Now is three equal panes. Score P# opens the pad. Teacher PIN is set once — not 1111.

## 1.73.0 — 2026-09-05

- Packed the mast to one row (modes + subs). Dashboard Now/goals fill the width; empty announcement bars hide on the wall.

## 1.72.0 — 2026-09-05

- Round 1 GUI: mark-only mast, centered modes, gold subs, no duplicate Admin/Learn titles, compact module tiles.

## 1.71.0 — 2026-09-05

- Four modes on the top bar: Dashboard · Crew · Admin · Stats. Submenus sit under them. Hamburger is gone.

## 1.70.0 — 2026-09-05

- Evaluate auto-scores from project phase + required skills. Themes cut to shop, ADA, holiday. Theme tools can **Save theme**. Selected chips are gold, not blank white.

## 1.69.0 — 2026-09-05

- Learn holds **Evaluate** (Score pad + grade book + guide). Menu is Wall · Shop · More. Crew pad stays its own door.

## 1.68.0 — 2026-09-05

- Locked shop mark: hex nut + stamped paw. Theme tools **Finish** tab: plate, steel, cast, chipboard, felt — same material shadows as the wall.

## 1.67.0 — 2026-09-05

- Dashboard clicks no longer wait on the clock. Saves debounce. XP table is cached. Folds unmount closed rows.

## 1.66.0 — 2026-09-05

- Natural chrome: press, hover, gold focus ring, thin scrollbars, chevron fold, bars ease. Respects reduced motion.

## 1.65.0 — 2026-09-05

- Dash goals are a 3-column grid (project/race · reward · top 3) that fills the wall. Rows collapse. Chrome is icon-first; Screen guide / Tips puts the words back.

## 1.64.0 — 2026-09-05

- Default is Solvay Dark: near-black navy, white type, paw-orange trim, lime/gold sparks. Red ring for Admin. Coral for cleanup. Cash-contrast cards.

## 1.63.0 — 2026-09-05

- Learning center combines Skills and Projects. Tabs: Skills, Soft (listen, share, grit, care, time, lead), Benchmarks, Data, Projects. Sub-skills under each shop skill. Project header shows today’s phase.

## 1.62.0 — 2026-09-05

- Today's goals: project name, desired stage, crew finish race bars, class reward, top 3, Score button.
- Hall wall lives only on the Study Hall pad (See wall). Off the projector dash and hamburger.

## 1.61.0 — 2026-09-05

- Grades: column names are the project (CO2 dragster · Cycle 1). Assignment names lists them and downloads a text file so the button works without clipboard.

## 1.60.2 — 2026-09-05

- Study hall clock: gold ring, MM:SS in the middle, “still time / five-minute glow.” Pulses coral at cleanup.

## 1.60.1 — 2026-09-05

- Fluid wall: look no longer pads every card. Phone caps type and chip height. Mast wraps. Period strip stays 5-up until wide. Admin tabs scroll. Theme preview stacks under tools.

## 1.60.0 — 2026-09-05

- Theme tools: left tabs (Size, Color, Type, Caps, Language), right Dash/Data preview. Caps / small-caps / shadow / glow toggles. Translate: English, Cubano, Українська, Русский, العربية, فارسی. Noto + Naskh packs. RTL for Arabic and Farsi.

## 1.59.1 — 2026-09-05

- TechWorks wordmark opens the FERPA wall (aliases only).

## 1.59.0 — 2026-09-05

- One Admin menu across the top (Today + Look, Day, Lunch…). The pane below is that module. Settings overlay and side nav are gone.

## 1.58.0 — 2026-09-05

- Now chip floats between Find and Lock (period + countdown + lunch). Lunch settings live in Admin → Lunch (pull PDF, fill month, history). Score only displays today’s entrée.

## 1.57.2 — 2026-09-05

- Hall wall is a view, not just P6. Menu Wall → Hall wall, P6 on the strip, Admin See wall, Study Hall pad See wall.

## 1.57.1 — 2026-09-05

- Today's goals: one phase title, period+project under it, crews only if behind, scored count. Dropped OPEN, duplicate Idea chips, and "threes" jargon.

## 1.57.0 — 2026-09-05

- Theme tools: eight look knobs — Scale, Titles, Chips, Corners, Stroke, Pad, Lift, Wallpaper — plus color and type. Sliders paint live; Apply look saves; Reset Solvay.

## 1.56.1 — 2026-09-05

- Theme tools: 10 font packs (Archivo, Oswald, Teko, Space Grotesk…). Dash/Data preview the type. Apply look / Reset Solvay.

## 1.56.0 — 2026-09-05

- Cleanup 5:00 warning + MM:SS on every screen. Theme tools: navy/orange/royal/white/gold pickers, Apply/Reset, live Dash and Data mini cards.

## 1.55.0 — 2026-09-05

- Solvay default is navy field, paw orange, royal-blue hits, white trim and text, real shadows. No more paper gray.

## 1.54.2 — 2026-09-05

- Hall store is its own catalog (snacks, supplies, quiet, perks). Tech store never lists P6.

## 1.54.1 — 2026-09-05

- Study Hall stays in its module. P6 still on the daily schedule. Data can Mix study hall into charts. Projector no longer swaps to the SH wall at lunch.

## 1.54.0 — 2026-09-05

- Projects grid: Cycle 1 Day 1 is Idea, then Design → Model → Finish → Present/Critique. Study Hall is not a project — On task pays $20 that day.

## 1.53.1 — 2026-09-05

- Profile avatar picker: full-width grid under the name, not a 64px popup that spilled over the card.

## 1.53.0 — 2026-09-05

- 17 school days of mixed shop data (Sep 8–30): 3/2/1/A/E/P, one 3-day absence streak per class, skills, wallets, invests, snacks, cleanup, affect, SH productive/peaceful, lunch, visits. Fresh device key so day-0 is replaced.

## 1.52.1 — 2026-09-05

- Dash: Cycle 3s → Best workers (top 10 shop, combo rank). Reward bar stays.

## 1.52.0 — 2026-09-05

- Admin is the teacher desk home: settings chips, at-a-glance stats, this-class card, past-due crew links into 2×2 scoring. Modules on if enabled.

## 1.51.0 — 2026-09-05

- Admin home: compact tiles, status (cycle · sub). Day / Look split. Settings Day no longer duplicates project goal chips.

## 1.50.3 — 2026-09-05

- Periods that already ended grey out on the dash schedule and Desk chips. Still tappable.

## 1.50.2 — 2026-09-05

- Admin Day: Sub day toggle. All SUB also voids the day. Dashboard switches to Sub today (clock + bells stay, no scores). Same as Desk SUB.

## 1.50.1 — 2026-09-05

- Dash Today's goals: no stage chips. Shows the project cell (phase · skill). Edit in Projects or Desk Daily settings.

## 1.50.0 — 2026-09-05

- Desk: Daily settings collapses (date, bells, lunch, ST, SUB, goals, happened, leader). Scoring is period chips, crew chips, 2×2 worker grid, Undo / All 3s / Next. No page scroll.
- Bot style guide: STYLE.md at the repo root. Read before edits.

## 1.49.0 — 2026-09-05

- Projects: school cycle chips (1–8) assign 1 or 2 cycles and fill start/end from the calendar. Today’s D1–D4 cell is inferred from the district calendar. Tap a cell to edit phase and Skills-module pedagogy (does/why). Use cycle dates reapplies.

## 1.48.0 — 2026-09-05

- Dash: This class → Today's goals. Pulse “In shop” → best crew name. Announcements always listed (collapsed) under Today's goals. Shop wall removed.

## 1.47.0 — 2026-09-05

- Week matches YTD: cycle XP/$, progress bar, 3×2 class cards with XP/$ bars. Options: Classes/Roster, Codes, XP, $, Effort, Phase. Remembers on this device.

## 1.46.0 — 2026-09-05

- Projects: start/end dates, top 4 skills, constraints. Goal phase vs each crew’s current phase. Behind the goal costs 2 XP per phase; dash shows who is chasing. Ranks use taxed XP.

## 1.45.0 — 2026-09-05

- Dashboard rows collapse (+/−). Dropped the G6/G7/G8 goal row (duplicate of This class) and the by-period effort list (duplicate of the schedule). Pulse and cycle spark start folded.

## 1.44.0 — 2026-09-05

- Solvay Light: navy Now bar, paw orange only for live/action, true gold for XP type, quieter wash, white type on orange/navy. Day strip live is orange with white times.

## 1.43.0 — 2026-09-05

- Desk: dropped the Bells button next to Admin. Bell schedule / delay / lunch live in Admin → Day. Admin hub tile is Day.

## 1.42.0 — 2026-09-05

- Admin → Day → Daily schedule: OPEN / MEETING / CLOSED / SUB per period (pass/visit). Shows on Dashboard Now and This class. Unlock to cycle.

## 1.41.0 — 2026-09-05

- Data → Archive loads a fake 2025-26 year (72 shop + 14 study hall, four sessions) in IndexedDB. Live roster stays empty. Charts read stamp weeks, not only this calendar.

## 1.40.0 — 2026-09-05

- Dashboard: Now (live period + minutes) sits above the schedule. This class below the strip is the action (goal, Score, top 3). Peek still works.

## 1.39.0 — 2026-09-05

- Dashboard opens on the live class. Tap another period on the strip to peek it (navy ring). Gold is still the bell. Now Pn snaps back.

## 1.38.0 — 2026-09-05

- Default theme is Solvay Light: paper, navy, royal, paw orange. Poster wash, tight Archivo, orange type. Solvay Night stays as the dark twin.

## 1.37.0 — 2026-09-05

- Study Hall wall has the helper game: Fair, XP, Draw (names spin), or tap a friend. Unlock to play.

## 1.36.0 — 2026-09-05

- Study Hall wall: toggleable Notes from Grade 5 teachers and Owes work. When on, they sit at the top and push helper / with-us down. Edit on the Study Hall pad.

## 1.35.0 — 2026-09-05

- Study Hall projector: “Productive or peaceful.” Helper of the week, minutes left, with-us cards. Age-10 voice. Not a shop scoreboard.

## 1.34.0 — 2026-09-05

- Dashboard always shows XP and $ together. Cycle chip and Skills/Perks toggle are gone (cycle is on the progress bars).
- Clock is a high-contrast pill + fg bar so Lilac (and other light sheets) can read minutes.

## 1.33.0 — 2026-09-05

- Dashboard clock is one left-packed bar: Skills/Perks, cycle, minutes, period, goal. No empty TIME LEFT / THIS PERIOD columns.

## 1.32.0 — 2026-09-05

- Admin tiles grouped: Today · Class · Games · System. Room tile is Settings.
- Settings tabs: Look · Day · Roster · Money · Skills · Modules · Privacy · About. Modules groups: Projector · Desk · Games · Profile · Skills · Debug.

## 1.31.0 — 2026-09-05

- P6 is back on the day strip as a clock slot. Tech effort, XP, Week, and default Data stay shop-only.
- During Period 6 the projector Dashboard becomes the Study Hall wall (line leader, here/out, on-task). Not pay.
- Data → Building mixes SH kids in for a building rank. Tech only is the default.

## 1.30.0 — 2026-09-05

- Unlock lands in Admin (icon tiles, Score is the clipboard). Lock returns the wall. Find sits left; lock stays right.
- Profile: circle emoji avatar, 30 shop-safe icons. Default is a hashed pick from the first eight.
- Stocks: period list, three slots per row, tap to pick. Draw blanks / same 3 for crew. No alias dropdown.
- Shared Chip / Btn / TogglePair. Skills–Perks toggle moved left.

## 1.29.0 — 2026-09-05

- Week shows all six Tech classes (no AM/PM split). Study Hall is only the Study Hall tab — off Dashboard, Week, Data, Year, Desk chips, and the day strip.

## 1.28.0 — 2026-09-05

- Hamburger items have Lucide icons. SchoolTool wall chip is a clipboard row (no pulse-shout). Tools down has a clock icon.

## 1.27.0 — 2026-09-05

- Dashboard SchoolTool banner: dashed “open” until P1 attendance is in. After 8:15 (or delay attend-by) it pulses red — “Remind the teacher.” Beeps during P1. Unlock → ST in. Link opens SchoolTool. Stays until you mark it.

## 1.26.0 — 2026-09-05

- Projector wall: Tools down only in a shop period. Tap a grade card to set today’s agenda. Two announcement cards in Admin → Day.
- Shop list shows every worker, XP first, $ second.
- Study Hall line leader is weekly. Out chips: HERE / TEACHER / NURSE / LIBRARY / TESTING on the row.
- Pumpkin theme: brown text, amber gold, cream surfaces — no more orange-on-orange.

## 1.25.0 — 2026-09-05

- Projects module: one shop build per grade. Stages (cycle × D1–D4) set the dashboard agenda, Skills focus, and gradebook titles. Default: Simple machines (6), CO2 dragster (7), Product design (8), Independent work (SH).

## 1.24.0 — 2026-09-05

- Scoring: giant 3/2/1, Crew 3, auto-advance. Invest/mood behind More. Observed removed. Happened is one line.
- Study Hall: one line leader (Fair / XP / Draw / tap). Exception pad — HERE and ON TASK unless you tap OUT, OFF, or CLEAN.
- Config lives in Admin. Desk header has delay chips. Shop and skill lists moved to Admin.
- Screen guide replaces Tips. Professional one-liners. Sort is text (column words), not pills.
- Period clock and class reward sit side by side.

## 1.23.0 — 2026-09-05

- Themes are mixed: Daylight (15 light walls) plus night Solvay / candy / voltage / holiday. Gold chips on light walls use dark-safe text. Cleanup coral and due red stay.

## 1.22.1 — 2026-09-05

- Daily goals are chips (Admin, Desk config, period facts). Selected chip is gold. No more full-width dropdowns.

## 1.22.0 — 2026-09-05

- Weather, cycle/quarter/year bars, and the cleanup alert live on the Dashboard, not the mast.
- Grade goals are four big cards; the class in session is gold.
- This-period stage: giant minutes left, period bar, today’s 3s / scored, cycle effort, reward, top 3.

## 1.21.0 — 2026-09-05

- Mast: hamburger left, TECHWORKS, current view in gold text, live period + countdown inline. All other nav is a text drawer (current row gold).
- Dashboard: full-day bell strip (your 6 shop periods lit, current gold). Current-period stage with huge P#, goal, countdown ring, top 3, reward, Score button.

## 1.20.0 — 2026-09-05

- Debug module: Fake data sets (Off / One week / One cycle / Messy cycle). Paints Dashboard, Week, Data, Year only. Desk and the saved roster stay day 0. PIN → Admin → Modules.

## 1.19.0 — 2026-09-05

- Shop skills are 1–4 (Beginning, Developing, Proficient, Distinguished), same ladder as NY Tech / NYS performance levels. Portrait of a Graduate is tagged on each shop skill (not a second grade).
- Class reward is per period. Progress on Dashboard period rows, Desk clock, Skills, Admin → Economy.

## 1.18.0 — 2026-09-05

- Dash 2.0: KPI row (effort, in-shop, mean XP, wallets) vs last cycle, sparkline of daily 3s, class-reward gauge, period effort bars with the cycle goal on each class, D1–D4 3s, school top 10. Day 0 shows empty-state, not fake numbers. Dark Solvay only.

## 1.17.0 — 2026-09-05

- Admin console (PIN): Room, Day, Roster, Economy, Skills, Modules, Privacy, About. Settings is no longer one long scroll.
- One dashboard: 3×2 classes, school top 10, study hall strip, live period + cleanup clock. Week / YTD / Data stay in the menu, not inside the wall.

## 1.16.0 — 2026-09-05

- Solvay default: deeper navy, royal glow, paw orange, gold XP. Vibes are gone — every pick is a full theme (colors + fonts). Candy: Bubblegum, Candy Red, Mint Dream, Grape Crush, Blue Slushie, Sour Apple, Cotton Candy, Caramel Corn. Voltage: Lava Lamp, Neon Soda, Electric Lime, Tiger Pop. All dark. Cleanup coral, due red.

## 1.15.1 — 2026-09-05

- Year-scale storage: marks pack into a school-day tape (one character per day). Empty maps are omitted. Hot file keeps this week + last 10 day logs; older logs go to IndexedDB. Live export uses the tape, not a date dictionary.

## 1.15.0 — 2026-09-05

- Day 0 of 2026–27. Marks, wallets, skills, stocks, day log, and sessions cleared. Q1 live roster only (12 per class + study hall). New local save key so last year’s Q2 file cannot overlay this start.

## 1.14.2 — 2026-09-05

- Wall paints faster: class boxes show top 5 (tap +N for the rest), due/overdue is one roster pass, rank totals are memoized, wall scoring waits so Desk taps stay snappy. Dead Week copy removed from the main board.

## 1.14.1 — 2026-09-05

- Visible crash gate: gold TechWorks card instead of a blank navy wall. Red banner for script/promise errors. Corrupt local save falls back to the seed roster.

## 1.14.0 — 2026-09-05

- Shop Chrome trial: Wall (not Board) in one icon row; no second Board/Week/Year tabs. Desk = verify + Gear/Bells drawers, red field rings not a red page. Phone desk shows the live period. Assist/Clean/Invest under More. Holiday themes overlay accent/gold on a dark sheet.

## 1.13.6 — 2026-09-05

- Streamline A–H: drop unused auth/db/P2P; dead desk file; changelog not on first paint; Desk config/schedule split; store persist split; portal/store/stocks/NY Tech/Ambient off by default; Week/Data/YTD live on the School wall; English only.

## 1.13.5 — 2026-09-05

- Layout autodetect: phone/iPad → mobile, projector/desktop → web. Follows resize and rotate. Phone/Web buttons hold for this tab only; crossing a breakpoint returns to auto.

## 1.13.4 — 2026-09-05

- Phone load: lazy-load Desk/Settings/etc so Overview paints first. Fewer Google fonts. iOS layout loop killed. Market fetch waits 1.8s. localStorage reads won't throw in private Safari.

## 1.13.3 — 2026-09-05

- Three projector walls on Overview: **Classes** (3×2), **Live** (this period + crews), **School** (top 10 + class leaders). Aliases only.

## 1.13.2 — 2026-09-05

- Removed At home / portal from the default path. Wall = aliases only (FERPA). Teacher desk PIN required; idle lock 5 min; Change PIN needs current PIN; boot no longer resets PIN to 1111.

## 1.13.1 — 2026-09-05

- Study Hall **where**: HERE · NURSE · LIBRARY · TEACHER · TESTING · OFFICE · EXCUSED · ABSENT. Note only — not Tech pay or XP. Out of room dims Ready / On-task.

## 1.13.0 — 2026-09-05

- Crew pad: live period only; 2222 to see other classes.
- Home portal: today card (mark · ◆ XP · market), no week grid.
- 4-tap add a class: period → paste Last, First → aliases → Desk. More · Add class.
- Desk P-close strip: SchoolTool · Attendance · Cleanup · Export.
- Profile: Print for parent. Wallet is not the grade.

## 1.12.10 — 2026-09-05

- New-teacher Start here on Overview (unlock → score → save). At home → portal. Crew pad legend + next-crew hint. Portal ◆ $ ▲ for home.

## 1.12.9 — 2026-09-05

- Unicode marks: ● full · ◑ check-in · ○ starting · ✗ absent · – excused · ⏸ personal. Skills ? / ✓ / ★. XP ◆. Stocks ▲. Crew pad uses the symbols.

## 1.12.8 — 2026-09-05

- Master switches in Settings: weather, reward, tips, contrast, ambient, picker, timer, store, stocks, study hall pad, portal, grades, achievements, NY Tech. Off greys the icon and hides the module. Core (Overview, Crew, Desk, Skills, scoring) stays.
- Name picker (ClassDojo-style draw) and 3/5/10 focus timer (ClassroomScreen-style).

## 1.12.7 — 2026-09-05

- Profile: XP · grade · perks · STOCK called out as four games. Shop skills as Help/Check/Teach. NY Tech S1–S7. Ranks, invested/earnings/picks. Day log newest first.

## 1.12.6 — 2026-09-05

- Shop skills named by the work: Finish = sanding, painting, staining, dry time. Skills tab → **What we track** lists all ten plus NY Standard 5 S1–S7 benchmarks. Gradebook finish slot matches.

## 1.12.5 — 2026-09-05

- Ambient Chaos (neal.fun) — wave icon in the top bar, More menu, and Settings. New tab.

## 1.12.4 — 2026-09-05

- Faster desk: structuredClone instead of JSON-clone on edits. Score marks and skills copy one student, not the whole year. Pay sheet caches while the file ref is unchanged. Save skips a write if nothing changed.

## 1.12.3 — 2026-09-05

- Skills pad in classroom English. Modes: **Today I saw** · **Sit-down** · **NY Tech**. Marks: Needs help / With a check / Can teach it. Legend on every view. Blank ≠ zero. Still not pay.

## 1.12.2 — 2026-09-05

- Class reward tracker: title, 1 / 2 cycles or rest of quarter, class-average XP · grade · effort. Combined bar + three meters. Earned when all three hit. Overview, Week, Skills, Desk Config, Settings. Not pay.

## 1.12.1 — 2026-09-05

- **Bearcat** default: lifted navy (not pure black), paw orange CTA, gold XP, faint gold hairline on cards, royal/orange wash on the canvas. Softer text for light sensitivity.
- **Vibes actually change type.** Shop = Barlow Condensed + IBM Plex Sans (scoreboard). Stencil / Lab / Clip / Hall / Type. Picker shows each face. Hover still previews.

## 1.12.0 — 2026-09-05

Layout sweep from the tab critique.
- Board strip gone. Find lives in the top chrome (\`data-find\`, no red edit ring).
- Gold XP · muted $ · level-on-XP on Week, YTD, Data-Views. Skills LevelMark is gold.
- Clear KPI only appears as Due/Overdue. Period chevrons removed.
- Data-Views: effort/absent off the charts. Stocks title is STOCK. YTD quarter tiles fill.

## 1.11.13 — 2026-09-05

- Overview right rail: **YTD · 10** (was School). Empty space under it is **Study Hall** (P6), same XP/$ language. Six class boxes stay 3×2.

## 1.11.12 — 2026-09-05

- Overview: gold XP vs muted $. Level dot sits on the XP, not the name. Skills/Perks lights the ranked column (gold vs elevated).

## 1.11.11 — 2026-09-05

- **Unsaved** chip (red) until this device writes localStorage. Autosave waits 0.7s. Save in More still instant. Browser warns if you close with Unsaved.
- Daily export banner on school days until LIVE is exported that date. Friday stays the loud orange one. Names vault is still a separate private file.

## 1.11.10 — 2026-09-05

- Copyright uses the real desk version (not 1.0). Floating **v1.11.10** chip, gold, bottom-right, every screen.

## 1.11.9 — 2026-09-05

- Board is a menu: Overview · Week · YTD · Data-Views. Year renamed YTD. Strip under the mast matches. Week/Year/Data left More.

## 1.11.8 — 2026-09-05

- Board class boxes are **3 columns × 2 rows** (P1 P2 P3 / P8 P9 P10) so names are readable. P6 is a short strip under the six, not a seventh skinny column.

## 1.11.7 — 2026-09-05

- Board always shows gold XP and wallet $. Level is a color circle by the alias (Cub→Legend). Skills / Perks only changes rank order. KPI strip no longer duplicates the totals.

## 1.11.6 — 2026-09-05

- Board and Data fill the viewport. KPI strip: workers, XP, wallet, stock, invested, due. Period tiles list the whole class (scroll) with period XP/$. School top 10. Data: chart + inspector share the screen, table fills the rest.

## 1.11.5 — 2026-09-05

- Week: no AM/PM. No Study Hall. All six classes (P1 P2 P3 P8 P9 P10). Default sort skill XP.
- Ranks by XP when Skills is on (not combo).
- Top bar icons for Week, Store, Study Hall, Settings (most-used More items). More still has the full list.

## 1.11.4 — 2026-09-05

- **Vibe** in Settings (under stylesheet). Font packs mix with any dark theme: Shop, Stencil, Lab, Draft, Clip, Hall. Hover to try. Colors unchanged.

## 1.11.3 — 2026-09-05

- Board wall: one row of seven period tiles (content height, no stretched empty cards). XP + cycle/quarter/year bars sit on the mast. School column hugs the top 5.

## 1.11.2 — 2026-09-05

- **Projector** in ⋯ More actually does something: web layout, Board wall, fullscreen, flash. Phone still flips to iPad layout.
- **Study Hall** pad: date stepper, A/B chip, P6 clock + coral cleanup, Happened, Ready / Almost / Not yet, On task / Redirect / Off task, affect, cleanup −$10, line lead (dark list). Habits ≠ Tech marks. Wallet only on cleanup. P6 stays on the Board.

## 1.11.1 — 2026-09-05

- Dark dropdowns. Native OS menus were white with light text (Observed / Daily goal / Leader). Desk lists now use in-app dark menus. Remaining native select tags force dark option colors.

## 1.11.0 — 2026-09-05

GrokBot is gone. Product name on the wall stays **TechWorks 1.0**. Desk build is 1.11.0. No hosting / API work.

### Added
- **Version** on Desk, Settings, and the Board **corner** (\`v1.11.7\`). Copyright line stays **TechWorks 1.0**.
- **Standard 5** on Skills: NY MST S1–S7, scores 1–4, project chips, CSV. Watch (shop E/P/A) still drives Bearcat XP. MST is not pay.
- **Study Hall** in ⋯ More. P6 stays on the Board strip. Affect, cleanup, private notes, line lead.
- Cub → Legend **toasts** when shop-skill XP crosses a band (Desk flash · not wallet).
- Names vault schema frozen (\`VAULT_FIELDS\`).
- Store soak: can't-afford flash; spend still wallet-only.

### Unchanged
- Dark themes. Store in More. Happened on Desk. IEP/504 display-only. No 2.1.0 zip.

## 1.10.0 — 2026-09-05

Canonical packet: **TECHWORKS-CANONICAL-1.10.0.zip** (Drive). Chrome is 1.9.10. Selected grafts from grokbot 2.1.0. **Not** a restyle. **Not** version 2.1.0.

### Packet
- Drive zip: TECHWORKS-CANONICAL-1.10.0.zip — file id \`1rK68waNbb_u_F7L2FUyHVPq4oeDBTZ8O\`
- Phone: https://drive.google.com/uc?export=download&id=1rK68waNbb_u_F7L2FUyHVPq4oeDBTZ8O
- \`READ_ME_FIRST.md\` is inside the zip. Tell grokbot: this is 1.10.0; do not jump to 2.1.0.
- Data key still \`techworks-desk-v10\`. Sheets stay the archive. No Apps Script.

### Layout (unchanged)
- Top row: Board · Crew · Skills · Stocks · Desk. Active tab shows its word.
- Board family strip: Board / Week / Year / Data.
- Store is **⋯ More → Store**, not a sixth icon.
- P6 Study Hall stays on the wall with everyone.
- Happened stays on Desk + profile. Not on Board / Week / Data charts.

### Added (grafted from 2.1.0, then cut to fit)
- **Store** — catalog UI. \`buyShop\` still pays from Perks. PIN to buy. Can't afford = no sale. Wallet ≠ grade ≠ effort.
- **Roster import** — Settings → Add / import roster (PIN). Paste legal first/last/period. Aliases generated (\`alias-bank.ts\`). Legal names vault-only.
- **Supports (PIN, profile)** — ELL, prefer seating, extended time, DHH. Quiet notes. IEP and 504 still **display-only** from the roster (not toggleable).
- **Achievements** on profile — times led crew, crew-lead streak. Lead Skills XP once per confirmed lead (you name the lead **and** they get a mood tap that day). Settings: lead XP amount, default **+2**. Never wallet, never a mark.
- **Bearcat labels** in Config — Cub → Rookie → Scout → Builder → Crafter → Lead → Ace → Legend (6 XP each). Still XP, not a shop mark.
- **Names vault** now includes \`legalFirst\`, ELL, DHH. Live export still aliases + Shop ID only.
- **More menu** no longer uses a full-screen blocker, so Board / Week / Year / Data chips still tap while More is open.

### Files
- New: \`store-board.tsx\`, \`roster-onboard.tsx\`, \`alias-bank.ts\`, \`achievements.ts\`, \`roles.ts\`
- Wired: \`economy.ts\` (vault fields), \`store.ts\` (import / flags / lead confirm), \`skills.ts\` (labels + lead XP in total), \`live.ts\` (vault), \`board.tsx\` (More → Store), \`settings.tsx\`, \`dossier.tsx\`

### Refused from grokbot 2.1.0 (do not put back)
- Store as a 6th top-row icon
- Light Paper / Projector (light-sensitive)
- Study Hall yanked off Board / Crew / Score
- Observed + Happened removed from Desk
- Click sound default on
- ROLL THE DICE theme
- Hamburger / tooltip nav modes replacing the icon row
- Version jump to 2.0 / 2.1
- IEP / 504 as toggleable chips (they come from the roster)

### Laws (still)
1. Effort ≠ money. Only 3 / 2 / 1 is effort.
2. Skills ≠ money ≠ stocks. Lead XP is Skills XP only.
3. Grades ≠ wallet. Blank is not a zero.
4. Attendance is SchoolTool.
5. FERPA: aliases on the wall. Legal names + IEP/504/DHH only after PIN, Show full info.
6. Crews 3–4. Kids leave after ~8 weeks. P6 is A/B year-long.
7. SUB voids the date. Cycle still advances. A sub never uses the app.
8. Every theme dark.

PINs: teacher **1111** · crew override **2222** · portal **2627**

## 1.9.10 — 2026-09-04

### Fixed
- Data is a real tap: Board / Week / Year / **Data** chips are finger-sized. The selected worker sits **above** the list so a name tap is obvious. Report card button (PIN). Find box.

## 1.9.9 — 2026-09-04

### Added
- **Grades** (PIN): calculated parent-facing marks — Shop participation per cycle, Skill growth. 100 / 85 / 70. Blank is not a zero. Classroom CSV. Report card on the profile.

### Changed
- Observed / Happened only on Desk and the profile. Off Board, Week, and Data LOG.
- Skills Watch is one skill (today’s goal) in crew order. Conference is PIN.
- Technical spec **VERSION 2.1** HTML (changelog merged, linked) in Drive.

## 1.9.8 — 2026-09-04

### Changed
- Edit mode is a red ring on fields, not a red page. Export reminder once per live period (Friday banner still wins that day).

## 1.9.7 — 2026-09-04

### Changed
- One order on Board, Desk, Week, and Profile: **Daily goal → Observed → Happened**. Happened is the always-on box for what actually occurred that period. Goal on Desk is today's period, not cycle config.

## 1.9.6 — 2026-09-04

### Changed
- Every stylesheet is dark (Paper, Sand, Chalk included). No white walls. Hover preview stays dark.

## 1.9.5 — 2026-09-04

### Changed
- Default stylesheet is the Canva brand kit: navy #06122B, royal #1E4BAF, white, paw orange #E85820. Theme picker label **TechWorks**. Due stays red. Cleanup stays coral. Desk stays dark red so you know you are editing.

## 1.9.4 — 2026-09-04

### Changed
- GUI slim: Board · Crew · Skills · Stocks · Desk. Everything else is ⋯ More.
- Board family uses a thin Board / Week / Year / Data strip. Skills | Perks is a small switch. Sort bar off the wall.

## 1.9.3 — 2026-09-04

### Added
- Copyright notice on Dashboard and Settings. LICENSE in the repo. GitHub export **TechWorks 1.0**.

## 1.9.2 — 2026-09-04

### Fixed
- Mobile: Settings is a full-screen sheet after PIN (gear in the tool row). Config / Desk menus no longer clip inside the header scrollbar.
- Skills / Perks is a full-width two-button switch. Sort sits under it in compact chips.

## 1.9.1 — 2026-09-04

### Demo
- **S2 / Q2 roster** (new aliases). 13 instructional weeks (2026-11-02 → 2027-02-05). Stars, growers, absences, one SUB day, invests, skills. S1 archived on Yearly.

### Added
- Data **line** chart is a **week trend** (earned / wallet / stock / effort / absences). Period group draws one line per class.

## 1.9.0 — 2026-09-04

### Added
- **Web / Mobile** toggle (top bar + Settings). Web is the projector. Mobile is the iPad desk. Remembers the choice. ?layout=web or ?layout=mobile on a Site URL.
- Technical spec **VERSION 2.0** in Drive (class discussion §0). Live changelog: Desk → Config → Changelog (same text as src/data/changelog.ts).

## 1.8.1 — 2026-09-04

### Fixed
- Dashboard period tap now opens that class on Verify / Score.
- Assist is extra $10. It no longer overwrites 3 / 2 / 1.
- Tap a score code again to clear it.

### Changed
- Teacher scoring is worker cards, not a wide table. Pay is visible. +$5 / −$5 on the card. Period chips show crews done.

## 1.8.0 — 2026-09-04

### Added
- **Worker portal** (key icon, or ?portal=1). Class PIN default **2627**. Pick your alias. Shop ID badge. No legal names. Settings can change the PIN.

## 1.7.0 — 2026-09-04

### Added
- **Describe / tips** (lightbulb). Purpose, links, and a tip for the current screen. Off by default. Settings toggle too.
- **Yearly:** year XP + $, four session cards with days left, XP/perk bars, marking-period strip, archive XP with $.

## 1.6.1 — 2026-09-04

### Added
- Searchable **Help** (?). Articles match Skills/Perks, SUB, Data, names vault.

### Changed
- Skill-first polish: Skills sits next to Crew. Dashboard XP bars. Weekly XP column. Profile leads with skill. Watch opens on the live period and names who needs a look. Default stylesheet is Bearcat. Dashboard says what the number is.

## 1.6.0 — 2026-09-04

### Changed
- **SUB** voids that day’s pay, effort, invest, and due. Cycle day still advances. Subs never use the app.
- Dashboard boards: **Skills** (default, XP) and **Perks** (wallet). Stocks stay on the Stocks tab only.
- Export live has **no legal names**. Names vault is a separate private file (alias + last + IEP/504). Friday banner if you have not exported today.

## 1.5.0 — 2026-09-04

### Changed
- Reports + Graphs are one **Data** tab: metric, worker/period, bar/line, sort, table, Sheets copy.
- Dashboard shows **XP only**. Level color/labels live in Settings (off until you turn them on).

## 1.4.9 — 2026-09-04

### Added
- Level shows a **coin** mark plus XP (gold/gain). Dashboard period cards and school 5 **expand** to the full list.

## 1.4.8 — 2026-09-04

### Added
- Sort chips on Dashboard, Weekly, Reports, Stocks, Skills: Combo · Wallet · Level · Stock · Name · Crew (where they apply).

## 1.4.7 — 2026-09-04

### Changed
- Weekly: **every** worker, **AM / PM** only (P1–6 vs P8–10). Dashboard school list is **top 5** (combo rank).

## 1.4.6 — 2026-09-04

### Changed
- Weekly board is **top 3** per class. Public ranks: skill (level) is **1.5×** wallet. Stock toggle still ranks the minigame only.

## 1.4.5 — 2026-09-04

### Changed
- Skills is **Watch one skill** (formative: Emerging / Practicing / Applying). Empty = not seen, not a zero. Suggested from today's class goal. **Need a look** vs **Can teach it**. Map view for conferences. Not pay.

## 1.4.4 — 2026-09-04

### Added
- **Bearcat** stylesheet: navy field, orange accent, gold gain (Solvay).
- Selected nav tab shows its title. Other icons name themselves on hover or press-and-hold. Mobile wrap + 44px targets.

## 1.4.3 — 2026-09-04

### Added
- Holiday stylesheets: Holly, Frost, Harvest, Clover, Blush, Spooky, Patriot, Aurora.
- Web-view **Contrast** (black / white) as a theme and as a toggle over any theme. Cleanup stays coral. Due stays red.
- Translate: English / Español. Globe in the header. Short labels for machine and human translate.

## 1.4.2 — 2026-09-04

### Changed
- Demo marks: about one absence per class most days, some classes none, Ivy (P1) and Oren (P8) out three days in a row.
- Reports: school earned/stock, Stock · 3, Earnings · 3, Skill · 3, plus skill growth on each worker card.

## 1.4.1 — 2026-09-04

### Added
- Live Solvay weather (KSYR) next to the date: icon, °F / °C, one-word sky (Sunshine, Flurries, Blustery…).

## 1.4.0 — 2026-09-04

### Added
- **Q1–Q4** chip on Dashboard, Score, Stocks, Skills, Weekly, Yearly, Reports, profiles, Settings.
- Stocks minigame: pick **3 of 12** names. Card shows Invested / Earnings / Total plus a trend. Equal split of invested cash. PIN to change picks.
- Stylesheets: Night, Ink, Slate, Dusk, Forest, Ocean, Ember, Paper, Sand, Chalk, High vis.

### Changed
- Theme picker lives in **Settings** (right drawer). Hover a chip to preview on the Dashboard. Click to keep.
- Theme removed from Config.

## 1.3.2 — 2026-09-04

### Changed
- **Dashboard** rebuilt as a projector wall: giant school $, Day A/B chip, Cycle/Quarter/Year bars, seven period columns in one row, school top 10. Wallet vs Stock is a two-part switch.

## 1.3.1 — 2026-09-04

### Reverted
- Rolled back the 1.4 MST / Help overlay (the skill-tracker MD upload). Preview-stable 1.3 desk is back.

### Kept
- School stays **this device only** (Save / Export files, bundled lunch). Skills are SAFETY…TEAM with E/P/A XP. Stock value toggle on Dashboard.

### Demo
- All 96 workers have **6 fake school days** (Sep 8–11, 14–15): mix of 3/2/1/A/E/P, some invests, bonuses, skills, notes.

## 1.3.0 — 2026-09-04

### Added
- Lunch applet on **Desk → Schedule**. Pulls the blue **Middle School Menu** PDF from [Solvay Food Services](https://www.solvayschools.org/districtpage.cfm?pageid=1934), fills today's lunch, optional fill-empty-days. September 2026 is cached if the site is down.

## 1.2.0 — 2026-09-04

### Added
- **Skills** tab (Overview menu): XP track, not wallet. E=1 P=2 A=3 XP. Every 6 XP → next level (max 8). Pay/stock never use this.
- Default skills: SAFETY, MEASURE, DRAW, MODEL, MATERIAL, TOOLS, FINISH, PRESENT, DIGITAL, TEAM. Editable in Config.
- Profile shows Level and skill chips.

## 1.1.1 — 2026-09-04

### Added
- Overview **Stock value** toggle. On = ranks and hero $ by invested stock. Off = net worth (wallet + stock). Remembers on this device.

## 1.1.0 — 2026-09-04

### Added
- Changelog file plus **Desk → Config → Changelog** copy/download.
- Stylesheets: Night, Paper, Slate, Forest, High vis. Cleanup stays coral; due/loss stay red.
- Google Site embed snippet (\`?embed=1\` = Overview only).
- Nested nav: Overview (Board / Weekly / Yearly / Reports / Graphs), Crew leader, Stocks, Desk (Verify / Schedule / Config / Settings).
- Graphs: worth by period, school top 10.

### Changed
- Teacher Score is mode-gated: Verify/Score, Schedule, Config (now via Desk menu).
- SUB locks the scoring grid (and crew pad).
- Shop refuses spends bigger than the wallet.
- Absent / Excused / Personal cannot ask to invest; switching to those codes clears a pending ask.
- Crew scoring is a 2×2 of kid cells with ABSENT / EXCUSED / PERSONAL spelled out, self-report faces, hidden note.

### Fixed
- Duplicate top menus removed. Locked chrome is Overview family + Crew + Stocks only.

## 1.0.0 — 2026-09-04

### Added
- Crew pad (teal) vs teacher Score (dark red). PINs 1111 teacher / 2222 crew-period override.
- Live period lock for crew leaders; period progress bar; cleanup bell at T-5.
- SchoolTool link + ST badge (no in-app attendance).
- Cycle / Quarter / Year school-day progress.
- Invest ask → teacher approve. Effort uses 3/2/1 only.
- Aliases, publicHandle, IEP/504 read-only in Show full info.
- Shop lists (SNACKS / LEISURE / CHORES / TOOLS).
- Encoded live export + names vault.
- Seed roster: ~12 per class, 4 crews, 5 fake days (2026-09-08 → 09-14).
- Technical spec in Drive: TECHWORKS TECHNICAL DETAILS, VERSION 3.0 (HTML). Changelog twin: TECHWORKS-CHANGELOG-v1.11.7.md.

Keep this file updated on every product change.
`;

export function changelogFileName() {
  return `TECHWORKS-CHANGELOG-v${APP_VERSION}.md`;
}
