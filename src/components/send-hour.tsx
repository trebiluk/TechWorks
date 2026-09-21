import { useEffect, useMemo, useRef, useState } from "react";
import { Copy } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay, weekOn } from "@/lib/calendar";
import { gradeOfPeriod } from "@/lib/projects";
import {
  copyYesterday,
  hourIsSet,
  hourLabel,
  hourTargets,
  linkedHourTargets,
  sameGradePeriods,
  sendHour,
  sendHourNote,
} from "@/lib/planbook";
import { cn } from "@/lib/utils";

function linkedPicks(linked: { date: string; period: number }[], date: string, period: number) {
  return {
    periods: [...new Set(linked.filter((t) => t.date === date).map((t) => t.period))],
    days: [...new Set(linked.filter((t) => t.period === period).map((t) => t.date))],
  };
}

export function SendHour({
  file,
  date,
  period,
  unlocked,
  days,
  onSend,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  unlocked: boolean;
  days?: string[];
  onSend: (next: EconomyFile, note: string) => void;
}) {
  const bells = shopBells(file);
  const weekDays = (days ?? weekOn(date)?.days ?? [date]).filter((d) => isSchoolDay(d));
  const otherPeriods = bells.filter((b) => b.period !== period);
  const otherDays = weekDays.filter((d) => d !== date);
  const twins = sameGradePeriods(file, period);
  const grade = gradeOfPeriod(file, period);
  const sourceOn = hourIsSet(file, date, period);
  const linked = useMemo(() => linkedHourTargets(file, date, period), [file, date, period]);
  const shareKey = linked.map((t) => `${t.date}|${t.period}`).join(",");
  const fileRef = useRef(file);
  fileRef.current = file;
  const [pickedP, setPickedP] = useState<number[]>([]);
  const [pickedD, setPickedD] = useState<string[]>([]);

  useEffect(() => {
    const next = linkedPicks(linkedHourTargets(fileRef.current, date, period), date, period);
    setPickedP(next.periods);
    setPickedD(next.days);
  }, [date, period, shareKey]);

  const targets = useMemo(() => hourTargets(date, period, pickedP, pickedD), [date, period, pickedP, pickedD]);
  const empty = targets.filter((t) => !hourIsSet(file, t.date, t.period));
  const filled = targets.filter((t) => hourIsSet(file, t.date, t.period));
  const saving = filled.length > 0;
  const linkedPick = linkedPicks(linked, date, period);
  const linkedOn =
    linked.length > 0 &&
    linkedPick.periods.length === pickedP.length &&
    linkedPick.days.length === pickedD.length &&
    linkedPick.periods.every((p) => pickedP.includes(p)) &&
    linkedPick.days.every((d) => pickedD.includes(d));

  function toggleP(p: number) {
    setPickedP((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }
  function toggleD(d: string) {
    setPickedD((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function pickLinked() {
    const next = linkedPicks(linked, date, period);
    setPickedP(next.periods);
    setPickedD(next.days);
  }

  function send() {
    if (!unlocked || !sourceOn || !targets.length) return;
    const hit = sendHour(file, date, period, targets);
    const next = linkedPicks(linkedHourTargets(hit.file, date, period), date, period);
    setPickedP(next.periods);
    setPickedD(next.days);
    onSend(hit.file, sendHourNote(hit.sent, hit.updated));
  }

  function pullYesterday() {
    if (!unlocked) return;
    const next = copyYesterday(file, date, period);
    if (next === file) onSend(file, "Last class day has no plan.");
    else onSend(next, "Last class day is on this hour.");
  }

  return (
    <div className="grid gap-2" data-send-hour>
      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Send this hour</p>
      {!sourceOn ? (
        <p className="text-sm text-muted">Type the job first. Then send this hour to other periods or days. Save writes edits onto hours you already sent.</p>
      ) : null}
      {sourceOn ? (
        <>
          {otherPeriods.length ? (
            <div>
              <p className="text-xs font-semibold text-muted">Other periods today</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {otherPeriods.map((b) => {
                  const on = pickedP.includes(b.period);
                  const set = hourIsSet(file, date, b.period);
                  return (
                    <button
                      key={b.period}
                      type="button"
                      onClick={() => toggleP(b.period)}
                      className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", on ? "bg-fg text-bg" : "bg-elevated text-muted")}
                      title={set ? `P${b.period} already has a plan — Save will overwrite` : `P${b.period}`}
                    >
                      P{b.period}
                      {set ? <span className="ml-1 text-[10px] opacity-70">set</span> : null}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPickedP(otherPeriods.map((b) => b.period))}
                  className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
                >
                  Rest of today
                </button>
                {twins.length ? (
                  <button
                    type="button"
                    onClick={() => setPickedP(twins)}
                    className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
                  >
                    Other G{grade}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {otherDays.length ? (
            <div>
              <p className="text-xs font-semibold text-muted">This period on other days</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {otherDays.map((d) => {
                  const on = pickedD.includes(d);
                  const set = hourIsSet(file, d, period);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleD(d)}
                      className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", on ? "bg-fg text-bg" : "bg-elevated text-muted")}
                      title={set ? `${formatSchoolDate(d)} already has a plan — Save will overwrite` : formatSchoolDate(d)}
                    >
                      {formatSchoolDate(d).replace(/,.*/, "")}
                      {set ? <span className="ml-1 text-[10px] opacity-70">set</span> : null}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPickedD(otherDays)}
                  className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
                >
                  Later this week
                </button>
              </div>
            </div>
          ) : null}
          {linked.length ? (
            <button
              type="button"
              onClick={pickLinked}
              className={cn("tw-tap min-h-11 w-fit rounded-xl px-3 text-sm font-semibold", linkedOn ? "bg-fg text-bg" : "bg-elevated text-muted")}
              title="Hours that already share this assignment"
            >
              Linked {linked.length}
            </button>
          ) : null}
          {targets.length ? (
            <p className="text-xs font-semibold text-muted">
              {empty.length ? `Will write ${empty.map(hourLabel).join(", ")}.` : ""}
              {empty.length && filled.length ? " " : ""}
              {filled.length ? `Will save onto ${filled.map(hourLabel).join(", ")}.` : ""}
            </p>
          ) : (
            <p className="text-xs font-semibold text-muted">Pick periods or days. Save overwrites a planned hour you pick. Unpicked hours stay.</p>
          )}
        </>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {sourceOn ? (
          <button
            type="button"
            disabled={!targets.length}
            onClick={send}
            data-send-mode={saving ? "save" : "send"}
            className="tw-tap min-h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg disabled:opacity-40"
          >
            {saving ? "Save" : "Send"}
            {targets.length ? ` ${targets.length}` : ""}
          </button>
        ) : null}
        <button type="button" onClick={pullYesterday} className="tw-tap inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-elevated px-3 text-sm font-semibold">
          <Copy className="size-3.5" aria-hidden />
          Put last class day here
        </button>
      </div>
    </div>
  );
}
