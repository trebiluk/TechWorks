import type { EconomyFile } from "./economy.ts";
import type { FeatureId } from "./features.ts";
import { luckyOf } from "./lucky.ts";
import { livePoll } from "./polls.ts";
import { printsOf } from "./prints.ts";

const GAME: FeatureId[] = ["lucky", "polls", "prints", "stocks", "store", "reward"];

/** Projector: no game chrome until there is a real number. */
export function chromeReady(id: FeatureId, file: EconomyFile): boolean {
  if (id === "lucky") return luckyOf(file).pot > 0;
  if (id === "polls") return Boolean(livePoll(file)?.open);
  if (id === "prints") return printsOf(file).some((p) => (p.released || 0) > 0);
  if (id === "stocks") return Boolean(file.meta.market?.index);
  if (id === "store" || id === "reward") return false;
  return !GAME.includes(id);
}
