import { getJSON, getStats, el, fmtInt, fmtNanomolar, label, setStatus } from "./api.js";

const form = document.getElementById("filters");
const statusBox = document.getElementById("status");
const rowsBox = document.getElementById("rows");
const state = { page: 1, sort: "record_id", order: "asc" };
const ADVANCED = ["inchikey", "value_min", "value_max", "tier", "flag", "page_size"];

// Columns shown in the table: [label, release column, sort key or null]
const COLUMNS = [
  ["Record", "record_id", "record_id"],
  ["Compound", "compound_name", "compound_name"],
  ["Plant", "plant_species", null],
  ["Virus", "virus_verbatim", null],
  ["Endpoint", "endpoint", "endpoint"],
  ["Value as printed", "value_raw", null],
  ["Value (nM)", "value_nM", "value_nM"],
  ["Evidence", "evidence_tier", "evidence_tier"],
  ["Flags", "data_quality_flags", null],
];

function currentParams() {
  const p = new URLSearchParams();
  for (const [k, v] of new FormData(form).entries()) {
    if (v !== "" && !(k === "page_size" && v === "50")) p.append(k, v);
  }
  if (state.sort !== "record_id" || state.order !== "asc") { p.set("sort", state.sort); p.set("order", state.order); }
  if (state.page > 1) p.set("page", state.page);
  return p;
}

function restoreFromUrl() {
  for (const [k, v] of new URLSearchParams(location.search).entries()) {
    if (k === "page") state.page = Math.max(1, parseInt(v, 10) || 1);
    else if (k === "sort") state.sort = v;
    else if (k === "order") state.order = v === "desc" ? "desc" : "asc";
    else {
      for (const field of form.querySelectorAll(`[name="${CSS.escape(k)}"]`)) {
        if (field.type === "checkbox") { if (field.value === v) field.checked = true; }
        else field.value = v;
      }
    }
  }
  const usesAdvanced = ADVANCED.some((name) => [...form.querySelectorAll(`[name="${name}"]`)].some((f) => (f.type === "checkbox" ? f.checked : f.value !== "" && f.value !== "50")));
  if (usesAdvanced || location.hash === "#advanced") document.getElementById("advanced").open = true;
}

function renderHead() {
  document.getElementById("head").replaceChildren(...COLUMNS.map(([text, , key]) => {
    const th = el("th", { scope: "col", "aria-sort": key && key === state.sort ? (state.order === "asc" ? "ascending" : "descending") : false });
    if (!key) { th.textContent = text; return th; }
    const arrow = key === state.sort ? (state.order === "asc" ? " ▲" : " ▼") : "";
    th.append(el("button", { type: "button", class: "sort", onclick: () => {
      state.order = state.sort === key && state.order === "asc" ? "desc" : "asc";
      state.sort = key; state.page = 1; search();
    } }, text + arrow));
    return th;
  }));
}

function cell(column, row) {
  const v = row[column] ?? "";
  const td = el("td");
  if (column === "record_id") td.append(el("a", { href: `record.html?id=${encodeURIComponent(v)}` }, v));
  else if (column === "value_nM") { td.className = "num"; td.textContent = fmtNanomolar(v); }
  else if (column === "value_raw") { td.className = "num"; td.textContent = [row.relation !== "=" ? row.relation : "", v, row.unit_raw].filter(Boolean).join(" "); }
  else if (column === "evidence_tier") td.append(el("span", { class: `tag ${v}` }, label(v)));
  else if (column === "data_quality_flags") {
    const names = v.split(";").filter(Boolean);
    if (names.length) td.append(...names.map((n) => el("span", { class: "flag" }, n)));
    else td.append(el("span", { class: "noflag" }, "none"));
  } else td.textContent = v;
  return td;
}

async function search() {
  const params = currentParams();
  history.replaceState(null, "", params.toString() ? `?${params}` : location.pathname);
  renderHead();
  setStatus(statusBox, "Loading…");
  try {
    const api = new URLSearchParams(params);
    if (!api.has("page_size")) api.set("page_size", "50");
    api.set("page", state.page);
    api.set("sort", state.sort);
    api.set("order", state.order);
    const data = await getJSON("/api/records", api);
    rowsBox.replaceChildren(...data.results.map((r) => el("tr", {}, COLUMNS.map(([, col]) => cell(col, r)))));
    setStatus(statusBox, data.total === 0 ? "No record matches these filters." : `${fmtInt(data.total)} record${data.total === 1 ? "" : "s"} found.`);
    document.getElementById("pageinfo").textContent = data.pages ? `Page ${fmtInt(data.page)} of ${fmtInt(data.pages)}` : "";
    document.getElementById("prev").disabled = data.page <= 1;
    document.getElementById("next").disabled = data.page >= data.pages;
  } catch (err) {
    rowsBox.replaceChildren();
    setStatus(statusBox, `Could not load records (${err.message}).`, true);
  }
}

function checkboxGroup(boxId, name, values) {
  const box = document.getElementById(boxId);
  for (const v of values) box.append(el("label", {}, el("input", { type: "checkbox", name, value: v }), label(v)));
}

async function init() {
  try {
    const stats = await getStats();
    checkboxGroup("endpoint-box", "endpoint", Object.keys(stats.by_endpoint).filter(Boolean));
    checkboxGroup("tier-box", "tier", Object.keys(stats.by_evidence_tier).filter(Boolean));
    for (const name of Object.keys(stats.by_data_quality_flag)) {
      form.elements.flag.append(el("option", { value: name }, name === "none" ? "none (no flag)" : name));
    }
  } catch (err) {
    setStatus(statusBox, `Could not reach the data service (${err.message}).`, true);
  }
  restoreFromUrl();
  search();
}

form.addEventListener("submit", (e) => { e.preventDefault(); state.page = 1; search(); });
document.getElementById("reset").addEventListener("click", () => {
  form.reset(); Object.assign(state, { page: 1, sort: "record_id", order: "asc" }); search();
});
document.getElementById("prev").addEventListener("click", () => { state.page = Math.max(1, state.page - 1); search(); });
document.getElementById("next").addEventListener("click", () => { state.page += 1; search(); });
init();
