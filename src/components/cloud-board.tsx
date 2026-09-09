"use client";

import { useEffect, useState } from "react";
import {
  cloudError,
  cloudSavedAt,
  cloudStatus,
  formatDeskKey,
  forgetDeskKey,
  mintDeskKey,
  pullCloud,
  applyCloudPack,
  pushCloud,
  saveDeskKey,
  storedDeskKey,
  type CloudStatus,
} from "@/lib/desk-cloud";
import type { EconomyFile } from "@/lib/economy";
import { cn } from "@/lib/utils";

const LINE: Record<CloudStatus, string> = {
  off: "Cloud is off until this desk saves once.",
  "this-pc": "This host still saves on the PC only. Room pipe is not bound yet.",
  saving: "Writing to the internet…",
  saved: "Saving to the internet whenever this desk saves.",
  behind: "Cloud is newer. Pull to replace this PC.",
  error: "Cloud missed a write. This PC is still saved.",
  "need-key": "Paste the desk key from the other room.",
};

export function CloudBoard({
  file,
  unlocked,
  onNeedPin,
  onLoad,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onLoad: (next: EconomyFile) => void;
}) {
  const [st, setSt] = useState<CloudStatus>(() => cloudStatus());
  const [key, setKey] = useState(() => storedDeskKey());
  const [draft, setDraft] = useState("");
  const [hide, setHide] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const sync = () => {
      setSt(cloudStatus());
      setKey(storedDeskKey());
    };
    window.addEventListener("techworks-cloud", sync);
    return () => window.removeEventListener("techworks-cloud", sync);
  }, []);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  async function pull() {
    if (!gate()) return;
    const pack = await pullCloud();
    if (!pack) {
      setMsg(cloudError() || "No cloud desk yet.");
      return;
    }
    const next = await applyCloudPack(pack);
    if (!next) {
      setMsg("Could not open that desk.");
      return;
    }
    onLoad(next);
    setMsg("Loaded from the internet.");
  }

  async function push() {
    if (!gate()) return;
    const ok = await pushCloud(file);
    setMsg(ok ? "Saved on the internet." : cloudError() || "Still on this PC.");
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Cloud</h2>
      <p className="text-sm text-muted">{LINE[st]}</p>
      {cloudSavedAt() ? (
        <p className="font-mono text-xs text-muted">Last cloud write {cloudSavedAt().replace("T", " ").slice(0, 19)}</p>
      ) : null}
      <div className="rounded-xl bg-elevated px-4 py-3 ring-1 ring-border">
        <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Desk key</p>
        <p className="mt-1 font-mono text-xl font-bold tracking-[0.2em]">{key ? (hide ? "••••-••••" : formatDeskKey(key)) : "—"}</p>
        <p className="mt-2 text-sm text-muted">Same key on every shop PC. Not a student PIN. Names in the cloud are locked with this key.</p>
        <div className="mt-3 flex flex-wrap gap-1">
          <button type="button" onClick={() => setHide((v) => !v)} className="tw-tap min-h-11 rounded-md bg-bg px-3 text-sm font-semibold">
            {hide ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!gate() || !key) return;
              void navigator.clipboard?.writeText(formatDeskKey(key));
              setMsg("Key copied.");
            }}
            className="tw-tap min-h-11 rounded-md bg-bg px-3 text-sm font-semibold"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => {
              if (!gate()) return;
              const next = mintDeskKey();
              setKey(next);
              setHide(false);
              setMsg("New key on this PC. Push to make it the room key.");
            }}
            className="tw-tap min-h-11 rounded-md bg-bg px-3 text-sm font-semibold"
          >
            New key
          </button>
        </div>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Other room</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          className="min-h-11 rounded-md bg-elevated px-3 font-mono tracking-[0.2em]"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => {
            if (!gate()) return;
            saveDeskKey(draft);
            setKey(storedDeskKey());
            setDraft("");
            setMsg("Key stored on this PC. Pull to load the room desk.");
          }}
          className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
        >
          Use this key
        </button>
        <button type="button" onClick={() => void pull()} className="tw-tap min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
          Pull
        </button>
        <button type="button" onClick={() => void push()} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
          Push now
        </button>
        <button
          type="button"
          onClick={() => {
            if (!gate()) return;
            forgetDeskKey();
            setKey("");
            setMsg("This PC forgot the key. Local scores stay.");
          }}
          className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
        >
          Forget key
        </button>
      </div>
      {msg ? <p className="text-sm font-semibold">{msg}</p> : null}
    </section>
  );
}

export function CloudChip({ onOpen }: { onOpen?: () => void }) {
  const [st, setSt] = useState<CloudStatus>(() => cloudStatus());
  useEffect(() => {
    const sync = () => setSt(cloudStatus());
    window.addEventListener("techworks-cloud", sync);
    return () => window.removeEventListener("techworks-cloud", sync);
  }, []);
  const label =
    st === "saved" ? "Cloud" : st === "saving" ? "Saving…" : st === "this-pc" ? "This PC" : st === "need-key" ? "Room key" : st === "error" ? "Cloud miss" : "Cloud";
  const short =
    st === "saved" ? "Cloud" : st === "saving" ? "…" : st === "this-pc" ? "PC" : st === "need-key" ? "Key" : st === "error" ? "Miss" : "Cloud";
  return (
    <button
      type="button"
      onClick={onOpen}
      title={LINE[st]}
      className={cn(
        "tw-tap inline-flex min-h-10 items-center rounded-full px-2 font-mono text-[11px] font-bold uppercase tracking-wide sm:px-3",
        st === "saved" || st === "saving" ? "bg-accent/20 text-accent" : "bg-elevated text-muted",
      )}
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
