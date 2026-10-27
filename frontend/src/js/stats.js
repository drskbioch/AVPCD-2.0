import { getStats, el, fmtInt, label, setStatus } from "./api.js";

// stats field -> [heading, bar colour class, explanation]
const SECTIONS = {
  "by_evidence_tier": ["Where the value was read", "", "Full text: read in the full paper. Abstract: read from the abstract only. Unclear: the origin has no ruling yet."],
  "by_endpoint": ["Endpoint", "teal", "Only antiviral potency endpoints are in the headline scope."],
  "by_assay_type": ["Assay type", "amber", "Cell-based assays and target-based systems (enzyme, replicon, pseudovirus) are different things; read them apart."],
  "by_virus_host": ["Virus host", "slate", "Plant-virus assays are outside the headline scope, so this is mostly animal viruses."],
  "by_novelty_status": ["Novelty against NPASS and ChEMBL", "magenta", "Newly curated is a lower bound; the unresolvable groups cannot be tested (no structure, no ICTV species or no comparable value)."],
  "by_data_quality_flag": ["Data quality flags", "slate", "A flag marks something to re-read. It does not mean the value is wrong, and no flag does not mean it was checked. A record with two flags counts under both."],
};

function bars(counts, total, colour) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return el("div", { class: "bars" }, entries.map(([name, n]) => el("div", { class: "bar-row" },
    el("span", {}, name === "none" ? "no flag" : label(name)),
    el("span", { class: "track" }, el("span", { class: `fill ${colour}`, style: `--w:${(100 * n / max).toFixed(1)}%` })),
    el("span", { class: "n", title: `${(100 * n / total).toFixed(1)}% of records` }, fmtInt(n)))));
}

const statusBox = document.getElementById("status");
try {
  const s = await getStats();
  document.getElementById("tiles").replaceChildren(...[[s.records, "records"], [s.papers, "papers"], [s.compounds, "compounds"], [s.records_with_structure, "records with a structure"]]
    .map(([n, text]) => el("div", { class: "stat" }, el("b", {}, fmtInt(n)), el("span", {}, text))));
  document.getElementById("sections").replaceChildren(...Object.entries(SECTIONS).flatMap(([field, [heading, colour, note]]) => [
    el("h2", {}, heading), el("p", {}, note), bars(s[field], s.records, colour)]));
  setStatus(statusBox, `Release ${s.meta.version}, ${s.meta.date}. ${s.meta.status}`);
} catch (err) {
  setStatus(statusBox, `Could not load the statistics (${err.message}).`, true);
}
