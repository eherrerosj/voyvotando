// Capturas de QA: recorre la portada, el test completo y los resultados en escritorio y móvil.
// Uso: node scripts/shots.mjs <url_base> <carpeta_salida>
import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:4321";
const out = process.argv[3] || "shots";
fs.mkdirSync(out, { recursive: true });
const errors = [];
const checks = [];

async function run(name, viewport) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => m.type() === "error" && errors.push(`[${name}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));

  await page.goto(base + "/");
  await page.screenshot({ path: `${out}/${name}-01-portada.png`, fullPage: true });

  await page.goto(base + "/test");
  await page.waitForSelector(".prio-grid");
  await page.screenshot({ path: `${out}/${name}-02-prioridades.png` });
  await page.locator(".prio").nth(1).click();
  await page.locator(".prio").nth(0).click();
  await page.getByRole("button", { name: /Empezar con estas prioridades/ }).click();
  await page.waitForSelector(".quiz__statement");
  await page.screenshot({ path: `${out}/${name}-03-pregunta.png` });
  await page.getByRole("button", { name: "¿Qué significa?" }).click();
  await page.screenshot({ path: `${out}/${name}-04-ayuda.png` });

  // Intro avanza sin responder.
  const before = await page.locator(".quiz__top .kicker").innerText();
  await page.keyboard.press("Escape");
  await page.locator("#q-title").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const after = await page.locator(".quiz__top .kicker").innerText();
  checks.push(`[${name}] Intro avanza: ${before.split("·")[0].trim()} -> ${after.split("·")[0].trim()}`);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(200);

  // Patrón de respuestas de un perfil de izquierda moderada, con algunos saltos.
  const pattern = ["2", "1", "4", "2", "1", "5", "2", "0", "1", "4", "2", "3", "1", "5", "2", "1", "4", "1", "2", "5"];
  let k = 0, shotBand = false, shotMid = false;
  for (let guard = 0; guard < 120 && !page.url().includes("/resultados"); guard++) {
    if (!shotBand && k > 0 && (await page.locator(".blockband").count())) {
      await page.screenshot({ path: `${out}/${name}-05-bloque.png` });
      shotBand = true;
    }
    if (!shotMid && k === 15) {
      await page.getByRole("button", { name: "¿Qué significa?" }).click().catch(() => {});
      await page.screenshot({ path: `${out}/${name}-05b-mitad-con-ayuda.png` });
      const nav = await page.locator(".quiz__nav").boundingBox();
      checks.push(`[${name}] barra de navegación visible: ${nav && nav.y + nav.height <= viewport.height + 1 ? "sí" : "NO"} (y=${nav && Math.round(nav.y)})`);
      shotMid = true;
    }
    await page.keyboard.press(pattern[k++ % pattern.length]);
    await page.waitForTimeout(260);
  }
  await page.waitForSelector(".hero-res", { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-06-resultado-completo.png`, fullPage: true });
  for (const id of ["titular", "podio", "por-que", "mapa", "temas", "inesperadas", "si-gobiernan", "pactos", "preguntas", "precision"]) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await el.screenshot({ path: `${out}/${name}-07-${id}.png` });
  }
  fs.writeFileSync(`${out}/${name}-url.txt`, page.url());
  if (name === "escritorio") {
    await page.emulateMedia({ media: "print" });
    await page.pdf({ path: `${out}/informe.pdf`, format: "A4", printBackground: true });
    await page.emulateMedia({ media: "screen", colorScheme: "dark" });
    await page.locator("#preguntas").scrollIntoViewIfNeeded();
    await page.locator(".qlist__item").nth(9).screenshot({ path: `${out}/${name}-09-regla-oscuro.png` });
    await page.emulateMedia({ media: "screen", colorScheme: "light" });
  }
  await page.goto(base + "/partidos/pp");
  await page.screenshot({ path: `${out}/${name}-08-partido.png`, fullPage: true });
  await browser.close();
}

await run("escritorio", { width: 1366, height: 900 });
await run("movil", { width: 390, height: 844 });
console.log(checks.join("\n"));
console.log(errors.length ? errors.join("\n") : "Sin errores de consola.");
