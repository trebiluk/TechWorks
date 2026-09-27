/** Shop code. Locked to the student id. Renaming never changes it. */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function publicHandle(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let out = "";
  for (let i = 0; i < 5; i++) out += ALPHA[(h >>> (i * 5)) & 31];
  return out;
}

/** 32^5 codes. Enough for 400 a year, for decades, with room past that. */
export const SHOP_CODE_SPACE = 32 ** 5;
