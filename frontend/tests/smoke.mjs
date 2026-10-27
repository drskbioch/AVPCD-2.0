// Smoke test of the built site. Needs: node build.mjs done, backend on :8000, node serve.mjs on :5173, Edge installed.
//   node tests/smoke.mjs [--shots <dir>]
// Part 1 reads dist/ (links, assets, banner, Contact link). Part 2 renders each page in headless Edge and checks the DOM.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = process.env.SITE || "http://127.0.0.1:5173";
const API = process.env.API || "http://127.0.0.1:8000";
const EDGE = process.env.EDGE || ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const shotsAt = process.argv.indexOf("--shots");
const shots = shotsAt > 0 ? resolve(process.argv[shotsAt + 1]) : null;

// Node's fetch can hit a reset on a kept-alive socket after a long headless render; retry once.
async function get(url) {
  for (let attempt = 0; ; attempt += 1) {
    try { return await fetch(url, { headers: { Connection: "close" } }); } catch (err) { if (attempt >= 2) throw err; }
  }
}

let failed = 0, passed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed += 1; console.log(`PASS  ${name}`); } else { failed += 1; console.log(`FAIL  ${name}${detail ? ` -- ${detail}` : ""}`); }
}

// ---- part 1: static ----
const pages = readdirSync(dist).filter((f) => f.endsWith(".html"));
check("7 pages built", pages.length === 7, String(pages.length));
check("no downloads, version-history or dictionary page", !["downloads.html", "history.html", "dictionary.html"].some((f) => pages.includes(f)));
const INTERNAL = /\b(?:value_nM|evidence_tier|data_quality_flags|method_as_recorded|plant_provenance_level|is_derivative|unit_conflict_benchmark|compound_name|workbook_row|novelty_status|inchikey_|record_id)\b/;
for (const f of pages) {
  const html = readFileSync(join(dist, f), "utf8");
  check(`${f}: no draft / not-ready wording`, !/draft|not for citation|not ready|not yet measured|nothing to cite/i.test(html));
  check(`${f}: Contact opens http://habdsk.org/ in a new tab`, /href="http:\/\/habdsk\.org\/" target="_blank" rel="noopener noreferrer"/.test(html));
  check(`${f}: no internal field names in the page`, !INTERNAL.test(html.replace(/<script[\s\S]*?<\/script>/g, "")));
  check(`${f}: no unreplaced {{placeholder}}`, !/\{\{\w+\}\}/.test(html));
  check(`${f}: one h1`, (html.match(/<h1[ >]/g) || []).length === 1, String((html.match(/<h1[ >]/g) || []).length));
  const broken = [];
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(join(dist, target))) broken.push(target);
  }
  check(`${f}: local links and assets exist`, broken.length === 0, [...new Set(broken)].join(", "));
}
{
  check("no page quotes the benchmark accuracy figures (they belong to the manuscript)", !readdirSync(dist).filter((f) => f.endsWith(".html")).some((f) => /95\.7%|99\.2%|78\.6%|96\.9%/.test(readFileSync(join(dist, f), "utf8"))));
  check("no page still says accuracy was not measured", !readdirSync(dist).filter((f) => f.endsWith(".html")).some((f) => /accuracy (has|is) (not|unmeasured)|not yet measured|has not been measured/i.test(readFileSync(join(dist, f), "utf8"))));
}
check("robots.txt allows indexing", /Allow: \/\s*$/m.test(readFileSync(join(dist, "robots.txt"), "utf8")));

// ---- part 2: rendered ----
function render(path, extra = []) {
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--virtual-time-budget=9000", ...extra, "--dump-dom", `${SITE}/${path}`];
  return execFileSync(EDGE, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
}
function shot(path, name, width = 1280, height = 1600) {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--no-first-run", "--virtual-time-budget=9000", `--window-size=${width},${height}`, `--screenshot=${join(shots, name)}`, `${SITE}/${path}`], { stdio: "ignore" });
}
const stats = await (await get(`${API}/api/stats`)).json();
const n = (x) => Number(x).toLocaleString("en-GB");

if (!EDGE) { check("Edge found", false, "set EDGE=path to msedge.exe"); }
else {
  let dom = render("index.html");
  check("index: record count from the API", dom.includes(`<b data-stat="records">${n(stats.records)}</b>`));
  check("index: no placeholder dash left in stats", !/data-stat="records_with_structure">–/.test(dom));
  check("footer: release version from the API", dom.includes(`data-stat="meta.version">${stats.meta.version}<`));

  dom = render("search.html");
  const rows = (dom.match(/<tr><td><a href="record\.html\?id=R\d{4}"/g) || []).length;
  check("search: first page shows 50 rows", rows === 50, String(rows));
  check("search: status counts all records", dom.includes(`${n(stats.records)} records found.`));
  check("search: endpoint checkboxes filled", Object.keys(stats.by_endpoint).filter(Boolean).every((e) => dom.includes(`value="${e}"`)));

  dom = render("search.html?virus=Influenza&endpoint=IC50");
  const q = new URL(`${API}/api/records`); q.searchParams.set("virus", "Influenza"); q.searchParams.set("endpoint", "IC50");
  const expected = (await (await get(q)).json()).total;
  check("search: URL filters restored and applied", expected > 0 && dom.includes(`${n(expected)} record${expected === 1 ? "" : "s"} found.`), `expected ${expected}`);

  dom = render("search.html?value_min=1");
  check("search: advanced section opens for an advanced filter", /<details class="advanced" id="advanced" open/.test(dom));
  dom = render("search.html?compound=zzzznomatch");
  check("search: empty result message", dom.includes("No record matches these filters."));

  for (const by of ["virus", "plant", "compound", "endpoint"]) {
    const facets = (await (await get(`${API}/api/facets/${by}`)).json()).items;
    dom = render(`browse.html?by=${by}`);
    const total = facets.reduce((s, i) => s + i.records, 0);
    check(`browse ${by}: status lists ${facets.length} entries and ${total} records`, dom.includes(`${n(facets.length)} entr${facets.length === 1 ? "y" : "ies"}, ${n(total)} records.`));
    check(`browse ${by}: tab marked current`, new RegExp(`data-by="${by}"[^>]*aria-current="page"|aria-current="page"[^>]*data-by="${by}"`).test(dom));
    const links = (dom.match(/<li[^>]*><a href="search\.html\?/g) || []).length;
    check(`browse ${by}: entries link to the search page`, links > 0, String(links));
  }
  dom = render("browse.html?by=nonsense");
  check("browse: unknown 'by' falls back to virus", dom.includes("Browse by virus"));

  const first = (await (await get(`${API}/api/records?page_size=1`)).json()).results[0].record_id;
  dom = render(`record.html?id=${first}`);
  check("record: page shows the record id", dom.includes(`Record ${first}`));
  const dts = [...dom.matchAll(/<dt>([^<]*)<\/dt>/g)].map((m) => m[1]);
  check("record: fields are shown with plain labels, never column names", dts.length >= 15 && dts.every((t) => !/_/.test(t) && t === t.charAt(0).toUpperCase() + t.slice(1)), dts.join(" | "));
  check("record: no internal field name or raw code in the rendered page", !INTERNAL.test(dom.replace(/<script[\s\S]*?<\/script>/g, "")) && !/>(?:full_text|isolated_in_paper|newly_curated|unresolvable_)/.test(dom));
  dom = render("record.html?id=R9999");
  check("record: unknown id says so", dom.includes("does not exist"));
  dom = render("record.html?id=bad");
  check("record: bad id says so", dom.includes("No record id in the address"));

  dom = render("stats.html");
  check("stats: six sections", (dom.match(/<div class="bars">/g) || []).length === 6, String((dom.match(/<div class="bars">/g) || []).length));
  check("stats: buckets use plain labels", !/>(?:full_text|newly_curated|unresolvable_|possible_duplicate|unit_conflict_benchmark)/.test(dom));
  check("stats: tier count appears", dom.includes(`>${n(stats.by_evidence_tier.full_text)}</span>`));

  for (const p of ["about.html", "citation.html"]) {
    dom = render(p);
    check(`${p}: renders and the footer is filled`, dom.includes(`data-stat="meta.version">${stats.meta.version}<`));
  }
  dom = render("about.html");
  check("about: counts filled from the API", dom.includes(`data-stat="records">${n(stats.records)}<`) && !/data-stat="[^"]+">–</.test(dom));

  const mobile = render("search.html", ["--window-size=390,900"]);
  check("mobile width: menu button present", mobile.includes('class="menu-toggle"'));

  const names = [["index.html", "home.png"], ["search.html?virus=Influenza", "search.png"], ["browse.html?by=virus", "browse-virus.png"], ["stats.html", "stats.png"],
    ["record.html?id=" + first, "record.png"], ["about.html", "about.png"], ["citation.html", "citation.png"]];
  for (const [p, name] of names) shot(p, name);
  if (shots) {
    // headless Edge will not go narrower than about 500 px, so narrow screens are shown through iframes
    const wrapper = join(dist, "_narrow.html");
    const frame = (p) => `<iframe src="${p}" width="390" height="1700" style="border:0;background:#fff"></iframe>`;
    writeFileSync(wrapper, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888"><div style="display:flex;gap:20px">${frame("index.html")}${frame("search.html?virus=Influenza")}${frame("record.html?id=" + first)}</div>`);
    shot("_narrow.html", "narrow-390px.png", 1240, 1720);
    rmSync(wrapper);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
