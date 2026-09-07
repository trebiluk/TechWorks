import { FIRST_STUDENT } from "../data/solvay-2026-27.ts";
import { ttlGet } from "@/lib/ttl-cache";

export type Bar = { date: string; close: number };

export type DjiaQuote = {
  last: number;
  lastDate: string;
  weekAvg: number;
  prevAvg: number;
  wowPct: number;
  baseline: number;
  factor: number;
  weekBars: Bar[];
  spark: Bar[];
};

function nyDate(tsSec: number): string {
  return new Date(tsSec * 1000).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function mondayOnOrBefore(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const w = d.getDay();
  const back = w === 0 ? 6 : w - 1;
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export function summarize(bars: Bar[], today: string): DjiaQuote {
  const clean = bars.filter((b) => Number.isFinite(b.close) && b.close > 0);
  const last = clean[clean.length - 1] ?? { date: today, close: 0 };
  const mon = mondayOnOrBefore(today);
  const prevMon = addDays(mon, -7);
  const weekBars = clean.filter((b) => b.date >= mon && b.date <= addDays(mon, 4));
  const prevBars = clean.filter((b) => b.date >= prevMon && b.date <= addDays(prevMon, 4));
  const weekAvg = mean(weekBars.map((b) => b.close)) || last.close;
  const prevAvg = mean(prevBars.map((b) => b.close));
  const openBar = clean.find((b) => b.date >= FIRST_STUDENT) ?? weekBars[0] ?? last;
  const baseline = openBar.close || weekAvg || last.close;
  const factor = baseline ? weekAvg / baseline : 1;
  const wowPct = prevAvg ? ((weekAvg - prevAvg) / prevAvg) * 100 : 0;
  return {
    last: last.close,
    lastDate: last.date,
    weekAvg,
    prevAvg,
    wowPct,
    baseline,
    factor,
    weekBars,
    spark: clean.slice(-12),
  };
}

export async function pullYahoo(): Promise<DjiaQuote> {
  return ttlGet("djia", 90_000, fetchYahoo);
}

async function fetchYahoo(): Promise<DjiaQuote> {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=1d&range=6mo";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 TechWorksBoard" } });
  if (!res.ok) throw new Error(`djia ${res.status}`);
  const data = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        meta?: { regularMarketPrice?: number };
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };
  const result = data.chart?.result?.[0];
  const ts = result?.timestamp ?? [];
  const close = result?.indicators?.quote?.[0]?.close ?? [];
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = close[i];
    if (c == null || !Number.isFinite(c)) continue;
    bars.push({ date: nyDate(ts[i] ?? 0), close: c });
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  if (!bars.length && result?.meta?.regularMarketPrice) {
    bars.push({ date: today, close: result.meta.regularMarketPrice });
  }
  return summarize(bars, today);
}

export async function loadDjia(): Promise<DjiaQuote> {
  const r = await fetch("/api/djia");
  if (!r.ok) throw new Error("djia proxy");
  return r.json() as Promise<DjiaQuote>;
}
