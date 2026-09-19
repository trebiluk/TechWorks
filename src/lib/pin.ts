const PIN_STORE = "techworks-pin";
const UNLOCK = "techworks-unlocked";
const CREW_UNLOCK = "techworks-crew";
const PORTAL_STORE = "techworks-portal-pin";
const PORTAL_UNLOCK = "techworks-portal";
/** Factory desk PIN. Always unlocks teacher. Not printed on the student wall. */
export const DEFAULT_PIN = "7879";
export const CREW_PIN = "2222";
export const REJECT_PIN = "1111";
export const DEFAULT_PORTAL_PIN = "2627";

export type UnlockKind = "teacher" | "crew";

function digits(code: string): string {
  return code.replace(/\D/g, "").slice(0, 6);
}

export function pinReady(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.localStorage.getItem(PIN_STORE);
  return typeof p === "string" && p.length >= 4 && p !== REJECT_PIN;
}

export function storedPin(): string {
  if (typeof window === "undefined") return "";
  const p = window.localStorage.getItem(PIN_STORE);
  if (!p || p.length < 4 || p === REJECT_PIN) return "";
  return p;
}

export function savePin(next: string) {
  if (typeof window === "undefined") return;
  const n = digits(next);
  if (n.length < 4 || n === REJECT_PIN || n === CREW_PIN) return;
  window.localStorage.setItem(PIN_STORE, n);
}

export function ensureDefaultPin() {
  if (typeof window === "undefined") return;
  const p = window.localStorage.getItem(PIN_STORE);
  if (!p || p === REJECT_PIN) window.localStorage.setItem(PIN_STORE, DEFAULT_PIN);
}

function openTeacher() {
  window.sessionStorage.setItem(UNLOCK, "1");
  window.sessionStorage.removeItem(CREW_UNLOCK);
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
  const c = digits(code);
  if (c === CREW_PIN) {
    window.sessionStorage.setItem(CREW_UNLOCK, "1");
    return "crew";
  }
  if (c === DEFAULT_PIN) {
    window.localStorage.setItem(PIN_STORE, DEFAULT_PIN);
    openTeacher();
    return "teacher";
  }
  if (pinReady() && c === storedPin()) {
    openTeacher();
    return "teacher";
  }
  return null;
}

export function lock() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UNLOCK);
  window.sessionStorage.removeItem(CREW_UNLOCK);
}

/** Crew kiosk is one sitting. Refresh returns the wall. Teacher unlock can persist. */
export function lockCrew() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CREW_UNLOCK);
}

export function storedPortalPin(): string {
  if (typeof window === "undefined") return DEFAULT_PORTAL_PIN;
  return window.localStorage.getItem(PORTAL_STORE) || DEFAULT_PORTAL_PIN;
}

export function savePortalPin(next: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PORTAL_STORE, digits(next) || DEFAULT_PORTAL_PIN);
}

export function portalOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PORTAL_UNLOCK) === "1";
}

export function unlockPortal(code: string): boolean {
  if (digits(code) !== storedPortalPin()) return false;
  window.sessionStorage.setItem(PORTAL_UNLOCK, "1");
  return true;
}

export function lockPortal() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PORTAL_UNLOCK);
}
