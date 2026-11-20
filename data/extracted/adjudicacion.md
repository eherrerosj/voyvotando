# Registro de adjudicación de posiciones (propuesta para revisión)

Fecha: 18/11/2026. Fuentes: `banco_final.json`, las dos codificaciones por partido, `informe.json` y el texto de los 6 PDF. Reglas: PLAN.md 5.1, 5.2 y notas de `catalogo_afirmaciones_v1.json`.

## Resumen

- 240 celdas: 55 adjudicadas, 3 cambios horizontales y 182 sin cambio.
- Las decisiones cambian el valor de 12 celdas y solo la confianza de 4. Las demás adjudicadas confirman el valor provisional.
- Celdas con valor: 170 (alta 91, media 62, baja 17). Antes: 171 (92, 60, 19).
- Cobertura de 40: Podemos 34, FA 29, PSOE 25, PP 27, Vox 27, SALF 28. Antes: Podemos 34, FA 31, PSOE 26, PP 24, Vox 27, SALF 29.
- Todas las citas de las celdas con valor tienen 25 palabras o menos y aparecen literales en la página indicada. Comprobado contra el texto de `data/extracted/txt` y contra una extracción `pdftotext` sin maquetación de cada PDF, porque las tablas a dos columnas cortan frases en el texto con maquetación.
- 10 celdas llevan `revisar_humano: true`.
- `posiciones_adjudicadas.json` conserva el signo de la redacción actual. Las posiciones invertidas de Q07, Q24 y Q29 están en `polaridad.json`.

## Consecuencias para el banco

- Q10 (capitalización) queda con 2 partidos con posición: Podemos -1 baja y SALF +2. Incumple el mínimo de 3 de PLAN.md 4.1.
- Q26 (ley de violencia intrafamiliar) queda con 2 partidos con posición: PP -1 baja y Vox +2 media. Incumple el mínimo de 3. Está en el modo rápido.
- Q02 pierde la única celda de la derecha (SALF) y pasa de I a T según `construir_banco.py`. Q26 pasa de D a T por la misma razón.
- Polaridad tras la adjudicación: 13 I, 19 D y 8 T. Tras reformular Q07, Q24 y Q29: 16 I, 16 D y 8 T.

## Decisiones

Una línea por celda marcada o cambiada. Formato del valor: número y confianza. Las páginas son del informe del propio partido salvo que se indique otro.

| ID | Partido | Antes | Después | Decisión | Motivo | Página |
|---|---|---|---|---|---|---|
| Q03 | PSOE | 0 media | 0 media | adjudicada (dif1) | Dif. 1 (v0 +1, v1 0). Se confirma 0: la rebaja solo alcanza a hogares con hijos y al SMI. FA recibe +1 porque rebaja a todos los salarios hasta 27.000 euros. | p. 6 |
| Q02 | PSOE | +1 media | +1 media | adjudicada (dif1) | Dif. 1 (v0 +2, v1 +1). Se confirma +1: participaciones estatales sin sector ni empresa nueva. | p. 5 |
| Q02 | SALF | -1 media | nulo | adjudicada (un_nulo) **[revisar]** | Un nulo (v0 -1 media, v1 nulo). Pasa a nulo: suprimir entes sin función no es posición sobre crear empresas públicas en sectores básicos. Además, las citas de v0 no aparecen literales en la página indicada. | p. 48 |
| Q01 | Podemos | nulo | 0 baja | adjudicada (un_nulo) **[revisar]** | Un nulo (v0 nulo, v1 -1 baja). Se fija 0 baja por coherencia con FA (0 baja), que tiene el mismo tipo de evidencia: franquicia de IVA para pymes junto a nuevas obligaciones. | p. 11, p. 41 |
| Q08 | Podemos | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1, redacción nueva). v0 sobre la redacción anterior también daba +2. Se confirma. | p. 12 |
| Q08 | FA | +1 alta | +1 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1: las 32 horas son meta gradual sin calendario. | p. 9 |
| Q08 | PSOE | 0 alta | 0 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma 0 según la nota del catálogo. | p. 7 |
| Q08 | PP | -2 media | -2 media | adjudicada (codificacion_unica) | Codificación única (v1, evidencia cruzada). Se confirma -2 media: es el ejemplo de PLAN.md 5.2 regla 3. Cita de FA p. 51 recortada a texto literal contiguo. | PSOE p. 7, FA p. 51 |
| Q08 | Vox | -2 media | -2 media | adjudicada (codificacion_unica) | Codificación única (v1, evidencia cruzada). Se confirma -2 media (PLAN.md 5.2 regla 3). | PSOE p. 7, FA p. 51 |
| Q09 | PSOE | +1 media | +1 media | adjudicada (dif1) | Dif. 1 (v0 +2, v1 +1). Se toma +1: la unidad dice 'cambiar', sin dirección explícita. FA (+2 media) dice 'reforzar reparación'; Podemos (+2 alta) fija 45 días. | p. 7 |
| Q09 | SALF | 0 media | -1 media | adjudicada (dif1) **[revisar]** | Dif. 1 (v0 0, v1 -1). Se toma -1: la nota del catálogo nombra el contrato único con menos días como negativo. | p. 13 |
| Q10 | Podemos | -1 baja | -1 baja | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1 baja: la medida trata planes voluntarios, no cuentas obligatorias; -2 exigiría rechazo explícito. | p. 10 |
| Q10 | FA | -1 media | nulo | adjudicada (un_nulo) **[revisar]** | Un nulo (v0 -1 media, v1 nulo). Pasa a nulo: el silencio sobre capitalización no es posición. Con este cambio Q10 queda con 2 partidos con posición (Podemos y SALF). | p. 11 |
| Q11 | Podemos | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1). v0 con la redacción anterior también daba +2. Se confirma. | p. 14 |
| Q11 | FA | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +2. | p. 11 |
| Q11 | PSOE | +1 baja | +1 baja | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1 baja: 'evaluar' es un compromiso de estudio. | p. 8 |
| Q11 | PP | -1 media | -1 media | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma -1. 'No se presupone acuerdo sobre edad de retiro' (p. 8) habla de acuerdos con otros partidos, no es una no atribución. | p. 8 |
| Q11 | SALF | +1 alta | 0 media | adjudicada (codificacion_unica) **[revisar]** | Codificación única (v1 +1). Se baja a 0: el PP recibe -1 por el mismo incentivo (compatibilizar trabajo y pensión); SALF lo propone junto a la vía de carreras largas. | p. 16 |
| Q14 | Podemos | -1 baja | nulo | cambio_horizontal **[revisar]** | Cambio horizontal (-1 baja a nulo). FA es nulo con el mismo tipo de evidencia (V07, protección ante desahucios). 'Desalojo extrajudicial' se refiere a coerción privada, no a desalojo policial. | p. 16 |
| Q18 | Vox | -1 alta | -1 alta | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1: colaboración condicionada a evaluación, no garantía general de derivación. | p. 11 |
| Q17 | Podemos | -2 baja | -1 baja | cambio_horizontal | Cambio horizontal (-2 baja a -1 baja). -2 exige proponer lo contrario de forma explícita y la evidencia es indirecta; el valor -2 con confianza baja es incoherente con la escala. | p. 27, p. 17 |
| Q17 | FA | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo por coherencia con el PSOE, nulo con el mismo tipo de evidencia (PS03, medidas contra racismo y discriminación). | p. 20 |
| Q17 | PP | nulo | +1 baja | adjudicada (un_nulo) **[revisar]** | Un nulo (v0 nulo, v1 +1 baja). Se mantiene +1 baja con evidencia cruzada; la atribución del criterio 'arraigo territorial' al PP se deduce de la frase sobre la diferencia, no está literal. | Vox p. 33, Vox p. 14, p. 9 |
| Q25 | Podemos | +1 media | +1 media | adjudicada (dif1) | Dif. 1 (v0 +2, v1 +1). Se toma +1 media: falta el procedimiento de autodeclaración. Mismo valor que FA, con el mismo tipo de evidencia. | p. 25 |
| Q25 | FA | +1 baja | +1 media | adjudicada (dif1) | Dif. 1 (v0 +2, v1 +1 baja). Se toma +1 y se sube la confianza a media para igualarla con Podemos: ambas unidades citan reconocimiento registral sin procedimiento. | p. 19 |
| Q25 | PSOE | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 +1 baja, v1 nulo). Pasa a nulo: proteger derechos LGTBI no documenta posición sobre la autodeterminación registral. | p. 15 |
| Q24 | FA | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo por coherencia con el PSOE, nulo con la misma evidencia (PS01 automatiza el IMV). Podemos sí es -2 porque propone renta 'incondicionada'. | p. 19 |
| Q26 | Podemos | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -2 baja, v1 nulo). Pasa a nulo: asistir a víctimas es compatible con ambas leyes (Vox propone sustituir la ley y ampliar protección a víctimas). | p. 25 |
| Q26 | FA | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo: sin referencia a la ley ni a su sustitución. | p. 19 |
| Q26 | PSOE | -2 media | nulo | adjudicada (un_nulo) **[revisar]** | Un nulo (v0 -2 media, v1 nulo). Pasa a nulo: vincular 'violencia vicaria' con la ley de 2004 exige conocimiento externo al informe. Consecuencia: Q26 queda con 2 partidos con posición (PP -1 baja, Vox +2 media). | p. 16 |
| Q27 | PP | -1 alta | -1 alta | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1: restringir no es prohibir, y el arraigo se conserva. | p. 14 |
| Q37 | FA | +1 media | +1 media | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1 media. | p. 23 |
| Q37 | PP | 0 media | 0 media | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma 0 media. | p. 17 |
| Q37 | SALF | -2 alta | -2 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma -2. | p. 39 |
| Q33 | Podemos | -1 baja | -1 media | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1 baja). Se toma -1 y confianza media: la unidad nombra el turno judicial de forma explícita; -2 exigiría rechazo expreso de la elección por jueces. | p. 31 |
| Q33 | FA | -1 media | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 media, v1 nulo). Pasa a nulo: el propio informe impide atribuir a FA la elección parlamentaria de los vocales judiciales. | p. 22 |
| Q33 | SALF | +1 media | +1 media | adjudicada (dif1) | Dif. 1 (v0 +2, v1 +1). Se toma +1: dos de los tres mecanismos no son elección por jueces. | p. 36 |
| Q35 | Podemos | -1 alta | -1 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma -1. | p. 33 |
| Q35 | PSOE | -1 alta | -1 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma -1. | p. 20 |
| Q35 | SALF | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1, coincide con la extra propuesta en v0). Se confirma +2. | p. 38 |
| Q36 | Podemos | -1 baja | -1 media | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1 baja). Se toma -1 y confianza media, igual que FA, que tiene el mismo tipo de evidencia (unidad federal explícita). | p. 33 |
| Q36 | FA | -1 media | -1 media | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1 media. | p. 23, p. 22 |
| Q36 | PSOE | 0 baja | 0 baja | adjudicada (dif1) | Dif. 1 (v0 -1, v1 0). Se toma 0 baja. | p. 20 |
| Q36 | PP | nulo | +1 baja | adjudicada (adjudicar) **[revisar]** | Dif. 2 (v0 -1 baja, v1 +1 media). Se toma +1 baja: la nota codifica coordinar sin devolver como +1; defender el Estado autonómico vigente no es 'más autogobierno', que sería lo negativo. | p. 17, p. 22 |
| Q40 | Podemos | -1 alta | -1 alta | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1 por la nota del catálogo. | p. 36 |
| Q40 | PSOE | -1 alta | -1 alta | adjudicada (dif1) | Dif. 1 (v0 -2, v1 -1). Se toma -1 por la nota del catálogo. | p. 21 |
| Q41 | FA | -2 baja | -2 media | cambio_horizontal | Cambio horizontal (confianza baja a media). El PSOE tiene -2 media con la misma evidencia (81% renovable en 2030); FA debe tener la misma confianza. | p. 24, p. 25 |
| Q41 | PP | nulo | +1 media | adjudicada (adjudicar) **[revisar]** | Dif. 2 (v0 -1 media, v1 +1 media). v0 contradice la nota del catálogo, que no admite valores negativos para ajustar el ritmo. Se elige +1 frente a 0. | p. 18 |
| Q42 | Podemos | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo: no hay posición sobre estos impuestos. | p. 34, p. 9 |
| Q42 | FA | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo: fiscalidad ambiental genérica. | p. 8 |
| Q42 | PSOE | nulo | nulo | adjudicada (un_nulo) | Un nulo (v0 -1 baja, v1 nulo). Pasa a nulo. | p. 6 |
| Q45 | Podemos | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +2. | p. 39 |
| Q45 | FA | +1 alta | +1 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1. | p. 27 |
| Q45 | PSOE | +1 baja | +1 baja | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1 baja. | p. 24 |
| Q47 | Podemos | +1 media | +1 media | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +1 media. La cita de v1 sobre 'bases fiscales, también transfronterizas' es texto del analista y se sustituye por la unidad. | p. 8 |
| Q47 | FA | +2 alta | +2 alta | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +2. | p. 34 |
| Q47 | PSOE | +2 media | +2 media | adjudicada (codificacion_unica) | Codificación única (v1). Se confirma +2 media. | p. 6 |
| Q49 | PSOE | 0 media | 0 media | adjudicada (un_nulo) | Un nulo (v0 nulo, v1 0 media). Se mantiene 0 media; el PP recibe +1 porque su ficha añade más presupuesto. | p. 27 |

## Las 10 celdas para revisión humana

1. Q26 PSOE: -2 media a nulo. Nulo por silencio sobre la ley; deja Q26 con 2 partidos. Un revisor puede leer 'violencia vicaria' como defensa del marco de género.
2. Q17 PP: nulo a +1 baja. +1 baja por evidencia cruzada; el criterio 'arraigo territorial' se deduce, no consta literal como posición del PP.
3. Q11 SALF: +1 alta a 0 media. 0 contra el +1 de ambos codificadores, para igualar el trato a la jubilación activa con el PP (-1).
4. Q36 PP: nulo a +1 baja. Diferencia de 2 entre codificadores. +1 baja apoyado solo en interoperabilidad de servicios.
5. Q41 PP: nulo a +1 media. Diferencia de 2. La nota admite +1 o 0 para 'ajustar el ritmo'; se elige +1.
6. Q10 FA: -1 media a nulo. Nulo; deja Q10 con 2 partidos.
7. Q02 SALF: -1 media a nulo. Nulo; suprimir entes sin función podría leerse como -1 baja. Cambia la polaridad de Q02 a T.
8. Q09 SALF: 0 media a -1 media. -1 por la nota del contrato único, aunque la cuenta del 1,53% compensa en parte.
9. Q14 Podemos: -1 baja a nulo. Cambio horizontal a nulo; 'desalojo extrajudicial' admite otra lectura.
10. Q01 Podemos: nulo a 0 baja. 0 baja por coherencia con FA; v1 daba -1 baja y v0 nulo.

## Polaridad

| ID | Texto antes | Texto nuevo | Palabras | Posiciones nuevas (Podemos, FA, PSOE, PP, Vox, SALF) |
|---|---|---|---|---|
| Q07 | El impuesto de sociedades debería bajar para atraer inversión. | El impuesto de sociedades no debería bajar, ni siquiera para atraer inversión. | 12 | +2, +2, ·, -1, -2, -2 |
| Q29 | Debería ser más difícil obtener la nacionalidad española. | Los requisitos para obtener la nacionalidad española no deberían endurecerse. | 10 | +2, ·, ·, -2, -2, -2 |
| Q24 | Las ayudas como el Ingreso Mínimo Vital deberían retirarse a quien rechace ofertas de empleo adecuadas. | Las ayudas como el Ingreso Mínimo Vital deberían mantenerse aunque quien las recibe rechace ofertas de empleo adecuadas. | 18 | +2, ·, ·, -2, ·, -2 |

Q22, candidata del plan, se descarta. Tiene polaridad T porque ningún partido de izquierda tiene posición, así que invertirla no cambia el reparto I/D. Además une dos ideas (sustituir la LOMLOE y más exámenes), y su negación no es exacta. La sustituye Q24.

## Agricultura (ámbito 15)

| Candidata | Podemos | FA | PSOE | PP | Vox | SALF | Cobertura | Pares separados | Separación ponderada |
|---|---|---|---|---|---|---|---|---|---|
| AGR_a: Hay que construir más embalses y trasvases de agua entre cuencas. | · | · | · | +1 baja | +2 alta | · | 2 | PP-Vox | 0.25 |
| AGR_b: Las ayudas agrarias deberían priorizar a las explotaciones familiares y pequeñas frente a las grandes. | +2 media | · | +1 media | · | · | · | 2 | Podemos-PSOE | 0.375 |
| AGR_c: España debería oponerse al acuerdo comercial entre la Unión Europea y Mercosur. | · | · | · | -1 baja | +1 media | +2 alta | 3 | PP-Vox, PP-SALF, Vox-SALF | 1.625 |

Recomendación: AGR_c, "España debería oponerse al acuerdo comercial entre la Unión Europea y Mercosur". Es la única con 3 partidos con posición, el mínimo de PLAN.md 4.1. Separa los 3 pares PP-Vox, PP-SALF y Vox-SALF, que PLAN.md 4.1 señala como difíciles de separar. Separación ponderada 1,625 frente a 0,25 (embalses) y 0,375 (ayudas). Ningún partido de izquierda tiene posición documentada, así que la pregunta no separa ese bloque y construir_banco.py la clasificaría como T. La celda del PP descansa en evidencia cruzada de confianza baja. El acuerdo se aplica de forma provisional desde el 1/05/2026 (informe de Vox, p. 20): la ayuda de la pregunta debe explicarlo.

