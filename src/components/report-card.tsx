import type { EconomyFile, RawStudent } from "@/lib/economy";
import { bellFor } from "@/lib/economy";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { gradeSlots, letterOf, postedFor, sessionMark } from "@/lib/grades";
import { SKILL_MARKS, skillsOf, skillScore } from "@/lib/skills";
import { stemOf } from "@/lib/stems";
import { workerCards } from "@/lib/report";
import { APP_MARK } from "@/lib/copy";
import { cn } from "@/lib/utils";

function displayName(s: RawStudent, names: boolean) {
  if (!names) return s.first;
  const first = s.legalFirst || s.first;
  const last = s.legalLast || s.last || "";
  return last ? `${first} ${last}` : first;
}

function courseLine(file: EconomyFile, period: number, grade: number) {
  const sec = file.meta.sections?.find((x) => x.period === period);
  return sec?.course ? `${sec.course} · Grade ${grade}` : `Technology · Grade ${grade}`;
}

function skillWord(n: number) {
  return SKILL_MARKS.find((m) => m.n === n)?.name ?? "";
}

function prettySkill(name: string) {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

/** Parent / family conference sheet. Wallet, IEP, and 3/2/1 codes stay off. */
export function ReportCard({ file, id, names, print }: { file: EconomyFile; id: string; names: boolean; print?: boolean }) {
  const s = file.students.find((x) => x.id === id);
  if (!s) return null;
  const grade = bellFor(file).find((b) => b.period === s.period)?.grade ?? s.grade ?? 6;
  const slots = gradeSlots(file, grade);
  const rows = slots.map((slot) => postedFor(file, s, slot));
  const avg = sessionMark(rows);
  const card = workerCards(file).find((c) => c.id === id);
  const seen = skillsOf(file)
    .map((sk) => ({ id: sk.id, name: prettySkill(sk.name), n: skillScore(s, sk.id) }))
    .filter((sk) => sk.n > 0);
  const present = (card?.counts["3"] ?? 0) + (card?.counts["2"] ?? 0) + (card?.counts["1"] ?? 0);
  const excused = card?.counts.E ?? 0;
  const absent = card?.counts.A ?? 0;
  const personal = card?.counts.P ?? 0;

  return (
    <section className={cn("parent-sheet tw-gadget tw-hud mt-5 p-5 print:mt-0 print:rounded-none print:bg-white print:p-8 print:text-black print:shadow-none", print ? "parent-print" : "")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-subtle print:text-neutral-500">{APP_MARK} · family view</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{displayName(s, names)}</h2>
          <p className="mt-1 text-sm text-muted print:text-neutral-600">
            {courseLine(file, s.period, grade)} · Period {s.period}
            {s.crewKey ? ` · Crew ${s.crewKey}` : ""}
          </p>
          <p className="text-xs text-subtle print:text-neutral-500">{formatSchoolDate(todayIso())} · {file.meta.quarterName ?? "this quarter"}</p>
        </div>
        {print ? (
          <button type="button" onClick={() => window.print()} className="tw-tap min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg print:hidden">
            Print for family
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="rounded-xl bg-elevated px-5 py-4 print:border print:border-neutral-300 print:bg-white">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Marking period</p>
          <p className="mt-1 font-display text-5xl font-semibold tabular-nums leading-none">
            {avg == null ? "—" : avg}
            <span className="ml-2 font-display text-3xl text-muted print:text-neutral-500">{letterOf(avg)}</span>
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted print:text-neutral-700">
          One grade for the project, from shop skills (Beginning → Distinguished). Showing up and the class perk game are not this number. Blank means not scored yet — not a zero.
        </p>
      </div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-subtle">Project</p>
      <ul className="mt-1">
        {rows.map((r) => (
          <li key={r.slot.id} className="flex items-baseline justify-between gap-3 border-t border-border py-2 print:border-neutral-200">
            <span>
              <span className="font-semibold">{r.slot.title}</span>
              <span className="mt-0.5 block text-sm text-muted print:text-neutral-600">
                {r.posted == null ? "In progress — no mark posted yet." : r.evidence}
              </span>
            </span>
            <span className="shrink-0 font-mono text-lg tabular-nums">
              {r.posted == null ? "—" : r.posted} <span className="text-sm text-muted">{letterOf(r.posted)}</span>
            </span>
          </li>
        ))}
      </ul>

      {seen.length ? (
        <>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-subtle">What they can do</p>
          <ul className="mt-1 divide-y divide-border print:divide-neutral-200">
            {seen.map((sk) => (
              <li key={sk.id} className="flex items-baseline justify-between gap-3 py-2">
                <span>
                  <span className="font-semibold">{sk.name}</span>
                  <span className="mt-0.5 block text-sm text-muted print:text-neutral-600">{stemOf(sk.id, sk.n) || skillWord(sk.n)}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {sk.n} · {skillWord(sk.n)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">Skill marks will appear here once workshop work is scored.</p>
      )}

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-subtle">Time in class</p>
      <p className="mt-1 text-sm text-muted print:text-neutral-700">
        Present {present}
        {excused ? ` · Excused ${excused}` : ""}
        {absent ? ` · Absent ${absent}` : ""}
        {personal ? ` · Personal day ${personal}` : ""}
        <span className="block text-xs text-subtle">Presence is recorded. It is not averaged into the project grade.</span>
      </p>

      <p className="mt-6 text-xs leading-relaxed text-subtle print:text-neutral-500">
        Classroom perks and the stock game are practice, not this report. Real names do not appear on the public class wall.
      </p>
    </section>
  );
}
