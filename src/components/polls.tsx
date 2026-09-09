import { useState } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { todayIso } from "@/lib/calendar";
import { periodNow } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import {
  POLL_TEMPLATES,
  cancelPoll,
  closePoll,
  launchPoll,
  livePoll,
  optionsOf,
  pollArchive,
  pollBank,
  pollForPeriod,
  pollHead,
  removeBankItem,
  saveBankItem,
  tallyOf,
  votePoll,
  type Poll,
  type PollKind,
} from "@/lib/polls";
import { cn } from "@/lib/utils";

export function PollBars({ poll, file, big }: { poll: Poll; file?: EconomyFile; big?: boolean }) {
  const rows = tallyOf(poll, file);
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className={cn("grid gap-2", big ? "gap-3" : "")}>
      {rows.map((r) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-display text-lg font-semibold">{r.label}</span>
            <span className="font-mono text-muted">{r.n}</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-elevated">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PollWall({ file, period }: { file: EconomyFile; period: number }) {
  const poll = pollForPeriod(file, period);
  if (!poll) return null;
  const head = pollHead(file, period);
  return (
    <section className="tw-gadget p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Live poll</p>
      <h2 className="font-display text-2xl font-semibold tracking-tight">{poll.prompt}</h2>
      <p className="mb-2 text-xs text-muted">
        {head.in}/{head.of} in{poll.period === 0 ? " · all Tech" : ` · P${poll.period}`}
      </p>
      <PollBars poll={poll} file={file} />
    </section>
  );
}

export function PollPad({
  file,
  kids,
  onChange,
}: {
  file: EconomyFile;
  kids: RawStudent[];
  onChange: (next: EconomyFile) => void;
}) {
  const period = kids[0]?.period ?? 0;
  const poll = pollForPeriod(file, period);
  if (!poll || !kids.length) return null;
  return (
    <section className="tw-gadget shrink-0 space-y-2 p-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{poll.prompt}</p>
      <div className="grid grid-cols-2 gap-1">
        {kids.map((s) => (
          <div key={s.id} className="rounded-xl bg-elevated p-2">
            <p className="truncate text-sm font-semibold">{s.first}</p>
            <div className={cn("mt-1 grid gap-1", poll.options.length > 3 ? "grid-cols-4" : poll.options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
              {poll.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onChange(votePoll(file, s.id, o.id))}
                  className={cn(
                    "tw-tap min-h-10 rounded-md px-1 text-xs font-bold",
                    poll.votes[s.id] === o.id ? "bg-accent text-accent-fg" : "bg-surface text-muted",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PollBoard({
  file,
  unlocked,
  onChange,
  onNeedPin,
  period,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  period?: number;
}) {
  const today = todayIso();
  const liveP = periodNow(deskBellId(file, today));
  const shop = shopBells(file).map((b) => b.period);
  const shown = period && shop.includes(period) ? period : liveP != null && shop.includes(liveP) ? liveP : shop[0] ?? 1;
  const live = livePoll(file);
  const head = live ? pollHead(file, live.period || shown) : { in: 0, of: 0 };
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<PollKind>("yesno");
  const [scope, setScope] = useState<number>(shown);
  const [custom, setCustom] = useState("A, B, C");
  const bank = pollBank(file);
  const archive = pollArchive(file);

  function edit(next: EconomyFile) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(next);
  }

  function go(item: { prompt: string; kind: PollKind; options?: string[] }) {
    const opts = item.kind === "custom" ? (item.options ?? custom.split(",")) : undefined;
    edit(launchPoll(file, { prompt: item.prompt || prompt, kind: item.kind, period: scope, options: opts, date: today }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-1">
      {live ? (
        <section className="tw-gadget space-y-3 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Open now</p>
          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight">{live.prompt}</h1>
          <p className="text-sm text-muted">
            {head.in}/{head.of} voted · {live.period === 0 ? "all Tech periods" : `P${live.period}`}
          </p>
          <PollBars poll={live} file={file} big />
          {unlocked ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => edit(closePoll(file))} className="tw-tap min-h-11 rounded-full bg-fg px-4 text-sm font-semibold text-bg">
                Close & save
              </button>
              <button type="button" onClick={() => edit(cancelPoll(file))} className="tw-tap min-h-11 rounded-full bg-elevated px-4 text-sm font-semibold">
                {Object.keys(live.votes).length ? "Close" : "Cancel"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted">Unlock to close. Crew pads take votes.</p>
          )}
        </section>
      ) : (
        <section className="tw-gadget space-y-3 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">New poll</p>
          <p className="text-sm text-muted">Projector shows bars only — no names. Crew pad is where they tap.</p>
          <div className="flex flex-wrap gap-1">
            {shop.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setScope(p)}
                className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold", scope === p ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                P{p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setScope(0)}
              className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold", scope === 0 ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              All Tech
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(["yesno", "abcd", "scale", "emoji", "custom"] as PollKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold uppercase", kind === k ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {k === "yesno" ? "Yes / No" : k === "abcd" ? "A–D" : k === "scale" ? "1–4" : k === "emoji" ? "Emoji" : "Custom"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {POLL_TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => go(t)} className="tw-tap min-h-11 rounded-full bg-elevated px-3 text-sm font-semibold">
                {t.prompt}
              </button>
            ))}
          </div>
          {kind === "custom" ? (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="YES, NO, MAYBE"
              className="min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
            />
          ) : (
            <p className="text-xs text-muted">Choices: {optionsOf(kind).map((o) => o.label).join(" · ")}</p>
          )}
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Or type a question"
              className="min-h-11 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!prompt.trim()) return;
                go({ prompt, kind, options: custom.split(",") });
                setPrompt("");
              }}
              className="tw-tap min-h-11 rounded-full bg-fg px-4 text-sm font-semibold text-bg"
            >
              Open
            </button>
          </div>
          {unlocked && prompt.trim() ? (
            <button
              type="button"
              onClick={() => {
                edit(saveBankItem(file, { id: `b${Date.now().toString(36)}`, prompt, kind, options: kind === "custom" ? custom.split(",") : undefined }));
              }}
              className="text-xs font-semibold text-muted"
            >
              Save to my bank
            </button>
          ) : null}
        </section>
      )}

      {bank.length ? (
        <section className="tw-gadget space-y-2 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">My bank</p>
          <div className="flex flex-wrap gap-1">
            {bank.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1">
                <button type="button" onClick={() => go(b)} className="tw-tap min-h-10 rounded-full bg-elevated px-3 text-sm font-semibold">
                  {b.prompt}
                </button>
                {unlocked ? (
                  <button type="button" onClick={() => edit(removeBankItem(file, b.id))} className="text-xs text-muted">
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {archive.length ? (
        <section className="tw-gadget space-y-3 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Closed</p>
          {archive.slice(0, 8).map((p) => (
            <article key={p.id}>
              <p className="text-sm font-semibold">
                {p.prompt} <span className="font-normal text-muted">{p.date}{p.period ? ` · P${p.period}` : ""}</span>
              </p>
              <PollBars poll={p} />
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
