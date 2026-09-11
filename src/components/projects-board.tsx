import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import {
  activitiesOf,
  addProject,
  assignCrewProject,
  crewProjectId,
  crewsForPeriod,
  IDEA_PROJECTS,
  jobCardOf,
  patchActivity,
  PROJECT_KINDS,
  projectsOf,
  prettyStage,
  putOnPeriod,
  pullFromPeriod,
  slotsOf,
  upsertProject,
  type ProjectKind,
  type ShopProject,
} from "@/lib/projects";
import { currentCycleOf } from "@/lib/roles";
import { CtrlSeg } from "@/components/ctrl";
import { PlanBook } from "@/components/plan-book";
import { cn } from "@/lib/utils";

type Pane = "plan" | "floor" | "options" | "job";

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
  const bells = shopBells(file);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [pane, setPane] = useState<Pane>("plan");
  const [kind, setKind] = useState<ProjectKind | "all">("all");
  const [title, setTitle] = useState("");
  const slots = slotsOf(file, period);
  const [focusId, setFocusId] = useState(slots[0]?.id ?? "");
  const list = projectsOf(file);
  const project = list.find((p) => p.id === focusId) ?? slots[0] ?? list[0];
  const cycle = currentCycleOf(file);
  const crews = crewsForPeriod(file, period);
  const job = jobCardOf(file, period);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }
  function put(id: string) {
    if (!gate()) return;
    onChange(putOnPeriod(file, period, id));
    setFocusId(id);
    setPane("plan");
  }
  function pull(id: string) {
    if (!gate()) return;
    onChange(pullFromPeriod(file, period, id));
  }
  function patch(p: ShopProject) {
    if (!gate()) return;
    onChange(upsertProject(file, p));
  }
  function pickCrew(crewKey: string, projectId: string) {
    if (!gate()) return;
    onChange(assignCrewProject(file, cycle, period, crewKey, projectId));
  }

  const options = useMemo(() => {
    const rows = list.filter((p) => (kind === "all" ? true : (p.kind || "build") === kind));
    const ideas = IDEA_PROJECTS.filter((p) => !rows.some((x) => x.id === p.id));
    return [...rows, ...ideas].filter((p) => (kind === "all" ? true : (p.kind || "build") === kind));
  }, [kind, list]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <header className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="min-w-0 flex-1 text-sm text-muted">
            {periodTitle(period, bells)} · plan the days, then park a unit on this period
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {bells.map((b) => (
            <button
              key={b.period}
              type="button"
              onClick={() => {
                setPeriod(b.period);
                const next = slotsOf(file, b.period)[0];
                if (next) setFocusId(next.id);
              }}
              className={cn("min-h-10 rounded-md px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              P{b.period}
              <span className="ml-1 text-[10px] font-medium opacity-70">G{b.grade}</span>
            </button>
          ))}
        </div>
        <CtrlSeg
          items={[
            { id: "plan", label: "Plan" },
            { id: "floor", label: "Floor" },
            { id: "job", label: "Write the job" },
            { id: "options", label: "Options" },
          ]}
          value={pane}
          onChange={(id) => setPane(id as Pane)}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {pane === "plan" && project ? (
          <PlanBook
            file={file}
            project={project}
            period={period}
            unlocked={unlocked}
            onNeedPin={onNeedPin}
            onChange={onChange}
          />
        ) : null}
        {pane === "floor" ? (
          <Floor
            file={file}
            period={period}
            cycle={cycle}
            slots={slots}
            crews={crews}
            focusId={project?.id}
            classJob={job}
            unlocked={unlocked}
            onFocus={(id) => {
              setFocusId(id);
              setPane("job");
            }}
            onPull={pull}
            onPickCrew={pickCrew}
            onAdd={() => setPane("options")}
          />
        ) : null}
        {pane === "options" ? (
          <Options
            options={options}
            kind={kind}
            onKind={setKind}
            onFloor={(id) => put(id)}
            slots={slots}
            title={title}
            onTitle={setTitle}
            unlocked={unlocked}
            onBlank={() => {
              if (!gate() || !title.trim()) return;
              const next = addProject(file, title.trim(), []);
              const created = projectsOf(next).at(-1);
              const placed = created ? putOnPeriod(next, period, created.id) : next;
              onChange(placed);
              if (created) setFocusId(created.id);
              setTitle("");
              setPane("plan");
            }}
          />
        ) : null}
        {pane === "job" && project ? (
          <JobWrite
            project={project}
            unlocked={unlocked}
            onPatch={patch}
            onActivity={(id, partial) => gate() && onChange(patchActivity(file, project.id, id, partial))}
          />
        ) : null}
      </div>
    </div>
  );
}

function Floor({
  file,
  period,
  cycle,
  slots,
  crews,
  focusId,
  classJob,
  unlocked,
  onFocus,
  onPull,
  onPickCrew,
  onAdd,
}: {
  file: EconomyFile;
  period: number;
  cycle: number;
  slots: ShopProject[];
  crews: { key: string; name: string }[];
  focusId?: string;
  classJob: ReturnType<typeof jobCardOf>;
  unlocked: boolean;
  onFocus: (id: string) => void;
  onPull: (id: string) => void;
  onPickCrew: (crewKey: string, projectId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid gap-3 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">On this period</p>
        <ul className="grid gap-2">
          {slots.map((p, i) => (
            <li key={p.id}>
              <article className={cn("tw-gadget p-3", p.id === focusId ? "ring-1 ring-accent" : "")}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-gold">Slot {i + 1}</span>
                  {i === 0 ? <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-bg">Class job</span> : null}
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-muted">{p.kind ?? "build"}</span>
                </div>
                <button type="button" onClick={() => onFocus(p.id)} className="mt-1 block w-full text-left">
                  <p className="font-display text-xl font-semibold tracking-tight">{p.title}</p>
                  {p.prompt ? <p className="mt-1 text-sm text-muted">{p.prompt}</p> : null}
                </button>
                {i === 0 && classJob.today ? <p className="mt-2 text-sm">Today · {classJob.today}</p> : null}
                {unlocked && slots.length > 1 ? (
                  <button type="button" onClick={() => onPull(p.id)} className="mt-2 text-xs font-semibold text-muted">
                    Take off this period
                  </button>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
        {unlocked ? (
          <button type="button" onClick={onAdd} className="tw-tap min-h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg">
            Add a project from options
          </button>
        ) : null}
      </section>
      <aside className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Crews pick a slot</p>
        {crews.length ? (
          <ul className="space-y-2">
            {crews.map((c) => {
              const pid = crewProjectId(file, cycle, period, c.key);
              return (
                <li key={c.key} className="tw-gadget p-2">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {slots.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onPickCrew(c.key, p.id)}
                        className={cn(
                          "min-h-10 rounded-md px-2 text-xs font-semibold",
                          pid === p.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                        )}
                      >
                        {i + 1} · {p.title}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No crews on this period yet. Seat them in Admin → Crews, then they pick a slot here — or the crew lead picks it.</p>
        )}
      </aside>
    </div>
  );
}

function Options({
  options,
  kind,
  onKind,
  onFloor,
  slots,
  title,
  onTitle,
  onBlank,
  unlocked,
}: {
  options: ShopProject[];
  kind: ProjectKind | "all";
  onKind: (k: ProjectKind | "all") => void;
  onFloor: (id: string) => void;
  slots: ShopProject[];
  title: string;
  onTitle: (v: string) => void;
  onBlank: () => void;
  unlocked: boolean;
}) {
  return (
    <div className="space-y-3 pb-4">
      <p className="text-sm text-muted">Pick a unit. It lands on the period you have selected — other periods keep theirs. More than one can sit on the same period.</p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onKind("all")}
          className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", kind === "all" ? "bg-fg text-bg" : "bg-elevated text-muted")}
        >
          All
        </button>
        {PROJECT_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => onKind(k.id)}
            className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", kind === k.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
          >
            {k.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((p) => {
          const on = slots.some((s) => s.id === p.id);
          return (
            <li key={p.id} className="tw-gadget flex flex-col p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gold">{p.kind ?? "build"}</p>
              <p className="font-display text-lg font-semibold">{p.title}</p>
              {p.prompt ? <p className="mt-1 flex-1 text-sm text-muted">{p.prompt}</p> : null}
              {p.constraints?.length ? <p className="mt-1 text-xs text-subtle">{p.constraints.join(". ")}</p> : null}
              <button
                type="button"
                disabled={!unlocked || on}
                onClick={() => onFloor(p.id)}
                className={cn("tw-tap mt-3 min-h-11 rounded-md text-sm font-semibold", on ? "bg-elevated text-muted" : "bg-accent text-accent-fg")}
              >
                {on ? "Already on this period" : "Put on this period"}
              </button>
            </li>
          );
        })}
      </ul>
      {unlocked ? (
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            onBlank();
          }}
        >
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Or start a blank title"
            className="min-h-11 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
          />
          <button type="submit" className="min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
            Start blank
          </button>
        </form>
      ) : null}
    </div>
  );
}

function JobWrite({
  project,
  unlocked,
  onPatch,
  onActivity,
}: {
  project: ShopProject;
  unlocked: boolean;
  onPatch: (p: ShopProject) => void;
  onActivity: (id: string, partial: { today?: string; done?: string; lookFor?: string; name?: string }) => void;
}) {
  const acts = activitiesOf(project);
  return (
    <div className="tw-gadget mx-auto max-w-3xl space-y-3 p-3 pb-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{prettyStage(acts[0]?.goal ?? "Idea")} · student-facing</p>
      <p className="text-sm text-muted">These lines hit the wall. How many days each activity holds is on Plan.</p>
      {unlocked ? (
        <input
          value={project.title}
          onChange={(e) => onPatch({ ...project, title: e.target.value })}
          className="w-full bg-transparent font-display text-2xl font-semibold outline-none"
        />
      ) : (
        <p className="font-display text-2xl font-semibold">{project.title}</p>
      )}
      {unlocked ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Question
          <textarea
            value={project.prompt ?? ""}
            onChange={(e) => onPatch({ ...project, prompt: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-md bg-elevated px-3 py-2 text-sm font-normal normal-case tracking-normal text-fg outline-none"
          />
        </label>
      ) : project.prompt ? (
        <p className="text-sm">{project.prompt}</p>
      ) : null}
      {unlocked ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
          Rules
          <input
            value={(project.constraints ?? []).join(". ")}
            onChange={(e) =>
              onPatch({
                ...project,
                constraints: e.target.value
                  .split(/[.;]+/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            className="mt-1 min-h-11 w-full rounded-md bg-elevated px-3 text-sm font-normal normal-case tracking-normal text-fg outline-none"
          />
        </label>
      ) : project.constraints?.length ? (
        <p className="text-sm">{project.constraints.join(". ")}</p>
      ) : null}
      <ol className="grid gap-2">
        {acts.map((a) => (
          <li key={a.id} className="rounded-md bg-elevated p-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">{a.name}</p>
            {unlocked ? (
              <div className="mt-1 grid gap-1">
                <input
                  value={a.today ?? ""}
                  onChange={(e) => onActivity(a.id, { today: e.target.value })}
                  placeholder="Today"
                  className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                />
                <input
                  value={a.done ?? ""}
                  onChange={(e) => onActivity(a.id, { done: e.target.value })}
                  placeholder="Done"
                  className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                />
                <input
                  value={a.lookFor ?? ""}
                  onChange={(e) => onActivity(a.id, { lookFor: e.target.value })}
                  placeholder="Look-for a 3"
                  className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                />
              </div>
            ) : a.today ? (
              <p className="mt-1 text-sm">{a.today}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
