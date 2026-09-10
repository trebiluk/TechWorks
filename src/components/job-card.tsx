import type { ReactNode } from "react";
import { Glasses } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopJob } from "@/lib/projects";
import { useLang } from "@/lib/i18n-hook";
import { needsPpe } from "@/lib/ppe";

export function JobCard({
  job,
  period,
  compact,
  onTeach,
  actions,
  ppeOn,
  onPpe,
}: {
  job: ShopJob;
  period: number;
  compact?: boolean;
  onTeach?: () => void;
  actions?: ReactNode;
  ppeOn?: boolean;
  onPpe?: () => void;
}) {
  const { t } = useLang();
  const goggles = needsPpe(job.rules);
  const ppeLocked = goggles && !ppeOn;
  const look = splitLook(job.lookFor, job.expect, t);

  return (
    <div data-job className={cn("tw-job", compact ? "tw-job-compact" : "")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="tw-fill-label font-bold uppercase tracking-[0.18em] text-gold">
            P{period}
            {job.grade ? <span className="text-muted"> · G{job.grade}</span> : null}
            {job.stage ? <span className="text-muted"> · {job.stage}</span> : null}
          </p>
          {job.question ? (
            <button type="button" onClick={onTeach} className="mt-1 block w-full text-left" disabled={!onTeach}>
              <p className="tw-fill-ask font-display font-semibold tracking-tight text-gold">{t(job.question)}</p>
            </button>
          ) : (
            <button type="button" onClick={onTeach} className="mt-1 block w-full text-left" disabled={!onTeach}>
              <p className="tw-fill-hero font-display font-semibold tracking-tight">{job.title}</p>
            </button>
          )}
          {job.stemLine ? <p className="tw-fill-line mt-1 text-muted">{t(job.stemLine)}</p> : null}
        </div>
        {actions}
      </div>
      <dl className="tw-job-rows">
        {job.rules.length ? (
          <div className="contents">
            <dt className={cn("tw-job-k", ppeLocked ? "text-cleanup" : "text-muted")}>{t("Rules")}</dt>
            <dd className="tw-job-v">
              {goggles ? (
                <button
                  type="button"
                  onClick={onPpe}
                  disabled={!onPpe}
                  className={cn(
                    "tw-ppe inline-flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-1 text-left",
                    ppeLocked ? "bg-cleanup text-accent-fg" : "bg-gold/15 text-fg",
                    onPpe ? "" : "cursor-default",
                  )}
                  title={ppeLocked ? t("Goggles first.") : t("Goggles on")}
                >
                  <Glasses className="size-5 shrink-0" aria-hidden />
                  <span>{job.rules.map((r) => t(r)).join(". ")}</span>
                </button>
              ) : (
                job.rules.map((r) => t(r)).join(". ")
              )}
            </dd>
          </div>
        ) : null}
        {job.today ? (
          <div className="contents">
            <dt className="tw-job-k text-muted">{t("Today")}</dt>
            <dd className="tw-job-v">{t(job.today)}</dd>
          </div>
        ) : null}
        {job.done ? (
          <div className="contents">
            <dt className="tw-job-k text-muted">{t("Done")}</dt>
            <dd className="tw-job-v">{t(job.done)}</dd>
          </div>
        ) : null}
        {look.body ? (
          <div className="contents">
            <dt className="tw-job-k text-gold">{t("Look-for")}</dt>
            <dd className="tw-job-v flex flex-wrap items-center gap-2 font-semibold text-gold">
              <span className="tw-job-n" aria-hidden>
                {look.n}
              </span>
              <span>{look.body}</span>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function splitLook(line: string, expect: 1 | 2 | 3 | 4, t: (s: string) => string): { n: number; body: string } {
  const m = line.match(/^(\d)\s*=\s*(.*)$/);
  if (m) return { n: Number(m[1]) || expect, body: t(m[2]) };
  return { n: expect, body: t(line) };
}
