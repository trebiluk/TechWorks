/** Teacher-only who’s-who. Wall stays alias + shop id. Legal names live on this paper / file. */

import type { EconomyFile } from "@/lib/economy";
import { legalFirstOf, legalLastOf, periodTitle, shopBells } from "@/lib/economy";
import { isDemoStudentId } from "@/lib/demo";
import { publicHandle } from "@/lib/live";
import { todayIso } from "@/lib/calendar";

export type CodebookRow = {
  period: number;
  shop: string;
  id: string;
  alias: string;
  last: string;
  first: string;
};

export function codebookOf(file: EconomyFile): CodebookRow[] {
  const rows: CodebookRow[] = [];
  for (const s of file.students) {
    if (isDemoStudentId(s.id)) continue;
    if (!String(s.id ?? "").trim()) continue;
    rows.push({
      period: s.period,
      shop: publicHandle(s.id),
      id: s.id,
      alias: s.first,
      last: legalLastOf(s),
      first: legalFirstOf(s),
    });
  }
  return rows.sort(
    (a, b) => a.period - b.period || a.last.localeCompare(b.last) || a.alias.localeCompare(b.alias),
  );
}

function csvCell(v: string): string {
  const t = String(v ?? "");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

/** Private CSV. Not the live wall. No IEP/504 — those stay in the names vault. */
export function codebookCsv(rows: CodebookRow[]): string {
  const header = "Period,Shop ID,Alias,Last,First,Locked id";
  const body = rows.map((r) => [String(r.period), r.shop, r.alias, r.last, r.first, r.id].map(csvCell).join(","));
  return [header, ...body].join("\n");
}

export function codebookFileName(date = todayIso()): string {
  return `techworks-CODEBOOK-${date}.csv`;
}

export function codebookHtml(file: EconomyFile, rows = codebookOf(file)): string {
  const bells = shopBells(file);
  const title = file.meta.title?.trim() || "TechWorks";
  const periods = [...new Set(rows.map((r) => r.period))];
  const blocks = periods
    .map((p) => {
      const label = periodTitle(p, bells);
      const body = rows
        .filter((r) => r.period === p)
        .map(
          (r) =>
            `<tr><td class="shop">${esc(r.shop)}</td><td>${esc(r.alias)}</td><td>${esc(r.last)}</td><td>${esc(r.first)}</td></tr>`,
        )
        .join("");
      return `<section><h2>${esc(label)}</h2><table><thead><tr><th>Shop</th><th>Alias</th><th>Last</th><th>First</th></tr></thead><tbody>${body}</tbody></table></section>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>PRIVATE codebook · ${esc(title)}</title>
<style>
  body{font:14px/1.35 ui-sans-serif,system-ui,sans-serif;color:#111;background:#fff;margin:24px}
  .banner{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7a1f1f;margin:0 0 8px}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:#444;font-size:13px;margin:0 0 18px}
  h2{font-size:14px;margin:18px 0 6px}
  table{width:100%;border-collapse:collapse;break-inside:avoid}
  th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #ddd}
  th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#555}
  .shop{font-family:ui-monospace,Menlo,monospace;letter-spacing:.12em;font-weight:700}
  @media print{body{margin:12px} .noprint{display:none}}
</style></head><body>
<p class="banner">Private · teacher drawer · not the wall · not the shop printer</p>
<h1>${esc(title)} codebook</h1>
<p class="sub">${rows.length} workers · ${todayIso()} · Wall shows alias only. This page is who is who.</p>
${blocks || "<p>No workers on this desk.</p>"}
</body></html>`;
}

function esc(v: string): string {
  return String(v ?? "")
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

/** Open a print window. If the browser blocks it, caller should download the CSV instead. */
export function printCodebook(file: EconomyFile): boolean {
  if (typeof window === "undefined") return false;
  const w = window.open("", "_blank", "noopener,noreferrer,width=820,height=960");
  if (!w) return false;
  w.document.open();
  w.document.write(codebookHtml(file));
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    try {
      w.print();
    } catch {
      /* Chromebook may need the teacher to tap Print */
    }
  }, 200);
  return true;
}
