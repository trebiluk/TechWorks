/** Syracuse Hancock (KSYR) stands in for Solvay. */

import { ttlGet } from "@/lib/ttl-cache";

export type Sky = {
  f: number;
  c: number;
  word: string;
  icon: "sun" | "part" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "wind" | "storm";
};

function oneWord(desc: string, windMph: number): { word: string; icon: Sky["icon"] } {
  const t = desc.toLowerCase();
  if (/thunder|storm/.test(t)) return { word: "Storm", icon: "storm" };
  if (/hail/.test(t)) return { word: "Hail", icon: "storm" };
  if (/freezing|ice/.test(t)) return { word: "Ice", icon: "rain" };
  if (/flurries|light snow/.test(t)) return { word: "Flurries", icon: "snow" };
  if (/snow/.test(t)) return { word: "Snow", icon: "snow" };
  if (/drizzle/.test(t)) return { word: "Drizzle", icon: "drizzle" };
  if (/shower/.test(t)) return { word: "Showers", icon: "rain" };
  if (/rain/.test(t)) return { word: "Rain", icon: "rain" };
  if (/fog|mist/.test(t)) return { word: "Fog", icon: "fog" };
  if (/partly/.test(t)) return { word: "Hazy", icon: "part" };
  if (/mostly (clear|sunny)|fair|clear|sunny/.test(t)) return { word: "Sunshine", icon: "sun" };
  if (/overcast|mostly cloudy|cloudy/.test(t)) return { word: "Overcast", icon: "cloud" };
  if (windMph >= 25 || /wind/.test(t)) return { word: "Blustery", icon: "wind" };
  return { word: "Fair", icon: "part" };
}

export function skyFrom(c: number, desc: string, windKmh: number): Sky {
  const f = Math.round((c * 9) / 5 + 32);
  const windMph = windKmh * 0.621371;
  const mapped = windMph >= 25 && !/rain|snow|storm|shower|drizzle/i.test(desc)
    ? { word: "Blustery" as const, icon: "wind" as const }
    : oneWord(desc, windMph);
  return { f, c: Math.round(c), ...mapped };
}

export async function pullWeather(): Promise<Sky> {
  return ttlGet("weather", 10 * 60_000, fetchSky);
}

async function fetchSky(): Promise<Sky> {
  const res = await fetch("https://api.weather.gov/stations/KSYR/observations/latest", {
    headers: { Accept: "application/geo+json", "User-Agent": "TechWorksDesk/1.4 (classroom)" },
  });
  if (!res.ok) throw new Error("weather");
  const data = (await res.json()) as {
    properties?: {
      textDescription?: string;
      temperature?: { value?: number | null };
      windSpeed?: { value?: number | null };
    };
  };
  const p = data.properties ?? {};
  const c = p.temperature?.value;
  if (c == null || !Number.isFinite(c)) throw new Error("weather");
  return skyFrom(c, p.textDescription ?? "Fair", p.windSpeed?.value ?? 0);
}
