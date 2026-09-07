/** Solvay UFSD Food Services. Blue (#0000cd) month PDFs on the district page. */

export const LUNCH_PAGE = "https://www.solvayschools.org/districtpage.cfm?pageid=1934";

export type LunchPull = {
  pdf: string;
  label: string;
  month: string;
  byDate: Record<string, string>;
  source: "live" | "cache";
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

export async function pullLunch(iso: string): Promise<LunchPull> {
  const ym = iso.slice(0, 7);
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
  return {
    pdf: guessMiddlePdf(iso),
    label: `Middle School Menu · ${monthName(iso)} ${iso.slice(0, 4)}`,
    month: ym,
    byDate: {},
    source: "cache",
  };
}
