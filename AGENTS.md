# Guía para agentes y contribuyentes

Voy Votando compara las respuestas de cada persona con las posiciones documentadas de 6 partidos. Su valor depende de 3 cosas: neutralidad, privacidad y que cada dato se pueda comprobar. Cualquier cambio, hecho por una persona o por un agente de IA, sigue estas reglas.

## Neutralidad

- Los 6 partidos pasan por el mismo proceso, la misma escala y las mismas reglas.
- El silencio no es posición. Si un informe no documenta una postura, la celda queda nula.
- Nunca se deduce una posición por ideología ni por lo que proponen partidos afines.
- Cada posición lleva una cita literal de 25 palabras como máximo, con su página.
- Las afirmaciones tienen una sola idea y no nombran partidos ni personas.
- Los argumentos a favor y en contra se escriben como efectos, con la misma forma y extensión.
- Sin colores ni logotipos de partido. El orden por defecto es alfabético.
- Términos prohibidos en nuestro texto: ultra, radical, populista, privilegios, chiringuito, "ley mordaza".

## Privacidad

- Ninguna respuesta sale del navegador. No hay servidor que reciba datos.
- Sin analítica, cookies, anuncios ni scripts de terceros. La cabecera CSP limita las conexiones a `'self'`.
- La web no publica nunca datos agregados de uso.

## Datos

- La cadena de datos está descrita en `data/README.md` y `docs/adaptar-a-otras-elecciones.md`.
- Tras cambiar algo en `data/extracted`, ejecuta `npm run data`. El script falla si una cita no aparece en su página.
- Cada cambio de datos se anota en `docs/historial-de-datos.md`.

## Antes de abrir un pull request

```sh
npm test               # motor de puntuación y enlace de resultado
npm run check          # tipos
npm run build          # web estática
npm run qa:responsive  # 6 tamaños de móvil y tableta, con axe (requiere npm run preview)
```

## Estilo de los textos

- Castellano llano, frases cortas, voz activa y cifras concretas.
- Sin guiones largos ni adjetivos valorativos.
- La web mide coincidencias. Nunca recomienda un voto.
