import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { money, padFirst, score, shopBells, showFirstReal } from "@/lib/economy";
import { crewsOf } from "@/lib/crews";
import { CREW_COLORS, readCrewLogo, setCrewProfile } from "@/lib/crew-desk";
import { AVATARS, avatarOf } from "@/lib/avatars";
import { abOn, attendOn, buyShop, catalogOf, crewLeaderId, deskBellId, onAbRoster, setAffect, setAvatar, setCrewLeader, setStudentAttend, setStudentNote, type ShopItem } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { periodNow } from "@/lib/bells";
import { CrewBanner, WorkerCard } from "@/components/shop-cards";
import { CrewHex, ScoreDesk } from "@/components/score";
import { assignCrewProject, crewProjectId, slotsOf } from "@/lib/projects";
import { currentCycleOf } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { readOwnCrew, writeOwnCrew } from "@/lib/score-pad";

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
  const [pane, setPane] = useState<"score" | "crew" | "buy">("score");
  const [ownCrew, setOwnCrew] = useState(() => readOwnCrew());
  const [crewKey, setCrewKey] = useState(() => ownCrew || crewsOf(file, period, today)[0]?.key || "Crew A");
  const letter = abOn(file, today);
  const crews = crewsOf(file, period, today).filter((c) => c.kids.length > 0);
  const locked = crews.find((c) => c.key === ownCrew) ?? null;
  const crew = crews.find((c) => c.key === crewKey) ?? crews[0];
  const rec = file.crews.find((c) => c.period === period && c.key === (crew?.key ?? crewKey));
  const shop = catalogOf(file, period);
  const buyOn = shop.length > 0;

  function pickOwn(key: string) {
    setOwnCrew(key);
    setCrewKey(key);
    writeOwnCrew(key);
  }

  function signOut() {
    writeOwnCrew("");
    onSignOut();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg text-fg" data-crew="on">
      <header className="shrink-0 px-2 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <nav className={cn("grid min-w-0 flex-1 gap-1", buyOn ? "grid-cols-3" : "grid-cols-2")} aria-label="Crew">
            <button
              type="button"
              onClick={() => setPane("score")}
              className={cn("tw-tap min-h-11 rounded-xl text-sm font-bold", pane === "score" ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              1 · Score
            </button>
            <button
              type="button"
              onClick={() => setPane("crew")}
              className={cn("tw-tap min-h-11 rounded-xl text-sm font-bold", pane === "crew" ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              2 · Our crew
            </button>
            {buyOn ? (
              <button
                type="button"
                onClick={() => setPane("buy")}
                className={cn("tw-tap min-h-11 rounded-xl text-sm font-bold", pane === "buy" ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                3 · Buy
              </button>
            ) : null}
          </nav>
          <button type="button" onClick={signOut} className="tw-tap min-h-11 rounded-lg bg-elevated px-4 text-sm font-bold">
            Sign out
          </button>
        </div>
      </header>
      {pane === "score" ? (
        <div className="mt-2 min-h-0 flex-1 overflow-hidden px-2 pb-2">
          {!locked ? (
            <div data-crew-pick className="score-lead-card flex min-h-0 flex-1 flex-col gap-3 p-4">
              <p className="font-display text-2xl font-semibold tracking-tight">Which crew are you?</p>
              <p className="text-sm text-muted">Your crew only. Other crews’ marks stay hidden.</p>
              <div className="flex flex-wrap gap-2">
                {crews.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pickOwn(c.key)}
                    className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-xl bg-elevated px-4 text-base font-semibold"
                  >
                    <CrewHex name={c.name || c.key} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ScoreDesk
              file={file}
              onChange={onChange}
              unlocked={false}
              onNeedPin={onNeedPin}
              onOpenId={() => {}}
              jumpPeriod={period}
              jumpCrew={locked.key}
              jumpDate={today}
              onOpenSettings={() => setPane("crew")}
              mode="crew"
              panel="score"
            />
          )}
        </div>
      ) : pane === "buy" ? (
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <CrewBuy
            file={file}
            kids={(crew?.kids ?? []).filter((s) => onAbRoster(s, letter))}
            shop={shop}
            onChange={onChange}
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
  const real = showFirstReal(file);
  function patch(next: { name?: string; motto?: string; icon?: string; color?: string; logo?: string }) {
    onChange(setCrewProfile(file, period, crewKey, next));
  }

  return (
    <div className="flex flex-col gap-3">
      <article className="rounded-2xl p-0">
        <CrewBanner name={name} motto={motto} icon={icon} color={color} logo={logo} period={period} n={kids.length} />
      </article>

      <CrewSlot file={file} period={period} crewKey={crewKey} onChange={onChange} />

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Crown</span>
        <select
          value={crewLeaderId(file, period, crewKey)}
          onChange={(e) => onChange(setCrewLeader(file, period, crewKey, e.target.value))}
          className="mt-1 min-h-12 w-full rounded-xl bg-crew-card px-3 text-base"
        >
          <option value="">No lead yet</option>
          {kids.map((s) => (
            <option key={s.id} value={s.id}>{padFirst(s, real)}</option>
          ))}
        </select>
      </label>

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
                <WorkerCard id={s.id} name={padFirst(s, real)} icon={s.icon} />
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

function CrewSlot({
  file,
  period,
  crewKey,
  onChange,
}: {
  file: EconomyFile;
  period: number;
  crewKey: string;
  onChange: (next: EconomyFile) => void;
}) {
  const cycle = currentCycleOf(file);
  const slots = slotsOf(file, period);
  const pid = crewProjectId(file, cycle, period, crewKey);
  if (!slots.length) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Our job this cycle</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {slots.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(assignCrewProject(file, cycle, period, crewKey, p.id))}
            className={cn("tw-tap min-h-12 rounded-xl px-3 text-sm font-bold", pid === p.id ? "bg-accent text-accent-fg" : "bg-crew-card text-muted")}
          >
            {i + 1} · {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function CrewBuy({
  file,
  kids,
  shop,
  onChange,
}: {
  file: EconomyFile;
  kids: EconomyFile["students"];
  shop: ShopItem[];
  onChange: (next: EconomyFile) => void;
}) {
  const real = showFirstReal(file);
  const rows = score(file);
  const [id, setId] = useState(kids[0]?.id ?? "");
  const me = kids.find((s) => s.id === id) ?? kids[0] ?? null;
  const wallet = me ? rows.find((r) => r.id === me.id)?.quarter ?? 0 : 0;
  const groups = [...new Set(shop.map((x) => x.category))];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Our crew · wallet perks · not the grade</p>
      <div className="flex flex-wrap gap-1">
        {kids.map((s) => {
          const cash = rows.find((r) => r.id === s.id)?.quarter ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setId(s.id)}
              className={cn("tw-tap min-h-12 rounded-xl px-3 text-sm font-bold", (me?.id ?? id) === s.id ? "bg-accent text-accent-fg" : "bg-crew-card text-muted")}
            >
              {padFirst(s, real)}
              <span className="ml-2 font-mono">{money(cash)}</span>
            </button>
          );
        })}
      </div>
      {me ? (
        <p className="font-display text-2xl font-semibold">
          {padFirst(me, real)}
          <span className="ml-2 font-mono text-lg text-gold">{money(wallet)}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">No one in this crew this hour.</p>
      )}
      {groups.map((g) => (
        <div key={g}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{g}</p>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {shop.filter((x) => x.category === g).map((item) => {
              const tooMuch = !me || wallet < item.price;
              return (
                <button
                  key={`${item.category}-${item.name}`}
                  type="button"
                  disabled={tooMuch}
                  onClick={() => me && !tooMuch && onChange(buyShop(file, me.id, item))}
                  className={cn("tw-tap flex min-h-12 items-center justify-between rounded-xl px-3 text-left text-sm font-bold", tooMuch ? "bg-crew-card/50 text-muted" : "bg-crew-card")}
                >
                  <span>{item.name}</span>
                  <span className="font-mono">{money(item.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
