"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Unlock } from "lucide-react";
import { CREW_PIN, lock, pinReady, savePin, unlockKind, type UnlockKind } from "@/lib/pin";
import { Berty } from "@/components/berty";
import { TwWordmark } from "@/components/tw-mark";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function PinField({
  value,
  onChange,
  onEnter,
  placeholder = "••••",
  autoFocus,
  className,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        aria-label={label ?? "PIN"}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="min-h-11 w-full rounded-md bg-elevated px-3 font-mono text-lg tracking-[0.45em] text-transparent outline-none"
        style={{ caretColor: "var(--color-fg, #f7f9ff)" }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center px-3 font-mono text-lg tracking-[0.45em] text-fg" aria-hidden>
        {value ? "*".repeat(value.length) : <span className="text-muted">{placeholder}</span>}
      </span>
    </div>
  );
}

export function PinPad({
  onClose,
  onUnlock,
  want,
}: {
  onClose: () => void;
  onUnlock: (kind: UnlockKind) => void;
  want?: "teacher" | "crew";
}) {
  const ready = pinReady();
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<"in" | "set">("in");

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
    if (n === CREW_PIN) {
      const kind = unlockKind(n);
      if (kind) {
        onUnlock(kind);
        onClose();
      }
      return;
    }
    if (n === "1111") {
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
          <p className="text-sm font-medium uppercase tracking-wider text-subtle">
            {mode === "set" ? "Set teacher PIN" : want === "crew" ? "Crew lead PIN" : "Desk PIN"}
          </p>
          <Berty pose={ready ? "standing" : "waving"} size="icon" />
        </div>
        <p className="mt-1 text-sm text-muted">
          {mode === "set"
            ? "Choose 4+ digits. Do not use 1111 or 2222. Crew leads keep 2222."
            : want === "crew"
              ? "Crew lead PIN opens Daily scoring and Our crew only. Teacher PIN still opens Admin."
              : "Teacher PIN for Admin. Set it once with Set teacher PIN. The wall is shop names only."}
        </p>
        {mode === "in" ? (
          <>
            <PinField
              autoFocus
              value={code}
              onChange={(v) => {
                setCode(v);
                setErr("");
                if (v.length >= 4) {
                  const kind = unlockKind(v);
                  if (kind) {
                    onUnlock(kind);
                    onClose();
                  }
                }
              }}
              onEnter={tryUnlock}
              className="mt-4"
              label="Desk PIN"
            />
            {err ? <p className="mt-2 text-sm text-loss">{err}</p> : null}
            <p className="mt-2 text-xs text-muted">Opens as soon as the PIN is right — no extra tap.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={tryUnlock} className="min-h-11 flex-1 rounded-lg bg-accent text-sm font-medium text-accent-fg">
                Unlock
              </button>
              <button type="button" onClick={onClose} className="tw-btn-2 min-h-11 flex-1 rounded-lg text-sm font-semibold">
                Cancel
              </button>
            </div>
            <button type="button" onClick={() => setMode("set")} className="mt-3 text-sm text-muted">
              {ready ? "Change teacher PIN" : "Set teacher PIN first"}
            </button>
          </>
        ) : (
          <>
            {ready ? (
              <PinField autoFocus value={code} onChange={setCode} className="mt-4" placeholder="current PIN" label="Current teacher PIN" />
            ) : null}
            <PinField
              autoFocus={!ready}
              value={next}
              onChange={(v) => {
                setNext(v);
                setErr("");
                if (!ready && v === CREW_PIN) {
                  const kind = unlockKind(v);
                  if (kind) {
                    onUnlock(kind);
                    onClose();
                  }
                }
              }}
              onEnter={trySet}
              className="mt-2"
              placeholder="new PIN (4+ digits)"
              label="New teacher PIN"
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
      className="tw-hud-btn tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-gain hover:bg-elevated"
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
      className="tw-hud-btn tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-fg hover:bg-elevated"
    >
      <Lock className="size-5" />
    </button>
  );
}
