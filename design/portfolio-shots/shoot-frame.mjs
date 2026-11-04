// Captures phone-size screenshots of the live AcuPark site via Chrome DevTools Protocol.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const [outDir, scheme = "dark", only = ""] = process.argv.slice(2);
const W = 390, H = 890; // the portfolio phone frame's screen proportions (402x874 device, 3.2% bezel)
// The app reads its safe areas from --sat/--sab and, when embedded, pads itself like a phone and draws a
// home indicator (globals.css). The captures use that same mode. The portfolio frame's island ends at
// 5.3% of the screen; 66px of 890 starts content at 7.4%, a Dynamic-Island-sized gap below it.
const SAFE_TOP = 66;
const BASE = process.env.BASE || "https://acupark-ten.vercel.app"; // BASE=http://127.0.0.1:3000 for unreleased changes
mkdirSync(outDir, { recursive: true });
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const safe = `html{--sat:${SAFE_TOP}px}`;
const shots = [
  ["splash", "/", safe],
  ["home", "/", safe],
  ["scan", "/arrive?lot=lot_n01", safe],
  ["reservation", "/reserve?lot=lot_n05", safe],
  ["map", "/map?place=denny-hall", safe],
  ["navigation", "/navigate?lot=lot_n22", safe],
  ["payment", "/pay?lot=lot_n05", safe],
  // Pay ahead lives in a sheet on Home: AI Quick Scan -> Pay ahead. The last field taps through to it.
  // Availability: every lot with its live open count, and the filter chips narrowing the map.
  ["map-all", "/map", safe],
  ["map-filters", "/map", safe, `(() => { document.querySelector('button[aria-label="Filters"]').click(); setTimeout(() => { const chip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "EV Charging"); chip.click(); chip.parentElement.scrollLeft = 9999; }, 500); })()`], // the row scrolls; show its far end
  ["pay-ahead", "/", safe, `(() => { const by = (txt) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(txt)); by("AI Quick Scan").click(); setTimeout(() => by("Auto-pay the moment").click(), 600); })()`], // the Quick Scan card also says "Pay ahead"
].filter(([name]) => !only || only.split(",").includes(name));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${outDir}/.profile`,
  "about:blank",
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    if (targets.find((t) => t.type === "page")) break;
  } catch {}
  await sleep(200);
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pending.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = (expression) => send("Runtime.evaluate", { expression, returnByValue: true }).then((r) => r?.result?.value);

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
// Embedded mode from the first paint, so the nav measures its phone-height before anything is laid out
// against it (the map drawer sits on that measurement). The inline head script only does this inside an iframe.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `document.addEventListener("DOMContentLoaded", () => document.documentElement.setAttribute("data-embed", ""));` });
for (const [name, path, css, tap] of shots) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  if (name === "splash") {
    // Freeze the launch screen at the Dubs moment (he's sat and the logo is in).
    for (let i = 0; i < 100; i++) {
      if (await evaluate("!!document.querySelector('.db-root')")) break;
      await sleep(50);
    }
    await sleep(2100);
    await evaluate("document.getAnimations().forEach(a => a.pause())");
  } else {
    await sleep(name === "map" || name === "navigation" ? 9000 : 6000);
  }
  if (css) {
    // Added after the page has hydrated, so React can't drop it.
    await evaluate(`(() => { document.documentElement.setAttribute("data-embed", ""); const st = document.createElement("style"); st.textContent = ${JSON.stringify(css)}; document.head.appendChild(st); })()`);
    await sleep(400);
  }
  if (tap) {
    await evaluate(tap);
    await sleep(1400); // sheet animation
  }
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(data, "base64"));
  console.log(name, "ok");
}
ws.close();
chrome.kill();
