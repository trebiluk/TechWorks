import type { EconomyFile } from "@/lib/economy";

export function cloneFile(file: EconomyFile): EconomyFile {
  try {
    return structuredClone(file);
  } catch {
    return JSON.parse(JSON.stringify(file)) as EconomyFile;
  }
}

export function days4(days: string[] | undefined): string[] {
  const d = [...(days ?? [])];
  while (d.length < 4) d.push("");
  return d.slice(0, 4);
}
