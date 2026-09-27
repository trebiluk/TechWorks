import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { findByShop } from "@/lib/live";
import { claimAlias, pinSet, rerollWithPin, setStudentPin } from "@/lib/student-pin";

/** Shop code, then a pin, then the alias. The pin is not shown again. */
export function StudentClaim({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [alias, setAlias] = useState("");
  const [msg, setMsg] = useState("");

  const kid = findByShop(file.students, code);
  const ready = Boolean(kid && pinSet(kid));

  function savePin() {
    if (pin !== again) {
      setMsg("Pins do not match.");
      return;
    }
    const res = setStudentPin(file, code, pin);
    setMsg(res.error || "Pin saved. You can change your name.");
    if (!res.error) onChange(res.file);
    setPin("");
    setAgain("");
  }

  function saveAlias() {
    const res = claimAlias(file, code, pin, alias);
    setMsg(res.error || "Name saved.");
    if (!res.error) {
      onChange(res.file);
      setAlias("");
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="tw-tap min-h-11 shrink-0 rounded-xl bg-elevated px-3 text-sm font-semibold">
        My code
      </button>
    );
  }

  return (
    <section className="shrink-0 rounded-xl bg-surface p-3">
      <div className="flex items-center gap-2">
        <p className="font-display text-lg font-semibold">My code</p>
        <button type="button" onClick={() => setOpen(false)} className="tw-tap ml-auto min-h-11 text-sm font-semibold text-muted">
          Close
        </button>
      </div>
      <p className="text-sm text-muted">Type the code from your teacher. Set a pin. Then you can roll a new name. The code stays yours.</p>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          setMsg("");
        }}
        placeholder="Code"
        aria-label="Shop code"
        autoCapitalize="characters"
        className="mt-2 min-h-12 w-full rounded-xl bg-elevated px-3 font-mono text-lg outline-none"
      />
      {kid ? <p className="mt-1 text-sm font-semibold">{kid.first}</p> : code.trim().length >= 4 ? <p className="mt-1 text-sm text-muted">That code is not on the list.</p> : null}
      {kid && !ready ? (
        <div className="mt-2 grid gap-1">
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="New pin" aria-label="New pin" inputMode="numeric" type="password" className="min-h-12 rounded-xl bg-elevated px-3 text-lg outline-none" />
          <input value={again} onChange={(e) => setAgain(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Pin again" aria-label="Pin again" inputMode="numeric" type="password" className="min-h-12 rounded-xl bg-elevated px-3 text-lg outline-none" />
          <button type="button" onClick={savePin} className="tw-tap min-h-12 rounded-xl bg-fg text-sm font-semibold text-bg">
            Set pin
          </button>
        </div>
      ) : null}
      {kid && ready ? (
        <div className="mt-2 grid gap-1">
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Pin" aria-label="Pin" inputMode="numeric" type="password" className="min-h-12 rounded-xl bg-elevated px-3 text-lg outline-none" />
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="New name" aria-label="New name" className="min-h-12 rounded-xl bg-elevated px-3 text-lg outline-none" />
          <button type="button" onClick={saveAlias} className="tw-tap min-h-12 rounded-xl bg-fg text-sm font-semibold text-bg">
            Save name
          </button>
          <button
            type="button"
            onClick={() => {
              const res = rerollWithPin(file, code, pin);
              setMsg(res.error || "New name. Your code did not change.");
              if (!res.error) onChange(res.file);
            }}
            className="tw-tap min-h-12 rounded-xl bg-elevated text-sm font-semibold"
          >
            New name
          </button>
        </div>
      ) : null}
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </section>
  );
}
