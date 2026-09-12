import { moveId } from "./sort.ts";

const KEY = "techworks-teach-layout-v1";
const V2 = "techworks-teach-look-v2";

export const TEACH_ROWS = [
  { id: "hero", label: "Now" },
  { id: "slots", label: "Slots" },
  { id: "packs", label: "Pack" },
  { id: "tools", label: "Tools" },
  { id: "poll", label: "Poll" },
] as const;

export type TeachRowId = (typeof TEACH_ROWS)[number]["id"];

export type TeachLayout = {
  order: TeachRowId[];
  hidden: TeachRowId[];
};

const IDS = TEACH_ROWS.map((r) => r.id);

export const DEFAULT_TEACH_LAYOUT: TeachLayout = {
  order: ["hero", "slots", "packs", "tools", "poll"],
  hidden: ["packs", "tools"],
};

/** Hero is the live slot. Never hide it. */
export const LOCKED_TEACH_ROWS: TeachRowId[] = ["hero"];

function asId(v: unknown): TeachRowId | null {
  return typeof v === "string" && (IDS as string[]).includes(v) ? (v as TeachRowId) : null;
}

function graft(saved: TeachRowId[]): TeachRowId[] {
  const next = saved.filter((id, i) => saved.indexOf(id) === i);
  for (const id of IDS) {
    if (!next.includes(id)) next.push(id);
  }
  return next;
}

function normalize(raw: Partial<TeachLayout> | null): TeachLayout {
  const seen = new Set<TeachRowId>();
  const saved: TeachRowId[] = [];
  for (const id of raw?.order ?? []) {
    const ok = asId(id);
    if (ok && !seen.has(ok)) {
      seen.add(ok);
      saved.push(ok);
    }
  }
  const hidden = [...new Set((raw?.hidden ?? []).map(asId).filter((x): x is TeachRowId => Boolean(x)))].filter(
    (id) => !LOCKED_TEACH_ROWS.includes(id),
  );
  return { order: graft(saved), hidden };
}

function fromV2(raw: string): TeachLayout | null {
  try {
    const p = JSON.parse(raw) as { tools?: boolean; slots?: boolean; pad?: boolean; packs?: boolean };
    const hidden: TeachRowId[] = [];
    if (p.slots === false) hidden.push("slots");
    if (p.pad !== true) hidden.push("packs");
    if (p.tools !== true) hidden.push("tools");
    return normalize({ order: DEFAULT_TEACH_LAYOUT.order, hidden });
  } catch {
    return null;
  }
}

export function loadTeachLayout(): TeachLayout {
  if (typeof window === "undefined") return DEFAULT_TEACH_LAYOUT;
  try {
    const cur = window.localStorage.getItem(KEY);
    if (cur) return normalize(JSON.parse(cur) as Partial<TeachLayout>);
    const v2 = window.localStorage.getItem(V2);
    if (v2) return fromV2(v2) ?? DEFAULT_TEACH_LAYOUT;
  } catch {
    /* */
  }
  return DEFAULT_TEACH_LAYOUT;
}

export function saveTeachLayout(next: TeachLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* */
  }
}

export function moveTeachTo(layout: TeachLayout, id: string, onto: string): TeachLayout {
  const grab = asId(id);
  const dest = asId(onto);
  if (!grab || !dest) return layout;
  const order = moveId(layout.order, grab, dest);
  if (order === layout.order) return layout;
  return { ...layout, order };
}

export function hideTeachRow(layout: TeachLayout, id: string, on: boolean): TeachLayout {
  const row = asId(id);
  if (!row || LOCKED_TEACH_ROWS.includes(row)) return layout;
  const hidden = layout.hidden.filter((x) => x !== row);
  if (!on) hidden.push(row);
  return { ...layout, hidden };
}

export function teachRowOn(layout: TeachLayout, id: string): boolean {
  return !layout.hidden.includes(id as TeachRowId);
}

/** @deprecated Flags folded into TeachLayout. Kept so old imports typecheck. */
export type TeachLook = {
  tools: boolean;
  slots: boolean;
  packs: boolean;
  objective: boolean;
  pad: boolean;
};

export function loadTeachLook(): TeachLook {
  const l = loadTeachLayout();
  return {
    tools: teachRowOn(l, "tools"),
    slots: teachRowOn(l, "slots"),
    packs: teachRowOn(l, "packs"),
    objective: true,
    pad: teachRowOn(l, "packs"),
  };
}

export function saveTeachLook(next: TeachLook) {
  saveTeachLayout({
    order: DEFAULT_TEACH_LAYOUT.order,
    hidden: [
      ...(next.slots === false ? (["slots"] as TeachRowId[]) : []),
      ...(next.pad || next.packs ? [] : (["packs"] as TeachRowId[])),
      ...(next.tools ? [] : (["tools"] as TeachRowId[])),
    ],
  });
}
