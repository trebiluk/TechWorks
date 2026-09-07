import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import type { Sky } from "@/lib/weather";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

const ICON = {
  sun: Sun,
  part: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  wind: Wind,
  storm: CloudLightning,
};

export function WeatherChip({ className, compact }: { className?: string; compact?: boolean }) {
  const [sky, setSky] = useState<Sky | null>(null);
  const { t } = useLang();

  useEffect(() => {
    let alive = true;
    try {
      const raw = sessionStorage.getItem("tw-sky");
      if (raw) {
        const cached = JSON.parse(raw) as Sky;
        if (Number.isFinite(cached.f)) setSky(cached);
      }
    } catch {
      /* */
    }
    async function load() {
      try {
        const res = await fetch("/api/weather");
        const data = (await res.json()) as Sky & { error?: string };
        if (!alive || data.error || !Number.isFinite(data.f)) return;
        setSky(data);
        try {
          sessionStorage.setItem("tw-sky", JSON.stringify(data));
        } catch {
          /* */
        }
      } catch {
        /* stay hidden */
      }
    }
    void load();
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (!sky) return null;
  const Icon = ICON[sky.icon] ?? CloudSun;
  if (compact) {
    return (
      <span title={`Solvay · ${t(sky.word)} · ${sky.f}°F`} className={cn("inline-flex items-center gap-1 text-sm tabular-nums text-muted", className)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {sky.f}°
      </span>
    );
  }
  return (
    <span
      title={`Solvay · ${t(sky.word)}`}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-elevated px-3 text-sm font-medium tabular-nums",
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>
        {sky.f}°F / {sky.c}°C
      </span>
      <span className="text-muted">{t(sky.word)}</span>
    </span>
  );
}

