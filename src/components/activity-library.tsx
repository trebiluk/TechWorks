import { useEffect, useRef, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { listActivities, type ActivityQuery, type LibraryActivity } from "@/lib/activity-library";
import { pinDayActivity, pinnedActivityId } from "@/lib/projects";
import { useLang } from "@/lib/i18n-hook";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_CAPS = [15, 30, 45];

function shortDow(iso: string): string {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return DOW[day] ?? "";
}

function cycle<T>(options: T[], current: T): T {
  const i = options.findIndex((item) => item === current);
  return options[(i + 1) % options.length] ?? options[0];
}

export function ActivityLibrary({
  file,
  date,
  period,
  onChange,
  onClose,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  onChange: (next: EconomyFile) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState<ActivityQuery>({});
  const [toast, setToast] = useState<{ prev: string; text: string } | null>(null);
  const gradeBtn = useRef<HTMLButtonElement>(null);
  const lastAdd = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const all = listActivities(file);
  const rows = listActivities(file, query);
  const grades = [...new Set(all.flatMap((row) => row.grades))].sort((a, b) => a - b);
  const kits = [...new Set(all.map((row) => row.kit))].sort((a, b) => a.localeCompare(b));
  const skills = [...new Set(all.map((row) => row.skill))].sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    gradeBtn.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      closeRef.current();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 10_000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function add(row: LibraryActivity, button: HTMLButtonElement) {
    lastAdd.current = button;
    const prev = pinnedActivityId(file, period, date);
    onChange(pinDayActivity(file, date, period, row.id));
    const text = t("Added to {day} P{period}.")
      .replaceAll("{day}", shortDow(date))
      .replaceAll("{period}", String(period));
    setToast({ prev, text });
  }

  function undo() {
    if (!toast) return;
    onChange(pinDayActivity(file, date, period, toast.prev));
    setToast(null);
    lastAdd.current?.focus();
  }

  const gradeOn = query.grade != null;
  const timeOn = query.maxMin != null;
  const kitOn = Boolean(query.kit);
  const skillOn = Boolean(query.skill);

  return (
    <section
      role="dialog"
      aria-labelledby="tw-activity-library-title"
      data-activity-library
      className="mt-2 rounded-2xl bg-surface p-3 text-fg ring-1 ring-border"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tw-activity-library-title" className="text-base font-semibold">
          {t("Activity library")}
        </h2>
        <button type="button" onClick={onClose} className="tw-tap inline-flex min-h-11 items-center gap-1 rounded-xl bg-elevated px-3 text-sm font-semibold">
          <span aria-hidden>✕</span>
          {t("Close")}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          ref={gradeBtn}
          type="button"
          aria-pressed={gradeOn}
          onClick={() => setQuery({ ...query, grade: cycle([undefined, ...grades], query.grade) })}
          className="tw-tap inline-flex min-h-11 max-w-full items-center gap-1 whitespace-normal rounded-full bg-bg px-3 text-left text-sm font-semibold ring-1 ring-border"
        >
          <bdi>{gradeOn ? t("Grade {n}").replaceAll("{n}", String(query.grade)) : t("Grade: any")}</bdi>
          {gradeOn ? <span aria-hidden>✓</span> : null}
        </button>
        <button
          type="button"
          aria-pressed={timeOn}
          onClick={() => setQuery({ ...query, maxMin: cycle([undefined, ...TIME_CAPS], query.maxMin) })}
          className="tw-tap inline-flex min-h-11 max-w-full items-center gap-1 whitespace-normal rounded-full bg-bg px-3 text-left text-sm font-semibold ring-1 ring-border"
        >
          <bdi>{timeOn ? t("≤{n} min").replaceAll("{n}", String(query.maxMin)) : t("Time: any")}</bdi>
          {timeOn ? <span aria-hidden>✓</span> : null}
        </button>
        <button
          type="button"
          aria-pressed={kitOn}
          onClick={() => setQuery({ ...query, kit: cycle([undefined, ...kits], query.kit) })}
          className="tw-tap inline-flex min-h-11 max-w-full items-center gap-1 whitespace-normal rounded-full bg-bg px-3 text-left text-sm font-semibold ring-1 ring-border"
        >
          <bdi>{kitOn ? t("Kit: {kit}").replaceAll("{kit}", query.kit ?? "") : t("Kit: any")}</bdi>
          {kitOn ? <span aria-hidden>✓</span> : null}
        </button>
        <button
          type="button"
          aria-pressed={skillOn}
          onClick={() => setQuery({ ...query, skill: cycle([undefined, ...skills], query.skill) })}
          className="tw-tap inline-flex min-h-11 max-w-full items-center gap-1 whitespace-normal rounded-full bg-bg px-3 text-left text-sm font-semibold ring-1 ring-border"
        >
          <bdi>{skillOn ? t("Skill: {skill}").replaceAll("{skill}", query.skill ?? "") : t("Skill: any")}</bdi>
          {skillOn ? <span aria-hidden>✓</span> : null}
        </button>
        <button
          type="button"
          data-activity-clear
          onClick={() => setQuery({})}
          className="tw-tap inline-flex min-h-11 items-center gap-1 rounded-full bg-elevated px-3 text-sm font-semibold ring-1 ring-border"
        >
          <span aria-hidden>✕</span>
          {t("Clear")}
        </button>
      </div>
      {rows.length ? (
        <ul data-activity-list className="mt-3 grid gap-2" aria-live="polite">
          {rows.map((row) => {
            const meta = t("{min} min · {kit} · {skill}")
              .replaceAll("{min}", String(row.minutes))
              .replaceAll("{kit}", row.kit)
              .replaceAll("{skill}", row.skill);
            return (
              <li key={`${row.projectId}:${row.id}`} data-activity-row className="flex flex-wrap items-center gap-2 rounded-2xl bg-bg p-3 ring-1 ring-border">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">
                    <bdi>{row.name}</bdi>
                  </p>
                  <p className="text-sm text-muted">
                    <bdi>{meta}</bdi>
                  </p>
                </div>
                <button
                  type="button"
                  data-add-day={row.id}
                  onClick={(e) => add(row, e.currentTarget)}
                  className="tw-tap inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
                >
                  <span aria-hidden>＋</span>
                  {t("Add to day")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p data-activity-list role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden>—</span>
          {t("No activities")}
        </p>
      )}
      {toast ? (
        <p role="status" data-activity-toast className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span>
            <span aria-hidden>＋ </span>
            <bdi>{toast.text}</bdi>
          </span>
          <button type="button" onClick={undo} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold">
            {t("Undo")}
          </button>
        </p>
      ) : null}
    </section>
  );
}
