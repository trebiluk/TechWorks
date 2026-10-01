/** Dev desk store. One JSON file. Not used when Cloudflare KV is bound. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Kv } from "./cf-env";

type Bag = Record<string, string>;

const file = join(process.cwd(), ".data", "tw-kv.json");
let chain: Promise<void> = Promise.resolve();

function readBag(): Bag {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Bag;
  } catch {
    return {};
  }
}

function writeBag(bag: Bag) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(bag));
}

export function fileKv(): Kv {
  return {
    async get(k) {
      return readBag()[k] ?? null;
    },
    async put(k, v) {
      const run = chain.then(() => {
        const bag = readBag();
        bag[k] = v;
        writeBag(bag);
      });
      chain = run.catch(() => {});
      await run;
    },
  };
}
