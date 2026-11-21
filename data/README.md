# Datos de Voy Votando

Esta carpeta contiene los 8 informes de evaluación y toda la cadena que convierte sus propuestas en las posiciones del test. Cada fichero indica de qué sale, qué script o paso lo produce y quién lo lee.

La guía paso a paso para regenerar o adaptar la cadena está en [`docs/adaptar-a-otras-elecciones.md`](../docs/adaptar-a-otras-elecciones.md). La guía para añadir un partido a un banco ya publicado está en [`docs/incorporar-partidos.md`](../docs/incorporar-partidos.md). Las reglas de codificación están en [`docs/metodologia.md`](../docs/metodologia.md), secciones 4 y 5.

## Procedencia

- El autor del proyecto elaboró los 8 informes con ayuda de IA. Parten de los programas oficiales y de las fuentes públicas que citan, como el BOE o la AIReF.
- Agentes de IA extrajeron cada informe a JSON y lo codificaron 2 veces, de forma independiente y a ciegas.
- `scripts/export.py` comprueba que cada cita aparece en su página del informe.
- Las discrepancias se adjudicaron con reglas. En la versión 1.0, las 10 celdas dudosas de los 6 partidos originales pasaron revisión humana. En la versión 1.1, 3 celdas de EH Bildu y PNV esperan revisión humana.

## Licencia

Los informes, las extracciones, las codificaciones y los textos de esta carpeta se publican con licencia CC BY 4.0. Los scripts `.py` son código y se publican con licencia AGPL-3.0.

## Flujo

Versión 1.0, con los 6 partidos originales:

```
reports/*.pdf
  → extracted/txt/*.txt                                  (pdftotext -layout)
  → extracted/<partido>/informe.json y codificacion.json (agente de IA, _prompt_extraccion.md)
  → extracted/catalogo_afirmaciones_v1.json              (selección de finalistas)
  → extracted/<partido>/codificacion_v1.json             (otro agente de IA, _prompt_codificacion_v1.md)
  → extracted/posiciones_fusion.json y seleccion.json    (seleccion_y_simulacion.py)
  → extracted/banco_final.json                           (construir_banco.py)
  → extracted/posiciones_adjudicadas.json                (adjudicación con reglas y revisión humana)
  → src/content/*.json y public/                         (scripts/export.py, con npm run data)
```

Partidos incorporados desde la versión 1.1 (EH Bildu y PNV), con el banco ya publicado:

```
reports/Analisis_<Partido>_2026.pdf
  → extracted/txt/Analisis_<Partido>_2026.txt            (pdftotext -layout)
  → extracted/catalogo_banco.json                        (catalogo_banco.py, desde src/content/questions.json)
  → extracted/<id>/informe.json y codificacion_a.json    (agente de IA, _prompt_incorporacion_extraccion.md)
  → extracted/menciones_cruzadas.json, clave <id>        (menciones_cruzadas.py)
  → extracted/<id>/codificacion_b.json                   (otro agente de IA, _prompt_incorporacion_codificacion.md)
  → extracted/posiciones_incorporadas.json               (fusionar_incorporacion.py, con adjudicacion_incorporaciones.json)
  → src/content/*.json y public/                         (scripts/export.py, con npm run data)
```

## `partidos.json`

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `partidos.json` | Lista única de los 8 partidos, en orden alfabético por `mostrar`: id, nombres, informe, alias, socios del escenario B, ámbito, circunscripciones, versión en la que entra y unidades declaradas. `sin_informe` lista los 5 partidos sin informe. | Edición manual | `scripts/export.py`, `scripts/copy-public-data.mjs`, `extracted/menciones_cruzadas.py` y `extracted/fusionar_incorporacion.py` |

Cada campo se explica en [`docs/incorporar-partidos.md`](../docs/incorporar-partidos.md), paso 4. `PARTY_IDS` en `src/lib/types.ts` repite el mismo orden, y una prueba lo comprueba.

## `reports/`

| Fichero | Contenido | Lo lee |
|---|---|---|
| `Analisis_<Partido>_2026.pdf` | Los 8 informes de evaluación: 538 páginas y 937 unidades de propuesta en total | `pdftotext`, los agentes de extracción y `scripts/copy-public-data.mjs`, que los copia a `public/informes/<partido>.pdf` |

Los partidos son EH Bildu, Frente Amplio, PNV, Podemos, PP, PSOE, SALF y Vox. Son la única fuente de posiciones del test.

## `extracted/txt/`

| Fichero | Entrada | Lo produce | Lo leen |
|---|---|---|---|
| `Analisis_<Partido>_2026.txt` | El PDF | `pdftotext -layout` | `export.py`, para comprobar las citas, y los prompts de extracción y codificación |

El texto conserva la maquetación. Las páginas van separadas por el carácter de salto de página: la página de una línea es el número de saltos anteriores más 1.

## `extracted/<partido>/`

Hay una carpeta por partido: `bildu`, `fa`, `pnv`, `podemos`, `pp`, `psoe`, `salf` y `vox`. Las 6 carpetas de la versión 1.0 tienen `informe.json`, `codificacion.json` y `codificacion_v1.json`. Las de los partidos incorporados, `bildu` y `pnv`, tienen `informe.json`, `codificacion_a.json` y `codificacion_b.json`.

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `informe.json` | Escenarios, conclusiones, las unidades con sus valoraciones A, B, C y E, párrafos, secciones transversales, respaldo, equipo, acuerdos, cifras, "lo que no se atribuye", menciones a otros partidos y referencias | Un agente de IA con `_prompt_extraccion.md` (versión 1.0) o `_prompt_incorporacion_extraccion.md` (partidos incorporados) | `export.py` (fichas de partido y unidades), `menciones_cruzadas.py` y el agente de la segunda codificación |
| `codificacion.json` | Versión 1.0: posición del partido en las 92 afirmaciones del catálogo v0, de 5 a 12 afirmaciones extra y la saliencia de cada ámbito | El mismo agente, con el mismo prompt | `analizar_codificaciones.py`, `seleccion_y_simulacion.py` y `export.py` (saliencia) |
| `codificacion_v1.json` | Versión 1.0: codificación v1 a ciegas de las 53 finalistas | Otro agente de IA con `_prompt_codificacion_v1.md`, sin acceso a la codificación v0 | `seleccion_y_simulacion.py` |
| `codificacion_a.json` | Partidos incorporados: primera codificación de las 39 preguntas de `catalogo_banco.json` y la saliencia de cada ámbito | El agente de `_prompt_incorporacion_extraccion.md`, en el mismo encargo que `informe.json` | `fusionar_incorporacion.py` y `export.py` (saliencia) |
| `codificacion_b.json` | Partidos incorporados: segunda codificación a ciegas de las 39 preguntas | Otro agente de IA con `_prompt_incorporacion_codificacion.md`, sin acceso a `codificacion_a.json` | `fusionar_incorporacion.py` |

Cada celda codificada tiene valor de −2 a +2 o nulo, confianza y saliencia. También lleva citas con página, valoraciones A, B, C y E y un motivo.

Los partidos incorporados se codifican con el texto final de cada pregunta. Por eso `export.py` no invierte su signo en Q07, Q24 y Q29.

El prompt de extracción de la versión 1.0 también pedía un resumen `posiciones.md` por partido. Ningún script lo usa y se elimina del repositorio publicado.

## Catálogos de afirmaciones

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `catalogo_afirmaciones_v0.json` | 92 afirmaciones en los 19 ámbitos, con la escala y una nota por afirmación | Redacción manual | `_prompt_extraccion.md` y `analizar_codificaciones.py` |
| `catalogo_afirmaciones_v1.json` | 53 finalistas con su id de origen (`v0`), ámbito, eje, dirección, texto y notas para casos límite | Selección a partir de la codificación v0 | `_prompt_codificacion_v1.md`, `seleccion_y_simulacion.py`, `construir_banco.py` y `catalogo_banco.py` |
| `catalogo_banco.json` | Las 39 preguntas publicadas con su texto final, ámbito, bloque y la nota del catálogo v1. Q07, Q24 y Q29 van sin nota, porque su nota se escribió para la redacción anterior. | `catalogo_banco.py`, desde `src/content/questions.json` | Los 2 prompts de incorporación y `fusionar_incorporacion.py` |
| `menciones_cruzadas.json` | Lo que cada informe dice de los otros partidos, agrupado por partido mencionado, con su página | Las claves de los 6 partidos de la versión 1.0 salen de la fase de extracción, sin script en el repositorio. Las claves de los partidos incorporados las añade `menciones_cruzadas.py`. | `_prompt_codificacion_v1.md` y `_prompt_incorporacion_codificacion.md`, para la evidencia cruzada |

## Fusión, selección y banco

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `posiciones_fusion.json` | Matriz de 53 afirmaciones por los 6 partidos de la versión 1.0 tras fusionar v0 y v1, con los 2 valores de origen y una marca: `dif1`, `adjudicar`, `un_nulo` o `codificacion_unica` | `seleccion_y_simulacion.py` | `construir_banco.py` |
| `seleccion.json` | Las 40 preguntas del modo completo, las 24 del rápido, la simulación de ambos modos y el acuerdo entre codificaciones | `seleccion_y_simulacion.py` | `construir_banco.py` |
| `banco_final.json` | Las 40 preguntas seleccionadas, con orden, bloque, polaridad, modo rápido y posiciones fusionadas | `construir_banco.py` | `export.py` |

`python3 -I data/extracted/anexo_desde_contenido.py` imprime la tabla de las 39 preguntas finales con las posiciones de todos los partidos de `data/partidos.json`.

## Adjudicación y ajustes

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `adjudicacion.md` | Versión 1.0: registro de las 55 celdas adjudicadas, con valor anterior, valor nuevo, motivo y página. Incluye las 10 celdas para revisión humana, la reformulación de polaridad y la elección de la pregunta de agricultura. | Adjudicación con reglas | Personas revisoras |
| `posiciones_adjudicadas.json` | Las 40 preguntas por los 6 partidos de la versión 1.0 tras la adjudicación. Cada celda añade `decision`, `motivo`, `antes` y `revisar_humano`. | Adjudicación con reglas y revisión humana | `export.py` |
| `adjudicacion_incorporaciones.json` | Decisiones sobre las celdas de los partidos incorporados: valor, confianza, motivo con página y `revisar_humano`. En la versión 1.1 recoge 7 celdas de EH Bildu y PNV, 3 de ellas para revisión humana. | Adjudicación con reglas | `fusionar_incorporacion.py` |
| `posiciones_incorporadas.json` | Las 39 preguntas por cada partido incorporado tras la fusión y la adjudicación. Cada celda guarda los 2 valores de origen, la marca de fusión, `decision`, `motivo`, `antes` y `revisar_humano`. | `fusionar_incorporacion.py` | `export.py` |
| `polaridad.json` | Q07, Q24 y Q29: texto anterior, texto nuevo, motivo y posiciones invertidas | Adjudicación | `export.py`, que invierte signo, dirección y polaridad, y `catalogo_banco.py`, que quita la nota de esas 3 preguntas |
| `agricultura.json` | 3 candidatas para el ámbito 15, codificadas con las mismas reglas, y la recomendación | Adjudicación | Ningún script; su resultado es Q44 en `banco_ajustes.json` |
| `banco_ajustes.json` | Cambios sobre `banco_final.json`: `retirar` (Q10 y Q26), `textos` (redacción final de Q01, Q05, Q07, Q24 y Q35), `añadir` (Q44 con sus posiciones y su ayuda) y `rapido` (Q17 entra y Q08 sale del modo rápido) | Edición manual | `export.py` |

`posiciones_adjudicadas.json` conserva el signo de la redacción original. `export.py` aplica la inversión de `polaridad.json` al exportar. `posiciones_incorporadas.json` ya sigue el texto final, y `export.py` no lo invierte.

## Textos de apoyo

| Fichero | Contenido | Lo produce | Lo lee |
|---|---|---|---|
| `ayudas.json` | Ayuda "¿Qué significa?" de cada pregunta: medida, situación actual, a favor, en contra, fuentes con página y nota | Redacción a partir de los párrafos de viabilidad y efectos de los informes | `export.py`, que la pone en `help` |
| `glosario.json` | 30 términos con definición, norma y fuente | Redacción a partir de los informes | `export.py`, que escribe `src/content/glossary.json` |
| `interludios.json` | Un dato de contexto por bloque, con su fuente pública y la página del informe que la cita | Redacción a partir de los informes | `export.py`, que escribe `src/content/interludes.json` |

## Prompts

| Fichero | Para qué sirve |
|---|---|
| `_prompt_extraccion.md` | Versión 1.0: encargo de extracción y codificación v0 de un informe. Fija el esquema de `informe.json` y de `codificacion.json`, y las reglas de codificación. |
| `_prompt_codificacion_v1.md` | Versión 1.0: encargo de la segunda codificación a ciegas. Lista los ficheros prohibidos y los permitidos, y las reglas de evidencia cruzada. |
| `_prompt_incorporacion_extraccion.md` | Partidos incorporados: encargo de extracción y primera codificación con `catalogo_banco.json`. Escribe `informe.json` y `codificacion_a.json`. |
| `_prompt_incorporacion_codificacion.md` | Partidos incorporados: encargo de la segunda codificación a ciegas. Prohíbe abrir `codificacion_a.json`, la fusión, la adjudicación y las posiciones de otros partidos. Escribe `codificacion_b.json`. |

Los prompts tienen marcadores como `{PARTY_ID}` y `{TXT_FILE}`. Se sustituyen por los datos de cada partido.

## Scripts

Todos se ejecutan con `python3 -I` y solo usan la biblioteca estándar.

| Script | Lee | Escribe | Uso |
|---|---|---|---|
| `extracted/analizar_codificaciones.py` | Catálogo v0 y las 6 `codificacion.json` de la versión 1.0 | Informe en pantalla | Cobertura, dispersión y pares separados de cada afirmación. Con `--extras` lista las afirmaciones extra. |
| `extracted/seleccion_y_simulacion.py` | Catálogo v1, `codificacion.json` y `codificacion_v1.json` | `posiciones_fusion.json`, `seleccion.json` e informe en pantalla | Fusión, acuerdo, selección y simulación de la versión 1.0. Argumentos: tamaño del modo completo y del rápido. |
| `extracted/construir_banco.py` | Catálogo v1, `posiciones_fusion.json` y `seleccion.json` | `banco_final.json` | Orden y polaridad del banco |
| `extracted/anexo_desde_contenido.py` | `src/content/questions.json` | Tabla Markdown en pantalla | Tabla de las preguntas finales con las posiciones de todos los partidos de `data/partidos.json` |
| `extracted/catalogo_banco.py` | `src/content/questions.json`, `src/content/meta.json`, catálogo v1 y `polaridad.json` | `catalogo_banco.json` | Preguntas publicadas para codificar partidos nuevos. Se ejecuta después de `npm run data`. |
| `extracted/menciones_cruzadas.py` | `data/partidos.json`, los `informe.json` y `menciones_cruzadas.json` | `menciones_cruzadas.json` | Añade la clave de cada partido incorporado, con sus menciones en los otros informes. Busca sus alias de `data/partidos.json`. No toca las claves de los 6 partidos de la versión 1.0. |
| `extracted/fusionar_incorporacion.py` | `data/partidos.json`, `catalogo_banco.json`, `codificacion_a.json` y `codificacion_b.json` de cada partido incorporado, y `adjudicacion_incorporaciones.json` | `posiciones_incorporadas.json` e informe en pantalla | Fusión con las reglas de la metodología, 5.5. Imprime el acuerdo de cada partido y las celdas marcadas sin adjudicar. |
| `../scripts/export.py` | `data/partidos.json`, `banco_final.json`, `posiciones_adjudicadas.json`, `posiciones_incorporadas.json`, `banco_ajustes.json`, `polaridad.json`, textos de apoyo, los 8 `informe.json`, la saliencia de las codificaciones y el texto de los informes | `src/content/*.json` | Exportación con controles. Se ejecuta con `npm run data`. |

`scripts/copy-public-data.mjs` es de Node. Lee `data/partidos.json` y copia los 8 PDF y las unidades a `public/` antes de `npm run dev` y `npm run build`.

## Salida para la web

`npm run data` escribe estos ficheros a partir de `data/`:

| Fichero | Contenido |
|---|---|
| `src/content/questions.json` | Las preguntas con posiciones, citas, valoraciones y ayudas |
| `src/content/questions_core.json` | Las preguntas sin posiciones ni citas, para la página del test |
| `src/content/parties.json` | Ficha de cada partido, con su ámbito, sus circunscripciones y la versión en la que entra |
| `src/content/units/<partido>.json` y `public/datos/unidades-<partido>.json` | Las 937 unidades de los informes. `copy-public-data.mjs` hace la copia de `public/`. |
| `src/content/blocks.json`, `ambitos.json`, `glossary.json` e `interludes.json` | Bloques, ámbitos, glosario e interludios |
| `src/content/meta.json` | Versión de los datos, huella SHA-256, recuentos, fecha de corte, fecha de la elección, `partyInfo` (nombre, sigla, ámbito y circunscripciones de cada partido) y `notIncluded` (partidos sin informe) |
| `public/informes/<partido>.pdf` | Copia de cada informe para enlazar las citas, hecha por `copy-public-data.mjs` |

La carpeta `data/other_tests_questions/` queda fuera del repositorio (`.gitignore`). Guardaba material de consulta que no forma parte de los datos.
