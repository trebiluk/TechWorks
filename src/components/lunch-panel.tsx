import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { lunchOn, setLunch } from "@/lib/store";
import { LUNCH_PAGE, guessMiddlePdf, pullLunch } from "@/lib/lunch";
import { todayIso } from "@/lib/calendar";

export function LunchPanel({
  file,
  date = todayIso(),
  onChange,
}: {
  file: EconomyFile;
  date?: string;
  onChange: (next: EconomyFile) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pdf, setPdf] = useState(() => guessMiddlePdf(date));
  const [byDate, setByDate] = useState<Record<string, string>>({});
  const today = lunchOn(file, date);
  const logged = Object.entries(file.meta.dayLog ?? {})
    .filter(([, d]) => d.lunch?.trim())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 20);

  async function pull() {
    setBusy(true);
    setMsg("");
    try {
      const data = await pullLunch(date);
      setPdf(data.pdf);
      setByDate(data.byDate);
      const line = data.byDate[date];
      if (line) onChange(setLunch(file, date, line));
      setMsg(line ? `${data.source === "live" ? "Live" : "Cached"} · ${line}` : `No entrée for ${date}. Open the PDF.`);
    } catch {
      setMsg("District page blocked. Open the Middle School Menu PDF.");
    }
    setBusy(false);
  }

  function fillMonth() {
    let next = file;
    for (const [d, line] of Object.entries(byDate)) {
      if (!lunchOn(next, d)) next = setLunch(next, d, line);
    }
    onChange(next);
    setMsg("Empty days filled.");
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Lunch</h2>
      <p className="mt-1 text-sm text-muted">Solvay MS entrée. Pull the monthly PDF, or type today. Shows on the Now chip.</p>
      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Today</span>
        <input
          value={today}
          onChange={(e) => onChange(setLunch(file, date, e.target.value))}
          placeholder="entrée"
          className="mt-1 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void pull()}
          className="min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-accent-fg disabled:opacity-40"
        >
          {busy ? "Pulling…" : "Pull this month"}
        </button>
        <button
          type="button"
          disabled={!Object.keys(byDate).length}
          onClick={fillMonth}
          className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
        >
          Fill empty days
        </button>
        <a href={pdf} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md bg-elevated px-3 text-sm">
          Month PDF
        </a>
        <a href={LUNCH_PAGE} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md bg-elevated px-3 text-sm">
          Food services
        </a>
      </div>
      {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      {logged.length ? (
        <ul className="mt-4 space-y-1">
          {logged.map(([d, row]) => (
            <li key={d} className="flex gap-2 text-sm">
              <span className="font-mono text-xs text-subtle">{d.slice(5)}</span>
              <span className="min-w-0 truncate">{row.lunch}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No lunches saved yet.</p>
      )}
    </section>
  );
}
