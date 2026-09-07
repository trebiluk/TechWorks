"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Unlock } from "lucide-react";
import { CREW_PIN, lock, pinReady, savePin, unlockKind, type UnlockKind } from "@/lib/pin";
import { Berty } from "@/components/berty";
import { TwWordmark } from "@/components/tw-mark";
import { COPYRIGHT_LINE } from "@/lib/copy";

export function PinPad({
  onClose,
  onUnlock,
}: {
  onClose: () => void;
  onUnlock: (kind: UnlockKind) => void;
}) {
  const ready = pinReady();
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<"in" | "set">(ready ? "in" : "set");

  function tryUnlock() {
    const kind = unlockKind(code);
    if (kind) {
      onUnlock(kind);
      onClose();
      return;
    }
    setErr("Wrong PIN");
    setCode("");
  }

  function trySet() {
    const n = next.replace(/\D/g, "").slice(0, 6);
    if (n.length < 4) {
      setErr("At least 4 digits");
      return;
    }
    if (n === "1111" || n === CREW_PIN) {
      setErr("Pick a PIN that is not 1111 or 2222");
      return;
    }
    if (ready) {
      if (unlockKind(code) !== "teacher") {
        setErr("Enter current teacher PIN first");
        return;
      }
    }
    savePin(n);
    const kind = unlockKind(n);
    if (kind) onUnlock(kind);
    onClose();
  }

  const pad = (
    <div className="tw-scrim fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Desk PIN">
      <div className="w-full max-w-sm rounded-xl bg-surface p-5">
        <TwWordmark />
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-sm font-medium uppercase tracking-wider text-subtle">{ready ? "Desk PIN" : "Set teacher PIN"}</p>
          <Berty pose={ready ? "standing" : "waving"} size="icon" />
        </div>
        <p className="mt-1 text-sm text-muted">
          {ready
            ? "Teacher PIN for Admin. Crew leads use a different code. The wall never shows legal names."
            : "Choose 4+ digits. Do not use 1111. Crew leads keep 2222."}
        </p>
        {mode === "in" ? (
          <>
            <input
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              className="mt-4 min-h-11 w-full rounded-md bg-elevated px-3 font-mono text-lg tracking-[0.4em] text-fg outline-none"
              placeholder="••••"
            />
            {err ? <p className="mt-2 text-sm text-loss">{err}</p> : null}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={tryUnlock} className="min-h-11 flex-1 rounded-lg bg-accent text-sm font-medium text-accent-fg">
                Unlock
              </button>
              <button type="button" onClick={onClose} className="tw-btn-2 min-h-11 flex-1 rounded-lg text-sm font-semibold">
                Cancel
              </button>
            </div>
            <button type="button" onClick={() => setMode("set")} className="mt-3 text-sm text-muted">
              Change teacher PIN
            </button>
          </>
        ) : (
          <>
            {ready ? (
              <input
                inputMode="numeric"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-4 min-h-11 w-full rounded-md bg-elevated px-3 font-mono text-lg tracking-[0.4em] text-fg outline-none"
                placeholder="current PIN"
              />
            ) : null}
            <input
              inputMode="numeric"
              autoFocus={!ready}
              value={next}
              onChange={(e) => setNext(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 font-mono text-lg tracking-[0.4em] text-fg outline-none"
              placeholder="new PIN (4+ digits)"
            />
            {err ? <p className="mt-2 text-sm text-loss">{err}</p> : null}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={trySet} className="min-h-11 flex-1 rounded-lg bg-accent text-sm font-medium text-accent-fg">
                Save PIN
              </button>
              <button type="button" onClick={() => (ready ? setMode("in") : onClose())} className="tw-btn-2 min-h-11 flex-1 rounded-lg text-sm font-semibold">
                {ready ? "Back" : "Cancel"}
              </button>
            </div>
          </>
        )}
        <p className="mt-4 text-center text-[11px] text-subtle">{COPYRIGHT_LINE}</p>
      </div>
    </div>
  );
  if (typeof document === "undefined") return pad;
  return createPortal(pad, document.body);
}

export function LockBar({
  unlocked,
  onAsk,
  onLock,
}: {
  unlocked: boolean;
  onAsk: () => void;
  onLock: () => void;
}) {
  return unlocked ? (
    <button
      type="button"
      title="Lock desk"
      aria-label="Lock desk"
      onClick={(e) => {
        e.stopPropagation();
        lock();
        onLock();
      }}
      className="tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-gain hover:bg-elevated"
    >
      <Unlock className="size-5" />
    </button>
  ) : (
    <button
      type="button"
      title="Unlock desk"
      aria-label="Unlock desk"
      onClick={(e) => {
        e.stopPropagation();
        onAsk();
      }}
      className="tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-fg hover:bg-elevated"
    >
      <Lock className="size-5" />
    </button>
  );
}
