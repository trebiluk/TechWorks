import { useEffect, useMemo, useRef, useState } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { legalFirstOf, legalLastOf, money, periodTitle, score, shopBells } from "@/lib/economy";
import { SCHOOLTOOL_SECTIONS } from "@/data/schooltool-sections";
import { loadClub } from "@/lib/club";
import {
  YEAR_CLASSES,
  YEAR_GROUPS,
  allYearKids,
  cycleCodesOf,
  holdAllClub,
  holdClubKid,
  kidsInCohort,
  placeStudent,
  quarterEffort,
  studentsInCohort,
  unlinkedClub,
  yearCounts,
  type YearCohort,
} from "@/lib/year-roster";
import { gradeSlots, letterOf, postedFor, sessionMark } from "@/lib/grades";
import { skillXp } from "@/lib/skills";
import { currentCycleOf } from "@/lib/roles";
import { addTypedStudent, deskSavePending, saveDeskNow, setAlias, setGradeOverride, setLegalNames, setStudentFlags } from "@/lib/store";
import { auditStudentIds } from "@/lib/ids";
import { emptyRoster, snapshotNow } from "@/lib/vault";
import { publicHandle } from "@/lib/live";
import { todayIso } from "@/lib/calendar";
import { bansOf, dropCrewBan, placeBlock, rosterLabel, separatePair, setStudentCrew, whoOf } from "@/lib/crew-desk";
import { cn } from "@/lib/utils";

type Filter = "all" | "live" | "q1" | "q2" | "q3" | "q4" | "club" | "hall" | "hold";

export function YearRoster({
  file,
  onChange,
  onOpenId,
  onImport,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onOpenId?: (id: string) => void;
  onImport?: () => void;
}) {
  const [club, setClub] = useState(() => loadClub());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pick, setPick] = useState<string | null>(null);
  const [st, setSt] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const counts = useMemo(() => yearCounts(file, club), [file, club]);
  const ids = useMemo(() => auditStudentIds(file.students), [file.students]);
  const cohort = YEAR_CLASSES.concat(YEAR_GROUPS).find((c) => c.id === pick) ?? null;
  const rows = useMemo(() => {
    const list = cohort ? kidsInCohort(file, cohort, club) : allYearKids(file, club);
    const needle = q.trim().toLowerCase();
    return list.filter((k) => {
      if (filter === "live" && !k.live) return false;
      if (filter === "club" && !k.club) return false;
      if (filter === "hall" && !k.hall) return false;
      if (filter === "hold" && !k.hold) return false;
      if (filter === "q1" && k.sem !== "Q1" && k.sem !== "YEAR") return false;
      if (filter === "q2" && k.sem !== "Q2" && k.sem !== "YEAR") return false;
      if (filter === "q3" && k.sem !== "Q3" && k.sem !== "YEAR") return false;
      if (filter === "q4" && k.sem !== "Q4" && k.sem !== "YEAR") return false;
      if (needle && !k.first.toLowerCase().includes(needle) && !String(k.period).includes(needle) && !k.id.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [file, club, cohort, filter, q]);
  const orphans = unlinkedClub(club, file);
  const bells = shopBells(file);
  const periods = [...new Set(YEAR_CLASSES.map((c) => c.period))];

  useEffect(() => {
    const t = window.setInterval(() => setPending(deskSavePending()), 280);
    return () => window.clearInterval(t);
  }, []);

  function place(id: string, c: YearCohort) {
    onChange(placeStudent(file, id, c));
  }

  function saveNow() {
    saveDeskNow(file);
    onChange({ ...file, meta: { ...file.meta, savedAt: new Date().toISOString() } });
    setPending(false);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Roster · year</p>
          <p className="font-display text-2xl font-semibold leading-none">SchoolTool · 24 Tech + Study Hall</p>
          <p className="mt-1 text-sm text-muted">
            Rm 13 shop · Rm 136 hall · A,B days · {counts.year} on file · {counts.live} live {counts.liveQ}
            {counts.hold ? ` · ${counts.hold} club hold` : ""} · {ids.unique} locked ids
          </p>
          <p className="mt-1 text-xs text-subtle">Type Last, First → Add. Id is minted first, then the wall alias. Scores, XP, and $ stay on that id.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <SaveChip savedAt={file.meta.savedAt} pending={pending} onSave={saveNow} />
          {onImport ? (
            <button type="button" onClick={onImport} className="tw-tap min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-bg">
              Import
            </button>
          ) : null}
          {file.students.length ? (
            <button
              type="button"
              className="tw-tap min-h-11 rounded-md bg-cleanup/30 px-3 text-sm font-semibold"
              onClick={async () => {
                if (!window.confirm(`Clear ${file.students.length} workers? A snapshot is saved first.`)) return;
                await snapshotNow(file, "Before clear workers");
                const next = emptyRoster(file);
                saveDeskNow(next);
                onChange(next);
              }}
            >
              Clear workers
            </button>
          ) : null}
          <button type="button" onClick={() => setShowLegal((v) => !v)} className={cn("tw-tap min-h-11 rounded-md px-3 text-sm font-semibold", showLegal ? "bg-accent text-accent-fg" : "bg-elevated")}>
            {showLegal ? "Hide legal" : "Show legal"}
          </button>
          <button type="button" onClick={() => setSt((v) => !v)} className={cn("tw-tap min-h-11 rounded-md px-3 text-sm font-semibold", st ? "bg-accent text-accent-fg" : "bg-elevated")}>
            SchoolTool
          </button>
        </div>
      </header>

      {!ids.ok ? (
        <p className="rounded-lg bg-cleanup/20 px-3 py-2 text-sm">
          Id repair on load: {ids.missing} missing · {ids.dups.length} duplicate. Later copies got a new locked id.
        </p>
      ) : null}

      {orphans.length ? (
        <div className="rounded-lg bg-cleanup/20 px-3 py-2 text-sm">
          <p className="font-semibold">{orphans.length} Tech Club names are not linked to a worker id.</p>
          <p className="text-muted">Hold them so skills stay on one id until they have a Tech class.</p>
          <button
            type="button"
            className="mt-2 min-h-10 rounded-md bg-fg px-3 text-xs font-semibold text-bg"
            onClick={() => {
              const out = holdAllClub(file, club);
              setClub(out.club);
              onChange(out.desk);
            }}
          >
            Hold all club kids
          </button>
        </div>
      ) : null}

      <AddKid file={file} cohort={cohort} onChange={onChange} />

      <SeparateRules
        file={file}
        notice={notice}
        onNotice={setNotice}
        onChange={onChange}
      />

      <div className="flex flex-wrap gap-1">
        {(
          [
            ["all", "All"],
            ["live", "Live"],
            ["q1", "Q1"],
            ["q2", "Q2"],
            ["q3", "Q3"],
            ["q4", "Q4"],
            ["club", "Club"],
            ["hall", "Hall"],
            ["hold", "Hold"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", filter === id ? "bg-fg text-bg" : "bg-elevated text-muted")}
          >
            {label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find alias or id"
          className="min-h-9 min-w-[10rem] flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
        />
      </div>

      {st ? (
        <div className="tw-gadget overflow-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-2 py-1">Class</th>
                <th className="px-2 py-1">Period</th>
                <th className="px-2 py-1">Section</th>
                <th className="px-2 py-1">Days</th>
                <th className="px-2 py-1">Room</th>
                <th className="px-2 py-1">Sem</th>
              </tr>
            </thead>
            <tbody>
              {SCHOOLTOOL_SECTIONS.map((r) => (
                <tr key={`${r.course}-${r.period}-${r.section}`} className="border-t border-border/40">
                  <td className="px-2 py-1">{r.course}</td>
                  <td className="px-2 py-1">{r.period}</td>
                  <td className="px-2 py-1">{r.section}</td>
                  <td className="px-2 py-1">{r.days}</td>
                  <td className="px-2 py-1">{r.room}</td>
                  <td className="px-2 py-1">{r.sem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-2 overflow-auto">
          {periods.map((p) => (
            <div key={p}>
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">{periodTitle(p, bells)}</p>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {YEAR_CLASSES.filter((c) => c.period === p).map((c) => {
                  const n = kidsInCohort(file, c, club).length;
                  const on = pick === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPick(on ? null : c.id)}
                      className={cn("tw-tap rounded-md px-1 py-2 text-center", on ? "bg-accent text-accent-fg" : "bg-elevated")}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{c.quarter}</p>
                      <p className="font-display text-lg font-semibold leading-none">{n}</p>
                      <p className="text-[10px] text-subtle">Sec {c.section}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-1">
            {YEAR_GROUPS.map((c) => {
              const n = kidsInCohort(file, c, club).length;
              const on = pick === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPick(on ? null : c.id)}
                  className={cn("tw-gadget tw-tap p-3 text-left", on ? "bg-accent text-accent-fg" : "")}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{c.course}{c.kind === "hall" ? " · Sec 10 · Rm 136" : ""}</p>
                  <p className="font-display text-2xl font-semibold leading-none">{n}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tw-gadget min-h-0 overflow-auto p-2">
          <p className="sticky top-0 z-[1] bg-surface px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-subtle">
            {cohort ? `${cohort.course} · Sec ${cohort.section} · ${cohort.quarter === "YEAR" ? "year" : cohort.quarter} · Rm ${cohort.room}` : "Every kid this year"} · {rows.length}
          </p>
          {cohort && cohort.kind !== "club" ? (
            <ClassBook file={file} cohort={cohort} showLegal={showLegal} onChange={onChange} onOpenId={onOpenId} onPlace={place} onNotice={setNotice} />
          ) : (
            <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-2 py-1 font-semibold">Alias</th>
                {showLegal ? <th className="px-2 py-1 font-semibold">Legal</th> : null}
                <th className="px-2 py-1 font-semibold">Id</th>
                <th className="px-2 py-1 font-semibold">Class</th>
                <th className="px-2 py-1 font-semibold">XP</th>
                <th className="px-2 py-1 font-semibold">Skills</th>
                <th className="px-2 py-1 font-semibold">Project</th>
                <th className="px-2 py-1 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => {
                const s = file.students.find((x) => x.id === k.id);
                return (
                <tr key={k.id} className="border-t border-border/40">
                  <td className="px-2 py-1.5">
                    <AliasCell file={file} student={s} fallback={k.first} onChange={onChange} onOpenId={onOpenId} />
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-subtle">
                      {k.live ? "live" : k.hold ? "hold" : k.sem}
                      {k.club ? " · club" : ""}
                    </span>
                  </td>
                  {showLegal && s ? (
                    <td className="px-2 py-1.5">
                      <LegalCell file={file} student={s} onChange={onChange} />
                    </td>
                  ) : showLegal ? (
                    <td className="px-2 py-1.5 text-subtle">—</td>
                  ) : null}
                  <td className="px-2 py-1.5 font-mono text-[10px] text-subtle" title={k.id}>
                    {publicHandle(k.id)}
                  </td>
                  <td className="px-2 py-1.5 text-muted">
                    {k.hall ? "Hall · 10" : k.period ? `P${k.period} · ${k.section || "—"}` : "—"} {k.crewKey && k.crewKey !== "CLUB" ? `· ${k.crewKey}` : ""}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums text-gold">{k.xp}</td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {k.skills}/{k.skillN}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">{k.project ?? "—"}</td>
                  <td className="px-2 py-1.5">
                    {k.hold || !k.live ? (
                      <select
                        className="max-w-[9rem] rounded-md bg-elevated px-1 py-1 text-[11px]"
                        defaultValue=""
                        onChange={(e) => {
                          const id = e.target.value;
                          const c = YEAR_CLASSES.find((x) => x.id === id);
                          if (c) place(k.id, c);
                          e.target.value = "";
                        }}
                      >
                        <option value="">Place in class…</option>
                        {YEAR_CLASSES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.course} P{c.period} Sec {c.section} {c.quarter}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          )}
          {!rows.length ? <p className="p-3 text-sm text-muted">No one in this filter.</p> : null}

          {orphans.length ? (
            <ul className="mt-3 space-y-1 border-t border-border/40 px-2 pt-2">
              {orphans.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{m.name} <span className="text-subtle">club only</span></span>
                  <button
                    type="button"
                    className="tw-tap min-h-8 rounded-full bg-elevated px-3 text-[11px] font-semibold"
                    onClick={() => {
                      const out = holdClubKid(file, club, m.id);
                      setClub(out.club);
                      onChange(out.desk);
                    }}
                  >
                    Hold skills
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SaveChip({ savedAt, pending, onSave }: { savedAt?: string; pending: boolean; onSave: () => void }) {
  const label = pending
    ? "Saving…"
    : savedAt
      ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : "Not saved";
  return (
    <button
      type="button"
      onClick={onSave}
      className={cn("tw-tap min-h-11 rounded-md px-3 text-sm font-semibold", pending ? "bg-gold text-bg" : "bg-elevated")}
      title="Auto-saves on this device. Tap to write now."
    >
      {label}
    </button>
  );
}

function AddKid({
  file,
  cohort,
  onChange,
}: {
  file: EconomyFile;
  cohort: YearCohort | null;
  onChange: (next: EconomyFile) => void;
}) {
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [crew, setCrew] = useState("");
  const [flash, setFlash] = useState("");
  const [classId, setClassId] = useState(cohort?.id ?? YEAR_CLASSES[0]?.id ?? "");
  const target = cohort ?? YEAR_CLASSES.concat(YEAR_GROUPS).find((c) => c.id === classId) ?? YEAR_CLASSES[0];
  const crews = file.crews.filter((c) => c.period === (target?.period ?? 0));

  function add() {
    if (!target || (!last.trim() && !first.trim())) return;
    const next = addTypedStudent(file, {
      legalLast: last,
      legalFirst: first,
      period: target.period,
      crewKey: crew || undefined,
      section: target.section,
      grade: target.grade,
      course: target.course,
      sem: target.quarter === "YEAR" ? (target.kind === "club" ? "CLUB" : "YEAR") : target.quarter,
    });
    const kid = next.students[next.students.length - 1];
    onChange(next);
    setLast("");
    setFirst("");
    setFlash(kid ? `Added ${kid.first} · ${publicHandle(kid.id)}` : "Added");
    window.setTimeout(() => setFlash(""), 3200);
  }

  return (
    <form
      className="tw-gadget flex flex-wrap items-end gap-2 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <p className="w-full text-[11px] font-bold uppercase tracking-wider text-subtle">Add student · legal names stay vault-only</p>
      {!cohort ? (
        <label className="text-xs text-muted">
          Class
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 block min-h-11 min-w-[12rem] rounded-md bg-elevated px-2 text-sm"
          >
            {YEAR_CLASSES.concat(YEAR_GROUPS).map((c) => (
              <option key={c.id} value={c.id}>
                {c.course} P{c.period || "—"} Sec {c.section || "—"} {c.quarter}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm text-muted">
          {target?.course} · P{target?.period || "—"} · Sec {target?.section || "—"}
        </p>
      )}
      <label className="text-xs text-muted">
        Last
        <input
          value={last}
          onChange={(e) => setLast(e.target.value)}
          className="mt-1 block min-h-11 w-36 rounded-md bg-elevated px-2 text-sm outline-none"
          autoComplete="off"
        />
      </label>
      <label className="text-xs text-muted">
        First
        <input
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          className="mt-1 block min-h-11 w-36 rounded-md bg-elevated px-2 text-sm outline-none"
          autoComplete="off"
        />
      </label>
      {crews.length ? (
        <label className="text-xs text-muted">
          Crew
          <select value={crew} onChange={(e) => setCrew(e.target.value)} className="mt-1 block min-h-11 rounded-md bg-elevated px-2 text-sm">
            <option value="">Auto</option>
            {crews.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name || c.key}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="submit" className="tw-tap min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg">
        Add
      </button>
      {flash ? <p className="text-sm text-gold">{flash}</p> : null}
    </form>
  );
}

function AliasCell({
  file,
  student,
  fallback,
  onChange,
  onOpenId,
}: {
  file: EconomyFile;
  student?: RawStudent;
  fallback: string;
  onChange: (next: EconomyFile) => void;
  onOpenId?: (id: string) => void;
}) {
  if (!student) return <span className="font-semibold">{fallback}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={student.first}
        onChange={(e) => onChange(setAlias(file, student.id, e.target.value))}
        className="h-9 min-w-[6.5rem] rounded-md bg-elevated px-2 text-sm font-semibold outline-none"
      />
      <button type="button" title="Profile" onClick={() => onOpenId?.(student.id)} className="tw-tap size-9 rounded-md bg-elevated text-xs font-semibold">
        i
      </button>
    </span>
  );
}

function LegalCell({
  file,
  student,
  onChange,
}: {
  file: EconomyFile;
  student: RawStudent;
  onChange: (next: EconomyFile) => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      <input
        value={legalLastOf(student)}
        onChange={(e) => onChange(setLegalNames(file, student.id, { legalLast: e.target.value }))}
        placeholder="Last"
        className="h-9 w-28 rounded-md bg-elevated px-2 text-sm outline-none"
      />
      <input
        value={legalFirstOf(student)}
        onChange={(e) => onChange(setLegalNames(file, student.id, { legalFirst: e.target.value }))}
        placeholder="First"
        className="h-9 w-28 rounded-md bg-elevated px-2 text-sm outline-none"
      />
      <label className="text-[10px] uppercase tracking-wider text-subtle">
        <input
          type="checkbox"
          checked={Boolean(student.flags?.iep)}
          onChange={(e) => onChange(setStudentFlags(file, student.id, { iep: e.target.checked }))}
          className="mr-1"
        />
        IEP
      </label>
      <label className="text-[10px] uppercase tracking-wider text-subtle">
        <input
          type="checkbox"
          checked={Boolean(student.flags?.plan504)}
          onChange={(e) => onChange(setStudentFlags(file, student.id, { plan504: e.target.checked }))}
          className="mr-1"
        />
        504
      </label>
    </span>
  );
}

function cashOf(file: EconomyFile, s: RawStudent): number {
  const hit = score(file).find((x) => x.id === s.id);
  if (hit) return hit.quarter;
  return Number(s.opening || 0) + Number(s.bonus || 0) - Number(s.deduct || 0) + Number(s.clutch || 0);
}

function ClassBook({
  file,
  cohort,
  showLegal,
  onChange,
  onOpenId,
  onPlace,
  onNotice,
}: {
  file: EconomyFile;
  cohort: YearCohort;
  showLegal: boolean;
  onChange: (next: EconomyFile) => void;
  onOpenId?: (id: string) => void;
  onPlace: (id: string, c: YearCohort) => void;
  onNotice?: (msg: string) => void;
}) {
  const club = loadClub();
  const kids = studentsInCohort(file, cohort, club);
  const slots = cohort.kind === "tech" ? gradeSlots(file, cohort.grade) : [];
  const cycle = currentCycleOf(file);
  const crews = file.crews.filter((c) => c.period === cohort.period);
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-[11px] uppercase tracking-wider text-subtle">
        <tr>
          <th className="sticky left-0 bg-surface px-2 py-1 font-semibold">Alias</th>
          {showLegal ? <th className="px-2 py-1 font-semibold">Legal</th> : null}
          <th className="px-2 py-1 font-semibold">Id</th>
          <th className="px-2 py-1 font-semibold">Crew</th>
          {["D1", "D2", "D3", "D4"].map((d) => (
            <th key={d} className="px-1 py-1 text-center font-semibold">
              C{cycle} {d}
            </th>
          ))}
          <th className="px-2 py-1 font-semibold">3/2/1</th>
          <th className="px-2 py-1 font-semibold">XP</th>
          <th className="px-2 py-1 font-semibold">$</th>
          {slots.map((slot) => (
            <th key={slot.id} className="min-w-[5.5rem] px-1 py-1 font-semibold">
              {slot.title}
            </th>
          ))}
          {slots.length ? <th className="px-2 py-1 text-right font-semibold">Mark</th> : null}
          <th className="px-2 py-1" />
        </tr>
      </thead>
      <tbody>
        {kids.map((s) => {
          const codes = cycleCodesOf(file, s, cohort);
          const effort = quarterEffort(s, cohort);
          const posted = slots.map((slot) => postedFor(file, s, slot));
          const avg = sessionMark(posted);
          const hold = String(s.sem ?? "").toUpperCase() === "CLUB" || String(s.sem ?? "").toUpperCase() === "HOLD";
          return (
            <tr key={s.id} className="border-t border-border/40">
              <td className="sticky left-0 bg-surface px-2 py-1.5">
                <AliasCell file={file} student={s} fallback={s.first} onChange={onChange} onOpenId={onOpenId} />
              </td>
              {showLegal ? (
                <td className="px-2 py-1.5">
                  <LegalCell file={file} student={s} onChange={onChange} />
                </td>
              ) : null}
              <td className="px-2 py-1.5 font-mono text-[10px] text-subtle" title={s.id}>
                {publicHandle(s.id)}
              </td>
              <td className="px-2 py-1.5">
                {crews.length ? (
                  <select
                    value={s.crewKey}
                    onChange={(e) => {
                      const dest = e.target.value;
                      const date = todayIso();
                      const block = placeBlock(file, s, dest, date);
                      if (block) {
                        onNotice?.(block);
                        return;
                      }
                      onChange(setStudentCrew(file, s.id, dest, date));
                    }}
                    className="h-9 max-w-[9rem] rounded-md bg-elevated px-1 text-sm"
                  >
                    {crews.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name || c.key}
                      </option>
                    ))}
                    {!crews.some((c) => c.key === s.crewKey) && s.crewKey ? (
                      <option value={s.crewKey}>{s.crewKey}</option>
                    ) : null}
                  </select>
                ) : (
                  <span className="text-muted">{s.crewKey || "—"}</span>
                )}
              </td>
              {codes.map((code, i) => (
                <td key={i} className="px-1 py-1.5 text-center font-mono tabular-nums">
                  {code || "·"}
                </td>
              ))}
              <td className="px-2 py-1.5 font-mono text-xs tabular-nums text-muted">
                {effort.n3}/{effort.n2}/{effort.n1}
                {effort.other ? ` · ${effort.other}` : ""}
              </td>
              <td className="px-2 py-1.5 font-mono tabular-nums text-gold">{skillXp(file, s.id)}</td>
              <td className="px-2 py-1.5 font-mono tabular-nums">{money(cashOf(file, s))}</td>
              {posted.map((r) => (
                <td key={r.slot.id} className="px-1 py-1" title={r.evidence}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder={r.calc == null ? "—" : String(r.calc)}
                    value={r.edited ? String(r.posted ?? "") : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") onChange(setGradeOverride(file, s.id, r.slot.id, null));
                      else onChange(setGradeOverride(file, s.id, r.slot.id, Number(v)));
                    }}
                    className={cn("h-9 w-14 rounded-md bg-elevated px-1 font-mono text-sm outline-none", r.edited ? "text-fg" : "text-muted")}
                  />
                  <span className="block text-[10px] text-subtle">{r.posted == null ? "" : letterOf(r.posted)}</span>
                </td>
              ))}
              {slots.length ? (
                <td className="px-2 py-1.5 text-right font-mono font-semibold">
                  {avg == null ? "—" : avg}
                  <span className="ml-1 text-xs font-normal text-subtle">{letterOf(avg)}</span>
                </td>
              ) : null}
              <td className="px-2 py-1.5">
                {hold ? (
                  <select
                    className="max-w-[9rem] rounded-md bg-elevated px-1 py-1 text-[11px]"
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value;
                      const c = YEAR_CLASSES.find((x) => x.id === id);
                      if (c) onPlace(s.id, c);
                      e.target.value = "";
                    }}
                  >
                    <option value="">Place in class…</option>
                    {YEAR_CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course} P{c.period} Sec {c.section} {c.quarter}
                      </option>
                    ))}
                  </select>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SeparateRules({
  file,
  notice,
  onNotice,
  onChange,
}: {
  file: EconomyFile;
  notice: string;
  onNotice: (msg: string) => void;
  onChange: (next: EconomyFile) => void;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [why, setWhy] = useState("");
  const kids = useMemo(
    () =>
      [...file.students].sort(
        (x, y) => x.period - y.period || legalLastOf(x).localeCompare(legalLastOf(y)) || x.first.localeCompare(y.first),
      ),
    [file.students],
  );
  const rules = bansOf(file);
  const pickA = kids.find((s) => s.id === a);
  const pickB = kids.find((s) => s.id === b);
  const ready = Boolean(a && b && a !== b);

  function lock() {
    if (!ready || !pickA || !pickB) return;
    const out = separatePair(file, a, b, why);
    onChange(out.file);
    const names = `${pickA.first} + ${pickB.first}`;
    if (out.moved) {
      const who = out.moved.id === pickB.id ? pickB.first : pickA.first;
      onNotice(`${names} will not sit together. ${who} moved to ${out.moved.to}.`);
    } else if (pickA.period !== pickB.period) {
      onNotice(`${names} will not sit together if they share a crew later.`);
    } else {
      onNotice(`${names} will not sit together.`);
    }
    setA("");
    setB("");
    setWhy("");
  }

  return (
    <section className="tw-gadget p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Separate</p>
      <p className="mt-1 text-sm text-muted">
        Pick two names already on this roster. They will not sit in the same crew — Crew manager, this table, and a class move all honor it. Never on the wall.
      </p>
      <form
        className="mt-2 flex flex-wrap items-end gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          lock();
        }}
      >
        <RosterPick students={kids} value={a} onChange={setA} hide={b} placeholder="Name" />
        <RosterPick students={kids} value={b} onChange={setB} hide={a} placeholder="Name" />
        <input
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Why (office note)"
          className="min-h-11 min-w-40 flex-1 rounded-md bg-elevated px-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!ready}
          className={cn("tw-tap min-h-11 rounded-md px-4 text-sm font-semibold", ready ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}
        >
          Separate
        </button>
      </form>
      {notice ? <p className="mt-2 text-sm font-semibold text-gold">{notice}</p> : null}
      {rules.length ? (
        <ul className="mt-2 space-y-1">
          {rules.map((rule) => {
            const left = kids.find((s) => s.id === rule.a);
            const right = kids.find((s) => s.id === rule.b);
            if (!left || !right) return null;
            return (
              <li key={`${rule.a}|${rule.b}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-elevated px-2 py-1.5 text-sm">
                <span>
                  <span className="font-semibold">{whoOf(left, true)}</span>
                  <span className="text-muted"> + </span>
                  <span className="font-semibold">{whoOf(right, true)}</span>
                  <span className="ml-2 text-xs text-muted">
                    {left.period === right.period ? `P${left.period}` : `P${left.period} · P${right.period}`}
                    {rule.note ? ` · ${rule.note}` : ""}
                  </span>
                </span>
                <button type="button" className="tw-tap min-h-9 rounded-md px-3 text-xs font-semibold text-muted" onClick={() => onChange(dropCrewBan(file, rule.a, rule.b))}>
                  Lift
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-subtle">{kids.length ? "No separate rules yet." : "Add students first, then pick two names."}</p>
      )}
    </section>
  );
}

function RosterPick({
  students,
  value,
  onChange,
  hide,
  placeholder,
}: {
  students: RawStudent[];
  value: string;
  onChange: (id: string) => void;
  hide?: string;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const picked = students.find((s) => s.id === value);
  const needle = q.trim().toLowerCase();
  const list = students.filter((s) => {
    if (hide && s.id === hide) return false;
    if (!needle) return true;
    const blob = `${s.first} ${legalLastOf(s)} ${legalFirstOf(s)} ${s.id} p${s.period}`.toLowerCase();
    return blob.includes(needle);
  }).slice(0, 48);

  useEffect(() => {
    function down(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  return (
    <div ref={root} className="relative min-w-[12rem] flex-1">
      <input
        value={open ? q : picked ? rosterLabel(picked, true) : q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="min-h-11 w-full rounded-md bg-elevated px-2 text-sm outline-none"
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md bg-elevated py-1 shadow-lg ring-1 ring-border">
          {list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={cn("flex min-h-11 w-full items-center px-2 text-left text-sm", s.id === value ? "bg-surface font-semibold" : "hover:bg-surface")}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.id);
                  setQ("");
                  setOpen(false);
                }}
              >
                {rosterLabel(s, true)}
              </button>
            </li>
          ))}
          {!list.length ? <li className="px-2 py-2 text-sm text-muted">No match on this roster</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

