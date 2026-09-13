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
  { id: "solo", label: "Independent", hint: "One job, this class" },
  { id: "sub", label: "Sub work", hint: "Quiet work. No machines." },
  { id: "contest", label: "Contest", hint: "A challenge with a winner" },
  { id: "train", label: "Training", hint: "New tool or safety" },
];

const PROVE = [
  { id: "skill", label: "Skill" },
  { id: "done", label: "Deliverable" },
  { id: "both", label: "Both" },
] as const;

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
  const [name, setName] = useState("");
  const [ask, setAsk] = useState("");
  const [grades, setGrades] = useState<number[]>([grade]);
  const [picked, setPicked] = useState<string[]>([start]);
  const [prove, setProve] = useState<(typeof PROVE)[number]["id"]>("both");
  const [projectId, setProjectId] = useState("");

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

  function make() {
    if (!gate()) return;
    if (!name.trim()) return;
    const dates = picked.length ? picked : [start];
    const made = createActivityPlan(file, {
      name,
      belong,
      period,
      grades: grades.length ? grades : [grade],
      dates,
      prove,
      ask,
      projectId: belong === "project" ? projectId || undefined : undefined,
    });
    onChange(made.file);
    onMade?.(made.projectId);
    setName("");
    setAsk("");
  }

  return (
    <section className="tw-gadget space-y-3 p-3" data-activity-maker>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">New activity</p>
        <p className="mt-1 text-sm text-muted">This fills the plan book. Teach and Deck play what you park here.</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">What is this?</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {BELONG.map((b) => (
            <button
              key={b.id}
              type="button"
              title={b.hint}
              onClick={() => setBelong(b.id)}
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", belong === b.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {b.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{BELONG.find((b) => b.id === belong)?.hint}</p>
      </div>
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
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Brainstorm levers"
          className="edit-field min-h-11 rounded-md bg-elevated px-3 text-base text-fg outline-none ring-1 ring-gold/50"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Ask (optional)</span>
        <input
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="How can a small force move a bigger load?"
          className="edit-field min-h-11 rounded-md bg-elevated px-3 text-base text-fg outline-none ring-1 ring-gold/50"
        />
      </label>
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
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", grades.includes(g) ? "bg-fg text-bg" : "bg-elevated text-muted")}
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
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", picked.includes(d) ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {formatSchoolDate(d)}
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
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", prove === p.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={make}
        disabled={!name.trim()}
        className="tw-tap min-h-12 rounded-xl bg-gold px-4 text-base font-bold text-bg disabled:opacity-40"
      >
        Park on plan book
      </button>
    </section>
  );
}
