"use client";

import { useState } from "react";
import { APP_VERSION, VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { ARCH_SECTIONS, architectureMarkdown, type ArchLane } from "@/data/architecture";
import { downloadText } from "@/lib/live";
import { cn } from "@/lib/utils";

const LANE: Record<ArchLane["color"], string> = {
  gold: "border-gold/50 bg-gold/10 text-gold",
  accent: "border-accent/50 bg-accent/10 text-accent",
  crew: "border-crew/50 bg-crew/10",
  muted: "border-border bg-elevated text-muted",
};

export function DocsBoard() {
  const [open, setOpen] = useState(ARCH_SECTIONS[0]?.id ?? "");
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      <header className="tw-gadget p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Docs · {VERSION_LABEL}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">How TechWorks is wired</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          One write for the hour. Four number systems that never mix. Wall is aliases. Admin is the writer. Tap a chapter. Download the same map as a file.
        </p>
        <button
          type="button"
          onClick={() => downloadText(`TECHWORKS-ARCHITECTURE-v${APP_VERSION}.md`, architectureMarkdown(), "text/markdown")}
          className="tw-tap mt-3 min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg"
        >
          Download architecture
        </button>
      </header>

      <nav className="flex flex-wrap gap-1">
        {ARCH_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s.id)}
            className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", open === s.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
          >
            {s.title}
          </button>
        ))}
      </nav>

      {ARCH_SECTIONS.filter((s) => s.id === open).map((s) => (
        <article key={s.id} className="grid gap-3">
          <section className="tw-gadget p-4">
            <h2 className="font-display text-xl font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.lead}</p>
          </section>

          {s.lanes?.length ? (
            <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {s.lanes.map((lane) => (
                <div key={lane.name} className={cn("tw-gadget border p-3", LANE[lane.color])}>
                  <p className="text-[11px] font-bold uppercase tracking-wider">{lane.name}</p>
                  <ul className="mt-2 grid gap-1">
                    {lane.items.map((item) => (
                      <li key={item} className="text-sm font-semibold text-fg">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {s.flows?.map((flow) => (
            <section key={flow.title} className="tw-gadget p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{flow.title}</p>
              <ol className="mt-3 grid gap-2">
                {flow.steps.map((st, i) => (
                  <li key={i} className="grid gap-1 rounded-xl bg-elevated px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm font-semibold">{st.from}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-gold">{st.arrow}</span>
                    <span className="text-sm font-semibold sm:text-right">{st.to}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {s.tables?.map((t) => (
            <section key={t.caption} className="tw-gadget overflow-auto p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-subtle">{t.caption}</p>
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted">
                    {t.head.map((h) => (
                      <th key={h} className="px-2 py-1 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, c) => (
                        <td key={c} className={cn("px-2 py-1.5 align-top", c === 0 ? "font-semibold" : "text-muted")}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          {s.never?.length ? (
            <section className="tw-gadget p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cleanup">Do not</p>
              <ul className="mt-2 grid gap-1 text-sm text-muted">
                {s.never.map((n) => (
                  <li key={n}>— {n}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {s.notes?.length ? (
            <ul className="grid gap-1 px-1 text-sm text-muted">
              {s.notes.map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}

      <p className="px-1 pb-4 text-[11px] text-muted">{COPYRIGHT_LINE}</p>
    </div>
  );
}
