import { AVATARS } from "@/lib/avatars";
import { setCrewProfile } from "@/lib/crew-desk";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cn } from "@/lib/utils";
import { CrewBanner, WorkerCard } from "@/components/shop-cards";

export function CrewProfilePad({
  file,
  period,
  crewKey,
  kids,
  onChange,
  onDone,
}: {
  file: EconomyFile;
  period: number;
  crewKey: string;
  kids: RawStudent[];
  onChange: (next: EconomyFile) => void;
  onDone: () => void;
}) {
  const rec = file.crews.find((c) => c.period === period && c.key === crewKey);
  const name = rec?.name ?? crewKey;
  const motto = rec?.motto ?? "";
  const icon = rec?.icon ?? "";
  const color = rec?.color ?? "";
  const logo = rec?.logo ?? "";

  function patch(next: { name?: string; motto?: string; icon?: string }) {
    onChange(setCrewProfile(file, period, crewKey, next));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-2xl bg-crew-card p-3">
      <CrewBanner name={name} motto={motto} icon={icon} color={color} logo={logo} period={period} n={kids.length} />
      <p className="text-sm text-muted">You can change this. Seats stay with your teacher. Aliases only.</p>

      <div className="flex flex-wrap gap-1.5">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            title="Crew mark"
            onClick={() => patch({ icon: icon === a ? "" : a })}
            className={cn(
              "tw-tap flex size-11 items-center justify-center rounded-lg text-xl",
              icon === a ? "bg-crew-hi text-bg" : "bg-crew",
            )}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Crew name</span>
        <input
          value={name}
          maxLength={28}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder={crewKey}
          className="mt-1 min-h-12 w-full rounded-xl bg-crew px-3 font-display text-xl font-semibold outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Motto</span>
        <input
          value={motto}
          maxLength={72}
          onChange={(e) => patch({ motto: e.target.value })}
          placeholder="We don't leave a mess."
          className="mt-1 min-h-12 w-full rounded-xl bg-crew px-3 text-base outline-none"
        />
      </label>

      <ul className="grid grid-cols-2 gap-1.5">
        {kids.map((s) => (
          <li key={s.id}>
            <WorkerCard id={s.id} name={s.first} icon={s.icon} />
          </li>
        ))}
      </ul>

      <button type="button" onClick={onDone} className="tw-tap min-h-12 rounded-full bg-crew-hi text-sm font-semibold text-bg">
        Done · back to scores
      </button>
    </div>
  );
}
