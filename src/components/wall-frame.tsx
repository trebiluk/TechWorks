import { useEffect, useState, type ReactNode } from "react";
import type { EconomyFile } from "@/lib/economy";
import { lunchOn } from "@/lib/store";
import { BISTRO_DOOR, lunchLineOf, seedLastBistro, writeLastBistro, type BistroLine } from "@/lib/lunch";
import { todayIso } from "@/lib/calendar";
import { featureOn } from "@/lib/features";
import { SKY_ICON, useSky } from "@/components/weather-chip";

function useBistroLunch(file: EconomyFile, date: string): BistroLine {
  const desk = lunchOn(file, date);
  const [row, setRow] = useState<BistroLine>(() => {
    if (desk.trim()) return lunchLineOf(date, desk);
    return seedLastBistro(date) ?? lunchLineOf(date, desk);
  });

  useEffect(() => {
    if (desk.trim()) {
      setRow(lunchLineOf(date, desk));
      return;
    }
    let alive = true;
    setRow(seedLastBistro(date) ?? lunchLineOf(date, desk));
    async function load() {
      try {
        const res = await fetch(`/api/lunch?date=${date}`);
        const data = (await res.json()) as BistroLine & { error?: string };
        if (!alive || data.error || !data.line) return;
        writeLastBistro(data);
        setRow(data);
      } catch {
        /* cycle / last-good already painted */
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [date, desk]);

  return row;
}

export function WallFrame({
  file,
  date = todayIso(),
  tickerBits,
  arrange = false,
  children,
}: {
  file: EconomyFile;
  date?: string;
  tickerBits: string[];
  arrange?: boolean;
  children: ReactNode;
}) {
  const weatherOn = featureOn(file, "weather");
  const sky = useSky(weatherOn);
  const lunch = useBistroLunch(file, date);
  const Icon = sky ? SKY_ICON[sky.icon] : null;
  const skyBit = sky ? `${sky.word} ${sky.f}°` : "";
  const lunchBit = lunch.label;
  const line = [...tickerBits, skyBit, lunchBit].filter(Boolean).join("  ·  ");

  return (
    <div className="tw-wall-frame flex min-h-0 flex-1 flex-col" data-wall-frame>
      {!arrange ? (
        <div className="tw-wall-frame-bar" data-wall-frame-bar aria-label="Weather and lunch">
          {weatherOn && sky && Icon ? (
            <span className="tw-wall-frame-sky" title={`Solvay · ${sky.word} · ${sky.f}°F`}>
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>Sky</span>
              <strong>{sky.f}° {sky.word}</strong>
            </span>
          ) : null}
          {lunchBit ? (
            <a href={BISTRO_DOOR} target="_blank" rel="noreferrer" className="tw-wall-frame-lunch" title="Bearcat Bistro">
              <span>Lunch</span>
              <strong>{lunchBit}</strong>
            </a>
          ) : (
            <span className="tw-wall-frame-lunch">
              <span>Lunch</span>
              <strong>Weekend</strong>
            </span>
          )}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      {!arrange && line ? (
        <div className="tw-ticker" data-wall-ticker>
          <div className="tw-ticker-track">
            <span>{line}</span>
            <span aria-hidden>{line}</span>
            <span aria-hidden>{line}</span>
            <span aria-hidden>{line}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
