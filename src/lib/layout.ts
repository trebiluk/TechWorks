import { useEffect, useState } from "react";

export const LAYOUT_KEY = "techworks-layout";
export type LayoutId = "one";

/** One desk. Portrait wraps the grid; landscape adds columns. */
export function guessLayout(): LayoutId {
  return "one";
}

export function storedLayout(): LayoutId {
  return "one";
}

export function paintLayout(_id?: LayoutId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.layout = "one";
}

export function commitLayout(_id?: LayoutId) {
  paintLayout("one");
  window.dispatchEvent(new Event("techworks-layout"));
}

export function isPhoneScreen(): boolean {
  if (typeof screen === "undefined") return false;
  const sw = Math.min(screen.width || 9999, screen.height || 9999);
  return sw <= 520;
}

export function isPhoneUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android.+Mobile|iPhone|iPod|webOS|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
}

export function isPhone(): boolean {
  return isPhoneUA() || isPhoneScreen();
}

export function deviceLayout(): LayoutId {
  return "one";
}

export function installLayoutWatch() {
  if (typeof document === "undefined") return;
  paintLayout("one");
}

export type Surface = "phone" | "projector" | "workstation";

/** Embed = FERPA projector. Portal = worker phone. Shop desk (locked or not) = workstation with the dock. */
export function surfaceOf(
  _layout: LayoutId,
  opts: { unlocked?: boolean; embed?: boolean; portal?: boolean },
): Surface {
  if (opts.portal) return "phone";
  if (opts.embed) return "projector";
  return "workstation";
}

export function useLayout(): LayoutId {
  const [id, setId] = useState<LayoutId>("one");
  useEffect(() => {
    installLayoutWatch();
    setId("one");
    const on = () => setId("one");
    window.addEventListener("techworks-layout", on);
    return () => window.removeEventListener("techworks-layout", on);
  }, []);
  return id;
}
