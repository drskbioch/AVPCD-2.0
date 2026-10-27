import { API_BASE, getJSON, el, setStatus } from "./api.js";

// The record tables are served by the API (CC BY 4.0). A server may switch them off (HTTP 403).
const box = document.getElementById("tables");
const statusBox = document.getElementById("status");
try {
  const info = await getJSON("/api/download");
  setStatus(statusBox, "The release tables are licensed CC BY 4.0. Files are UTF-8 CSV with a header row.");
  box.replaceChildren(el("ul", {}, info.tables.map((t) => el("li", {}, el("a", { href: `${API_BASE}/api/download?table=${encodeURIComponent(t)}` }, `${t}.csv`)))));
} catch (err) {
  const off = err.message.startsWith("403");
  setStatus(statusBox, off ? "The record tables are not offered for download on this server." : `Could not ask the data service (${err.message}).`, !off);
  box.replaceChildren();
}
