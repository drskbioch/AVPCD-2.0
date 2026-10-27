import { API_BASE, getJSON, el, setStatus } from "./api.js";

// The record tables are served by the API, which keeps them off until the licence plan is confirmed (HTTP 403).
const box = document.getElementById("tables");
const statusBox = document.getElementById("status");
try {
  const info = await getJSON("/api/download");
  setStatus(statusBox, "Downloads are enabled on this server. Files are UTF-8 CSV with a header row.");
  box.replaceChildren(el("ul", {}, info.tables.map((t) => el("li", {}, el("a", { href: `${API_BASE}/api/download?table=${encodeURIComponent(t)}` }, `${t}.csv`)))));
} catch (err) {
  const off = err.message.startsWith("403");
  setStatus(statusBox, off ? "Not available yet: the record tables cannot be downloaded until the licence plan of this release is confirmed." : `Could not ask the data service (${err.message}).`, !off);
  box.replaceChildren();
}
