# Encargo: extracción y codificación de un informe de partido

## Contexto
Se va a construir una app de afinidad electoral (elecciones generales de España, 29/11/2026) con 6 partidos: PP, PSOE, Vox, SALF, Podemos, Frente Amplio. Hay un informe neutral por partido. Los 6 siguen el mismo marco:
- 19 ámbitos de política pública (fichas sectoriales; algunos ámbitos se parten en varias fichas, p. ej. "05. Vivienda | 1/3").
- Cada ficha tiene una tabla de unidades: ID (p. ej. `V01`, `EC01`, `F02`), título, "Instrumento y condición decisiva", y valoraciones `A / B / C; E` con valores `Alta | Media | Baja | NE`.
- A/B/C son escenarios de aprobación propios de cada partido (definidos en la sección de método). E es la entrega material tras aprobación y financiación.
- Párrafos por ficha: viabilidad/evidencia, efectos/distribución, respaldo/acuerdos, verificación/seguimiento (los encabezados varían ligeramente).
- Secciones transversales: coherencia fiscal, evidencia de eficacia, restricciones jurídicas, respaldo interno, liderazgo y equipo, acuerdos entre partidos, ejecución, seguimiento, cobertura, fuentes.

Tu tarea es UN informe: `{PARTY_NAME}` (id `{PARTY_ID}`).

## Entradas
- Texto con maquetación: `data/extracted/txt/{TXT_FILE}` (los saltos de página son el carácter form feed `\f`; página = número de `\f` anteriores + 1; el pie también lleva el número de página).
- PDF original: `data/reports/{PDF_FILE}` (úsalo con `pdftotext -f N -l N -layout` si una tabla sale rota).
- Catálogo de afirmaciones: `data/extracted/catalogo_afirmaciones_v0.json`.

Lee el informe ENTERO, de principio a fin, en trozos. No resumas de memoria. No uses fuentes externas ni otros informes.

## Salida 1: `data/extracted/{PARTY_ID}/informe.json`
JSON válido (compruébalo con `python3 -I -c "import json;json.load(open(PATH))"`). Esquema:
```json
{
  "party_id": "{PARTY_ID}",
  "party_name": "",
  "report_meta": {"title": "", "version": "", "cutoff_date": "YYYY-MM-DD", "program_date": "YYYY-MM-DD", "program_title": "", "n_units_declared": 0, "n_program_entries": "", "pages": 0, "coalition_members": [], "notes": ""},
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
            {"id": "", "title": "", "instrument": "texto literal de la celda", "A": "Alta|Media|Baja|NE", "B": "", "C": "", "E": "", "figures": ["cifras y plazos literales"], "page": 0}
          ],
          "paragraphs": [{"heading": "", "text": "texto literal", "refs": []}]
        }
      ]
    }
  ],
  "cross_sections": [{"section": "04 | COHERENCIA FISCAL", "page": 0, "heading": "", "text": "texto literal; las tablas como filas 'col1 | col2 | col3'"}],
  "internal_support": [{"area": "", "evidence": "", "inference_and_limit": "", "refs": []}],
  "team": [{"name": "", "role": "", "verified_trajectory": "", "what_it_allows_to_assess": "", "refs": []}],
  "integrity_and_governance": [{"topic": "", "text": "", "refs": []}],
  "agreements": [{"counterpart": "", "common_ground": "", "frictions": "", "documented_agreement": true, "refs": []}],
  "negotiation_packages": [{"package": "", "condition": "", "effect": ""}],
  "fiscal": {"summary": "", "key_figures": [{"figure": "", "reading": "", "missing": ""}]},
  "ambiguities_and_open_questions": [""],
  "explicit_non_positions": [{"text": "frase literal del tipo 'No se atribuye al partido...'", "ambito": 0, "page": 0}],
  "mentions_of_other_parties": [{"party": "", "text": "", "page": 0}],
  "references": [{"n": 1, "source": "", "date": "", "title": ""}]
}
```
Reglas:
- Todas las unidades de todas las fichas, sin excepción. Cuenta las unidades y compáralas con `n_units_declared`. Si no cuadra, explícalo en `report_meta.notes`.
- Texto literal en `instrument` y `paragraphs`. Une las líneas partidas por la maquetación. No parafrasees.
- Si un valor A/B/C/E no se lee, pon `null` y anótalo en `notes`.

## Salida 2: `data/extracted/{PARTY_ID}/codificacion.json`
Codifica el grado de acuerdo DEL PARTIDO con CADA afirmación del catálogo, tal como está escrita. Usa la escala del catálogo (2, 1, 0, -1, -2, null).
```json
{
  "party_id": "{PARTY_ID}",
  "codings": [
    {"id": "ECO1", "value": 2, "confidence": "alta|media|baja", "salience": "alta|media|baja", "evidence": [{"unit_id": "E01", "page": 5, "quote": "cita literal de 25 palabras como máximo"}], "viability": {"A": "", "B": "", "C": "", "E": ""}, "rationale": "una o dos frases"}
  ],
  "extra_statements": [
    {"id": "X_{PARTY_ID}_1", "ambito": 0, "texto": "afirmación neutral, de 12 a 25 palabras, que capta una posición distintiva del partido no cubierta por el catálogo", "value": 2, "confidence": "", "salience": "", "evidence": [], "viability": {}, "rationale": ""}
  ],
  "salience_by_ambito": [{"ambito": 1, "salience": "alta|media|baja", "reason": "nº de unidades, mención en conclusiones ejecutivas o prioridad declarada"}]
}
```
Reglas de codificación:
- `confidence`: alta = unidad o frase explícita del informe; media = se deduce directamente de un párrafo de la ficha; baja = indicio indirecto. Si solo hay un indicio muy débil, usa `null`.
- El silencio no es posición. Si el informe dice que algo NO se atribuye al partido (p. ej. "no se atribuye una derogación íntegra"), el valor es `null` salvo que haya otra evidencia, y cita esa frase en `rationale`.
- No uses lo que el informe dice de OTROS partidos para codificar a este. Esas menciones van a `mentions_of_other_parties`.
- `salience`: alta si el tema es prioridad declarada o aparece en conclusiones ejecutivas; media si hay unidad propia; baja si solo aparece de pasada.
- `viability`: copia A/B/C/E de la unidad principal citada; vacío si no hay unidad.
- `extra_statements`: entre 5 y 12. Redáctalas de forma que un votante pueda estar de acuerdo o en desacuerdo sin saber qué partido las propone. Sin nombres de partidos ni de personas.
- Codifica las 92 afirmaciones del catálogo. Ninguna puede faltar.

## Salida 3: `data/extracted/{PARTY_ID}/posiciones.md`
Resumen de 1.500 a 2.500 palabras, en español:
1. Escenarios A/B/C del partido (una línea cada uno).
2. Por cada uno de los 19 ámbitos: 2 a 6 viñetas "posición concreta (ID unidad, A/B/C/E)". Incluye cifras.
3. "Lo que el informe NO atribuye al partido": lista literal.
4. Prioridades y respaldo interno: 5 a 10 viñetas.
5. Acuerdos y fricciones con cada partido mencionado: una línea por partido.
6. Rasgos distintivos que un quiz debería captar: 5 a 10 viñetas.

## Respuesta final (al orquestador)
Máximo 200 palabras: nº de fichas y unidades extraídas frente a las declaradas, nº de afirmaciones con valor no nulo, las 3 incidencias de extracción más importantes y rutas de los 3 ficheros.
