import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { EconomyFile } from "@/lib/economy";
import { lessonPlanOf } from "@/lib/lesson-plan";
import { APP_MARK, COPYRIGHT_LINE } from "@/lib/copy";
import { SKILL_MARKS } from "@/lib/skills";
import { cn } from "@/lib/utils";

export function LessonPlanSheet({
  file,
  period,
  dates,
  onClose,
}: {
  file: EconomyFile;
  period: number;
  dates: string[];
  onClose: () => void;
}) {
  const plan = lessonPlanOf(file, period, dates);

  useEffect(() => {
    document.body.classList.add("lesson-printing");
    return () => document.body.classList.remove("lesson-printing");
  }, []);

  const sheet = (
    <div className="lesson-overlay fixed inset-0 z-[80] overflow-y-auto bg-bg print:static print:inset-auto print:overflow-visible print:bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3 print:hidden">
        <p className="text-sm font-semibold text-gold">Lesson plan · Save as PDF in the print dialog</p>
        <button type="button" onClick={() => window.print()} className="tw-tap ml-auto min-h-11 rounded-xl bg-gold px-4 text-sm font-bold text-bg">
          Print / PDF
        </button>
        <button type="button" onClick={onClose} className="tw-tap min-h-11 rounded-xl bg-elevated px-4 text-sm font-semibold">
          Close
        </button>
      </div>
      <article className="lesson-sheet mx-auto mb-10 max-w-4xl bg-surface p-6 text-fg print:mb-0 print:max-w-none print:bg-white print:p-0 print:text-black">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4 print:border-neutral-300">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-subtle print:text-neutral-500">
              {APP_MARK} · lesson plan
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{plan.project || "This class"}</h1>
            <p className="mt-1 text-sm text-muted print:text-neutral-600">
              {plan.course} · P{plan.period} · Grade {plan.grade} · {plan.range}
            </p>
          </div>
          <p className="max-w-sm text-right text-xs text-subtle print:text-neutral-500">{plan.standard}</p>
        </header>

        {plan.ask ? (
          <section className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Driving question</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{plan.ask}</p>
          </section>
        ) : null}

        {plan.rules.length ? (
          <section className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Safety · constraints</p>
            <p className="mt-1 text-sm">{plan.rules.join(" · ")}</p>
          </section>
        ) : null}

        <section className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Week at a glance</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-5">
            {plan.days.map((d) => (
              <div key={d.date} className="rounded-xl bg-elevated p-3 print:border print:border-neutral-300 print:bg-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">{d.label}</p>
                <p className="mt-1 font-display text-base font-semibold leading-tight">{d.activity || "—"}</p>
                <p className="mt-1 text-[11px] text-muted print:text-neutral-600">{d.skillName || d.pack}</p>
              </div>
            ))}
          </div>
        </section>

        {plan.matrix.length ? (
          <section className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Objectives × skills × NY MST 5</p>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-subtle print:text-neutral-500">
                  <th className="py-2 pr-2">Skill</th>
                  <th className="py-2 pr-2">Standard</th>
                  {plan.days.map((d) => (
                    <th key={d.date} className="py-2 px-1 text-center">
                      {d.label.replace(/,.*/, "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.matrix.map((row) => (
                  <tr key={row.skillId} className="border-t border-border print:border-neutral-200">
                    <td className="py-2 pr-2 align-top">
                      <p className="font-semibold">{row.skillName}</p>
                      <p className="text-xs text-muted print:text-neutral-600">{row.does}</p>
                    </td>
                    <td className="py-2 pr-2 align-top font-mono text-xs">
                      {row.mst.join(" · ")}
                      {row.mstTitles.length ? <span className="mt-0.5 block text-muted print:text-neutral-600">{row.mstTitles.join(" · ")}</span> : null}
                    </td>
                    {row.days.map((on, i) => (
                      <td key={plan.days[i]?.date ?? i} className="py-2 px-1 text-center font-bold">
                        {on ? "●" : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="mt-6 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Each class</p>
          {plan.days.map((d) => (
            <article key={d.date} className="rounded-xl bg-elevated p-4 print:border print:border-neutral-300 print:bg-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold print:text-neutral-500">
                {d.label} · P{plan.period} · {d.pack}
                {d.skillName ? ` · ${d.skillName}` : ""}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold">{d.activity || "Unset"}</h2>
              {d.ask ? (
                <p className="mt-2 text-sm">
                  <span className="font-bold">Ask. </span>
                  {d.ask}
                </p>
              ) : null}
              {d.do ? (
                <p className="mt-1 text-sm">
                  <span className="font-bold">Do this now. </span>
                  {d.do}
                </p>
              ) : null}
              {d.done ? (
                <p className="mt-1 text-sm">
                  <span className="font-bold">Done when. </span>
                  {d.done}
                </p>
              ) : null}
              {d.lookFor ? (
                <p className="mt-1 text-sm">
                  <span className="font-bold">A 3. </span>
                  {d.lookFor}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted print:text-neutral-600">
                Objective · {d.objective || "—"}
                {d.prove ? ` · Score ${d.prove === "both" ? "skill + deliverable" : d.prove}` : ""}
                {d.mst.length ? ` · ${d.mst.join(" · ")}` : ""}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle print:text-neutral-500">Skill scale (shop)</p>
          <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
            {SKILL_MARKS.map((m) => (
              <li key={m.n}>
                <span className="font-bold">
                  {m.n} {m.name}.
                </span>{" "}
                {m.why}
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-8 border-t border-border pt-3 text-xs text-subtle print:border-neutral-300 print:text-neutral-500">
          {COPYRIGHT_LINE} · Not a gradebook print. Wallet and names stay off this sheet.
        </footer>
      </article>
    </div>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

export function LessonPrintButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium tw-btn-2", className)}>
      Print lesson
    </button>
  );
}
