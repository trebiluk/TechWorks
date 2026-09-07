import { useState } from "react";

const KEY = "techworks-start-v1";

export function StartHere({ onUnlock }: { onUnlock: () => void }) {
  const [hide, setHide] = useState(() => typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1");
  if (hide) return null;
  return (
    <aside className="mb-2 rounded-lg bg-elevated px-3 py-2">
      <p className="text-sm font-semibold tracking-wide">Start here</p>
      <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted">
        <li>
          <button type="button" className="text-gold underline-offset-2 hover:underline" onClick={onUnlock}>
            Unlock teacher desk
          </button>{" "}
          (PIN). Wall stays aliases only.
        </li>
        <li>Desk → tap ● ◑ ○. Crew lead uses Crew (teal, no teacher PIN).</li>
        <li>Lock the pad when you walk away. Export LIVE once a day.</li>
      </ol>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(KEY, "1");
          setHide(true);
        }}
        className="mt-2 min-h-11 rounded-md px-3 text-sm text-subtle"
      >
        Got it
      </button>
    </aside>
  );
}
