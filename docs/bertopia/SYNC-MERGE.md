# Bertopia private-world sync: merging two devices' offline edits

Design only (brief 0063). No code changes. This replaces "last writer wins for the whole world" with a **per-chunk merge using revs**: edits a kid made on one device never erase edits the same kid made on another, and when both devices changed the same chunk, the server copy stays in the world and the other version is kept where the kid can get it back.

Scope: a kid's **private** world (the S1 store: `server/bt-world.ts` here, the client in `apps-kulibert/bloxbert-src/src/save/server-sync.js`). Shared live worlds (`server/class-room` in apps-kulibert) have one authority and no offline mode, so they are not covered. Aliases and world ids only; no PII anywhere in this flow.

---

## 1. What exists today

**Server (TechWorks, S1).** Per alias ref and world: a head row (`rev`, `schema`, `head` blob, `bytes`, `updated_at`) and chunk rows (`ck`, `hash`, `rev`, `data`). `rev` on the head is the world rev, bumped by one on every accepted PUT. `rev` on a chunk is the world rev at which that chunk was last written. The last five heads are kept as revs for staff restore.

- `GET /api/bertopia/world?world=W` → `{ok, rev, schema, head, chunks: {ck: {hash, rev}}}`
- `GET /api/bertopia/world?world=W&ck=a;b;c` → `{ok, chunks: {ck: data}}` (up to 64 keys per call)
- `PUT /api/bertopia/world?world=W` with `If-Match: <rev>` and `{head, chunks: {ck: data}, drop: [ck]}` → `200 {rev, hashes}` or `409 {rev}`. The PUT is atomic (TW 1.94.25): the rev check and every chunk write succeed together or not at all.

**Client (Bertopia 2.5.557+).** The saved world carries `syncRev` (the server rev this device last synced) and `syncedAt` (the `updatedAt` of the local save that rev was). A world is *dirty* when `syncedAt ≠ updatedAt`. On load: pull only if clean and the server rev is higher; if dirty, push. Push sends every chunk whose hash differs from the server's map, with `If-Match` = the server's current rev. Today a dirty world that pushes **overwrites** whatever the other device changed.

The server already keeps a rev per chunk, so the client can tell "the server changed this chunk since my last sync" with no server change. What the client is missing is "I changed this chunk since my last sync", which needs one new field.

---

## 2. Data shapes

### 2.1 Server (unchanged)
```
bt_worlds: alias_ref, world, rev, schema, app_ver, head, bytes, updated_at
bt_chunks: alias_ref, world, ck, hash, rev, data        -- rev = world rev that last wrote ck
```

### 2.2 Device (one new field on the saved world)
```
doc.syncRev     number   server rev last synced on this device (exists today)
doc.syncedAt    string   updatedAt of the local save at that sync (exists today)
doc.syncHashes  {ck: hash}   NEW: sha256 of each chunk as of the last sync (about 70 bytes per chunk)
```
`syncHashes` is written on every successful push and pull, next to `syncRev`. A world saved before this change has no `syncHashes`; see case T9.

### 2.3 The "other device" copy
A whole pre-merge world saved under the id `<world>-other-device` (title `<title> (other device)`), in the same IndexedDB store as backups, one per world, overwritten each time a merge keeps something aside. It shows in My Builds like any backup, so the kid can open it and copy from it. It is never pushed to the server (the sync code ignores ids ending in `-other-device`).

---

## 3. The merge

Run on the device when a sync finds **both** sides moved: the local world is dirty **and** the server rev is above `syncRev`. (Clean + server moved = plain pull; dirty + server unchanged = plain push; both unchanged = nothing. All three as today.) Also run when a push gets `409` (someone saved between the GET and the PUT).

```
1. GET head once → serverRev, S = {ck: {hash, rev}}
2. For every ck in local ∪ S:
     localChanged  = (ck in local)  ? localHash(ck) ≠ syncHashes[ck]   : (ck in syncHashes)   // deleted locally
     serverChanged = (ck in S)      ? S[ck].rev > syncRev              : (ck in syncHashes)   // deleted on server
     neither             → nothing
     local only          → push: chunks[ck] = local data   (or drop += ck if deleted locally)
     server only         → pull: fetch ck, put it into the local world (or delete it locally if gone on server)
     both  (CONFLICT)    → server copy wins in the world: fetch ck, put it in local; the local version is kept in the other-device copy
3. Head (player, pos, bag, spawn, mode…): keep the LOCAL head. The kid is on this device. The head's chunk list follows the merged chunks.
4. If any conflict: before step 5, save the whole pre-merge local world as <world>-other-device (overwrite). Then show the kid the note in section 6.
5. One PUT with If-Match = serverRev, chunks = local-only chunks, drop = local-only deletions.
     200 → syncRev = new rev; syncedAt = updatedAt of the merged save; syncHashes = hash of every chunk now in the world.
     409 → someone saved during the merge: go to 1 again, at most 3 rounds, then back off as today (2.5.558).
```
Server-only and conflict chunks are **not** in the PUT (the server already has them), so the PUT is small and never writes a server chunk backwards.

Chunk identity is the content hash the server already stores, so "changed" never depends on any clock. Wall-clock time is used nowhere in this flow.

### 3.1 Why this is safe
- A kid's work can be in only three places after a merge: in the world (pushed), in the world (pulled from the other device), or in the other-device copy. Nothing is dropped.
- The server never goes backwards: the PUT is rev-checked and atomic, and conflict chunks are not sent.
- Two tabs on one device share the same IndexedDB and the same saved doc, so they never conflict with each other; the pending-doc queue (2.5.556) handles them.

---

## 4. Failure cases

| Case | What happens | Result |
|---|---|---|
| **Clock skew** (device clock set back or forward, device A and B hours apart) | Nothing in the merge reads a clock. `updatedAt` is compared only for **equality** with `syncedAt`. Chunk change is by hash and by server rev. | Same merge regardless of any clock. |
| **Half-pushed batch** (network drops mid-PUT) | The server PUT is atomic (1.94.25): either the whole batch landed (the device just did not hear the 200) or none of it did. On retry the device GETs the head first: if the rev moved to exactly what its PUT would have produced and the hashes match, it treats it as done and updates its marks; otherwise it merges again from step 1 (conflict chunks were never sent, so a replay is safe). | No partial world on the server; at worst one extra round. |
| **Push gets 409 during the merge** | Another device saved between GET and PUT. Restart from step 1 with the new server state; up to 3 rounds, then back off (2.5.558 schedule). | Converges; the busiest world loses nothing, it just waits. |
| **World deleted on the server** (staff wipe of test students, or a 404 for a world the device has) | GET returns 404. The device treats it as "server has nothing": a plain push of the local world with `If-Match: 0`. If the alias was wiped as a test student the session is gone too (401), so the push stops and the world stays local. | Local wins when the server is empty; a wiped test alias keeps its local world only. |
| **World deleted on the device** (kid cleared the browser, new Chromebook) | No local world: plain pull as today; the pulled world gets `syncRev`, `syncedAt`, `syncHashes`. | Device gets the server copy. |
| **Server restore by staff** (head-only restore, 1.94.25) while a device is offline | The restored head is a new rev with the old head and the current chunks. On reconnect the device sees server moved; its dirty chunks merge per chunk as usual; the head stays local (section 3 step 3). | The staff restore wins the server head until the device's next save; chunks merge normally. Note for staff: a restore does not undo a kid's offline chunk edits. |
| **Other-device copy already exists** | It is overwritten by the newer pre-merge world. One copy per world. | The kid always has the most recent kept-aside version; older ones are gone (open question Q1). |
| **Quota full when saving the other-device copy** | The copy save fails; the merge still proceeds (the world is more important than the copy), and the note says "could not keep a copy" instead. | World merged; the kid is told the copy was not kept. |
| **Chunk fetch fails mid-merge** (one of the `&ck=` GETs errors) | The merge aborts before the PUT; nothing changed locally or on the server. Next sync starts over. | Idempotent. |
| **Oversize** (merged world over 2 MB) | PUT returns 413 as today; the merge keeps the local merged world and marks it dirty; sync stops with the "Not saved" chip (2.5.558 give-up path). | Nothing lost locally; the kid sees Not saved and Try again. |

---

## 5. Test cases

Setup for every case: one alias, world `survival`, chunks **X**, **Y**, **Z**. Both devices start synced at server rev 10 with identical worlds and `syncHashes` for X, Y, Z. "A: edit X" means device A changed chunk X while offline. Expected results list the world on the **server**, on **A** and on **B** after both devices are back online and have synced once each (A first, then B, unless stated).

| # | Scenario | Server ends with | Device A ends with | Device B ends with | Other-device copy |
|---|---|---|---|---|---|
| T1 | A: edit X (offline). B: nothing. | rev 11: X(A) | X(A), synced | X(A) pulled, synced | none |
| T2 | A: edit X. B: edit Y. Both offline. | rev 12: X(A), Y(B) | after B syncs and A syncs again: X(A), Y(B) | X(A) pulled, Y(B) pushed | none |
| T3 | A: edit X. B: edit X (different content). Both offline. A syncs first. | rev 11: X(A) | X(A) | X(A) (server wins), note shown | on B: whole pre-merge B world (with X(B)) |
| T4 | Same as T3 but B syncs first. | rev 11: X(B) | X(B) (server wins), note shown | X(B) | on A: pre-merge A world (with X(A)) |
| T5 | A: edit X and Y. B: edit Y and Z. | rev 12: X(A), Y(A), Z(B) | X(A), Y(A), Z(B) after re-sync | X(A), Y(A) (server wins on Y), Z(B) pushed, note shown | on B: pre-merge B world |
| T6 | A: delete chunk Z. B: edit Z. A syncs first. | rev 11: Z gone | Z gone | Z changed locally **and** gone on the server since the sync → conflict → server copy wins → Z is removed on B too, note shown | on B: pre-merge B world with Z(B) |
| T7 | A: edit X. Server: staff head-only restore of rev 8 happens meanwhile (rev 11). | rev 12: restored head's chunks + X(A); head = A's local head | X(A), rest from server | X(A) and the rest pulled | none |
| T8 | A: edit X offline; A's clock is set back 3 hours. | rev 11: X(A) | X(A) | X(A) pulled | none (clock is irrelevant) |
| T9 | A was saved before this feature: no `syncHashes`. A: edit X. B: edit Y. | rev 12: X(A), Y(B) | every local chunk counts as changed once: X pushed, Y and Z unchanged on server → pushed too (same content, server dedupes by hash) | Y(B) pushed, X(A) pulled | none; after one sync A has `syncHashes` |
| T10 | A: edit X. B: edit X. A's PUT lands while B is mid-merge (B gets 409). | rev 11 (A), then B's merge round 2: no PUT needed | X(A) | X(A), note shown | on B: pre-merge B world |
| T11 | A: edit X. Network dies during A's PUT (server got it). A retries. | rev 11: X(A), no duplicate rev | sees rev 11 with matching hashes → marks synced | pulls X(A) | none |
| T12 | A: edit X. Server world deleted (404). | rev 1: X(A) pushed with If-Match 0 | X(A) | pulls the new world | none |
| T13 | A: edit X offline, then restore from a local backup (My Builds) while still offline, then edit Y. | rev 11: X and Y as A has them now | as saved | pulled | none (a local restore is just more local edits) |
| T14 | A: edit X. B: edit X identically (same content, same hash). | rev 11: X | X | the server's X hash equals B's → not a conflict, nothing pushed | none |

T6 is the one place the rule may surprise a kid: a chunk deleted on one device and edited on the other counts as a conflict, and "server wins" means whatever reached the server first. The copy still holds the other version. Open question Q2 asks whether a deletion should lose to an edit instead.

---

## 6. What the kid sees

No blame wording, no "conflict", no red. Everything is icon + text, 44 px minimum.

**During a merge (both widths):** the existing sync chip says "Saving…" with the ↻ icon; nothing else changes. A merge with no conflicts ends in "Saved to school" exactly like a normal save.

**After a merge that kept something aside (T3, T4, T5, T6, T10):**
- A toast, not a modal. Icon: the backup icon (box with a bookmark), then: **"Some blocks from your other device are kept in My Builds."** One button: **"Open"** (goes to My Builds with the "(other device)" world at the top). Dismisses itself after 8 s; the sync chip shows "Saved to school".
- **1366×768:** the toast sits in the top message stack (the one the boss, saved and safe notes share), 420 px wide, one line of text plus the button on the right.
- **412 upright:** full width minus 16 px margins, above the hotbar, text on two lines, the Open button below the text at 48 px tall. It never covers the top bar or the hotbar.
- If the copy could not be saved (quota): **"Your world is saved. A copy of your other device's blocks could not be kept."** with no button.
- In **My Builds**, the kept world is listed as "Bertyville (other device)" with the normal open and delete controls and a one-line note under it: "Blocks from another device. Open it to copy what you want."

**Never shown:** which device "won", revs, hashes, chunk names, or any wording that says the kid did something wrong.

---

## 7. Open questions for Diego

- **Q1.** One other-device copy per world, overwritten each time, or keep the last three? (This design: one.)
- **Q2.** When one device deleted a chunk and the other edited it (T6), should the edit win over the deletion instead of "server copy wins"? Deleting a chunk is rare in play (it happens when a world is trimmed), so "server wins" keeps one rule; "edit wins" is friendlier.
- **Q3.** Should the kept-aside copy expire after 30 days so My Builds does not fill with old copies?
- **Q4.** Head rule: local head always wins (section 3 step 3). Is there any head field that should come from the server instead (for example a teacher-set world rule)?
- **Q5.** Should the toast also appear on the *other* device the next time it syncs ("Your blocks from this device were kept on your other device")? This design: no, the kid is told once, where the copy is.
