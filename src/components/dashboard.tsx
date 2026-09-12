import { memo, startTransition, useMemo, useState } from "react";
import { ClipboardList, Coins, RotateCcw, Trophy } from "lucide-react";
import { markOf } from "@/lib/nav-marks";
import { MarkChip } from "@/components/ui";
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
import { agendaFor, jobCardOf, periodPaceLine, phaseIndex, prettyStage } from "@/lib/projects";
import { JobCard } from "@/components/job-card";
import { ppeOn, setPpe } from "@/lib/ppe";
import { dayCardsOn, deskBellId, isSubDay, onAbRoster, schooltoolDone, setSchooltoolDone, specialsOn, visitOn, abOn, cycleVisit } from "@/lib/store";
import { VisitChip } from "@/components/visit-chip";
import { cycleProgress, formatSchoolDate, isSchoolDay, nextOpenDay, quarterProgress, todayIso, yearProgress } from "@/lib/calendar";
import { tapeMark } from "@/lib/tape";
import { cn } from "@/lib/utils";
import { ClubPulseCard } from "@/components/club-pulse";
import { clubPulse, loadClub } from "@/lib/club";
import { pollForPeriod } from "@/lib/polls";
import { featureOn } from "@/lib/features";
import { bertyPose, showBerty } from "@/lib/berty";
import { procedureStep } from "@/lib/procedure";
import { hideDashRow, loadDashLayout, moveDashRow, moveDashTo, pairMate, patchDash, rowOn, saveDashLayout, DASH_ROWS, DEFAULT_LAYOUT, type DashLayout, type DashRowId } from "@/lib/dash-layout";
import { SortableItem, SortableList } from "@/components/sortable";
import { useShopClock } from "@/lib/use-clock";
import { ProcedureCue } from "@/components/procedure-cue";
import { DashTools, ToolsToggle } from "@/components/dash-tools";
import { ProgressRing, ProgressTrio } from "@/components/progress-ring";
import { SpecialBanner } from "@/components/special-banner";
import { FeatureCards } from "@/components/feature-cards";
import { PollWall } from "@/components/polls";
import { useLang } from "@/lib/i18n-hook";
import { avatarOf } from "@/lib/avatars";

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
  arrange = false,
  onSeeWall,
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
  arrange?: boolean;
  onSeeWall?: () => void;
}) {
  const { t } = useLang();
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
  const pulse = useMemo(() => (featureOn(file, "club") ? clubPulse(loadClub(), today, now) : null), [file, today, now]);
  const specials = specialsOn(file, today);
  const notes = useMemo(() => dayCardsOn(file, today).filter((c) => c.title.trim()), [file, today]);
  const poll = pollForPeriod(file, shown);
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
        <Fold label={t("Now")} icon={ClipboardList} hint={live != null ? `P${live}` : nxt ? `${t("Next")} P${nxt.period}` : t("done")} open={fold.open("now")} onToggle={() => fold.toggle("now")} dark>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-3xl font-semibold tracking-tight text-fg">
              {live != null ? `P${live}` : nxt ? `P${nxt.period}` : "—"}
              <span className="ml-2 text-lg font-medium text-muted">{live != null ? periodTitle(live, bells) : nxt ? t("next") : t("done")}</span>
            </p>
            <VisitChip state="SUB" />
            <span className="font-display text-4xl font-semibold tabular-nums text-fg sm:text-5xl">
              {clock?.live ? (clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}`) : "—"}
            </span>
          </div>
        </Fold>
        <Fold label={t("Schedule")} hint="Bells" open={fold.open("strip")} onToggle={() => fold.toggle("strip")}>
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
            label={clock.cleanup ? t("NOW") : `${Math.max(0, Math.ceil(clock.left))}m`}
            sub={clock.cleanup ? t("cleanup") : t("left")}
            tone={clock.cleanup ? "warn" : "accent"}
            size="md"
            live={Boolean(clock.live)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="tw-fill-label flex flex-wrap items-center gap-2 font-semibold uppercase tracking-wider text-muted">
            <span className={cn("tw-dot", clock?.live ? "tw-dot-on" : "", clock?.cleanup ? "tw-dot-warn" : "")} />
            {clock?.live ? (clock.cleanup ? t("Cleanup") : t("Now")) : nxt ? t("Next") : t("Workshop")}
            <VisitChip
              state={visitOn(file, today, live ?? nxt?.period ?? shown)}
              onClick={
                arrange && unlocked && onChange
                  ? () => onChange(cycleVisit(file, today, live ?? nxt?.period ?? shown))
                  : undefined
              }
            />
          </p>
          <p className="tw-fill-hero mt-0.5 font-display font-semibold tracking-tight">
            {clock?.live ? `P${live}` : nxt ? `P${nxt.period}` : t("done")}
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
      {featureOn(file, "weather") && live == null ? <div className="mt-2"><WeatherChip /></div> : null}
    </article>
  );

  const classCard = (
    <article data-job-plate className="tw-gadget tw-hud tw-fill-wide flex min-h-[10rem] flex-col p-3">
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
          edit={arrange}
          peeking={peeking}
          live={live}
          today={today}
          onPeriod={onPeriod}
          onOpenId={onOpenId}
          onNow={() => setViewP(null)}
          onTeach={onOpenMod ? () => onOpenMod("teach") : undefined}
          cleanup={Boolean(clock?.cleanup)}
          berty={bertyOn && shopLive && !clock?.cleanup}
          onChange={onChange}
        />
      ) : (
        <p className="text-sm text-muted">{t("Tap a Tech period on the strip.")}</p>
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
          <p className="font-display text-sm font-semibold">{ranked.some((s) => s.xp > 0 || s.quarter > 0) ? `${t("School")} · top ${layout.schoolN}` : t("In the shop")}</p>
          {arrange ? (
          <button type="button" onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")} className="tw-btn-2 ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold">
            {rankBoard === "skill" ? <Trophy className="size-3.5" aria-hidden /> : <Coins className="size-3.5" aria-hidden />}
            {rankBoard === "skill" ? "XP" : "$"}
          </button>
          ) : null}
        </div>
        <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {!ranked.some((s) => s.xp > 0 || s.quarter > 0) ? (
            unlocked ? (
              <li className="px-2 py-2 text-sm text-muted sm:col-span-2">{arrange ? t("Aliases score here.") : `${t("This desk lives on the shop PC.")} ${t("Open that computer to see the class.")}`}</li>
            ) : (
              <li className="px-2 py-2 text-sm text-muted sm:col-span-2">
                {t("This desk lives on the shop PC.")} {t("Open that computer to see the class.")}
              </li>
            )
          ) : null}
          {ranked.some((s) => s.xp > 0 || s.quarter > 0) && layout.rankCards ? (
            <ol className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ranked.slice(0, 3).map((s, i) => (
                <li key={`star-${s.id}`}>
                  <button
                    type="button"
                    onClick={() => onOpenId(s.id)}
                    className={cn(
                      "flex min-h-24 w-full flex-col justify-center rounded-xl px-3 py-3 text-left",
                      i === 0 ? "bg-gold text-bg" : i === 1 ? "bg-accent text-accent-fg" : "bg-elevated",
                    )}
                  >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest opacity-80">Top {i + 1}</span>
                    <span className="font-display text-2xl font-semibold leading-none">{s.first}</span>
                    <span className="mt-1 font-mono text-sm tabular-nums">
                      {rankBoard === "perk" ? `$${Math.round(s.quarter)}` : `${s.xp} XP`}
                      <span className="ml-1 opacity-70">P{s.period}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          {ranked.some((s) => s.xp > 0 || s.quarter > 0)
            ? ranked.slice(layout.rankCards ? 3 : 0, layout.schoolN).map((s, i) => {
            const n = (layout.rankCards ? 3 : 0) + i;
            return (
            <li key={s.id}>
              <button type="button" onClick={() => onOpenId(s.id)} className={cn("flex w-full min-h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-elevated", n === 0 && "tw-podium")}>
                <span className={cn("grid size-6 place-items-center rounded-full font-mono text-xs font-bold", n === 0 ? "bg-gold text-bg" : n < 3 ? "bg-accent text-accent-fg" : "tw-readout")}>{n + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {s.first}
                  <span className="ml-1 font-normal text-muted">P{s.period}</span>
                </span>
                <XpBit xp={s.xp} level={s.level} hot />
                {rankBoard === "perk" || s.quarter ? <PerkBit n={s.quarter} hot /> : null}
              </button>
            </li>
            );
            })
            : null}
        </ol>
      </article>
      <article className="tw-gadget tw-hud p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{t("Year")}</p>
        {onHelp ? (
          <button type="button" onClick={onHelp} className="tw-tap text-left text-xs font-semibold uppercase tracking-wider text-accent">
            {t("How this class works")}
          </button>
        ) : null}
        <ProgressTrio cycle={cyc} quarter={qtr} year={yr} />
        {featureOn(file, "reward") ? <RewardBar file={file} period={shown} /> : null}
      </article>
    </section>
  );

  const sortOn = arrange;

  function ghost(label: string) {
    return (
      <article className="tw-gadget px-3 py-2 text-sm text-muted">
        {label} · {t("None today")}
      </article>
    );
  }

  function plateOf(id: DashRowId) {
    if (id === "now") return nowCard;
    if (id === "class") return classCard;
    if (id === "proc") return <ProcedureCue step={step} passing={passing} bot={bertyOn} left={clock?.live ? Math.max(0, Math.ceil(clock.left)) : undefined} cleanup={Boolean(clock?.cleanup)} />;
    if (id === "strip") return stripCard;
    if (id === "club") {
      if (!pulse) return sortOn ? ghost(t("Club")) : null;
      return (
        <section className="tw-gadget p-1.5">
          <ClubPulseCard pulse={pulse} onOpen={onClub} />
        </section>
      );
    }
    if (id === "specials") return specials.length ? <SpecialBanner file={file} date={today} now={now} /> : sortOn ? ghost(t("Specials")) : null;
    if (id === "mods") {
      return (
        <FeatureCards
          file={file}
          unlocked={unlocked}
          period={shown}
          onOpen={onOpenMod}
        />
      );
    }
    if (id === "tools") return <DashTools file={file} period={shown} />;
    if (id === "notes") {
      if (!notes.length) return sortOn ? ghost(t("Announce")) : null;
      return (
        <article className="tw-gadget p-3">
          <p className="tw-fill-label font-semibold uppercase tracking-wider text-muted">{t("Announce")}</p>
          {notes.slice(0, 2).map((c, i) => (
            <p key={i} className="mt-1 text-sm">
              <span className="font-semibold">{c.title}</span>
              {c.body ? <span className="text-muted"> · {c.body}</span> : null}
            </p>
          ))}
        </article>
      );
    }
    if (id === "kpis") {
      if (!file.students.length && !sortOn && !unlocked) return null;
      return kpisCard;
    }
    if (id === "poll") return poll ? <PollWall file={file} period={shown} /> : sortOn ? ghost(t("Poll")) : null;
    return null;
  }

  return (
    <div className={cn("tw-web-wall relative flex w-full flex-1 flex-col gap-1.5", arrange ? "overflow-auto" : "min-h-0 overflow-hidden")} data-wall-stage={arrange ? "edit" : "show"}>
      {arrange ? <LayoutBar dash={dash} rankBoard={rankBoard} onRankBoard={onRankBoard} onSeeWall={onSeeWall} /> : null}
      {arrange && stOpen ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-1.5">
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
            SchoolTool{stLate ? <span className="hidden sm:inline"> · P1 by 8:15</span> : null}
            {unlocked ? <span className="opacity-80">tap = in</span> : null}
          </button>
        </div>
      ) : null}
      <div className={cn("flex flex-col gap-1.5", arrange ? "" : "min-h-0 flex-1 overflow-auto")}>
        <SortableList
          enabled={sortOn}
          className={cn("flex flex-col gap-1.5", arrange ? "" : "min-h-0 flex-1")}
          onMove={(grab, onto) => dash.moveTo(grab, onto)}
        >
          {layout.order.map((id) => {
            if (!dash.on(id)) return null;
            const mate = sortOn ? null : pairMate(layout, id);
            if (mate === "second") return null;
            const paired = mate === "first";
            const fill = paired || id === "now" || id === "class";
            const body = paired ? (
              <section data-dash-pair className={cn(clock?.cleanup ? "rounded-xl ring-2 ring-cleanup" : "")}>
                {nowCard}
                {classCard}
              </section>
            ) : (
              plateOf(id)
            );
            if (!body) return null;
            const row = DASH_ROWS.find((r) => r.id === id);
            return (
              <SortableItem key={paired ? "now-class" : id} id={id} label={row ? t(row.label) : undefined} className={fill ? "tw-fill-row" : "shrink-0"} onHide={() => dash.setOn(id, false)}>
                {body}
              </SortableItem>
            );
          })}
        </SortableList>
      </div>
    </div>
  );
});

function LayoutBar({
  dash,
  rankBoard,
  onRankBoard,
  onSeeWall,
}: {
  dash: ReturnType<typeof useDashLayout>;
  rankBoard: "skill" | "perk";
  onRankBoard: (next: "skill" | "perk") => void;
  onSeeWall?: () => void;
}) {
  const { layout } = dash;
  const hidden = layout.order.filter((id) => !dash.on(id));
  return (
    <section className="shrink-0 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {onSeeWall ? (
          <MarkChip mark={markOf("wall")} title="Hang the projector" onClick={onSeeWall} className="bg-fg text-bg hover:text-bg">
            See wall
          </MarkChip>
        ) : null}
        <ToolsToggle on={dash.on("tools")} onClick={() => dash.setOn("tools", !dash.on("tools"))} />
        <MarkChip mark={rankBoard === "skill" ? Trophy : Coins} title="Rank" onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")}>
          Rank {rankBoard === "skill" ? "XP" : "$"}
        </MarkChip>
        <MarkChip mark={Trophy} title="Top list" on={layout.schoolN === 10} onClick={() => dash.setSchoolN(layout.schoolN === 5 ? 10 : 5)}>
          Top {layout.schoolN}
        </MarkChip>
        <MarkChip mark={Trophy} title="Rock-star cards" on={layout.rankCards} onClick={() => dash.setFlag("rankCards", !layout.rankCards)}>
          Cards
        </MarkChip>
        <MarkChip mark={RotateCcw} title="Reset wall" onClick={() => dash.reset()}>
          Reset
        </MarkChip>
      </div>
      {hidden.length ? (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Show</span>
          {hidden.map((id) => {
            const row = DASH_ROWS.find((r) => r.id === id);
            if (!row) return null;
            return (
              <MarkChip key={id} mark={markOf(id)} title={`Show ${row.label}`} onClick={() => dash.setOn(id, true)}>
                {row.label}
              </MarkChip>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function GoalsCard({
  file,
  shown,
  todayHit,
  viewKids,
  unlocked,
  edit = false,
  peeking,
  live,
  onPeriod,
  onOpenId,
  onNow,
  onTeach,
  cleanup,
  berty,
  onChange,
}: {
  file: EconomyFile;
  shown: number;
  bells: Bell[];
  goal: string;
  agenda: ReturnType<typeof agendaFor>;
  todayHit: { scored: number; blank: number; n: number };
  viewKids: { id: string; first: string; xp: number; level: number; quarter: number; icon?: string }[];
  unlocked: boolean;
  edit?: boolean;
  peeking: boolean;
  live: number | null;
  today: string;
  onPeriod: (p: number) => void;
  onOpenId: (id: string) => void;
  onNow: () => void;
  onTeach?: () => void;
  cleanup?: boolean;
  berty?: boolean;
  onChange?: (next: EconomyFile) => void;
}) {
  const { t } = useLang();
  const job = jobCardOf(file, shown);
  const pace = periodPaceLine(file, shown);
  const lanes = [...pace.rows].sort((a, b) => phaseIndex(b.current) - phaseIndex(a.current));
  const sameStage = lanes.length > 0 && lanes.every((c) => prettyStage(c.current) === prettyStage(lanes[0].current));
  const hasRanks = viewKids.some((s) => s.xp > 0 || s.quarter > 0);
  const gogglesOn = ppeOn(file, shown);
  const desk = unlocked && edit;
  const actions = (
    <>
      {peeking && live != null ? (
        <button type="button" onClick={onNow} className="min-h-11 shrink-0 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
          P{live}
        </button>
      ) : null}
      {desk ? (
        <button type="button" title={t("Score")} onClick={() => onPeriod(shown)} className="min-h-11 shrink-0 rounded-md bg-fg px-3 text-sm font-semibold text-bg">
          {t("Score")}
        </button>
      ) : null}
    </>
  );
  return (
    <div data-goals className="relative flex min-h-0 flex-1 flex-col">
      {cleanup ? <Berty pose="point" size="sm" alert className="absolute -top-1 right-0 z-10" /> : null}
      {berty ? <BertyPeek pose={bertyPose({ live: true, slot: "work" })} className="absolute -top-1 right-0 z-10" /> : null}
      <JobCard
        job={job}
        period={shown}
        onTeach={onTeach}
        actions={actions}
        ppeOn={gogglesOn}
        onPpe={desk && onChange ? () => onChange(setPpe(file, shown, !gogglesOn)) : undefined}
      />
      {desk && todayHit.n > 0 ? (
        <p className="mt-2 font-mono text-xs tabular-nums text-subtle">
          {todayHit.scored}/{todayHit.n} {t("scored")}
          {todayHit.blank ? ` · ${todayHit.blank} ${t("left")}` : ""}
        </p>
      ) : desk && todayHit.n === 0 ? (
        <p className="mt-2 text-xs text-muted">{t("This desk lives on the shop PC.")}</p>
      ) : null}
      {lanes.length ? (
        sameStage || !desk ? (
          <p className="mt-2 truncate text-sm text-muted">{lanes.map((c) => c.name).join(" · ")}</p>
        ) : (
          <p className="mt-2 truncate text-sm text-muted">{lanes.map((c) => `${c.name} · ${prettyStage(c.current)}`).join(" · ")}</p>
        )
      ) : desk ? (
        <p className="mt-2 text-sm text-muted">{t("No crews yet.")}</p>
      ) : null}
      {hasRanks ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-1">
          {featureOn(file, "reward") ? (
          <div className="rounded-lg bg-elevated px-2.5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{t("Reward")}</p>
            <PeriodRewardChip file={file} period={shown} className="mt-1" />
          </div>
          ) : null}
          <div className="rounded-lg bg-elevated px-2.5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{t("Top 3")}</p>
            <ol className="mt-1 space-y-1">
              {viewKids.slice(0, 3).map((s, i) => (
                <li key={s.id}>
                  <button type="button" disabled={!unlocked} onClick={() => onOpenId(s.id)} className="flex w-full min-h-9 items-center gap-1.5 text-left disabled:cursor-default">
                    <span className="w-3 font-mono text-xs text-subtle">{i + 1}</span>
                    <span className="text-base" aria-hidden>
                      {avatarOf(s.icon, s.id)}
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate text-sm", i === 0 ? "font-semibold text-gold" : "")}>{s.first}</span>
                    <XpBit xp={s.xp} level={s.level} hot />
                    {s.quarter ? <PerkBit n={s.quarter} hot /> : null}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
