import { X } from "lucide-react";
import { Berty } from "@/components/berty";
import { BertyMaker } from "@/components/berty-maker";
import { HOUSE_BERTY, HOUSE_MRK, houseOf, type HouseId } from "@/lib/house";
import { COPYRIGHT_LINE } from "@/lib/copy";

export function HouseCard({ id, onClose, unlocked = false }: { id: HouseId; onClose: () => void; unlocked?: boolean }) {
  const h = houseOf(id);
  if (!h) return null;
  const berty = id === HOUSE_BERTY;
  return (
    <div className="tw-scrim fixed inset-0 z-40 flex items-end justify-center p-2 sm:items-center sm:p-3">
      <div className="tw-gadget tw-hud flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden bg-surface">
        <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-visible rounded-full bg-elevated ring-1 ring-border">
              {berty ? (
                <Berty pose="icon" size="md" />
              ) : (
                <span className="font-display text-3xl font-semibold text-gold">K</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{h.role}</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">{h.alias}</h2>
              <p className="mt-0.5 font-mono text-xs tracking-wider text-muted">{h.handle}</p>
              <p className="mt-2 text-sm text-muted">{h.line}</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="tw-tap size-11 shrink-0 rounded-lg bg-elevated text-muted">
              <X className="mx-auto size-4" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">
          <p className="max-w-2xl text-sm leading-relaxed text-fg">{h.about}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {h.jobs.map((j) => (
              <li key={j.title} className="rounded-xl bg-elevated p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{j.title}</p>
                <p className="mt-1 text-sm">{j.line}</p>
              </li>
            ))}
          </ul>
          {berty ? (
            <BertyMaker unlocked={unlocked} />
          ) : (
            <section className="mt-4 rounded-xl bg-elevated p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Public card</p>
              <p className="mt-1 text-sm">Richard Kulibert · Solvay Tech Ed · TechWorks desk</p>
              <p className="mt-1 text-xs text-muted">This is the teacher card. It is not a student record. Shop names only on the wall.</p>
            </section>
          )}
          <ul className="mt-4 space-y-1 text-xs text-muted">
            {h.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
          {id === HOUSE_MRK ? <p className="mt-4 font-mono text-[11px] text-subtle">{COPYRIGHT_LINE}</p> : null}
        </div>
      </div>
    </div>
  );
}
