const KEY = "techworks-dash-layout-v7";
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
  { id: "class", label: "Goals" },
  { id: "strip", label: "Schedule" },
  { id: "mods", label: "Modules" },
  { id: "tools", label: "Tools" },
  { id: "notes", label: "Announce" },
  { id: "kpis", label: "School" },
] as const;

export type DashRowId = (typeof DASH_ROWS)[number]["id"];

export type DashLayout = {
  order: DashRowId[];
  hidden: DashRowId[];
  schoolN: 5 | 10;
  liveProc: boolean;
  nowGoal: boolean;
  nowBars: boolean;
  nowVisit: boolean;
  nowWeather: boolean;
  rankBtns: boolean;
  layoutOpen: boolean;
};

const IDS = DASH_ROWS.map((r) => r.id);

export const DEFAULT_LAYOUT: DashLayout = {
  order: [...IDS],
  hidden: ["tools"],
  schoolN: 10,
  liveProc: false,
  nowGoal: true,
  nowBars: true,
  nowVisit: false,
  nowWeather: false,
  rankBtns: false,
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

function normalize(raw: Partial<DashLayout> | null, flagsFromSave: boolean): DashLayout {
  const seen = new Set<DashRowId>();
  const order: DashRowId[] = [];
  for (const id of [...(raw?.order ?? []), ...IDS]) {
    const ok = asId(id);
    if (ok && !seen.has(ok)) {
      seen.add(ok);
      order.push(ok);
    }
  }
  const hidden = [...new Set((raw?.hidden ?? []).map(asId).filter((x): x is DashRowId => Boolean(x)))];
  const savedOrder = Array.isArray(raw?.order) ? raw!.order : [];
  if (!savedOrder.includes("tools") && !hidden.includes("tools")) hidden.push("tools");
  const schoolN = raw?.schoolN === 5 ? 5 : 10;
  return {
    order,
    hidden,
    schoolN,
    liveProc: flagsFromSave ? flag(raw?.liveProc, false) : false,
    nowGoal: flagsFromSave ? flag(raw?.nowGoal, false) : false,
    nowBars: flagsFromSave ? flag(raw?.nowBars, false) : false,
    nowVisit: flagsFromSave ? flag(raw?.nowVisit, false) : false,
    nowWeather: flagsFromSave ? flag(raw?.nowWeather, false) : false,
    rankBtns: flagsFromSave ? flag(raw?.rankBtns, false) : false,
    layoutOpen: flagsFromSave ? flag(raw?.layoutOpen, false) : false,
  };
}

/** v6 hid the module row by default. Bring it back once. */
function restoreMods(n: DashLayout): DashLayout {
  return { ...n, hidden: n.hidden.filter((id) => id !== "mods") };
}

export function loadDashLayout(): DashLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const cur = window.localStorage.getItem(KEY);
    if (cur) return normalize(JSON.parse(cur) as Partial<DashLayout>, true);
    for (const k of LEGACY) {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<DashLayout> | DashRowId[];
      const n = Array.isArray(parsed) ? normalize({ order: parsed }, false) : normalize(parsed, false);
      return restoreMods(n);
    }
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

export function moveDashRow(layout: DashLayout, id: string, dir: -1 | 1): DashLayout {
  const i = layout.order.indexOf(id as DashRowId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= layout.order.length) return layout;
  const order = layout.order.slice();
  const [row] = order.splice(i, 1);
  order.splice(j, 0, row);
  return { ...layout, order };
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

export function patchDash(layout: DashLayout, patch: Partial<DashLayout>): DashLayout {
  return { ...layout, ...patch };
}
