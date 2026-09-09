import type { EconomyFile, RawStudent } from "@/lib/economy";
import { formatSchoolDate } from "@/lib/calendar";
import { projectsOf } from "@/lib/projects";
import { lastStemOf, schoolYearOf, skillBest, skillInYear, skillLogOf, skillTrackOf, skillYearsOf, skillsOf } from "@/lib/skills";
import { stemOf } from "@/lib/stems";
import { cn } from "@/lib/utils";

const MARK = ["", "Beg", "Dev", "Prof", "Dist"] as const;

export function SkillScaffold({ file, student }: { file: EconomyFile; student: RawStudent }) {
  const year = schoolYearOf(file);
  const years = skillYearsOf(student, year);
  const skills = skillsOf(file);
  const log = skillLogOf(student).slice(-12).reverse();
  const titles = new Map(projectsOf(file).map((p) => [p.id, p.title]));
  const last = lastStemOf(student);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Best mark keeps traveling with the worker — not the crew, not the project. {year} is this year. The sentence is the evidence stem.
      </p>
      {last ? <p className="text-sm text-gold">{last}</p> : null}
      <div className="overflow-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="text-subtle">
              <th className="py-1 font-medium">Skill</th>
              {years.map((y) => (
                <th key={y} className="px-1 py-1 font-medium">
                  {y}
                </th>
              ))}
              <th className="px-1 py-1 font-medium">Best</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((sk) => {
              const best = skillBest(student, sk.id);
              if (!best && !years.some((y) => skillInYear(student, sk.id, y))) return null;
              return (
                <tr key={sk.id} className="border-t border-border">
                  <td className="py-1.5 font-semibold">{skillTrackOf(sk.id)?.name ?? sk.name}</td>
                  {years.map((y) => {
                    const n = skillInYear(student, sk.id, y);
                    return (
                      <td key={y} className={cn("px-1 font-mono", y === year ? "text-gold" : "text-muted")} title={n ? stemOf(sk.id, n) : ""}>
                        {n ? MARK[n] : "—"}
                      </td>
                    );
                  })}
                  <td className="px-1 font-mono text-fg" title={best ? stemOf(sk.id, best) : ""}>
                    {best ? MARK[best] : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-1 text-sm">
        {log.map((row, i) => {
          const stem = row.stem || (row.n ? stemOf(row.skillId, row.n) : "");
          return (
            <li key={`${row.date}-${row.skillId}-${i}`} className="flex flex-wrap gap-x-2 border-t border-border py-1.5 text-muted">
              <span className="font-medium text-fg">{formatSchoolDate(row.date)}</span>
              <span>{skillTrackOf(row.skillId)?.name ?? row.skillId}</span>
              <span className="font-mono text-gold">{MARK[row.n] || "cleared"}</span>
              {row.crewKey ? <span>{row.crewKey}</span> : null}
              {row.projectId ? <span>{titles.get(row.projectId) ?? row.projectId}</span> : null}
              {row.source ? <span className="uppercase tracking-wide text-[10px]">{row.source}</span> : null}
              {stem ? <span className="basis-full text-sm text-fg">{stem}</span> : null}
            </li>
          );
        })}
        {!log.length ? <li className="text-muted">No history yet. Marks from Watch and Sit-down land here.</li> : null}
      </ul>
    </div>
  );
}
