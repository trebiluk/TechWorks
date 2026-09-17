import { useMemo, useState } from "react";
import { MarkChip } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, money, padFirst, periodTitle, score, shopBells, showFirstReal } from "@/lib/economy";
import {
  buyPrint,
  compressPrintPhoto,
  dropPiece,
  copyPiece,
  fidgetCensus,
  fidgetCounts,
  giftPrint,
  largesInStock,
  logPrintRun,
  ownedQty,
  pieceLabel,
  printsOf,
  printLogOf,
  returnPrint,
  RARITY_LABEL,
  SIZE_LABEL,
  smallCount,
  suggestCopy,
  swapPrints,
  tradeNeed,
  tradePrints,
  upsertPiece,
  heldPieces,
  type PrintPiece,
  type PrintRarity,
  type PrintSize,
} from "@/lib/prints";
import { cn } from "@/lib/utils";

function PrintGlyph({ piece }: { piece: PrintPiece }) {
  const tone =
    piece.rarity === "rare"
      ? "bg-accent"
      : piece.rarity === "shiny"
        ? "bg-gold"
        : piece.rarity === "wild"
          ? "bg-gain"
          : "bg-elevated";
  const box = piece.size === "L" ? "h-[72%] w-[72%]" : piece.size === "M" ? "h-[52%] w-[52%]" : "h-[36%] w-[36%]";
  return (
    <div className="relative flex size-full items-center justify-center bg-[radial-gradient(circle_at_28%_18%,color-mix(in_oklab,var(--color-gold)_22%,transparent),transparent_58%)]">
      <span
        className={cn(
          "block rounded-[30%_18%_34%_22%] shadow-[7px_11px_0_color-mix(in_oklab,#000_38%,transparent)]",
          tone,
          box,
        )}
        aria-hidden
      />
    </div>
  );
}

function RarityChip({ rarity }: { rarity: PrintRarity }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        rarity === "rare" && "bg-accent text-accent-fg",
        rarity === "shiny" && "bg-gold text-bg",
        rarity === "wild" && "bg-gain text-bg",
        rarity === "common" && "bg-elevated text-muted",
      )}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}

function PieceCard({
  piece,
  held,
  stock,
  counts,
  onClick,
  dim,
  compact,
}: {
  piece: PrintPiece;
  held?: number;
  stock?: boolean;
  counts?: { made: number; released: number; out: number; bin: number };
  onClick?: () => void;
  dim?: boolean;
  compact?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "tw-gadget flex flex-col overflow-hidden text-left",
        piece.rarity === "rare" && "ring-1 ring-accent",
        piece.rarity === "shiny" && "ring-1 ring-gold",
        piece.rarity === "wild" && "ring-1 ring-gain",
        dim && "opacity-50",
      )}
    >
      <div className="aspect-square bg-elevated">
        {piece.photo ? (
          <img src={piece.photo} alt="" className="size-full object-cover" />
        ) : (
          <PrintGlyph piece={piece} />
        )}
      </div>
      <div className={cn("flex flex-1 flex-col gap-0.5", compact ? "p-1.5" : "gap-1 p-2")}>
        <p className={cn("truncate font-display font-semibold", compact ? "text-xs" : "text-base")}>{pieceLabel(piece)}</p>
        {compact ? null : (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-muted">{SIZE_LABEL[piece.size]}</span>
            <RarityChip rarity={piece.rarity} />
          </div>
        )}
        <p className={cn("mt-auto font-mono tabular-nums", compact ? "text-[11px]" : "text-sm")}>
          {piece.price <= 0 ? "GIFT" : money(piece.price)}
          {held != null && !compact ? <span className="ml-2 text-muted">{stock ? `you ${held}` : `${held} out`}</span> : null}
          {stock && !compact ? <span className="ml-2 text-muted">{piece.stock} in bin</span> : null}
        </p>
        {counts && !compact ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {counts.released} released · {counts.out} out · {counts.bin} bin
            {counts.made ? ` · ${counts.made} made` : ""}
          </p>
        ) : null}
      </div>
    </Tag>
  );
}

export function PrintsBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onFlash,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onFlash?: (msg: string) => void;
}) {
  const pieces = printsOf(file);
  const log = printLogOf(file);
  const bells = shopBells(file);
  const list = useMemo(() => score(file), [file]);
  const [pane, setPane] = useState<"wall" | "hold" | "trade" | "archive" | "stock">(unlocked ? "hold" : "wall");
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const kids = list.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName));
  const real = unlocked && showFirstReal(file);
  const [id, setId] = useState(kids[0]?.id ?? "");
  const me = kids.find((s) => s.id === id) ?? kids[0];
  const who = me ? padFirst(me, real) : "";
  const raw = me ? file.students.find((s) => s.id === me.id) : undefined;
  const [rarity, setRarity] = useState<PrintRarity>("shiny");
  const [largeId, setLargeId] = useState(largesInStock(file)[0]?.id ?? "");
  const [draft, setDraft] = useState<PrintPiece>({
    id: "",
    name: "",
    size: "S",
    rarity: "common",
    price: 5,
    stock: 0,
  });
  const [runQty, setRunQty] = useState(4);
  const [toId, setToId] = useState("");
  const [prove, setProve] = useState("");
  const [swapId, setSwapId] = useState("");

  const gallery = [...pieces].sort((a, b) => {
    const r = { wild: 0, rare: 1, shiny: 2, common: 3 };
    if (r[a.rarity] !== r[b.rarity]) return r[a.rarity] - r[b.rarity];
    return (a.series || "").localeCompare(b.series || "") || a.size.localeCompare(b.size) || pieceLabel(a).localeCompare(pieceLabel(b));
  });
  const census = fidgetCensus(file);
  const releasedAll = census.reduce((n, x) => n + x.released, 0);
  const outAll = census.reduce((n, x) => n + x.out, 0);
  const binAll = census.reduce((n, x) => n + x.bin, 0);

  const need = tradeNeed(rarity);
  const have = me ? smallCount(file, me.id, rarity) : 0;
  const canTrade = Boolean(me && need > 0 && have >= need && largesInStock(file).some((p) => p.id === largeId));

  function mustPin() {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    try {
      const photo = await compressPrintPhoto(f);
      setDraft((d) => ({ ...d, photo }));
    } catch {
      onFlash?.("Photo didn't compress");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Prints</h1>
          <p className="text-sm text-muted">
            {pieces.length
              ? `Fidget bin · ${releasedAll} released · ${outAll} held · ${binAll} in the bin.`
              : "Bin is empty. Add a piece, then the next size is already drafted."}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ["wall", "Gallery"],
            ["hold", "Hold"],
            ["trade", "Trade"],
            ["archive", "Archive"],
            ["stock", "Bin"],
          ] as const).map(([p, label]) => (
            <MarkChip
              key={p}
              mark={markOf(p === "wall" ? "gallery" : p)}
              on={pane === p}
              onClick={() => {
                if (p !== "wall" && !mustPin()) return;
                setPane(p);
              }}
            >
              {label}
            </MarkChip>
          ))}
        </div>
      </header>

      {pane === "wall" ? (
        pieces.length ? (
          <div className="flex flex-col gap-4">
            {[...new Set(gallery.map((p) => p.series || "Prints"))].map((series) => (
              <section key={series}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{series}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {gallery
                    .filter((p) => (p.series || "Prints") === series)
                    .map((p) => (
                      <PieceCard key={p.id} piece={p} />
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="tw-gadget p-4 text-sm text-muted">No pieces on the wall yet. Unlock and add a line in Bin.</p>
        )
      ) : null}

      {pane === "hold" && unlocked ? (
        <>
          <div className="flex flex-wrap gap-1">
            {bells.map((b) => (
              <button
                key={b.period}
                type="button"
                onClick={() => {
                  setPeriod(b.period);
                  const next = list.find((s) => s.period === b.period);
                  if (next) setId(next.id);
                }}
                className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated")}
              >
                {periodTitle(b.period, bells)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {kids.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setId(s.id)}
                className={cn("tw-tap min-h-12 rounded-full px-4 text-sm font-semibold", s.id === me?.id ? "bg-accent text-accent-fg" : "bg-elevated")}
              >
                {padFirst(s, real)}
                <span className="ml-1 font-mono text-xs">{money(s.quarter)}</span>
              </button>
            ))}
          </div>
          {me ? (
            <section className="tw-gadget p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gold">{who} holds</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {heldPieces(file, me.id).length ? (
                  heldPieces(file, me.id).map(({ piece, qty }) => (
                    <PieceCard key={piece.id} piece={piece} held={qty} />
                  ))
                ) : (
                  <p className="col-span-full text-sm text-muted">Nothing yet. Tap a piece in the bin below.</p>
                )}
              </div>
            </section>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Bin · tap to buy for {who || "a worker"}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((p) => {
              const held = ownedQty(raw, p.id);
              const gift = p.price <= 0;
              const broke = !gift && (!me || me.quarter < p.price || p.stock < 1);
              const empty = p.stock < 1;
              return (
                <PieceCard
                  key={p.id}
                  piece={p}
                  held={held}
                  stock
                  counts={fidgetCounts(file, p)}
                  dim={(broke || empty) && !held}
                  onClick={() => {
                    if (!me) return;
                    if (empty) {
                      onFlash?.(`${p.name} is out · log a print run`);
                      return;
                    }
                    if (gift) {
                      onChange(giftPrint(file, me.id, p.id));
                      onFlash?.(`${who} received ${p.name}`);
                      return;
                    }
                    if (broke) {
                      onFlash?.(`${who} can't afford ${p.name}`);
                      return;
                    }
                    onChange(buyPrint(file, me.id, p.id));
                    onFlash?.(`${who} got ${p.name}`);
                  }}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {pane === "trade" && unlocked ? (
        <>
          <div className="flex flex-wrap gap-1">
            {bells.map((b) => (
              <button
                key={b.period}
                type="button"
                onClick={() => {
                  setPeriod(b.period);
                  const next = list.find((s) => s.period === b.period);
                  if (next) setId(next.id);
                }}
                className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated")}
              >
                {periodTitle(b.period, bells)}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">From</p>
          <div className="flex flex-wrap gap-1">
            {kids.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setId(s.id)}
                className={cn("tw-tap min-h-12 rounded-full px-4 text-sm font-semibold", s.id === me?.id ? "bg-accent text-accent-fg" : "bg-elevated")}
              >
                {padFirst(s, real)}
              </button>
            ))}
          </div>
          <section className="tw-gadget p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">Official · smalls for a large</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(["shiny", "rare"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(r)}
                  className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", rarity === r ? "bg-fg text-bg" : "bg-elevated")}
                >
                  {tradeNeed(r)} {RARITY_LABEL[r]} S
                </button>
              ))}
              <select
                value={largeId}
                onChange={(e) => setLargeId(e.target.value)}
                className="min-h-11 rounded-md bg-elevated px-2 text-sm"
              >
                {largesInStock(file).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.stock} in bin
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!canTrade}
                onClick={() => {
                  if (!me || !canTrade) return;
                  onChange(tradePrints(file, me.id, rarity, largeId));
                  onFlash?.(`${who} traded ${need} ${rarity} smalls`);
                }}
                className="tw-tap min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-40"
              >
                Trade · have {have}/{need}
              </button>
            </div>
          </section>
          <section className="tw-gadget p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">Unofficial · prove it</p>
            <p className="mt-1 text-xs text-muted">Kid-to-kid, or back to the bin. Wallet does not move. Type what they proved.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {heldPieces(file, me?.id ?? "").map(({ piece, qty }) => (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => setSwapId(piece.id)}
                  className={cn("tw-tap min-h-11 rounded-full px-3 text-sm", swapId === piece.id ? "bg-fg text-bg" : "bg-elevated")}
                >
                  {pieceLabel(piece)} · {qty}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">To</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setToId("bin")}
                className={cn("tw-tap min-h-11 rounded-full px-3 text-sm font-semibold", toId === "bin" ? "bg-fg text-bg" : "bg-elevated")}
              >
                Bin
              </button>
              {kids
                .filter((s) => s.id !== me?.id)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setToId(s.id)}
                    className={cn("tw-tap min-h-11 rounded-full px-3 text-sm", toId === s.id ? "bg-accent text-accent-fg" : "bg-elevated")}
                  >
                    {padFirst(s, real)}
                  </button>
                ))}
            </div>
            <input
              className="tw-field mt-2 min-h-11 w-full text-sm"
              placeholder="Prove: held the line / fair swap / returned"
              value={prove}
              onChange={(e) => setProve(e.target.value)}
            />
            <button
              type="button"
              disabled={!me || !swapId || !toId}
              onClick={() => {
                if (!me || !swapId || !toId) return;
                if (toId === "bin") {
                  onChange(returnPrint(file, me.id, swapId, prove));
                  onFlash?.(`${who} returned a piece`);
                } else {
                  onChange(swapPrints(file, me.id, toId, swapId, 1, prove));
                  onFlash?.("Unofficial trade logged");
                }
                setProve("");
              }}
              className="tw-tap mt-2 min-h-12 w-full rounded-full bg-gold text-sm font-semibold text-bg disabled:opacity-40"
            >
              Log trade
            </button>
          </section>
        </>
      ) : null}

      {pane === "archive" && unlocked ? (
        <div className="grid gap-3">
          <div className="tw-gadget overflow-auto p-2">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Archive · made / released / held / bin</p>
            <table className="w-full min-w-[32rem] text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-semibold">Piece</th>
                  <th>Var</th>
                  <th>Rarity</th>
                  <th className="text-right">Made</th>
                  <th className="text-right">Released</th>
                  <th className="text-right">Held</th>
                  <th className="text-right">Bin</th>
                </tr>
              </thead>
              <tbody>
                {census.map(({ piece, made, released, out, bin }) => (
                  <tr key={piece.id} className="border-t border-border">
                    <td className="py-1 font-semibold">{piece.name}</td>
                    <td>{piece.variant || "—"}</td>
                    <td>{RARITY_LABEL[piece.rarity]}</td>
                    <td className="text-right font-mono">{made}</td>
                    <td className="text-right font-mono">{released}</td>
                    <td className="text-right font-mono">{out}</td>
                    <td className="text-right font-mono">{bin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="tw-gadget p-3 text-xs text-muted">
            {log.length ? (
              log
                .slice()
                .reverse()
                .map((ev) => (
                  <li key={ev.ts + ev.pieceId + ev.kind} className="border-t border-border py-1.5 first:border-0">
                    {ev.kind} · {ev.note || ev.pieceId} · {ev.qty > 0 ? "+" : ""}
                    {ev.qty}
                  </li>
                ))
            ) : (
              <li>No runs yet.</li>
            )}
          </ul>
        </div>
      ) : null}

      {pane === "stock" && unlocked ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="tw-gadget overflow-auto p-2 lg:col-span-2">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Print run · tap + to add to the bin</p>
            <table className="w-full min-w-[32rem] text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-semibold">Piece</th>
                  <th>Var</th>
                  <th>Rarity</th>
                  <th className="text-right">Made</th>
                  <th className="text-right">Released</th>
                  <th className="text-right">Out</th>
                  <th className="text-right">Bin</th>
                </tr>
              </thead>
              <tbody>
                {census.map(({ piece, made, released, out, bin }) => (
                  <tr key={piece.id} className="border-t border-border">
                    <td className="py-1 font-semibold">{piece.name}</td>
                    <td>{piece.variant || "—"}</td>
                    <td>{RARITY_LABEL[piece.rarity]}</td>
                    <td className="text-right font-mono">{made}</td>
                    <td className="text-right font-mono">{released}</td>
                    <td className="text-right font-mono">{out}</td>
                    <td className="text-right font-mono">{bin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {gallery.map((p) => (
              <div key={p.id} className="flex flex-col gap-1">
                <PieceCard piece={p} stock compact />
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="tw-tap min-h-10 flex-1 rounded-md bg-elevated text-sm" onClick={() => onChange(logPrintRun(file, p.id, runQty, "print run"))}>
                    +{runQty}
                  </button>
                  <button type="button" className="tw-tap min-h-10 rounded-md bg-elevated px-2 text-sm" onClick={() => onChange(logPrintRun(file, p.id, -1, "adjust"))}>
                    −1
                  </button>
                  <button type="button" className="tw-tap min-h-10 rounded-md bg-loss px-2 text-xs text-accent-fg" onClick={() => setDraft(p)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="tw-tap min-h-10 rounded-md bg-elevated px-2 text-xs"
                    onClick={() => {
                      onChange(copyPiece(file, p.id));
                      onFlash?.(`Copied ${p.name}`);
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form
            className="tw-gadget flex flex-col gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim()) return;
              const wasNew = !draft.id;
              onChange(upsertPiece(file, draft));
              if (wasNew) {
                const next = suggestCopy({ ...draft, id: "x" });
                setDraft({ ...next, id: "" });
                onFlash?.(next.size !== draft.size ? `Saved ${draft.name}. Next size ${next.size} is ready.` : `Saved ${draft.name}. Next color is ready.`);
              } else {
                onFlash?.(`Saved ${draft.name}`);
              }
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Piece</p>
            <input className="min-h-10 rounded-md bg-elevated px-2 text-sm" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, id: draft.id })} />
            <input className="min-h-10 rounded-md bg-elevated px-2 text-sm" placeholder="Series (optional)" value={draft.series ?? ""} onChange={(e) => setDraft({ ...draft, series: e.target.value })} />
            <input className="min-h-10 rounded-md bg-elevated px-2 text-sm" placeholder="Variant (blue, translucent, gold flake…)" value={draft.variant ?? ""} onChange={(e) => setDraft({ ...draft, variant: e.target.value })} />
            <div className="grid grid-cols-3 gap-1">
              {(["S", "M", "L"] as PrintSize[]).map((sz) => (
                <button key={sz} type="button" onClick={() => setDraft({ ...draft, size: sz })} className={cn("tw-tap min-h-10 rounded-md text-sm", draft.size === sz ? "bg-fg text-bg" : "bg-elevated")}>
                  {sz}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(["common", "shiny", "rare", "wild"] as PrintRarity[]).map((r) => (
                <button key={r} type="button" onClick={() => setDraft({ ...draft, rarity: r })} className={cn("tw-tap min-h-10 rounded-md text-xs font-semibold", draft.rarity === r ? "bg-fg text-bg" : "bg-elevated")}>
                  {RARITY_LABEL[r]}
                </button>
              ))}
            </div>
            <label className="text-xs text-muted">
              Cash $
              <input type="number" className="mt-1 min-h-10 w-full rounded-md bg-elevated px-2 text-sm" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} />
            </label>
            <label className="text-xs text-muted">
              In bin
              <input type="number" className="mt-1 min-h-10 w-full rounded-md bg-elevated px-2 text-sm" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) || 0 })} />
            </label>
            <label className="tw-tap grid min-h-14 cursor-pointer place-items-center rounded-xl bg-gold text-sm font-semibold text-bg">
              Take photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
            </label>
            <input className="min-h-10 rounded-md bg-elevated px-2 text-sm" placeholder="or paste image URL" value={draft.photo?.startsWith("http") ? draft.photo : ""} onChange={(e) => setDraft({ ...draft, photo: e.target.value })} />
            {draft.photo ? <img src={draft.photo} alt="" className="h-24 w-full rounded-md object-cover" /> : null}
            <label className="text-xs text-muted">
              Print-run qty
              <input type="number" className="mt-1 min-h-10 w-full rounded-md bg-elevated px-2 text-sm" value={runQty} onChange={(e) => setRunQty(Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <button type="submit" className="tw-tap min-h-11 rounded-full bg-accent text-sm font-semibold text-accent-fg">
              {draft.id ? "Save piece" : "Add piece"}
            </button>
            {draft.id ? (
              <button
                type="button"
                className="tw-tap min-h-10 rounded-full bg-elevated text-sm"
                onClick={() => {
                  onChange(copyPiece(file, draft.id));
                  onFlash?.(`Copied ${draft.name}`);
                }}
              >
                Copy this line
              </button>
            ) : null}
            {draft.id ? (
              <button
                type="button"
                className="tw-tap min-h-10 rounded-full bg-loss text-sm text-accent-fg"
                onClick={() => {
                  onChange(dropPiece(file, draft.id));
                  setDraft({ id: "", name: "", size: "S", rarity: "common", price: 5, stock: 0 });
                }}
              >
                Remove from catalog
              </button>
            ) : null}
          </form>
          <ul className="lg:col-span-2 text-xs text-muted">
            {log.slice().reverse().slice(0, 12).map((ev) => (
              <li key={ev.ts + ev.pieceId} className="border-t border-border py-1">
                {ev.kind} · {ev.note || ev.pieceId} · {ev.qty > 0 ? "+" : ""}
                {ev.qty}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
