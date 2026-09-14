import { useState, type ReactNode } from "react";
import { Berty } from "@/components/berty";
import { BERTY_POSES } from "@/lib/house";
import {
  BERTY_FINISH,
  BERTY_HANDS,
  BERTY_HATS,
  BERTY_INKS,
  BERTY_KITS,
  DEFAULT_BERTY_LOOK,
  loadBertyLook,
  lookCounts,
  saveBertyLook,
  type BertyLook,
} from "@/lib/berty-look";
import { MarkChip } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BertyPose } from "@/lib/berty";

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function BertyMaker({ unlocked }: { unlocked: boolean }) {
  const [look, setLook] = useState<BertyLook>(loadBertyLook);
  const [pose, setPose] = useState<BertyPose>("standing");
  const n = lookCounts().combos;

  function paint(next: BertyLook) {
    setLook(next);
    if (unlocked) saveBertyLook(next);
  }

  return (
    <section className="mt-4 space-y-3" data-berty-maker>
      <div className="flex flex-wrap items-end gap-4">
        <figure className="flex min-h-[12rem] min-w-[8rem] items-end justify-center rounded-2xl bg-elevated p-3">
          <Berty pose={pose} size="xl" look={look} />
        </figure>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Character maker</p>
          <p className="mt-1 text-sm text-muted">
            {n.toLocaleString()} looks. Pose stays for the hour. Unlock the desk to hang it on the wall.
          </p>
          {!unlocked ? <p className="mt-1 text-sm font-semibold text-cleanup">Trying on. Unlock to save.</p> : <p className="mt-1 text-sm text-gain">Live on the wall.</p>}
        </div>
      </div>
      <Row label="Pose">
        {BERTY_POSES.map((p) => (
          <MarkChip key={p.pose} on={pose === p.pose} title={p.label} onClick={() => setPose(p.pose)}>
            {p.label}
          </MarkChip>
        ))}
      </Row>
      <Row label="Color">
        {BERTY_INKS.map((ink) => (
          <button
            key={ink.id}
            type="button"
            title={ink.label}
            onClick={() => paint({ ...look, ink: ink.id })}
            className={cn("tw-tap size-11 rounded-full ring-2 ring-offset-2 ring-offset-surface", look.ink === ink.id ? "ring-gold" : "ring-transparent")}
            style={{ background: ink.swatch }}
            aria-label={ink.label}
          />
        ))}
      </Row>
      <Row label="Kit">
        {BERTY_KITS.map((k) => (
          <MarkChip key={k.id} on={look.kit === k.id} onClick={() => paint({ ...look, kit: k.id })}>
            {k.label}
          </MarkChip>
        ))}
      </Row>
      <Row label="Hat">
        {BERTY_HATS.map((k) => (
          <MarkChip key={k.id} on={look.hat === k.id} onClick={() => paint({ ...look, hat: k.id })}>
            {k.label}
          </MarkChip>
        ))}
      </Row>
      <Row label="Hands">
        {BERTY_HANDS.map((k) => (
          <MarkChip key={k.id} on={look.hand === k.id} onClick={() => paint({ ...look, hand: k.id })}>
            {k.label}
          </MarkChip>
        ))}
      </Row>
      <Row label="Finish">
        {BERTY_FINISH.map((k) => (
          <MarkChip key={k.id} on={look.finish === k.id} onClick={() => paint({ ...look, finish: k.id })}>
            {k.label}
          </MarkChip>
        ))}
      </Row>
      <button
        type="button"
        className="tw-tap min-h-11 rounded-xl bg-elevated px-4 text-sm font-semibold"
        onClick={() => paint(DEFAULT_BERTY_LOOK)}
      >
        Shop cyan · reset
      </button>
    </section>
  );
}
