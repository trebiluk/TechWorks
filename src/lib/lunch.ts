/** Solvay UFSD Food Services + Bearcat Bistro cycle. Blue month PDFs; Bistro is the wall line. */

import { ttlGet } from "@/lib/ttl-cache";

export const LUNCH_PAGE = "https://www.solvayschools.org/districtpage.cfm?pageid=1934";
export const BISTRO_DOOR = "https://apps.kulibert.net/bistro/";
export const BISTRO_TODAY = "https://apps.kulibert.net/bistro-today.json";
export function bistroMonthUrl(ym: string): string {
  return `https://apps.kulibert.net/bistro-lunch-${ym}.json`;
}

export type LunchPull = {
  pdf: string;
  label: string;
  month: string;
  byDate: Record<string, string>;
  source: "live" | "cache" | "bistro" | "cycle";
};

export type BistroLine = {
  date: string;
  line: string;
  label: string;
  source: "desk" | "bistro" | "cycle" | "cache";
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const LUNCH_KEY = "tw-bistro";

export function monthName(iso: string): string {
  const m = Number(iso.slice(5, 7));
  return MONTHS[m - 1] ?? "September";
}

export function guessMiddlePdf(iso: string): string {
  const y = iso.slice(0, 4);
  const name = monthName(iso);
  return `https://www.solvayschools.org/tfiles/folder1934/${encodeURIComponent(name + " " + y + " Middle.pdf")}`;
}

export function parseDistrictHtml(html: string): { elem?: string; middle?: string; hs?: string } {
  const out: { elem?: string; middle?: string; hs?: string } = {};
  const re = /href="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1].replace(/%2E/gi, ".").replace(/&/g, "&");
    const low = decodeURIComponent(href).toLowerCase();
    if (!low.includes("folder1934") || !low.includes(".pdf")) continue;
    if (low.includes("middle")) out.middle = href;
    else if (low.includes("elementary")) out.elem = href;
    else if (low.includes("hs") || low.includes("high")) out.hs = href;
  }
  return out;
}

const SKIP =
  /lunch menu|breakfast menu|available with|students may|fruit choice|milk choice|professional|usda|equal opportunity|in accordance|program information|to file|free breakfast|chocolate|employer/i;

export function parseMenuText(text: string, yearMonth: string): Record<string, string> {
  const [year, month] = yearMonth.split("-");
  const byDate: Record<string, string> = {};
  let day: number | null = null;
  const buckets: Record<number, string[]> = {};
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.trim();
    if (!s || s === year) continue;
    const head = s.match(/^(\d{1,2})(?:\s+|$)(.*)$/);
    if (head && Number(head[1]) >= 1 && Number(head[1]) <= 31 && !s.includes("%") && !s.includes("Independence")) {
      day = Number(head[1]);
      buckets[day] ??= [];
      const rest = head[2].replace(/^24/, "").trim();
      if (rest) buckets[day].push(rest);
      continue;
    }
    if (day) (buckets[day] ??= []).push(s);
  }
  for (const [d, lines] of Object.entries(buckets)) {
    const keep = lines.map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x && !SKIP.test(x));
    if (!keep.length) continue;
    let entree = keep[0];
    if (/^soft taco/i.test(entree)) entree = "Soft Taco w/ cheese and lettuce";
    else if (keep[1] && /w\/$|or$/.test(entree)) entree = `${entree} ${keep[1]}`.replace(/\s+/g, " ");
    const iso = `${year}-${month}-${String(d).padStart(2, "0")}`;
    byDate[iso] = entree.slice(0, 80);
  }
  return byDate;
}

/** September 2026 Middle School fallback if the district fetch is down. */
export const FALLBACK_SEP_2026: Record<string, string> = {
  "2026-09-08": "Chicken Poppers w/ Dippin' Sauce",
  "2026-09-09": "Mac & Cheese",
  "2026-09-11": "Cheeseburger or Hamburger",
  "2026-09-12": "Stuffed Crust Pizza",
  "2026-09-14": "ABC Chicken Nuggets",
  "2026-09-15": "Toasted Cheese Sandwich",
  "2026-09-16": "Pasta w/ Meat Sauce",
  "2026-09-17": "Beef Nachos Grande",
  "2026-09-19": "WG Pizza Crunchers",
  "2026-09-21": "Shrimp Poppers",
  "2026-09-22": "General Tso's Chicken",
  "2026-09-23": "Chicken Patty Sandwich",
  "2026-09-24": "Soft Taco w/ cheese and lettuce",
  "2026-09-25": "Personal Pan Pizza",
  "2026-09-28": "Chicken & Waffles",
  "2026-09-29": "French Toast Sticks",
  "2026-09-30": "BBQ Rib Sandwich",
};

/** Monday before first serve day. Same anchor Bearcat Bistro uses. */
export const BISTRO_ANCHOR = "2026-09-07";

/** Four-week MS entrée cycle. Mon–Fri. Soft Taco keeps the classroom line. */
export const BISTRO_WEEKS: string[][] = [
  ["Chicken Poppers w/ Dippin' Sauce", "Chicken Poppers w/ Dippin' Sauce", "Mac & Cheese", "Cheeseburger or Hamburger", "Stuffed Crust Pizza"],
  ["ABC Chicken Nuggets", "Toasted Cheese Sandwich", "Pasta w/ Meat Sauce", "Beef Nachos Grande", "WG Pizza Crunchers"],
  ["Shrimp Poppers", "General Tso's Chicken", "Chicken Patty Sandwich", "Soft Taco w/ cheese and lettuce", "Personal Pan Pizza"],
  ["Chicken & Waffles", "French Toast Sticks", "BBQ Rib Sandwich", "Chef's Choice", "Chicken Tenders"],
];

function atNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekdayShort(iso: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][atNoon(iso).getDay()] ?? "";
}

/** Entrée for a school day from the Bistro 4-week cycle. Weekend / out of year → "". */
export function bistroCycleOf(iso: string): string {
  const day = atNoon(iso);
  const dow = (day.getDay() + 6) % 7; // Mon = 0
  if (dow > 4) return "";
  if (iso < "2026-09-08" || iso > "2027-06-24") return "";
  const origin = atNoon(BISTRO_ANCHOR).getTime();
  const days = Math.floor((day.getTime() - origin) / 86_400_000);
  const week = Math.floor(days / 7);
  const row = BISTRO_WEEKS[(week % 4 + 4) % 4];
  return row?.[dow] ?? "";
}

export function nextServeDay(iso: string): string {
  let cur = iso;
  for (let i = 0; i < 14; i++) {
    if (bistroCycleOf(cur)) return cur;
    const d = atNoon(cur);
    d.setDate(d.getDate() + 1);
    cur = ymd(d);
  }
  return iso;
}

export function bistroLabel(iso: string, line: string, today: string): string {
  if (!line) return "";
  if (iso === today) return line;
  return `${weekdayShort(iso)} · ${line}`;
}

function parseBistroJson(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  if (row.byDate && typeof row.byDate === "object") {
    for (const [k, v] of Object.entries(row.byDate as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 80);
    }
  }
  const date = typeof row.date === "string" ? row.date : "";
  const line = (typeof row.entree === "string" ? row.entree : typeof row.line === "string" ? row.line : "").trim();
  if (date && line) out[date] = line.slice(0, 80);
  return out;
}

export function readLastBistro(): BistroLine | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LUNCH_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as BistroLine;
    return cached?.line ? cached : null;
  } catch {
    return null;
  }
}

/** Paint last-good only when it is this serve day. Recompute the weekday prefix so Sunday's "Mon · …" does not stick on Monday. */
export function relabelBistro(cached: BistroLine, iso: string): BistroLine | null {
  if (!cached?.line) return null;
  if (cached.date !== iso && cached.date !== nextServeDay(iso)) return null;
  return { ...cached, label: bistroLabel(cached.date, cached.line, iso) };
}

export function seedLastBistro(iso: string): BistroLine | null {
  const cached = readLastBistro();
  if (!cached) return null;
  return relabelBistro(cached, iso);
}

export function writeLastBistro(row: BistroLine): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LUNCH_KEY, JSON.stringify(row));
  } catch {
    /* quota */
  }
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function pullLunch(iso: string): Promise<LunchPull> {
  const ym = iso.slice(0, 7);
  const live = await fetchJson(bistroMonthUrl(ym));
  const liveMap = parseBistroJson(live);
  if (Object.keys(liveMap).length) {
    return {
      pdf: guessMiddlePdf(iso),
      label: `Bearcat Bistro · ${monthName(iso)} ${iso.slice(0, 4)}`,
      month: ym,
      byDate: liveMap,
      source: "bistro",
    };
  }
  try {
    const r = await fetch(`/lunch-${ym}.json`, { cache: "force-cache" });
    if (r.ok) {
      const data = (await r.json()) as Partial<LunchPull>;
      if (data?.byDate && Object.keys(data.byDate).length) {
        return {
          pdf: data.pdf || guessMiddlePdf(iso),
          label: data.label || `Middle School Menu · ${monthName(iso)} ${iso.slice(0, 4)}`,
          month: ym,
          byDate: data.byDate,
          source: "cache",
        };
      }
    }
  } catch {
    /* bundled fallback */
  }
  if (ym === "2026-09") {
    return {
      pdf: guessMiddlePdf(iso),
      label: "Middle School Menu · September 2026",
      month: ym,
      byDate: FALLBACK_SEP_2026,
      source: "cache",
    };
  }
  const cycle: Record<string, string> = {};
  for (let d = 1; d <= 31; d++) {
    const isoDay = `${ym}-${String(d).padStart(2, "0")}`;
    if (isoDay.slice(0, 7) !== ym) break;
    const line = bistroCycleOf(isoDay);
    if (line) cycle[isoDay] = line;
  }
  return {
    pdf: guessMiddlePdf(iso),
    label: `Bearcat Bistro · ${monthName(iso)} ${iso.slice(0, 4)}`,
    month: ym,
    byDate: cycle,
    source: "cycle",
  };
}

/** Today's wall line. Teacher dayLog wins. Bistro JSON, then cycle. Weekend → next serve day. */
export function lunchLineOf(iso: string, deskLunch?: string): BistroLine {
  const typed = deskLunch?.trim() ?? "";
  if (typed) return { date: iso, line: typed, label: typed, source: "desk" };
  const serve = nextServeDay(iso);
  const line = bistroCycleOf(serve);
  return { date: serve, line, label: bistroLabel(serve, line, iso), source: "cycle" };
}

export async function pullBistroLunch(iso: string, deskLunch?: string): Promise<BistroLine> {
  const typed = deskLunch?.trim() ?? "";
  if (typed) return { date: iso, line: typed, label: typed, source: "desk" };
  return ttlGet(`bistro:${iso}`, 10 * 60_000, async () => {
    const todayHit = parseBistroJson(await fetchJson(BISTRO_TODAY));
    if (todayHit[iso]) {
      return { date: iso, line: todayHit[iso]!, label: todayHit[iso]!, source: "bistro" as const };
    }
    const pulled = await pullLunch(iso);
    const serve = nextServeDay(iso);
    const line = pulled.byDate[iso] || pulled.byDate[serve] || bistroCycleOf(serve);
    const date = pulled.byDate[iso] ? iso : serve;
    return {
      date,
      line,
      label: bistroLabel(date, line, iso),
      source: pulled.source === "bistro" ? "bistro" : pulled.source === "cycle" ? "cycle" : "cache",
    };
  });
}
