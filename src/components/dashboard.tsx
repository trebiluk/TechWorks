import { memo, startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClipboardList, ChevronDown, ChevronUp, Clock, EyeOff, Flag, Megaphone, Target, Trophy } from "lucide-react";
import type { Bell, EconomyFile, ScoredStudent } from "@/lib/economy";
import { isLiveStudent, periodTitle, shopBells } from "@/lib/economy";
import { formatBell, periodClock, periodNext, periodNow, SCHOOLTOOL_URL } from "@/lib/bells";
import { applySort, byCombo } from "@/lib/rank";
import { XpBit, PerkBit } from "@/components/marks";
import { PeriodRewardChip, RewardBar } from "@/components/reward-bar";
import { DayStrip } from "@/components/day-strip";
import { WeatherChip } from "@/components/weather-chip";
import { Berty, BertyPeek } from "@/components/berty";
import { Fold } from "@/components/fold";
import { agendaFor, periodPaceLine, phaseIndex, prettyStage, skillName } from "@/lib/projects";
import { boardCardsOf, cycleVisit, isSubDay, onAbRoster, schooltoolDone, setSchooltoolDone, visitOn, abOn } from "@/lib/store";
import { VisitChip } from "@/components/visit-chip";
import { cycleProgress, formatSchoolDate, isSchoolDay, nextOpenDay, quarterProgress, reason, todayIso, yearProgress } from "@/lib/calendar";
import { tapeMark } from "@/lib/tape";
import { cn } from "@/lib/utils";
import { ClubPulse } from "@/components/club-pulse";
import { featureOn } from "@/lib/features";
import { showBerty } from "@/lib/berty";
import { DAILY_PROCEDURE, procedureStep } from "@/lib/procedure";
import { hideDashRow, loadDashLayout, moveDashRow, patchDash, rowOn, saveDashLayout, DASH_ROWS, DEFAULT_LAYOUT, type DashLayout, type DashRowId } from "@/lib/dash-layout";
import { useShopClock } from "@/lib/use-clock";
import { useLayout } from "@/lib/layout";
import { PhoneFeed } from "@/components/phone-feed";
import { ProgressRing, ProgressTrio } from "@/components/progress-ring";

const FOLD_KEY = "techworks-dash-fold-v2";
const DEFAULT_CLOSED: Record<string, boolean> = { spark: true, notes: true };

function useDashLayout() {
  const [layout, setLayout] = useState<DashLayout>(() => loadDashLayout());
  function commit(next: DashLayout) {
    setLayout(next);
    saveDashLayout(next);
  }
  return {
    layout,
    move: (id: string, dir: -1 | 1) => commit(moveDashRow(layout, id, dir)),
    setOn: (id: string, on: boolean) => commit(hideDashRow(layout, id, on)),
    setSchoolN: (n: 5 | 10) => commit(patchDash(layout, { schoolN: n })),
    setLiveProc: (on: boolean) => commit(patchDash(layout, { liveProc: on })),
    setFlag: (key: keyof DashLayout, value: boolean | 5 | 10) => commit(patchDash(layout, { [key]: value } as Partial<DashLayout>)),
    reset: () => commit(DEFAULT_LAYOUT),
    on: (id: string) => rowOn(layout, id),
  };
}

function useDashFold() {
  const [closed, setClosed] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(FOLD_KEY);
      return raw ? { ...DEFAULT_CLOSED, ...(JSON.parse(raw) as Record<string, boolean>) } : DEFAULT_CLOSED;
    } catch {
      return DEFAULT_CLOSED;
    }
  });
  function toggle(id: string) {
    startTransition(() => {
      setClosed((c) => {
        const next = { ...c, [id]: !c[id] };
        try {
          window.localStorage.setItem(FOLD_KEY, JSON.stringify(next));
        } catch {
          /* */
        }
        return next;
      });
    });
  }
  return { open: (id: string) => !closed[id], toggle };
}

/** @deprecated One dashboard. Kept so old menu clicks don't crash. */
export type DashKind = "classes" | "live" | "school" | "week" | "data" | "year";
export function commitDash(_id?: DashKind) {}

export const Dashboard = memo(function Dashboard({
  list,
  bells,
  file,
  unlocked,
  rankBoard,
  onRankBoard,
  onPeriod,
  onOpenId,
  onChange,
  onClub,
}: {
  list: ScoredStudent[];
  bells: Bell[];
  file: EconomyFile;
  unlocked: boolean;
  rankBoard: "skill" | "perk";
  onRankBoard: (next: "skill" | "perk") => void;
  onPeriod: (period: number) => void;
  onOpenId: (id: string) => void;
  onChange?: (next: EconomyFile) => void;
  onClub?: () => void;
}) {
  const fold = useDashFold();
  const dash = useDashLayout();
  const phone = useLayout() === "mobile";
  const { layout, move } = dash;
  const now = useShopClock(file.meta.config?.schedule, "beat");
  const [viewP, setViewP] = useState<number | null>(null);
  const today = todayIso();
  const letter = abOn(file, today);
  const shop = useMemo(() => shopBells(file).map((b) => b.period), [file]);
  const live = periodNow(file.meta.config?.schedule, now);
  const nxt = periodNext(file.meta.config?.schedule, now);
  const shown =
    viewP != null && shop.includes(viewP)
      ? viewP
      : live != null && shop.includes(live)
        ? live
        : nxt && shop.includes(nxt.period)
          ? nxt.period
          : (shop[0] ?? 1);
  const peeking = viewP != null && viewP !== live;
  const viewMine = shop.includes(shown);
  const clock = live != null ? periodClock(live, file.meta.config?.schedule, now) : null;
  const agenda = agendaFor(file, shown);
  const goal = agenda.goal;
  const afterBell = isSchoolDay(today) && live == null && nxt == null;
  const openDay = nextOpenDay(today, afterBell);
  const wallAgenda = clock?.live ? agenda : agendaFor(file, shop[0] ?? 1, openDay);
  const shopLive = Boolean(clock?.live);
  const passing = isSchoolDay(today) && !shopLive && Boolean(nxt);
  const step = procedureStep({
    live: shopLive,
    cleanup: Boolean(clock?.cleanup),
    passing,
    pct: clock?.pct,
  });
  const needRank = true;
  const combo = useMemo(
    () => (needRank ? byCombo(file, list.filter((s) => s.period !== 6)) : []),
    [needRank, file, list],
  );
  const ranked = useMemo(() => applySort(combo, rankBoard === "perk" ? "wallet" : "level"), [combo, rankBoard]);
  const viewKids = useMemo(
    () => applySort(combo.filter((s) => s.period === shown), rankBoard === "perk" ? "wallet" : "level"),
    [combo, shown, rankBoard],
  );
  const todayHit = useMemo(() => {
    const kids = file.students.filter(
      (s) => s.period === shown && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
    );
    let scored = 0;
    for (const s of kids) {
      if (tapeMark(s.markTape, today) || s.marks?.[today]) scored += 1;
    }
    return { scored, blank: kids.length - scored, n: kids.length };
  }, [file, shown, today, letter]);
  const cyc = cycleProgress(today);
  const qtr = quarterProgress(today);
  const yr = yearProgress(today);
  const st = schooltoolDone(file, today, 1);
  const stLate = isSchoolDay(today) && !st && !isSubDay(file, today);
  const stOpen = stLate || (unlocked && isSchoolDay(today) && !st && !isSubDay(file, today));
  function rowTools(id: string) {
    if (!unlocked || !layout.layoutOpen) return undefined;
    const i = layout.order.indexOf(id as DashRowId);
    return (
      <MovePair
        up={() => move(id, -1)}
        down={() => move(id, 1)}
        canUp={i > 0}
        canDown={i >= 0 && i < layout.order.length - 1}
        onHide={() => dash.setOn(id, false)}
      />
    );
  }
  function rowStyle(id: string) {
    return { order: layout.order.indexOf(id as DashRowId) };
  }

  if (phone) {
    return (
      <PhoneFeed
        file={file}
        list={list}
        rankBoard={rankBoard}
        onRankBoard={onRankBoard}
        onOpenId={onOpenId}
        onPeriod={onPeriod}
        unlocked={unlocked}
      />
    );
  }

  if (isSubDay(file, today)) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden">
        <Fold label="Now" icon={Clock} hint={live != null ? `P${live}` : nxt ? `Next P${nxt.period}` : "Done"} open={fold.open("now")} onToggle={() => fold.toggle("now")} dark>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-3xl font-semibold tracking-tight text-white">
              {live != null ? `P${live}` : nxt ? `P${nxt.period}` : "—"}
              <span className="ml-2 text-lg font-medium text-white/75">{live != null ? periodTitle(live, bells) : nxt ? "next" : "done"}</span>
            </p>
            <VisitChip state="SUB" />
            <span className="font-display text-4xl font-semibold tabular-nums text-white sm:text-5xl">
              {clock?.live ? (clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}`) : "—"}
            </span>
          </div>
        </Fold>
        <Fold label="Schedule" hint="Bells" open={fold.open("strip")} onToggle={() => fold.toggle("strip")}>
          <DayStrip schedule={file.meta.config?.schedule} shop={shop} view={shown} now={now} />
        </Fold>
      </div>
    );
  }

  return (
    <div className="tw-web-wall relative flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden">
      {unlocked ? <LayoutBar dash={dash} rankBoard={rankBoard} onRankBoard={onRankBoard} /> : null}
      {stOpen ? (
        <div className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3 py-2", stLate ? "bg-loss text-accent-fg" : "bg-surface")}>
          <ClipboardList className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          <a href={SCHOOLTOOL_URL} target="_blank" rel="noreferrer" className="font-display text-sm font-semibold">
            {stLate ? "SchoolTool still open · P1 by 8:15" : "SchoolTool"}
          </a>
          {unlocked && onChange ? (
            <button type="button" onClick={() => onChange(setSchooltoolDone(file, today, 1, true))} className={cn("ml-auto min-h-9 rounded-md px-3 text-xs font-semibold", stLate ? "bg-accent-fg text-loss" : "bg-fg text-bg")}>
              ST in
            </button>
          ) : null}
        </div>
      ) : null}
      {featureOn(file, "club") ? <ClubPulse onOpen={onClub} now={now} /> : null}

      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] gap-2 overflow-hidden">
        <section className={cn("grid min-h-0 gap-2 lg:grid-cols-12", clock?.cleanup ? "rounded-xl ring-2 ring-cleanup" : "")}>
          {dash.on("now") ? (
            <article className={cn("tw-gadget p-3 text-white lg:col-span-3", clock?.cleanup ? "bg-cleanup" : "")}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {clock?.live ? (clock.cleanup ? "Cleanup" : "Now") : nxt ? "Next" : "Workshop"}
                </p>
                <VisitChip state={visitOn(file, today, live ?? nxt?.period ?? shown)} />
              </div>
              <p className="mt-1 font-display text-2xl font-semibold leading-none tracking-tight">
                {clock?.live ? `P${live}` : nxt ? `P${nxt.period}` : "Done"}
              </p>
              <p className="mt-1 truncate text-sm text-white/80">
                {clock?.live
                  ? `${periodTitle(live!, bells)} · ${formatBell(clock.start)}–${formatBell(clock.end)}`
                  : nxt
                    ? `${periodTitle(nxt.period, bells)} · ${formatBell(nxt.start)}`
                    : `Opens ${formatSchoolDate(openDay)} P1`}
              </p>
              {clock?.live ? (
                <div className="mt-2">
                  <ProgressRing
                    pct={clock.pct}
                    label={clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}m`}
                    sub={clock.cleanup ? "cleanup" : "left"}
                    tone={clock.cleanup ? "warn" : "accent"}
                    size="md"
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <ProgressTrio cycle={cyc} quarter={qtr} year={yr} />
                </div>
              )}
              {layout.nowWeather && live == null ? <div className="mt-2"><WeatherChip /></div> : null}
            </article>
          ) : null}

          {dash.on("class") ? (
            <article className="tw-gadget min-h-0 p-3 lg:col-span-9">
              {viewMine ? (
                <GoalsCard
                  file={file}
                  shown={shown}
                  bells={bells}
                  goal={goal}
                  agenda={agenda}
                  todayHit={todayHit}
                  viewKids={viewKids}
                  unlocked={unlocked}
                  peeking={peeking}
                  live={live}
                  onPeriod={onPeriod}
                  onOpenId={onOpenId}
                  onNow={() => setViewP(null)}
                  cleanup={Boolean(clock?.cleanup)}
                />
              ) : (
                <p className="text-sm text-muted">Tap a Tech period on the strip.</p>
              )}
            </article>
          ) : null}
        </section>

        {dash.on("strip") ? (
          <section className="tw-gadget shrink-0 p-2">
            <DayStrip
              schedule={file.meta.config?.schedule}
              shop={shop}
              view={shown}
              now={now}
              onPeriod={(p) => {
                if (p === 6) {
                  onPeriod(6);
                  return;
                }
                startTransition(() => {
                  if (live != null && p === live) setViewP(null);
                  else setViewP(p);
                });
              }}
            />
          </section>
        ) : null}

        <section className="grid min-h-0 gap-2 overflow-hidden lg:grid-cols-5">
          {dash.on("kpis") ? (
            <article className="tw-gadget flex min-h-0 flex-col overflow-hidden p-3 lg:col-span-3">
              <div className="mb-1 flex items-center gap-2">
                <p className="font-display text-sm font-semibold">School · top {layout.schoolN}</p>
                <button type="button" onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")} className="tw-btn-2 ml-auto min-h-8 rounded-full px-3 text-[11px] font-semibold">
                  {rankBoard === "skill" ? "XP" : "$"}
                </button>
              </div>
              <ol className="grid min-h-0 flex-1 grid-cols-1 gap-0.5 overflow-auto sm:grid-cols-2">
                {ranked.slice(0, layout.schoolN).map((s, i) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => onOpenId(s.id)} className="flex w-full min-h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-elevated">
                      <span className={cn("grid size-6 place-items-center rounded-full font-mono text-xs font-bold", i === 0 ? "bg-gold text-bg" : "tw-readout")}>{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {s.first}
                        <span className="ml-1 font-normal text-muted">P{s.period}</span>
                      </span>
                      <XpBit xp={s.xp} level={s.level} hot />
                      <PerkBit n={s.quarter} hot />
                    </button>
                  </li>
                ))}
              </ol>
            </article>
          ) : null}
          <article className="tw-gadget flex min-h-0 flex-col gap-2 overflow-auto p-3 lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Year</p>
            <ProgressTrio cycle={cyc} quarter={qtr} year={yr} />
            <RewardBar file={file} />
            {dash.on("notes") && boardCardsOf(file).some((c) => c.title.trim()) ? (
              <div className="mt-auto">
                {boardCardsOf(file)
                  .filter((c) => c.title.trim())
                  .slice(0, 2)
                  .map((c, i) => (
                    <p key={i} className="mt-2 text-sm">
                      <span className="font-semibold">{c.title}</span>
                      {c.body ? <span className="text-muted"> · {c.body}</span> : null}
                    </p>
                  ))}
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  );
});

function GoalsCard({
  file,
  shown,
  bells,
  goal,
  agenda,
  todayHit,
  viewKids,
  unlocked,
  peeking,
  live,
  onPeriod,
  onOpenId,
  onNow,
  cleanup,
}: {
  file: EconomyFile;
  shown: number;
  bells: Bell[];
  goal: string;
  agenda: ReturnType<typeof agendaFor>;
  todayHit: { scored: number; blank: number; n: number };
  viewKids: { id: string; first: string; xp: number; level: number; quarter: number }[];
  unlocked: boolean;
  peeking: boolean;
  live: number | null;
  onPeriod: (p: number) => void;
  onOpenId: (id: string) => void;
  onNow: () => void;
  cleanup?: boolean;
}) {
  const pace = periodPaceLine(file, shown);
  const phase = agenda.activityName || prettyStage(goal) || "Idea";
  const project = agenda.title || "Class project";
  const goalIdx = Math.max(1, phaseIndex(pace.goal || goal));
  const lanes = [...pace.rows].sort((a, b) => phaseIndex(b.current) - phaseIndex(a.current));
  return (
    <div className="relative grid gap-2 sm:grid-cols-2">
      {cleanup ? <Berty pose="point" size="sm" alert className="absolute -top-1 right-0 z-10" /> : null}
      <div className="min-w-0">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-semibold leading-none tracking-tight">{project}</p>
            <p className="mt-0.5 truncate text-sm text-muted">
              <span className="font-semibold text-fg">{phase}</span>
              {agenda.skillId ? ` · ${skillName(agenda.skillId)}` : ""}
              <span className="text-subtle"> · P{shown}</span>
              <span className="ml-2 font-mono text-xs tabular-nums">
                {todayHit.scored}/{todayHit.n}
                {todayHit.blank ? ` left` : ""}
              </span>
            </p>
          </div>
          {peeking && live != null ? (
            <button type="button" onClick={onNow} className="min-h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
              P{live}
            </button>
          ) : null}
          {unlocked ? (
            <button type="button" title="Score" onClick={() => onPeriod(shown)} className="min-h-11 shrink-0 rounded-md bg-fg px-3 text-sm font-semibold text-bg">
              Score
            </button>
          ) : null}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {lanes.length ? (
            lanes.map((c, i) => {
              const idx = phaseIndex(c.current);
              const pct = Math.min(100, Math.round(((idx + 1) / (goalIdx + 1)) * 100));
              const lead = i === 0;
              return (
                <li key={c.key} className="flex flex-col items-center text-center">
                  <ProgressRing
                    pct={Math.max(8, pct)}
                    label={`${pct}`}
                    sub={c.name}
                    tone={lead ? "gold" : c.lag > 0 ? "warn" : "gain"}
                    size="md"
                  />
                  <span className="mt-0.5 text-[10px] text-muted">{prettyStage(c.current) || "—"}</span>
                </li>
              );
            })
          ) : (
            <li className="col-span-2 text-sm text-muted">No crews yet.</li>
          )}
        </ul>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-1">
        <div className="rounded-lg bg-elevated px-2.5 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Reward</p>
          <PeriodRewardChip file={file} period={shown} className="mt-1" />
        </div>
        <div className="rounded-lg bg-elevated px-2.5 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Top 3</p>
          <ol className="mt-1 space-y-1">
            {viewKids.slice(0, 3).map((s, i) => (
              <li key={s.id}>
                <button type="button" disabled={!unlocked} onClick={() => onOpenId(s.id)} className="flex w-full min-h-9 items-center gap-1.5 text-left disabled:cursor-default">
                  <span className="w-3 font-mono text-xs text-subtle">{i + 1}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-sm", i === 0 ? "font-semibold" : "")}>{s.first}</span>
                  <XpBit xp={s.xp} level={s.level} hot />
                  <PerkBit n={s.quarter} hot />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ChipToggle({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-8 rounded-full px-3 text-[12px] font-medium",
        on ? "bg-accent text-accent-fg" : "tw-btn-2 min-h-8 rounded-full px-3 text-[12px] font-medium",
      )}
    >
      {children}
    </button>
  );
}

function LayoutBar({
  dash,
  rankBoard,
  onRankBoard,
}: {
  dash: ReturnType<typeof useDashLayout>;
  rankBoard: "skill" | "perk";
  onRankBoard: (next: "skill" | "perk") => void;
}) {
  const { layout } = dash;
  return (
    <section className="shrink-0" style={{ order: -2 }}>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => dash.setFlag("layoutOpen", !layout.layoutOpen)}
          className={cn(
            "min-h-8 rounded-full px-3 text-[12px] font-medium",
            layout.layoutOpen ? "bg-accent text-accent-fg" : "tw-btn-2 min-h-8 rounded-full px-3 text-[12px] font-medium",
          )}
        >
          {layout.layoutOpen ? "Done arranging" : "Arrange"}
        </button>
      </div>
      {layout.layoutOpen ? (
        <div className="mt-1.5 rounded-2xl bg-surface px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">On the wall</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {DASH_ROWS.map((row) => {
              const on = dash.on(row.id);
              const i = layout.order.indexOf(row.id);
              return (
                <span key={row.id} className="inline-flex items-center rounded-full bg-elevated pl-1">
                  <button
                    type="button"
                    disabled={i <= 0}
                    onClick={() => dash.move(row.id, -1)}
                    className="grid size-7 place-items-center text-muted disabled:opacity-25"
                    title="Earlier"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => dash.setOn(row.id, !on)}
                    className={cn("min-h-8 px-1.5 text-[12px] font-medium", on ? "text-fg" : "text-muted line-through")}
                  >
                    {row.label}
                  </button>
                  <button
                    type="button"
                    disabled={i >= layout.order.length - 1}
                    onClick={() => dash.move(row.id, 1)}
                    className="grid size-7 place-items-center text-muted disabled:opacity-25"
                    title="Later"
                  >
                    ›
                  </button>
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">Now extras</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <ChipToggle on={layout.nowGoal} onClick={() => dash.setFlag("nowGoal", !layout.nowGoal)}>Project</ChipToggle>
            <ChipToggle on={layout.nowBars} onClick={() => dash.setFlag("nowBars", !layout.nowBars)}>Cycle bars</ChipToggle>
            <ChipToggle on={layout.nowVisit} onClick={() => dash.setFlag("nowVisit", !layout.nowVisit)}>Visit</ChipToggle>
            <ChipToggle on={layout.nowWeather} onClick={() => dash.setFlag("nowWeather", !layout.nowWeather)}>Weather</ChipToggle>
            <ChipToggle on={layout.liveProc} onClick={() => dash.setLiveProc(!layout.liveProc)}>How we start</ChipToggle>
          </div>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">School board</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <ChipToggle on={layout.rankBtns} onClick={() => dash.setFlag("rankBtns", !layout.rankBtns)}>Rank buttons</ChipToggle>
            <ChipToggle on={layout.schoolN === 10} onClick={() => dash.setSchoolN(layout.schoolN === 10 ? 5 : 10)}>
              Top {layout.schoolN}
            </ChipToggle>
            <ChipToggle on={rankBoard === "skill"} onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")}>
              {rankBoard === "skill" ? "By XP" : "By $"}
            </ChipToggle>
            <button type="button" onClick={() => dash.reset()} className="min-h-8 rounded-full px-3 text-[12px] font-medium text-muted hover:text-fg">
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MovePair({
  up,
  down,
  canUp,
  canDown,
  onHide,
}: {
  up: () => void;
  down: () => void;
  canUp: boolean;
  canDown: boolean;
  onHide: () => void;
}) {
  return (
    <>
      <button type="button" disabled={!canUp} onClick={up} title="Move up" className="grid size-8 place-items-center rounded-md bg-elevated text-fg disabled:opacity-30">
        <ChevronUp className="size-4" />
      </button>
      <button type="button" disabled={!canDown} onClick={down} title="Move down" className="grid size-8 place-items-center rounded-md bg-elevated text-fg disabled:opacity-30">
        <ChevronDown className="size-4" />
      </button>
      <button type="button" onClick={onHide} title="Hide row" className="grid size-8 place-items-center rounded-md bg-elevated text-fg">
        <EyeOff className="size-4" />
      </button>
    </>
  );
}

function ProcedureList({ step, compact }: { step: string; compact?: boolean }) {
  return (
    <ol className={cn("grid gap-1", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
      {DAILY_PROCEDURE.map((row) => {
        const on = row.id === step;
        return (
          <li
            key={row.id}
            className={cn(
              "flex min-h-11 items-start gap-2 rounded-md px-2 py-1.5",
              on ? "bg-gold text-bg" : compact ? "bg-elevated text-white" : "bg-elevated text-white",
            )}
          >
            <span className="font-mono text-sm font-semibold tabular-nums">{row.n}</span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide">{row.title}</span>
              {compact ? null : <span className="block text-sm opacity-90">{row.line}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function NowPane({
  kicker,
  title,
  sub,
  className,
  children,
}: {
  kicker: string;
  title: string;
  sub: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl bg-elevated px-3 py-2", className)}>
      <p className="text-xs font-medium tracking-wide text-white/80">{kicker}</p>
      <p className="mt-0.5 truncate font-display text-lg font-semibold leading-tight tracking-tight text-white">{title}</p>
      <p className="truncate text-sm text-white/90">{sub}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
