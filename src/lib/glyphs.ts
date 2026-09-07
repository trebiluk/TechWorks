/** Sparse Unicode for the wall and pads. Not emoji. */

export const G = {
  xp: "◆",
  perk: "$",
  stock: "▲",
  grade: "▣",
  due: "!",
  ok: "✓",
  no: "✗",
  wait: "○",
  help: "?",
  check: "✓",
  teach: "★",
  absent: "✗",
  excused: "–",
  personal: "⏸",
  full: "●",
  steady: "◑",
  start: "○",
  dayA: "A",
  dayB: "B",
  watch: "◉",
  sit: "☰",
  ny: "§",
  picker: "⚄",
  timer: "⏱",
  store: "▣",
  crew: "☰",
  desk: "✎",
  skill: "⚒",
  weather: "☁",
  reward: "★",
  lock: "🔒",
  save: "⤓",
} as const;

export const CODE_GLYPH: Record<string, string> = {
  "3": "●",
  "2": "◑",
  "1": "○",
  A: "✗",
  E: "–",
  P: "⏸",
  Assist: "+",
};

export function codeGlyph(code: string): string {
  return CODE_GLYPH[code] ?? "·";
}
