# Incorporar partidos nuevos

Esta guía explica cómo se añade un partido a Voy Votando cuando llega su informe de evaluación. La versión 1.1 la aplicó a EH Bildu y PNV, y sirve igual para los siguientes. Cada paso indica el fichero que produce, el script que lo lee y el control que debe pasar.

## Principio: el banco de preguntas no cambia

- Los partidos nuevos se codifican con las mismas preguntas publicadas, con su texto final y su signo.
- Así las posiciones de todos los partidos son comparables, y un enlace de resultado antiguo se puede recalcular con los partidos nuevos.
- El método es el mismo de la versión 1.0 (metodología, sección 5): 2 codificaciones independientes y a ciegas, fusión con reglas, adjudicación con registro y revisión humana de las celdas dudosas.
- Las codificaciones de los partidos que ya estaban no se tocan.
- El banco solo cambia si un partido nuevo no se distingue de otro con las preguntas actuales (paso 13).

## Requisitos del informe

El informe sigue el mismo marco que los anteriores ([adaptar-a-otras-elecciones.md](adaptar-a-otras-elecciones.md), sección 1):

- 19 ámbitos, unidades con ID y valoraciones A, B, C y E con las categorías Alta, Media, Baja y NE.
- Escenarios A, B y C definidos en el propio informe.
- PDF con capa de texto y páginas numeradas, y fecha de corte declarada.

La maquetación puede variar. Los informes de EH Bildu y PNV ponen cada unidad en una fila de 3 columnas: propuesta, condición y evidencia, y valoraciones. La extracción guarda la propuesta en `instrument` y la segunda columna en `condition`.

## Pasos

| Paso | Qué se hace | Produce | Control |
|---|---|---|---|
| 1 | Copiar el PDF a `data/reports/Analisis_<Partido>_<año>.pdf` | PDF | Tiene capa de texto |
| 2 | `pdftotext -layout` del PDF | `data/extracted/txt/Analisis_<Partido>_<año>.txt` | Saltos de página = páginas del PDF |
| 3 | `npm run data` y `python3 -I data/extracted/catalogo_banco.py` | `catalogo_banco.json` | Mismas preguntas que la web |
| 4 | Añadir el partido a `data/partidos.json` y a `PARTY_IDS` | Configuración | Mismo orden en los 2 sitios |
| 5 | Agente de extracción y primera codificación | `<id>/informe.json`, `<id>/codificacion_a.json` | Unidades extraídas = declaradas |
| 6 | `python3 -I data/extracted/menciones_cruzadas.py` | Clave `<id>` en `menciones_cruzadas.json` | Una entrada por mención |
| 7 | Agente de segunda codificación a ciegas | `<id>/codificacion_b.json` | No abre `codificacion_a.json` |
| 8 | `python3 -I data/extracted/fusionar_incorporacion.py` | `posiciones_incorporadas.json` | Imprime el acuerdo y las celdas pendientes |
| 9 | Adjudicación de las celdas marcadas | `adjudicacion_incorporaciones.json` | 0 celdas pendientes al repetir el paso 8 |
| 10 | Revisión horizontal por pregunta | Ajustes en el mismo fichero | Mismo tipo de evidencia, mismo valor |
| 11 | Socios del escenario B y circunscripciones | `data/partidos.json` | Salen del informe, con página |
| 12 | Exportación: subir `DATA_VERSION` y `npm run data` | `src/content/*.json` | Termina sin controles fallidos |
| 13 | Validación: `npm test` y `npm run validar` | Tabla de la metodología, 6.13 | Autotest y recuperación de 0,95 o más |
| 14 | Documentación e imágenes | Docs, README, `og.png` | Cifras iguales a `meta.json` |
| 15 | Pruebas de la web, commit, CI y despliegue | Producción | CI en verde y rutas en 200 |

### 3. Catálogo de las preguntas publicadas

`catalogo_banco.py` escribe `data/extracted/catalogo_banco.json` desde `src/content/questions.json`. Cada pregunta lleva su texto final y la nota de codificación del catálogo v1.

- Las 3 preguntas reformuladas como negación (Q07, Q24 y Q29) no llevan nota, porque la nota se escribió para la redacción anterior.
- Los partidos nuevos se codifican con este texto. `export.py` no invierte su signo, porque ya coincide con el que ve la persona usuaria.

### 4. Configuración del partido

`data/partidos.json` es la lista única de partidos. La leen `export.py`, `copy-public-data.mjs`, `menciones_cruzadas.py` y `fusionar_incorporacion.py`.

| Campo | Contenido |
|---|---|
| `id` | Identificador corto en minúsculas, por ejemplo `pnv` |
| `nombre`, `corto`, `mostrar`, `sigla` | Nombre completo, nombre corto, nombre en la interfaz y sigla para gráficos |
| `informe` | Nombre del PDF y del texto, sin extensión |
| `alias` | Formas de nombrarlo. Sirven para las menciones cruzadas y para prohibir su nombre en las afirmaciones. |
| `socios` | Partidos del escenario B de su informe (paso 11) |
| `ambito` | `estatal` o `autonomico` |
| `circunscripciones` | Provincias en las que se presenta, si es autonómico |
| `incorporado` | Versión de los datos en la que entra, o `null` para los de la 1.0 |
| `unidades` | Unidades que declara el informe. `export.py` falla si exporta otra cifra. |

El orden de la lista es alfabético por `mostrar`. `PARTY_IDS` en `src/lib/types.ts` repite ese orden y una prueba comprueba que coinciden. Al añadir un partido, se quita de `sin_informe`.

### 5 y 7. Las 2 codificaciones

- El paso 5 usa `data/extracted/_prompt_incorporacion_extraccion.md`. Un agente lee el informe entero, escribe `informe.json` y codifica todas las preguntas en `codificacion_a.json`, con la saliencia de los 19 ámbitos.
- El paso 7 usa `data/extracted/_prompt_incorporacion_codificacion.md` y otro agente. No puede abrir la primera codificación ni las posiciones de ningún partido. Solo lee el catálogo, el `informe.json` del partido, su texto y sus menciones en otros informes.
- Las reglas son las de la metodología, 5.1 y 5.2. Hay una regla añadida para partidos autonómicos: si el partido pide una competencia para su comunidad sin posición sobre la medida estatal, la celda es nula o vale ±1 con confianza baja.
- Si se incorporan varios partidos a la vez, el paso 6 va después de todas las extracciones, porque cada informe nuevo puede mencionar a los otros.

### 8 y 9. Fusión y adjudicación

`fusionar_incorporacion.py` aplica las reglas de la metodología, 5.5:

| Caso | Valor provisional | Marca |
|---|---|---|
| Iguales | El valor, con la confianza menor | Ninguna |
| Diferencia de 1 | El más cercano a 0, con la confianza menor | `dif1` |
| Diferencia de 2 o más | Nulo | `dif2` |
| Una nula y otra con valor | El valor si su confianza es media o alta | `un_nulo` |

Cada celda marcada se adjudica en `data/extracted/adjudicacion_incorporaciones.json`:

```json
{ "pnv": { "Q36": { "value": -2, "confidence": "alta", "motivo": "PNV-13-02 rechaza... (p. 47)", "revisar_humano": false } } }
```

- Se leen las 2 citas en el PDF y se aplican la escala, las reglas y la nota de la pregunta.
- La adjudicación puede sustituir `evidence`, `viability` y `rationale`. Si no lo hace, se conservan los de la fusión.
- `revisar_humano: true` marca las celdas dudosas. El historial de datos las lista hasta que una persona las revisa.
- El script vuelve a fusionar desde las codificaciones cada vez. Las decisiones solo viven en el fichero de adjudicación, así que el resultado se puede reproducir.

### 10. Revisión horizontal

Para cada pregunta se leen juntas las celdas de todos los partidos con sus citas (metodología, 5.6). Una unidad que propone lo mismo recibe el mismo valor en cualquier partido. Si una celda nueva no encaja, se corrige en el fichero de adjudicación con su motivo. Las celdas de los partidos de la 1.0 solo cambian con una corrección documentada en el historial.

### 12. Exportación

`npm run data` falla si:

- una cita no aparece en su página del informe;
- una pregunta tiene menos de 3 partidos con posición;
- una afirmación nombra a un partido o a una persona (la lista sale de los alias);
- un partido exporta un número de unidades distinto del declarado en `data/partidos.json`;
- falta la celda de un partido incorporado en alguna pregunta.

`DATA_VERSION` sube un número menor por lote de partidos: 1.1, 1.2… La huella SHA-256 cambia y cada enlace de resultado guarda la versión con la que se calculó.

### 13. Validación y plan B

- `npm test` exige que cada partido quede primero con sus propias posiciones y una recuperación de 0,95 o más con ruido σ = 0,75.
- `npm run validar` imprime la tabla de la metodología, 6.13, con todos los partidos.
- Si un partido nuevo no pasa, primero se revisan sus codificaciones y la adjudicación. El algoritmo no se toca.
- Si aun así 2 partidos no se separan, se añade al banco una pregunta del catálogo v1 en el ámbito que los distingue. La pregunta se codifica para todos los partidos con las 2 codificaciones y entra con `añadir` en `banco_ajustes.json`.

### 14. Documentación e imágenes

| Fichero | Qué se actualiza |
|---|---|
| `docs/historial-de-datos.md` | Nueva versión: partidos, acuerdo entre codificaciones, celdas adjudicadas, celdas para revisión humana y validación |
| `docs/metodologia.md` | 4.4 cobertura, 5.4 acuerdo, 6.13 validación y 6.23 cercanía entre partidos |
| `README.md` y `data/README.md` | Número de partidos, informes, páginas y propuestas |
| `public/og.png` y `docs/assets/social-preview.png` | Número de partidos |

La web lee los números de `meta.json`: partidos, informes, páginas, propuestas y fechas de corte.

### 15. Web y publicación

- La interfaz no necesita cambios: los nombres, las siglas y el ámbito salen de `meta.json`.
- `npm run qa:responsive` comprueba que el mapa, el podio y la tabla de preguntas caben con más partidos en 6 tamaños de móvil y tableta.
- Commit y push con la cuenta del proyecto, CI en verde y `npx wrangler deploy`.

## Partidos que se presentan solo en algunas provincias

- La web los compara igual que a los estatales y avisa de dónde se presentan: en la portada del resultado, en el podio y en su ficha.
- El test mide coincidencias. Un partido que no está en tu papeleta también te dice con qué ideas coincides.
- Con el siguiente lote, que añade varios partidos autonómicos, llega un selector "¿Dónde votas?". Guardará la provincia en el enlace de resultado y calculará el ranking y el margen de error solo con los partidos de esa papeleta. Por defecto seguirá mostrando todos.

## Neutralidad

- Mismo proceso, misma escala y mismas reglas para todos los partidos, también los autonómicos.
- Orden alfabético por defecto, sin colores ni logotipos.
- Las fichas muestran los mismos campos para todos.
- Ninguna posición se deduce por ideología ni por lo que proponen partidos afines.
