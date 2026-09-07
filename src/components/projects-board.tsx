import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { STAGES } from "@/lib/store";
import {
  activitiesOf,
  activityLabel,
  addActivity,
  addProject,
  agendaFor,
  assignCrewProject,
  assignProjectCycles,
  calendarFocus,
  crewPace,
  crewProjectId,
  crewsForPeriod,
  currentPhaseOn,
  DEFAULT_STAGES,
  dropActivity,
  expectedPhase,
  goalPhaseOn,
  patchActivity,
  pedagogySkills,
  prettyStage,
  projectCycleRows,
  projectsOf,
  projectForGrade,
  setActiveProject,
  setCurrentPhase,
  setGoalPhase,
  setPlanActivity,
  skillName,
  TOP_SKILLS,
  upsertProject,
  type DaySlot,
  type ShopProject,
} from "@/lib/projects";
import { todayIso } from "@/lib/calendar";
import { currentCycleOf } from "@/lib/roles";
import { ProgressRing } from "@/components/progress-ring";
import { QuarterChip } from "@/components/quarter-chip";
import { cn } from "@/lib/utils";

const GRADES = [6, 7, 8] as const;
const SLOTS: DaySlot[] = ["D1", "D2", "D3", "D4"];

export function ProjectsBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
}) {
  const list = projectsOf(file);
  const [grade, setGrade] = useState<(typeof GRADES)[number]>(7);
  const bells = shopBells(file).filter((b) => b.grade === grade);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const current = projectForGrade(file, grade);
  const gradeList = list.filter((p) => p.grades.includes(grade));
  const [focusId, setFocusId] = useState(current.id);
  const project = gradeList.find((p) => p.id === focusId) ?? current;
  const [title, setTitle] = useState("");
  const [edit, setEdit] = useState<{ cycle: number; slot: DaySlot } | null>(null);
  const [more, setMore] = useState(false);
  const today = agendaFor(file, period);
  const cal = calendarFocus();
  const cycle = currentCycleOf(file);
  const peda = pedagogySkills(file);
  const pace = useMemo(() => crewPace(file, period), [file, period]);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }
  function patch(p: ShopProject) {
    if (!gate()) return;
    onChange(upsertProject(file, p));
  }

  const on = project.id === current.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Projects</h1>
        <QuarterChip />
        <div className="flex gap-1">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGrade(g);
                const nextP = shopBells(file).find((b) => b.grade === g)?.period;
                if (nextP) setPeriod(nextP);
                setFocusId(projectForGrade(file, g).id);
              }}
              className={cn("min-h-9 rounded-md px-3 text-sm font-semibold", grade === g ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              G{g}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {bells.map((b) => (
            <button
              key={b.period}
              type="button"
              onClick={() => setPeriod(b.period)}
              className={cn("min-h-9 rounded-md px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              P{b.period}
            </button>
          ))}
        </div>
      </header>

      <section className="tw-gadget grid shrink-0 gap-3 p-3 sm:grid-cols-[minmax(0,1.2fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Today · P{period}</p>
          <p className="font-display text-2xl font-semibold leading-none tracking-tight">{today.title}</p>
          <p className="mt-1 text-lg font-semibold text-accent">{today.activityName}</p>
          <p className="text-sm text-muted">
            Cycle {cal.cycle} · Day {cal.slot.slice(1)} · {skillName(today.skillId)}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3">
          {pace.map((c, i) => {
            const pct = Math.min(100, Math.round(((c.lag === 0 ? 1 : Math.max(0.2, 1 - c.lag / 4)) * 100)));
            return (
              <ProgressRing
                key={c.key}
                pct={Math.max(12, pct)}
                label={prettyStage(c.current).slice(0, 4)}
                sub={c.name}
                tone={i === 0 ? "gold" : c.lag > 0 ? "warn" : "gain"}
              />
            );
          })}
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-12">
        <div className="min-h-0 overflow-auto lg:col-span-8">
          <section className="tw-gadget p-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              {unlocked ? (
                <input
                  value={project.title}
                  onChange={(e) => patch({ ...project, title: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent font-display text-xl font-semibold outline-none"
                />
              ) : (
                <p className="font-display text-xl font-semibold">{project.title}</p>
              )}
              <button
                type="button"
                onClick={() => gate() && onChange(setActiveProject(file, grade, project.id))}
                className={cn("min-h-9 rounded-md px-3 text-xs font-semibold", on ? "bg-gold text-bg" : "bg-elevated text-muted")}
              >
                {on ? "Active" : "Make active"}
              </button>
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-subtle">Activities · one project grade</p>
            <ol className="mt-1 grid gap-1 sm:grid-cols-2">
              {activitiesOf(project).map((a, i) => (
                <li key={a.id} className="flex items-center gap-1 rounded-md bg-elevated px-2">
                  <span className="tw-readout w-4 text-xs">{i + 1}</span>
                  {unlocked ? (
                    <input
                      value={a.name}
                      onChange={(e) => onChange(patchActivity(file, project.id, a.id, { name: e.target.value }))}
                      className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                  ) : (
                    <span className="min-w-0 flex-1 text-sm font-semibold">{a.name}</span>
                  )}
                  <select
                    value={a.skillId}
                    disabled={!unlocked}
                    onChange={(e) => gate() && onChange(patchActivity(file, project.id, a.id, { skillId: e.target.value }))}
                    className="min-h-9 max-w-[7rem] bg-transparent text-xs"
                  >
                    {peda.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
                      </option>
                    ))}
                  </select>
                  {unlocked && activitiesOf(project).length > 1 ? (
                    <button type="button" onClick={() => onChange(dropActivity(file, project.id, a.id))} className="px-1 text-muted">
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
            {unlocked ? (
              <input
                placeholder="Add activity · Enter"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = e.currentTarget.value.trim();
                  if (!v) return;
                  onChange(addActivity(file, project.id, v));
                  e.currentTarget.value = "";
                }}
                className="mt-1 min-h-9 w-full rounded-md bg-elevated px-2 text-sm outline-none"
              />
            ) : null}

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-subtle">Plan book · Cycle {cycle} now</p>
            <div className="mt-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-subtle">
                  <tr>
                    <th className="py-1 font-medium">Cycle</th>
                    {SLOTS.map((s) => (
                      <th key={s} className="px-1 py-1 font-medium">
                        Day {s.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectCycleRows(project).map((c) => (
                    <tr key={c} className="border-t border-border">
                      <td className="py-1 font-semibold">
                        {c}
                        {c === cal.cycle ? <span className="ml-1 text-[10px] text-accent">now</span> : null}
                      </td>
                      {SLOTS.map((slot) => {
                        const st = project.stages.find((x) => x.cycle === c && x.slot === slot) ?? DEFAULT_STAGES.find((x) => x.slot === slot)!;
                        const hot = on && cal.cycle === c && cal.slot === slot;
                        const open = edit?.cycle === c && edit.slot === slot;
                        return (
                          <td key={slot} className="px-1 py-1 align-top">
                            <button
                              type="button"
                              onClick={() => {
                                if (!gate()) return;
                                setEdit(open ? null : { cycle: c, slot });
                              }}
                              className={cn(
                                "w-full rounded-md px-2 py-2 text-left text-xs font-semibold",
                                hot ? "bg-accent text-accent-fg" : open ? "bg-gold text-bg" : "bg-elevated text-muted",
                              )}
                            >
                              {activityLabel(project, st)}
                              <span className="mt-0.5 block text-[10px] font-normal opacity-80">{skillName(st.skillId)}</span>
                            </button>
                            {open ? (
                              <div className="mt-1 space-y-1 rounded-md bg-surface p-1">
                                {activitiesOf(project).map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => {
                                      onChange(setPlanActivity(file, project.id, c, slot, a.id));
                                      setEdit(null);
                                    }}
                                    className={cn("block w-full rounded px-1 py-1 text-left text-[10px] font-semibold", a.id === st.activityId ? "bg-accent text-accent-fg" : "text-muted")}
                                  >
                                    {a.name}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="flex min-h-0 flex-col gap-2 overflow-auto lg:col-span-4">
          <section className="tw-gadget p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">This grade</p>
            <div className="mt-2 flex flex-col gap-1">
              {(gradeList.length ? gradeList : list).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFocusId(p.id)}
                  className={cn("min-h-10 rounded-md px-3 text-left text-sm font-semibold", p.id === project.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                >
                  {p.title}
                  {p.id === current.id ? <span className="ml-2 text-[10px] uppercase tracking-wide">live</span> : null}
                </button>
              ))}
            </div>
            {unlocked ? (
              <form
                className="mt-2 flex gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!title.trim()) return;
                  const next = addProject(file, title.trim(), [grade]);
                  const created = projectsOf(next).at(-1);
                  onChange(created ? setActiveProject(next, grade, created.id) : next);
                  if (created) setFocusId(created.id);
                  setTitle("");
                }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="New project"
                  className="min-h-10 min-w-0 flex-1 rounded-md bg-elevated px-2 text-sm outline-none"
                />
                <button type="submit" className="min-h-10 rounded-md bg-gold px-3 text-xs font-semibold text-bg">
                  Add
                </button>
              </form>
            ) : null}
          </section>

          <section className="tw-gadget p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Crews · cycle {cycle}</p>
            <ul className="mt-2 space-y-1">
              {crewsForPeriod(file, period).map((crew) => {
                const pid = crewProjectId(file, cycle, period, crew.key);
                return (
                  <li key={crew.key} className="flex items-center justify-between gap-2 rounded-md bg-elevated px-2">
                    <span className="min-w-0 truncate text-sm font-semibold">{crew.name}</span>
                    <select
                      value={pid}
                      disabled={!unlocked}
                      onChange={(e) => gate() && onChange(assignCrewProject(file, cycle, period, crew.key, e.target.value))}
                      className="min-h-10 max-w-[9rem] bg-transparent text-xs"
                    >
                      {gradeList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
            {unlocked ? (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-subtle">Crew phase</p>
                {crewsForPeriod(file, period).map((c) => {
                  const cur = currentPhaseOn(file, todayIso(), period, c.key);
                  const goal = goalPhaseOn(file, period);
                  const behind = STAGES.indexOf(cur as (typeof STAGES)[number]) < STAGES.indexOf(goal as (typeof STAGES)[number]);
                  return (
                    <div key={c.key} className="mt-1">
                      <p className={cn("text-xs font-semibold", behind ? "text-loss" : "")}>
                        {c.name}
                        {behind ? " · behind" : ""}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {STAGES.slice(0, 6).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => onChange(setCurrentPhase(file, todayIso(), period, c.key, g))}
                            className={cn("min-h-8 rounded-full px-2 text-[10px] font-semibold", g === cur ? "bg-gold text-bg" : "bg-elevated text-muted")}
                          >
                            {prettyStage(g)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="tw-gadget p-3">
            <button type="button" onClick={() => setMore((v) => !v)} className="text-[11px] font-bold uppercase tracking-wider text-subtle">
              {more ? "Hide setup" : "Setup · cycles, skills, dates"}
            </button>
            {more ? (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                    const rows = projectCycleRows(project);
                    const onC = rows.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => gate() && onChange(assignProjectCycles(file, project.id, n, (project.cycleLen === 1 ? 1 : 2) as 1 | 2))}
                        className={cn("size-9 rounded-md text-sm font-semibold", onC ? "bg-accent text-accent-fg" : n === cal.cycle ? "bg-elevated ring-1 ring-fg" : "bg-elevated text-muted")}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => gate() && onChange(assignProjectCycles(file, project.id, project.cycleStart ?? 1, project.cycleLen === 1 ? 2 : 1))}
                    className="min-h-9 rounded-full bg-elevated px-3 text-xs font-semibold"
                  >
                    {project.cycleLen === 1 ? "1 cycle" : "2 cycles"}
                  </button>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {peda.map((sk) => {
                    const hit = project.skills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        title={sk.does || sk.why}
                        onClick={() => {
                          if (!gate()) return;
                          let skills = hit ? project.skills.filter((id) => id !== sk.id) : [...project.skills, sk.id];
                          if (!hit && skills.length > TOP_SKILLS) skills = skills.slice(-TOP_SKILLS);
                          patch({ ...project, skills });
                        }}
                        className={cn("min-h-8 rounded-full px-2 text-[11px] font-semibold uppercase", hit ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                      >
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
                <label className="block text-xs text-muted">
                  Start
                  <input type="date" value={project.start ?? ""} disabled={!unlocked} onChange={(e) => patch({ ...project, start: e.target.value })} className="mt-0.5 min-h-9 w-full rounded-md bg-elevated px-2 text-sm text-fg" />
                </label>
                <label className="block text-xs text-muted">
                  End
                  <input type="date" value={project.end ?? ""} disabled={!unlocked} onChange={(e) => patch({ ...project, end: e.target.value })} className="mt-0.5 min-h-9 w-full rounded-md bg-elevated px-2 text-sm text-fg" />
                </label>
                {project.start && project.end ? <p className="text-xs text-muted">Expect {prettyStage(expectedPhase(project))}</p> : null}
                <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Constraints</p>
                <ul className="flex flex-wrap gap-1">
                  {(project.constraints ?? []).map((c, i) => (
                    <li key={`${c}-${i}`}>
                      <button type="button" disabled={!unlocked} onClick={() => patch({ ...project, constraints: (project.constraints ?? []).filter((_, j) => j !== i) })} className="rounded-full bg-elevated px-2 py-1 text-xs">
                        {c} ×
                      </button>
                    </li>
                  ))}
                </ul>
                {unlocked ? (
                  <input
                    placeholder="Constraint · Enter"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const v = e.currentTarget.value.trim();
                      if (!v) return;
                      patch({ ...project, constraints: [...(project.constraints ?? []), v].slice(0, 8) });
                      e.currentTarget.value = "";
                    }}
                    className="min-h-9 w-full rounded-md bg-elevated px-2 text-sm outline-none"
                  />
                ) : null}
                {unlocked ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Class goal today</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {STAGES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => onChange(setGoalPhase(file, todayIso(), period, g))}
                          className={cn("min-h-8 rounded-full px-2 text-[10px] font-semibold", g === goalPhaseOn(file, period) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                        >
                          {prettyStage(g)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
