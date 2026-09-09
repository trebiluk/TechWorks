/** Excel renderer for the Google book. Light paper, navy lock headers. */
import ExcelJS from "exceljs";
import type { EconomyFile } from "./economy";
import type { ClubFile } from "./club";
import { bookFileName, buildBook, type BookCell, type BookSheet } from "./book";

const NAVY = "FF06122B";
const ROYAL = "FF1E4BAF";
const PAPER = "FFF7F4EE";
const INK = "FF1A1A18";
const MUTED = "FF5C5A55";
const WARN = "FF7A1F1F";
const LOCK_FILL = "FFE8EEF8";
const EXTRA_FILL = "FFF3F0E8";
const ALT = "FFFBF8F2";
const WHITE = "FFFFFFFF";

function paintHeader(cell: ExcelJS.Cell, locked: boolean, warn: boolean) {
  cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: WHITE } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: warn ? WARN : locked ? NAVY : MUTED } };
  cell.alignment = { vertical: "middle", wrapText: true };
}

function asText(v: BookCell): string | number {
  if (v == null) return "";
  return v;
}

export async function buildWorkbook(file: EconomyFile, club: ClubFile): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TechWorks";
  wb.created = new Date();
  wb.company = "Solvay Tech Ed";
  const sheets = buildBook(file, club);

  for (const sh of sheets) {
    const ws = wb.addWorksheet(sh.name.slice(0, 31), {
      views: [{ state: "frozen", xSplit: sh.kind === "readme" ? 0 : 1, ySplit: sh.kind === "kpis" ? 12 : 3, showGridLines: true }],
      properties: { tabColor: { argb: sh.warn ? WARN : sh.name === "LOCK" ? ROYAL : NAVY } },
    });
    ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    let r = 1;
    if (sh.banner) {
      ws.mergeCells(r, 1, r, Math.max(2, sh.keys.length));
      const c = ws.getCell(r, 1);
      c.value = sh.banner;
      c.font = { name: "Calibri", size: 11, bold: true, color: { argb: sh.warn ? WHITE : NAVY } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sh.warn ? WARN : PAPER } };
      ws.getRow(r).height = 22;
      r += 1;
    }
    if (sh.kpis?.length) {
      sh.kpis.forEach((k, i) => {
        const row = r + Math.floor(i / 2);
        const col = (i % 2) * 4 + 1;
        ws.getCell(row, col).value = k.label;
        ws.getCell(row, col).font = { name: "Calibri", size: 9, bold: true, color: { argb: MUTED } };
        ws.mergeCells(row, col + 1, row, col + 3);
        ws.getCell(row, col + 1).value = k.value;
        ws.getCell(row, col + 1).font = { name: "Calibri", size: 11, color: { argb: INK } };
      });
      r += Math.ceil(sh.kpis.length / 2) + 1;
    }
    const keyRow = r;
    const labelRow = r + 1;
    sh.keys.forEach((key, i) => {
      const locked = i < sh.locked;
      const kc = ws.getCell(keyRow, i + 1);
      kc.value = key;
      paintHeader(kc, locked, Boolean(sh.warn));
      const lc = ws.getCell(labelRow, i + 1);
      lc.value = sh.labels[i] ?? key;
      lc.font = { name: "Calibri", size: 10, bold: true, color: { argb: INK } };
      lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: locked ? LOCK_FILL : EXTRA_FILL } };
      lc.alignment = { wrapText: true, vertical: "middle" };
      ws.getColumn(i + 1).width = Math.min(28, Math.max(10, String(sh.labels[i] ?? key).length + 2));
    });
    ws.getRow(keyRow).height = 16;
    ws.getRow(labelRow).height = 28;
    ws.autoFilter = {
      from: { row: labelRow, column: 1 },
      to: { row: labelRow, column: sh.keys.length },
    };
    ws.views = [{ state: "frozen", xSplit: Math.min(3, sh.keys.length), ySplit: labelRow, showGridLines: true }];

    const dataStart = labelRow + 1;
    sh.rows.forEach((row, ri) => {
      const excelRow = ws.getRow(dataStart + ri);
      row.forEach((v, ci) => {
        const cell = excelRow.getCell(ci + 1);
        cell.value = asText(v);
        cell.font = { name: "Calibri", size: 10, color: { argb: INK } };
        if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT } };
        if (ci >= sh.locked) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXTRA_FILL } };
      });
    });
    if (sh.note) {
      const n = dataStart + sh.rows.length + 1;
      ws.mergeCells(n, 1, n, Math.min(6, sh.keys.length));
      ws.getCell(n, 1).value = sh.note;
      ws.getCell(n, 1).font = { name: "Calibri", size: 10, italic: true, color: { argb: MUTED } };
    }
    ws.getColumn(1).width = Math.max(Number(ws.getColumn(1).width ?? 12), 16);
    if (sh.name === "YEAR MARKS" || sh.keys.includes("tw_d1")) {
      sh.keys.forEach((k, i) => {
        if (/^C\dD\d$/.test(k) || /^tw_d[1-4]$/.test(k) || k === "Code") ws.getColumn(i + 1).numFmt = "@";
      });
    }
  }
  return wb;
}

function triggerDownload(name: string, data: Uint8Array, type: string) {
  if (typeof document === "undefined") return;
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const blob = new Blob([copy.buffer], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildBookBuffer(file: EconomyFile, club: ClubFile): Promise<Uint8Array> {
  const wb = await buildWorkbook(file, club);
  const buf = await wb.xlsx.writeBuffer();
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBuffer);
}

export async function downloadGoogleBook(file: EconomyFile, club: ClubFile) {
  const buf = await buildBookBuffer(file, club);
  triggerDownload(
    bookFileName(),
    buf,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export type { BookSheet };
