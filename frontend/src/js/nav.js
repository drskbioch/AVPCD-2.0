// On every page: the mobile menu button, and the numbers in elements marked data-stat="path.in.stats".
import { getStats, fillDataStats } from "./api.js";

const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

getStats().then((stats) => fillDataStats(stats)).catch(() => { /* the text already in the page stays */ });
