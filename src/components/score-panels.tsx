import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import {
  DEFAULT_CYCLE_GOALS,
  STAGES,
  lunchOn,
  resetAbCycle,
  setCurrentCycle,
  setCycleGoal,
  setSchedule,
  setShop,
} from "@/lib/store";
import { formatBell, bellTimes, scheduleOf, SCHEDULES } from "@/lib/bells";
import { RosterOnboard } from "@/components/roster-onboard";
import { RewardBar, RewardEditor } from "@/components/reward-bar";
import { GradeGoalChips } from "@/components/goal-chips";
import { ChangelogCard } from "@/components/changelog-card";
import { cn } from "@/lib/utils";

export function ScoreSchedulePanel({
  file,
  date,
  period,
  onChange,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  onChange: (next: EconomyFile) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-surface p-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Bell schedule</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(SCHEDULES) as (keyof typeof SCHEDULES)[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(setSchedule(file, id))}
            className={cn(
              "min-h-11 rounded-md px-4 text-sm font-semibold",
              scheduleOf(file.meta.config?.schedule) === id ? "bg-fg text-bg" : "bg-elevated text-muted",
            )}
          >
            {SCHEDULES[id].label}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg bg-elevated">
        <table className="w-full text-left text-sm">
          <thead className="text-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="py-2 font-medium">Start</th>
              <th className="py-2 font-medium">End</th>
              <th className="px-3 py-2 font-medium">ST by</th>
            </tr>
          </thead>
          <tbody>
            {bellTimes(file.meta.config?.schedule).map((b) => (
              <tr key={b.period} className={cn("border-t border-border", period === b.period ? "bg-surface" : "")}>
                <td className="px-3 py-2 font-semibold">{b.period === 6 ? "P6 SH" : `P${b.period}`}</td>
                <td className="py-2 font-mono">{formatBell(b.start)}</td>
                <td className="py-2 font-mono">{formatBell(b.end)}</td>
                <td className="px-3 py-2 font-mono text-muted">{formatBell(b.attendBy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted">Lunch is Admin → Lunch. Today: {lunchOn(file, date) || "not set"}.</p>
        <button type="button" onClick={() => onChange(resetAbCycle(file, date))} className="min-h-11 rounded-md bg-elevated px-3 text-sm text-loss">
          Snow · reset A/B
        </button>
      </div>
    </div>
  );
}

export function ScoreConfigPanel({
  file,
  onChange,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
}) {
  const cycle = file.meta.config?.currentCycle ?? 1;
  const goals = { ...DEFAULT_CYCLE_GOALS, ...(file.meta.config?.cycleGoals ?? {}) };
  const [rosterOpen, setRosterOpen] = useState(false);
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-surface p-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Cycle {cycle}</p>
      <button type="button" onClick={() => setRosterOpen(true)} className="mt-2 min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
        4-tap · add a class
      </button>
      {rosterOpen ? (
        <RosterOnboard file={file} onChange={onChange} onClose={() => setRosterOpen(false)} onDesk={() => setRosterOpen(false)} />
      ) : null}
      <select
        value={cycle}
        onChange={(e) => onChange(setCurrentCycle(file, Number(e.target.value)))}
        className="mt-2 min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold uppercase tracking-wide outline-none"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <option key={n} value={n}>
            Cycle {n}
          </option>
        ))}
      </select>
      <p className="mt-3 text-sm font-medium uppercase tracking-wider text-subtle">Daily goal by grade</p>
      <div className="mt-2">
        <GradeGoalChips
          grades={[6, 7, 8, 5]}
          valueOf={(g) => goals[`${cycle}|${g}`] || goals[String(g)] || STAGES[0]}
          onPick={(g, s) => onChange(setCycleGoal(file, g, s))}
        />
      </div>
      <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Class reward</p>
      <RewardBar file={file} detail />
      <RewardEditor file={file} onChange={onChange} />
      <ShopLists file={file} onChange={onChange} />
      <SkillLists file={file} onChange={onChange} />
      <ChangelogCard />
      <EmbedCard />
    </div>
  );
}

export function ShopLists({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const shop = file.meta.shop ?? [];
  const cats = [...new Set(["SNACKS", "LEISURE", "CHORES", "TOOLS", ...shop.map((x) => x.category)])];
  const [open, setOpen] = useState<Record<string, boolean>>({ SNACKS: true });
  const [newCat, setNewCat] = useState("");
  function patch(next: typeof shop) {
    onChange(setShop(file, next));
  }
  return (
    <div className="mt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Store lists · type to edit</p>
      {cats.map((cat) => {
        const rows = shop.map((item, i) => ({ item, i })).filter((x) => x.item.category === cat);
        return (
          <div key={cat} className="mt-2 rounded-md bg-elevated">
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))} className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-semibold uppercase tracking-wide">
              <span>
                {cat} · {rows.length}
              </span>
              <span className="text-subtle">{open[cat] ? "hide" : "show"}</span>
            </button>
            {open[cat] ? (
              <div className="space-y-1 px-3 pb-3">
                {rows.map(({ item, i }) => (
                  <div key={i} className="flex gap-1">
                    <input value={item.name} onChange={(e) => patch(shop.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="min-h-10 min-w-0 flex-1 rounded-md bg-surface px-2 text-sm outline-none" />
                    <input inputMode="numeric" value={item.price} onChange={(e) => patch(shop.map((x, j) => (j === i ? { ...x, price: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, "")) || 0) } : x)))} className="min-h-10 w-16 rounded-md bg-surface px-2 text-sm outline-none" />
                    <button type="button" onClick={() => patch(shop.filter((_, j) => j !== i))} className="min-h-10 rounded-md px-2 text-sm text-loss">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => patch([...shop, { category: cat, name: "", price: 5 }])} className="min-h-10 w-full rounded-md bg-surface text-sm text-muted">
                  + add {cat.toLowerCase()}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="mt-2 flex gap-2">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value.toUpperCase())} placeholder="NEW LIST NAME" className="min-h-10 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none" />
        <button
          type="button"
          onClick={() => {
            const c = newCat.trim();
            if (!c) return;
            patch([...shop, { category: c, name: "", price: 5 }]);
            setOpen((o) => ({ ...o, [c]: true }));
            setNewCat("");
          }}
          className="min-h-10 rounded-md bg-elevated px-3 text-sm"
        >
          Add list
        </button>
      </div>
    </div>
  );
}

export function SkillLists({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const list = file.meta.config?.skills?.length
    ? file.meta.config.skills
    : [
        { id: "safety", name: "SAFETY" },
        { id: "measure", name: "MEASURE" },
        { id: "draw", name: "DRAW" },
        { id: "model", name: "MODEL" },
        { id: "material", name: "MATERIAL" },
        { id: "tools", name: "TOOLS" },
        { id: "finish", name: "FINISH" },
        { id: "present", name: "PRESENT" },
        { id: "digital", name: "DIGITAL" },
        { id: "team", name: "TEAM" },
      ];
  return (
    <div className="mt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Skills list</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {list.map((sk, i) => (
          <input
            key={sk.id}
            value={sk.name}
            onChange={(e) => {
              const next = structuredClone(file);
              const skills = [...(next.meta.config?.skills ?? list)];
              skills[i] = { ...skills[i], name: e.target.value.toUpperCase() };
              next.meta.config = { ...(next.meta.config ?? {}), skills };
              onChange(next);
            }}
            className="min-h-11 rounded-md bg-elevated px-2 text-sm uppercase outline-none"
          />
        ))}
      </div>
    </div>
  );
}

function EmbedCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "https://your-techworks-host" : window.location.origin;
  const src = `${origin}/?embed=1`;
  const html = `<iframe src="${src}" title="TechWorks Board" width="100%" height="720" style="border:0;background:#0a0a0b" allow="fullscreen" loading="lazy"></iframe>`;
  return (
    <div className="mt-4 rounded-md bg-elevated p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide">
        Show embed
        <span className="text-subtle">{open ? "hide" : "Google Site"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted">Google Site → Insert → Embed. Overview only. Aliases, no names vault.</p>
          <textarea readOnly value={html} className="min-h-24 w-full rounded-md bg-surface p-2 font-mono text-xs outline-none" />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(html);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                window.prompt("Copy iframe", html);
              }
            }}
            className="min-h-11 w-full rounded-md bg-fg text-sm font-semibold text-bg"
          >
            {copied ? "Copied" : "Copy iframe HTML"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
