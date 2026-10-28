import { getJSON, el, safeHttpUrl, setStatus, fmtNanomolar } from "./api.js";
import { FIELD, GROUPS, PAPER_FIELDS, UNIT_FLAG, prettyValue } from "./labels.js";

const MONO = new Set(["inchikey", "smiles"]);

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
  const nm = record.value_nM ? `${fmtNanomolar(record.value_nM)} nM` : "";
  const tiles = [
    ["Virus", record.ictv_species || record.virus_verbatim],
    ["Plant", record.plant_species && record.plant_species !== "unspecified" ? record.plant_species : ""],
    [record.endpoint || "Potency", potency(record)],
    ["In nanomolar", nm && nm !== potency(record) ? nm : ""],
  ].filter(([, v]) => v);
  return el("div", { class: "facts" }, tiles.map(([k, v]) => el("div", { class: "fact" }, el("span", {}, k), el("b", {}, v))));
}

// Only the unit warning is shown; it protects readers from a value that may be 1,000 times off.
function chips(record) {
  const names = (record.data_quality_flags || "").split(";");
  return names.includes(UNIT_FLAG.name) ? [el("span", { class: "flag", title: UNIT_FLAG.hint }, UNIT_FLAG.label)] : [];
}

function fieldPairs(record, group) {
  const pairs = [];
  for (const key of Object.keys(FIELD).filter((k) => FIELD[k].group === group)) {
    const raw = record[key] ?? "";
    if (raw === "") continue;
    const label = FIELD[key].label;
    if (key === "paper_link") { const url = safeHttpUrl(raw); if (url) pairs.push([label, "Open the paper", { href: url }]); continue; }
    if (key === "pmid") { pairs.push([label, raw, { href: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(raw)}/` }]); continue; }
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
    if (v === "" || key === "pmid" || key === "title") continue;
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
    const sections = GROUPS.map((group) => {
      let pairs = fieldPairs(record, group);
      if (group === "Source" && paper) pairs = [...(paper.title ? [["Paper title", paper.title]] : []), ...paperPairs(paper), ...pairs];
      return card(group, pairs);
    }).filter(Boolean);
    document.getElementById("sections").replaceChildren(...sections);
    setStatus(status, "");
  } catch (err) {
    setStatus(status, err.message.startsWith("404") ? `Record ${id} does not exist.` : `Could not load the record (${err.message}).`, true);
  }
}
init();
