// Uso: node shoot.mjs <render.html> <variants.json> <outDir> [nome...]
// Cada peça usa o próprio tamanho (w × h) e densidade (dpr): arquivo final = w·dpr × h·dpr.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const [html, variantsFile, out, ...only] = process.argv.slice(2);
const variants = JSON.parse(readFileSync(variantsFile, "utf8"));
const browser = await chromium.launch();
for (const v of variants) {
  for (const theme of v.themes ?? ["dark", "light"]) {
    const name = `${v.name}-${theme}`;
    if (only.length && !only.some((o) => name.startsWith(o))) continue;
    const params = { ...v.params, ...(v[theme] ?? {}), theme };
    const page = await browser.newPage({
      viewport: { width: params.w ?? 1920, height: params.h ?? 1080 },
      deviceScaleFactor: params.dpr ?? 2,
    });
    await page.goto(`file://${html}#${encodeURIComponent(JSON.stringify(params))}`);
    await page.waitForSelector("body[data-ready='1']", { timeout: 60000 });
    await page.screenshot({ path: `${out}/${name}.png`, type: "png" });
    await page.close();
    console.log("ok", name);
  }
}
await browser.close();
