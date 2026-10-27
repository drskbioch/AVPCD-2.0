import { el, fmtInt, setStatus } from "./api.js";
import { FIELDS, GROUPS } from "./labels.js";

const statusBox = document.getElementById("status");
const body = document.getElementById("rows");
const groupSelect = document.getElementById("group");
const filterInput = document.getElementById("filter");

function render() {
  const q = filterInput.value.trim().toLowerCase();
  const g = groupSelect.value;
  const hits = FIELDS.filter(([, label, group, desc]) => (!g || group === g) && (!q || `${label} ${desc}`.toLowerCase().includes(q)));
  body.replaceChildren(...hits.map(([, label, group, desc, added]) => el("tr", {},
    el("th", { scope: "row" }, label),
    el("td", {}, group),
    el("td", {}, desc),
    el("td", {}, added ? el("span", { class: "added" }, "Added by AVPCD") : el("span", { class: "dim" }, "From the paper"))))
  );
  setStatus(statusBox, `${fmtInt(hits.length)} of ${fmtInt(FIELDS.length)} fields.`);
}

for (const g of GROUPS) groupSelect.append(el("option", { value: g }, g));
groupSelect.addEventListener("change", render);
filterInput.addEventListener("input", render);
render();
