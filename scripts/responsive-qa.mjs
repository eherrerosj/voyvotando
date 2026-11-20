// Control de diseño adaptable: recorre todas las páginas en tamaños de móvil y tableta,
// mide desbordamientos, textos cortados, tamaños de toque, letra pequeña y accesibilidad (axe),
// y guarda capturas. Uso: node scripts/responsive-qa.mjs <url_base> <carpeta_salida>
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:4321";
const out = process.argv[3] || "qa";
fs.mkdirSync(out, { recursive: true });

const VIEWPORTS = [
  { name: "m360", width: 360, height: 740, mobile: true },
  { name: "m390", width: 390, height: 844, mobile: true },
  { name: "m430", width: 430, height: 932, mobile: true },
  { name: "t768", width: 768, height: 1024, mobile: true },
  { name: "t820", width: 820, height: 1180, mobile: true },
  { name: "t1024", width: 1024, height: 768, mobile: true },
];
// Resultado fijo para cargar la página de resultados sin repetir el test.
const RESULT = "/resultados#v=1.0-rc2&m=c&p=2%2C5&r=2tt795taeqpeq2fzkdbt";
const ROUTES = ["/", "/partidos/", "/partidos/podemos/", "/metodologia/", "/privacidad/", "/no-existe", RESULT];

const report = [];
const add = (vp, route, kind, detail) => report.push({ vp, route, kind, detail });

async function measure(page, vp, route) {
  const r = await page.evaluate((mobile) => {
    const vw = document.documentElement.clientWidth;
    const desc = (el) => {
      const cls = typeof el.className === "string" ? el.className.split(" ").filter(Boolean).slice(0, 2).join(".") : "";
      const txt = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""} «${txt}»`;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && rect.width > 0 && rect.height > 0 && !el.closest(".sr-only,.skip,[hidden]");
    };
    const inScroller = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
      }
      return false;
    };
    const res = { docOverflow: document.documentElement.scrollWidth - vw, overflow: [], clipped: [], taps: [], small: [], inputs: [], svgClip: [] };
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el)) continue;
      const rect = el.getBoundingClientRect();
      if ((rect.right > vw + 1 || rect.left < -1) && !inScroller(el) && getComputedStyle(el).position !== "fixed") res.overflow.push(`${desc(el)} [${Math.round(rect.left)}, ${Math.round(rect.right)}]`);
      const s = getComputedStyle(el);
      if ((s.overflowX === "hidden" || s.overflow === "hidden" || s.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 2 && el.innerText?.trim()) res.clipped.push(desc(el));
      const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (hasOwnText && !(el instanceof SVGElement) && parseFloat(s.fontSize) < 12) res.small.push(`${desc(el)} ${s.fontSize}`);
    }
    const interactive = document.querySelectorAll("a[href], button, input, select, textarea, summary, [role=button], [role=radio], [tabindex='0']");
    for (const el of interactive) {
      if (!visible(el)) continue;
      const rect = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const inlineLink = el.tagName === "A" && s.display === "inline" && el.closest("p, li, td, th, figcaption, footer, blockquote, dd");
      if (inlineLink) continue;
      // Una casilla dentro de una etiqueta usa la etiqueta como zona de toque, y no abre teclado.
      const label = el.closest("label");
      if (el.type === "checkbox" && label && label.getBoundingClientRect().height >= 40) continue;
      const min = Math.min(rect.width, rect.height);
      if (min < 24) res.taps.push(`FALLO ${desc(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      else if (mobile && min < 40) res.taps.push(`aviso ${desc(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      if ((el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") && parseFloat(s.fontSize) < 16) res.inputs.push(`${desc(el)} ${s.fontSize}`);
    }
    for (const svg of document.querySelectorAll("svg")) {
      if (!visible(svg)) continue;
      const sb = svg.getBoundingClientRect();
      for (const t of svg.querySelectorAll("text")) {
        const tb = t.getBoundingClientRect();
        if (tb.width === 0) continue;
        if (tb.left < sb.left - 1 || tb.right > sb.right + 1 || tb.top < sb.top - 1 || tb.bottom > sb.bottom + 1) res.svgClip.push(`«${t.textContent}» en ${svg.closest("[id],figure,li")?.id || svg.getAttribute("class") || "svg"}`);
        if (tb.height < 9) res.small.push(`svg «${t.textContent}» alto ${tb.height.toFixed(1)}px`);
      }
    }
    for (const k of ["overflow", "clipped", "taps", "small", "inputs", "svgClip"]) res[k] = [...new Set(res[k])];
    return res;
  }, vp.mobile);
  if (r.docOverflow > 0) add(vp.name, route, "scroll horizontal", `${r.docOverflow}px`);
  for (const k of ["overflow", "clipped", "taps", "small", "inputs", "svgClip"]) for (const d of r[k].slice(0, 12)) add(vp.name, route, k, d);
}

async function axe(page, vp, route) {
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of res.violations) add(vp.name, route, `axe:${v.id}`, `${v.impact} · ${v.nodes.length} nodos · ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
}

const safe = (s) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "inicio";
const errors = [];

for (const vp of VIEWPORTS) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${vp.name}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errors.push(`[${vp.name}] ${m.text()}`));

  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    if (route === RESULT) {
      await page.waitForSelector(".hero-res");
      await page.waitForTimeout(1400);
      // Interacciones: abrir citas, tocar un partido en el mapa, cambiar escenario.
      await page.locator("#preguntas details").first().evaluate((d) => (d.open = true));
      await page.locator(".map__party").first().click().catch(() => {});
      await page.locator("#si-gobiernan .chips").nth(1).locator("button").nth(1).click().catch(() => {});
      await page.waitForTimeout(1000); // fin de las animaciones de entrada
    }
    if (route.startsWith("/partidos/podemos")) await page.locator("details.amb").first().evaluate((d) => (d.open = true));
    await measure(page, vp, route);
    if (["m390", "t768"].includes(vp.name)) await axe(page, vp, route);
    await page.screenshot({ path: `${out}/${vp.name}-${safe(route.split("#")[0])}.png`, fullPage: true });
  }

  // Test: prioridades, primera pregunta con ayuda, cabecera de bloque, mitad, última.
  await page.goto(base + "/test", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(base + "/test", { waitUntil: "networkidle" });
  await measure(page, vp, "/test#prioridades");
  if (["m390", "t768"].includes(vp.name)) await axe(page, vp, "/test#prioridades");
  await page.screenshot({ path: `${out}/${vp.name}-test-prioridades.png`, fullPage: true });
  await page.locator(".prio").nth(1).click();
  await page.getByRole("button", { name: /Empezar con estas prioridades/ }).click();
  await page.waitForSelector(".quiz__statement");
  await page.getByRole("button", { name: "¿Qué significa?" }).click();
  await page.waitForTimeout(700);
  await measure(page, vp, "/test#pregunta1");
  if (["m390", "t768"].includes(vp.name)) await axe(page, vp, "/test#pregunta1");
  await page.screenshot({ path: `${out}/${vp.name}-test-pregunta1.png` });
  await page.locator(".scale__opt").first().click();
  for (let i = 0; i < 9; i++) { await page.locator(".scale__opt").nth(i % 5).click(); await page.waitForTimeout(260); }
  await page.waitForTimeout(600);
  await measure(page, vp, "/test#bloque2");
  await page.screenshot({ path: `${out}/${vp.name}-test-bloque2.png` });
  const nav = await page.locator(".quiz__nav").boundingBox();
  if (!nav || nav.y + nav.height > vp.height + 1) add(vp.name, "/test", "barra-navegación", `fuera de la pantalla (y=${nav && Math.round(nav.y)})`);
  await page.getByRole("button", { name: "Ir a pregunta" }).click();
  await measure(page, vp, "/test#rejilla");
  await page.screenshot({ path: `${out}/${vp.name}-test-rejilla.png` });
  await page.locator(".qgrid__cell").last().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${vp.name}-test-ultima.png` });
  await browser.close();
}

const byKind = {};
for (const r of report) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
fs.writeFileSync(`${out}/report.json`, JSON.stringify({ byKind, report, errors }, null, 1));
console.log("Resumen:", JSON.stringify(byKind));
console.log(errors.length ? "Errores de consola:\n" + errors.join("\n") : "Sin errores de consola.");
