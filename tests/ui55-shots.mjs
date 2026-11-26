// Chụp Cài đặt + sảnh ở 3 khổ. Dùng: node tests/ui55-shots.mjs <url> <tiền tố>
import { createRequire } from "module"; const require = createRequire("/opt/npm-tools/node_modules/"); const { chromium } = require("playwright");
const [url, pre] = [process.argv[2], process.argv[3] || "x"];
const sizes = [["390x844", 390, 844], ["360x740", 360, 740], ["1280x800", 1280, 800]];
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
for (const [n, w, h] of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const p = await ctx.newPage();
  await p.route(/^https:\/\/[^/]*workers\.dev\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#ldr12", { state: "detached", timeout: 120000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `tests/artifacts/ui55/${pre}-lobby-${n}.png` });
  await p.evaluate(() => { const g = document.getElementById("hthGc"); if (g) g.hidden = false; document.getElementById("lbMute").click(); });
  await p.waitForSelector("#ovSet.on"); await p.waitForTimeout(500);
  await p.screenshot({ path: `tests/artifacts/ui55/${pre}-settings-${n}.png` });
  const m = await p.evaluate(() => { const b = document.querySelector("#ovSet .body"); return { sh: b.scrollHeight, ch: b.clientHeight }; });
  console.log(n, "body scroll", m.sh, "client", m.ch, m.sh > m.ch + 1 ? "CUON" : "ok");
  await ctx.close();
}
await b.close();
