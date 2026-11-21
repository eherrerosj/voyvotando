# Metodología

Voy Votando compara tus respuestas con las posiciones documentadas de 8 partidos en las elecciones generales del 29 de noviembre de 2026. Este documento explica de dónde salen esas posiciones, cómo se eligieron las preguntas y cómo se calcula el resultado. Describe la versión 1.1 de los datos. Las cifras que solo valen para la versión 1.0 dicen que se refieren a los 6 partidos originales.

Las secciones 3 a 6 conservan la numeración que citan los comentarios del código. Por ejemplo, `src/lib/scoring.ts` remite a las secciones 6.1 a 6.24.

Documentos relacionados: [arquitectura](arquitectura.md), [adaptar a otras elecciones](adaptar-a-otras-elecciones.md), [incorporar partidos](incorporar-partidos.md), [historial de datos](historial-de-datos.md) y [ficheros de datos](../data/README.md).

## Alcance

- El 29/11/2026 se eligen 350 diputados en 52 circunscripciones y los senadores. La convocatoria es el Real Decreto 806/2026 (BOE del 05/10/2026), citado en los informes.
- La presidencia del Gobierno no se vota de forma directa. El Congreso la decide en la investidura (artículo 99 de la Constitución).
- La pregunta del test es "¿Con qué partido coinciden más tus ideas?".
- Entran 8 partidos con informe propio. 6 son de ámbito estatal: Frente Amplio, Podemos, PP, PSOE, SALF y Vox. 2 son de ámbito autonómico y entraron en la versión 1.1: EH Bildu y PNV.
- EH Bildu solo se presenta en Álava, Bizkaia, Gipuzkoa y Navarra (su informe, p. 5). En Navarra va al Congreso en coalición con ERC.
- PNV solo se presenta en Álava, Bizkaia y Gipuzkoa (su informe, p. 5). En Navarra participa en Geroa Bai, que no está incluida.
- La web compara a EH Bildu y PNV igual que al resto y avisa de las provincias en las que se presentan.
- Junts, ERC, BNG, Coalición Canaria y UPN no tienen informe. Solo aparecen en los informes como posibles socios.
- Frente Amplio se trata como coalición. Puntúa su programa común del 16/11, firmado por Movimiento Sumar, IU, Más Madrid y Comuns. Las posiciones propias de cada integrante no puntúan.
- Podemos comparte candidatura en algunos territorios, por ejemplo con Compromís en la Comunitat Valenciana. Esas listas no se atribuyen al programa de Podemos.

La web no hace 4 cosas:

- No recomienda un voto. Los 8 informes declaran que no contienen una recomendación de voto, y la web aplica la misma regla.
- No estima escaños ni calcula el voto útil por provincia.
- No da una nota global de credibilidad a ningún partido. Las valoraciones de los informes son juicios ordinales y no se promedian.
- No usa encuestas ni datos de otras personas usuarias.

## Fuentes

### Los 8 informes

El autor del proyecto elaboró los 8 informes de evaluación con ayuda de IA. Cada informe parte del programa oficial del partido. También usa las fuentes públicas que cita, como el BOE, la AIReF o el Banco de España. Los PDF están en `data/reports` y la web los publica completos.

| Partido | Programa | Fecha del programa | Corte del informe | Páginas | Unidades | Escenarios A, B y C |
|---|---|---|---|---|---|---|
| EH Bildu | "Garantía y derechos" (versión castellana) | 16/11/2026 | 21/11/2026 | 109 | 152 | Promoción por el gobierno competente. Pacto estatal compatible. Oposición sin pacto estatal estable. |
| Frente Amplio | Programa para el 29N | 16/11/2026 | 17/11/2026 | 52 | 108 | Mayoría propia. Gobierno negociado. Influencia externa. |
| PNV | Programa de las generales de 2026, documento íntegro | 09/11/2026 | 21/11/2026 | 103 | 134 | Gobierno competente promotor. Acuerdo estatal compatible. Oposición estatal. |
| Podemos | "Así de básico: Paz, casa y trabajo" | 17/11/2026 | 18/11/2026 | 67 | 134 | Mayoría propia. Gobierno negociado. Influencia externa. |
| PP | "La Reconstrucción Nacional" | 10/11/2026 | 17/11/2026 | 38 | 76 | Mayoría propia. Apoyo de Vox. Minoría variable. |
| PSOE | Programa de las generales del 29N | 15/11/2026 | 17/11/2026 | 49 | 120 | Mayoría propia. Acuerdo de gobierno. Minoría variable. |
| SALF | "Contrato electoral simplificado" | 10/11/2026 | 18/11/2026 | 76 | 121 | Gobierno con mayoría. Negociación con PP y Vox. Oposición. |
| Vox | Programa electoral nacional del 29N | 12/11/2026 | 17/11/2026 | 44 | 92 | Mayoría propia. Acuerdo PP y Vox. Influencia desde la oposición. |
| **Total** | | | | **538** | **937** | |

Las 134 unidades del PNV agrupan los 225 compromisos numerados de su programa.

### El marco común

Los 8 informes siguen el mismo marco. La web usa cada elemento de esta forma:

| Elemento del informe | Contenido | Uso en la web |
|---|---|---|
| Fichas por ámbito | Unidades con ID (por ejemplo `V01`), título, instrumento y cifras | Posiciones de cada partido y citas |
| Valoraciones A, B y C; E | Alta, Media, Baja o NE para aprobar en cada escenario (A, B, C) y para entregar (E) | Sección "Si gobiernan", solo como etiquetas |
| Párrafos de viabilidad, efectos, respaldo y verificación | Mecanismo, riesgos, beneficiarios e indicadores | Ayuda "¿Qué significa?" de cada pregunta |
| "Lo que no se atribuye" | Frases que niegan una posición al partido | Regla de nulos: el silencio no es posición |
| Respaldo interno, liderazgo y equipo | Quién ratificó qué y perfiles verificables | Ficha de cada partido |
| Acuerdos entre partidos | Terreno común, fricciones y acuerdos documentados | Sección "Pactos" y ficha de partido |
| Referencias numeradas | Fuente, fecha y título | Citas con página |

### Límites de los datos

- Cada partido tiene un solo informe. Un error del informe pasa a la web, y por eso cada posición enlaza su cita y su página.
- Los informes son prudentes y a menudo no atribuyen posición. En las 53 afirmaciones finalistas, 103 de las 318 celdas de los 6 partidos originales quedaron vacías en las dos codificaciones. En las 39 preguntas, EH Bildu tiene 12 celdas vacías en las dos codificaciones y PNV tiene 23.
- La cobertura cambia según el partido. En las 39 preguntas, PNV tiene 14 posiciones documentadas y Podemos tiene 34.
- Los anuncios posteriores al corte de cada informe (17/11, 18/11 o 21/11) no están. Tampoco están las propuestas que el programa no recoge.

## 3. Taxonomía

### 3.1 Los 19 ámbitos canónicos

Los 8 informes usan los mismos 19 ámbitos, con títulos casi iguales. La web usa un nombre canónico para cada uno. El título exacto de cada informe está en el campo `title_in_report` de su `informe.json`.

| Nº | Ámbito canónico | Nº | Ámbito canónico |
|---|---|---|---|
| 1 | Economía, productividad y empresas | 11 | Seguridad y justicia |
| 2 | Fiscalidad y cuentas públicas | 12 | Instituciones y calidad democrática |
| 3 | Empleo y relaciones laborales | 13 | Modelo territorial y financiación |
| 4 | Pensiones y envejecimiento | 14 | Energía, clima y medioambiente |
| 5 | Vivienda y urbanismo | 15 | Agricultura, pesca y medio rural |
| 6 | Sanidad | 16 | Infraestructuras y movilidad |
| 7 | Educación, universidad y ciencia | 17 | Tecnología, IA y datos |
| 8 | Familia, infancia y cuidados | 18 | Unión Europea, exterior y defensa |
| 9 | Protección social e igualdad | 19 | Cultura, medios, deporte y consumo |
| 10 | Inmigración y asilo | | |

Algunos informes parten un ámbito en varias fichas. Por ejemplo, un informe puede dividir vivienda en "parque y propiedad" y "alquiler, usos y exigibilidad".

### 3.2 Los 8 bloques de navegación

El test agrupa los ámbitos en 8 bloques. Cada bloque es un capítulo del test y empieza con un interludio.

| Bloque | Nombre | Ámbitos | Modo completo | Modo rápido |
|---|---|---|---|---|
| 1 | Economía, impuestos y trabajo | 1 a 4 | 9 | 5 |
| 2 | Vivienda | 5 | 5 | 4 |
| 3 | Sanidad y educación | 6 y 7 | 4 | 2 |
| 4 | Familia, derechos e igualdad | 8 y 9 | 4 | 1 |
| 5 | Inmigración y seguridad | 10 y 11 | 4 | 3 |
| 6 | Instituciones y territorio | 12 y 13 | 4 | 3 |
| 7 | Clima, energía, movilidad y tecnología | 14 a 17 | 6 | 3 |
| 8 | Europa, defensa y memoria | 18 y 19 | 3 | 3 |
| **Total** | | | **39** | **24** |

Cada bloque tiene al menos 1 pregunta en el modo rápido. Q26 era la única del bloque 4 y se retiró en la versión 1.0-rc2 por falta de cobertura. Desde la versión 1.0, Q17 ocupa su lugar y Q08 sale del modo rápido.

### 3.3 Ejes del mapa

| Eje | Polo negativo | Polo positivo | Preguntas |
|---|---|---|---|
| ECO | Más intervención pública y redistribución | Más mercado y menos impuestos | 19 |
| SOC | Más progresista | Más conservador | 12 |
| TER | Más autogobierno territorial | Más poder del Estado central | 2 |
| EUR | Más integración europea | Más soberanía nacional | 2 |
| Sin eje | | | 4 |

- El mapa usa ECO en horizontal y SOC en vertical.
- TER y EUR tienen 2 preguntas cada uno. Con tan pocas preguntas no hay un eje fiable, así que no se dibujan.
- Q33 (CGPJ), Q35 (Senado), Q40 (nucleares) y Q49 (gasto en defensa) no tienen eje.
- Todas las preguntas puntúan en la afinidad, tengan eje o no.

### 3.4 Etiquetas de cada pregunta

| Campo | Contenido |
|---|---|
| `id` | Identificador estable, de Q01 a Q52, con huecos |
| `order` | Posición en el test, de 1 a 39 |
| `block` y `ambito` | Bloque (3.2) y ámbito (3.1) |
| `axis` y `dir` | Eje del mapa y dirección: +1 si estar de acuerdo acerca al polo positivo, −1 si acerca al negativo, 0 sin eje |
| `polarity` | I, D o T, según la regla de abajo |
| `fast` | Si la pregunta entra en el modo rápido |
| `help` | Ayuda "¿Qué significa?" (4.7) |
| `positions` | Posición de cada partido, con confianza, citas y valoraciones A, B, C y E |

La polaridad compara la media de Podemos, Frente Amplio y PSOE con la media de PP, Vox y SALF. Solo cuentan los partidos con posición.

- **I**: la primera media supera a la segunda en más de 0,5.
- **D**: la segunda media supera a la primera en más de 0,5.
- **T**: el resto de casos, o cuando uno de los dos grupos no tiene ninguna posición.

La polaridad es una etiqueta interna de control. Sirve para equilibrar el banco y la web no la muestra. Se fijó en la versión 1.0 con esos 6 partidos. EH Bildu y PNV no entran en el cálculo.

## 4. Banco de preguntas

### 4.1 Criterios de selección

1. La afirmación debe poder codificarse con los informes. Trata de una medida concreta o de un principio con medidas detrás.
2. Al menos 3 partidos deben tener posición documentada.
3. La afirmación debe separar pares de partidos, sobre todo los más cercanos: Podemos y Frente Amplio, Frente Amplio y PSOE, SALF y Vox, PP y Vox, PP y SALF.
4. Contiene una sola idea, entre 10 y 22 palabras, sin jerga y sin nombres de partidos ni de personas.
5. La polaridad debe quedar equilibrada entre las afirmaciones que favorecen a cada grupo.
6. Debe haber al menos 1 afirmación por ámbito.

El banco se eligió en la versión 1.0 con los 6 partidos originales. La versión 1.1 no lo cambia: EH Bildu y PNV se codificaron con las mismas 39 preguntas, como explica [incorporar partidos](incorporar-partidos.md). `export.py` comprueba el criterio 2 con los 8 partidos.

### 4.2 Proceso seguido: de 92 a 53 y a 39

| Paso | Fichero | Resultado |
|---|---|---|
| 1. Catálogo inicial | `catalogo_afirmaciones_v0.json` | 92 afirmaciones en los 19 ámbitos |
| 2. Codificación v0, un agente de IA por informe | `<partido>/codificacion.json` | 347 de 552 celdas con valor (62,9%) y 70 afirmaciones extra propuestas |
| 3. Finalistas | `catalogo_afirmaciones_v1.json` | 53 afirmaciones: 50 del catálogo y 3 extra (cannabis, Senado y deuda autonómica), con redacción depurada y notas para casos límite |
| 4. Codificación v1 a ciegas, otro agente de IA por informe | `<partido>/codificacion_v1.json` | 194 de 318 celdas con valor |
| 5. Fusión y selección | `seleccion_y_simulacion.py` | 40 preguntas en modo completo y 24 en modo rápido |
| 6. Adjudicación y ajustes | `posiciones_adjudicadas.json` y `banco_ajustes.json` | Salen Q10 y Q26, que se quedan con 2 partidos con posición. Entra Q44 (Mercosur). Quedan 39 y 24. |

La selección es voraz. En cada paso añade la afirmación que más sube este objetivo:

$$
J(Q) = \sum_{(k,j)} \ln\left(1 + \sum_{q \in Q} \frac{|p_{kq} - p_{jq}|}{2}\,\min(c_{kq}, c_{jq})\right) + 0{,}02 \sum_{q \in Q} n_q
$$

- $(k,j)$ recorre los 15 pares de los 6 partidos originales. Si uno de los dos no tiene posición en $q$, la separación de ese par en $q$ es 0.
- $c$ es la confianza de cada posición (6.1) y $n_q$ es el número de partidos con posición en $q$.
- El logaritmo da prioridad a los pares peor separados. Separar un par que ya está separado aporta poco.
- Solo entran candidatas con 3 o más partidos con posición.
- El modo completo fija primero 1 pregunta por ámbito y luego rellena hasta 40.
- El modo rápido repite el proceso dentro de esas 40 preguntas, con 1 pregunta por bloque como mínimo.

### 4.3 Cuántas preguntas

| Preguntas | Recuperación mínima con ruido σ = 0,75 | Recuperación mínima con ruido σ = 1,25 |
|---|---|---|
| 20 | 0,896 | 0,742 |
| 26 | 0,948 | 0,778 |
| 30 | 0,968 | 0,884 |
| 34 | 0,988 | 0,904 |
| 38 | 0,988 | 0,938 |
| 40 | 0,990 | 0,934 |

La tabla usa una métrica preliminar, solo de proximidad, sobre el banco de 53 finalistas. La validación con el algoritmo final está en la sección 6.13.

- Por encima de 38 preguntas, la recuperación deja de subir. El modo completo tiene 39 preguntas, unos 8 minutos a 12 segundos por pregunta.
- Tras la doble codificación, solo 41 afirmaciones tenían 3 o más partidos con posición. Un banco mayor obligaría a usar afirmaciones con 2 partidos.
- Con 20 preguntas, la recuperación de Frente Amplio bajaba de 0,75. El modo rápido tiene 24 preguntas, unos 5 minutos.

### 4.4 Lista final

Cifras de `src/content/questions.json`, el fichero que usa la web:

- Hay 39 preguntas y cubren los 19 ámbitos. Q44 (Mercosur) cubre el ámbito 15, agricultura.
- La polaridad queda en 17 I, 15 D y 7 T. En el modo rápido queda en 10 I, 13 D y 1 T.
- El modo rápido tiene al menos 1 pregunta de cada uno de los 8 bloques.
- Hay 312 celdas, 8 por pregunta. 211 tienen valor: 111 con confianza alta, 80 media y 20 baja.
- 206 de las 211 celdas con valor tienen valoración A, B, C y E.

Posiciones documentadas por partido:

| Partido | Modo completo (de 39) | Modo rápido (de 24) |
|---|---|---|
| EH Bildu | 26 | 17 |
| Frente Amplio | 29 | 19 |
| PNV | 14 | 9 |
| Podemos | 34 | 21 |
| PP | 27 | 21 |
| PSOE | 25 | 16 |
| SALF | 29 | 21 |
| Vox | 27 | 21 |

`python3 -I data/extracted/anexo_desde_contenido.py` imprime la tabla con las 39 afirmaciones y las posiciones de todos los partidos de `data/partidos.json`.

### 4.5 Orden

- Las preguntas van por bloques, del 1 al 8. El test empieza por bolsillo y vivienda, que son temas concretos y de vida diaria. Inmigración queda en el centro, y Europa y memoria al final.
- Dentro de cada bloque, el orden alterna preguntas I y D, y deja las T al final. Así nadie pulsa "De acuerdo" en serie con el mismo efecto. Ese sesgo se llama aquiescencia.
- El orden se fijó antes de reformular Q07, Q24 y Q29 (5.5). Desde entonces la alternancia no es exacta en los bloques 1, 4 y 5.
- El orden es fijo para todas las personas. Así los resultados son comparables y reproducibles.
- La primera pregunta es Q03: "Hay que bajar el IRPF a la mayoría de los contribuyentes." Es la más fácil de entender.

### 4.6 Respuestas posibles

| Botón | Valor | Tecla |
|---|---|---|
| Muy de acuerdo | +2 | 1 |
| De acuerdo | +1 | 2 |
| Ni de acuerdo ni en desacuerdo | 0 | 3 |
| En desacuerdo | −1 | 4 |
| Muy en desacuerdo | −2 | 5 |
| Prefiero no responder | nulo: la pregunta no cuenta | 0 |

- "Ni de acuerdo ni en desacuerdo" es una posición y puntúa.
- "Prefiero no responder" no puntúa.
- Las flechas izquierda y derecha mueven entre preguntas.

Antes de la primera pregunta, la persona puede elegir y ordenar hasta 3 de los 8 bloques como prioritarios. Las preguntas del primero pesan ×2,0, las del segundo ×1,5 y las del tercero ×1,2. El resto pesa ×1. Elegir prioridades es opcional, y en los resultados se pueden cambiar sin repetir el test.

### 4.7 Ayuda en cada pregunta

Cada pregunta tiene un desplegable "¿Qué significa?" con estas partes:

| Parte | Contenido |
|---|---|
| Medida | Nombre corto de la medida |
| Situación actual | 1 o 2 frases con la norma o la cifra vigente |
| A favor | El efecto que buscan quienes la apoyan |
| En contra | El efecto que temen quienes la rechazan |
| Fuentes | Enlaces a las páginas de los informes |
| Nota | Aclaración opcional, por ejemplo qué instituciones deciden |

- Los dos lados se escriben como efectos, con la misma forma y la misma extensión.
- Ningún texto nombra a un partido.
- Cuando una pregunta se reformula como negación, la exportación intercambia "A favor" y "En contra".

Hay 2 textos de apoyo más:

- Un interludio al empezar cada bloque. Da un dato de contexto con su fuente pública (BOE, AIReF, Comisión Europea o La Moncloa), citada en los informes. Nunca adelanta afinidades parciales, porque influirían en las respuestas siguientes.
- Un glosario de 30 términos de las preguntas, como zona tensionada, arraigo, CGPJ, LOMLOE o Pacto Verde Europeo. Cada término lleva su definición y su norma.

## 5. Codificación de posiciones

### 5.1 Escala

| Valor | Criterio |
|---|---|
| +2 | El partido propone esto de forma explícita, con una unidad o medida identificable. |
| +1 | Propone una versión parcial, gradual o condicionada. |
| 0 | El informe documenta una posición intermedia. |
| −1 | Propone una versión parcial de lo contrario, o votó contra una versión más suave. |
| −2 | Propone lo contrario de forma explícita. |
| nulo | El informe no documenta posición. |

### 5.2 Reglas

1. El silencio no es posición. Si el informe dice que algo no se atribuye al partido, la celda es nula.
2. Ninguna posición se infiere por ideología ni por lo que proponen partidos afines.
3. La evidencia cruzada solo vale para hechos documentados en el informe de otro partido: votos en el Congreso, acuerdos firmados y declaraciones con fecha. Su confianza máxima es media. Las hipótesis del analista no valen.
4. Cada celda con valor lleva al menos una cita literal de 25 palabras como máximo. La cita indica su página y su unidad.
5. La confianza es alta si hay una unidad o frase explícita. Es media si sale de un párrafo o de un hecho cruzado. Es baja si es un indicio indirecto.
6. Desde la versión 1.1, para partidos autonómicos: si el partido pide una competencia para su comunidad sin posición sobre la medida estatal, la celda es nula o vale ±1 con confianza baja.

En el banco final, 4 celdas usan evidencia cruzada: 2 en Q08, 1 en Q17 y 1 en Q44. Las celdas de EH Bildu y PNV no usan evidencia cruzada.

Cada afirmación del catálogo v1 puede llevar una nota que fija cómo codificar los casos límite. Por ejemplo, la nota de Q08 fija que reducir la jornada a 37,5 horas, sin ir más allá, vale −1 o 0. 26 de las 53 finalistas tienen nota.

### 5.3 Cadena de trabajo

Cadena de la versión 1.0, con los 6 partidos originales:

| Paso | Quién o qué lo hace | Salida |
|---|---|---|
| 1. Texto de los 6 PDF, con maquetación | `pdftotext -layout` | `data/extracted/txt/*.txt` |
| 2. Extracción estructurada | Un agente de IA por informe, con `_prompt_extraccion.md` | `<partido>/informe.json` |
| 3. Codificación v0 de las 92 afirmaciones | El mismo agente, con el mismo prompt | `<partido>/codificacion.json` |
| 4. Codificación v1 a ciegas de las 53 finalistas | Otro agente de IA por informe, con `_prompt_codificacion_v1.md` | `<partido>/codificacion_v1.json` |
| 5. Fusión con reglas automáticas | `seleccion_y_simulacion.py` | `posiciones_fusion.json` |
| 6. Adjudicación con reglas de las 55 celdas marcadas y revisión por pregunta | Lectura de las dos citas en el PDF, con el registro en `adjudicacion.md` | `posiciones_adjudicadas.json` |
| 7. Revisión humana de las 10 celdas dudosas | Persona revisora | `posiciones_adjudicadas.json` |
| 8. Exportación con controles y huella SHA-256 | `scripts/export.py` | `src/content/*.json` |

Las dos codificaciones las hicieron agentes de IA de forma independiente y a ciegas. El segundo agente no podía abrir los ficheros del primero. Un script comprueba que cada cita aparece en su página del informe.

En la versión 1.1, EH Bildu y PNV siguieron el mismo método con el banco ya cerrado. Un agente extrajo cada informe y lo codificó (`codificacion_a.json`). Otro agente lo codificó a ciegas (`codificacion_b.json`). `fusionar_incorporacion.py` fusionó las 2 con las reglas de 5.5 y aplicó la adjudicación de `adjudicacion_incorporaciones.json`. Los 15 pasos están en [incorporar partidos](incorporar-partidos.md).

### 5.4 Acuerdo entre las dos codificaciones

| Partido | Iguales | Diferencia 1 | Diferencia 2 o más | Valor frente a nulo | Ambos nulos | Acuerdo exacto |
|---|---|---|---|---|---|---|
| EH Bildu | 25 | 1 | 0 | 1 | 12 | 0,96 |
| Frente Amplio | 23 | 3 | 0 | 9 | 13 | 0,88 |
| PNV | 12 | 2 | 0 | 2 | 23 | 0,86 |
| Podemos | 27 | 6 | 0 | 5 | 9 | 0,82 |
| PP | 23 | 1 | 2 | 1 | 22 | 0,88 |
| PSOE | 15 | 5 | 0 | 7 | 21 | 0,75 |
| SALF | 28 | 2 | 0 | 2 | 17 | 0,93 |
| Vox | 30 | 1 | 0 | 0 | 21 | 0,97 |
| **Total** | **183** | **21** | **2** | **27** | **138** | **0,89** |

- Con los 8 partidos, cuando las dos codificaciones dan valor, coinciden exactamente en el 89% de los casos (183 de 206). Coinciden a 1 punto o menos en el 99% (204 de 206).
- Con los 6 partidos originales, esas cifras eran el 88% (146 de 166) y el 99% (164 de 166).
- Las filas de los 6 partidos originales salen de las finalistas de la versión 1.0. Las de EH Bildu y PNV cuentan las 39 preguntas del banco.
- 7 afirmaciones cambiaron de redacción entre v0 y v1: Q08, Q11, Q35, Q45, Q47, Q48 y Q51. Para ellas solo cuenta la codificación v1 de los 6 partidos originales.

### 5.5 Reglas de fusión y adjudicación

| Caso | Regla automática de fusión | Celdas marcadas en las 40 preguntas de la versión 1.0 |
|---|---|---|
| Iguales | Se mantiene el valor, con la confianza menor de las dos | 0 |
| Diferencia de 1 | Se toma el valor más cercano a 0 y la confianza menor | 16 |
| Diferencia de 2 o más | Nulo provisional | 2 |
| Una nula y otra con valor | Se mantiene el valor si su confianza es media o alta | 15 |
| Solo hay codificación v1 | Se mantiene | 22 |

En la versión 1.0, la adjudicación revisa las 55 celdas marcadas:

- Lee las dos citas en el PDF y aplica las reglas de 5.1 y 5.2 y las notas del catálogo.
- Cambia el valor de 12 celdas y solo la confianza de otras 4. El resto confirma el valor provisional.
- Registra cada decisión con su motivo y su página en `data/extracted/adjudicacion.md`.
- Marca con `revisar_humano` las 10 celdas más dudosas. En la versión 1.0 las revisó una persona.
- Comprueba que todas las citas tienen 25 palabras o menos y aparecen literales en su página. Usa el texto con maquetación y una segunda extracción sin maquetación, porque las tablas a dos columnas cortan frases.

En la versión 1.1, la fusión de EH Bildu y PNV marcó 6 celdas en las 39 preguntas: 3 con diferencia de 1 y 3 con una codificación nula y otra con valor. Ninguna tuvo diferencia de 2 o más.

- La adjudicación cambia el valor de 1 celda: Q42 de EH Bildu pasa de 0 a −1. Cambia solo la confianza de otra: Q42 del PNV pasa de media a alta. Las otras 4 confirman el valor provisional.
- La revisión por pregunta (5.6) añade Q50 de EH Bildu, que no estaba marcada.
- Cada decisión, con su motivo y su página, está en `data/extracted/adjudicacion_incorporaciones.json` y en el [historial de datos](historial-de-datos.md).
- 3 celdas quedan marcadas con `revisar_humano` y esperan la revisión de una persona: Q41 del PNV, Q42 de EH Bildu y Q50 de EH Bildu.

Tras la adjudicación, 3 preguntas se reformularon como negaciones exactas para equilibrar la polaridad: Q07, Q24 y Q29. La exportación invierte el signo de sus posiciones, su dirección en el eje y su polaridad. EH Bildu y PNV se codificaron con el texto final, así que la exportación no invierte sus posiciones.

### 5.6 Revisión por pregunta

- Para cada pregunta se leen juntas las celdas de todos los partidos con sus citas. El mismo tipo de evidencia debe recibir el mismo valor en todos los partidos.
- En la versión 1.0, esta revisión produjo 3 cambios horizontales en celdas que no estaban marcadas.
- En la versión 1.1 revisó Q50 de EH Bildu, que no estaba marcada. Mantiene +1 con confianza baja y queda para revisión humana.
- Ejemplo de coherencia en Q42: PNV recibe +1 con confianza alta por rebajar solo el impuesto de la electricidad, igual que PP y SALF.
- Ejemplo de escala en Q40: cerrar Almaraz en 2027 y 2028 (Frente Amplio) vale −2. Mantener el calendario de cierre de 2035 (PSOE) vale −1.
- Ejemplo de coherencia en Q25: Podemos y Frente Amplio reciben +1 con confianza media, porque sus unidades citan el mismo reconocimiento registral sin procedimiento.

## 6. Algoritmo y sistema de puntuación

El motor está en `src/lib/scoring.ts`. Es puro y determinista: las mismas respuestas dan siempre el mismo resultado y los mismos intervalos.

### 6.1 Notación

- $u_q$: respuesta de la persona a la pregunta $q$, de −2 a +2, o nula si la salta.
- $w_q$: peso que da la persona. Vale 2,0, 1,5 o 1,2 si la pregunta es del bloque elegido como prioridad 1, 2 o 3. Vale 1 en el resto.
- $p_{kq}$: posición del partido $k$ en la pregunta $q$, de −2 a +2, o nula.
- $c_{kq}$: confianza de esa posición. Alta vale 1,0, media vale 0,75 y baja vale 0,5.
- $R$: preguntas respondidas. $R_k$: preguntas respondidas en las que el partido $k$ tiene posición.

### 6.2 Acuerdo por pregunta: modelo híbrido

$$
a(u, p) = 0{,}5 \left(1 - \frac{|u - p|}{4}\right) + 0{,}5 \left(\frac{1}{2} + \frac{u\,p}{8}\right)
$$

- El primer término es la proximidad. Mide la distancia en la escala.
- El segundo término es la dirección. Mide si ambos están del mismo lado y con cuánta intensidad.

| u \ p | +2 | +1 | 0 | −1 | −2 |
|---|---|---|---|---|---|
| +2 | 1,00 | 0,75 | 0,50 | 0,25 | 0,00 |
| +1 | 0,75 | 0,81 | 0,63 | 0,44 | 0,25 |
| 0 | 0,50 | 0,63 | 0,75 | 0,63 | 0,50 |
| −1 | 0,25 | 0,44 | 0,63 | 0,81 | 0,75 |
| −2 | 0,00 | 0,25 | 0,50 | 0,75 | 1,00 |

La proximidad pura da ventaja a los partidos con posiciones moderadas. En la versión 1.0, con los 6 partidos originales y respuestas al azar, el partido más moderado del banco (PSOE) quedaba primero el 42% de las veces. La dirección corrige ese sesgo, porque una respuesta neutral da 0,5 de dirección con cualquier partido. Mendez (2012) compara modelos de proximidad, de dirección y mixtos en aplicaciones de consejo de voto.

Simulación con el banco preliminar de 40 preguntas:

| Peso de la proximidad | Recuperación mínima, σ = 1,25 | Recuperación media, σ = 1,25 | Máximo con respuestas al azar |
|---|---|---|---|
| 1,00 | 0,934 | 0,966 | 42,1% |
| 0,75 | 0,928 | 0,971 | 35,6% |
| **0,50 (elegido)** | **0,914** | **0,969** | **28,3%** |
| 0,25 | 0,870 | 0,950 | 20,6% |

Con la mezcla al 50%, el sesgo baja del 42% al 28% y la recuperación media casi no cambia.

### 6.3 Afinidad con cada partido

$$
S_k = 100 \cdot \frac{\displaystyle\sum_{q \in R_k} w_q\, c_{kq}\, a(u_q, p_{kq}) + 4 \cdot 0{,}5}{\displaystyle\sum_{q \in R_k} w_q\, c_{kq} + 4}
$$

- La suma recorre solo las preguntas respondidas en las que el partido tiene posición.
- Los nulos del partido no cuentan. Si el partido calla sobre un tema, ese tema no suma ni resta para él.
- La confianza pondera: una posición con evidencia débil pesa la mitad.
- El término $4 \cdot 0{,}5$ añade 4 preguntas ficticias con acuerdo 0,5. Acerca a 50 a los partidos con poca evidencia en las respuestas de esa persona. Con 5 coincidencias perfectas, un partido marca 78 y no 100. Con 20, marca 92.
- Se descartó contar los nulos como 0,5. En la simulación de la versión 1.0, con esa regla, un mismo partido ganaba al 31,8% de los usuarios al azar. Además, la recuperación de 3 partidos con σ = 1,25 bajaba a entre 0,86 y 0,87.

### 6.4 Cobertura

$$
\text{Cobertura}_k = \frac{\sum_{q \in R_k} w_q}{\sum_{q \in R} w_q}
$$

La cobertura se muestra junto a cada porcentaje. Dice en qué parte de tus respuestas se apoya la afinidad con cada partido.

### 6.5 Incertidumbre y empate técnico

El motor hace 1.000 remuestreos bootstrap de las preguntas respondidas, con reposición. En cada remuestreo $b$ recalcula las 8 afinidades $S_k^{(b)}$.

- El intervalo de cada partido es del 90%: percentiles 5 y 95 de $S_k^{(b)}$.
- La proporción de victorias de $k$ sobre $j$ es:

$$
W_{kj} = \frac{1}{1000} \sum_{b=1}^{1000} \mathbf{1}\left[S_k^{(b)} > S_j^{(b)}\right]
$$

- Hay empate técnico entre dos puestos contiguos si el de arriba gana en menos del 70% de los remuestreos ($W_{kj} < 0{,}70$).
- El titular agrupa a todos los partidos que no se separan del primero con ese mismo umbral.
- La seguridad del primer puesto depende de $F_k$, la proporción de remuestreos en que el primero queda primero:

| Seguridad | Regla |
|---|---|
| Alta | $F_k \geq 0{,}90$ |
| Media | $0{,}70 \leq F_k < 0{,}90$ |
| Baja | $F_k < 0{,}70$ |

- La semilla sale de un hash FNV-1a de las respuestas y los pesos. El generador es mulberry32. Así el mismo test da siempre el mismo intervalo.
- El coste es de 1.000 × 39 × 8 = 312.000 sumas, que el navegador hace en milisegundos.
- La pantalla no habla de remuestreos. Dice que la diferencia es menor que el margen de error y, si existe, qué respuesta cambiaría el primer puesto.

Con el umbral del 70%, la simulación da empate técnico con el primero en el 3,3% de los votantes con ruido σ = 0,75 y en el 15,7% con σ = 1,25 (6.13).

### 6.6 Mínimos de respuesta

| Preguntas respondidas | Qué se muestra |
|---|---|
| Menos de 10 | No hay ranking. Mensaje: "Responde al menos 10 para calcular tu afinidad." |
| 10 a 19 | Ranking con aviso de precisión baja |
| 20 o más | Ranking normal |

### 6.7 Afinidad por bloque

- Usa la fórmula de 6.3 restringida a las preguntas de un bloque.
- Se muestra si la persona respondió al menos 2 preguntas del bloque. El partido debe tener posición en al menos 2 de ellas.
- La sección "Por temas" la presenta como mini barras por bloque.

### 6.8 Mapa de 2 ejes

Coordenada de la persona en el eje $e$, con $d_q$ la dirección de la pregunta y $n_e$ las preguntas respondidas del eje:

$$
x_e = \frac{1}{n_e} \sum_{q \in R \cap e} \frac{d_q\, u_q}{2}
$$

Coordenada del partido $k$, ponderada por la confianza de sus posiciones en el eje:

$$
X_{ke} = \frac{\sum_{q \in e} c_{kq}\, d_q\, p_{kq} / 2}{\sum_{q \in e} c_{kq}}
$$

Ambas van de −1 a +1. Coordenadas con los datos actuales:

| Partido | ECO | SOC |
|---|---|---|
| EH Bildu | −0,73 | −0,90 |
| Frente Amplio | −0,75 | −0,85 |
| PNV | 0,00 | −0,61 |
| Podemos | −0,90 | −0,84 |
| PP | +0,83 | +0,60 |
| PSOE | −0,34 | −0,75 |
| SALF | +0,86 | +0,94 |
| Vox | +0,80 | +0,93 |

- En el mapa, las etiquetas de los partidos con puntos muy cercanos se apilan alrededor del centro del grupo.

- La elipse de la persona cubre el 90% de los remuestreos de 6.5.
- Las posiciones miden coincidencias en estas medidas concretas. No son una ideología completa.

### 6.9 Prioridades de cada partido

- Cada codificación v0 asigna a cada ámbito una saliencia alta, media o baja. Sale de las conclusiones ejecutivas del informe y de sus unidades propias.
- La ficha de cada partido lista sus ámbitos de saliencia alta. Por ejemplo, el informe de Podemos tiene 6 y el de SALF tiene 11.
- La saliencia no entra en $S_k$.

### 6.10 Realizabilidad de las coincidencias

- Una coincidencia es una pregunta con $a \geq 0{,}75$ entre tu respuesta y la posición del partido.
- La sección "Si gobiernan" coloca cada coincidencia en una columna según su aprobación en el escenario elegido: Alta, Media, Baja, NE o sin valoración.
- Cada partido usa los escenarios de su informe. Ejemplo de Podemos: "A: Mayoría propia. B: Gobierno negociado. C: Influencia externa."
- El resumen es un recuento: "X de tus Y coincidencias tienen aprobación Alta en este escenario."
- Las valoraciones nunca se promedian, se suman ni se multiplican. Son juicios cualitativos de los informes, no probabilidades.

Con los datos actuales, 206 de las 211 celdas con valor tienen etiquetas:

| Valoración | Alta | Media | Baja | NE |
|---|---|---|---|---|
| Aprobación en el escenario A | 101 | 75 | 23 | 7 |
| Entrega E | 22 | 152 | 14 | 18 |

### 6.11 Socios documentados

- La sección "Pactos" muestra el escenario B literal de cada informe y su tabla de acuerdos.
- Cada acuerdo aparece como «Según el informe de X», con su fecha cuando el informe la da. La web no distingue entre acuerdos e hipótesis, porque los informes no lo marcan con el mismo criterio.
- Ejemplo del informe del PSOE: la convalidación del RDL 29/2026, con el voto a favor de PSOE, Sumar, ERC, PNV, Bildu y Podemos.
- Ejemplo del informe de Vox: el pacto con el PP para el Senado, anunciado el 26/10/2026.
- Esta información no puntúa.

### 6.12 Casos límite

| Caso | Comportamiento |
|---|---|
| Todas las respuestas neutrales | Hay ranking. Gana el partido con más posiciones intermedias. Hoy: PSOE 59,0; PNV 58,1; PP 56,7; EH Bildu 54,3; Frente Amplio 54,1; Podemos 53,5; Vox 53,3; SALF 53,1. Si el 60% de las respuestas o más son «Neutral», el titular lo avisa. |
| Todo saltado | Sin ranking (6.6) |
| Un partido sin posición en todo lo respondido | $S_k = 50$ y cobertura 0% |
| Empate exacto | Orden alfabético del identificador |
| Respuesta cambiada hacia atrás | Se recalcula todo, sin estado oculto |

### 6.13 Validación del algoritmo final

`npm run validar` ejecuta `scripts/validar.ts` con el mismo motor que usa la web y los datos de `src/content/questions.json`. Simula 1.000 votantes por partido en cada prueba de recuperación, 8.000 con respuestas al azar y 2.400 en cada prueba de empate. La semilla es fija, así que las cifras se pueden reproducir.

| Prueba | Modo completo (39) | Modo rápido (24) |
|---|---|---|
| Autotest: cada partido responde sus propias posiciones | 8 de 8 en primer puesto; margen mínimo 2,2 puntos | 8 de 8 en primer puesto; margen mínimo 1,9 puntos |
| Recuperación con ruido σ = 0,75 | 0,980 a 1,000 | 0,937 a 0,999 |
| Recuperación con ruido σ = 1,25 | 0,876 a 0,989 | 0,784 a 0,985 |
| Primer puesto con respuestas al azar (ideal: 12,5% cada uno) | 5,8% a 20,6% | 5,6% a 18,7% |
| Empate técnico con el primero, σ = 0,75 | 3,3% | 8,3% |
| Empate técnico con el primero, σ = 1,25 | 15,7% | 25,8% |
| Todo «Neutral»: primer puesto | PSOE, 0,9 puntos por delante | PSOE, 1,5 puntos por delante |

Cada votante sintético parte de las posiciones de un partido y añade ruido gaussiano:

$$
u_q = \operatorname{clip}\left(\operatorname{round}\left(p_{kq} + \varepsilon_q\right), -2, 2\right), \qquad \varepsilon_q \sim \mathcal{N}(0, \sigma^2)
$$

Donde el partido no tiene posición, el votante parte de un valor al azar entre −2 y +2.

- La recuperación es la proporción de votantes de cada partido que lo tienen en primer puesto. La tabla da el mínimo y el máximo entre los 8.
- Recuperación con σ = 0,75 en modo completo: EH Bildu 0,991, Frente Amplio 0,980, PNV 0,984, Podemos 0,982, PP 0,991, PSOE 0,993, SALF 0,999 y Vox 1,000.
- El par más difícil es Frente Amplio y Podemos: su margen en el autotest es de 2,2 puntos y su cercanía es de 90 (6.23). Cuando la diferencia es menor que el margen de error, la web lo muestra como empate técnico.
- Con respuestas al azar, ningún partido supera el 21% de primeros puestos. En modo completo: EH Bildu 10,5%, Frente Amplio 6,6%, PNV 20,6%, Podemos 5,8%, PP 17,7%, PSOE 18,8%, SALF 11,1% y Vox 8,9%.
- PNV queda primero más a menudo porque tiene posición en solo 14 preguntas. La fórmula acerca a 50 las afinidades con pocas posiciones (6.3).
- PSOE y PP quedan segundo y tercero por la forma de sus posiciones: el 72% de las del PSOE y el 59% de las del PP son 0 o ±1. En PNV es el 79%. En los otros 5 partidos esa proporción va del 28% al 42%. Una respuesta al azar o neutral queda más cerca de un valor intermedio.
- Quien responde «Neutral» a todo ve al PSOE primero con 0,9 puntos de ventaja sobre PNV. Si el 60% de las respuestas o más son «Neutral», el titular de resultados lo avisa (6.12).

`npm test` repite parte de estas pruebas en cada cambio:

- El autotest debe dar 8 de 8.
- La recuperación con σ = 0,75 en modo completo debe llegar a 0,95 para cada partido. La prueba usa 300 votantes por partido.
- `npm run validar` da la tabla completa de esta sección en unos 30 segundos.
- Las pruebas de propiedades usan fast-check. La afinidad siempre está entre 0 y 100.
- Acercar una respuesta a la posición de un partido nunca baja su afinidad.
- Saltar una pregunta en la que el partido es nulo no cambia su afinidad.
- El bootstrap es determinista y $50 + \sum \delta$ coincide con $S_k$ (6.16).

### 6.14 Ejemplo resuelto

La persona elige Vivienda como prioridad 1 y responde 3 preguntas:

- Q12 = +2 (topes al alquiler), del bloque 2: $w = 2{,}0$.
- Q13 = −1 (liberar suelo), del bloque 2: $w = 2{,}0$.
- Q27 = +1 (regularización), del bloque 5: $w = 1$.

| Partido | Posiciones en Q12, Q13 y Q27 | Cálculo | $S_k$ | Cobertura |
|---|---|---|---|---|
| EH Bildu | +2ᵐ, −2ᵐ, +2 | 100 × (1,5 + 1,125 + 0,75 + 2) / (1,5 + 1,5 + 1 + 4) | 67,2 | 100% |
| Frente Amplio | +2, −2ᵐ, +2 | 100 × (2 + 1,125 + 0,75 + 2) / (2 + 1,5 + 1 + 4) | 69,1 | 100% |
| PNV | nulo, 0ᵐ, +1ᵐ | 100 × (0,9375 + 0,609375 + 2) / (1,5 + 0,75 + 4) | 56,8 | 60% |
| Podemos | +2, −2ᵐ, +2 | Igual que Frente Amplio | 69,1 | 100% |
| PP | −2, +2, −1 | 100 × (0 + 0,5 + 0,4375 + 2) / (2 + 2 + 1 + 4) | 32,6 | 100% |
| PSOE | +1ᵇ, 0ᵐ, nulo | 100 × (0,75 + 0,9375 + 2) / (1 + 1,5 + 4) | 56,7 | 80% |
| SALF | nulo, +2, −2 | 100 × (0,5 + 0,25 + 2) / (2 + 1 + 4) | 39,3 | 60% |
| Vox | −2, +2, −2 | 100 × (0 + 0,5 + 0,25 + 2) / (2 + 2 + 1 + 4) | 30,6 | 100% |

ᵐ = confianza media, ᵇ = confianza baja, sin marca = alta.

- En el PSOE, Q12 pesa la mitad por su confianza baja ($2{,}0 \times 0{,}5 = 1$) y Q27 no cuenta porque no hay posición.
- Frente Amplio y Podemos empatan de forma exacta. El orden alfabético pone primero a Frente Amplio (6.12).
- Con 3 respuestas no hay ranking (6.6). El ejemplo solo ilustra la fórmula.

### 6.15 Código de referencia

Extracto de `src/lib/scoring.ts`:

```ts
export const CONF = { alta: 1, media: 0.75, baja: 0.5 };
export const ALPHA = 0.5;
export const PRIOR_N = 4;
export const PRIOR_A = 0.5;

export function agreement(u: number, p: number): number {
  const prox = 1 - Math.abs(u - p) / 4;
  const dir = 0.5 + (u * p) / 8;
  return ALPHA * prox + (1 - ALPHA) * dir;
}

// Para cada pregunta respondida q con posición del partido:
//   wc = w_q * CONF[confianza];  num += wc * agreement(u, p);  den += wc;
// Afinidad: 100 * (num + PRIOR_N * PRIOR_A) / (den + PRIOR_N)
```

### 6.16 Contribución de cada pregunta

$$
\delta_{kq} = 100 \cdot \frac{w_q\, c_{kq}\,(a_{kq} - 0{,}5)}{\sum_{r \in R_k} w_r\, c_{kr} + 4}
\qquad
S_k = 50 + \sum_{q \in R_k} \delta_{kq}
$$

- La descomposición es exacta. Cada pregunta suma o resta puntos desde 50.
- La sección "Por qué" la usa en 3 sitios: "Lo que más os une", "Lo que más os separa" y el gráfico de cascada.

### 6.17 Preguntas bisagra

- Para cada pregunta respondida, el motor prueba la respuesta 1 punto por encima, 1 punto por debajo y la opción de saltarla.
- Si una variante cambia el primer puesto, la pregunta es bisagra.
- Se muestran 3 como máximo. Van primero los cambios de 1 punto y después los de saltar.
- Ejemplo de texto: "Si en «España debería aumentar el gasto en defensa…» hubieras respondido De acuerdo en vez de Muy de acuerdo, SALF pasaría a primero."
- El botón "Probar este cambio" aplica esa respuesta y recalcula la página.
- El coste máximo es de 39 preguntas × 3 variantes × 8 partidos × 39 sumandos, unas 36.500 operaciones.

### 6.18 Sensibilidad

El motor recalcula el primer puesto con 3 variantes:

1. Sin prioridades: todos los pesos a 1.
2. Solo posiciones con confianza alta.
3. Nulos contados como acuerdo 0,5, la regla descartada en 6.3.

El podio ofrece las 2 primeras como interruptores, "Sin mis prioridades" y "Solo evidencia de confianza alta". Si el primer puesto cambia con alguna de ellas, aparece un aviso.

### 6.19 Afinidad entre dos personas

$$
A_{12} = \frac{100}{|Q_{12}|} \sum_{q \in Q_{12}} a\left(u^{(1)}_q, u^{(2)}_q\right)
$$

- $Q_{12}$ son las preguntas que ambas personas respondieron.
- Se muestra si comparten al menos 10 respuestas.
- Las 5 preguntas con menor acuerdo son "donde más discrepáis".
- El cálculo se hace en el navegador con el enlace de resultado de la otra persona.

### 6.20 Coincidencias inesperadas

Una coincidencia es inesperada si cumple 3 condiciones:

- El partido está en los 3 últimos puestos de tu podio.
- El acuerdo es $a \geq 0{,}75$.
- La posición del partido es ±2 con confianza media o alta.

Se ordenan por $w_q\, c_{kq}\, a_{kq}$ y se muestran 3 como máximo. Ejemplo: Podemos queda sexto en tu podio y compartes su propuesta de transporte público gratuito (unidad POD-16-01, p. 39).

### 6.21 Discrepancias entre socios

Los socios salen del escenario B de cada informe:

| Partido | Socios |
|---|---|
| EH Bildu | PSOE, Frente Amplio, Podemos y PNV |
| Frente Amplio | PSOE |
| PNV | PSOE |
| Podemos | PSOE |
| PP | Vox |
| PSOE | Frente Amplio y Podemos |
| SALF | PP y Vox |
| Vox | PP |

Para cada par se listan las preguntas en las que ambos tienen posición y $|p_{kq} - p_{jq}| \geq 2$. Con los datos actuales:

| Par | Preguntas |
|---|---|
| EH Bildu y Frente Amplio | Q50 (poder de la UE) |
| EH Bildu y PNV | Q13 (vivienda y mercado), Q41 (Pacto Verde Europeo), Q42 (impuestos a la energía), Q50 |
| EH Bildu y Podemos | Ninguna |
| EH Bildu y PSOE | Q08 (jornada de 32 horas), Q13, Q36 (competencias autonómicas), Q49 (gasto en defensa), Q50 |
| Frente Amplio y PSOE | Q13, Q49 |
| PNV y PSOE | Q36, Q41 |
| Podemos y PSOE | Q08, Q13, Q14 (desalojo en 48 horas), Q49 |
| PP y SALF | Q37 (deuda autonómica), Q41, Q44 (Mercosur), Q50 |
| PP y Vox | Q17 (prioridad nacional), Q41, Q44, Q50 |
| SALF y Vox | Q16 (pisos turísticos) |

Junto a la lista se citan las fricciones que documentan los informes. Ejemplo del informe del PSOE sobre sus socios: "Cuantías, prioridades, vivienda, defensa y algunas políticas de igualdad pueden exigir concesiones."

### 6.22 Coincidencias contadas

Es una métrica discreta que complementa a $S_k$. Cada pregunta respondida cae en una de 4 casillas para cada partido:

| Casilla | Regla |
|---|---|
| Coincidencia | $u$ y $p$ tienen el mismo signo, o ambos son 0 |
| Discrepancia | $u$ y $p$ tienen signos opuestos |
| Parcial | Uno es 0 y el otro no |
| Sin posición | $p$ es nulo |

- Se muestra bajo cada barra del podio. Ejemplo: "23 coincidencias, 9 discrepancias, 4 parciales y 2 sin posición".
- No entra en $S_k$. El orden por coincidencias puede diferir del orden por afinidad, porque la afinidad pesa la intensidad, la confianza y las prioridades.

### 6.23 Cercanía entre partidos

$$
C_{kj} = \frac{100}{|Q_{kj}|} \sum_{q \in Q_{kj}} a\left(p_{kq}, p_{jq}\right)
$$

$Q_{kj}$ son las preguntas en las que ambos partidos tienen posición. Se exigen al menos 10. Valores con los datos actuales:

| Pareja | Preguntas comunes | Cercanía |
|---|---|---|
| Frente Amplio y Podemos | 27 | 90 |
| EH Bildu y Podemos | 24 | 89 |
| EH Bildu y Frente Amplio | 23 | 87 |
| SALF y Vox | 22 | 85 |
| PP y Vox | 23 | 81 |
| PNV y PSOE | 10 | 77 |
| Frente Amplio y PSOE | 23 | 76 |
| PP y SALF | 22 | 76 |
| Frente Amplio y PNV | 13 | 75 |
| PNV y Podemos | 12 | 75 |
| EH Bildu y PNV | 13 | 74 |
| EH Bildu y PSOE | 18 | 73 |
| Podemos y PSOE | 23 | 73 |
| PNV y PP | 11 | 53 |
| PP y PSOE | 15 | 51 |
| PNV y Vox | 11 | 45 |
| PSOE y Vox | 16 | 45 |
| PNV y SALF | 10 | 44 |
| PSOE y SALF | 16 | 40 |
| Frente Amplio y PP | 19 | 33 |
| EH Bildu y PP | 17 | 29 |
| Frente Amplio y Vox | 19 | 26 |
| Podemos y PP | 22 | 26 |
| EH Bildu y SALF | 18 | 24 |
| Frente Amplio y SALF | 19 | 22 |
| EH Bildu y Vox | 19 | 21 |
| Podemos y Vox | 23 | 20 |
| Podemos y SALF | 24 | 18 |

La ficha de cada partido muestra su cercanía con los otros 7 en el apartado "Cercanía con otros partidos en el test".

### 6.24 Versión de los datos en cada resultado

- El enlace de resultado lleva la versión de los datos, por ejemplo `v=1.0`.
- Si al abrirlo la versión vigente es otra, la web recalcula con los datos nuevos y avisa: "Este resultado se calculó con la versión 1.0 de los datos. Lo hemos recalculado con la versión 1.1."
- Los cambios de cada versión están en el [historial de datos](historial-de-datos.md).

## Licencia

El código se publica con licencia AGPL-3.0. Los datos, los informes y las codificaciones se publican con licencia CC BY 4.0.
