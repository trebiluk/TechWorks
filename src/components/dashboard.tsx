import { memo, startTransition, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
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
import { agendaFor, periodPaceLine, phaseIndex, prettyStage } from "@/lib/projects";
import { STEM_LABEL } from "@/lib/stems";
import { packOf, slotNow, teachDay, teachObjective } from "@/lib/teach";
import { lessonForPeriod } from "@/lib/lessons";
import { boardCardsOf, deskBellId, isSubDay, onAbRoster, schooltoolDone, setSchooltoolDone, specialsOn, visitOn, abOn } from "@/lib/store";
import { VisitChip } from "@/components/visit-chip";
import { cycleProgress, formatSchoolDate, isSchoolDay, nextOpenDay, quarterProgress, todayIso, yearProgress } from "@/lib/calendar";
import { tapeMark } from "@/lib/tape";
import { cn } from "@/lib/utils";
import { ClubPulse } from "@/components/club-pulse";
import { featureOn, setFeature, type FeatureId } from "@/lib/features";
import { bertyPose, showBerty } from "@/lib/berty";
import { procedureStep } from "@/lib/procedure";
import { hideDashRow, loadDashLayout, moveDashRow, moveDashTo, pairMate, patchDash, rowOn, saveDashLayout, DASH_ROWS, DEFAULT_LAYOUT, type DashLayout } from "@/lib/dash-layout";
import { SortableItem, SortableList } from "@/components/sortable";
import { useShopClock } from "@/lib/use-clock";
import { ProcedureCue } from "@/components/procedure-cue";
import { DashTools, ToolsToggle } from "@/components/dash-tools";
import { ProgressRing, ProgressTrio } from "@/components/progress-ring";
import { SpecialBanner } from "@/components/special-banner";
import { FeatureCards } from "@/components/feature-cards";
import { PollWall } from "@/components/polls";

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
    moveTo: (id: string, onto: string) => commit(moveDashTo(layout, id, onto)),
    setOn: (id: string, on: boolean) => commit(hideDashRow(layout, id, on)),
    setSchoolN: (n: 5 | 10) => commit(patchDash(layout, { schoolN: n })),
    setFlag: (key: keyof DashLayout, value: boolean | 5 | 10) => commit(patchDash(layout, { [key]: value } as Partial<DashLayout>)),
    reset: () => commit(DEFAULT_LAYOUT),
    on: (id: string) => rowOn(layout, id),
  };
}

function useDashFold() {
  const [closed, setClosed] = useState<Record<string, boolean>>(() => {
    try {
      return { ...DEFAULT_CLOSED, ...JSON.parse(window.localStorage.getItem(FOLD_KEY) || "{}") };
    } catch {
      return { ...DEFAULT_CLOSED };
    }
  });
  function toggle(id: string) {
    setClosed((c) => {
      const next = { ...c, [id]: !c[id] };
      try {
        window.localStorage.setItem(FOLD_KEY, JSON.stringify(next));
      } catch {
        /* */
      }
      return next;
    });
  }
  return { open: (id: string) => !closed[id], toggle };
}

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
  onHelp,
  onPrints,
  onOpenMod,
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
  onHelp?: () => void;
  onPrints?: () => void;
  onOpenMod?: (id: string) => void;
}) {
  const fold = useDashFold();
  const dash = useDashLayout();
  const { layout } = dash;
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "beat");
  const [viewP, setViewP] = useState<number | null>(null);
  const today = todayIso();
  const letter = abOn(file, today);
  const shop = useMemo(() => shopBells(file).map((b) => b.period), [file]);
  const live = periodNow(bellsId, now);
  const nxt = periodNext(bellsId, now);
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
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const agenda = agendaFor(file, shown);
  const goal = agenda.goal;
  const afterBell = isSchoolDay(today) && live == null && nxt == null;
  const openDay = nextOpenDay(today, afterBell);
  const shopLive = Boolean(clock?.live);
  const passing = isSchoolDay(today) && !shopLive && Boolean(nxt);
  const step = procedureStep({
    live: shopLive,
    cleanup: Boolean(clock?.cleanup),
    passing,
    pct: clock?.pct,
  });
  const bertyOn = showBerty(featureOn(file, "berty"), { cleanup: Boolean(clock?.cleanup), passing });
  const showProc = bertyOn && !clock?.cleanup && (passing || step === "enter" || step === "listen");
  const combo = useMemo(() => byCombo(file, list.filter((s) => s.period !== 6)), [file, list]);
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

  if (isSubDay(file, today)) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain">
        <Fold label="Now" icon={ClipboardList} hint={live != null ? `P${live}` : nxt ? `Next P${nxt.period}` : "Done"} open={fold.open("now")} onToggle={() => fold.toggle("now")} dark>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-3xl font-semibold tracking-tight text-fg">
              {live != null ? `P${live}` : nxt ? `P${nxt.period}` : "—"}
              <span className="ml-2 text-lg font-medium text-muted">{live != null ? periodTitle(live, bells) : nxt ? "next" : "done"}</span>
            </p>
            <VisitChip state="SUB" />
            <span className="font-display text-4xl font-semibold tabular-nums text-fg sm:text-5xl">
              {clock?.live ? (clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}`) : "—"}
            </span>
          </div>
        </Fold>
        <Fold label="Schedule" hint="Bells" open={fold.open("strip")} onToggle={() => fold.toggle("strip")}>
          <DayStrip schedule={bellsId} shop={shop} view={shown} now={now} specials={specialsOn(file, today)} />
        </Fold>
      </div>
    );
  }

  const nowCard = (
    <article className={cn("tw-gadget tw-hud tw-fill flex min-h-[10rem] flex-col p-3 text-fg", clock?.live ? "justify-center" : "", clock?.cleanup ? "bg-cleanup text-accent-fg" : "", clock?.live && !clock.cleanup ? "tw-live" : "")}>
      <div className="flex items-center gap-3">
        {clock?.live ? (
          <ProgressRing
            pct={clock.pct}
            label={clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}m`}
            sub={clock.cleanup ? "cleanup" : "left"}
            tone={clock.cleanup ? "warn" : "accent"}
            size="md"
            live={Boolean(clock.live)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="tw-fill-label flex flex-wrap items-center gap-2 font-semibold uppercase tracking-wider text-muted">
            <span className={cn("tw-dot", clock?.live ? "tw-dot-on" : "", clock?.cleanup ? "tw-dot-warn" : "")} />
            {clock?.live ? (clock.cleanup ? "Cleanup" : "Now") : nxt ? "Next" : "Workshop"}
            <VisitChip state={visitOn(file, today, live ?? nxt?.period ?? shown)} />
          </p>
          <p className="tw-fill-hero mt-0.5 font-display font-semibold tracking-tight">
            {clock?.live ? `P${live}` : nxt ? `P${nxt.period}` : "Done"}
          </p>
          <p className="tw-fill-line mt-1 truncate text-muted">
            {clock?.live
              ? `${periodTitle(live!, bells)} · ${formatBell(clock.start)}–${formatBell(clock.end)}`
              : nxt
                ? `${periodTitle(nxt.period, bells)} · ${formatBell(nxt.start)}`
                : `Opens ${formatSchoolDate(openDay)} P1`}
          </p>
        </div>
      </div>
      {!clock?.live ? (
        <div className="mt-auto pt-2">
          <ProgressTrio cycle={cyc} quarter={qtr} year={yr} />
        </div>
      ) : null}
      {layout.nowWeather && live == null ? <div className="mt-2"><WeatherChip /></div> : null}
    </article>
  );

  const classCard = (
    <article className="tw-gadget tw-hud tw-fill-wide flex min-h-[10rem] flex-col p-3">
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
          today={today}
          onPeriod={onPeriod}
          onOpenId={onOpenId}
          onNow={() => setViewP(null)}
          onTeach={onOpenMod ? () => onOpenMod("teach") : undefined}
          cleanup={Boolean(clock?.cleanup)}
          berty={bertyOn && shopLive && !clock?.cleanup}
        />
      ) : (
        <p className="text-sm text-muted">Tap a Tech period on the strip.</p>
      )}
    </article>
  );

  const stripCard = (
    <section className="tw-gadget p-2">
      <DayStrip
        schedule={bellsId}
        shop={shop}
        view={shown}
        now={now}
        specials={specialsOn(file, today)}
        onPeriod={(p) => {
          if (p === 6) {
            onPeriod(6);
            return;
          }
          if (unlocked) {
            onPeriod(p);
            return;
          }
          startTransition(() => {
            if (live != null && p === live) setViewP(null);
            else setViewP(p);
          });
        }}
      />
    </section>
  );

  const kpisCard = (
    <section data-kpis>
      <article className="tw-gadget tw-hud p-3">
        <div className="mb-1 flex items-center gap-2">
          <p className="font-display text-sm font-semibold">{ranked.some((s) => s.xp > 0 || s.quarter > 0) ? `School · top ${layout.schoolN}` : "In the shop"}</p>
          <button type="button" onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")} className="tw-btn-2 ml-auto min-h-8 rounded-full px-3 text-[11px] font-semibold">
            {rankBoard === "skill" ? "XP" : "$"}
          </button>
        </div>
        <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {!ranked.some((s) => s.xp > 0 || s.quarter > 0) ? (
            <li className="px-2 py-2 text-sm text-muted sm:col-span-2">Aliases score here.</li>
          ) : null}
          {ranked.slice(0, layout.schoolN).map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => onOpenId(s.id)} className={cn("flex w-full min-h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-elevated", i === 0 && "tw-podium")}>
                <span className={cn("grid size-6 place-items-center rounded-full font-mono text-xs font-bold", i === 0 ? "bg-gold text-bg" : i < 3 ? "bg-accent text-accent-fg" : "tw-readout")}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {s.first}
                  <span className="ml-1 font-normal text-muted">P{s.period}</span>
                </span>
                <XpBit xp={s.xp} level={s.level} hot />
                {rankBoard === "perk" || s.quarter ? <PerkBit n={s.quarter} hot /> : null}
              </button>
            </li>
          ))}
        </ol>
      </article>
      <article className="tw-gadget tw-hud p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Year</p>
        {onHelp ? (
          <button type="button" onClick={onHelp} className="tw-tap text-left text-xs font-semibold uppercase tracking-wider text-accent">
            How this class works
          </button>
        ) : null}
        <ProgressTrio cycle={cyc} quarter={qtr} year={yr} />
        <RewardBar file={file} period={shown} />
        {dash.on("notes") && boardCardsOf(file).some((c) => c.title.trim()) ? (
          <div>
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
  );

  return (
    <div className="tw-web-wall relative flex min-h-0 w-full flex-1 flex-col gap-1.5 overflow-hidden">
      {unlocked ? <LayoutBar dash={dash} rankBoard={rankBoard} onRankBoard={onRankBoard} /> : null}
      {stOpen || featureOn(file, "club") ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-1.5">
          {stOpen ? (
            <button
              type="button"
              onClick={() => {
                if (unlocked && onChange) onChange(setSchooltoolDone(file, today, 1, true));
                else window.open(SCHOOLTOOL_URL, "_blank", "noreferrer");
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                stLate ? "bg-cleanup text-accent-fg" : "bg-elevated text-muted",
              )}
            >
              <ClipboardList className="size-3.5" />
              {stLate ? "SchoolTool · P1 by 8:15" : "SchoolTool"}
              {unlocked ? <span className="opacity-80">tap = in</span> : null}
            </button>
          ) : null}
          {featureOn(file, "club") ? (
            <div className="min-w-0 flex-1">
              <ClubPulse onOpen={onClub} now={now} />
            </div>
          ) : null}
        </div>
      ) : null}
      <SpecialBanner file={file} date={today} now={now} />
      {showProc ? <ProcedureCue step={step} passing={passing} /> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
        <SortableList
          enabled={unlocked && layout.layoutOpen}
          className="flex min-h-0 flex-1 flex-col gap-1.5"
          onMove={(grab, onto) => dash.moveTo(grab, onto)}
        >
          {layout.order.map((id) => {
            if (id === "notes") return null;
            if (!dash.on(id)) return null;
            const sortOn = unlocked && layout.layoutOpen;
            const mate = sortOn ? null : pairMate(layout, id);
            if (mate === "second") return null;
            const paired = mate === "first";
            const fill = paired || id === "now" || id === "class";
            const body = paired ? (
              <section data-dash-pair className={cn(clock?.cleanup ? "rounded-xl ring-2 ring-cleanup" : "")}>
                {nowCard}
                {classCard}
              </section>
            ) : id === "now" ? (
              nowCard
            ) : id === "class" ? (
              classCard
            ) : id === "strip" ? (
              stripCard
            ) : id === "mods" ? (
              <FeatureCards
                file={file}
                unlocked={unlocked}
                period={shown}
                onOpen={onOpenMod}
                onToggle={
                  unlocked && onChange
                    ? (fid: FeatureId, on: boolean) => onChange(setFeature(file, fid, on))
                    : undefined
                }
              />
            ) : id === "tools" ? (
              <DashTools file={file} period={shown} />
            ) : id === "kpis" ? (
              kpisCard
            ) : null;
            const row = DASH_ROWS.find((r) => r.id === id);
            return (
              <SortableItem key={paired ? "now-class" : id} id={id} label={row?.label} className={fill ? "tw-fill-row" : "shrink-0"}>
                {body}
              </SortableItem>
            );
          })}
        </SortableList>
        <PollWall file={file} period={shown} />
      </div>
    </div>
  );
});

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
  const open = layout.layoutOpen;
  return (
    <section className="shrink-0">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => dash.setFlag("layoutOpen", !open)}
          className={cn("tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium", open ? "bg-fg text-bg" : "tw-btn-2")}
        >
          {open ? "Wall · done" : "Wall"}
        </button>
        <ToolsToggle on={dash.on("tools")} onClick={() => dash.setOn("tools", !dash.on("tools"))} />
        <button type="button" onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")} className="tw-btn-2 min-h-8 rounded-full px-3 text-[12px]">
          Rank {rankBoard === "skill" ? "XP" : "$"}
        </button>
      </div>
      {open ? <p className="mt-1 text-xs text-muted">Drag a plate by the grip. Now and Goals sit side by side when they are neighbors.</p> : null}
      {open ? (
        <ul className="mt-1 grid max-h-32 gap-1 overflow-y-auto rounded-xl bg-elevated p-2 sm:grid-cols-2">
          {DASH_ROWS.map((row) => {
            const on = dash.on(row.id);
            const i = layout.order.indexOf(row.id);
            return (
              <li key={row.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => dash.setOn(row.id, !on)}
                  className={cn("tw-tap min-h-10 flex-1 rounded-lg px-3 text-left text-sm font-semibold", on ? "bg-fg text-bg" : "bg-bg text-muted")}
                >
                  {on ? "On · " : "Off · "}
                  {row.label}
                </button>
                <button type="button" disabled={i <= 0} onClick={() => dash.move(row.id, -1)} className="tw-tap grid size-10 place-items-center rounded-lg bg-bg text-muted disabled:opacity-25" title="Up">
                  ↑
                </button>
                <button type="button" disabled={i >= layout.order.length - 1} onClick={() => dash.move(row.id, 1)} className="tw-tap grid size-10 place-items-center rounded-lg bg-bg text-muted disabled:opacity-25" title="Down">
                  ↓
                </button>
              </li>
            );
          })}
          <li className="flex flex-wrap gap-1 sm:col-span-2">
            <button type="button" onClick={() => dash.setSchoolN(layout.schoolN === 5 ? 10 : 5)} className="tw-btn-2 min-h-10 rounded-full px-3 text-xs">
              Top {layout.schoolN}
            </button>
            <button type="button" onClick={() => dash.reset()} className="tw-btn-2 min-h-10 rounded-full px-3 text-xs">
              Reset wall
            </button>
          </li>
        </ul>
      ) : null}
    </section>
  );
}

function GoalsCard({
  file,
  shown,
  goal,
  agenda,
  todayHit,
  viewKids,
  unlocked,
  peeking,
  live,
  today,
  onPeriod,
  onOpenId,
  onNow,
  onTeach,
  cleanup,
  berty,
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
  today: string;
  onPeriod: (p: number) => void;
  onOpenId: (id: string) => void;
  onNow: () => void;
  onTeach?: () => void;
  cleanup?: boolean;
  berty?: boolean;
}) {
  const pace = periodPaceLine(file, shown);
  const pack = packOf(file, today, shown);
  const day = teachDay(file, today, shown);
  const lesson = lessonForPeriod(file, today, shown, pack.id, day.objective);
  const slot = live === shown ? slotNow(file, today, shown) : null;
  const obj = (day.objective || teachObjective(file, today, shown) || "").trim();
  const project = agenda.title || lesson?.title || "Today";
  const stage = prettyStage(goal) || agenda.activityName || "";
  const nowLine = slot?.line || obj || stage || "Sit with your crew.";
  const goalIdx = Math.max(1, phaseIndex(pace.goal || goal));
  const lanes = [...pace.rows].sort((a, b) => phaseIndex(b.current) - phaseIndex(a.current));
  const sameStage = lanes.length > 0 && lanes.every((c) => prettyStage(c.current) === prettyStage(lanes[0].current));
  return (
    <div data-goals className="relative">
      {cleanup ? <Berty pose="point" size="sm" alert className="absolute -top-1 right-0 z-10" /> : null}
      {berty ? <BertyPeek pose={bertyPose({ live: true, slot: slot?.kind ?? "work" })} className="absolute -top-1 right-0 z-10" /> : null}
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="tw-fill-label font-bold uppercase tracking-[0.18em] text-gold">
              P{shown}
              {stage ? <span className="text-muted"> · {stage}</span> : null}
              {slot ? <span className="text-subtle"> · {Math.max(1, slot.mins)}m</span> : null}
            </p>
            <button type="button" onClick={onTeach} className="block w-full text-left" disabled={!onTeach}>
              <p className="tw-fill-hero font-display font-semibold tracking-tight">{project}</p>
            </button>
            {agenda.project?.prompt ? <p className="mt-1 text-sm text-gold">{agenda.project.prompt}</p> : null}
            {agenda.project?.stem?.length ? (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-subtle">
                {agenda.project.stem.map((L) => STEM_LABEL[L]).join(" · ")}
              </p>
            ) : null}
            <p className="tw-fill-line mt-2">{nowLine}</p>
            {day.notes && day.notes !== nowLine && day.notes !== obj ? (
              <p className="mt-0.5 text-sm text-muted">{day.notes}</p>
            ) : null}
            <p className="mt-1 font-mono text-xs tabular-nums text-subtle">
              {todayHit.scored}/{todayHit.n} scored
              {todayHit.blank ? ` · ${todayHit.blank} left` : ""}
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
        {lanes.length ? (
          sameStage ? (
            <p className="mt-3 truncate text-sm text-muted">{lanes.map((c) => c.name).join(" · ")}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {lanes.map((c, i) => {
                const idx = phaseIndex(c.current);
                const pct = Math.min(100, Math.round(((idx + 1) / (goalIdx + 1)) * 100));
                return (
                  <li key={c.key} className="flex flex-col items-center text-center">
                    <ProgressRing pct={Math.max(8, pct)} label={`${pct}`} sub={c.name} tone={i === 0 ? "gold" : c.lag > 0 ? "warn" : "gain"} size="sm" />
                    <span className="mt-0.5 text-[10px] text-muted">{prettyStage(c.current) || "—"}</span>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <p className="mt-3 text-sm text-muted">No crews yet.</p>
        )}
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-1">
        <div className="rounded-lg bg-elevated px-2.5 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Reward</p>
          <PeriodRewardChip file={file} period={shown} className="mt-1" />
        </div>
        <div className="rounded-lg bg-elevated px-2.5 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Top 3</p>
          <ol className="mt-1 space-y-1">
            {viewKids.length ? viewKids.slice(0, 3).map((s, i) => (
              <li key={s.id}>
                <button type="button" disabled={!unlocked} onClick={() => onOpenId(s.id)} className="flex w-full min-h-9 items-center gap-1.5 text-left disabled:cursor-default">
                  <span className="w-3 font-mono text-xs text-subtle">{i + 1}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-sm", i === 0 ? "font-semibold" : "")}>{s.first}</span>
                  <XpBit xp={s.xp} level={s.level} hot />
                  {s.quarter ? <PerkBit n={s.quarter} hot /> : null}
                </button>
              </li>
            )) : (
              <li className="text-sm text-muted">No aliases yet.</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
