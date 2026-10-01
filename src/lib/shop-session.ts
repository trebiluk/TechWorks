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

export function adoptWho(alias: string, code: string, picture?: string) {
  const shop = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  const name = alias.trim().slice(0, 16);
  if (shop.length !== 5 || name.length < 2) return;
  saveShopSession({ alias: name, code: shop, picture: picture || "🐾" });
}

/** Cookie from the Hub, or a framed {type:"kw-who"} hand-off. No typing. */
export function listenForHub() {
  if (typeof window === "undefined") return () => {};
  const onMsg = (ev: MessageEvent) => {
    let host = "";
    try {
      host = new URL(ev.origin).hostname;
    } catch {
      return;
    }
    const school = host === "kulibert.net" || host.endsWith(".kulibert.net") || host === "localhost" || host === "127.0.0.1";
    if (!school) return;
    const data = ev.data as { type?: string; alias?: string; code?: string; picture?: string; who?: { alias?: string; code?: string; picture?: string } };
    if (!data || data.type !== "kw-who") return;
    const who = data.who ?? data;
    adoptWho(String(who.alias ?? ""), String(who.code ?? ""), who.picture);
  };
  window.addEventListener("message", onMsg);
  void fetch("/api/who", { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { alias?: string; code?: string; picture?: string } | null) => {
      if (body?.alias && body.code) adoptWho(body.alias, body.code, body.picture);
    })
    .catch(() => {});
  return () => window.removeEventListener("message", onMsg);
}
