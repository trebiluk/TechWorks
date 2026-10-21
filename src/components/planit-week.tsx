import { useEffect, useRef, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import { planitLiveWeek, planitStripHasWork } from "@/lib/planit";
import { ActivityLibrary } from "@/components/activity-library";
import { bumpDay, unbumpDay } from "@/lib/bump-day";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

const BUMP_Q = "Move this lesson and every later one in {course} by one school day?";

export function PlanitWeek({
  file,
  period,
  date,
  onChange,
}: {
  file: EconomyFile;
  period: number;
  date: string;
  onChange?: (next: EconomyFile) => void;
}) {
  const { t } = useLang();
  const days = planitLiveWeek(file, period, date);
  const show = planitStripHasWork(days);
  const course = periodTitle(period, shopBells(file));
  const [ask, setAsk] = useState(false);
  const [lib, setLib] = useState(false);
  const [toast, setToast] = useState<{ n: number; from: string } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const libBtn = useRef<HTMLButtonElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ask) return;
    confirmBtn.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setAsk(false);
      trigger.current?.focus();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [ask]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 10_000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!show) return null;

  function close() {
    setAsk(false);
    trigger.current?.focus();
  }

  function run() {
    if (!onChange) return;
    const result = bumpDay(file, date, period);
    onChange(result.file);
    setAsk(false);
    setToast({ n: result.moved, from: date });
    trigger.current?.focus();
  }

  function undo() {
    if (!onChange || !toast) return;
    onChange(unbumpDay(file, toast.from, period).file);
    setToast(null);
    trigger.current?.focus();
  }

  const movedLine = !toast
    ? ""
    : toast.n === 1
      ? t("Moved 1 lesson.")
      : t("Moved {n} lessons.").replaceAll("{n}", String(toast.n));

  return (
    <>
    <article className="tw-planit-strip-card mt-1" data-planit-strip>
      <p className="tw-fill-label font-semibold uppercase tracking-wider text-muted">This week · {course}</p>
      <div className="tw-planit-row mt-2 flex flex-wrap items-start gap-2">
        <ol className="tw-planit-strip min-w-0 flex-1">
          {days.map((d) => (
            <li
              key={d.date}
              className={cn("tw-planit-day", d.live ? "tw-planit-day-live" : "", d.set ? "" : "opacity-50")}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold">{d.dow}</p>
              <p className="tw-planit-day-title mt-0.5 font-display font-semibold leading-snug">{d.title || "—"}</p>
            </li>
          ))}
        </ol>
        {onChange ? (
          <>
          <button
            ref={trigger}
            type="button"
            data-bump-day
            onClick={() => setAsk(true)}
            className="tw-tap relative z-[1] inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
          >
            <span aria-hidden>⤵</span>
            {t("Bump day")}
          </button>
          <button
            ref={libBtn}
            type="button"
            data-activity-library-open
            onClick={() => setLib(true)}
            className="tw-tap relative z-[1] inline-flex min-h-11 max-w-full shrink-0 items-center gap-1 self-stretch whitespace-normal rounded-xl bg-surface px-3 text-left text-sm font-semibold text-fg ring-1 ring-border"
          >
            <span aria-hidden>☰</span>
            {t("Activity library")}
          </button>
        </>
        ) : null}
      </div>
      {ask ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-bg/70 p-4" onClick={close}>
          <div
            role="dialog"
            aria-labelledby="tw-bump-q"
            className="w-full max-w-md rounded-2xl bg-surface p-4 text-fg ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="tw-bump-q" className="text-base font-semibold leading-snug">
              {t(BUMP_Q).replaceAll("{course}", course)}
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                ref={confirmBtn}
                type="button"
                onClick={run}
                className="tw-tap min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
              >
                {t("Bump")}
              </button>
              <button type="button" onClick={close} className="tw-tap min-h-11 rounded-xl bg-elevated px-4 text-sm font-semibold ring-1 ring-border">
                {t("Cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <p role="status" data-bump-toast className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
          <span>{movedLine}</span>
          <button type="button" onClick={undo} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold">
            {t("Undo")}
          </button>
        </p>
      ) : null}
    </article>
    {lib && onChange ? (
      <ActivityLibrary
        file={file}
        date={date}
        period={period}
        onChange={onChange}
        onClose={() => {
          setLib(false);
          libBtn.current?.focus();
        }}
      />
    ) : null}
    </>
  );
}
