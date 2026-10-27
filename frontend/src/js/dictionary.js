import { getJSON, el, fmtInt, setStatus } from "./api.js";

const statusBox = document.getElementById("status");
const body = document.getElementById("rows");
const tableSelect = document.getElementById("table");
const filterInput = document.getElementById("filter");
let rows = [];

function render() {
  const q = filterInput.value.trim().toLowerCase();
  const t = tableSelect.value;
  const hits = rows.filter((r) => (!t || r.table === t) && (!q || `${r.column} ${r.description}`.toLowerCase().includes(q)));
  body.replaceChildren(...hits.map((r) => el("tr", {},
    el("td", {}, r.table), el("td", {}, el("code", {}, r.column)), el("td", {}, r.kind), el("td", {}, r.description), el("td", {}, r.source))));
  setStatus(statusBox, `${fmtInt(hits.length)} of ${fmtInt(rows.length)} columns.`);
}

try {
  ({ rows } = await getJSON("/api/dictionary"));
  for (const t of [...new Set(rows.map((r) => r.table))]) tableSelect.append(el("option", { value: t }, t));
  tableSelect.value = rows.some((r) => r.table === "records") ? "records" : "";
  tableSelect.addEventListener("change", render);
  filterInput.addEventListener("input", render);
  render();
} catch (err) {
  setStatus(statusBox, `Could not load the data dictionary (${err.message}).`, true);
}
