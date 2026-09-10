import { useState } from "react";
import { Dices, Glasses, Timer } from "lucide-react";
import { markOf } from "@/lib/nav-marks";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { abOn, onAbRoster } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { crewsOf } from "@/lib/crews";
import { featureOn } from "@/lib/features";
import { jobCardOf } from "@/lib/projects";
import { toolsOpen } from "@/lib/ppe";
import { TouchTimer } from "@/components/touch-timer";
import { cn } from "@/lib/utils";

export function DashTools({ file, period }: { file: EconomyFile; period: number }) {
  const today = todayIso();
  const letter = abOn(file, today);
  const pool = file.students.filter(
    (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
  );
  const crews = crewsOf(file, period, today);
  const [who, setWho] = useState<string>("—");
  const [crew, setCrew] = useState<string>("—");

  function drawWho() {
    if (!pool.length) return;
    setWho(pool[Math.floor(Math.random() * pool.length)]?.first ?? "—");
  }
  function drawCrew() {
    if (!crews.length) return;
    setCrew(crews[Math.floor(Math.random() * crews.length)]?.name ?? "—");
  }

  const timerOn = featureOn(file, "timer");
  const pickOn = featureOn(file, "picker");
  if (!timerOn && !pickOn && !featureOn(file, "ambient")) return null;

  const job = jobCardOf(file, period);
  if (!toolsOpen(file, job.rules, period, today)) {
    return (
      <section className="tw-gadget tw-hud flex min-h-[5rem] items-center gap-3 p-3">
        <Glasses className="size-8 text-cleanup" aria-hidden />
        <div>
          <p className="font-display text-xl font-semibold">Goggles first.</p>
          <p className="text-sm text-muted">Then tools.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="tw-gadget tw-hud grid min-h-0 gap-2 p-3 sm:grid-cols-3">
      {timerOn ? <TouchTimer title="Timer" className="bg-elevated" /> : null}
      {pickOn ? (
        <article className="rounded-xl bg-elevated p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Draw · P{period}</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{who === "—" ? "Tap" : who}</p>
          <p className="text-xs text-muted">{pool.length} aliases</p>
          <button type="button" onClick={drawWho} className="tw-tap mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-accent-fg">
            <Dices className="size-4" /> Worker
          </button>
        </article>
      ) : null}
      {pickOn ? (
        <article className="rounded-xl bg-elevated p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Crew</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{crew === "—" ? "Tap" : crew}</p>
          <p className="text-xs text-muted">{crews.length} crews</p>
          <button
            type="button"
            onClick={drawCrew}
            className="tw-tap mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-gold text-sm font-semibold text-bg"
          >
            <Dices className="size-4" /> Crew
          </button>
          {featureOn(file, "ambient") ? (
            <a
              href="https://neal.fun/ambient-chaos/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center text-xs font-semibold uppercase tracking-wider text-accent"
            >
              Ambient Chaos
            </a>
          ) : null}
        </article>
      ) : featureOn(file, "ambient") ? (
        <a
          href="https://neal.fun/ambient-chaos/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-xl bg-elevated p-3 text-xs font-semibold uppercase tracking-wider text-accent"
        >
          Ambient Chaos
        </a>
      ) : null}
    </section>
  );
}

export function ToolsToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  const Icon = markOf("tools") ?? Timer;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("tw-tap inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium", on ? "bg-accent text-accent-fg" : "tw-btn-2")}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      Tools
    </button>
  );
}
