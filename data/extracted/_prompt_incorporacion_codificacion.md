# Encargo: segunda codificación a ciegas de {PARTY_NAME}

## Objetivo
Codificar el grado de acuerdo DEL PARTIDO {PARTY_NAME} (id `{PARTY_ID}`) con las preguntas publicadas de Voy Votando, un test de afinidad electoral neutral para las elecciones generales del 29/11/2026. Es una codificación independiente. Otro codificador ya hizo una versión y se medirá el acuerdo entre las 2.

## Prohibido abrir
- `data/extracted/{PARTY_ID}/codificacion_a.json`
- `data/extracted/posiciones_incorporadas.json` y `data/extracted/adjudicacion_incorporaciones.json`
- Las carpetas de otros partidos, `src/content/` y cualquier fichero con posiciones de partidos.

## Entradas permitidas
- Preguntas y escala: `data/extracted/catalogo_banco.json`. Lee la `nota` de cada pregunta: fija cómo codificar los casos límite.
- Extracción estructurada del informe: `data/extracted/{PARTY_ID}/informe.json`, con las unidades y sus valoraciones A, B, C y E, los párrafos, las secciones transversales y `explicit_non_positions`.
- Texto completo del informe: `data/extracted/txt/{TXT_FILE}`. Página = número de form feeds anteriores + 1. Búscalo con grep para cada pregunta; no te fíes solo del JSON.
- Menciones de {PARTY_NAME} en los informes de OTROS partidos: clave `"{PARTY_ID}"` de `data/extracted/menciones_cruzadas.json`.

## Reglas
1. Codifica todas las preguntas tal como están escritas. Escala: 2, 1, 0, -1, -2 o null. +2: lo propone de forma explícita, con una unidad o medida identificable. +1: versión parcial, gradual o condicionada. 0: el informe documenta una posición intermedia. −1: versión parcial de lo contrario, o votó contra una versión más suave. −2: lo contrario de forma explícita.
2. El silencio no es posición: null. Si el informe dice que algo no se atribuye al partido, null, y cita esa frase en `rationale`.
3. Nunca infieras por ideología, por familia política o por lo que proponen partidos afines.
4. Un partido territorial puede proponer una medida solo para su comunidad. Codifica la pregunta tal como está escrita, que habla de España o del Estado. Si el partido pide la competencia para su comunidad sin posición sobre la medida estatal, el valor es null o, si la evidencia es directa, +1 o −1 con confianza `baja`. Explícalo en `rationale`.
5. Evidencia cruzada: puedes usar una mención de otro informe solo si describe un HECHO documentado sobre {PARTY_NAME}: voto en el Congreso, acuerdo firmado o declaración fechada. Las hipótesis del analista ("compatibilidad potencial", "podría coincidir") no valen. Con evidencia cruzada la confianza máxima es `media` y debes marcar `"cross": true`. La cita lleva `source_report` con el id del informe de origen.
6. `confidence`: alta = unidad o frase explícita; media = se deduce directamente de un párrafo o de un hecho documentado; baja = indicio indirecto.
7. Cada valor no nulo lleva al menos una evidencia con cita literal de 25 palabras como máximo y su página. Verifica con grep que la cita aparece en el texto de esa página. Si la maquetación a 2 columnas parte la frase, cita un tramo que aparezca seguido en una sola columna.
8. `viability`: copia A, B, C y E de la unidad principal citada. Objeto vacío si no hay unidad.
9. `salience`: alta si es prioridad declarada o sale en las conclusiones ejecutivas; media si tiene unidad propia; baja si sale de pasada.

## Salida
`data/extracted/{PARTY_ID}/codificacion_b.json`, JSON válido. Valídalo con `python3 -I -c "import json;json.load(open(RUTA))"`:
```json
{
  "party_id": "{PARTY_ID}",
  "coder": "b-ciego",
  "codings": [
    {"id": "Q03", "value": 2, "confidence": "alta", "salience": "media", "cross": false,
     "evidence": [{"unit_id": "E01", "page": 5, "quote": "...", "source_report": "{PARTY_ID}"}],
     "viability": {"A": "Alta", "B": "Alta", "C": "Media", "E": "Media"},
     "rationale": "una o dos frases"}
  ]
}
```
Todas las preguntas del catálogo deben estar. Ninguna falta. No escribas otros ficheros.

## Respuesta final
No mannered prose. Answer first, short sentences, numbers and names, end on the result.
Máximo 120 palabras: nº de valores no nulos, nº con evidencia cruzada, las 3 preguntas más dudosas y por qué.
