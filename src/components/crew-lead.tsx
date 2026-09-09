import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { crewsOf } from "@/lib/crews";
import { CREW_COLORS, readCrewLogo, setCrewProfile } from "@/lib/crew-desk";
import { AVATARS, avatarOf } from "@/lib/avatars";
import { abOn, attendOn, deskBellId, onAbRoster, setAffect, setAvatar, setStudentAttend, setStudentNote } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { periodNow } from "@/lib/bells";
import { ScoreDesk } from "@/components/score";
import { cn } from "@/lib/utils";

const FACES = ["😞", "😐", "🙂", "😄"] as const;
const WHERE = ["", "nurse", "library", "teacher"] as const;

export function CrewLead({
  file,
  onChange,
  onNeedPin,
  onSignOut,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onSignOut: () => void;
}) {
  const today = todayIso();
  const bells = shopBells(file);
  const live = periodNow(deskBellId(file, today));
  const period = live && bells.some((b) => b.period === live) ? live : (bells[0]?.period ?? 1);
  const [pane, setPane] = useState<"score" | "crew">("score");
  const [crewKey, setCrewKey] = useState(() => crewsOf(file, period, today)[0]?.key ?? "Crew A");
  const letter = abOn(file, today);
  const crews = crewsOf(file, period, today);
  const crew = crews.find((c) => c.key === crewKey) ?? crews[0];
  const rec = file.crews.find((c) => c.period === period && c.key === (crew?.key ?? crewKey));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-crew text-fg" data-crew="on">
      <header className="shrink-0 px-2 pt-2">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-gold px-3 py-3 text-bg ring-4 ring-gold/40">
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold uppercase tracking-tight">Crew lead · signed in</p>
            <p className="text-sm font-semibold opacity-80">P{period} · scoring + our crew only · not Admin</p>
          </div>
          <button type="button" onClick={onSignOut} className="tw-tap ml-auto min-h-11 rounded-lg bg-bg px-4 text-sm font-bold text-fg">
            Sign out
          </button>
        </div>
        <nav className="mt-2 grid grid-cols-2 gap-1" aria-label="Crew">
          <button
            type="button"
            onClick={() => setPane("score")}
            className={cn("tw-tap min-h-14 rounded-xl text-base font-bold", pane === "score" ? "bg-accent text-accent-fg" : "bg-crew-card text-muted")}
          >
            1 · Daily scoring
          </button>
          <button
            type="button"
            onClick={() => setPane("crew")}
            className={cn("tw-tap min-h-14 rounded-xl text-base font-bold", pane === "crew" ? "bg-accent text-accent-fg" : "bg-crew-card text-muted")}
          >
            2 · Our crew
          </button>
        </nav>
      </header>
      {pane === "score" ? (
        <div className="mt-2 min-h-0 flex-1 overflow-hidden px-2 pb-2">
          <ScoreDesk
            file={file}
            onChange={onChange}
            unlocked={false}
            onNeedPin={onNeedPin}
            onOpenId={() => {}}
            jumpPeriod={period}
            jumpCrew={crew?.key}
            jumpDate={today}
            onOpenSettings={() => setPane("crew")}
            mode="crew"
            panel="score"
          />
        </div>
      ) : (
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {crews.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCrewKey(c.key)}
                className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", (crew?.key ?? crewKey) === c.key ? "bg-fg text-bg" : "bg-crew-card text-muted")}
              >
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </button>
            ))}
          </div>
          {crew ? (
            <CrewEdit
              file={file}
              period={period}
              crewKey={crew.key}
              name={rec?.name ?? crew.name}
              motto={rec?.motto ?? ""}
              icon={rec?.icon ?? ""}
              color={rec?.color ?? ""}
              logo={rec?.logo ?? ""}
              kids={crew.kids.filter((s) => onAbRoster(s, letter))}
              date={today}
              onChange={onChange}
            />
          ) : (
            <p className="p-4 text-sm text-muted">No crew this period.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CrewEdit({
  file,
  period,
  crewKey,
  name,
  motto,
  icon,
  color,
  logo,
  kids,
  date,
  onChange,
}: {
  file: EconomyFile;
  period: number;
  crewKey: string;
  name: string;
  motto: string;
  icon: string;
  color: string;
  logo: string;
  kids: EconomyFile["students"];
  date: string;
  onChange: (next: EconomyFile) => void;
}) {
  function patch(next: { name?: string; motto?: string; icon?: string; color?: string; logo?: string }) {
    onChange(setCrewProfile(file, period, crewKey, next));
  }

  return (
    <div className="flex flex-col gap-3">
      <article className="rounded-2xl p-3" style={color ? { background: color, color: "#06122B" } : undefined}>
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt="" className="size-16 rounded-xl object-cover" /> : <span className="grid size-16 place-items-center rounded-xl bg-black/10 text-3xl">{icon || "★"}</span>}
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none">{name}</p>
            {motto ? <p className="mt-1 text-sm opacity-80">{motto}</p> : null}
          </div>
        </div>
      </article>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Crew name</span>
        <input value={name} maxLength={28} onChange={(e) => patch({ name: e.target.value })} className="mt-1 min-h-12 w-full rounded-xl bg-crew-card px-3 font-display text-xl font-semibold outline-none" />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Motto</span>
        <input value={motto} maxLength={72} onChange={(e) => patch({ motto: e.target.value })} placeholder="We don't leave a mess." className="mt-1 min-h-12 w-full rounded-xl bg-crew-card px-3 text-base outline-none" />
      </label>

      <p className="text-xs font-bold uppercase tracking-wide text-muted">Mark</p>
      <div className="flex flex-wrap gap-1.5">
        {AVATARS.map((a) => (
          <button key={a} type="button" onClick={() => patch({ icon: icon === a ? "" : a })} className={cn("tw-tap grid size-12 place-items-center rounded-lg text-2xl", icon === a ? "bg-accent text-accent-fg" : "bg-crew-card")}>
            {a}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-muted">Color</p>
      <div className="flex flex-wrap gap-1.5">
        {CREW_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => patch({ color: color === c ? "" : c })} className={cn("size-11 rounded-full ring-2", color === c ? "ring-fg" : "ring-transparent")} style={{ background: c }} aria-label={c} />
        ))}
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Logo · photo</span>
        <input type="file" accept="image/*" onChange={(e) => readCrewLogo(e.target.files, (url) => patch({ logo: url }))} className="mt-1 block w-full text-sm" />
        {logo ? (
          <button type="button" onClick={() => patch({ logo: "" })} className="mt-1 text-sm font-semibold text-muted">
            Remove logo
          </button>
        ) : null}
      </label>

      <p className="text-xs font-bold uppercase tracking-wide text-muted">Roster · today</p>
      <ul className="grid gap-2">
        {kids.map((s) => {
          const where = attendOn(s, date);
          const note = s.notes?.[date] ?? "";
          const face = s.affect?.[date] ?? "";
          return (
            <li key={s.id} className="rounded-2xl bg-crew-card p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{avatarOf(s.icon, s.id)}</span>
                <p className="min-w-0 flex-1 font-display text-xl font-semibold">{s.first}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {AVATARS.slice(0, 12).map((a) => (
                  <button key={a} type="button" onClick={() => onChange(setAvatar(file, s.id, s.icon === a ? "" : a))} className={cn("tw-tap grid size-10 place-items-center rounded-lg text-lg", s.icon === a ? "bg-accent text-accent-fg" : "bg-crew")}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {WHERE.map((code) => (
                  <button
                    key={code || "here"}
                    type="button"
                    onClick={() => onChange(setStudentAttend(file, s.id, date, where === code ? "" : code))}
                    className={cn("tw-tap min-h-12 rounded-lg text-xs font-bold uppercase", (code === "" ? !where : where === code) ? "bg-fg text-bg" : "bg-crew text-muted")}
                  >
                    {code || "Here"}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                {FACES.map((e) => (
                  <button key={e} type="button" onClick={() => onChange(setAffect(file, s.id, date, face === e ? "" : e))} className={cn("tw-tap grid size-11 flex-1 place-items-center rounded-lg text-xl", face === e ? "bg-accent" : "bg-crew")}>
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={note}
                placeholder="Note"
                onChange={(e) => onChange(setStudentNote(file, s.id, date, e.target.value))}
                className="mt-2 min-h-11 w-full rounded-lg bg-crew px-3 text-sm outline-none"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
