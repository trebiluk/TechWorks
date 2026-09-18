import { moveId } from "./sort.ts";

const KEY = "techworks-dash-layout-v15";
const V12 = "techworks-dash-layout-v12";
const V11 = "techworks-dash-layout-v11";
const V10 = "techworks-dash-layout-v10";
const V9 = "techworks-dash-layout-v9";
const V8 = "techworks-dash-layout-v8";
const V7 = "techworks-dash-layout-v7";
const LEGACY = [
  "techworks-dash-layout-v6",
  "techworks-dash-layout-v5",
  "techworks-dash-layout-v4",
  "techworks-dash-layout-v3",
  "techworks-dash-layout-v1",
  "techworks-dash-order-v1",
];

export const DASH_ROWS = [
  { id: "now", label: "Now" },
  { id: "class", label: "Hour" },
  { id: "proc", label: "Do this now" },
  { id: "strip", label: "Schedule" },
  { id: "club", label: "Club" },
  { id: "specials", label: "Specials" },
  { id: "mods", label: "Modules" },
  { id: "tools", label: "Tools" },
  { id: "notes", label: "Announce" },
  { id: "kpis", label: "School" },
  { id: "poll", label: "Poll" },
] as const;

export type DashRowId = (typeof DASH_ROWS)[number]["id"];

/** Hide when empty unless Wall arrange is open. */
export const SOFT_ROWS: DashRowId[] = ["club", "specials", "notes", "poll"];

/** Hour + Do this + the shop ribbon stay on the left unless you drag them. */
export const LEFT_BIAS: DashRowId[] = ["class", "proc", "strip", "club", "specials", "notes"];

export const COL_LEFT = "col:left";
export const COL_RIGHT = "col:right";

export type DashCol = "left" | "right";

export type DashLayout = {
  order: DashRowId[];
  left: DashRowId[];
  right: DashRowId[];
  hidden: DashRowId[];
  schoolN: 5 | 10;
  liveProc: boolean;
  nowGoal: boolean;
  nowBars: boolean;
  nowVisit: boolean;
  nowWeather: boolean;
  rankBtns: boolean;
  rankCards: boolean;
  layoutOpen: boolean;
};

const IDS = DASH_ROWS.map((r) => r.id);
const LEFT_SET = new Set<string>(LEFT_BIAS);

export const DEFAULT_LAYOUT: DashLayout = {
  left: ["class"],
  right: ["now", "strip", "kpis"],
  order: ["class", "now", "strip", "kpis", "proc", "club", "specials", "notes", "poll", "mods", "tools"],
  hidden: ["proc", "tools", "mods", "club", "specials", "notes", "poll"],
  schoolN: 10,
  liveProc: true,
  nowGoal: true,
  nowBars: false,
  nowVisit: false,
  nowWeather: false,
  rankBtns: false,
  rankCards: false,
  layoutOpen: false,
};

function asId(v: unknown): DashRowId | null {
  return typeof v === "string" && (IDS as string[]).includes(v) ? (v as DashRowId) : null;
}

function flag(v: unknown, fallback: boolean): boolean {
  if (v === true) return true;
  if (v === false) return false;
  return fallback;
}

function uniqueIds(raw: unknown): DashRowId[] {
  const seen = new Set<DashRowId>();
  const out: DashRowId[] = [];
  if (!Array.isArray(raw)) return out;
  for (const id of raw) {
    const ok = asId(id);
    if (ok && !seen.has(ok)) {
      seen.add(ok);
      out.push(ok);
    }
  }
  return out;
}

function withCols(layout: DashLayout, left: DashRowId[], right: DashRowId[]): DashLayout {
  return { ...layout, left, right, order: [...left, ...right] };
}

/** Drop unknown ids, then park new plates next to their default neighbors. */
export function graftDashOrder(saved: DashRowId[]): DashRowId[] {
  const next = saved.filter((id, i) => saved.indexOf(id) === i);
  for (const id of IDS) {
    if (next.includes(id)) continue;
    const defIdx = IDS.indexOf(id);
    let placed = false;
    for (let i = defIdx - 1; i >= 0; i--) {
      const at = next.indexOf(IDS[i]);
      if (at >= 0) {
        next.splice(at + 1, 0, id);
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let i = defIdx + 1; i < IDS.length; i++) {
        const at = next.indexOf(IDS[i]);
        if (at >= 0) {
          next.splice(at, 0, id);
          placed = true;
          break;
        }
      }
    }
    if (!placed) next.push(id);
  }
  return next;
}

function splitOrder(order: DashRowId[]): { left: DashRowId[]; right: DashRowId[] } {
  const left: DashRowId[] = [];
  const right: DashRowId[] = [];
  for (const id of order) {
    if (id === "now") right.push(id);
    else if (LEFT_SET.has(id)) left.push(id);
    else right.push(id);
  }
  return graftCols(left, right);
}

function graftCols(left: DashRowId[], right: DashRowId[]): { left: DashRowId[]; right: DashRowId[] } {
  const nextL = left.filter((id, i) => left.indexOf(id) === i);
  const nextR = right.filter((id, i) => right.indexOf(id) === i && !nextL.includes(id));
  for (const id of IDS) {
    if (nextL.includes(id) || nextR.includes(id)) continue;
    if (id === "now" || !LEFT_SET.has(id)) nextR.push(id);
    else nextL.push(id);
  }
  return { left: nextL, right: nextR };
}

function normalize(raw: Partial<DashLayout> | null, flagsFromSave: boolean): DashLayout {
  const savedOrder = uniqueIds(raw?.order);
  const order = graftDashOrder(savedOrder);
  const hasCols = Array.isArray(raw?.left) || Array.isArray(raw?.right);
  const cols = hasCols ? graftCols(uniqueIds(raw?.left), uniqueIds(raw?.right)) : splitOrder(order);
  const hidden = [...new Set((raw?.hidden ?? []).map(asId).filter((x): x is DashRowId => Boolean(x)))];
  if (!savedOrder.includes("tools") && !uniqueIds(raw?.left).includes("tools") && !uniqueIds(raw?.right).includes("tools") && !hidden.includes("tools")) {
    hidden.push("tools");
  }
  const schoolN = raw?.schoolN === 5 ? 5 : 10;
  return {
    order: [...cols.left, ...cols.right],
    left: cols.left,
    right: cols.right,
    hidden,
    schoolN,
    liveProc: flagsFromSave ? flag(raw?.liveProc, true) : true,
    nowGoal: flagsFromSave ? flag(raw?.nowGoal, false) : false,
    nowBars: flagsFromSave ? flag(raw?.nowBars, false) : false,
    nowVisit: flagsFromSave ? flag(raw?.nowVisit, false) : false,
    nowWeather: flagsFromSave ? flag(raw?.nowWeather, false) : false,
    rankBtns: flagsFromSave ? flag(raw?.rankBtns, false) : false,
    rankCards: flagsFromSave ? flag(raw?.rankCards, false) : false,
    layoutOpen: flagsFromSave ? flag(raw?.layoutOpen, false) : false,
  };
}

/** v6 hid the module row by default. Bring it back once. */
function restoreMods(n: DashLayout): DashLayout {
  return { ...n, hidden: n.hidden.filter((id) => id !== "mods") };
}

export function hydrateDashLayout(raw: Partial<DashLayout> | null, flagsFromSave = true): DashLayout {
  return normalize(raw, flagsFromSave);
}

export function loadDashLayout(): DashLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const cur = window.localStorage.getItem(KEY);
    if (cur) return normalize(JSON.parse(cur) as Partial<DashLayout>, true);
    /* v14 and older parked Hour + Do this on the left and left a void. Fresh wall eats the stage. */
  } catch {
    /* */
  }
  return DEFAULT_LAYOUT;
}

export function saveDashLayout(next: DashLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* */
  }
}

export function dashCol(layout: DashLayout, id: string): DashCol | null {
  const row = asId(id);
  if (!row) return null;
  if (layout.left.includes(row)) return "left";
  if (layout.right.includes(row)) return "right";
  return null;
}

export function moveDashRow(layout: DashLayout, id: string, dir: -1 | 1): DashLayout {
  const row = asId(id);
  if (!row) return layout;
  const col = dashCol(layout, row);
  if (!col) return layout;
  const list = layout[col].slice();
  const i = list.indexOf(row);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return layout;
  const [grab] = list.splice(i, 1);
  list.splice(j, 0, grab);
  return withCols(layout, col === "left" ? list : layout.left, col === "right" ? list : layout.right);
}

/** Drop onto a plate, or onto col:left / col:right. */
export function moveDashTo(layout: DashLayout, id: string, onto: string): DashLayout {
  const grab = asId(id);
  if (!grab) return layout;
  const left0 = layout.left.filter((x) => x !== grab);
  const right0 = layout.right.filter((x) => x !== grab);

  if (onto === COL_LEFT || onto === COL_RIGHT) {
    const dest: DashCol = onto === COL_LEFT ? "left" : "right";
    if (layout[dest].includes(grab)) return layout;
    return withCols(layout, dest === "left" ? [...left0, grab] : left0, dest === "right" ? [...right0, grab] : right0);
  }

  const dest = asId(onto);
  if (!dest) return layout;
  const destCol = dashCol(layout, dest);
  if (!destCol) return layout;
  const list = (destCol === "left" ? left0 : right0).slice();
  const at = list.indexOf(dest);
  if (at < 0) return layout;
  list.splice(at, 0, grab);
  return withCols(layout, destCol === "left" ? list : left0, destCol === "right" ? list : right0);
}

export function hideDashRow(layout: DashLayout, id: string, on: boolean): DashLayout {
  const row = asId(id);
  if (!row) return layout;
  const hidden = layout.hidden.filter((x) => x !== row);
  if (!on) hidden.push(row);
  return { ...layout, hidden };
}

export function rowOn(layout: DashLayout, id: string): boolean {
  return !layout.hidden.includes(id as DashRowId);
}

export function isSoftRow(id: string): boolean {
  return (SOFT_ROWS as string[]).includes(id);
}

export function patchDash(layout: DashLayout, patch: Partial<DashLayout>): DashLayout {
  const next = { ...layout, ...patch };
  if (patch.left || patch.right) return withCols(next, next.left, next.right);
  return next;
}

export const DASH_KITS = [
  { id: "wall", label: "Wall", hint: "Hour left. Clock right. Back row." },
  { id: "work", label: "Work", hint: "Hour + Do this. Timer on the right." },
  { id: "score", label: "Score", hint: "Lead board left. Hour under it." },
  { id: "club", label: "Club", hint: "Club pulse left, then the hour." },
] as const;

export type DashKitId = (typeof DASH_KITS)[number]["id"];

function kitCols(leftHead: DashRowId[], rightHead: DashRowId[]): { left: DashRowId[]; right: DashRowId[] } {
  const used = new Set<string>([...leftHead, ...rightHead]);
  const left = [...leftHead, ...LEFT_BIAS.filter((id) => !used.has(id))];
  const right = [...rightHead, ...IDS.filter((id) => !used.has(id) && !left.includes(id))];
  return { left, right };
}

export function applyDashKit(layout: DashLayout, id: DashKitId): DashLayout {
  const keep = { layoutOpen: layout.layoutOpen, schoolN: layout.schoolN };
  if (id === "work") {
    const cols = kitCols(["class"], ["now", "tools"]);
    return {
      ...DEFAULT_LAYOUT,
      ...keep,
      ...cols,
      order: [...cols.left, ...cols.right],
      hidden: ["proc", "mods", "notes", "poll", "specials", "kpis", "club", "strip"],
      rankCards: false,
    };
  }
  if (id === "score") {
    const cols = kitCols(["kpis", "class"], ["now"]);
    return {
      ...DEFAULT_LAYOUT,
      ...keep,
      ...cols,
      order: [...cols.left, ...cols.right],
      hidden: ["proc", "tools", "mods", "notes", "poll", "specials", "club", "strip"],
      rankCards: true,
      rankBtns: true,
      schoolN: 10,
    };
  }
  if (id === "club") {
    const cols = kitCols(["club", "class"], ["now"]);
    return {
      ...DEFAULT_LAYOUT,
      ...keep,
      ...cols,
      order: [...cols.left, ...cols.right],
      hidden: ["proc", "tools", "mods", "kpis", "poll", "specials", "notes", "strip"],
      rankCards: false,
    };
  }
  const cols = kitCols(["class"], ["now", "strip", "kpis"]);
  return {
    ...DEFAULT_LAYOUT,
    ...keep,
    ...cols,
    order: [...cols.left, ...cols.right],
    hidden: ["proc", "tools", "mods", "notes", "poll", "specials", "club"],
    rankCards: false,
    nowWeather: false,
    nowVisit: false,
    nowBars: false,
  };
}
