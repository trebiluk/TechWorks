import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Copy, Search } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, money, periodTitle, shopBells } from "@/lib/economy";
import { MarkChip, TogglePair } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";
import { formatSchoolDate } from "@/lib/calendar";
import { LOG_HEADER, MASTER_HEADER, ledgerTsv, logRows, masterRows, toTsv, weeklyTrend, workerCards } from "@/lib/report";
import { applySort, decorateRank, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { QuarterChip } from "@/components/quarter-chip";
import { XpBit, PerkBit } from "@/components/marks";
import { ensurePriorYear, PRIOR_YEAR } from "@/lib/prior-year";
import { loadClub } from "@/lib/club";
import { cn } from "@/lib/utils";

const METRICS = [
  { id: "xp", label: "XP" },
  { id: "wallet", label: "Wallet" },
  { id: "stock", label: "Stock" },
  { id: "earned", label: "Earned" },
  { id: "combo", label: "Combo" },
] as const;
type Metric = (typeof METRICS)[number]["id"];

function valueOf(
  s: { combo: number; quarter: number; stock: number; xp: number; earned: number },
  m: Metric,
): number {
  if (m === "combo") return s.combo;
  if (m === "wallet") return s.quarter;
  if (m === "stock") return s.stock;
  if (m === "xp") return s.xp;
  return s.earned;
}

function show(n: number, m: Metric): string {
  if (m === "combo") return n.toFixed(2);
  if (m === "xp") return String(Math.round(n));
  return money(n);
}

export function DataBoard({
  file,
  onOpenProfile,
  onWeek,
  onYear,
}: {
  file: EconomyFile;
  onOpenProfile: (id: string) => void;
  onWeek?: () => void;
  onYear?: () => void;
}) {
  const [mixSh, setMixSh] = useState(false);
  const [shelf, setShelf] = useState<"live" | "archive">("live");
  const [arch, setArch] = useState<EconomyFile | null>(null);
  const [archErr, setArchErr] = useState("");
  useEffect(() => {
    if (shelf !== "archive") return;
    let on = true;
    ensurePriorYear()
      .then((f) => {
        if (on) setArch(f);
      })
      .catch(() => {
        if (on) setArchErr("Could not build 2025-26");
      });
    return () => {
      on = false;
    };
  }, [shelf]);
  const src = shelf === "archive" && arch ? arch : file;
  const archived = shelf === "archive";
  const bells = mixSh ? bellFor(src) : shopBells(src);
  const cards = useMemo(
    () => workerCards(src).filter((s) => mixSh || s.period !== 6),
    [src, mixSh],
  );
  const [metric, setMetric] = useState<Metric>("xp");
  const [group, setGroup] = useState<"worker" | "period">("worker");
  const [chart, setChart] = useState<"bar" | "line">("bar");
  const [sort, setSort] = useState<SortKey>("level");
  const ranked = applySort(decorateRank(src, cards), sort);
  const [sheet, setSheet] = useState(false);
  const [id, setId] = useState(cards[0]?.id ?? "");
  const [copied, setCopied] = useState("");
  const [bookBusy, setBookBusy] = useState(false);
  const [q, setQ] = useState("");
  const card = cards.find((c) => c.id === id) ?? cards[0] ?? null;
  const shown = ranked.filter((s) => !q.trim() || s.first.toLowerCase().includes(q.trim().toLowerCase()) || String(s.period) === q.trim());

  const presets = useMemo(() => {
    const kids = cards;
    const lead = kids.filter((s) => s.rankSchool === 1);
    const behind = kids.filter((s) => s.rankPeriod > 1);
    const need3 = kids.filter((s) => (s.counts["3"] ?? 0) === 0);
    const wallet = [...kids].sort((a, b) => b.quarter - a.quarter).slice(0, 3);
    return { lead, behind, need3, wallet };
  }, [cards]);
  const weeks = useMemo(() => weeklyTrend(src, mixSh), [src, mixSh]);
  const chartRows =
    chart === "line"
      ? weeks.map((w) => {
          const value =
            metric === "wallet"
              ? w.wallet
              : metric === "stock"
                ? w.stock
                : metric === "xp"
                  ? w.earned
                  : w.earned;
          return { ...w, value };
        })
      : group === "period"
        ? bells.map((b) => {
            const kids = ranked.filter((s) => s.period === b.period);
            const n = kids.reduce((sum, s) => sum + valueOf(s, metric), 0);
            return { name: periodTitle(b.period, bells), value: n };
          })
        : ranked.slice(0, 24).map((s) => ({ name: s.first, value: valueOf(s, metric) }));

  async function copy(kind: "log" | "master" | "ledger") {
    const text =
      kind === "log" ? toTsv(LOG_HEADER, logRows(src, mixSh)) : kind === "master" ? toTsv(MASTER_HEADER, masterRows(src, mixSh)) : ledgerTsv(src);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      window.prompt("Copy into Google Sheets", text);
    }
  }

  const ChartEl = chart === "line" ? LineChart : BarChart;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <header className="shrink-0 rounded-lg bg-surface px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Data</h1>
          {onWeek ? (
            <MarkChip mark={markOf("week")} title="Week" onClick={onWeek}>
              Week
            </MarkChip>
          ) : null}
          {onYear ? (
            <MarkChip mark={markOf("year")} title="Year" onClick={onYear}>
              Year
            </MarkChip>
          ) : null}
          {archived ? <span className="rounded-full bg-elevated px-3 py-1 text-xs font-semibold uppercase tracking-wide">{PRIOR_YEAR}</span> : <QuarterChip />}
          <TogglePair
            value={shelf}
            onChange={(v) => setShelf(v === "archive" ? "archive" : "live")}
            options={[
              { id: "live", label: "Live" },
              { id: "archive", label: "Archive" },
            ]}
          />
          <TogglePair
            value={mixSh ? "building" : "shop"}
            onChange={(v) => setMixSh(v === "building")}
            options={[
              { id: "shop", label: "Tech only" },
              { id: "building", label: "Mix study hall" },
            ]}
          />
        </div>
        <p className="mt-1 text-sm text-muted">
          {archived
            ? "2025-26 fake year · 72 workshop + 14 study hall · four sessions. Not your live roster. Charts and Sheets copy only."
            : "Charts and the Google book. Tech classes only unless you mix study hall (fun / building-wide)."}
        </p>
        {archived && !arch ? <p className="mt-2 text-sm text-gold">{archErr || "Building 2025-26…"}</p> : null}
        {archived && arch?.meta.sessions?.length ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {arch.meta.sessions.map((s) => (
              <li key={s.n} className="rounded-full bg-elevated px-3 py-1">
                {s.label} · {s.headcount} · {money(s.cash)}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { id: "lead", label: "Hold the lead", n: presets.lead.length, pick: presets.lead[0]?.id },
            { id: "behind", label: "Behind", n: presets.behind.length, pick: presets.behind[0]?.id },
            { id: "need3", label: "Needs a 3", n: presets.need3.length, pick: presets.need3[0]?.id },
            { id: "wallet", label: "Wallet", n: presets.wallet.length, pick: presets.wallet[0]?.id },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => p.pick && setId(p.pick)}
            className={cn("tw-gadget tw-tap p-3 text-left", id && p.pick === id ? "ring-1 ring-gold" : "")}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{p.label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{p.n}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="pr-1 text-xs font-medium uppercase tracking-wider text-subtle">Show</span>
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetric(m.id)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", metric === m.id ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className="pr-1 text-xs font-medium uppercase tracking-wider text-subtle">By</span>
        {(["worker", "period"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold capitalize", group === g ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {g}
          </button>
        ))}
        {(["bar", "line"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChart(c)}
            className={cn("min-h-11 rounded-md px-3 text-sm font-semibold capitalize", chart === c ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {c}
          </button>
        ))}
        <SortBar value={sort} onChange={setSort} keys={["combo", "wallet", "level", "stock", "name", "crew"]} />
      </div>

      <div data-data-fill className="grid min-h-0 flex-1 gap-2">
      <section className="flex h-full min-h-[12rem] min-w-0 flex-col rounded-lg bg-surface p-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-subtle">
          {chart === "line"
            ? group === "period"
              ? "Weekly earned by period"
              : metric === "wallet"
                ? "Running wallet"
                : metric === "stock"
                  ? "Running stock"
                  : metric === "xp"
                    ? "XP by week"
                    : "Earned by week"
            : group === "period"
              ? `Snapshot by period · ${METRICS.find((m) => m.id === metric)?.label}`
              : `Snapshot · top 24 · ${METRICS.find((m) => m.id === metric)?.label}`}
        </p>
        {chartRows.length ? (
          <ResponsiveContainer width="100%" height="90%">
            <ChartEl data={chartRows}>
              <XAxis
                dataKey="name"
                stroke="currentColor"
                fontSize={11}
                interval={0}
                angle={chart === "bar" && group === "worker" ? -35 : 0}
                height={chart === "bar" && group === "worker" ? 56 : 24}
              />
              <YAxis stroke="currentColor" fontSize={11} width={48} />
              <Tooltip
                formatter={(v: number | string) =>
                  chart === "line" && group === "period" ? money(Number(v)) : show(Number(v), metric)
                }
              />
              {chart === "line" && group === "period" ? (
                bells.map((b) => (
                  <Line
                    key={b.period}
                    type="monotone"
                    dataKey={`p${b.period}`}
                    name={`P${b.period}`}
                    stroke="currentColor"
                    strokeWidth={b.period === 1 ? 2 : 1}
                    dot={false}
                  />
                ))
              ) : chart === "line" ? (
                <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2} dot />
              ) : (
                <Bar dataKey="value" fill="currentColor" radius={4} />
              )}
            </ChartEl>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted">No week rows yet.</p>
        )}
      </section>

      {card ? (
        <aside className="flex min-h-0 flex-col overflow-auto rounded-lg bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Selected worker</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <button type="button" onClick={() => !archived && onOpenProfile(card.id)} className="text-left font-display text-2xl font-semibold">
              {card.first}
            </button>
            {!archived ? (
              <button type="button" onClick={() => onOpenProfile(card.id)} className="min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-bg">
                Report card
              </button>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Archive · aliases only</span>
            )}
          </div>
          <p className="text-sm text-muted">
            P{card.period} · {card.crewName} · XP {card.xp}
          </p>
          <p className="font-mono text-sm">
            {money(card.earned)} earned · {money(card.quarter)} wallet · {money(card.stock)} stock
          </p>
          <p className="text-sm text-muted">
            Effort {card.effortPct == null ? "—" : `${Math.round(card.effortPct)}%`} · {card.counts.A ?? 0} absent · {card.counts["3"] ?? 0} full days
          </p>
          <div className="mt-2 max-h-32 overflow-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {card.stamps.slice(0, 8).map((st) => (
                  <tr key={st.date} className="border-t border-border">
                    <td className="py-1">{formatSchoolDate(st.date)}</td>
                    <td className="py-1 font-mono">{st.code || "—"}</td>
                    <td className="py-1 text-right font-mono">{money(st.pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSheet((v) => !v)}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", sheet ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {sheet ? "Sheets on" : "Sheets"}
            </button>
            {sheet ? (
              <>
            <CopyBtn label={copied === "log" ? "Copied" : "LOG"} onClick={() => void copy("log")} />
            <CopyBtn label={copied === "master" ? "Copied" : "MASTER"} onClick={() => void copy("master")} />
            <CopyBtn label={copied === "ledger" ? "Copied" : "Ledger"} onClick={() => void copy("ledger")} />
            <CopyBtn
              label={bookBusy ? "Book…" : "Google book"}
              onClick={() => {
                if (bookBusy) return;
                setBookBusy(true);
                void import("@/lib/book-xlsx")
                  .then((m) => m.downloadGoogleBook(src, loadClub()))
                  .then(() => setCopied("book"))
                  .finally(() => setBookBusy(false));
              }}
            />
              </>
            ) : null}
          </div>
        </aside>
      ) : null}
      </div>

      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-subtle" />
        <input
          data-find
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find alias or period"
          className="h-11 w-full rounded-md bg-surface pl-9 pr-3 text-sm outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface text-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">First</th>
              <th className="py-2 font-medium">P</th>
              <th className="py-2 font-medium">Crew</th>
              <th className="py-2 text-right font-medium">XP</th>
              <th className="py-2 text-right font-medium">Wallet</th>
              <th className="py-2 text-right font-medium">Stock</th>
              <th className="px-3 py-2 text-right font-medium">{METRICS.find((m) => m.id === metric)?.label}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr
                key={s.id}
                className={cn("cursor-pointer border-t border-border", s.id === id ? "bg-elevated" : "hover:bg-elevated/60")}
                onClick={() => setId(s.id)}
              >
                <td className="px-3 py-2 font-medium">{s.first}</td>
                <td className="py-2 text-muted">{s.period}</td>
                <td className="py-2 text-muted">{s.crewName}</td>
                <td className="py-2 text-right">
                  <XpBit xp={s.xp} level={s.level} />
                </td>
                <td className="py-2 text-right">
                  <PerkBit n={s.quarter} />
                </td>
                <td className="py-2 text-right font-mono">{money(s.stock)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{show(valueOf(s, metric), metric)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CopyBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-1 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg">
      <Copy className="size-4" />
      {label}
    </button>
  );
}
