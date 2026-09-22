import { useMemo, useState } from "react";
import { MarkChip } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";
import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import {
  FACTORY_CRIB,
  INV_KINDS,
  KIND_LABEL,
  adjustQty,
  checkIn,
  checkOut,
  cribOf,
  dropItem,
  holdsKind,
  isLow,
  liveAliases,
  needThisHour,
  onHand,
  seedCrib,
  setBroken,
  takeStock,
  upsertItem,
  type InvItem,
  type InvKind,
} from "@/lib/inventory";
import { todayIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const CREWS = ["A", "B", "C", "D", "E", "F", "G"] as const;
type Pane = "floor" | "low" | "out" | "catalog";

function kindTone(kind: InvKind): string {
  if (kind === "ppe") return "text-accent";
  if (kind === "machine") return "text-cleanup";
  if (kind === "consumable" || kind === "material") return "text-muted";
  return "text-fg";
}

export function InventoryBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onFlash,
  date: dateProp,
  period: periodProp,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onFlash?: (msg: string) => void;
  date?: string;
  period?: number | null;
}) {
  const crib = cribOf(file);
  const bells = shopBells(file);
  const date = dateProp || todayIso();
  const [pane, setPane] = useState<Pane>("floor");
  const [kind, setKind] = useState<InvKind | "all">("all");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState(crib.items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [who, setWho] = useState("");
  const [whoKind, setWhoKind] = useState<"alias" | "crew" | "station">("crew");
  const [crewKey, setCrewKey] = useState("A");
  const [period, setPeriod] = useState(periodProp && bells.some((b) => b.period === periodProp) ? periodProp : (bells[0]?.period ?? 1));
  const [draft, setDraft] = useState<InvItem>({ id: "", name: "", kind: "tool", qty: 1, par: 1, bin: "", unit: "ea" });

  const aliases = liveAliases(file, period);
  const item = crib.items.find((x) => x.id === pick) ?? crib.items[0];
  const holds = crib.holds;
  const low = crib.items.filter((it) => isLow(it, holds));
  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => {
    return crib.items.filter((it) => {
      if (kind !== "all" && it.kind !== kind) return false;
      if (!needle) return true;
      return `${it.name} ${it.bin ?? ""} ${it.station ?? ""} ${it.id}`.toLowerCase().includes(needle);
    });
  }, [crib.items, kind, needle]);

  function mustPin() {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function save(next: EconomyFile, msg?: string) {
    onChange(next);
    if (msg) onFlash?.(msg);
  }

  function whoLabel(): { label: string; kind: "alias" | "crew" | "station"; crewKey?: string } | null {
    if (whoKind === "crew") return { label: `Crew ${crewKey}`, kind: "crew", crewKey };
    const label = who.trim();
    if (!label) return null;
    return { label, kind: whoKind };
  }

  function outItem(it: InvItem, n = qty) {
    if (!mustPin()) return;
    const whoRow = whoLabel();
    if (!whoRow) {
      onFlash?.("Who — crew, alias, or station");
      return;
    }
    const next = checkOut(file, it.id, n, { ...whoRow, period });
    if (next === file) {
      onFlash?.("Can't check out");
      return;
    }
    save(next, `${whoRow.label} · ${it.name}`);
  }

  function takeItem(it: InvItem, n = qty) {
    if (!mustPin()) return;
    const next = takeStock(file, it.id, n, whoLabel()?.label);
    if (next === file) {
      onFlash?.("Can't take");
      return;
    }
    save(next, `Take ${n} ${it.name}`);
  }

  const emptySaved = Boolean(file.meta.config?.crib) && crib.items.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden" data-crib-pane={pane}>
      <header className="flex shrink-0 flex-wrap items-center gap-1">
        {([
          ["floor", "Floor"],
          ["low", `Low${low.length ? ` ${low.length}` : ""}`],
          ["out", `Out${holds.length ? ` ${holds.length}` : ""}`],
          ["catalog", "Catalog"],
        ] as const).map(([id, label]) => (
          <MarkChip key={id} mark={markOf(id === "catalog" ? "bin" : id === "out" ? "desk" : "floor")} on={pane === id} onClick={() => setPane(id)}>
            {label}
          </MarkChip>
        ))}
        <p className="ml-auto text-xs font-semibold uppercase tracking-wide text-muted">
          {crib.items.length} in crib · {holds.length} out
        </p>
      </header>

      {pane !== "out" ? (
        <div className="flex shrink-0 flex-col gap-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find — glasses, clamp, grit…"
            className="min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setKind("all")} className={cn("tw-tap min-h-9 rounded-md px-2.5 text-xs font-semibold", kind === "all" ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
              All
            </button>
            {INV_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={cn("tw-tap min-h-9 rounded-md px-2.5 text-xs font-semibold", kind === k ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {pane === "out" ? (
        <ul className="min-h-0 flex-1 space-y-1 overflow-auto">
          {holds.length === 0 ? <p className="p-3 text-sm text-muted">Nothing is out. Check out a tool, PPE, kit, or machine from Floor.</p> : null}
          {holds.map((h) => {
            const it = crib.items.find((x) => x.id === h.itemId);
            return (
              <li key={h.id} className="tw-gadget flex items-center gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">{it?.name ?? h.itemId}</p>
                  <p className="text-xs text-muted">
                    {h.who} · {h.qty}
                    {h.period ? ` · ${periodTitle(h.period, bells)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!mustPin()) return;
                    save(checkIn(file, h.id), `In · ${h.who}`);
                  }}
                  className="tw-tap min-h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
                >
                  Return
                </button>
              </li>
            );
          })}
        </ul>
      ) : pane === "catalog" ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-auto">
          {emptySaved ? (
            <div className="tw-gadget flex items-center justify-between gap-2 p-3">
              <p className="text-sm">Crib is empty. Load the shop kit (PPE, tools, machines, stock).</p>
              <button
                type="button"
                onClick={() => {
                  if (!mustPin()) return;
                  save(seedCrib(file), "Shop kit");
                }}
                className="tw-tap min-h-11 shrink-0 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
              >
                Load shop kit
              </button>
            </div>
          ) : null}
          <form
            className="tw-gadget grid gap-2 p-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!mustPin()) return;
              if (!draft.name.trim()) return;
              const next = upsertItem(file, draft);
              save(next, draft.id ? `Saved ${draft.name}` : `Added ${draft.name.trim()}`);
              setDraft({ id: "", name: "", kind: draft.kind, qty: 1, par: 1, bin: "", unit: "ea" });
            }}
          >
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" className="min-h-11 rounded-md bg-elevated px-3 text-sm outline-none sm:col-span-2" />
            <select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as InvKind }))} className="min-h-11 rounded-md bg-elevated px-3 text-sm outline-none">
              {INV_KINDS.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
            <input value={draft.bin ?? ""} onChange={(e) => setDraft((d) => ({ ...d, bin: e.target.value }))} placeholder="Bin" className="min-h-11 rounded-md bg-elevated px-3 text-sm outline-none" />
            <label className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-xs font-semibold uppercase text-muted">
              Qty
              <input type="number" min={0} value={draft.qty} onChange={(e) => setDraft((d) => ({ ...d, qty: Number(e.target.value) }))} className="min-w-0 flex-1 bg-transparent text-right text-sm text-fg outline-none" />
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-3 text-xs font-semibold uppercase text-muted">
              Par
              <input type="number" min={0} value={draft.par ?? 0} onChange={(e) => setDraft((d) => ({ ...d, par: Number(e.target.value) }))} className="min-w-0 flex-1 bg-transparent text-right text-sm text-fg outline-none" />
            </label>
            <div className="flex gap-1 sm:col-span-2">
              <button type="submit" className="tw-tap min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg">
                {draft.id ? "Save" : "Add"}
              </button>
              {draft.id ? (
                <button type="button" onClick={() => setDraft({ id: "", name: "", kind: "tool", qty: 1, par: 1, bin: "", unit: "ea" })} className="tw-tap min-h-11 rounded-xl bg-elevated px-4 text-sm font-semibold text-muted">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <ul className="space-y-1">
            {rows.map((it) => (
              <li key={it.id} className="tw-gadget flex flex-wrap items-center gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{it.name}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wide", kindTone(it.kind))}>
                    {KIND_LABEL[it.kind]} · {it.qty} {it.unit || "ea"}
                    {it.par ? ` · par ${it.par}` : ""}
                    {it.bin ? ` · ${it.bin}` : ""}
                    {it.broken ? " · out of service" : ""}
                  </p>
                </div>
                <button type="button" onClick={() => { if (!mustPin()) return; save(adjustQty(file, it.id, 1), `+1 ${it.name}`); }} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold">+</button>
                <button type="button" onClick={() => { if (!mustPin()) return; save(adjustQty(file, it.id, -1), `−1 ${it.name}`); }} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold">−</button>
                {it.kind === "machine" ? (
                  <button type="button" onClick={() => { if (!mustPin()) return; save(setBroken(file, it.id, !it.broken), it.broken ? `Back in · ${it.name}` : `Out of service · ${it.name}`); }} className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", it.broken ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                    {it.broken ? "Fix" : "Break"}
                  </button>
                ) : null}
                <button type="button" onClick={() => setDraft({ ...it })} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold text-muted">Edit</button>
                <button type="button" onClick={() => { if (!mustPin()) return; save(dropItem(file, it.id), `Dropped ${it.name}`); }} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold text-muted">Drop</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
          <ul className="min-h-0 space-y-1 overflow-auto">
            {(pane === "low" ? low.filter((it) => rows.includes(it)) : rows).length === 0 ? (
              <p className="p-3 text-sm text-muted">{pane === "low" ? "Par is met. Nothing broken." : emptySaved ? "Crib is empty — Catalog → Load shop kit." : "No match."}</p>
            ) : null}
            {(pane === "low" ? low.filter((it) => rows.includes(it)) : rows).map((it) => {
              const hand = onHand(it, holds);
              const out = it.qty - hand;
              const lowHit = isLow(it, holds);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => { setPick(it.id); setQty(1); }}
                    className={cn("tw-gadget tw-tap flex w-full items-center gap-2 p-2 text-left", item?.id === it.id && "ring-1 ring-accent")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold">{it.name}</p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wide", kindTone(it.kind))}>
                        {KIND_LABEL[it.kind]}
                        {it.bin ? ` · ${it.bin}` : ""}
                        {it.station ? ` · ${it.station}` : ""}
                      </p>
                    </div>
                    <p className={cn("shrink-0 font-mono text-sm tabular-nums", lowHit ? "text-loss" : "text-fg")}>
                      {hand}
                      <span className="text-muted">/{it.qty}</span>
                    </p>
                    {out > 0 ? <span className="text-[10px] font-bold uppercase text-accent">{out} out</span> : null}
                    {it.broken ? <span className="text-[10px] font-bold uppercase text-loss">Broken</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {item ? (
            <aside className="tw-gadget flex min-h-0 flex-col gap-2 overflow-auto p-3">
              <p className="font-display text-lg font-semibold">{item.name}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {KIND_LABEL[item.kind]} · {onHand(item, holds)} on hand / {item.qty}
                {item.par ? ` · par ${item.par}` : ""}
                {item.unit && item.unit !== "ea" ? ` · ${item.unit}` : ""}
              </p>
              <div className="flex flex-wrap gap-1">
                {bells.map((b) => (
                  <button key={b.period} type="button" onClick={() => setPeriod(b.period)} className={cn("tw-tap min-h-9 rounded-md px-2 text-xs font-semibold", period === b.period ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                    P{b.period}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Who — alias or crew, never a legal name</p>
              <div className="flex flex-wrap gap-1">
                {CREWS.map((L) => (
                  <button
                    key={L}
                    type="button"
                    onClick={() => { setWhoKind("crew"); setCrewKey(L); setWho(""); }}
                    className={cn("tw-tap grid size-11 place-items-center rounded-xl text-sm font-bold", whoKind === "crew" && crewKey === L ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                  >
                    {L}
                  </button>
                ))}
                {item.station ? (
                  <button
                    type="button"
                    onClick={() => { setWhoKind("station"); setWho(item.station ?? ""); }}
                    className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", whoKind === "station" ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                  >
                    {item.station}
                  </button>
                ) : null}
              </div>
              {aliases.length ? (
                <div className="flex flex-wrap gap-1">
                  {aliases.slice(0, 16).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setWhoKind("alias"); setWho(a.alias); }}
                      className={cn("tw-tap min-h-9 rounded-md px-2 text-xs font-semibold", whoKind === "alias" && who === a.alias ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                    >
                      {a.alias}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No aliases this period — type a shop name or tap a crew.</p>
              )}
              <input
                value={whoKind === "crew" ? "" : who}
                onChange={(e) => { setWho(e.target.value); setWhoKind(item.station && e.target.value === item.station ? "station" : "alias"); }}
                placeholder="Shop alias or station"
                className="min-h-11 rounded-md bg-elevated px-3 text-sm outline-none"
              />
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="Less">−</button>
                <p className="min-w-10 text-center font-mono text-lg tabular-nums">{qty}</p>
                <button type="button" onClick={() => setQty((n) => n + 1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="More">+</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {holdsKind(item.kind) ? (
                  <button type="button" onClick={() => outItem(item)} className="tw-tap min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg" disabled={item.broken || onHand(item, holds) < 1}>
                    Check out
                  </button>
                ) : (
                  <button type="button" onClick={() => takeItem(item)} className="tw-tap min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg" disabled={onHand(item, holds) < 1}>
                    Take
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!mustPin()) return;
                    const next = needThisHour(file, date, period, item.name);
                    if (next === file) onFlash?.("Already on Need");
                    else save(next, `Need · ${item.name}`);
                  }}
                  className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold text-muted"
                >
                  Need this hour
                </button>
              </div>
              {holds.filter((h) => h.itemId === item.id).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => { if (!mustPin()) return; save(checkIn(file, h.id), `In · ${h.who}`); }}
                  className="tw-tap min-h-9 w-full rounded-md bg-elevated px-2 text-left text-xs font-semibold text-muted"
                >
                  Return {h.qty} from {h.who}
                </button>
              ))}
            </aside>
          ) : crib.items.length === 0 ? (
            <p className="p-3 text-sm text-muted">{FACTORY_CRIB.length} kit items wait on Catalog → Load shop kit.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
