const KEY = "techworks-learn-look-v1";

export const LEARN_CARDS = [
  { id: "book", label: "Book" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "words", label: "Words" },
  { id: "guide", label: "Guide" },
] as const;

export type LearnCardId = (typeof LEARN_CARDS)[number]["id"];

export type LearnLook = {
  wallOn: LearnCardId[];
};

const ALL = LEARN_CARDS.map((c) => c.id);

export const DEFAULT_LEARN_LOOK: LearnLook = { wallOn: [...ALL] };

export function loadLearnLook(): LearnLook {
  if (typeof window === "undefined") return DEFAULT_LEARN_LOOK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LEARN_LOOK;
    const p = JSON.parse(raw) as Partial<LearnLook>;
    const wallOn = Array.isArray(p.wallOn)
      ? (p.wallOn.filter((id) => ALL.includes(id as LearnCardId)) as LearnCardId[])
      : ALL;
    return { wallOn: wallOn.length ? wallOn : [...ALL] };
  } catch {
    return DEFAULT_LEARN_LOOK;
  }
}

export function saveLearnLook(next: LearnLook) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* */
  }
}

export function learnCardOn(look: LearnLook, id: LearnCardId) {
  return look.wallOn.includes(id);
}

export function toggleLearnCard(look: LearnLook, id: LearnCardId): LearnLook {
  const on = look.wallOn.includes(id);
  const wallOn = on ? look.wallOn.filter((x) => x !== id) : [...look.wallOn, id];
  return { wallOn: wallOn.length ? wallOn : [id] };
}
