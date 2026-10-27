import { getJSON, el, fmtInt, setStatus } from "./api.js";

// kind -> how to list it. group: key that makes the folding sections (or null); name: key shown; link: search parameter [name, key]
const KINDS = {
  virus: { title: "Virus", group: "ictv_family", name: "ictv_species", link: ["virus", "ictv_species"], familyLink: ["virus", "ictv_family"], none: "Species not resolved" },
  plant: { title: "Plant", group: "plant_family", name: "plant_species", link: ["plant", "plant_species"], familyLink: ["plant", "plant_family"], none: "No species in the record" },
  compound: { title: "Compound", group: null, name: "compound_name", link: ["inchikey", "inchikey"] },
  endpoint: { title: "Endpoint", group: null, name: "endpoint", link: ["endpoint", "endpoint"] },
};
const kind = Object.hasOwn(KINDS, new URLSearchParams(location.search).get("by")) ? new URLSearchParams(location.search).get("by") : "virus";
const spec = KINDS[kind];
const statusBox = document.getElementById("status");
const listBox = document.getElementById("list");
const filterInput = document.getElementById("filter");

const searchHref = ([param, key], item) => `search.html?${new URLSearchParams({ [param]: item[key] })}`;

function row(item) {
  const text = item[spec.name] || (spec.none ?? "(none recorded)");
  const linkable = item[spec.link[1]] !== "";
  return el("li", { "data-text": `${item[spec.name]} ${item.inchikey ?? ""}`.toLowerCase() },
    linkable ? el("a", { href: searchHref(spec.link, item) }, text) : el("span", { class: "empty" }, text),
    el("span", { class: "n" }, `${fmtInt(item.records)} record${item.records === 1 ? "" : "s"}`));
}

function render(items) {
  if (!spec.group) {
    listBox.replaceChildren(el("ul", { class: "facet-list" }, items.map(row)));
    return;
  }
  const groups = new Map();
  for (const item of items) {
    const key = item[spec.group];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const sorted = [...groups.entries()].sort((a, b) => sum(b[1]) - sum(a[1]));
  listBox.replaceChildren(...sorted.map(([family, list]) => {
    const heading = family || "Family not resolved";
    const summary = el("summary", {}, el("span", {}, heading), el("span", { class: "n" }, `${fmtInt(list.length)} · ${fmtInt(sum(list))} records`));
    const details = el("details", { class: "group" }, summary, el("ul", { class: "facet-list" }, list.map(row)));
    if (family) details.append(el("p", { class: "group-link" }, el("a", { href: searchHref(spec.familyLink, { [spec.familyLink[1]]: family }) }, `All records of ${family}`)));
    return details;
  }));
}
const sum = (list) => list.reduce((n, i) => n + i.records, 0);

function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  let shown = 0;
  for (const li of listBox.querySelectorAll("li")) {
    const hit = !q || li.dataset.text.includes(q);
    li.hidden = !hit;
    if (hit) shown += 1;
  }
  for (const d of listBox.querySelectorAll("details.group")) {
    const any = [...d.querySelectorAll("li")].some((li) => !li.hidden);
    d.hidden = !any;
    if (q && any) d.open = true;
  }
  setStatus(statusBox, q ? `${fmtInt(shown)} match${shown === 1 ? "" : "es"} for “${filterInput.value.trim()}”.` : statusBox.dataset.total);
}

for (const a of document.querySelectorAll(".tabs a")) {
  const on = a.dataset.by === kind;
  if (on) a.setAttribute("aria-current", "page");
  a.href = `browse.html?by=${a.dataset.by}`;
}
document.getElementById("heading").textContent = `Browse by ${spec.title.toLowerCase()}`;
document.title = `Browse by ${spec.title.toLowerCase()} · AVPCD`;
document.getElementById("hint").textContent = kind === "compound"
  ? "One entry per structure (InChIKey). Compounds without a resolved structure are not listed here; find them with the compound-name search."
  : kind === "endpoint" ? "IC50, EC50, IC90, EC90 and ED50 are the only endpoints in the headline scope." : "Choose a name to see its records.";
filterInput.hidden = kind === "endpoint";
filterInput.labels[0].hidden = kind === "endpoint";

setStatus(statusBox, "Loading…");
try {
  const { items } = await getJSON(`/api/facets/${kind}`);
  render(items);
  const total = `${fmtInt(items.length)} entr${items.length === 1 ? "y" : "ies"}, ${fmtInt(sum(items))} records.`;
  statusBox.dataset.total = total;
  setStatus(statusBox, total);
  filterInput.addEventListener("input", applyFilter);
} catch (err) {
  setStatus(statusBox, `Could not load the list (${err.message}).`, true);
}
