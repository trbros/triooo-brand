// Uso: node shoot.mjs <render.html> <variants.json> <outDir> [nome...]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const [html, variantsFile, out, ...only] = process.argv.slice(2);
const variants = JSON.parse(readFileSync(variantsFile, "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
for (const v of variants) {
  for (const theme of v.themes ?? ["dark", "light"]) {
    const name = `${v.name}-${theme}`;
    if (only.length && !only.some((o) => name.startsWith(o))) continue;
    const params = { ...v.params, ...(v[theme] ?? {}), theme };
    await page.setViewportSize({ width: params.w ?? 1920, height: params.h ?? 1080 });
    await page.goto(`file://${html}#${encodeURIComponent(JSON.stringify(params))}`);
    await page.reload();
    await page.waitForSelector("body[data-ready='1']", { timeout: 60000 });
    await page.screenshot({ path: `${out}/${name}.png`, type: "png" });
    console.log("ok", name);
  }
}
await browser.close();
