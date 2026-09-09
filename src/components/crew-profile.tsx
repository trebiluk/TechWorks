import { AVATARS, avatarOf } from "@/lib/avatars";
import { setCrewProfile } from "@/lib/crew-desk";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cn } from "@/lib/utils";

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

  function patch(next: { name?: string; motto?: string; icon?: string }) {
    onChange(setCrewProfile(file, period, crewKey, next));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-2xl bg-crew-card p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Our crew</p>
      <p className="font-display text-2xl font-semibold tracking-tight">Name, mark, motto</p>
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
          <li key={s.id} className="flex items-center gap-2 rounded-xl bg-crew px-2 py-2">
            <span className="text-xl" aria-hidden>
              {avatarOf(s.icon, s.id)}
            </span>
            <span className="truncate font-display text-lg font-semibold">{s.first}</span>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onDone} className="tw-tap min-h-12 rounded-full bg-crew-hi text-sm font-semibold text-bg">
        Done · back to scores
      </button>
    </div>
  );
}
