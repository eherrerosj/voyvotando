# Encargo: extracción y primera codificación de un partido nuevo

## Contexto
Voy Votando es un test de afinidad electoral neutral para las elecciones generales de España del 29/11/2026. Compara las respuestas de cada persona con las posiciones documentadas de varios partidos. Cada partido tiene un informe de evaluación de su programa, y todos los informes siguen el mismo marco:
- 19 ámbitos de política pública. Un ámbito puede partirse en varias fichas, por ejemplo "05. Vivienda y urbanismo | 1/2".
- Cada propuesta evaluada es una unidad con ID (por ejemplo `PNV-01-04` o `V01`), título, texto de la propuesta, condición y evidencia, y valoraciones A, B, C y E con valores `Alta | Media | Baja | NE`.
- A, B y C son escenarios de aprobación propios de cada partido, definidos en la sección de método. E es la entrega material tras la aprobación y la financiación.
- Secciones transversales: coherencia fiscal, restricciones jurídicas, respaldo interno, liderazgo y equipo, acuerdos entre partidos, ejecución, ambigüedades y fuentes.

Tu tarea es UN informe: `{PARTY_NAME}` (id `{PARTY_ID}`). El banco de preguntas ya está publicado. Este partido se añade con el mismo método que los anteriores: tu codificación es la primera de 2 codificaciones independientes.

## Entradas
- Texto con maquetación: `data/extracted/txt/{TXT_FILE}`. Las páginas se separan con el carácter form feed `\f`: página = número de `\f` anteriores + 1. El pie también lleva el número de página.
- PDF original: `data/reports/{PDF_FILE}`. Usa `pdftotext -f N -l N -layout` o `pdftotext -f N -l N -raw` si una tabla a 2 columnas sale rota.
- Preguntas que hay que codificar: `data/extracted/catalogo_banco.json`. Lee la `nota` de cada pregunta: fija cómo codificar los casos límite.

Lee el informe ENTERO, de principio a fin, en trozos. No resumas de memoria. No uses fuentes externas, otros informes ni otros ficheros de `data/extracted/`.

## Salida 1: `data/extracted/{PARTY_ID}/informe.json`
JSON válido. Compruébalo con `python3 -I -c "import json;json.load(open(RUTA))"`. Esquema:
```json
{
  "party_id": "{PARTY_ID}",
  "party_name": "",
  "report_meta": {"title": "", "version": "", "cutoff_date": "YYYY-MM-DD", "program_date": "YYYY-MM-DD", "program_title": "", "n_units_declared": 0, "n_program_entries": "", "pages": 0, "coalition_members": [], "circunscripciones": {"lista": [], "cita": "", "pagina": 0}, "notes": ""},
  "scenarios": {"A": {"label": "", "definition": ""}, "B": {"label": "", "definition": ""}, "C": {"label": "", "definition": ""}, "E": {"definition": ""}, "categories": {"Alta": "", "Media": "", "Baja": "", "NE": ""}},
  "executive_conclusions": [{"title": "", "text": "", "refs": []}],
  "ambitos": [
    {
      "num": 1,
      "title_in_report": "",
      "sheets": [
        {
          "sheet_title": "",
          "page": 0,
          "program_refs": "",
          "source_refs": [],
          "forecast_confidence": "",
          "units": [
            {"id": "", "title": "", "instrument": "texto literal de la propuesta", "condition": "texto literal de la columna de condición y evidencia", "A": "Alta|Media|Baja|NE", "B": "", "C": "", "E": "", "figures": ["cifras, costes y plazos literales"], "page": 0}
          ],
          "paragraphs": [{"heading": "", "text": "texto literal", "refs": []}]
        }
      ]
    }
  ],
  "cross_sections": [{"section": "", "page": 0, "heading": "", "text": "texto literal; las tablas como filas 'col1 | col2 | col3'"}],
  "internal_support": [{"area": "", "evidence": "", "inference_and_limit": "", "refs": []}],
  "team": [{"name": "", "role": "", "verified_trajectory": "", "what_it_allows_to_assess": "", "refs": []}],
  "integrity_and_governance": [{"topic": "", "text": "", "refs": []}],
  "agreements": [{"counterpart": "", "common_ground": "", "frictions": "", "documented_agreement": true, "refs": []}],
  "negotiation_packages": [{"package": "", "condition": "", "effect": ""}],
  "fiscal": {"summary": "", "key_figures": [{"figure": "", "reading": "", "missing": ""}]},
  "ambiguities_and_open_questions": [""],
  "explicit_non_positions": [{"text": "frase literal del tipo 'No se atribuye al partido...' o 'No concreta...'", "ambito": 0, "page": 0}],
  "mentions_of_other_parties": [{"party": "nombre del partido mencionado, uno por entrada", "text": "", "page": 0}],
  "references": [{"n": 1, "source": "", "date": "", "title": ""}]
}
```
Reglas:
- Todas las unidades de todas las fichas, sin excepción. Cuenta las unidades y compáralas con `n_units_declared`. Si no cuadra, explícalo en `report_meta.notes`.
- `instrument` lleva el texto de la propuesta. `condition` lleva el texto de la columna "Condición y evidencia" o equivalente. Si el informe no separa las 2 columnas, deja `condition` en `null`.
- Texto literal en `instrument`, `condition` y `paragraphs`. Une las líneas partidas por la maquetación. En las tablas a 2 columnas, no mezcles el texto de una columna con el de la otra. No parafrasees.
- `circunscripciones`: las provincias o comunidades en las que el informe dice que el partido presenta candidatura, con la cita y la página. Si el informe no lo dice, deja la lista vacía y anótalo en `notes`.
- `mentions_of_other_parties`: una entrada por partido mencionado. Si una frase nombra a 3 partidos, crea 3 entradas.
- Si un valor A, B, C o E no se lee, pon `null` y anótalo en `notes`.

## Salida 2: `data/extracted/{PARTY_ID}/codificacion_a.json`
Codifica el grado de acuerdo DEL PARTIDO con CADA pregunta de `catalogo_banco.json`, tal como está escrita. Escala: 2, 1, 0, -1, -2 o null.
```json
{
  "party_id": "{PARTY_ID}",
  "coder": "a-extraccion",
  "codings": [
    {"id": "Q03", "value": 2, "confidence": "alta|media|baja", "salience": "alta|media|baja", "cross": false,
     "evidence": [{"unit_id": "PNV-02-01", "page": 12, "quote": "cita literal de 25 palabras como máximo", "source_report": "{PARTY_ID}"}],
     "viability": {"A": "", "B": "", "C": "", "E": ""}, "rationale": "una o dos frases"}
  ],
  "salience_by_ambito": [{"ambito": 1, "salience": "alta|media|baja", "reason": "nº de unidades, mención en las conclusiones ejecutivas o prioridad declarada"}]
}
```
Reglas de codificación (docs/metodologia.md, 5.1 y 5.2):
- +2: el partido propone esto de forma explícita, con una unidad o medida identificable. +1: una versión parcial, gradual o condicionada. 0: el informe documenta una posición intermedia. −1: una versión parcial de lo contrario. −2: lo contrario de forma explícita. null: el informe no documenta posición.
- El silencio no es posición. Si el informe dice que algo no se atribuye al partido, el valor es `null` salvo que haya otra evidencia. Cita esa frase en `rationale`.
- Nunca infieras por ideología, por familia política o por lo que proponen partidos afines.
- Un partido territorial puede proponer una medida solo para su comunidad. Codifica la pregunta tal como está escrita, que habla de España o del Estado. Si el partido pide la competencia para su comunidad sin posición sobre la medida estatal, el valor es `null` o, si la evidencia es directa, +1 o −1 con confianza `baja`. Explícalo en `rationale`.
- `confidence`: alta = unidad o frase explícita; media = se deduce directamente de un párrafo de la ficha; baja = indicio indirecto. Con un indicio muy débil, `null`.
- No uses lo que el informe dice de OTROS partidos para codificar a este. Deja `cross` en `false`.
- Cada valor no nulo lleva al menos una evidencia con cita literal de 25 palabras como máximo, su página y su unidad. Verifica con grep que la cita aparece en el texto de esa página. Si la maquetación parte la frase, cita un tramo que aparezca seguido en una sola columna.
- `viability`: copia A, B, C y E de la unidad principal citada. Objeto vacío si no hay unidad.
- `salience`: alta si el tema es prioridad declarada o aparece en las conclusiones ejecutivas; media si tiene unidad propia; baja si sale de pasada.
- Codifica todas las preguntas del catálogo. Ninguna puede faltar. `salience_by_ambito` lleva los 19 ámbitos.

No escribas otros ficheros.

## Respuesta final
No mannered prose. Answer first, short sentences, numbers and names, end on the result.
Máximo 200 palabras: fichas y unidades extraídas frente a las declaradas, circunscripciones encontradas, valores no nulos de la codificación, las 3 preguntas más dudosas y por qué, y las 3 incidencias de extracción más importantes.
