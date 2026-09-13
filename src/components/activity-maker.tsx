import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import {
  createActivityPlan,
  gradeOfPeriod,
  projectsOf,
  type ActivityPlanKind,
} from "@/lib/projects";
import { formatSchoolDate, isSchoolDay, nextOpenDay, todayIso, weekOn } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const BELONG: { id: ActivityPlanKind; label: string; hint: string }[] = [
  { id: "project", label: "Part of a project", hint: "A unit that lasts more than one day" },
  { id: "solo", label: "Independent", hint: "Each student, this class" },
  { id: "sub", label: "Sub work", hint: "Quiet work. No machines." },
  { id: "contest", label: "Contest", hint: "A challenge with a winner" },
  { id: "train", label: "Training", hint: "New tool or safety" },
];

const STEPS = [
  { id: "ask", label: "Ask", goal: "IDEA STAGE", skillId: "draw", hint: "Name the problem" },
  { id: "sketch", label: "Sketch", goal: "DESIGN STAGE", skillId: "draw", hint: "Draw the idea" },
  { id: "build", label: "Build", goal: "MODELING STAGE", skillId: "model", hint: "Make and try it" },
  { id: "test", label: "Test", goal: "MODELING STAGE", skillId: "measure", hint: "Did the move work?" },
  { id: "share", label: "Share", goal: "PRESENTATION PREP", skillId: "present", hint: "Show the work" },
  { id: "safety", label: "Safety", goal: "TRAINING", skillId: "safety", hint: "PPE or a new tool" },
] as const;

const SKILLS = [
  { id: "safety", label: "Safety" },
  { id: "draw", label: "Draw" },
  { id: "model", label: "Model" },
  { id: "measure", label: "Measure" },
  { id: "tools", label: "Tools" },
  { id: "present", label: "Share" },
];

const PROVE = [
  { id: "skill", label: "Skill" },
  { id: "done", label: "Deliverable" },
  { id: "both", label: "Both" },
] as const;

function keepSpace(e: { stopPropagation: () => void; nativeEvent?: { stopImmediatePropagation?: () => void } }) {
  e.stopPropagation();
  e.nativeEvent?.stopImmediatePropagation?.();
}

export function ActivityMaker({
  file,
  period,
  unlocked,
  onNeedPin,
  onChange,
  onMade,
}: {
  file: EconomyFile;
  period: number;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onMade?: (projectId: string) => void;
}) {
  const today = todayIso();
  const start = nextOpenDay(today);
  const week = weekOn(start);
  const days = (week?.days ?? [start]).filter((d) => isSchoolDay(d));
  const grade = gradeOfPeriod(file, period);
  const existing = projectsOf(file);
  const [belong, setBelong] = useState<ActivityPlanKind>("project");
  const [stepId, setStepId] = useState<(typeof STEPS)[number]["id"]>("ask");
  const step = STEPS.find((s) => s.id === stepId) ?? STEPS[0];
  const [name, setName] = useState("");
  const [ask, setAsk] = useState("");
  const [doit, setDoit] = useState("");
  const [done, setDone] = useState("");
  const [skillId, setSkillId] = useState<string>(step.skillId);
  const [goggles, setGoggles] = useState(false);
  const [grades, setGrades] = useState<number[]>([grade]);
  const [picked, setPicked] = useState<string[]>([start]);
  const [prove, setProve] = useState<(typeof PROVE)[number]["id"]>("both");
  const [projectId, setProjectId] = useState("");

  function pickStep(id: (typeof STEPS)[number]["id"]) {
    const next = STEPS.find((s) => s.id === id) ?? STEPS[0];
    setStepId(id);
    setSkillId(next.skillId);
    setGoggles(id === "build" || id === "test" || id === "safety");
  }

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function toggleDay(d: string) {
    setPicked((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
  }

  function toggleGrade(g: number) {
    setGrades((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  const ready = Boolean(name.trim() || ask.trim() || doit.trim());

  function make() {
    if (!gate()) return;
    if (!ready) return;
    const dates = picked.length ? picked : [start];
    const made = createActivityPlan(file, {
      name: name.trim() || doit.trim() || ask.trim() || step.label,
      belong,
      period,
      grades: grades.length ? grades : [grade],
      dates,
      prove,
      ask,
      do: doit,
      done,
      skillId: belong === "sub" ? "care" : skillId,
      goal: belong === "sub" ? "PRODUCTIVITY" : step.goal,
      rules: goggles ? ["Goggles on"] : [],
      projectId: belong === "project" ? projectId || undefined : undefined,
    });
    onChange(made.file);
    onMade?.(made.projectId);
    setName("");
    setAsk("");
    setDoit("");
    setDone("");
  }

  return (
    <section className="tw-gadget space-y-3 p-3" data-activity-maker onKeyDown={keepSpace}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold">New activity</p>
          <p className="mt-0.5 text-sm text-muted">Ask the problem. Name the move. Park the days.</p>
        </div>
        <button
          type="button"
          onClick={make}
          disabled={!ready}
          className="tw-tap min-h-10 rounded-full bg-gold px-4 text-sm font-bold text-bg disabled:opacity-40"
        >
          Park on plan book
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">What is this?</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {BELONG.map((b) => (
            <button
              key={b.id}
              type="button"
              title={b.hint}
              onClick={() => setBelong(b.id)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", belong === b.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {b.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{BELONG.find((b) => b.id === belong)?.hint}</p>
      </div>
      {belong !== "sub" ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">This hour · design process</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.hint}
                onClick={() => pickStep(s.id)}
                className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", stepId === s.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{step.hint}</p>
        </div>
      ) : null}
      {belong === "project" && existing.length ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Add to a project</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setProjectId("")}
              className={cn("tw-tap min-h-10 rounded-xl px-3 text-xs font-semibold", !projectId ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              New project
            </button>
            {existing.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
                className={cn("tw-tap min-h-10 rounded-xl px-3 text-xs font-semibold", projectId === p.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Ask · the problem</span>
        <input
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          onKeyDown={keepSpace}
          placeholder="How can a small force move a bigger load?"
          className="tw-field"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Do this now</span>
        <input
          value={doit}
          onChange={(e) => setDoit(e.target.value)}
          onKeyDown={keepSpace}
          placeholder="Name the load. Sketch one machine that could move it."
          className="tw-field"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Done when</span>
        <input
          value={done}
          onChange={(e) => setDone(e.target.value)}
          onKeyDown={keepSpace}
          placeholder="Point to the load and the force on the sketch."
          className="tw-field"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Name on the plan book</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={keepSpace}
          placeholder={doit.trim() || ask.trim() || "Brainstorm levers"}
          className="tw-field"
        />
      </label>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Skill · what a 3 looks like</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSkillId(s.id)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", skillId === s.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Score</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {PROVE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProve(p.id)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", prove === p.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGoggles((v) => !v)}
            className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", goggles ? "bg-cleanup text-accent-fg" : "bg-elevated text-muted")}
          >
            Goggles {goggles ? "on" : "off"}
          </button>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">
          Grade · default G{grade} from P{period}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {[6, 7, 8].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGrade(g)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", grades.includes(g) ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              G{g}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Days this activity runs</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-sm font-semibold", picked.includes(d) ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {formatSchoolDate(d)}
            </button>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
