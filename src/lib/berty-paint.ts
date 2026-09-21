/** HAND LAW: every full-body pose ships two data-berty-hand groups. Icon is head-only. Never a stump. */

const BODY_STOPS = ["#9af4ff", "#7ae8ff", "#2ee6ff", "#1ab8e0", "#0d7a9a"] as const;
const SHOP_CYAN = "#2ee6ff";

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, other: string, t: number): string {
  const a = hexRgb(hex);
  const b = hexRgb(other);
  return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

/** Metal shading of the chosen swatch. Mid stop is the chip itself. */
export function shadeBody(hex: string): Record<(typeof BODY_STOPS)[number], string> {
  return {
    "#9af4ff": mix(hex, "#ffffff", 0.38),
    "#7ae8ff": mix(hex, "#ffffff", 0.2),
    "#2ee6ff": hex.toLowerCase(),
    "#1ab8e0": mix(hex, "#0b1220", 0.22),
    "#0d7a9a": mix(hex, "#0b1220", 0.42),
  };
}

export function stampSvgIds(svg: string, stamp: string): string {
  const tag = stamp.replace(/[^a-zA-Z0-9_-]/g, "") || "b";
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const uniq = [...new Set(ids)].sort((a, b) => b.length - a.length);
  let out = svg;
  for (const id of uniq) {
    const nid = `${id}-${tag}`;
    out = out.replaceAll(`id="${id}"`, `id="${nid}"`);
    out = out.replaceAll(`url(#${id})`, `url(#${nid})`);
    out = out.replaceAll(`url('#${id}')`, `url('#${nid}')`);
    out = out.replaceAll(`href="#${id}"`, `href="#${nid}"`);
    out = out.replaceAll(`xlink:href="#${id}"`, `xlink:href="#${nid}"`);
  }
  return out;
}

export function paintBertySvg(svg: string, body: string, stamp = "b"): string {
  const hex = /^#([0-9a-f]{6})$/i.test(body) ? body.toLowerCase() : SHOP_CYAN;
  let out = svg;
  if (hex !== SHOP_CYAN) {
    const shade = shadeBody(hex);
    for (const stop of BODY_STOPS) out = out.split(stop).join(shade[stop]);
  }
  return stampSvgIds(out, stamp);
}

export function countBertyHands(svg: string): number {
  return (svg.match(/data-berty-hand=/g) ?? []).length;
}
