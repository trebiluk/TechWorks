import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import economy from "../src/data/economy.json" with { type: "json" };
import { buildBookBuffer } from "../src/lib/book-xlsx";
import { loadClub } from "../src/lib/club";
import type { EconomyFile } from "../src/lib/economy";

const root = dirname(fileURLToPath(import.meta.url));
const out = resolve(root, "../artifacts/TechWorks-2026-27-Book.xlsx");
mkdirSync(dirname(out), { recursive: true });
const buf = await buildBookBuffer(economy as EconomyFile, loadClub());
writeFileSync(out, buf);
console.log(`wrote ${out} (${buf.byteLength} bytes)`);
