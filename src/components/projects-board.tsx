import { useState } from "react";
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
  crewProjectId,
  crewsForPeriod,
  currentPhaseOn,
  DEFAULT_STAGES,
  dropActivity,
  expectedPhase,
  goalPhaseOn,
  patchActivity,
  pedagogySkills,
  placeProject,
  prettyStage,
  projectCycleRows,
  PROJECT_KINDS,
  projectsOf,
  projectForGrade,
  setActiveProject,
  setCurrentPhase,
  setPlanActivity,
  skillName,
  TOP_SKILLS,
  unfileProject,
  upsertProject,
  type DaySlot,
  type ProjectKind,
  type ShopProject,
} from "@/lib/projects";
import { todayIso, quarterNow } from "@/lib/calendar";
import { currentCycleOf } from "@/lib/roles";
import { copyQuarterCurriculum } from "@/lib/year-plan";
import { STEM_LABEL, STEM_LETTERS, STEM_WHY, stemOf } from "@/lib/stems";
import { cn } from "@/lib/utils";

const GRADES = [6, 7, 8] as const;
const SLOTS: DaySlot[] = ["D1", "D2", "D3", "D4"];
const KIND: Record<ProjectKind, string> = Object.fromEntries(PROJECT_KINDS.map((k) => [k.id, k.label])) as Record<ProjectKind, string>;

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
  const [focusId, setFocusId] = useState(current.id);
  const project = list.find((p) => p.id === focusId) ?? current;
  const [title, setTitle] = useState("");
  const [edit, setEdit] = useState<{ cycle: number; slot: DaySlot } | null>(null);
  const today = agendaFor(file, period);
  const cal = calendarFocus();
  const cycle = currentCycleOf(file);
  const peda = pedagogySkills(file);
  const library = list.filter((p) => !p.grades.length);
  const gradeList = list.filter((p) => p.grades.includes(grade));
  const qn = quarterNow(todayIso()).n;

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }
  function patch(p: ShopProject) {
    if (!gate()) return;
    onChange(upsertProject(file, p));
  }
  function dropOn(id: string, dest: number | null) {
    if (!gate()) return;
    onChange(placeProject(file, id, dest));
    setFocusId(id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted">
          P{period} · {today.title} · {today.activityName}
          {today.project.prompt ? <span className="text-gold"> · {today.project.prompt}</span> : null}
        </p>
        <div className="ml-auto flex flex-wrap gap-1">
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
          {unlocked && qn < 4 ? (
            <button
              type="button"
              onClick={() => onChange(copyQuarterCurriculum(file, qn, (qn + 1) as 2 | 3 | 4))}
              className="min-h-9 rounded-md bg-gold px-3 text-xs font-semibold text-bg"
            >
              Copy Q{qn} → Q{qn + 1}
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-auto">
          <Bucket
            label="Library"
            hint="Not assigned to a grade yet"
            unlocked={unlocked}
            onDrop={(id) => dropOn(id, null)}
          >
            {library.map((p) => (
              <TitleChip key={p.id} p={p} on={p.id === project.id} live={false} unlocked={unlocked} onPick={() => setFocusId(p.id)} />
            ))}
          </Bucket>
          {GRADES.map((g) => {
            const liveId = projectForGrade(file, g).id;
            return (
              <Bucket
                key={g}
                label={`Grade ${g}`}
                hint={g === grade ? "This board" : "Drop to file here"}
                hot={g === grade}
                unlocked={unlocked}
                onDrop={(id) => dropOn(id, g)}
                onSelect={() => {
                  setGrade(g);
                  const nextP = shopBells(file).find((b) => b.grade === g)?.period;
                  if (nextP) setPeriod(nextP);
                }}
              >
                {list
                  .filter((p) => p.grades.includes(g))
                  .map((p) => (
                    <TitleChip
                      key={p.id}
                      p={p}
                      on={p.id === project.id}
                      live={p.id === liveId}
                      unlocked={unlocked}
                      onPick={() => {
                        setGrade(g);
                        setFocusId(p.id);
                      }}
                      onUnfile={() => gate() && onChange(unfileProject(file, p.id, g))}
                    />
                  ))}
              </Bucket>
            );
          })}
          {unlocked ? (
            <form
              className="flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                const next = addProject(file, title.trim(), []);
                const created = projectsOf(next).at(-1);
                onChange(next);
                if (created) setFocusId(created.id);
                setTitle("");
              }}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New title"
                className="min-h-10 min-w-0 flex-1 rounded-md bg-elevated px-2 text-sm outline-none"
              />
              <button type="submit" className="min-h-10 rounded-md bg-gold px-3 text-xs font-semibold text-bg">
                Add
              </button>
            </form>
          ) : null}
        </aside>

        <section className="min-h-0 overflow-auto">
          <div className="tw-gadget space-y-3 p-3">
            {unlocked ? (
              <input
                value={project.title}
                onChange={(e) => patch({ ...project, title: e.target.value })}
                className="w-full bg-transparent font-display text-2xl font-semibold outline-none"
              />
            ) : (
              <p className="font-display text-2xl font-semibold">{project.title}</p>
            )}
            {unlocked ? (
              <textarea
                value={project.prompt ?? ""}
                onChange={(e) => patch({ ...project, prompt: e.target.value })}
                placeholder="Driving question — How can a small force move a bigger load?"
                rows={2}
                className="w-full rounded-md bg-elevated px-3 py-2 text-sm outline-none"
              />
            ) : project.prompt ? (
              <p className="text-sm text-muted">{project.prompt}</p>
            ) : null}
            {unlocked ? (
              <input
                value={project.stemLine ?? ""}
                onChange={(e) => patch({ ...project, stemLine: e.target.value })}
                placeholder="One STEM sentence on the wall — not four capital words"
                className="w-full rounded-md bg-elevated px-3 py-2 text-sm outline-none"
              />
            ) : project.stemLine ? (
              <p className="text-sm text-muted">{project.stemLine}</p>
            ) : null}
            {unlocked ? (
              <input
                value={(project.constraints ?? []).join(". ")}
                onChange={(e) =>
                  patch({
                    ...project,
                    constraints: e.target.value
                      .split(/[.;]+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Rules — One tool at a time. Goggles on."
                className="w-full rounded-md bg-elevated px-3 py-2 text-sm outline-none"
              />
            ) : project.constraints?.length ? (
              <p className="text-sm text-muted">{project.constraints.join(". ")}</p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {STEM_LETTERS.map((L) => {
                const on = (project.stem ?? []).includes(L);
                return (
                  <button
                    key={L}
                    type="button"
                    disabled={!unlocked}
                    title={`${STEM_LABEL[L]} — ${STEM_WHY[L]}`}
                    onClick={() => {
                      const cur = new Set(project.stem ?? []);
                      if (cur.has(L)) cur.delete(L);
                      else cur.add(L);
                      patch({ ...project, stem: STEM_LETTERS.filter((x) => cur.has(x)) });
                    }}
                    className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", on ? "bg-gold text-bg" : "bg-elevated text-muted")}
                  >
                    {L} · {STEM_LABEL[L]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-subtle">STEM letters tag the unit. The wall shows one sentence, not the four words. Skills stay 1–4.</p>
            <p className="text-sm text-muted">Save is automatic. Assign to a grade on the left, or to a crew below.</p>

            <div className="flex flex-wrap gap-1">
              {PROJECT_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => patch({ ...project, kind: k.id })}
                  className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", (project.kind || "build") === k.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {GRADES.map((g) => {
                const hit = project.grades.includes(g);
                const live = projectForGrade(file, g).id === project.id;
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      if (!gate()) return;
                      onChange(hit ? unfileProject(file, project.id, g) : placeProject(file, project.id, g));
                    }}
                    className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", hit ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                  >
                    G{g}
                    {live ? " · live" : ""}
                  </button>
                );
              })}
              {GRADES.map((g) => (
                <button
                  key={`live-${g}`}
                  type="button"
                  disabled={!unlocked || !project.grades.includes(g)}
                  onClick={() => gate() && onChange(setActiveProject(file, g, project.id))}
                  className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", projectForGrade(file, g).id === project.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
                >
                  Assign G{g}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Skills this project watches</p>
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

            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Activities · average into one project grade · 1–4 is the expected Watch mark</p>
            <ol className="grid gap-1 sm:grid-cols-2">
              {activitiesOf(project).map((a, i) => (
                <li key={a.id} className="rounded-md bg-elevated px-2 py-2">
                  <div className="flex items-center gap-1">
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
                  <select
                    value={a.expect ?? 3}
                    disabled={!unlocked}
                    title={stemOf(a.skillId, a.expect ?? 3)}
                    onChange={(e) =>
                      gate() && onChange(patchActivity(file, project.id, a.id, { expect: Number(e.target.value) as 1 | 2 | 3 | 4 }))
                    }
                    className="min-h-9 w-10 bg-transparent text-xs font-mono"
                  >
                    {([1, 2, 3, 4] as const).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {unlocked && activitiesOf(project).length > 1 ? (
                    <button type="button" onClick={() => onChange(dropActivity(file, project.id, a.id))} className="px-1 text-muted">
                      ×
                    </button>
                  ) : null}
                  </div>
                  {unlocked ? (
                    <div className="mt-1 grid gap-1">
                      <input
                        value={a.today ?? ""}
                        onChange={(e) => onChange(patchActivity(file, project.id, a.id, { today: e.target.value }))}
                        placeholder="Today — what to build"
                        className="min-h-8 w-full rounded bg-surface px-2 text-xs outline-none"
                      />
                      <input
                        value={a.done ?? ""}
                        onChange={(e) => onChange(patchActivity(file, project.id, a.id, { done: e.target.value }))}
                        placeholder="Done — how you know"
                        className="min-h-8 w-full rounded bg-surface px-2 text-xs outline-none"
                      />
                      <input
                        value={a.lookFor ?? ""}
                        onChange={(e) => onChange(patchActivity(file, project.id, a.id, { lookFor: e.target.value }))}
                        placeholder="Look-for — what a 3 looks like"
                        className="min-h-8 w-full rounded bg-surface px-2 text-xs outline-none"
                      />
                    </div>
                  ) : a.today ? (
                    <p className="mt-1 text-xs text-muted">{a.today}</p>
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
                className="min-h-9 w-full rounded-md bg-elevated px-2 text-sm outline-none"
              />
            ) : null}

            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Plan book · Cycle {cycle} now</p>
            <div className="overflow-auto">
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
                        const open = edit?.cycle === c && edit.slot === slot;
                        return (
                          <td key={slot} className="px-1 py-1 align-top">
                            <button
                              type="button"
                              onClick={() => {
                                if (!gate()) return;
                                setEdit(open ? null : { cycle: c, slot });
                              }}
                              className={cn("w-full rounded-md px-2 py-2 text-left text-xs font-semibold", open ? "bg-gold text-bg" : "bg-elevated text-muted")}
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

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-muted">
                Start
                <input type="date" value={project.start ?? ""} disabled={!unlocked} onChange={(e) => patch({ ...project, start: e.target.value })} className="mt-0.5 min-h-9 w-full rounded-md bg-elevated px-2 text-sm text-fg" />
              </label>
              <label className="block text-xs text-muted">
                End
                <input type="date" value={project.end ?? ""} disabled={!unlocked} onChange={(e) => patch({ ...project, end: e.target.value })} className="mt-0.5 min-h-9 w-full rounded-md bg-elevated px-2 text-sm text-fg" />
              </label>
            </div>
            {project.start && project.end ? <p className="text-xs text-muted">Expect {prettyStage(expectedPhase(project))}</p> : null}

            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Constraints</p>
            <ul className="flex flex-wrap gap-1">
              {(project.constraints ?? []).map((c, i) => (
                <li key={i} className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-1 text-xs">
                  {c}
                  {unlocked ? (
                    <button type="button" onClick={() => patch({ ...project, constraints: (project.constraints ?? []).filter((_, j) => j !== i) })}>
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {unlocked ? (
              <input
                placeholder="Add constraint · Enter"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = e.currentTarget.value.trim();
                  if (!v) return;
                  patch({ ...project, constraints: [...(project.constraints ?? []), v] });
                  e.currentTarget.value = "";
                }}
                className="min-h-9 w-full rounded-md bg-elevated px-2 text-sm outline-none"
              />
            ) : null}

            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Assign crews · cycle {cycle} · P{period}</p>
            <ul className="space-y-1">
              {crewsForPeriod(file, period).map((crew) => {
                const pid = crewProjectId(file, cycle, period, crew.key);
                return (
                  <li key={crew.key} className="flex items-center justify-between gap-2 rounded-md bg-elevated px-2">
                    <span className="min-w-0 truncate text-sm font-semibold">{crew.name}</span>
                    <select
                      value={pid}
                      disabled={!unlocked}
                      onChange={(e) => gate() && onChange(assignCrewProject(file, cycle, period, crew.key, e.target.value))}
                      className="min-h-10 max-w-[10rem] bg-transparent text-xs"
                    >
                      {(gradeList.length ? gradeList : list).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
            {unlocked
              ? crewsForPeriod(file, period).map((c) => {
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
                })
              : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Bucket({
  label,
  hint,
  hot,
  unlocked,
  onDrop,
  onSelect,
  children,
}: {
  label: string;
  hint: string;
  hot?: boolean;
  unlocked: boolean;
  onDrop: (id: string) => void;
  onSelect?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      onDragOver={(e) => {
        if (!unlocked) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        if (!unlocked) return;
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={cn("tw-gadget p-2", hot ? "ring-1 ring-accent" : "")}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{label}</p>
        <p className="text-[10px] text-muted">{hint}</p>
      </button>
      <div className="mt-1 flex flex-col gap-1">{children}</div>
    </section>
  );
}

function TitleChip({
  p,
  on,
  live,
  unlocked,
  onPick,
  onUnfile,
}: {
  p: ShopProject;
  on: boolean;
  live: boolean;
  unlocked: boolean;
  onPick: () => void;
  onUnfile?: () => void;
}) {
  return (
    <div
      draggable={unlocked}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn("flex items-center gap-1 rounded-md", on ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
    >
      <button type="button" onClick={onPick} className="min-h-10 min-w-0 flex-1 truncate px-2 text-left text-sm font-semibold">
        {p.title}
        {live ? <span className="ml-1 text-[10px] uppercase">live</span> : null}
        {p.kind && p.kind !== "build" ? <span className="ml-1 text-[10px] font-normal opacity-80">{KIND[p.kind]}</span> : null}
        {p.stem?.length ? <span className="ml-1 font-mono text-[10px] opacity-80">{p.stem.join("")}</span> : null}
      </button>
      {onUnfile && unlocked ? (
        <button type="button" onClick={onUnfile} className="px-2 text-xs" title="Remove from this grade">
          ×
        </button>
      ) : null}
    </div>
  );
}
