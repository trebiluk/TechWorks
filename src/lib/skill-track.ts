/** Staff skill levels. Local to this class. Not the desk file, so the public board never sees them. */

export const TRACK_SKILLS = ["measure", "plan", "build", "test", "fix", "safety", "team", "explain"] as const;
export type TrackSkill = (typeof TRACK_SKILLS)[number];

export const TRACK_PROOFS = ["build", "demo", "oral", "photo"] as const;
export type TrackProof = (typeof TRACK_PROOFS)[number];

export type TrackLevel = 1 | 2 | 3 | 4;

export type SkillMark = {
  alias: string;
  skill: TrackSkill;
  level: TrackLevel;
  proof: TrackProof;
};

export type SkillBook = {
  classId: string;
  marks: SkillMark[];
};

const STORE = "techworks-skill-track-v1";

export function classIdOf(title: string, quarter: string): string {
  const name = title.replace(/[^\w .'-]+/g, "").trim().slice(0, 48) || "class";
  const q = quarter.replace(/[^\w]+/g, "").trim().slice(0, 8) || "Q1";
  return `${name}|${q}`;
}

export function emptyBook(classId: string): SkillBook {
  return { classId, marks: [] };
}

export function bookKey(classId: string): string {
  return `${STORE}:${classId}`;
}

function isSkill(skill: string): skill is TrackSkill {
  return (TRACK_SKILLS as readonly string[]).includes(skill);
}

function isProof(proof: string): proof is TrackProof {
  return (TRACK_PROOFS as readonly string[]).includes(proof);
}

function isLevel(level: number): level is TrackLevel {
  return level === 1 || level === 2 || level === 3 || level === 4;
}

/** One level and one proof for an alias. Bad input leaves the book alone. */
export function setLevel(book: SkillBook, alias: string, skill: string, level: number, proof: string): SkillBook {
  const name = alias.trim().slice(0, 32);
  if (!name || !isSkill(skill) || !isLevel(level) || !isProof(proof)) return book;
  const marks = book.marks.filter((m) => !(m.alias === name && m.skill === skill));
  marks.push({ alias: name, skill, level, proof });
  marks.sort((a, b) => a.alias.localeCompare(b.alias) || a.skill.localeCompare(b.skill));
  return { classId: book.classId, marks };
}

export function markOf(book: SkillBook, alias: string, skill: TrackSkill): SkillMark | null {
  return book.marks.find((m) => m.alias === alias && m.skill === skill) ?? null;
}

export type SkillTally = {
  skill: TrackSkill;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  unset: number;
  atLeast3: number;
  total: number;
};

/** Counts for the aliases in this class. Marks for anyone else are ignored. */
export function classSummary(book: SkillBook, aliases: readonly string[]): SkillTally[] {
  const names = [...new Set(aliases.map((alias) => alias.trim()).filter(Boolean))];
  return TRACK_SKILLS.map((skill) => {
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;
    let n4 = 0;
    let unset = 0;
    for (const alias of names) {
      const level = markOf(book, alias, skill)?.level;
      if (level === 1) n1 += 1;
      else if (level === 2) n2 += 1;
      else if (level === 3) n3 += 1;
      else if (level === 4) n4 += 1;
      else unset += 1;
    }
    return { skill, n1, n2, n3, n4, unset, atLeast3: n3 + n4, total: names.length };
  });
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

/** Header plus one row per mark. Alias, skill, level, proof — nothing else. */
export function csvOf(book: SkillBook): string {
  const lines = ["alias,skill,level,proof"];
  for (const mark of book.marks) {
    lines.push([csvCell(mark.alias), mark.skill, String(mark.level), mark.proof].join(","));
  }
  return lines.join("\n");
}

export function parseBook(raw: string | null, classId: string): SkillBook {
  if (!raw) return emptyBook(classId);
  try {
    const parsed = JSON.parse(raw) as { classId?: string; marks?: SkillMark[] };
    if (parsed.classId !== classId || !Array.isArray(parsed.marks)) return emptyBook(classId);
    let book = emptyBook(classId);
    for (const mark of parsed.marks) {
      book = setLevel(book, String(mark?.alias ?? ""), String(mark?.skill ?? ""), Number(mark?.level), String(mark?.proof ?? ""));
    }
    return book;
  } catch {
    return emptyBook(classId);
  }
}

export function loadBook(classId: string, read: (key: string) => string | null): SkillBook {
  return parseBook(read(bookKey(classId)), classId);
}

export function saveBook(book: SkillBook, write: (key: string, value: string) => void): void {
  write(bookKey(book.classId), JSON.stringify({ classId: book.classId, marks: book.marks }));
}
