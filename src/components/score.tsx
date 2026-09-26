import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Cog,
  Cpu,
  Flame,
  Lock,
  Minus,
  Monitor,
  ShieldCheck,
  Star,
  Undo2,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import type { DayCode, EconomyFile, RawStudent } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay, scoreDate as nearestScoreDate, stepSchoolDay, todayIso } from "@/lib/calendar";
import { deskBellId, isSubDay, loadFocus, markOn, setCrewMark } from "@/lib/store";
import { tapeMark } from "@/lib/tape";
import { periodNow } from "@/lib/bells";
import { cn } from "@/lib/utils";
import { crewDone, crewsOf, type CrewRow } from "@/lib/crews";
import { crewEffortMark, crewGlyphId, isEffortMark, type CrewGlyphId, type EffortMark } from "@/lib/score-pad";
import { acceptTicket, answerTicket, readTicket } from "@/lib/ticket";

const GLYPH: Record<CrewGlyphId, LucideIcon> = {
  flame: Flame,
  zap: Zap,
  wrench: Wrench,
  cog: Cog,
  cpu: Cpu,
  users: Users,
};

export function CrewHex({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  const Icon = GLYPH[crewGlyphId(name)];
  return (
    <span data-score-hex data-score-hex-size={size} aria-hidden>
      <Icon strokeWidth={2.2} />
    </span>
  );
}

function padMark(s: RawStudent, date: string): string {
  return markOn(s, date) || tapeMark(s.markTape, date);
}

function markIcon(code: EffortMark, on: boolean, fat: boolean): LucideIcon {
  if (fat) {
    if (on) return CircleCheck;
    if (code === "1") return Minus;
    return Star;
  }
  if (on || code === "3") return Star;
  return Check;
}

function FatMark({
  code,
  on,
  fat,
  disabled,
  onClick,
}: {
  code: EffortMark;
  on: boolean;
  fat?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = markIcon(code, on, Boolean(fat));
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Crew mark ${code}`}
      data-score-mark={code}
      data-score-on={on ? "1" : "0"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "tw-tap relative flex min-h-11 items-center justify-center gap-1.5 font-display font-semibold",
        fat ? "min-h-[9rem] flex-1 flex-col text-6xl sm:text-7xl" : "h-full min-h-11 text-2xl sm:text-3xl",
      )}
    >
      <Icon
        className={cn("shrink-0", fat ? "size-8 sm:size-10" : "size-4 sm:size-5")}
        strokeWidth={on ? 2.6 : 2}
        fill={on && !fat ? "currentColor" : "none"}
        aria-hidden
      />
      <span className="font-mono tabular-nums leading-none">{code}</span>
    </button>
  );
}

export function ScoreDesk({
  file,
  onChange,
  unlocked: _unlocked,
  onNeedPin: _onNeedPin,
  onOpenId: _onOpenId,
  jumpPeriod,
  jumpCrew,
  jumpDate,
  onOpenSettings,
  mode = "teacher",
  panel = "score",
  startPad: _startPad = "effort",
  onRankUp: _onRankUp,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  unlocked: boolean;
  onNeedPin: () => void;
  onOpenId: (id: string) => void;
  jumpPeriod?: number | null;
  jumpCrew?: string | null;
  jumpDate?: string | null;
  onOpenSettings: () => void;
  mode?: "teacher" | "crew";
  panel?: "score" | "schedule" | "config";
  startPad?: "effort" | "skill";
  onRankUp?: (alias: string, band: string) => void;
}) {
  const bells = shopBells(file);
  const crewMode = mode === "crew";
  const [date, setDate] = useState(() => nearestScoreDate());
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const periodCrews = crewsOf(file, period, date).filter((c) => c.kids.length > 0);
  const [crewKey, setCrewKey] = useState(jumpCrew || periodCrews[0]?.key || "Crew A");
  const undoRef = useRef<EconomyFile | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const bellsId = deskBellId(file, date);
  const livePeriod = periodNow(bellsId);
  const sub = isSubDay(file, date);

  useEffect(() => {
    if (panel === "config") onOpenSettings();
  }, [panel]);

  useEffect(() => {
    if (jumpPeriod && bells.some((b) => b.period === jumpPeriod)) {
      setPeriod(jumpPeriod);
      if (jumpDate) setDate(jumpDate);
      const crews = crewsOf(file, jumpPeriod, jumpDate || date);
      const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, jumpDate || date)) || crews[0];
      if (next) setCrewKey(next.key);
      return;
    }
    const live = periodNow(bellsId);
    if (live && bells.some((b) => b.period === live)) {
      setPeriod(live);
      const crews = crewsOf(file, live, date);
      const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, date)) || crews[0];
      setCrewKey(next?.key ?? "Crew A");
      return;
    }
    const focus = loadFocus();
    if (!focus) return;
    if (bells.some((b) => b.period === focus.period)) {
      setPeriod(focus.period);
      setCrewKey(jumpCrew || focus.crewKey);
    }
  }, [jumpPeriod, jumpCrew, jumpDate]);

  useEffect(() => {
    if (!crewMode) return;
    setDate(isSchoolDay(todayIso()) ? todayIso() : nearestScoreDate());
  }, [crewMode]);

  useEffect(() => {
    if (!crewMode) return;
    if (livePeriod && livePeriod !== 6) {
      setPeriod(livePeriod);
    }
  }, [crewMode, livePeriod]);

  useEffect(() => {
    if (jumpCrew) setCrewKey(jumpCrew);
  }, [jumpCrew]);

  const visibleCrews = crewMode ? periodCrews.filter((c) => c.key === (jumpCrew || crewKey)) : periodCrews;
  const liveTech = livePeriod != null && livePeriod !== 6 && period === livePeriod;
  const scoringLocked = crewMode && !liveTech;

  function pickPeriod(p: number) {
    if (crewMode && p !== livePeriod) return;
    setPeriod(p);
    const crews = crewsOf(file, p, date);
    const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, date)) || crews[0];
    setCrewKey(next?.key ?? "Crew A");
  }

  function commit(next: EconomyFile) {
    undoRef.current = file;
    setCanUndo(true);
    onChange(next);
  }

  function undoLast() {
    if (!undoRef.current) return;
    onChange(undoRef.current);
    undoRef.current = null;
    setCanUndo(false);
  }

  function tapCrew(row: CrewRow, code: EffortMark) {
    if (sub || scoringLocked) return;
    const cur = crewEffortMark(row.kids.map((s) => padMark(s, date)));
    const next = cur === code ? ("" as DayCode) : code;
    commit(setCrewMark(file, period, row.key, date, next));
  }

  const n = visibleCrews.length;
  const twoCol = !crewMode && n > 6;

  const pad = (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", crewMode ? "bg-bg p-2" : "")}
      data-score-pad={crewMode ? "crew" : "teacher"}
    >
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-2">
        {crewMode ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Score <span className="text-fg/50">·</span> crew lead <span className="text-fg/50">·</span> PIN locked{" "}
              <span className="text-fg/50">·</span> period P{period} chip
            </p>
            <span data-score-period-chip className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg">
              <Cpu className="size-3.5" aria-hidden />
              P{period}
            </span>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Score <span className="text-muted">·</span> 40s
            </h1>
            <p className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Monitor className="size-3.5" aria-hidden />
              Chromebook · 1366×768
            </p>
          </>
        )}
      </header>

      {crewMode ? null : (
        <div data-periods className="flex shrink-0 flex-wrap items-center gap-1.5 px-1 pb-2">
          {bells.map((b) => {
            const crews = crewsOf(file, b.period, date);
            const done = crews.filter((c) => crewDone(c.kids, date)).length;
            const live = livePeriod === b.period;
            const on = period === b.period;
            return (
              <button
                key={b.period}
                type="button"
                onClick={() => pickPeriod(b.period)}
                aria-pressed={on}
                className={cn("tw-tap score-period-chip inline-flex min-h-11 shrink-0 items-center px-4 text-sm font-semibold", on && "is-on", live && !on && "is-live")}
                title={`${done}/${crews.length} crews scored`}
              >
                P{b.period}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <button type="button" aria-label="Previous school day" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:text-fg" onClick={() => setDate(stepSchoolDay(date, -1))}>
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-muted">{formatSchoolDate(date)}</span>
            <button type="button" aria-label="Next school day" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:text-fg" onClick={() => setDate(stepSchoolDay(date, 1))}>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {sub ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-surface p-8 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-work-pto">Sub day</p>
            <p className="mt-2 font-display text-3xl font-semibold">No scores today</p>
          </div>
        </div>
      ) : !visibleCrews.length ? (
        <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted">No crews this period.</p>
      ) : crewMode ? (
        <LeadPad
          crew={visibleCrews[0]!}
          date={date}
          period={period}
          file={file}
          locked={scoringLocked}
          lockLine={
            livePeriod === 6 ? "Study hall · Tech crews after." : livePeriod ? `P${livePeriod} only. Wait for your class.` : "Between classes. Lock when done."
          }
          onTap={(code) => tapCrew(visibleCrews[0]!, code)}
          onAnswer={(pick) => commit(answerTicket(file, date, period, visibleCrews[0]!.key, pick))}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          <TicketAccept
            file={file}
            date={date}
            period={period}
            crews={visibleCrews}
            onAccept={(key) => commit(acceptTicket(file, date, period, key))}
          />
        <div
          data-score-crews
          className={cn("grid min-h-0 flex-1 gap-1.5 overflow-hidden px-1", twoCol ? "grid-cols-2" : "grid-cols-1")}
          style={{ gridTemplateRows: `repeat(${twoCol ? Math.ceil(n / 2) : n}, minmax(2.75rem, 1fr))` }}
        >
          {visibleCrews.map((c) => {
            const mark = crewEffortMark(c.kids.map((s) => padMark(s, date)));
            return (
              <div key={c.key} data-score-crew={c.key} className="score-crew-row grid min-h-11 grid-cols-[minmax(8rem,0.9fr)_repeat(3,minmax(2.75rem,1fr))] items-stretch gap-2 overflow-hidden">
                <div className="flex min-w-0 items-center gap-3 px-1">
                  <CrewHex name={c.name || c.key} />
                  <p className="truncate font-display text-lg font-semibold leading-tight sm:text-xl">{c.name}</p>
                  {isEffortMark(mark) ? <span className="sr-only">{mark}</span> : null}
                </div>
                {(["3", "2", "1"] as const).map((code) => (
                  <FatMark key={code} code={code} on={mark === code} onClick={() => tapCrew(c, code)} />
                ))}
              </div>
            );
          })}
        </div>
        </div>
      )}

      <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-1 pt-2 pb-[env(safe-area-inset-bottom)] text-[11px] font-semibold uppercase tracking-wide text-muted">
        {crewMode ? (
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-accent" aria-hidden />
            Your crew only <span className="text-fg/40">·</span> mark = score <span className="text-fg/40">·</span> behind PIN
            <Lock className="size-3.5" aria-hidden />
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-3.5 text-accent" fill="currentColor" aria-hidden />
              Mark = crew score
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" aria-hidden />
              mark ≠ wallet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden />
              Present only
            </span>
            {n >= 6 ? <span className="ml-auto">6 crews one screen</span> : null}
            <button type="button" disabled={!canUndo} onClick={undoLast} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-muted disabled:opacity-40">
              <Undo2 className="size-3.5" />
              Undo
            </button>
          </>
        )}
      </footer>
    </div>
  );

  return pad;
}

function LeadPad({
  crew,
  date,
  period,
  file,
  locked,
  lockLine,
  onTap,
  onAnswer,
}: {
  crew: CrewRow;
  date: string;
  period: number;
  file: EconomyFile;
  locked?: boolean;
  lockLine?: string;
  onTap: (code: EffortMark) => void;
  onAnswer: (pick: string) => void;
}) {
  const mark = crewEffortMark(crew.kids.map((s) => padMark(s, date)));
  const school = isSchoolDay(date);
  const ticket = readTicket(file, date, period, crew.key);
  return (
    <section data-score-crews data-score-crew={crew.key} data-score-lead className="score-lead-card flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <CrewHex name={crew.name || crew.key} size="lg" />
        <div className="min-w-0">
          <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{crew.name}</p>
          <p className="text-sm text-muted">Crew · TechWorks{school ? "" : " · not a school day"}</p>
        </div>
      </div>
      {locked && lockLine ? (
        <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{lockLine}</p>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {(["3", "2", "1"] as const).map((code) => (
          <FatMark key={code} code={code} fat on={mark === code} disabled={locked} onClick={() => onTap(code)} />
        ))}
      </div>
      <div className="shrink-0 rounded-2xl bg-elevated p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Ticket out · not XP until the teacher accepts</p>
        <p className="mt-1 text-sm">{ticket.prompt}</p>
        {ticket.accepted ? (
          <p className="mt-2 text-sm font-semibold">XP is in.</p>
        ) : ticket.pick ? (
          <p className="mt-2 text-sm font-semibold">Sent. Waiting for the teacher.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {ticket.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                disabled={locked}
                onClick={() => onAnswer(choice)}
                className="tw-tap min-h-11 rounded-xl bg-bg px-3 text-sm font-semibold disabled:opacity-40"
              >
                {choice}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TicketAccept({
  file,
  date,
  period,
  crews,
  onAccept,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  crews: CrewRow[];
  onAccept: (crewKey: string) => void;
}) {
  const rows = crews
    .map((c) => ({ crew: c, ticket: readTicket(file, date, period, c.key) }))
    .filter((r) => r.ticket.pick);
  if (!rows.length) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-1 px-1">
      {rows.map(({ crew, ticket }) =>
        ticket.accepted ? (
          <span key={crew.key} className="inline-flex min-h-11 items-center rounded-xl bg-elevated px-3 text-sm font-semibold text-muted">
            {crew.name} · XP in
          </span>
        ) : ticket.pick === ticket.term ? (
          <button key={crew.key} type="button" onClick={() => onAccept(crew.key)} className="tw-tap min-h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg">
            Accept {crew.name} · 1 XP
          </button>
        ) : (
          <span key={crew.key} className="inline-flex min-h-11 items-center rounded-xl bg-elevated px-3 text-sm font-semibold text-muted">
            {crew.name} · not the word
          </span>
        ),
      )}
    </div>
  );
}
