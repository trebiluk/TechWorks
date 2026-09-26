import { useMemo, useState, type ReactNode } from "react";
import { Briefcase, Camera, ClipboardList, Coins, Link2, MessageSquare, Pencil, Trophy } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { money } from "@/lib/economy";
import { periodClock } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { useShopClock } from "@/lib/use-clock";
import { DraftField } from "@/components/draft-field";
import { HangFrame } from "@/components/hang-frame";
import { addTeachHang, dropTeachHang, hangOf } from "@/lib/teach";
import {
  setPlanitBeat,
  setPlanitJob,
  setPlanitProve,
  setPlanitQuestion,
} from "@/lib/planit";
import {
  LIVE_BEATS,
  LIVE_BOARD_TABS,
  TOOL_MAP,
  liveBoardRanks,
  liveBoardSpine,
  type LiveBoardTab,
} from "@/lib/live-board";
import { cn } from "@/lib/utils";

export function TeachLive({
  file,
  date,
  period,
  unlocked,
  onEdit,
  onNeedPin,
  onOpenId,
  onPlan,
  onDeck,
  tab,
  onTab,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  unlocked: boolean;
  onEdit: (next: EconomyFile) => void;
  onNeedPin?: () => void;
  onOpenId?: (id: string) => void;
  onPlan?: () => void;
  onDeck?: () => void;
  tab?: LiveBoardTab;
  onTab?: (tab: LiveBoardTab) => void;
}) {
  const [inner, setInner] = useState<LiveBoardTab>("teach");
  const pane = tab ?? inner;
  const setPane = onTab ?? setInner;
  const today = todayIso();
  const bellsId = deskBellId(file, date);
  const now = useShopClock(bellsId, "beat");
  const clock = date === today ? periodClock(period, bellsId, now) : null;
  const spine = liveBoardSpine(file, date, period);
  const ranks = useMemo(() => liveBoardRanks(file), [file]);
  const hangs = hangOf(file, date, period);
  const live = Boolean(clock?.live);
  const left = clock?.left ?? 0;

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin?.();
    return false;
  }

  function edit(next: EconomyFile) {
    if (!gate()) return;
    onEdit(next);
  }

  return (
    <section className="tw-teach-live tw-lcars" data-teach-live>
      <nav className="tw-mf-tabs" aria-label="TEACH live board">
        {LIVE_BOARD_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPane(t.id)}
            data-on={pane === t.id ? "on" : undefined}
            className="tw-tap tw-mf-tab"
          >
            {t.label}
          </button>
        ))}
        {onPlan ? (
          <button type="button" onClick={onPlan} className="tw-tap tw-mf-tab tw-mf-tab-aux ml-auto">
            This hour
          </button>
        ) : null}
      </nav>

      <div className="tw-mf-live-body">
        {pane === "guide" ? (
          <article className="tw-mf-panel">
            <p className="tw-mf-kicker">Guiding question</p>
            <DraftField
              value={spine.ask}
              editing={unlocked}
              multiline
              onCommit={(v) => edit(setPlanitQuestion(file, date, period, v))}
              placeholder="How can we create a tool that is clear, durable, and easy for the crew to use?"
              aria-label="Guiding question"
              className="tw-mf-quote min-h-11"
            />
          </article>
        ) : null}

        {pane === "prove" ? (
          <article className="tw-mf-panel">
            <p className="tw-mf-kicker">Prove</p>
            <DraftField
              value={spine.prove}
              editing={unlocked}
              multiline
              onCommit={(v) => edit(setPlanitProve(file, date, period, v))}
              placeholder="What they show before the bell."
              aria-label="Prove"
              className="min-h-11 tw-mf-body"
            />
          </article>
        ) : null}

        {pane === "beats" ? (
          <ol className="tw-mf-beat-list">
            {LIVE_BEATS.map((b) => {
              const card = spine.beats.find((c) => c.id === b.id);
              return (
                <li key={b.id} data-tone={b.tone}>
                  <p className="tw-mf-kicker">{b.label}</p>
                  <DraftField
                    value={card?.body ?? ""}
                    editing={unlocked}
                    onCommit={(v) => edit(setPlanitBeat(file, date, period, b.id, v))}
                    placeholder={b.label}
                    aria-label={b.label}
                    className="min-h-11 tw-mf-body"
                  />
                </li>
              );
            })}
          </ol>
        ) : null}

        {pane === "job" || pane === "teach" ? (
          <>
            <div className="tw-mf-job-row">
              <article className="tw-mf-panel tw-mf-job-hero">
                <p className="tw-mf-kicker">
                  <Briefcase className="size-3.5" aria-hidden />
                  Our job today
                </p>
                <DraftField
                  value={spine.job}
                  editing={unlocked}
                  multiline
                  onCommit={(v) => edit(setPlanitJob(file, date, period, v))}
                  placeholder="Design a device that helps our crew navigate the TechWorks safely."
                  aria-label="Job"
                  className="tw-mf-quote min-h-11"
                />
              </article>
              <article className="tw-mf-panel tw-mf-tools">
                <p className="tw-mf-kicker">Tool map</p>
                <ol className="tw-mf-tool-map">
                  {TOOL_MAP.map((step, i) => (
                    <li key={step.id}>
                      {i ? <span className="tw-mf-tool-arrow" aria-hidden /> : null}
                      <button
                        type="button"
                        data-step={step.id}
                        data-on={pane === step.tab ? "on" : undefined}
                        onClick={() => setPane(step.tab)}
                        className="tw-tap tw-mf-tool"
                      >
                        {step.label}
                      </button>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
            {spine.ask ? (
              <article className="tw-mf-panel">
                <p className="tw-mf-kicker">Guiding question</p>
                <p className="tw-mf-quote">{spine.ask}</p>
              </article>
            ) : null}
            <div className="tw-mf-actions">
              <ActionCard icon={Link2} label="Board link" hint={hangs[0]?.title || "Hang a Drive or Canva file"} hang>
                {unlocked ? (
                  <HangFrame
                    items={hangs}
                    unlocked={unlocked}
                    onHang={(raw) => edit(addTeachHang(file, date, period, raw))}
                    onDrop={(hid) => edit(dropTeachHang(file, date, period, hid))}
                  />
                ) : hangs[0] ? (
                  <p className="text-sm font-semibold">{hangs[0].title}</p>
                ) : (
                  <p className="text-sm text-muted">No file hung.</p>
                )}
              </ActionCard>
              <ActionCard icon={Camera} label="Process photo" hint="Same hang tray">
                <p className="text-sm text-muted">Paste the photo board on Hang.</p>
              </ActionCard>
              <ActionCard icon={Pencil} label="Quick sketch" hint="Job on this hour">
                <p className="text-sm">{spine.job || "Write the job on PlanIt."}</p>
              </ActionCard>
              <ActionCard icon={MessageSquare} label="Crew note" hint="What the crew needs">
                <p className="text-sm">{spine.prove || "Prove line is empty."}</p>
              </ActionCard>
            </div>
          </>
        ) : null}
      </div>

      <footer className="tw-mf-round">
        <p className="tw-mf-kicker tw-mf-round-label">Beats this round</p>
        <div className="tw-mf-stats">
          <Stat label="Time left" value={live ? `${Math.max(0, Math.ceil(left))}m` : "—"} />
          <Stat label="Tasks done" value={`${spine.tasksDone} / 4`} icon={ClipboardList} />
          <Stat label="Crew sync" value={spine.job ? "High" : "—"} />
          <Stat label="Focus" value={spine.ask ? "Clarity" : "Job"} />
        </div>
        <div className="tw-mf-thirds" data-live-thirds>
          <RankCard
            kicker="Top XP"
            alias={ranks.topXp?.alias}
            value={ranks.topXp ? `${ranks.topXp.xp} XP` : "—"}
            period={ranks.topXp?.period}
            gold
            onOpen={ranks.topXp && onOpenId ? () => onOpenId(ranks.topXp!.id) : undefined}
          />
          <RankCard
            kicker="Top $"
            alias={ranks.topMoney?.alias}
            value={ranks.topMoney ? money(ranks.topMoney.money) : "—"}
            period={ranks.topMoney?.period}
            gold
            icon={Coins}
            onOpen={ranks.topMoney && onOpenId ? () => onOpenId(ranks.topMoney!.id) : undefined}
          />
          <ol className="tw-mf-classic">
            <p className="tw-mf-kicker">Board</p>
            {ranks.list.length ? (
              ranks.list.map((row, i) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenId?.(row.id)}
                    className="tw-tap tw-mf-classic-row"
                  >
                    <span>{i + 1}</span>
                    <strong>{row.alias}</strong>
                    <em>P{row.period}</em>
                    <b>{row.xp}</b>
                  </button>
                </li>
              ))
            ) : (
              <li className="tw-mf-classic-empty">Aliases score here.</li>
            )}
          </ol>
        </div>
      </footer>
    </section>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Trophy }) {
  return (
    <p className="tw-mf-stat">
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function RankCard({
  kicker,
  alias,
  value,
  period,
  gold,
  icon: Icon = Trophy,
  onOpen,
}: {
  kicker: string;
  alias?: string;
  value: string;
  period?: number;
  gold?: boolean;
  icon?: typeof Trophy;
  onOpen?: () => void;
}) {
  const inner = (
    <>
      <p className="tw-mf-kicker">
        <Icon className="size-3.5" aria-hidden />
        {kicker}
      </p>
      <p className="tw-mf-rank-alias">{alias || "Hold the lead"}</p>
      <p className="tw-mf-rank-val">
        {value}
        {period != null ? <span>P{period}</span> : null}
      </p>
    </>
  );
  if (onOpen && alias) {
    return (
      <button type="button" onClick={onOpen} data-gold={gold ? "on" : undefined} className="tw-tap tw-mf-rank">
        {inner}
      </button>
    );
  }
  return (
    <article data-gold={gold ? "on" : undefined} className="tw-mf-rank">
      {inner}
    </article>
  );
}

function ActionCard({
  icon: Icon,
  label,
  hint,
  hang,
  children,
}: {
  icon: typeof Link2;
  label: string;
  hint: string;
  hang?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="tw-mf-action" data-teach-hang={hang ? "1" : undefined}>
      <p className="tw-mf-kicker">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="tw-mf-hint">{hint}</p>
      {children}
    </article>
  );
}
