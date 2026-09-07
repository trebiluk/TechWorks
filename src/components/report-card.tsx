import type { EconomyFile } from "@/lib/economy";
import { bellFor, money } from "@/lib/economy";
import { formatSchoolDate } from "@/lib/calendar";
import { gradeSlots, letterOf, postedFor, recipeLine, sessionMark } from "@/lib/grades";
import { skillsOf, skillScore } from "@/lib/skills";
import { workerCards } from "@/lib/report";
import { cn } from "@/lib/utils";

export function ReportCard({ file, id, names, print }: { file: EconomyFile; id: string; names: boolean; print?: boolean }) {
  const s = file.students.find((x) => x.id === id);
  if (!s) return null;
  const grade = bellFor(file).find((b) => b.period === s.period)?.grade ?? s.grade ?? 6;
  const slots = gradeSlots(file, grade);
  const rows = slots.map((slot) => postedFor(file, s, slot));
  const avg = sessionMark(rows);
  const card = workerCards(file).find((c) => c.id === id);
  const skills = skillsOf(file);
  const projects = rows.filter((r) => r.slot.kind === "project");
  const cycles = rows.filter((r) => r.slot.kind === "cycle");
  const skillRows = rows.filter((r) => r.slot.kind === "skill");

  return (
    <section className={cn("mt-5 rounded-lg bg-elevated p-4 print:bg-white print:text-black", print ? "parent-print" : "")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Report card</p>
        {print ? (
          <button type="button" onClick={() => window.print()} className="min-h-11 rounded-md bg-surface px-3 text-sm font-semibold print:hidden">
            Print for parent
          </button>
        ) : null}
      </div>
      <p className="mt-1 font-display text-2xl font-semibold">
        {names && s.last ? `${s.first} ${s.last}` : s.first}
        <span className="ml-2 text-base font-normal text-muted">
          P{s.period} · {s.crewKey}
        </span>
      </p>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
        {avg == null ? "—" : avg}
        <span className="ml-2 text-xl text-muted">{letterOf(avg)}</span>
      </p>
      <p className="mt-1 text-xs text-subtle">{recipeLine()}</p>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-subtle">Projects</p>
      <ul className="mt-1 space-y-1 text-sm">
        {(projects.length ? projects : cycles).map((r) => (
          <li key={r.slot.id} className="flex justify-between gap-3 border-t border-border py-1">
            <span>
              {r.slot.title}
              <span className="mt-0.5 block text-xs text-subtle">{r.evidence}</span>
            </span>
            <span className="font-mono">
              {r.posted == null ? "—" : r.posted} {letterOf(r.posted)}
              {r.edited ? <span className="ml-1 text-xs text-subtle">edit</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {skillRows.length ? (
        <>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-subtle">What can they do?</p>
      <ul className="mt-1 space-y-1 text-sm">
        {skillRows.map((r) => (
          <li key={r.slot.id} className="flex justify-between gap-3 border-t border-border py-1">
            <span>
              {r.slot.title}
              <span className="mt-0.5 block text-xs text-subtle">{r.evidence}</span>
            </span>
            <span className="font-mono">
              {r.posted == null ? "—" : r.posted} {letterOf(r.posted)}
              {r.edited ? <span className="ml-1 text-xs text-subtle">edit</span> : null}
            </span>
          </li>
        ))}
      </ul>
        </>
      ) : (
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-subtle">Skill growth lives inside each activity · not a second mark</p>
      )}

      {card ? (
        <>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-subtle">Evidence (not in the mark)</p>
          <p className="mt-1 text-sm text-muted">
            Effort 3/2/1: {card.counts["3"] ?? 0} / {card.counts["2"] ?? 0} / {card.counts["1"] ?? 0}
            <span className="mx-2">·</span>
            Absent {card.counts.A ?? 0} · Excused {card.counts.E ?? 0} · Personal {card.counts.P ?? 0}
          </p>
          <p className="text-sm text-muted">
            Perks {money(card.quarter)} · stock {money(card.stock)} — wallet is a class game, not a grade.
          </p>
          <p className="mt-2 text-sm font-semibold">Wallet and stock are classroom games. They are not the report-card mark.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.map((sk) => (
              <span key={sk.id} className={cn("rounded-md bg-surface px-2 py-1 text-xs", skillScore(s, sk.id) ? "text-fg" : "text-subtle")}>
                {sk.name} {skillScore(s, sk.id) || "—"}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-subtle">What happened</p>
          <ul className="mt-1 text-sm">
            {card.stamps.filter((st) => st.happened || st.note || st.activity).slice(-8).map((st) => (
              <li key={st.date} className="border-t border-border py-1 text-muted">
                {formatSchoolDate(st.date)}
                {st.goal ? ` · ${st.goal}` : ""}
                {st.activity ? ` · ${st.activity}` : ""}
                {st.happened ? ` — ${st.happened}` : ""}
                {st.note ? ` (${st.note})` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
