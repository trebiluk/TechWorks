import { useState, type ReactNode } from "react";
import { Briefcase, Camera, Link2, MessageSquare, Pencil } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
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
  liveBoardSpine,
  type LiveBoardTab,
} from "@/lib/live-board";

export function TeachLive({
  file,
  date,
  period,
  unlocked,
  onEdit,
  onNeedPin,
  tab,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  unlocked: boolean;
  onEdit: (next: EconomyFile) => void;
  onNeedPin?: () => void;
  tab?: LiveBoardTab;
}) {
  const [inner] = useState<LiveBoardTab>("teach");
  const pane = tab ?? inner;
  const spine = liveBoardSpine(file, date, period);
  const hangs = hangOf(file, date, period);

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
    </section>
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
