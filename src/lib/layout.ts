import { useEffect, useState } from "react";

export const LAYOUT_KEY = "techworks-layout";
const HOLD_KEY = "techworks-layout-hold";
export type LayoutId = "web" | "mobile";

function queryLayout(): LayoutId | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get("layout") === "mobile" || q.get("portal") === "1") return "mobile";
  if (q.get("layout") === "web") return "web";
  return null;
}

export function isPhoneScreen(): boolean {
  if (typeof screen === "undefined") return false;
  const sw = Math.min(screen.width || 9999, screen.height || 9999);
  return sw <= 520;
}

/** Phone / iPad: UA first (Galaxy S22 reports ~980px without a good viewport), then width. */
export function isPhoneUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android.+Mobile|iPhone|iPod|webOS|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
}

export function isPhone(): boolean {
  return isPhoneUA() || isPhoneScreen();
}

/** Phone / iPad: narrow, or coarse pointer under ~iPad landscape. Projector: wide + mouse. */
export function deviceLayout(): LayoutId {
  if (typeof window === "undefined") return "web";
  if (isPhone()) return "mobile";
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  const narrow = w <= 900;
  const tablet = w <= 1180 && window.matchMedia("(pointer: coarse)").matches;
  const touchPad = window.matchMedia("(hover: none)").matches && w <= 1180;
  const shortPhone = window.matchMedia("(pointer: coarse)").matches && h <= 900 && w <= 500;
  return narrow || tablet || touchPad || shortPhone ? "mobile" : "web";
}

function heldLayout(): LayoutId | null {
  try {
    const v = sessionStorage.getItem(HOLD_KEY);
    return v === "web" || v === "mobile" ? v : null;
  } catch {
    return null;
  }
}

export function guessLayout(): LayoutId {
  const q = queryLayout();
  if (q) return q;
  if (isPhone()) return "mobile";
  return heldLayout() ?? deviceLayout();
}

export function storedLayout(): LayoutId {
  return guessLayout();
}

export function paintLayout(id: LayoutId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.layout = id;
}

export function commitLayout(id: LayoutId) {
  try {
    sessionStorage.setItem(HOLD_KEY, id);
  } catch {
    /* private */
  }
  paintLayout(id);
  window.dispatchEvent(new Event("techworks-layout"));
}

export function clearLayoutHold() {
  try {
    sessionStorage.removeItem(HOLD_KEY);
  } catch {
    /* */
  }
}

let watching = false;
let lastAuto: LayoutId | null = null;
let resizeT = 0;

export function installLayoutWatch() {
  if (typeof window === "undefined" || watching) return;
  watching = true;
  lastAuto = deviceLayout();
  paintLayout(guessLayout());
  const bump = () => {
    const auto = deviceLayout();
    if (lastAuto && auto !== lastAuto) {
      lastAuto = auto;
      if (!queryLayout()) clearLayoutHold();
    } else {
      lastAuto = auto;
    }
    const next = guessLayout();
    paintLayout(next);
    window.dispatchEvent(new Event("techworks-layout"));
  };
  const onResize = () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(bump, 120);
  };
  const mq = window.matchMedia("(max-width: 900px)");
  mq.addEventListener("change", bump);
  window.matchMedia("(pointer: coarse)").addEventListener("change", bump);
  window.addEventListener("orientationchange", bump);
  window.addEventListener("resize", onResize);
}

export type Surface = "phone" | "projector" | "workstation";

/** Phone app, FERPA projector, or unlocked teacher workstation. */
export function surfaceOf(
  layout: LayoutId,
  opts: { unlocked?: boolean; embed?: boolean; portal?: boolean },
): Surface {
  if (opts.portal) return "phone";
  if (opts.embed) return "projector";
  if (layout === "mobile") return "phone";
  return opts.unlocked ? "workstation" : "projector";
}

export function useLayout(): LayoutId {
  const [id, setId] = useState<LayoutId>("web");
  useEffect(() => {
    installLayoutWatch();
    setId(guessLayout());
    const on = () => setId(guessLayout());
    window.addEventListener("techworks-layout", on);
    return () => window.removeEventListener("techworks-layout", on);
  }, []);
  return id;
}
