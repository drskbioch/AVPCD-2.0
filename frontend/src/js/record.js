import { getJSON, el, safeHttpUrl, setStatus } from "./api.js";

// Display groups of release columns. Any column not listed here is shown under "Other columns", so none is hidden.
const GROUPS = [
  ["Compound", ["compound_name", "role", "is_derivative", "is_derivative_ruling", "inchikey", "smiles", "pubchem_cid", "compound_resolution_status"]],
  ["Plant", ["plant_species", "plant_part", "isolation", "plant_family", "ncbi_taxid", "plant_resolution_status", "plant_provenance_level"]],
  ["Virus and assay", ["virus_verbatim", "strain", "variant", "ictv_species", "ictv_family", "genome_type", "virus_host", "virus_resolution_rank", "assay_type", "cell_line", "target"]],
  ["Potency value", ["endpoint", "relation_raw", "relation", "value_raw", "value_upper_raw", "unit_raw", "value_nM", "converted", "value_conversion_note", "value_check_flag", "value_status", "inhibition_pct", "dispersion", "dose_response_reported"]],
  ["Cytotoxicity", ["si_reported", "cytotoxicity_reported", "cc50_value", "cc50_unit", "cc50_same_cell_line"]],
  ["Source", ["pmid", "paper_link", "evidence_tier", "source_location", "source_detail", "method_as_recorded", "workbook_row"]],
  ["Novelty and duplicates", ["novelty_status", "novelty_npass_ids", "novelty_npass_pmids", "novelty_chembl_molecules", "novelty_chembl_docs", "v1_compound_antiviral", "duplicate_status", "pair_distinguished_by"]],
  ["Flags and notes", ["tags", "flags", "data_quality_flags", "notes"]],
];

function kv(pairs) {
  const dl = el("dl", { class: "kv" });
  for (const [k, v] of pairs) {
    const dd = el("dd", v === "" ? { class: "empty" } : {});
    const url = k.endsWith("_link") ? safeHttpUrl(v) : null;
    if (url) dd.append(el("a", { href: url, rel: "noopener noreferrer", target: "_blank" }, v));
    else dd.textContent = v === "" ? "—" : v;
    dl.append(el("dt", {}, k), dd);
  }
  return dl;
}

function section(title, pairs) {
  return el("section", { class: "card-sec" }, el("h2", {}, title), kv(pairs));
}

function headline(record) {
  const value = [record.relation !== "=" ? record.relation : "", record.value_raw, record.unit_raw].filter(Boolean).join(" ");
  const tier = record.evidence_tier.replace("_", " ");
  const head = document.getElementById("record-head");
  head.replaceChildren(
    el("span", { class: `tag ${record.evidence_tier}` }, tier || "tier not recorded"),
    el("span", {}, [record.endpoint, value].filter(Boolean).join(" ")),
    el("span", { class: "label" }, [record.virus_verbatim, record.plant_species].filter(Boolean).join(" · ")),
  );
  for (const name of record.data_quality_flags.split(";").filter(Boolean)) head.append(el("span", { class: "flag" }, name));
}

async function init() {
  const id = new URLSearchParams(location.search).get("id") || "";
  const status = document.getElementById("status");
  if (!/^R\d{4}$/.test(id)) { setStatus(status, "No record id in the address (expected record.html?id=R0002).", true); return; }
  try {
    const { record, paper } = await getJSON(`/api/record/${id}`);
    document.title = `${id} · AVPCD`;
    document.getElementById("title").textContent = `${id}: ${record.compound_name || "(no compound name)"}`;
    headline(record);
    const used = new Set();
    const sections = GROUPS.map(([title, cols]) => {
      const present = cols.filter((c) => c in record);
      present.forEach((c) => used.add(c));
      return section(title, present.map((c) => [c, record[c]]));
    });
    const rest = Object.keys(record).filter((c) => !used.has(c));
    if (rest.length) sections.push(section("Other columns", rest.map((c) => [c, record[c]])));
    if (paper) sections.push(section("Paper", Object.entries(paper)));
    document.getElementById("sections").replaceChildren(...sections);
    setStatus(status, "");
  } catch (err) {
    setStatus(status, err.message.startsWith("404") ? `Record ${id} does not exist.` : `Could not load the record (${err.message}).`, true);
  }
}
init();
