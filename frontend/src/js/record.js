import { getJSON, el, safeHttpUrl, setStatus, fmtNanomolar } from "./api.js";
import { FIELD, GROUPS, PAPER_FIELDS, prettyValue, flagLabel, flagHint } from "./labels.js";

const ORDER = ["Potency", "Compound", "Plant", "Virus and assay", "Cytotoxicity", "Source", "Cross-references", "Notes and flags"];
const MONO = new Set(["inchikey", "smiles", "novelty_npass_ids", "novelty_chembl_molecules", "novelty_chembl_docs"]);
console.assert(ORDER.every((g) => GROUPS.includes(g)) && GROUPS.every((g) => ORDER.includes(g)));

function pairList(pairs) {
  const dl = el("dl", { class: "kv" });
  for (const [label, value, opts = {}] of pairs) {
    const dd = el("dd", { class: opts.mono ? "mono" : false });
    if (opts.href) dd.append(el("a", { href: opts.href, rel: "noopener noreferrer", target: "_blank" }, value));
    else dd.textContent = value;
    dl.append(el("div", { class: opts.wide || value.length > 52 ? "kvp wide" : "kvp" }, el("dt", {}, label), dd));
  }
  return dl;
}

function card(title, pairs) {
  return pairs.length ? el("section", { class: "card-sec" }, el("h2", {}, title), pairList(pairs)) : null;
}

function potency(record) {
  const rel = record.relation && record.relation !== "=" ? (record.relation === "range" ? "" : record.relation) : "";
  const range = record.relation === "range" && record.value_upper_raw ? `${record.value_raw}–${record.value_upper_raw}` : record.value_raw;
  return [rel, range, record.unit_raw].filter(Boolean).join(" ");
}

function summary(record) {
  const tiles = [
    ["Virus", record.ictv_species || record.virus_verbatim],
    ["Plant", record.plant_species && record.plant_species !== "unspecified" ? record.plant_species : ""],
    [record.endpoint || "Potency", potency(record)],
    ["In nanomolar", record.value_nM && `${fmtNanomolar(record.value_nM)} nM` !== potency(record) ? `${fmtNanomolar(record.value_nM)} nM` : ""],
  ].filter(([, v]) => v);
  return el("div", { class: "facts" }, tiles.map(([k, v]) => el("div", { class: "fact" }, el("span", {}, k), el("b", {}, v))));
}

function chips(record) {
  const tier = record.evidence_tier;
  const out = [el("span", { class: `tag ${tier}`, title: FIELD.evidence_tier.desc }, tier ? prettyValue("evidence_tier", tier) : "Source tier not recorded")];
  for (const name of record.data_quality_flags.split(";").filter(Boolean)) out.push(el("span", { class: "flag", title: flagHint(name) }, flagLabel(name)));
  return out;
}

function fieldPairs(record, group) {
  const pairs = [];
  for (const key of Object.keys(FIELD).filter((k) => FIELD[k].group === group)) {
    const raw = record[key] ?? "";
    if (raw === "") continue;
    const label = FIELD[key].label;
    if (key === "paper_link") { const url = safeHttpUrl(raw); if (url) pairs.push([label, "Open the paper", { href: url }]); continue; }
    if (key === "pmid") { pairs.push([label, raw, { href: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(raw)}/` }]); continue; }
    if (key === "record_id") continue;
    if (key === "value_nM") { pairs.push([label, fmtNanomolar(raw)]); continue; }
    pairs.push([label, key === "plant_species" && raw === "unspecified" ? "Not specified" : prettyValue(key, raw), MONO.has(key) ? { mono: true } : {}]);
  }
  return pairs;
}

function paperPairs(paper) {
  if (!paper) return [];
  const pairs = [];
  for (const [key, label] of PAPER_FIELDS) {
    const v = paper[key] ?? "";
    if (v === "" || key === "pmid") continue;
    pairs.push([label, v, key === "doi" && safeHttpUrl(`https://doi.org/${v}`) ? { href: `https://doi.org/${v}` } : {}]);
  }
  return pairs;
}

async function init() {
  const id = new URLSearchParams(location.search).get("id") || "";
  const status = document.getElementById("status");
  if (!/^R\d{4}$/.test(id)) { setStatus(status, "No record id in the address (expected record.html?id=R0002).", true); return; }
  try {
    const { record, paper } = await getJSON(`/api/record/${id}`);
    const name = record.compound_name || "Compound not named";
    document.title = `${name} · AVPCD`;
    document.getElementById("title").textContent = name;
    document.getElementById("record-sub").textContent = `Record ${id}${record.pmid ? ` · PMID ${record.pmid}` : ""}`;
    document.getElementById("record-head").replaceChildren(...chips(record));
    document.getElementById("summary").replaceChildren(summary(record));
    const sections = ORDER.map((group) => {
      let pairs = fieldPairs(record, group);
      if (group === "Source") {
        const title = paper?.title;
        if (title) pairs = [["Paper title", title], ...paperPairs(paper).filter(([l]) => l !== "Title"), ...pairs];
      }
      return card(group, pairs);
    }).filter(Boolean);
    document.getElementById("sections").replaceChildren(...sections);
    setStatus(status, "");
  } catch (err) {
    setStatus(status, err.message.startsWith("404") ? `Record ${id} does not exist.` : `Could not load the record (${err.message}).`, true);
  }
}
init();
