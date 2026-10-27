// Shared helpers. The API address comes from config.js (written by build.mjs from AVPCD_API_URL);
// without it (opening src/ directly while developing) the local backend address is used.
export const API_BASE = (window.AVPCD_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function getJSON(path, params) {
  const url = new URL(API_BASE + path);
  for (const [key, value] of params ? params.entries() : []) url.searchParams.append(key, value);
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) {
    let detail = resp.statusText;
    try { detail = (await resp.json()).detail ?? detail; } catch { /* body was not JSON */ }
    throw new Error(`${resp.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  return resp.json();
}

// One /api/stats request per page, shared by every module that asks for it.
let statsPromise;
export function getStats() {
  statsPromise ??= getJSON("/api/stats");
  return statsPromise;
}

// Small DOM builder. Text always goes in through textContent, never innerHTML, so data cannot inject markup.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

export function safeHttpUrl(text) {
  try {
    const u = new URL(text);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch { return null; }
}

export function fmtInt(n) { return Number(n).toLocaleString("en-GB"); }

// value_nM arrives as a string with up to six decimals: show four significant digits.
export function fmtNanomolar(text) {
  if (text === "" || text == null) return "";
  const x = Number(text);
  if (!Number.isFinite(x)) return text;
  return x === 0 ? "0" : x >= 1e6 || x < 0.01 ? x.toExponential(2) : Number(x.toPrecision(4)).toLocaleString("en-GB");
}

export const label = (text) => (text === "" ? "(none recorded)" : String(text).replaceAll("_", " "));

export function setStatus(box, text, isError = false) {
  box.className = isError ? "status error" : "status";
  box.textContent = text;
}

// "meta.version" -> stats.meta.version; numbers are formatted with thousands separators.
export function fillDataStats(stats, root = document) {
  for (const node of root.querySelectorAll("[data-stat]")) {
    let v = stats;
    for (const part of node.dataset.stat.split(".")) v = v?.[part];
    if (v === undefined || v === null || typeof v === "object") continue;
    node.textContent = typeof v === "number" ? fmtInt(v) : String(v);
  }
}
