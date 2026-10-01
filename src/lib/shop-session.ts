/** This browser only. The code stays off the wall. */

const KEY = "tw-shop-session";

export type ShopSession = { alias: string; code: string; picture: string };

export function loadShopSession(): ShopSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || "") as Partial<ShopSession>;
    const code = String(raw.code ?? "").toUpperCase().replace(/[^A-Z2-9]/g, "");
    const alias = String(raw.alias ?? "").trim();
    if (code.length !== 5 || alias.length < 2) return null;
    return { alias, code, picture: String(raw.picture ?? "🐾") };
  } catch {
    return null;
  }
}

export function saveShopSession(next: ShopSession) {
  sessionStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("tw-shop"));
}

export function clearShopSession() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tw-shop"));
}
