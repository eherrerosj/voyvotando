// Escribe la cabecera Content-Security-Policy en dist/_headers después de compilar.
// Calcula el hash SHA-256 de cada script en línea que genera Astro, así solo se ejecutan esos scripts exactos.
// connect-src 'self' impide que el código envíe datos a cualquier otro dominio.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dist = path.join(path.dirname(path.dirname(new URL(import.meta.url).pathname)), "dist");
const hashes = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (m[1].trim()) hashes.add(`'sha256-${crypto.createHash("sha256").update(m[1]).digest("base64")}'`);
      }
    }
  }
}
walk(dist);

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(" ")}`,
  // Estilos en línea de Astro y atributos style de las barras; no ejecutan código.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const file = path.join(dist, "_headers");
const headers = fs.readFileSync(file, "utf8");
if (!headers.includes("__CSP__")) throw new Error("dist/_headers no contiene el marcador __CSP__");
fs.writeFileSync(file, headers.replace("__CSP__", csp));
console.log(`CSP escrita en dist/_headers con ${hashes.size} hashes de scripts en línea.`);
