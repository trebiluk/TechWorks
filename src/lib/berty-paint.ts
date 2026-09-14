/** HAND LAW: every full-body pose has two data-berty-hand groups. Icon is head-only. Never ship a stump. Overflow visible. */

const BODY_STOPS = ["#2ee6ff", "#9af4ff", "#1ab8e0", "#0d7a9a", "#7ae8ff"];

export function paintBertySvg(svg: string, body: string): string {
  const hex = /^#([0-9a-f]{6})$/i.test(body) ? body : "#2ee6ff";
  let out = svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    let a = String(attrs);
    if (!/overflow=/.test(a)) a += ' overflow="visible"';
    a = a.replace(/viewBox="0 0 200 260"/, 'viewBox="-36 -32 272 324"');
    return `<svg${a}>`;
  });
  for (const c of BODY_STOPS) out = out.split(c).join(hex);
  return out;
}

export function countBertyHands(svg: string): number {
  return (svg.match(/data-berty-hand=/g) ?? []).length;
}
