import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { publicHandle } from "@/lib/live";
import { pinSet, resetStudentPin } from "@/lib/student-pin";
import { fillQuarterOne } from "@/lib/roster-seed";
import { cn } from "@/lib/utils";

/** Teacher lookup. Shows the code and whether a pin is set. Never the pin. */
export function PinDesk({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return file.students
      .filter((s) => {
        const code = publicHandle(s.id).toLowerCase();
        return s.first.toLowerCase().includes(needle) || code.includes(needle.replace(/[^a-z0-9]/g, ""));
      })
      .slice(0, 12);
  }, [file, q]);

  return (
    <div className="rounded-xl bg-elevated p-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Pins</p>
      <p className="text-xs text-muted">Look up a name or code. Reset clears the pin. A new name does not change the code.</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name or code"
        aria-label="Find a student pin"
        className="mt-1 min-h-11 w-full rounded-xl bg-surface px-3 text-sm outline-none"
      />
      {hits.length ? (
        <ul className="mt-1">
          {hits.map((s) => {
            const code = publicHandle(s.id);
            const set = pinSet(s);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-2 py-1">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {s.first}
                  <span className="ml-1 font-normal text-muted">P{s.period}</span>
                </span>
                <span className="font-mono text-sm">{code}</span>
                <span className={cn("text-xs font-semibold", set ? "text-fg" : "text-muted")}>{set ? "Pin set" : "No pin"}</span>
                <button
                  type="button"
                  disabled={!set}
                  onClick={() => {
                    onChange(resetStudentPin(file, s.id));
                    setNote(`${s.first} can set a new pin.`);
                  }}
                  className="tw-tap min-h-11 rounded-lg bg-surface px-3 text-sm font-semibold disabled:opacity-40"
                >
                  Reset
                </button>
              </li>
            );
          })}
        </ul>
      ) : q.trim().length >= 2 ? (
        <p className="mt-1 text-sm text-muted">No match.</p>
      ) : null}
      {note ? <p className="mt-1 text-sm">{note}</p> : null}
      <button
        type="button"
        onClick={() => {
          const next = fillQuarterOne(file);
          const added = next.students.length - file.students.length;
          onChange(next);
          setNote(added ? `Added ${added} seats.` : "Every class already has students.");
        }}
        className="tw-tap mt-2 min-h-11 rounded-xl bg-fg px-3 text-sm font-semibold text-bg"
      >
        Fill empty classes
      </button>
    </div>
  );
}
