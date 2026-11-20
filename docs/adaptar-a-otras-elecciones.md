# Adaptar Voy Votando a otras elecciones

Esta guía explica cómo reutilizar la cadena de datos y la web con otros informes de evaluación. Sirve para otras elecciones, otros partidos u otro país. Cada paso indica el fichero que produce y el script que lo lee.

La cadena va en este orden:

```
informes PDF → texto → extracción y codificación v0 → catálogo de finalistas
→ codificación v1 a ciegas → fusión y selección → banco → adjudicación y ajustes
→ exportación → compilación y despliegue
```

La descripción de cada fichero está en [`data/README.md`](../data/README.md). Las reglas de codificación y la fórmula están en la [metodología](metodologia.md).

## Requisitos

- Node.js 22.23.4 o posterior, para compilar la web.
- Python 3, para los scripts de datos. Solo usan la biblioteca estándar.
- `pdftotext` (paquete Poppler), para pasar los PDF a texto.
- Un sistema de agentes de IA, o personas, para la extracción y las 2 codificaciones.

## 1. Formato que deben tener los informes

La cadena depende de que todos los informes sigan el mismo marco. Cada informe evalúa el programa de un partido y debe tener estas partes:

| Parte | Contenido mínimo |
|---|---|
| Método | Definición de los escenarios A, B y C de ese partido, de la entrega E y de las categorías Alta, Media, Baja y NE |
| Conclusiones ejecutivas | Prioridades del partido, con referencias |
| Fichas por ámbito | Una o varias fichas por cada ámbito del marco común. Un ámbito puede partirse en varias fichas, por ejemplo "05. Vivienda, 1/3". |
| Tabla de unidades | Por ficha: ID, título, "Instrumento y condición decisiva" y valoración "A / B / C; E" |
| Párrafos de cada ficha | Viabilidad y evidencia, efectos y distribución, respaldo y acuerdos, verificación y seguimiento |
| Secciones transversales | Coherencia fiscal, restricciones jurídicas, respaldo interno, liderazgo y equipo, acuerdos entre partidos, ejecución y fuentes |
| Lo que no se atribuye | Frases explícitas del tipo "No se atribuye al partido...". Alimentan la regla de nulos. |
| Referencias numeradas | Fuente, fecha y título de cada referencia |

Reglas del formato:

- Todos los informes usan la misma lista de ámbitos. Voy Votando usa 19 (metodología, 3.1), pero sirve cualquier lista común.
- Las valoraciones A, B, C y E usan siempre las 4 categorías Alta, Media, Baja y NE.
- Los escenarios A, B y C pueden tener nombres distintos en cada partido, pero cada informe los define.
- El PDF tiene capa de texto y páginas numeradas. Un PDF escaneado no sirve, porque las citas se comprueban contra el texto.
- Cada informe declara su fecha de corte. Nada posterior a esa fecha entra en los datos.

Documenta quién elaboró los informes y con qué fuentes. En Voy Votando, el autor del proyecto elaboró los 6 informes con ayuda de IA. Partió de los programas oficiales y de las fuentes públicas que citan.

Guarda los PDF en `data/reports/` con un nombre estable, por ejemplo `Analisis_<Partido>_<año>.pdf`. `scripts/export.py` busca cada PDF por el prefijo de ese nombre.

## 2. Texto con maquetación

```sh
pdftotext -layout data/reports/Analisis_X_2030.pdf data/extracted/txt/Analisis_X_2030.txt
```

- `pdftotext` separa las páginas con el carácter de salto de página (form feed).
- La página de cada línea es el número de saltos anteriores más 1. Los scripts y los prompts usan esa regla.
- Comprueba que el número de saltos coincide con las páginas del PDF.

## 3. Catálogo inicial de afirmaciones

Escribe a mano `data/extracted/catalogo_afirmaciones_v0.json`:

```json
{
  "version": "0.1",
  "uso": "Banco candidato de afirmaciones para el test.",
  "escala": { "2": "...", "1": "...", "0": "...", "-1": "...", "-2": "...", "null": "..." },
  "afirmaciones": [
    { "id": "VIV1", "ambito": 5, "texto": "El Estado debería poder fijar topes al precio del alquiler...", "nota": "" }
  ]
}
```

- Voy Votando empezó con 92 afirmaciones, unas 5 por ámbito.
- Sigue los criterios de la metodología, 4.1: una sola idea, de 10 a 22 palabras, sin nombres de partidos ni de personas.
- Redacta afirmaciones sobre medidas que los informes puedan documentar. Las actitudes generales no se pueden codificar con un informe.

## 4. Extracción y codificación v0

El prompt `data/extracted/_prompt_extraccion.md` encarga a un agente un informe completo. Sustituye sus 4 marcadores:

| Marcador | Ejemplo |
|---|---|
| `{PARTY_NAME}` | Nombre del partido |
| `{PARTY_ID}` | Identificador corto en minúsculas, por ejemplo `pp` |
| `{TXT_FILE}` | Nombre del fichero de texto del paso 2 |
| `{PDF_FILE}` | Nombre del PDF del paso 1 |

Lanza un agente por informe. Cada uno escribe en `data/extracted/<partido>/`:

- `informe.json`: todas las unidades con sus valoraciones, los párrafos y las secciones transversales. También guarda los acuerdos, "lo que no se atribuye", las menciones a otros partidos y las referencias. El esquema está en el prompt.
- `codificacion.json`: la posición del partido en cada afirmación del catálogo, de 5 a 12 afirmaciones extra propuestas y la saliencia de cada ámbito.

La salida 3 del prompt, `posiciones.md`, es un resumen de lectura. Ningún script la usa y no se publica.

Revisa la extracción antes de seguir:

```sh
python3 -I -c "import json; json.load(open('data/extracted/pp/informe.json'))"
python3 -I data/extracted/analizar_codificaciones.py --extras
```

- El número de unidades extraídas debe coincidir con el declarado en cada informe. El agente anota las diferencias en `report_meta.notes`.
- `analizar_codificaciones.py` imprime la cobertura de cada afirmación, su dispersión y los pares de partidos que separa. Con `--extras` lista las afirmaciones extra.
- Edita su lista `PARTIES` si cambian los partidos.

## 5. Catálogo de finalistas y menciones cruzadas

Con la salida del paso 4, elige las finalistas y escribe `data/extracted/catalogo_afirmaciones_v1.json`:

```json
{
  "version": "1.0-candidata",
  "ejes": {
    "ECO": { "neg": "Más intervención pública y redistribución", "pos": "Más mercado y menos impuestos" },
    "SOC": { "neg": "Más progresista", "pos": "Más conservador" }
  },
  "escala": { "2": "...", "null": "..." },
  "afirmaciones": [
    { "id": "Q12", "v0": "VIV1", "ambito": 5, "eje": "ECO", "dir": -1, "texto": "...", "nota": "Cómo codificar los casos límite." }
  ]
}
```

- `v0` es el id de origen en el catálogo v0, o el id de una afirmación extra (`X_<partido>_<n>`).
- `eje` y `dir` sirven para el mapa: `dir` es +1 si estar de acuerdo acerca al polo positivo.
- `nota` fija cómo codificar los casos dudosos. Las notas reducen las discrepancias entre codificaciones.
- Descarta las afirmaciones con menos de 3 partidos con posición. Voy Votando pasó de 92 a 53 finalistas.

Prepara también `data/extracted/menciones_cruzadas.json`. Agrupa por partido mencionado las entradas `mentions_of_other_parties` de todos los `informe.json`. El repositorio no incluye un script para este paso.

```json
{ "pp": [ { "source_report": "psoe", "page": 7, "text": "..." } ] }
```

## 6. Codificación v1 a ciegas

El prompt `data/extracted/_prompt_codificacion_v1.md` encarga una segunda codificación de las finalistas. Sustituye `{PARTY_NAME}`, `{PARTY_ID}` y `{TXT_FILE}`.

- Lanza otro agente por informe, distinto del paso 4.
- El prompt le prohíbe abrir `codificacion.json`, los resúmenes de la primera codificación y las carpetas de otros partidos. Así las 2 codificaciones son independientes.
- Solo puede leer 4 entradas: el catálogo v1, el `informe.json` de su partido, el texto completo y sus menciones en otros informes.
- La evidencia cruzada solo vale para hechos documentados y lleva `"cross": true`.
- Escribe `data/extracted/<partido>/codificacion_v1.json`.

## 7. Fusión y selección

```sh
python3 -I data/extracted/seleccion_y_simulacion.py 40 24
```

Los 2 argumentos son el tamaño del modo completo y del modo rápido. Sin argumentos, el script usa 40 y 20.

El script hace 4 cosas:

1. Fusiona v0 y v1 con las reglas de la metodología, 5.5, y marca las celdas que necesitan adjudicación.
2. Imprime el acuerdo entre codificaciones por partido.
3. Selecciona las preguntas con el objetivo de la metodología, 4.2.
4. Simula votantes sintéticos con el algoritmo final y con la variante descartada.

Escribe `posiciones_fusion.json` y `seleccion.json`. Antes de ejecutarlo, revisa sus constantes:

| Constante | Qué es |
|---|---|
| `PARTIES` | Identificadores de los partidos |
| `LEFT` y `RIGHT` | Los 2 grupos que usa el control de polaridad |
| `BLOQUES` | Bloque de navegación de cada ámbito |
| `CHANGED` | Afirmaciones cuya redacción cambió entre v0 y v1: solo cuenta v1 |
| `MIN_COVER` | Mínimo de partidos con posición para ser candidata (3) |

Cambia los grupos `LEFT` y `RIGHT` si el sistema de partidos es distinto. Solo sirven para equilibrar la polaridad y no puntúan.

## 8. Banco

```sh
python3 -I data/extracted/construir_banco.py
```

- Lee el catálogo v1, `posiciones_fusion.json` y `seleccion.json`.
- Ordena las preguntas por bloque y alterna la polaridad dentro de cada bloque.
- Escribe `banco_final.json`, con orden, bloque, polaridad, modo rápido y posiciones.

Edita `PARTIES`, `NAMES`, `BLOQUES` y `BLOQUE_NOMBRE`. La función `lean` tiene los 2 grupos de polaridad escritos en el código. La primera pregunta del test (`Q03`) también está fijada en el código.

## 9. Adjudicación y ajustes

La adjudicación no tiene script. Revisa cada celda marcada en `banco_final.json` con estas reglas:

- Lee las 2 citas en el PDF y aplica la escala, las reglas y la nota de la afirmación.
- Compara las 6 celdas de cada pregunta: el mismo tipo de evidencia recibe el mismo valor.
- Anota cada decisión, con su motivo y su página, en `adjudicacion.md`.
- Marca con `"revisar_humano": true` las celdas dudosas. Una persona debe revisarlas antes de publicar.

El resultado es `data/extracted/posiciones_adjudicadas.json`, con una entrada por pregunta y por partido:

```json
{ "Q12": { "pp": { "value": -2, "confidence": "alta", "evidence": [], "viability": {}, "rationale": "",
                   "decision": "sin_cambio", "motivo": "", "antes": null, "revisar_humano": false } } }
```

Si la polaridad queda desequilibrada, reformula afirmaciones como negaciones exactas en `polaridad.json`:

```json
[ { "id": "Q29", "texto_antes": "...", "texto_nuevo": "...", "motivo": "...",
    "polaridad_antes": "D", "polaridad_despues": "I", "posiciones_antes": {}, "posiciones_invertidas": {} } ]
```

`export.py` invierte el signo de esas preguntas al exportar. Si ya invertiste los signos en `posiciones_adjudicadas.json`, crea `polaridad_aplicada.json` con `{"signos_ya_invertidos_en_adjudicadas": true}`.

Los cambios de última hora van en `banco_ajustes.json`:

| Clave | Contenido |
|---|---|
| `nota` | Texto libre |
| `retirar` | Objeto `{ "Q10": "motivo" }`: preguntas que salen del banco |
| `textos` | Objeto `{ "Q07": "texto nuevo" }`: redacción final que sustituye a la del banco o de `polaridad.json` |
| `añadir` | Lista de preguntas nuevas con `id`, `despues_de`, `ambito`, `bloque`, `eje`, `dir`, `polaridad`, `rapido`, `texto`, `posiciones` y `ayuda` |

Faltan 3 ficheros de textos de apoyo, que se escriben a mano:

| Fichero | Forma |
|---|---|
| `ayudas.json` | `{ "Q12": { "medida", "ahora", "a_favor", "en_contra", "fuentes": [{ "informe", "pagina" }], "nota" } }` |
| `glosario.json` | `[ { "termino", "definicion", "norma", "fuente": [{ "informe", "pagina" }] } ]` |
| `interludios.json` | `[ { "bloque", "dato", "fuente": [{ "informe", "pagina", "original" }] } ]`, uno por bloque |

Escribe "A favor" y "En contra" como efectos, con la misma forma y extensión. Los datos de los interludios deben tener fuente pública.

## 10. Exportación

Edita las constantes de `scripts/export.py`:

| Constante | Qué cambiar |
|---|---|
| `DATA_VERSION` | Versión de los datos, por ejemplo `1.0` |
| `PARTIES`, `NAMES` y `TXT` | Identificadores, nombres y prefijo del PDF y del texto de cada partido |
| `PARTNERS` | Socios del escenario B de cada informe (metodología, 6.21) |
| `BLOCKS` y `AMBITOS` | Bloques y ámbitos con sus nombres |
| `FORBIDDEN_NAMES` | Partidos y personas que no pueden aparecer en las afirmaciones |
| Total de unidades | El control espera 651. Cámbialo por el total de tus informes. |
| `cutoff` y `electionDate` | Fecha de corte y fecha de la elección en `meta.json` |

Después ejecuta:

```sh
npm ci
npm run data
```

El script falla si una cita no aparece en su página o si una pregunta tiene menos de 3 partidos con posición. También falla si una afirmación nombra a un partido. Corrige los datos y repite hasta que termine sin errores. La lista completa de controles está en la [arquitectura](arquitectura.md), 8.4.

## 11. Web

Cambia los puntos de la web que dependen de los partidos o de la fecha:

| Fichero | Qué cambiar |
|---|---|
| `src/lib/types.ts` | `PARTY_IDS` |
| `src/lib/format.ts` | `DISPLAY`, el nombre corto de cada partido |
| `src/layouts/Base.astro`, `src/pages/*.astro`, `src/components/results/Results.tsx` | Fecha de la elección, fecha de corte y textos como "29N" |
| `src/lib/scoring.test.ts` | Las pruebas que nombran partidos concretos: el empate de Frente Amplio y Podemos, la discrepancia de PP y Vox en Q50 y el orden en el eje ECO |
| `astro.config.mjs` | `site`, la dirección pública |

Comprueba el resultado:

```sh
npm test
npm run check
npm run build
npm run preview
npm run qa:responsive -- http://127.0.0.1:4321 qa
```

- `npm test` exige que cada partido quede primero con sus propias posiciones. También exige una recuperación de 0,95 o más con ruido σ = 0,75.
- Si un par de partidos no se separa, revisa la selección del paso 7 antes de tocar el algoritmo.
- Con respuestas al azar, ningún partido debería superar el 30% de primeros puestos. `seleccion_y_simulacion.py` imprime esa cifra.

## 12. Despliegue

`npm run build` deja la web estática en `dist/`. Cualquier alojamiento estático con HTTPS sirve.

- `public/_headers` usa el formato de cabeceras de Cloudflare y Netlify. En otro alojamiento, configura esas cabeceras a mano.
- Para Cloudflare Workers, cambia `name` y `routes` en `wrangler.jsonc` y ejecuta `npx wrangler login`.
- `npm run deploy` ejecuta las pruebas, compila y publica con Wrangler.

Anota cada versión de datos en un historial como [el de Voy Votando](historial-de-datos.md). Cada enlace de resultado guarda la versión con la que se calculó.

## Licencia

El código es AGPL-3.0: si publicas una web derivada, ofrece su código a quienes la usan. Los datos, los informes y las codificaciones son CC BY 4.0: puedes reutilizarlos con atribución.
