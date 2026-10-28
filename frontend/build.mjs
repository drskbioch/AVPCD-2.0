// Builds dist/: renders every page of src/pages/ into the shared layout (src/layout.html), copies css/js/assets,
// and writes dist/config.js with the API address.
// The address comes from the environment (Vercel project setting) or from frontend/.env (local only; git-ignored).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "src");
const dist = join(root, "dist");

// file, title, nav key (null = no navbar item), page script (js/<name>.js or null), description
export const PAGES = [
  ["index.html", "Home", "home", null, "AntiViral PhytoChemical Database 2.0: antiviral potency of compounds from plants."],
  ["search.html", "Search", "search", "search", "Search the records by compound, plant, virus, endpoint and value."],
  ["browse.html", "Browse", "browse", "browse", "Browse the records by virus, plant, compound or endpoint."],
  ["tutorial.html", "How To Use", "tutorial", null, "How to search, browse and read a record."],
  ["stats.html", "Statistics", "stats", "stats", "How the records are spread over endpoints, assays, hosts and families."],
  ["links.html", "Useful Links", "links", null, "Related databases and resources."],
  ["contact.html", "Contact Us / FAQ", "contact", null, "Contact details and frequently asked questions."],
  ["record.html", "Record", "search", "record", "One record of the database."],
];
const NAV = [["home", "Home", "index.html"], ["search", "Search", "search.html"], ["browse", "Browse", "browse.html"], ["tutorial", "How To Use", "tutorial.html"],
  ["stats", "Statistics", "stats.html"], ["links", "Useful Links", "links.html"], ["contact", "Contact Us / FAQ", "contact.html"]];

function fromDotenv() {
  const file = join(root, ".env");
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*AVPCD_API_URL\s*=\s*(.*?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

function apiAddress() {
  let api = process.env.AVPCD_API_URL || fromDotenv();
  const onVercel = Boolean(process.env.VERCEL);
  if (!api) {
    if (onVercel) { console.error("AVPCD_API_URL is not set. Add it in the Vercel project settings (Environment Variables)."); process.exit(1); }
    api = "http://127.0.0.1:8000";
    console.warn(`AVPCD_API_URL not set: using ${api} (local backend).`);
  }
  api = api.replace(/\/+$/, "");
  let url;
  try { url = new URL(api); } catch { console.error(`AVPCD_API_URL is not a URL: ${api}`); process.exit(1); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) { console.error(`AVPCD_API_URL must be https (http is allowed only for localhost): ${api}`); process.exit(1); }
  if (onVercel && local) { console.error(`AVPCD_API_URL points to ${api}, which a visitor's browser cannot reach. Use the server's https address.`); process.exit(1); }
  return api;
}

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function render(layout, [file, title, nav, script, description]) {
  const content = readFileSync(join(src, "pages", file), "utf8");
  const navHtml = NAV.map(([key, label, href]) => `<a href="${href}"${key === nav ? ' aria-current="page"' : ""}>${label}</a>`).join("\n        ");
  return layout
    .replace("{{title}}", file === "index.html" ? "AVPCD" : `${title} · AVPCD`)
    .replace("{{description}}", escapeAttr(description))
    .replace("{{nav}}", navHtml)
    .replace("{{script}}", script ? `<script type="module" src="js/${script}.js"></script>` : "")
    .replace("{{content}}", content);
}

const api = apiAddress();
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const layout = readFileSync(join(src, "layout.html"), "utf8");
for (const page of PAGES) {
  if (!existsSync(join(src, "pages", page[0]))) { console.error(`missing page source: src/pages/${page[0]}`); process.exit(1); }
  writeFileSync(join(dist, page[0]), render(layout, page));
}
for (const dir of ["css", "js", "assets"]) cpSync(join(src, dir), join(dist, dir), { recursive: true });
writeFileSync(join(dist, "config.js"), `window.AVPCD_API_URL = ${JSON.stringify(api)};\n`);
writeFileSync(join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
console.log(`built dist/ (${PAGES.length} pages; API: ${api})`);
