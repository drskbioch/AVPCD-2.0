// Copies the six supplementary files from the release folder into src/assets/supplementary/.
// Run it after the release is rebuilt: node tools/sync_supplementary.mjs [release_dir]
// The files are committed with the site because Vercel builds from this folder only (the release folder is outside it).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const release = resolve(process.argv[2] || join(root, "..", "..", "analysis", "phase6", "release_v0.1"));
const out = join(root, "src", "assets", "supplementary");

// published name <- file in the release folder. None of them holds an extracted record.
export const FILES = {
  "S1_data_dictionary.csv": "data_dictionary.csv",
  "S2_scope_waterfall.csv": "waterfall.csv",
  "S3_scope_waterfall.md": "methods/scope_waterfall.md",
  "S4_reconciliation.md": "reconciliation.md",
  "S5_near_matches_rejected.csv": "near_matches_rejected.csv",
  "S6_release_readme.md": "README.md",
};

mkdirSync(out, { recursive: true });
for (const [name, from] of Object.entries(FILES)) {
  const source = join(release, from);
  if (!existsSync(source)) { console.error(`missing in the release folder: ${from}`); process.exit(1); }
  copyFileSync(source, join(out, name));
  console.log(`${name} <- ${from}`);
}
