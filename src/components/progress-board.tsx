import { useEffect, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { storedPin } from "@/lib/pin";
import { setSkillScore } from "@/lib/skills";
import {
  PROGRESS_SKILLS,
  attemptsFor,
  bestCell,
  progressCsv,
  rubricOfSkill,
  topAliases,
  type ProgressMark,
} from "@/lib/app-progress";
import { downloadText } from "@/lib/live";
import { cn } from "@/lib/utils";

/** Teacher book of app results. Aliases. Desk PIN stays on this computer. */
export function ProgressBoard({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const [marks, setMarks] = useState<ProgressMark[]>([]);
  const [open, setOpen] = useState<{ alias: string; skill: string } | null>(null);
  const [err, setErr] = useState("");
  const on = Boolean(file.meta.config?.progressBoard);

  useEffect(() => {
    const pin = storedPin();
    void fetch("/api/marks?period=1", { headers: { "x-tw-pin": pin } })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ marks?: ProgressMark[] }>;
      })
      .then((body) => setMarks(Array.isArray(body.marks) ? body.marks : []))
      .catch(() => setErr("App results did not load."));
  }, []);

  useEffect(() => {
    if (!marks.length) return;
    let next = file;
    let changed = false;
    for (const row of marks) {
      const stars = Number(row.stars) || 0;
      if (stars < 1 || stars > 4) continue;
      const skill = rubricOfSkill(row.skill || "") || rubricOfSkill(
        PROGRESS_SKILLS.find((col) => (col.apps as readonly string[]).includes(row.app || ""))?.id || "",
      );
      if (!skill) continue;
      const kid = next.students.find((s) => isLiveStudent(s) && s.first === row.alias);
      if (!kid) continue;
      if (Number(kid.skills?.[skill] || 0) >= stars) continue;
      next = setSkillScore(next, kid.id, skill, stars);
      changed = true;
    }
    if (changed) onChange(next);
    // Apply once per mark set. The file identity changes after onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks]);

  const aliases = [...new Set(marks.map((row) => (row.alias || "").trim()).filter(Boolean))];
  const tries = open ? attemptsFor(marks, open.alias, open.skill) : [];

  function toggleBoard() {
    onChange({
      ...file,
      meta: { ...file.meta, config: { ...file.meta.config, progressBoard: !on } },
    });
  }

  return (
    <section className="mb-3 rounded-xl bg-surface p-3" data-progress-board>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-semibold">App progress</h2>
        <button type="button" onClick={toggleBoard} aria-pressed={on} className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", on ? "bg-accent text-accent-fg" : "bg-elevated")}>
          Wall board {on ? "on" : "off"}
        </button>
        <button
          type="button"
          className="tw-tap min-h-11 rounded-full bg-elevated px-3 text-sm font-semibold"
          onClick={() => downloadText("techworks-app-progress.csv", progressCsv(marks), "text/csv")}
        >
          CSV for the book
        </button>
      </div>
      {err ? <p className="mt-2 text-sm text-muted">{err}</p> : null}
      <div className="mt-2 overflow-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-subtle">
              <th className="px-2 py-1">Alias</th>
              {PROGRESS_SKILLS.map((col) => (
                <th key={col.id} className="px-1 py-1">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aliases.map((alias) => (
              <tr key={alias} className="border-t border-border/40">
                <td className="px-2 py-1 font-semibold">{alias}</td>
                {PROGRESS_SKILLS.map((col) => {
                  const cell = bestCell(marks, alias, col.id);
                  return (
                    <td key={col.id} className="px-1 py-1">
                      <button
                        type="button"
                        className="tw-tap min-h-11 min-w-16 rounded-xl bg-elevated px-2 text-sm font-bold"
                        onClick={() => setOpen({ alias, skill: col.id })}
                      >
                        {cell.stars ? `★${cell.stars}` : "—"}
                        <span className="block text-[10px] font-semibold text-muted">{cell.xp ? `${cell.xp} XP` : ""}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!aliases.length ? <p className="px-2 py-3 text-sm text-muted">No app results yet.</p> : null}
      </div>
      {open ? (
        <div className="mt-2 rounded-xl bg-elevated p-3">
          <p className="font-semibold">{open.alias} · {PROGRESS_SKILLS.find((col) => col.id === open.skill)?.label}</p>
          <ul className="mt-1 grid gap-1">
            {tries.map((row, i) => (
              <li key={`${row.ts}-${i}`} className="text-sm">
                {row.app} · {row.event} · {row.level || "—"} · ★{row.stars || 0} · {row.xp || 0} XP
              </li>
            ))}
            {!tries.length ? <li className="text-sm text-muted">No tries.</li> : null}
          </ul>
        </div>
      ) : null}
      {on ? <WallBoard marks={marks} /> : null}
    </section>
  );
}

export function WallBoard({ marks }: { marks: ProgressMark[] }) {
  const top = topAliases(marks);
  if (!top.length) return null;
  return (
    <section className="mt-2 rounded-xl bg-elevated p-3" data-week-board>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">This week</p>
      <ol className="mt-1 grid gap-1">
        {top.map((row, i) => (
          <li key={row.alias} className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <span className="w-6 text-gold">{i + 1}</span>
            <span className="flex-1">{row.alias}</span>
            <span>{row.xp} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
