import { useEffect, useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { todayIso } from "@/lib/calendar";
import { pinnedActivityId } from "@/lib/projects";
import { SKILL_TRACK, skillsOf } from "@/lib/skills";
import { downloadText } from "@/lib/live";
import {
  SCORE_SKILL_MAX,
  activityCsv,
  addCustomSkill,
  bookOf,
  findActivity,
  livePeriodRoster,
  modeOf,
  periodActivities,
  setActivityAbsent,
  setActivityAll,
  setActivityNote,
  setActivityScore,
  setScoreMode,
  setTrackedSkills,
  skillLabel,
  skillTrend,
  trackedSkills,
  type ScoreMode,
} from "@/lib/activity-score";
import { cn } from "@/lib/utils";

const MODES: { id: ScoreMode; label: string }[] = [
  { id: "rubric", label: "1–4" },
  { id: "points", label: "Points" },
  { id: "done", label: "Done" },
];

export function ActivityScore({
  file,
  onChange,
  period,
  date,
  unlocked,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  period: number;
  date?: string;
  unlocked: boolean;
}) {
  const day = date || todayIso();
  const acts = useMemo(() => periodActivities(file, period), [file, period]);
  const pinned = pinnedActivityId(file, period, day);
  const hourId = `hour:${day}:P${period}`;
  const [pick, setPick] = useState(pinned || acts[0]?.activity.id || hourId);
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [noteId, setNoteId] = useState<string | null>(null);
  useEffect(() => {
    if (pinned) setPick(pinned);
  }, [pinned]);
  const found = findActivity(file, pick);
  const activityId = found?.activity.id || pick || hourId;
  const projectId = found?.projectId || "";
  const book = bookOf(file, activityId);
  const skills = trackedSkills(found?.activity, book);
  const mode = modeOf(found?.activity, book);
  const kids = livePeriodRoster(file, period);
  const choices = useMemo(() => {
    const extra = skillsOf(file).filter((s) => !SKILL_TRACK.some((t) => t.id === s.id));
    return [...SKILL_TRACK.map((s) => ({ id: s.id, name: s.name })), ...extra.map((s) => ({ id: s.id, name: s.name }))];
  }, [file]);

  function gate(): boolean {
    return unlocked;
  }

  function commit(next: EconomyFile) {
    if (!gate()) return;
    onChange(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  function toggleSkill(id: string) {
    const cur = skills.includes(id) ? skills.filter((s) => s !== id) : [...skills, id];
    if (cur.length > SCORE_SKILL_MAX) return;
    commit(setTrackedSkills(file, projectId, activityId, cur));
  }

  function cycle(studentId: string, skillId: string, current: number | undefined) {
    if (mode === "points") return;
    const next = mode === "done" ? (current ? 0 : 1) : current === 4 ? 0 : (current ?? 0) + 1;
    commit(setActivityScore(file, activityId, studentId, skillId, next, { mode, projectId }));
  }

  const selected = pickedIds.filter((id) => kids.some((s) => s.id === id));

  return (
    <section className="grid gap-2 rounded-xl bg-elevated p-3" data-activity-score>
      <div className="sticky top-0 z-[2] flex flex-wrap items-center gap-2 bg-elevated py-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Score this activity</p>
        {saved ? <span className="text-sm font-semibold text-gold">Saved</span> : null}
        <button
          type="button"
          className="tw-tap ml-auto min-h-11 rounded-full bg-surface px-3 text-sm font-semibold"
          onClick={() => downloadText(`scores-P${period}.csv`, activityCsv(file, activityId, kids, skills), "text/csv")}
        >
          CSV
        </button>
      </div>
      {acts.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {acts.map((row) => (
            <button
              key={row.activity.id}
              type="button"
              onClick={() => setPick(row.activity.id)}
              className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", activityId === row.activity.id ? "bg-fg text-bg" : "bg-surface text-muted")}
            >
              {row.activity.name}
            </button>
          ))}
        </div>
      ) : found ? (
        <p className="text-sm font-semibold">{found.activity.name}</p>
      ) : (
        <p className="text-sm text-muted">No parked activity yet. Pick the skills, then score this hour.</p>
      )}
      <div data-skill-picker>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Skills tracked · up to {SCORE_SKILL_MAX}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {choices.map((s) => {
            const on = skills.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSkill(s.id)}
                className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", on ? "bg-accent text-accent-fg" : "bg-surface text-muted")}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <form
          className="mt-1 flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!custom.trim() || !gate()) return;
            const made = addCustomSkill(file, custom);
            setCustom("");
            commit(setTrackedSkills(made.file, projectId, activityId, [...skills, made.id].slice(0, SCORE_SKILL_MAX)));
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add a skill"
            aria-label="Add a skill"
            className="min-h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-sm outline-none"
          />
          <button type="submit" className="tw-tap min-h-11 rounded-xl bg-surface px-3 text-sm font-semibold">
            Add
          </button>
        </form>
      </div>
      <div className="flex flex-wrap gap-1" aria-label="Scoring">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => commit(setScoreMode(file, projectId, activityId, m.id))}
            className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", mode === m.id ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {m.label}
          </button>
        ))}
      </div>
      {!skills.length ? <p className="text-sm text-muted">Pick at least one skill.</p> : null}
      {skills.length && selected.length ? (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          {mode === "rubric"
            ? [1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="tw-tap min-h-11 min-w-11 rounded-full bg-surface text-sm font-bold"
                  onClick={() => {
                    let next = file;
                    for (const id of skills) next = setActivityAll(next, activityId, selected, id, n, { mode, projectId });
                    commit(next);
                  }}
                >
                  All {n}
                </button>
              ))
            : null}
          <button type="button" className="tw-tap min-h-11 rounded-full bg-surface px-3 text-sm font-semibold" onClick={() => commit(setActivityAbsent(file, activityId, selected, true))}>
            Absent
          </button>
        </div>
      ) : null}
      <div className="overflow-auto" data-score-grid>
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-subtle">
              <th className="px-1 py-1">
                <label className="flex min-h-11 min-w-11 items-center justify-center">
                  <input
                    type="checkbox"
                    className="size-6"
                    aria-label="Select all"
                    checked={kids.length > 0 && kids.every((s) => selected.includes(s.id))}
                    onChange={() => setPickedIds(kids.every((s) => selected.includes(s.id)) ? [] : kids.map((s) => s.id))}
                  />
                </label>
              </th>
              <th className="px-2 py-1">Alias</th>
              {skills.map((id) => (
                <th key={id} className="px-1 py-1">{skillLabel(file, id)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kids.map((s) => {
              const cell = book.cells?.[s.id];
              return (
                <tr key={s.id} className="border-t border-border/40">
                  <td className="px-1">
                    <label className="flex min-h-11 min-w-11 items-center justify-center">
                      <input
                        type="checkbox"
                        className="size-6"
                        aria-label={`Select ${s.first}`}
                        checked={selected.includes(s.id)}
                        onChange={() => setPickedIds((cur) => (cur.includes(s.id) ? cur.filter((id) => id !== s.id) : [...cur, s.id]))}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-1">
                    <p className="font-semibold">{s.first}</p>
                    {skills[0] ? <p className="text-[10px] text-subtle">{skillTrend(s, skills[0]).join(" ") || "new"}</p> : null}
                    <button type="button" className="tw-tap min-h-11 text-sm font-semibold text-muted" onClick={() => setNoteId(noteId === s.id ? null : s.id)}>
                      {cell?.note ? "Note saved" : "Note"}
                    </button>
                    {noteId === s.id ? (
                    <input
                      value={cell?.note ?? ""}
                      onChange={(e) => commit(setActivityNote(file, activityId, s.id, e.target.value))}
                      placeholder="One line"
                      aria-label={`Note for ${s.first}`}
                      className="mt-1 min-h-11 w-full rounded-lg bg-surface px-2 text-sm outline-none"
                    />
                    ) : null}
                  </td>
                  {skills.map((id) => {
                    const n = cell?.scores?.[id];
                    return (
                      <td key={id} className="px-1 py-1">
                        {cell?.absent ? (
                          <span className="inline-flex min-h-11 min-w-11 items-center justify-center font-semibold text-muted">A</span>
                        ) : mode === "points" ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={n ?? ""}
                            aria-label={`${s.first} ${skillLabel(file, id)}`}
                            onChange={(e) => commit(setActivityScore(file, activityId, s.id, id, Number(e.target.value || 0), { mode, projectId }))}
                            className="min-h-11 w-16 rounded-lg bg-surface px-2 font-mono text-sm outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            aria-label={`${s.first} ${skillLabel(file, id)}`}
                            onClick={() => cycle(s.id, id, n)}
                            className={cn(
                              "tw-tap inline-flex min-h-14 min-w-14 items-center justify-center rounded-xl text-2xl font-bold",
                              n ? "bg-accent text-accent-fg" : "bg-surface text-fg",
                              n === 4 && "tw-win",
                            )}
                          >
                            {mode === "done" ? (n ? "Done" : "—") : n || "—"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!kids.length ? <p className="px-2 py-3 text-sm text-muted">No one in this class yet.</p> : null}
      </div>
      <p className="text-xs text-subtle">1–4 updates the skill they already have. Points and Done stay on this activity. Blank is not a zero. CSV is aliases only.</p>
    </section>
  );
}
