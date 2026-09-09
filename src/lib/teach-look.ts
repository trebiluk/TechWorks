const KEY = "techworks-teach-look-v2";

export type TeachLook = {
  tools: boolean;
  slots: boolean;
  packs: boolean;
  objective: boolean;
  pad: boolean;
};

export const DEFAULT_TEACH_LOOK: TeachLook = {
  tools: false,
  slots: true,
  packs: true,
  objective: true,
  pad: false,
};

export function loadTeachLook(): TeachLook {
  if (typeof window === "undefined") return DEFAULT_TEACH_LOOK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TEACH_LOOK;
    const p = JSON.parse(raw) as Partial<TeachLook>;
    return {
      tools: p.tools === true,
      slots: p.slots !== false,
      packs: p.packs !== false,
      objective: p.objective !== false,
      pad: p.pad === true,
    };
  } catch {
    return DEFAULT_TEACH_LOOK;
  }
}

export function saveTeachLook(next: TeachLook) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* */
  }
}
