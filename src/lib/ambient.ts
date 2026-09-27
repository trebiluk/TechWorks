/** Neal's mixer. It refuses to be framed (X-Frame-Options: SAMEORIGIN), so it plays in a side window. */
export const AMBIENT_URL = "https://neal.fun/ambient-chaos/";

type Host = Window & { __twAmbient?: Window | null };

function host(): Host | null {
  if (typeof window === "undefined") return null;
  return window as Host;
}

export function ambientOpen(): boolean {
  const w = host()?.__twAmbient;
  return Boolean(w && !w.closed);
}

/** Focus the mix if it is already up. Otherwise open a side window. A blocked popup falls back to a tab. */
export function openAmbientMix(): "side" | "tab" {
  const box = host();
  if (!box) return "tab";
  const live = box.__twAmbient;
  if (live && !live.closed) {
    live.focus();
    return "side";
  }
  const w = box.open(AMBIENT_URL, "tw-ambient", "popup=yes,width=440,height=820,left=8,top=8");
  if (!w) {
    box.open(AMBIENT_URL, "_blank");
    return "tab";
  }
  box.__twAmbient = w;
  w.focus();
  return "side";
}
