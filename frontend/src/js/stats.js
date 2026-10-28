import { getStats, getJSON, el, fmtInt, setStatus } from "./api.js";
import { bucketLabel } from "./labels.js";

const TOP = 10;

// counts: name -> number of records; field: which field the names belong to (for plain labels)
function bars(counts, total, colour, field) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return el("div", { class: "bars" }, entries.map(([name, n]) => el("div", { class: "bar-row" },
    el("span", {}, field ? bucketLabel(field, name) : name),
    el("span", { class: "track" }, el("span", { class: `fill ${colour}`, style: `--w:${(100 * n / max).toFixed(1)}%` })),
    el("span", { class: "n", title: `${(100 * n / total).toFixed(1)}% of records` }, fmtInt(n)))));
}

// facet items -> top families by record count
function byFamily(items, key, none) {
  const sums = {};
  for (const item of items) sums[item[key] || none] = (sums[item[key] || none] ?? 0) + item.records;
  return Object.fromEntries(Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, TOP));
}

const statusBox = document.getElementById("status");
try {
  const [s, virus, plant] = await Promise.all([getStats(), getJSON("/api/facets/virus"), getJSON("/api/facets/plant")]);
  const sections = [
    ["Endpoint", "Only antiviral potency endpoints are included.", s.by_endpoint, "", "teal"],
    ["Assay type", "Cell-based assays and target-based systems (enzyme, replicon, pseudovirus) are different things; read them apart.", s.by_assay_type, "assay_type", "amber"],
    ["Virus host", "Plant-virus assays are not included, so the viruses here infect humans or animals.", s.by_virus_host, "virus_host", "slate"],
    [`Virus families (top ${TOP})`, "Records by ICTV family of the virus.", byFamily(virus.items, "ictv_family", "Family not matched"), "", "blue"],
    [`Plant families (top ${TOP})`, "Records by family of the source plant.", byFamily(plant.items, "plant_family", "Family not matched"), "", "green"],
  ];
  document.getElementById("sections").replaceChildren(...sections.flatMap(([heading, note, counts, field, colour]) => [
    el("h2", {}, heading), el("p", {}, note), bars(counts, s.records, colour === "blue" ? "" : colour, field)]));
  setStatus(statusBox, "");
} catch (err) {
  setStatus(statusBox, `Could not load the statistics (${err.message}).`, true);
}
