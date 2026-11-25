// Chụp ảnh trang /admin (dữ liệu mẫu) ở 1280×800 và 390×844 bằng Chrome headless.
// PW_PATH=<thư mục chứa playwright-core> SERVER=http://localhost:8787 OUT=<thư mục ảnh> node scripts/shots-admin.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require((process.env.PW_PATH || "playwright-core").replace(/\/?$/, "/") + (process.env.PW_PATH ? "playwright-core" : ""));
const SERVER = process.env.SERVER || "http://localhost:8787", OUT = process.env.OUT || "shots", TOKEN = process.env.ADMIN_TOKEN || "dev-admin-token-123456";
mkdirSync(OUT, { recursive: true });
const rt = await (await fetch(SERVER + "/api/admin/realtime", { headers: { "x-admin-token": TOKEN } })).json();
const pid = (rt.players[0] || { id: 1 }).id;
const pages = [["tong-quan", "#/tong-quan"], ["tra-cuu", "#/tra-cuu"], ["nguoi-choi", "#/p/" + pid], ["nguoi-choi-tien-trinh", "#/p/" + pid + "/tien-trinh"], ["gui-thu", "#/thu"], ["giftcode", "#/giftcode"], ["giu-chan", "#/giu-chan"], ["suc-khoe", "#/suc-khoe"]];
const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
for (const [vw, vh, tag, full] of [[1280, 800, "pc", true], [390, 844, "dt", true]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: tag === "dt" ? 2 : 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  await ctx.addInitScript((t) => sessionStorage.setItem("ltd.admin.tok", t), TOKEN);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(tag + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.location().url || "")) errors.push(tag + " console: " + m.text() + " " + (m.location().url || "")); });
  await page.goto(SERVER + "/admin#/tong-quan");
  for (const [name, hash] of pages) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.waitForFunction(() => !document.querySelector("#view .load"), null, { timeout: 15000 });
    await page.waitForTimeout(400);
    // kiểm tra chữ bị tràn ngang khỏi khung nhìn
    const over = await page.evaluate(() => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll("#view *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > w + 1 && !e.closest(".tw,.tabs,.dwrap,.wm"); }).slice(0, 5).map((e) => e.tagName + "." + e.className + " " + (e.textContent || "").slice(0, 30)); });
    if (over.length) errors.push(tag + " " + name + " tràn: " + over.join(" | "));
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: full });
  }
  if (tag === "dt") { await page.evaluate(() => { location.hash = "#/tong-quan"; }); await page.waitForTimeout(600); await page.click("#burger"); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/dt-menu.png` }); }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? "CẢNH BÁO:\n" + errors.join("\n") : "không có lỗi trang");
