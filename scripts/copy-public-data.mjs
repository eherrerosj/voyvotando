// Copia a public/ los ficheros que la web sirve tal cual: los informes en PDF y las unidades de cada partido.
// Se ejecuta antes de `dev` y `build` para no versionar dos veces los mismos datos.
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const PDF = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "data", "partidos.json"), "utf8")).partidos.map((p) => [p.id, p.informe]));

fs.mkdirSync(path.join(root, "public", "informes"), { recursive: true });
fs.mkdirSync(path.join(root, "public", "datos"), { recursive: true });
for (const [id, file] of Object.entries(PDF)) {
  fs.copyFileSync(path.join(root, "data", "reports", `${file}.pdf`), path.join(root, "public", "informes", `${id}.pdf`));
  fs.copyFileSync(path.join(root, "src", "content", "units", `${id}.json`), path.join(root, "public", "datos", `unidades-${id}.json`));
}
console.log(`Copiados ${Object.keys(PDF).length} informes y ${Object.keys(PDF).length} ficheros de unidades a public/.`);
