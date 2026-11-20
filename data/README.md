# Datos de Voy Votando

Esta carpeta contiene los 6 informes de evaluación y toda la cadena que convierte sus propuestas en las posiciones del test. Cada fichero indica de qué sale, qué script o paso lo produce y quién lo lee.

La guía paso a paso para regenerar o adaptar la cadena está en [`docs/adaptar-a-otras-elecciones.md`](../docs/adaptar-a-otras-elecciones.md). Las reglas de codificación están en [`docs/metodologia.md`](../docs/metodologia.md), secciones 4 y 5.

## Procedencia

- El autor del proyecto elaboró los 6 informes con ayuda de IA. Parten de los programas oficiales y de las fuentes públicas que citan, como el BOE o la AIReF.
- Agentes de IA extrajeron cada informe a JSON y lo codificaron 2 veces, de forma independiente y a ciegas.
- `scripts/export.py` comprueba que cada cita aparece en su página del informe.
- Las discrepancias se adjudicaron con reglas. Las 10 celdas dudosas pasaron revisión humana.

## Licencia

Los informes, las extracciones, las codificaciones y los textos de esta carpeta se publican con licencia CC BY 4.0. Los scripts `.py` son código y se publican con licencia AGPL-3.0.

## Flujo

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

## `reports/`

| Fichero | Contenido | Lo lee |
|---|---|---|
| `Analisis_<Partido>_2026.pdf` | Los 6 informes de evaluación: 326 páginas y 651 unidades de propuesta en total | `pdftotext`, los agentes de extracción y `export.py`, que los copia a `public/informes/<partido>.pdf` |

Los partidos son Frente Amplio, Podemos, PP, PSOE, SALF y Vox. Son la única fuente de posiciones del test.

## `extracted/txt/`

| Fichero | Entrada | Lo produce | Lo leen |
|---|---|---|---|
| `Analisis_<Partido>_2026.txt` | El PDF | `pdftotext -layout` | `export.py`, para comprobar las citas, y los 2 prompts de codificación |

El texto conserva la maquetación. Las páginas van separadas por el carácter de salto de página: la página de una línea es el número de saltos anteriores más 1.

## `extracted/<partido>/`

Hay una carpeta por partido: `fa`, `podemos`, `pp`, `psoe`, `salf` y `vox`.

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `informe.json` | Escenarios, conclusiones, las unidades con sus valoraciones A, B, C y E, párrafos, secciones transversales, respaldo, equipo, acuerdos, cifras, "lo que no se atribuye", menciones a otros partidos y referencias | Un agente de IA con `_prompt_extraccion.md` | `export.py` (fichas de partido y unidades) y el agente de la codificación v1 |
| `codificacion.json` | Codificación v0: posición del partido en las 92 afirmaciones del catálogo v0, de 5 a 12 afirmaciones extra y la saliencia de cada ámbito | El mismo agente, con el mismo prompt | `analizar_codificaciones.py`, `seleccion_y_simulacion.py` y `export.py` (saliencia) |
| `codificacion_v1.json` | Codificación v1 a ciegas de las 53 finalistas | Otro agente de IA con `_prompt_codificacion_v1.md`, sin acceso a la codificación v0 | `seleccion_y_simulacion.py` |

Cada celda codificada tiene valor de −2 a +2 o nulo, confianza y saliencia. También lleva citas con página, valoraciones A, B, C y E y un motivo.

El prompt de extracción también pedía un resumen `posiciones.md` por partido. Ningún script lo usa y se elimina del repositorio publicado.

## Catálogos de afirmaciones

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `catalogo_afirmaciones_v0.json` | 92 afirmaciones en los 19 ámbitos, con la escala y una nota por afirmación | Redacción manual | `_prompt_extraccion.md` y `analizar_codificaciones.py` |
| `catalogo_afirmaciones_v1.json` | 53 finalistas con su id de origen (`v0`), ámbito, eje, dirección, texto y notas para casos límite | Selección a partir de la codificación v0 | `_prompt_codificacion_v1.md`, `seleccion_y_simulacion.py` y `construir_banco.py` |
| `menciones_cruzadas.json` | Lo que cada informe dice de los otros partidos, agrupado por partido mencionado, con su página | Fase de extracción, a partir de `mentions_of_other_parties`; el repositorio no incluye el script | `_prompt_codificacion_v1.md`, para la evidencia cruzada |

## Fusión, selección y banco

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `posiciones_fusion.json` | Matriz de 53 afirmaciones por 6 partidos tras fusionar v0 y v1, con los 2 valores de origen y una marca: `dif1`, `adjudicar`, `un_nulo` o `codificacion_unica` | `seleccion_y_simulacion.py` | `construir_banco.py` |
| `seleccion.json` | Las 40 preguntas del modo completo, las 24 del rápido, la simulación de ambos modos y el acuerdo entre codificaciones | `seleccion_y_simulacion.py` | `construir_banco.py` |
| `banco_final.json` | Las 40 preguntas seleccionadas, con orden, bloque, polaridad, modo rápido y posiciones fusionadas | `construir_banco.py` | `export.py` |

La tabla con las posiciones finales de las 39 preguntas sale de `python3 -I data/extracted/anexo_desde_contenido.py`.

## Adjudicación y ajustes

| Fichero | Contenido | Lo produce | Lo leen |
|---|---|---|---|
| `adjudicacion.md` | Registro de las 55 celdas adjudicadas, con valor anterior, valor nuevo, motivo y página. Incluye las 10 celdas para revisión humana, la reformulación de polaridad y la elección de la pregunta de agricultura. | Adjudicación con reglas | Personas revisoras |
| `posiciones_adjudicadas.json` | Las 40 preguntas por 6 partidos tras la adjudicación. Cada celda añade `decision`, `motivo`, `antes` y `revisar_humano`. | Adjudicación con reglas y revisión humana | `export.py` |
| `polaridad.json` | Q07, Q24 y Q29: texto anterior, texto nuevo, motivo y posiciones invertidas | Adjudicación | `export.py`, que invierte signo, dirección y polaridad |
| `agricultura.json` | 3 candidatas para el ámbito 15, codificadas con las mismas reglas, y la recomendación | Adjudicación | Ningún script; su resultado es Q44 en `banco_ajustes.json` |
| `banco_ajustes.json` | Cambios sobre `banco_final.json`: `retirar` (Q10 y Q26), `textos` (redacción final de Q01, Q05, Q07, Q24 y Q35), `añadir` (Q44 con sus posiciones y su ayuda) y `rapido` (Q17 entra y Q08 sale del modo rápido) | Edición manual | `export.py` |

`posiciones_adjudicadas.json` conserva el signo de la redacción original. `export.py` aplica la inversión de `polaridad.json` al exportar.

## Textos de apoyo

| Fichero | Contenido | Lo produce | Lo lee |
|---|---|---|---|
| `ayudas.json` | Ayuda "¿Qué significa?" de cada pregunta: medida, situación actual, a favor, en contra, fuentes con página y nota | Redacción a partir de los párrafos de viabilidad y efectos de los informes | `export.py`, que la pone en `help` |
| `glosario.json` | 30 términos con definición, norma y fuente | Redacción a partir de los informes | `export.py`, que escribe `src/content/glossary.json` |
| `interludios.json` | Un dato de contexto por bloque, con su fuente pública y la página del informe que la cita | Redacción a partir de los informes | `export.py`, que escribe `src/content/interludes.json` |

## Prompts

| Fichero | Para qué sirve |
|---|---|
| `_prompt_extraccion.md` | Encargo de extracción y codificación v0 de un informe. Fija el esquema de `informe.json` y de `codificacion.json`, y las reglas de codificación. |
| `_prompt_codificacion_v1.md` | Encargo de la segunda codificación a ciegas. Lista los ficheros prohibidos y los permitidos, y las reglas de evidencia cruzada. |

Los prompts tienen marcadores como `{PARTY_ID}` y `{TXT_FILE}`. Se sustituyen por los datos de cada partido.

## Scripts

Todos se ejecutan con `python3 -I` y solo usan la biblioteca estándar.

| Script | Lee | Escribe | Uso |
|---|---|---|---|
| `extracted/analizar_codificaciones.py` | Catálogo v0 y las 6 `codificacion.json` | Informe en pantalla | Cobertura, dispersión y pares separados de cada afirmación. Con `--extras` lista las afirmaciones extra. |
| `extracted/seleccion_y_simulacion.py` | Catálogo v1, `codificacion.json` y `codificacion_v1.json` | `posiciones_fusion.json`, `seleccion.json` e informe en pantalla | Fusión, acuerdo, selección y simulación. Argumentos: tamaño del modo completo y del rápido. |
| `extracted/construir_banco.py` | Catálogo v1, `posiciones_fusion.json` y `seleccion.json` | `banco_final.json` | Orden y polaridad del banco |
| `extracted/anexo_desde_contenido.py` | `src/content/questions.json` | Tabla Markdown en pantalla | Tabla de las preguntas finales con las posiciones de los 6 partidos |
| `../scripts/export.py` | `banco_final.json`, `posiciones_adjudicadas.json`, `banco_ajustes.json`, `polaridad.json`, textos de apoyo, los 6 `informe.json`, el texto y los PDF | `src/content/*.json` | Exportación con controles. Se ejecuta con `npm run data`. |

## Salida para la web

`npm run data` escribe estos ficheros a partir de `data/`:

| Fichero | Contenido |
|---|---|
| `src/content/questions.json` | Las preguntas con posiciones, citas, valoraciones y ayudas |
| `src/content/questions_core.json` | Las preguntas sin posiciones ni citas, para la página del test |
| `src/content/parties.json` | Ficha de cada partido |
| `src/content/units/<partido>.json` y `public/datos/unidades-<partido>.json` | Las 651 unidades de los informes |
| `src/content/blocks.json`, `ambitos.json`, `glossary.json` e `interludes.json` | Bloques, ámbitos, glosario e interludios |
| `src/content/meta.json` | Versión de los datos, huella SHA-256, recuentos, fecha de corte y fecha de la elección |
| `public/informes/<partido>.pdf` | Copia de cada informe para enlazar las citas |

La carpeta `data/other_tests_questions/` queda fuera del repositorio (`.gitignore`). Guardaba material de consulta que no forma parte de los datos.
