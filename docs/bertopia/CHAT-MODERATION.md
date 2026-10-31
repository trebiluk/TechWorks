# Bertopia live chat: filter, kid flags, staff view, retention, seats

Design only (brief 0064). Nothing here is built yet: `moderate()` in the live server still allows everything, and no chat UI exists. This page is the spec for the one PR that builds the filter and the seats later. Kids are under 13: the server and every screen in this page use aliases and game data only, never a name, email, photo or address.

Server in scope: `server/class-room` in apps-kulibert (the World and Room Durable Objects). The retention wording in section 4 **needs Curriculum Bot OK** before any UI is built.

---

## 1. Word filter

### 1.1 Languages
The eight languages Bertopia ships in: English, Ukrainian, Russian, Spanish, Arabic, Dari (fa-AF), Kinyarwanda, Tigrinya. One list per language, plus a short **script-free** list for things that look the same in any language (phone-number shapes, email shapes, URLs, repeated-character spam).

### 1.2 Where the list lives
- Repo: `server/class-room/src/chat/words/<lang>.txt`, one entry per line, UTF-8, comments with `#`. The build packs them into the Worker. No network call at chat time.
- Each entry is either a **word** (matched on word boundaries after normalising) or a **pattern** (prefixed `~`, a small regex, used for the script-free list only).
- Who edits: Mr. K and ManagerBot through a normal PR. The native-review queue (same one as the UI strings) checks the non-English lists; until then the Ukrainian, Russian, Spanish and Arabic lists are drafts from the shared i18n team, and the Dari, Kinyarwanda and Tigrinya lists are marked `# draft` at the top.

### 1.3 Normalising before the match
So that `b4d`, `b.a.d`, `ＢＡＤ` and `baaad` all hit the same entry:
1. Unicode NFKC, then lower-case (Latin, Cyrillic); Arabic script: strip tatweel and diacritics; Ethiopic: no case, kept as is.
2. Remove zero-width characters and collapse runs of the same letter longer than two (`baaad` → `baad`; the list also carries the two-letter form).
3. Map common look-alikes for Latin only (`0→o, 1→l, 3→e, 4→a, 5→s, 7→t, @→a, $→s`) and drop punctuation inside a word (`b.a.d` → `bad`).
4. The original text is what gets stored and shown; normalising is only for matching.

### 1.4 What a hit does
`moderate(text, lang)` returns one of three verdicts, already wired in the server:

| Verdict | When | Kid sees | Others see | Stored |
|---|---|---|---|---|
| `allow` | no hit | the line | the line | yes, `hidden = 0` |
| `hide` | a hit on a **soft** entry (rude, mean, body talk) | the line, with a small note under it: "Only you can see this." | nothing | yes, `hidden = 1`, `reason = filter:<lang>:<entry id>` |
| `block` | a hit on a **hard** entry (slurs, sexual words, threats, phone/email/URL shapes) | the line does not appear; a one-line note in the input area: "That can't be sent here." | nothing | yes, `hidden = 2`, same reason; the text is kept for staff, see section 3 |

Soft and hard are a column in the list file (`soft` is the default; `!` prefix means hard). The kid is never told which word hit, so the filter is not a word-finding game.

Rate: three `block` verdicts from one socket inside 10 minutes count one strike in the existing strike pool (P2 limits), so the socket closes after repeated attempts with the same 4008 "slow down" the limits use. No separate ban.

### 1.5 Language choice for the match
Match against **all eight lists** every time, not only the kid's UI language. A kid can type Russian in an English UI. Cost: eight small lists per line, at most two lines a second per socket; fine.

### 1.6 Out of scope for the first build
A machine-learning classifier. The word list is the floor. A model (Workers AI or similar) can be added behind a flag later as a second check if Mr. K's review queue shows the list is missing things; it would need its own district sign-off because the text leaves our storage to be scored.

---

## 2. Kid flag and hide

### 2.1 The flag
Every chat line from another kid has a small **flag** control (icon + the word "Flag", 44 px). Tapping it does three things at once:
1. **Reports to Mr. K**: the line is marked `flags = flags + 1` and the flag is listed in Master Control (section 3) with the flagging alias and the time. No free-text reason, no extra typing for the kid.
2. **Hides the line for that kid**: on this device and any device where the same alias is signed in, the line is replaced by "Hidden." in grey. Tapping "Hidden." shows it again for that kid only (an undo, in case of a mis-tap). The hide is stored server-side per `(line id, alias ref)`, so it survives a reload.
3. **Fades it from public faster**: public chat already drops lines from the visible scroll after `FADE_MS` (default 10 minutes). A line with one flag fades after 2 minutes; with two or more flags from different aliases it is hidden for everyone (`hidden = 3`, reason `flags`) and only staff can still see it. The author sees "Only you can see this." under it, the same note as a filter hide, so a flag is not announced to the author.

A kid cannot flag their own line, cannot flag the same line twice, and flags are limited to 10 per kid per hour (past that the control still works locally but is not reported; this keeps a flag war from hiding everything).

### 2.2 Example flows
**Flow A: a rude line.** Kid Pixel types "ur build is trash lol". The soft list hits "trash" in the mean-talk group. Pixel sees the line with "Only you can see this." under it. Nobody else sees it. Master Control lists it under Hidden with reason `filter:en:mean-trash`. Mr. K can leave it, or clear the hide if it was a false hit (which also removes that entry from the hide list for review).

**Flow B: a phone number.** Kid Rook types "text me 315 555 0199". The script-free pattern for phone shapes is hard. The line does not appear; Rook sees "That can't be sent here." under the input. It is stored `hidden = 2` for staff. Third try in 10 minutes: one strike.

**Flow C: a kid flags.** Kid Moss reads "nobody wants you here" from Kid Fern. Moss taps Flag. The line turns to "Hidden." for Moss, shows in Master Control under Flagged with Moss's alias and time, and fades from everyone else's screen after 2 minutes. Kid Ash flags it too: it is hidden for everyone now, Fern sees "Only you can see this." under it. Mr. K sees two flags and can mute Fern's chat for the period from the same row.

**Flow D: a mis-tap.** Moss taps Flag on a fine line by mistake. Moss taps "Hidden." to show it again. The report to Mr. K stays (he sees one flag, reads the line, does nothing); the flag count for fade stays at one, so the line fades after 2 minutes for others. That is acceptable: a two-minute fade of a harmless line costs nothing.

---

## 3. Staff view (Master Control)

A "Bertopia chat" page in Master Control, staff passkey required (the same gate as the other staff pages). Aliases only; no roster mapping is shown or stored on the server. If Mr. K needs to know who an alias is, that lookup is on his side, as today.

Tabs: **Live** (last 200 lines of the chosen world, including hidden ones, each with its verdict badge), **Hidden** (hidden = 1, 2, 3, newest first, with reason and, for flags, the flagging aliases), **Flags** (lines with flags, grouped by the author's alias so a pattern shows).

Actions per line: **Clear hide** (sets hidden = 0; for a filter hide also writes the entry id to `docs/.../false-hits.txt` through a staff note, so the list can be fixed), **Hide** (staff hide, hidden = 4), **Mute chat** for an alias for the rest of the period (the server returns "Chat is off for you right now." on send; stored in the Room, cleared at the period end or by staff). No delete: rows age out under retention. Every staff action goes to the existing `kn_audit` log with the staff uid, the line id and the action, never the text.

---

## 4. Retention (needs Curriculum Bot OK)

Stored per line: `id, world, alias (the author's alias as shown in game, 16 characters max), text (200 characters max), at, hidden (0-4), reason, flags`. Flags store `(line id, flagging alias ref, at)`; hides-for-one-kid store `(line id, alias ref)`.

- **30 days**, then the row and its flags and hides are deleted by the daily purge alarm. No backup copy of chat is made anywhere (chat is not part of the world snapshot).
- Nothing else: no IP, no user agent, no device id, no real name, no email, no roster mapping. The alias ref (the same HMAC the world store uses) is the only per-kid key, and it cannot be reversed by the server.
- Staff can read any line within those 30 days from Master Control; nobody can read it after.

Proposed kid-facing wording (one line in the chat panel's help, shown the first time chat opens; **needs Curriculum Bot OK**):
> "Chat is for building together. Mr. K can read every message. Messages are kept for 30 days, then deleted. Use your alias, never your real name."

Proposed family wording (for the district note; **needs Curriculum Bot OK**):
> "Bertopia chat is a moderated classroom chat. Students use aliases only. A word filter and a student 'Flag' hide unkind messages; staff can read all messages for 30 days, after which they are deleted. No names, emails, photos or locations are collected."

---

## 5. Seats

### 5.1 One seat per alias
A seat belongs to an **alias ref**, not a socket. A kid who opens a second tab, or reconnects after a drop, joins the same seat: the server keeps one seat row `(alias ref, world, joinedAt)` and a list of its open sockets. The 30-seat cap counts seat rows. Fan-out sends to every socket of every seat, so both tabs stay live; chat and edits from either tab carry the same alias.

A seat is released when its last socket has been closed for 20 seconds (so a page reload does not lose the seat to someone waiting). Staff sockets (teacher spectate, later) do not take a seat.

### 5.2 Cap 30 per world
The 31st **alias** to join a world is refused: the socket is closed with 4001 `full` as today, and the game shows a calm card, not an error:

- Icon: a door with a small clock (the existing `door` icon plus `clock`), no red, no shaking.
- 1366×768: a centred card, 420 px wide: title "This world is full right now", one line "30 builders are in. You can wait here, or build in your own world and come back.", two buttons: **Wait here** (keeps trying every 15 s with backoff, the card shows "Waiting…" with the icon) and **My world** (goes back to single player). Escape = My world.
- 412 upright: the same card at full width minus 16 px margins, buttons stacked, each 48 px tall, the text wraps to three lines. The card sits above the hotbar, not over the top bar.
- Both: the card is announced to screen readers as a dialog with the title; no sound.

While a kid waits, the server does not hold a place in line (no queue in this design, keep it simple); the first retry that finds a free seat gets in. Mr. K can see the seat count per world in Master Control and can raise the cap for one period from 30 to 40 if a class is large; the UI never shows the number 40, only "full".

### 5.3 Wording in the other seven languages
The three strings ("This world is full right now", the explanation line, "Wait here", "My world") go through `strings-extra.js` like every other line, with rw, ti and fa-AF marked as machine drafts for the native queue.

---

## 6. What the one later PR builds (for the brief that follows this doc)

1. `server/class-room/src/chat/`: word lists, normaliser, `moderate(text)` with soft/hard verdicts, flags and per-kid hides on the chat table, fade rules, mute per alias, 30-day purge of flags and hides with the line.
2. Seats per alias ref with the 20-second grace, cap 30 (staff override to 40), 4001 close unchanged.
3. Master Control chat page in TechWorks (Live / Hidden / Flags, three actions, audit rows).
Out of that PR: the chat input UI in the game and the "full" card (game client, BERTOPIA MAIN CODER), teacher spectate, any ML filter.

Tests the PR must carry: normaliser cases per script, soft vs hard verdict, all-eight-lists match, strike after three blocks, flag hides for one kid and fades for others, two flags hide for all, flag limits, seat shared by two sockets, seat released after 20 s, 31st alias refused while the 30th's second tab is accepted, purge removes flags and hides with the line.
