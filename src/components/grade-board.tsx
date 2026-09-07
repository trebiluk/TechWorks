import { useMemo, useState } from "react";
import { Copy, Download } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, periodTitle, shopBells } from "@/lib/economy";
import { abOn, onAbRoster, setGradeOverride } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { classroomCsv, gradeSlots, letterOf, postedFor, recipeLine, sessionMark } from "@/lib/grades";
import { downloadText } from "@/lib/live";
import { QuarterChip } from "@/components/quarter-chip";
import { cn } from "@/lib/utils";

export function GradeBoard({
  file,
  onChange,
  unlocked,
  onNeedPin,
  onOpenId,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  unlocked: boolean;
  onNeedPin: () => void;
  onOpenId: (id: string) => void;
}) {
  const bells = shopBells(file);
  const today = todayIso();
  const letter = abOn(file, today);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [showNames, setShowNames] = useState(false);
  const [flash, setFlash] = useState("");
  const grade = bells.find((b) => b.period === period)?.grade ?? 6;
  const slots = useMemo(() => gradeSlots(file, grade), [file, grade]);
  const kids = file.students.filter(
    (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
  );

  function exportCsv() {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    downloadText(`techworks-classroom-P${period}.csv`, classroomCsv(file, { names: true, period }), "text/csv");
  }

  async function copyNames() {
    const text = slots.map((s) => s.title).join("\n");
    setShowNames(true);
    downloadText(`classroom-assignments-P${period}.txt`, `${text}\n`, "text/plain");
    try {
      await navigator.clipboard.writeText(text);
      setFlash("Copied · also saved as a text file");
    } catch {
      setFlash("Saved as a text file — names listed below");
    }
    window.setTimeout(() => setFlash(""), 3200);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Grades</h1>
        <QuarterChip />
        <p className="text-sm text-muted">One column per project. Hover a cell for activity averages. $ stays out.</p>
      </header>
      <div className="flex flex-wrap items-center gap-1">
        {bells.map((b) => (
          <button
            key={b.period}
            type="button"
            onClick={() => setPeriod(b.period)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", period === b.period ? "bg-accent text-accent-fg" : "bg-surface text-muted")}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyNames()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold"
        >
          <Download className="size-4" />
          Assignment names
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg"
        >
          <Copy className="size-4" />
          Classroom CSV
        </button>
        {flash ? <span className="text-sm text-gold">{flash}</span> : null}
      </div>
      {showNames ? (
        <ol className="grid gap-1 rounded-xl bg-surface px-3 py-3 text-sm sm:grid-cols-2">
          {slots.map((s) => (
            <li key={s.id} className="rounded-md bg-elevated px-3 py-2 font-semibold">
              {s.title}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="text-xs text-subtle">{recipeLine()}</p>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-surface">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="text-subtle">
              <th className="sticky left-0 bg-surface px-3 py-2 font-medium">Alias</th>
              {slots.map((slot) => {
                const [project, rest] = splitTitle(slot.title);
                return (
                  <th key={slot.id} className="min-w-[8rem] px-1 py-2 font-medium leading-tight">
                    <span className="block text-fg">{project}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-subtle">{rest}</span>
                  </th>
                );
              })}
              <th className="px-3 py-2 text-right font-medium">Mark</th>
            </tr>
          </thead>
          <tbody>
            {kids.map((s) => {
              const rows = slots.map((slot) => postedFor(file, s, slot));
              const avg = sessionMark(rows);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="sticky left-0 bg-surface px-3 py-1">
                    <button type="button" onClick={() => onOpenId(s.id)} className="font-medium">
                      {s.first}
                    </button>
                  </td>
                  {rows.map((r) => (
                    <td key={r.slot.id} className="px-1 py-1">
                      <label className="block" title={r.evidence}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder={r.calc == null ? "—" : String(r.calc)}
                          value={r.edited ? String(r.posted ?? "") : ""}
                          onChange={(e) => {
                            if (!unlocked) {
                              onNeedPin();
                              return;
                            }
                            const v = e.target.value;
                            if (v === "") onChange(setGradeOverride(file, s.id, r.slot.id, null));
                            else onChange(setGradeOverride(file, s.id, r.slot.id, Number(v)));
                          }}
                          className={cn(
                            "h-10 w-16 rounded-md bg-elevated px-2 font-mono text-sm outline-none",
                            r.edited ? "text-fg" : "text-muted",
                          )}
                        />
                        {r.edited ? (
                          <button
                            type="button"
                            className="mt-0.5 block text-[10px] uppercase tracking-wide text-subtle"
                            onClick={() => onChange(setGradeOverride(file, s.id, r.slot.id, null))}
                          >
                            revert
                          </button>
                        ) : (
                          <span className="mt-0.5 block text-[10px] text-subtle">{letterOf(r.posted)}</span>
                        )}
                      </label>
                    </td>
                  ))}
                  <td className="px-3 py-1 text-right font-mono font-semibold">
                    {avg == null ? "—" : avg}
                    <span className="ml-1 text-xs font-normal text-subtle">{letterOf(avg)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" · ");
  if (i < 0) return [title, ""];
  return [title.slice(0, i), title.slice(i + 3)];
}