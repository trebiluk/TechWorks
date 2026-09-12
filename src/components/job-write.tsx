import { useEffect, useState } from "react";
import { activitiesOf, prettyStage, type ShopProject } from "@/lib/projects";

/** Stop desk/window hotkeys from eating Space while a job field is focused. */
function keepSpace(e: { stopPropagation: () => void; nativeEvent?: { stopImmediatePropagation?: () => void } }) {
  e.stopPropagation();
  e.nativeEvent?.stopImmediatePropagation?.();
}

export function JobWrite({
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
  const [rules, setRules] = useState(() => (project.constraints ?? []).join(". "));
  useEffect(() => {
    setRules((project.constraints ?? []).join(". "));
  }, [project.id]);

  function commitRules(raw: string) {
    onPatch({
      ...project,
      constraints: raw
        .split(/[.;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="tw-gadget mx-auto max-w-3xl space-y-3 p-3 pb-6" onKeyDown={keepSpace}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{prettyStage(acts[0]?.goal ?? "Idea")} · student-facing</p>
      <p className="text-sm text-muted">These lines hit the wall. How many days each activity holds is on Plan.</p>
      {unlocked ? (
        <input
          value={project.title}
          onChange={(e) => onPatch({ ...project, title: e.target.value })}
          onKeyDown={keepSpace}
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
            onKeyDown={keepSpace}
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
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            onBlur={(e) => commitRules(e.target.value)}
            onKeyDown={keepSpace}
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
                  onKeyDown={keepSpace}
                  placeholder="Today"
                  className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                />
                <input
                  value={a.done ?? ""}
                  onChange={(e) => onActivity(a.id, { done: e.target.value })}
                  onKeyDown={keepSpace}
                  placeholder="Done"
                  className="min-h-9 w-full rounded bg-surface px-2 text-sm outline-none"
                />
                <input
                  value={a.lookFor ?? ""}
                  onChange={(e) => onActivity(a.id, { lookFor: e.target.value })}
                  onKeyDown={keepSpace}
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
