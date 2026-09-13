import { useEffect, useState } from "react";

export const LAYOUT_KEY = "techworks-layout";
export type LayoutId = "one";

/** Phone / iPad portrait / Chromebook window. Not UA. */
export const PHONE_MQ = "(max-width: 899px)";

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
  if (typeof window === "undefined") return false;
  return window.matchMedia(PHONE_MQ).matches;
}

export function isPhoneUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android.+Mobile|iPhone|iPod|webOS|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
}

export function isPhone(): boolean {
  return isPhoneUA() || isPhoneScreen();
}

export function paintPhoneChrome() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const on = window.matchMedia(PHONE_MQ).matches;
  document.documentElement.dataset.phone = on ? "on" : "off";
  const vv = window.visualViewport;
  document.documentElement.style.setProperty("--vvh", `${Math.round(vv?.height ?? window.innerHeight)}px`);
}

export function deviceLayout(): LayoutId {
  return "one";
}

export function installLayoutWatch() {
  if (typeof document === "undefined") return;
  paintLayout("one");
  paintPhoneChrome();
  const mq = window.matchMedia(PHONE_MQ);
  mq.addEventListener("change", paintPhoneChrome);
  window.visualViewport?.addEventListener("resize", paintPhoneChrome);
  window.addEventListener("orientationchange", paintPhoneChrome);
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

/** True under 900px. Dock + compact chrome. Follows the window, not the UA. */
export function usePhoneChrome(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ);
    const go = () => {
      paintPhoneChrome();
      setOn(mq.matches);
    };
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return on;
}
