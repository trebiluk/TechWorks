import { useMemo, useState } from "react";
import { Copy, Download } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, padFirst, periodTitle, shopBells, showFirstReal } from "@/lib/economy";
import { abOn, onAbRoster, setGradeExcuse, setGradeNote, setGradeOverride } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import {
  bookSnapshot,
  classroomCsv,
  columnSnapshot,
  columnTsv,
  gradeSlots,
  letterOf,
  openWorkTsv,
  postedFor,
  recipeLine,
  sessionMark,
} from "@/lib/grades";
import { downloadText } from "@/lib/live";
import { QuarterChip } from "@/components/quarter-chip";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "low";
type SortKey = "name" | "low";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [focus, setFocus] = useState<{ id: string; slotId: string } | null>(null);
  const real = showFirstReal(file);
  const grade = bells.find((b) => b.period === period)?.grade ?? 6;
  const slots = useMemo(() => gradeSlots(file, grade), [file, grade]);
  const kids = file.students.filter(
    (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
  );
  const table = kids.map((s) => {
    const posted = slots.map((slot) => postedFor(file, s, slot));
    return { s, posted, avg: sessionMark(posted) };
  });
  const snap = bookSnapshot(table.map((row) => ({ posted: row.posted, avg: row.avg })));
  const started = new Set(
    slots
      .filter((slot) =>
        table.some((row) => {
          const cell = row.posted.find((r) => r.slot.id === slot.id);
          return Boolean(cell && !cell.excused && cell.posted != null);
        }),
      )
      .map((slot) => slot.id),
  );
  const shown = table
    .filter((row) => {
      if (filter === "open") return row.posted.some((r) => !r.excused && r.posted == null);
      if (filter === "low") return row.avg != null && row.avg < 70;
      return true;
    })
    .sort((a, b) => {
      if (sort === "low") {
        if (a.avg == null && b.avg == null) return a.s.first.localeCompare(b.s.first);
        if (a.avg == null) return -1;
        if (b.avg == null) return 1;
        return a.avg - b.avg || a.s.first.localeCompare(b.s.first);
      }
      return a.s.first.localeCompare(b.s.first);
    });
  const focused = focus ? table.find((row) => row.s.id === focus.id) : undefined;
  const focusedCell = focused?.posted.find((r) => r.slot.id === focus?.slotId);

  function guard(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function ping(text: string) {
    setFlash(text);
    window.setTimeout(() => setFlash(""), 3200);
  }

  function exportCsv() {
    if (!guard()) return;
    downloadText(`techworks-classroom-P${period}.csv`, classroomCsv(file, { names: true, period }), "text/csv");
  }

  async function copyText(filename: string, text: string, ok: string) {
    if (!guard()) return;
    try {
      await navigator.clipboard.writeText(text);
      ping(ok);
    } catch {
      downloadText(filename, text, "text/plain");
      ping("Saved a text file — clipboard was blocked");
    }
  }

  async function copyNames() {
    const text = slots.map((s) => s.title).join("\n");
    setShowNames(true);
    await copyText(`classroom-assignments-P${period}.txt`, `${text}\n`, "Copied assignment names");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Grades</h1>
        <QuarterChip />
        <p className="text-sm text-muted">Shop book. SchoolTool stays the official grade. Blank is not a zero.</p>
      </header>
      <div className="flex flex-wrap items-center gap-1">
        {bells.map((b) => (
          <button
            key={b.period}
            type="button"
            onClick={() => {
              setPeriod(b.period);
              setFocus(null);
            }}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", period === b.period ? "bg-accent text-accent-fg" : "bg-surface text-muted")}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
      </div>
      <p className="text-sm text-fg">
        <span className="font-semibold tabular-nums">{snap.n}</span> in class
        {" · "}
        average <span className="font-semibold tabular-nums">{snap.avg == null ? "—" : snap.avg}</span> {letterOf(snap.avg)}
        {" · "}
        <span className="font-semibold tabular-nums">{snap.openKids}</span> not scored
        {" · "}
        <span className="font-semibold tabular-nums">{snap.low}</span> under 70
      </p>
      <p className="text-xs text-subtle">
        A {snap.letters.A} · B {snap.letters.B} · C {snap.letters.C} · D {snap.letters.D} · F {snap.letters.F}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {(
          [
            ["all", "Everyone"],
            ["open", "Not scored"],
            ["low", "Under 70"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", filter === id ? "bg-accent text-accent-fg" : "bg-surface text-muted")}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSort(sort === "name" ? "low" : "name")}
          className="min-h-11 rounded-md bg-surface px-3 text-sm font-semibold text-muted"
        >
          {sort === "name" ? "Sort: name" : "Sort: low mark"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void copyNames()} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold">
          <Download className="size-4" />
          Assignment names
        </button>
        <button
          type="button"
          onClick={() => void copyText(`not-scored-P${period}.txt`, openWorkTsv(file, kids, slots), "Copied who is not scored")}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-sm font-semibold"
        >
          <Copy className="size-4" />
          Copy not scored
        </button>
        <button type="button" onClick={exportCsv} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
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
      {focused && focusedCell ? (
        <div className="grid gap-2 rounded-lg bg-elevated p-3 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold">
              {padFirst(focused.s, real)} · {splitTitle(focusedCell.slot.title)[0]}
            </p>
            <p className="text-xs text-subtle">{focusedCell.evidence}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                "min-h-11 rounded-md px-3 text-sm font-semibold",
                focusedCell.excused ? "bg-accent text-accent-fg" : "bg-surface",
              )}
              onClick={() => {
                if (!guard()) return;
                onChange(setGradeExcuse(file, focused.s.id, focusedCell.slot.id, !focusedCell.excused));
              }}
            >
              {focusedCell.excused ? "Excused" : "Excuse"}
            </button>
            {focusedCell.edited ? (
              <button
                type="button"
                className="min-h-11 rounded-md bg-surface px-3 text-sm font-semibold"
                onClick={() => {
                  if (!guard()) return;
                  onChange(setGradeOverride(file, focused.s.id, focusedCell.slot.id, null));
                }}
              >
                Use calculated
              </button>
            ) : null}
            <button
              type="button"
              className="min-h-11 rounded-md bg-surface px-3 text-sm font-semibold"
              onClick={() =>
                void copyText(
                  `column-P${period}.txt`,
                  columnTsv(file, kids, focusedCell.slot),
                  `Copied ${splitTitle(focusedCell.slot.title)[0]}. Paste into SchoolTool.`,
                )
              }
            >
              Copy column
            </button>
          </div>
          <label className="block text-xs text-subtle sm:col-span-2">
            Comment for SchoolTool
            <input
              value={focusedCell.note}
              maxLength={140}
              placeholder="Short note. No legal names."
              onChange={(e) => {
                if (!guard()) return;
                onChange(setGradeNote(file, focused.s.id, focusedCell.slot.id, e.target.value));
              }}
              className="mt-1 min-h-11 w-full rounded-md bg-surface px-3 text-sm text-fg outline-none"
            />
          </label>
        </div>
      ) : (
        <p className="text-sm text-muted">Tap a number to excuse it, leave a comment, or copy that column.</p>
      )}
      <p className="text-xs text-subtle">{recipeLine()}</p>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-surface">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted">{kids.length === 0 ? "No one in this class today." : "No one in this list."}</p>
        ) : (
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="text-subtle">
                <th className="sticky left-0 bg-surface px-3 py-2 font-medium">Alias</th>
                {slots.map((slot) => {
                  const [project, rest] = splitTitle(slot.title);
                  const col = columnSnapshot(table.map((row) => row.posted.find((r) => r.slot.id === slot.id)!).filter(Boolean));
                  return (
                    <th key={slot.id} className="min-w-[8rem] px-1 py-2 font-medium leading-tight">
                      <span className="block text-fg">{project}</span>
                      <span className="block text-[10px] uppercase tracking-wide text-subtle">{rest}</span>
                      <span className="mt-1 block text-[10px] normal-case tracking-normal text-subtle">
                        avg {col.avg == null ? "—" : col.avg}
                        {col.open ? ` · ${col.open} open` : ""}
                        {col.excused ? ` · ${col.excused} excused` : ""}
                      </span>
                      <button
                        type="button"
                        className="mt-1 min-h-11 rounded-md bg-elevated px-2 text-xs font-semibold text-fg"
                        onClick={() => void copyText(`column-P${period}.txt`, columnTsv(file, kids, slot), `Copied ${project}. Paste into SchoolTool.`)}
                      >
                        Copy
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-right font-medium">Mark</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.s.id} className="border-t border-border">
                  <td className="sticky left-0 bg-surface px-3 py-1">
                    <button type="button" onClick={() => onOpenId(row.s.id)} className="min-h-11 font-medium">
                      {padFirst(row.s, real)}
                    </button>
                  </td>
                  {row.posted.map((r) => (
                    <td key={r.slot.id} className="px-1 py-1">
                      <label className="block" title={r.evidence}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder={r.excused ? "E" : r.calc == null ? "—" : String(r.calc)}
                          value={r.edited ? String(r.posted ?? "") : ""}
                          onFocus={() => setFocus({ id: row.s.id, slotId: r.slot.id })}
                          onChange={(e) => {
                            if (!guard()) return;
                            const v = e.target.value;
                            if (v === "") onChange(setGradeOverride(file, row.s.id, r.slot.id, null));
                            else onChange(setGradeOverride(file, row.s.id, r.slot.id, Number(v)));
                          }}
                          className={cn(
                            "h-10 w-16 rounded-md bg-elevated px-2 font-mono text-sm outline-none",
                            r.edited ? "text-fg" : "text-muted",
                            !r.excused && r.posted == null && started.has(r.slot.id) && "outline outline-1 outline-gold",
                            r.posted != null && r.posted < 70 && "text-gold",
                            focus?.id === row.s.id && focus.slotId === r.slot.id && "ring-2 ring-accent",
                          )}
                        />
                        {r.excused ? (
                          <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-subtle">Excused</span>
                        ) : r.edited ? (
                          <button
                            type="button"
                            className="mt-0.5 block text-[10px] uppercase tracking-wide text-subtle"
                            onClick={() => {
                              if (!guard()) return;
                              onChange(setGradeOverride(file, row.s.id, r.slot.id, null));
                            }}
                          >
                            revert
                          </button>
                        ) : (
                          <span className="mt-0.5 block text-[10px] text-subtle">{letterOf(r.posted)}</span>
                        )}
                        {r.note ? <span className="block max-w-16 truncate text-[10px] text-gold">note</span> : null}
                      </label>
                    </td>
                  ))}
                  <td className={cn("px-3 py-1 text-right font-mono font-semibold", row.avg != null && row.avg < 70 && "text-gold")}>
                    {row.avg == null ? "—" : row.avg}
                    <span className="ml-1 text-xs font-normal text-subtle">{letterOf(row.avg)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-subtle">
                <td className="sticky left-0 bg-surface px-3 py-2 text-xs font-semibold">Class</td>
                {slots.map((slot) => {
                  const col = columnSnapshot(table.map((row) => row.posted.find((r) => r.slot.id === slot.id)!).filter(Boolean));
                  return (
                    <td key={slot.id} className="px-1 py-2 font-mono text-xs">
                      {col.avg == null ? "—" : col.avg} {letterOf(col.avg)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-fg">
                  {snap.avg == null ? "—" : snap.avg} {letterOf(snap.avg)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

function splitTitle(title: string): [string, string] {
  const i = title.indexOf(" · ");
  if (i < 0) return [title, ""];
  return [title.slice(0, i), title.slice(i + 3)];
}
