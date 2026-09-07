const PIN_STORE = "techworks-pin";
const UNLOCK = "techworks-unlocked";
const CREW_UNLOCK = "techworks-crew";
const PORTAL_STORE = "techworks-portal-pin";
const PORTAL_UNLOCK = "techworks-portal";
export const DEFAULT_PIN = "1111";
export const CREW_PIN = "2222";
export const DEFAULT_PORTAL_PIN = "2627";

export type UnlockKind = "teacher" | "crew";

export function pinReady(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.localStorage.getItem(PIN_STORE);
  return Boolean(p) && p !== DEFAULT_PIN;
}

export function storedPin(): string {
  if (typeof window === "undefined") return "";
  const p = window.localStorage.getItem(PIN_STORE);
  if (!p || p === DEFAULT_PIN) return "";
  return p;
}

export function savePin(next: string) {
  if (typeof window === "undefined") return;
  const n = next.replace(/\D/g, "").slice(0, 6);
  if (n.length < 4 || n === DEFAULT_PIN || n === CREW_PIN) return;
  window.localStorage.setItem(PIN_STORE, n);
}

export function ensureDefaultPin() {
  /* no factory PIN — teacher sets it once */
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK) === "1";
}

export function crewUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CREW_UNLOCK) === "1";
}

export function unlock(code: string): boolean {
  return unlockKind(code) === "teacher";
}

export function unlockKind(code: string): UnlockKind | null {
  if (typeof window === "undefined") return null;
  const c = code.replace(/\D/g, "");
  if (c === CREW_PIN) {
    window.sessionStorage.setItem(CREW_UNLOCK, "1");
    return "crew";
  }
  if (pinReady() && c === storedPin()) {
    window.sessionStorage.setItem(UNLOCK, "1");
    window.sessionStorage.removeItem(CREW_UNLOCK);
    return "teacher";
  }
  return null;
}

export function lock() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UNLOCK);
  window.sessionStorage.removeItem(CREW_UNLOCK);
}

export function storedPortalPin(): string {
  if (typeof window === "undefined") return DEFAULT_PORTAL_PIN;
  return window.localStorage.getItem(PORTAL_STORE) || DEFAULT_PORTAL_PIN;
}

export function savePortalPin(next: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PORTAL_STORE, next.replace(/\D/g, "").slice(0, 6) || DEFAULT_PORTAL_PIN);
}

export function portalOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PORTAL_UNLOCK) === "1";
}

export function unlockPortal(code: string): boolean {
  if (code.replace(/\D/g, "") !== storedPortalPin()) return false;
  window.sessionStorage.setItem(PORTAL_UNLOCK, "1");
  return true;
}

export function lockPortal() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PORTAL_UNLOCK);
}
