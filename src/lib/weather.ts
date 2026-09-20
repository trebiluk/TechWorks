/** Solvay sky. Open-Meteo first, Hancock (KSYR) if that feed is dark. */

import { ttlGet } from "@/lib/ttl-cache";

export type Sky = {
  f: number;
  c: number;
  word: string;
  icon: "sun" | "part" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "wind" | "storm";
  source?: "open-meteo" | "nws";
};

/** Village of Solvay — wall frame, not Hancock runway. */
export const SOLVAY_LAT = 43.058;
export const SOLVAY_LON = -76.207;

const SKY_KEY = "tw-sky";

let lastGood: Sky | undefined;

export function readLastSky(): Sky | null {
  if (lastGood && Number.isFinite(lastGood.f)) return lastGood;
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SKY_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Sky;
    return Number.isFinite(cached.f) ? cached : null;
  } catch {
    return null;
  }
}

export function writeLastSky(sky: Sky): void {
  lastGood = sky;
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SKY_KEY, JSON.stringify(sky));
  } catch {
    /* quota */
  }
}

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

/** WMO weather interpretation codes → one classroom word. */
export function skyFromWmo(c: number, code: number, windKmh: number): Sky {
  const f = Math.round((c * 9) / 5 + 32);
  const windMph = windKmh * 0.621371;
  let word = "Fair";
  let icon: Sky["icon"] = "part";
  if (code === 0) {
    word = "Sunshine";
    icon = "sun";
  } else if (code === 1) {
    word = "Fair";
    icon = "sun";
  } else if (code === 2) {
    word = "Hazy";
    icon = "part";
  } else if (code === 3) {
    word = "Overcast";
    icon = "cloud";
  } else if (code === 45 || code === 48) {
    word = "Fog";
    icon = "fog";
  } else if (code >= 51 && code <= 57) {
    word = "Drizzle";
    icon = "drizzle";
  } else if (code >= 61 && code <= 67) {
    word = "Rain";
    icon = "rain";
  } else if (code >= 71 && code <= 77) {
    word = code <= 73 ? "Flurries" : "Snow";
    icon = "snow";
  } else if (code >= 80 && code <= 82) {
    word = "Showers";
    icon = "rain";
  } else if (code >= 85 && code <= 86) {
    word = "Snow";
    icon = "snow";
  } else if (code >= 95) {
    word = "Storm";
    icon = "storm";
  }
  if (windMph >= 25 && code <= 3) {
    word = "Blustery";
    icon = "wind";
  }
  return { f, c: Math.round(c), word, icon, source: "open-meteo" };
}

export function skyFrom(c: number, desc: string, windKmh: number): Sky {
  const f = Math.round((c * 9) / 5 + 32);
  const windMph = windKmh * 0.621371;
  const mapped =
    windMph >= 25 && !/rain|snow|storm|shower|drizzle/i.test(desc)
      ? { word: "Blustery" as const, icon: "wind" as const }
      : oneWord(desc, windMph);
  return { f, c: Math.round(c), ...mapped, source: "nws" };
}

export async function pullWeather(): Promise<Sky> {
  return ttlGet("weather", 10 * 60_000, fetchSky);
}

async function fetchSky(): Promise<Sky> {
  try {
    const sky = await fetchOpenMeteo();
    lastGood = sky;
    return sky;
  } catch {
    try {
      const sky = await fetchNws();
      lastGood = sky;
      return sky;
    } catch (err) {
      if (lastGood) return lastGood;
      throw err;
    }
  }
}

async function fetchOpenMeteo(): Promise<Sky> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SOLVAY_LAT}&longitude=${SOLVAY_LON}` +
    "&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=America%2FNew_York";
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("open-meteo");
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
  };
  const cur = data.current;
  const c = cur?.temperature_2m;
  const code = cur?.weather_code;
  if (c == null || !Number.isFinite(c) || code == null) throw new Error("open-meteo");
  return skyFromWmo(c, code, cur?.wind_speed_10m ?? 0);
}

async function fetchNws(): Promise<Sky> {
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
