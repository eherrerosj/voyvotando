# Encargo: segunda codificación a ciegas de {PARTY_NAME}

## Objetivo
Codificar el grado de acuerdo DEL PARTIDO {PARTY_NAME} (id `{PARTY_ID}`) con 53 afirmaciones de un quiz electoral neutral (elecciones generales del 29/11/2026). Es una codificación independiente: otro codificador ya hizo una versión y se medirá el acuerdo entre ambas.

## Prohibido abrir
- `data/extracted/{PARTY_ID}/codificacion.json`
- `data/extracted/{PARTY_ID}/posiciones.md`
- Cualquier carpeta de otro partido.

## Entradas permitidas
- Afirmaciones y escala: `data/extracted/catalogo_afirmaciones_v1.json`. Lee las `nota` de cada afirmación: fijan cómo codificar casos límite.
- Extracción estructurada del informe: `data/extracted/{PARTY_ID}/informe.json` (unidades con valoraciones A/B/C/E, párrafos, secciones transversales, `explicit_non_positions`).
- Texto completo del informe: `data/extracted/txt/{TXT_FILE}` (página = número de form feeds anteriores + 1). Búscalo con grep para cada afirmación; no te fíes solo del JSON.
- Menciones de {PARTY_NAME} en los informes de OTROS partidos: clave `"{PARTY_ID}"` de `data/extracted/menciones_cruzadas.json`.

## Reglas
1. Codifica las 53 afirmaciones tal como están escritas. Escala: 2, 1, 0, -1, -2 o null.
2. El silencio no es posición: null. Si el informe dice que algo no se atribuye al partido, null, y cita esa frase en `rationale`.
3. Nunca infieras por ideología, por familia política o por lo que proponen partidos afines.
4. Evidencia cruzada: puedes usar una mención de otro informe solo si describe un HECHO documentado sobre {PARTY_NAME} (voto en el Congreso, acuerdo firmado, declaración fechada). Las hipótesis del analista ("compatibilidad potencial", "podría coincidir") no valen. Con evidencia cruzada la confianza máxima es `media` y debes marcar `"cross": true`.
5. `confidence`: alta = unidad o frase explícita; media = se deduce directamente de un párrafo o de un hecho documentado; baja = indicio indirecto.
6. Cada valor no nulo lleva al menos una evidencia con cita literal de 25 palabras como máximo y su página. Verifica con grep que la cita aparece en el texto (une saltos de línea).
7. `viability`: copia A/B/C/E de la unidad principal citada; objeto vacío si no hay unidad.
8. `salience`: alta si es prioridad declarada o sale en las conclusiones ejecutivas; media si tiene unidad propia; baja si sale de pasada.

## Salida
`data/extracted/{PARTY_ID}/codificacion_v1.json`, JSON válido (valídalo con `python3 -I -c "import json;json.load(open(RUTA))"`):
```json
{
  "party_id": "{PARTY_ID}",
  "coder": "v1-ciego",
  "codings": [
    {"id": "Q01", "value": 2, "confidence": "alta", "salience": "media", "cross": false,
     "evidence": [{"unit_id": "E01", "page": 5, "quote": "...", "source_report": "{PARTY_ID}"}],
     "viability": {"A": "Alta", "B": "Alta", "C": "Media", "E": "Media"},
     "rationale": "una o dos frases"}
  ]
}
```
Las 53 afirmaciones deben estar. Ninguna falta.

## Respuesta final
Máximo 120 palabras: nº de valores no nulos, nº con evidencia cruzada, las 3 afirmaciones más dudosas y por qué.
