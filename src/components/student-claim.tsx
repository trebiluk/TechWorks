import { useEffect, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { findByShop } from "@/lib/live";
import { pinSet, pinsMatch, rerollWithPin, setStudentPin } from "@/lib/student-pin";
import { loadShopSession, saveShopSession } from "@/lib/shop-session";
import { useLang } from "@/lib/i18n-hook";

/** Five boxes, a pin pad, then a name. The server is the list. Nothing typed as a real name. */
export function StudentClaim({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [boxes, setBoxes] = useState(["", "", "", "", ""]);
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState("");
  const code = boxes.join("");
  const kid = findByShop(file.students, code);
  const ready = Boolean(kid && pinSet(kid));

  useEffect(() => {
    const sync = () => setSigned(Boolean(loadShopSession()));
    sync();
    window.addEventListener("tw-shop", sync);
    return () => window.removeEventListener("tw-shop", sync);
  }, []);

  function setBox(i: number, raw: string) {
    const ch = raw.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(-1);
    const next = boxes.slice();
    next[i] = ch;
    setBoxes(next);
    setMsg("");
    if (ch && i < 4) {
      const el = document.getElementById(`shop-code-${i + 1}`);
      el?.focus();
    }
  }

  function onPaste(text: string) {
    const chars = text.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5).split("");
    const next = ["", "", "", "", ""];
    chars.forEach((ch, i) => {
      next[i] = ch;
    });
    setBoxes(next);
  }

  function tapPin(n: string) {
    setPin((cur) => (cur + n).replace(/\D/g, "").slice(0, 4));
    setMsg("");
  }

  function savePin() {
    if (pin.length !== 4 || pin !== again) {
      setMsg("Pins do not match.");
      return;
    }
    const res = setStudentPin(file, code, pin);
    setMsg(res.error || "Pin saved. You can roll a name.");
    if (!res.error) onChange(res.file);
    setAgain("");
  }

  async function signIn() {
    if (code.length !== 5 || pin.length !== 4) {
      setMsg("Need the 5-character code and the PIN.");
      return;
    }
    if (kid && pinSet(kid) && !pinsMatch(kid, pin)) {
      setMsg("Pin does not match.");
      return;
    }
    try {
      const res = await fetch("/api/who", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, pin, alias: kid?.first || "" }),
      });
      const body = (await res.json()) as { ok?: boolean; alias?: string; error?: string; picture?: string; code?: string };
      if (!body.ok || !body.alias) {
        setMsg(body.error || "That code is not on the list.");
        return;
      }
      saveShopSession({ alias: body.alias, code: body.code || code, picture: body.picture || "🐾" });
      setOpen(false);
      setMsg("");
    } catch {
      setMsg("The room list is offline. Try again when the shop is online.");
    }
  }

  function roll() {
    const res = rerollWithPin(file, code, pin);
    setMsg(res.error || "New name. Your code did not change.");
    if (!res.error) onChange(res.file);
  }

  if (signed) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="tw-tap inline-flex min-h-11 items-center rounded-xl bg-elevated px-3 text-sm font-semibold">
        {t("My code")}
      </button>
    );
  }

  return (
    <section className="shrink-0 rounded-xl bg-surface p-3" data-shop-signin>
      <div className="flex items-center gap-2">
        <p className="font-display text-lg font-semibold">{t("My code")}</p>
        <button type="button" onClick={() => setOpen(false)} className="tw-tap ml-auto min-h-11 text-sm font-semibold text-muted">
          Close
        </button>
      </div>
      <p className="text-sm text-muted">Five letters from your teacher. Then your PIN. Roll a name after that. The code stays yours.</p>
      <div className="mt-2 flex gap-1">
        {boxes.map((ch, i) => (
          <input
            key={i}
            id={`shop-code-${i}`}
            value={ch}
            aria-label={`Code box ${i + 1}`}
            autoCapitalize="characters"
            maxLength={1}
            onPaste={(e) => {
              e.preventDefault();
              onPaste(e.clipboardData.getData("text"));
            }}
            onChange={(e) => setBox(i, e.target.value)}
            className="tw-tap min-h-14 w-12 rounded-xl bg-elevated text-center font-mono text-2xl font-bold outline-none"
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1" aria-label="PIN">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-elevated text-lg font-bold">
            {pin[i] ? "•" : ""}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button key={n} type="button" onClick={() => tapPin(n)} className="tw-tap min-h-12 rounded-xl bg-elevated text-lg font-bold">
            {n}
          </button>
        ))}
        <button type="button" onClick={() => setPin("")} className="tw-tap min-h-12 rounded-xl bg-elevated text-sm font-semibold">
          Clear
        </button>
        <button type="button" onClick={() => tapPin("0")} className="tw-tap min-h-12 rounded-xl bg-elevated text-lg font-bold">
          0
        </button>
        <button type="button" onClick={() => setPin((cur) => cur.slice(0, -1))} className="tw-tap min-h-12 rounded-xl bg-elevated text-sm font-semibold">
          Back
        </button>
      </div>
      {kid && !ready ? (
        <div className="mt-2 grid gap-1">
          <input value={again} onChange={(e) => setAgain(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Pin again" aria-label="Pin again" inputMode="numeric" className="min-h-12 rounded-xl bg-elevated px-3 text-lg outline-none" />
          <button type="button" onClick={savePin} className="tw-tap min-h-12 rounded-xl bg-fg text-sm font-semibold text-bg">
            Set pin
          </button>
        </div>
      ) : null}
      <div className="mt-2 grid gap-1">
        <button type="button" onClick={() => void signIn()} className="tw-tap min-h-12 rounded-xl bg-accent text-sm font-semibold text-accent-fg">
          Sign in
        </button>
        <button type="button" onClick={roll} className="tw-tap min-h-12 rounded-xl bg-elevated text-sm font-semibold">
          Roll a name
        </button>
        <a href="https://apps.kulibert.net/" className="tw-tap inline-flex min-h-12 items-center justify-center rounded-xl bg-elevated text-sm font-semibold">
          Go to Apps
        </a>
      </div>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </section>
  );
}
