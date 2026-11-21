# Historial de datos

Este historial recoge los cambios de cada versión de los datos de Voy Votando. La versión vigente aparece en el pie de la web y en `src/content/meta.json`, junto con su huella SHA-256.

Cada enlace de resultado guarda la versión con la que se calculó. Si la versión cambia, la web recalcula el resultado con los datos nuevos y lo avisa (metodología, 6.24).

Las versiones siguen este formato: `1.0-rcN` para las candidatas y `1.0` para la publicada. Cada lote de partidos incorporados sube un número menor: `1.1`, `1.2`… Cada entrada separa lo añadido, lo cambiado, lo retirado y lo revisado.

## 1.1 (21/11/2026)

Entran EH Bildu (`bildu`) y PNV (`pnv`). Los datos pasan de 6 a 8 partidos, de 326 a 538 páginas de informe y de 651 a 937 unidades. El banco no cambia: siguen las mismas 39 preguntas, 24 en modo rápido. Las codificaciones de los 6 partidos originales no cambian. La huella SHA-256 de `src/content/meta.json` empieza por `7510b09631ec`.

### Añadido

| Partido | Programa | Fecha del programa | Corte del informe | Páginas | Unidades | Dónde se presenta |
|---|---|---|---|---|---|---|
| EH Bildu | "Garantía y derechos" (versión castellana) | 16/11/2026 | 21/11/2026 | 109 | 152 | Álava, Bizkaia, Gipuzkoa y Navarra (p. 5). En Navarra va al Congreso en coalición con ERC. |
| PNV (EAJ-PNV) | "Programa electoral de las elecciones generales de 2026, documento íntegro" | 09/11/2026 | 21/11/2026 | 103 | 134, que agrupan 225 compromisos numerados | Álava, Bizkaia y Gipuzkoa (p. 5). En Navarra participa en Geroa Bai, que no está incluida. |

- Socios del escenario B en la web: EH Bildu tiene a PSOE, Frente Amplio, Podemos y PNV. PNV tiene al PSOE.
- Siguen sin informe: Junts, ERC, BNG, Coalición Canaria y UPN.
- Método: el de [incorporar-partidos.md](incorporar-partidos.md). Cada partido tiene 2 codificaciones independientes y a ciegas de las 39 preguntas publicadas, con su texto final. Las 2 se fusionan con las reglas de la metodología (5.5), se adjudican con registro y se revisan por pregunta.
- Regla nueva para partidos autonómicos (metodología, 5.2): si el partido pide una competencia para su comunidad sin posición sobre la medida estatal, la celda es nula o vale ±1 con confianza baja.

### Revisado

Acuerdo entre las 2 codificaciones (metodología, 5.4):

| Partido | Iguales | Diferencia 1 | Diferencia 2 o más | Valor frente a nulo | Ambos nulos | Acuerdo exacto |
|---|---|---|---|---|---|---|
| EH Bildu | 25 | 1 | 0 | 1 | 12 | 0,96 |
| PNV | 12 | 2 | 0 | 2 | 23 | 0,86 |

Con las filas de la versión 1.0, el acuerdo exacto queda en 183 de 206 (89%). A 1 punto o menos queda en 204 de 206 (99%).

La fusión marcó 6 celdas. La revisión por pregunta añadió Q50 de EH Bildu. Decisiones de `data/extracted/adjudicacion_incorporaciones.json`:

| Pregunta | Partido | Codificaciones A y B | Decisión | Motivo |
|---|---|---|---|---|
| Q01 | EH Bildu | nula; −1, baja | nula | El informe no trata la simplificación administrativa. Las obligaciones laborales nuevas (p. 18) son otra materia. |
| Q42 | EH Bildu | −1, media; 0, media | −1, media | Propone igualar al alza los impuestos de los hidrocarburos (p. 13). Para la electricidad solo pide una fiscalidad que la favorezca, sin rebaja (p. 14). Es el caso simétrico al +1 de PP y SALF. |
| Q50 | EH Bildu | +1, baja; +1, baja | +1, baja | Pide renacionalizar y territorializar la PAC dentro del marco europeo (p. 70). Es una sola política, y el resto del informe defiende posiciones dentro de la UE. |
| Q05 | PNV | nula; −1, baja | nula | Pedir flexibilidad para invertir superávits y recuperar la CNE (pp. 12 y 50) son indicios indirectos. Con confianza baja, la regla deja la celda nula. |
| Q41 | PNV | 0, baja; −1, baja | 0, baja | Pide revisar el PNIEC por necesidades industriales y apoya la electrificación (pp. 49 y 52). Es el mismo tipo de evidencia que el 0 del PP. |
| Q42 | PNV | +2, media; +1, alta | +1, alta | Deja el impuesto especial sobre la electricidad en el 0,5% (p. 49) y no rebaja los carburantes. PP y SALF tienen +1 alta por la misma evidencia. |
| Q45 | PNV | nula; +1, baja | nula | Solo estudia revisar el IVA del transporte público (p. 12). No propone gratuidad, abonos ni ayudas, que es la evidencia del +1 de Frente Amplio y PSOE. |

- La adjudicación cambia el valor de 1 celda: Q42 de EH Bildu pasa de 0 a −1. Cambia solo la confianza de otra: Q42 del PNV pasa de media a alta.
- 3 celdas quedan marcadas con `revisar_humano` y esperan la revisión de una persona: Q41 del PNV (0, baja), Q42 de EH Bildu (−1, media) y Q50 de EH Bildu (+1, baja). Hasta entonces, la web las usa con esos valores.

Cobertura en las 39 preguntas:

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

Las celdas con valor pasan de 171 a 211: 111 con confianza alta, 80 media y 20 baja.

### Cambiado

- `data/partidos.json` es la lista única de partidos. `export.py` compara las unidades de cada partido con su campo `unidades`. Antes comprobaba un total fijo de 651.
- `meta.json` añade `partyInfo` y `notIncluded`. Su fecha de corte es la más reciente de los informes: 21/11/2026.
- La web lee de `meta.json` los nombres, las siglas y los recuentos. EH Bildu y PNV muestran «Solo se presenta en …» en el titular de resultados, en el podio y en su ficha.
- `public/og.png` y `docs/assets/social-preview.png` dicen 8 partidos.
- Un enlace de resultado de la versión 1.0 se recalcula con los 8 partidos, y la web lo avisa (metodología, 6.24).

Simulación con estos datos (`npm run validar`, metodología 6.13):

| Prueba | Modo completo (39) | Modo rápido (24) |
|---|---|---|
| Autotest: cada partido responde sus propias posiciones | 8 de 8 en primer puesto; margen mínimo 2,2 puntos | 8 de 8 en primer puesto; margen mínimo 1,9 puntos |
| Recuperación con ruido σ = 0,75 | 0,980 a 1,000 | 0,937 a 0,999 |
| Recuperación con ruido σ = 1,25 | 0,876 a 0,989 | 0,784 a 0,985 |
| Primer puesto con respuestas al azar (ideal: 12,5% cada uno) | 5,8% a 20,6% | 5,6% a 18,7% |
| Empate técnico con el primero, σ = 0,75 | 3,3% | 8,3% |
| Empate técnico con el primero, σ = 1,25 | 15,7% | 25,8% |
| Todo «Neutral»: primer puesto | PSOE, 0,9 puntos por delante | PSOE, 1,5 puntos por delante |

Con respuestas al azar, PNV queda primero en el 20,6% de los casos en modo completo. Tiene posición en solo 14 preguntas, y la fórmula acerca a 50 las afinidades con pocas posiciones (metodología, 6.3).

## 1.0 (20/11/2026)

### Revisado

Una persona revisó las 10 celdas que la adjudicación de la versión 1.0-rc2 marcó como dudosas (`revisar_humano`). 2 están en preguntas retiradas (Q10 y Q26) y no se revisan. Las otras 8 quedan así:

| Pregunta | Partido | Propuesta de la adjudicación | Decisión final | Motivo de la decisión |
|---|---|---|---|---|
| Q01 | Podemos | 0, baja | 0, baja | Simplifica para pequeños negocios y añade obligaciones a grandes empresas; mismo criterio que Frente Amplio |
| Q02 | SALF | nulo | −1, baja | Reducir las entidades públicas de 452 a 300 y suprimir entes y empresas sin función (pp. 34 y 48) |
| Q09 | SALF | −1, media | −1, media | El contrato único abarata el despido con poca antigüedad (p. 13) |
| Q11 | SALF | 0, media | 0, media | Jubilación sin penalización con 40 años cotizados e incentivo a seguir trabajando (p. 16) |
| Q14 | Podemos | nulo | −1, baja | Frenar los lanzamientos sin alternativa y perseguir el desalojo extrajudicial (p. 16) |
| Q17 | PP | +1, baja | 0, baja | Según el informe de Vox (pp. 14 y 33), el PP acepta una prioridad por residencia y no por nacionalidad |
| Q36 | PP | +1, baja | +1, baja | Coordinar y uniformar servicios sin recuperar competencias (p. 17) |
| Q41 | PP | +1, media | 0, media | Ajustar el ritmo de la transición pesa igual que su compromiso con la descarbonización (p. 18) |

- Las celdas con valor pasan de 170 a 171: 91 con confianza alta, 62 media y 18 baja.
- Cada celda revisada lleva `decision: "revision_humana"` y su motivo en `data/extracted/posiciones_adjudicadas.json`.

### Cambiado

4 afirmaciones pierden cláusulas que añadían un coste o un juicio. La idea de cada una no cambia, así que sus codificaciones siguen valiendo:

| Pregunta | Texto anterior | Texto nuevo |
|---|---|---|
| Q01 | Hay que reducir con fuerza los trámites y normas que deben cumplir las empresas, aunque haya menos controles previos. | Hay que reducir con fuerza los trámites y normas que deben cumplir las empresas. |
| Q05 | Hay que reducir el gasto público y el tamaño de la Administración, aunque eso suponga suprimir organismos y puestos. | Hay que reducir el gasto público y suprimir organismos de la Administración. |
| Q24 | Las ayudas como el Ingreso Mínimo Vital deberían mantenerse aunque quien las recibe rechace ofertas de empleo adecuadas. | Rechazar ofertas de empleo no debería suponer perder el Ingreso Mínimo Vital. |
| Q35 | Habría que suprimir el Senado, aunque haga falta reformar la Constitución. | Habría que suprimir el Senado mediante una reforma de la Constitución. |

- Modo rápido: Q17 sustituye a Q08. Así hay al menos 1 pregunta de cada uno de los 8 bloques. La recuperación mínima con σ = 0,75 sube de 0,943 a 0,960.
- Las ayudas "¿Qué significa?" se reescribieron como efectos. "A favor" y "En contra" tienen la misma forma y una extensión parecida. Q23, Q25 y Q52 reciben los 2 argumentos.
- Las 8 cifras de contexto de los interludios citan fuentes públicas y no describen medidas de ningún partido.
- El glosario añade normas y fuentes en 5 términos y corrige "Pacto Verde Europeo" y "Concierto sanitario".
- El umbral de empate técnico baja del 80% al 70% de los remuestreos (metodología, 6.5).
- Si el 60% de las respuestas o más son «Neutral», el titular de resultados lo avisa (metodología, 6.12).

Simulación con estos datos (`npm run validar`, metodología 6.13):

| Prueba | Completo (39) | Rápido (24) |
|---|---|---|
| Autotest | 6 de 6; margen mínimo 2,2 puntos | 6 de 6; margen mínimo 1,9 puntos |
| Recuperación con σ = 0,75 | 0,990 a 1,000 | 0,960 a 0,999 |
| Recuperación con σ = 1,25 | 0,917 a 0,989 | 0,881 a 0,982 |
| Primer puesto con respuestas al azar | 10,5% a 28,4% | 11,0% a 25,7% |
| Empate técnico con el primero, σ = 1,25 | 9,4% | 18,9% |

## 1.0-rc2 (18/11/2026)

### Revisado

Adjudicación de las 55 celdas que la fusión automática marcó en las 40 preguntas:

| Caso | Celdas |
|---|---|
| Diferencia de 1 entre codificaciones | 16 |
| Diferencia de 2 o más | 2 |
| Una codificación nula y otra con valor | 15 |
| Solo hay codificación v1 | 22 |

- La adjudicación cambia el valor de 12 celdas y solo la confianza de 4. El resto confirma el valor provisional.
- La revisión por pregunta añade 3 cambios horizontales en celdas sin marca.
- Las celdas con valor pasan de 171 a 170. Por confianza: 91 alta, 62 media y 17 baja, frente a 92, 60 y 19.
- 10 celdas quedan marcadas `revisar_humano` para la versión 1.0.
- Cada decisión, con su motivo y su página, está en `data/extracted/adjudicacion.md`.

### Retirado

- Q10: "Las pensiones públicas deberían complementarse con un ahorro individual obligatorio en cuentas de capitalización." Queda con 2 partidos con posición.
- Q26: "La ley de violencia de género debería sustituirse por una ley de violencia intrafamiliar que no distinga por sexo." Queda con 2 partidos con posición.

El mínimo es de 3 partidos con posición (metodología, 4.1). Q26 era la única pregunta del bloque 4 en el modo rápido, y ese bloque se queda sin preguntas rápidas.

### Añadido

- Q44: "España debería oponerse al acuerdo comercial entre la Unión Europea y Mercosur."
- Cubre el ámbito 15 (agricultura), que no tenía ninguna pregunta.
- Posiciones: PP −1 (confianza baja), Vox +1 (media) y SALF +2 (alta). Entra en el modo rápido.
- Se eligió entre 3 candidatas de `agricultura.json`. Embalses y trasvases tenía 2 partidos con posición, y ayudas a explotaciones familiares también tenía 2.

### Cambiado

3 preguntas se reformularon como negaciones exactas, con el signo de sus posiciones invertido, para equilibrar la polaridad:

| Pregunta | Texto anterior | Texto nuevo | Polaridad |
|---|---|---|---|
| Q07 | El impuesto de sociedades debería bajar para atraer inversión. | El impuesto de sociedades debería mantenerse o subir. | D pasa a I |
| Q24 | Las ayudas como el Ingreso Mínimo Vital deberían retirarse a quien rechace ofertas de empleo adecuadas. | Las ayudas como el Ingreso Mínimo Vital deberían mantenerse aunque quien las recibe rechace ofertas de empleo adecuadas. | D pasa a I |
| Q29 | Debería ser más difícil obtener la nacionalidad española. | Los requisitos para obtener la nacionalidad española no deberían endurecerse. | D pasa a I |

- Q22 era candidata a la reformulación y se descartó. Podemos, Frente Amplio y PSOE no tienen posición en ella, así que invertirla no cambia el reparto I y D.
- La polaridad del banco queda en 17 I, 15 D y 7 T.
- El banco queda en 39 preguntas en modo completo y 24 en modo rápido.

Cobertura en las 39 preguntas:

| Partido | Posiciones documentadas |
|---|---|
| Frente Amplio | 29 |
| Podemos | 33 |
| PP | 27 |
| PSOE | 25 |
| SALF | 28 |
| Vox | 27 |

Simulación con estos datos (metodología, 6.13):

| Prueba | Completo (39) | Rápido (24) |
|---|---|---|
| Autotest | 6 de 6; margen mínimo 2,2 puntos | 6 de 6 |
| Recuperación con σ = 0,75 | 0,976 a 1,000 | 0,906 a 1,000 |
| Recuperación con σ = 1,25 | 0,892 a 0,994 | 0,818 a 0,996 |
| Primer puesto con respuestas al azar | 11,7% a 28,7% | 11,4% a 28,7% |

## 1.0-rc1 (18/11/2026)

### Añadido

- Extracción estructurada de los 6 informes: 326 páginas y 651 unidades, en `data/extracted/<partido>/informe.json`.
- Codificación v0 de 92 afirmaciones por un agente de IA por informe. 347 de 552 celdas con valor (62,9%) y 70 afirmaciones extra propuestas.
- Catálogo de 53 finalistas: 50 del catálogo inicial y 3 extra (cannabis, Senado y deuda autonómica).
- Codificación v1 a ciegas de las 53 finalistas por otro agente de IA por informe. 194 de 318 celdas con valor.
- Fusión automática de las 2 codificaciones y selección de 40 preguntas en modo completo y 24 en modo rápido.

### Datos de la versión

- Acuerdo entre codificaciones: cuando ambas dan valor, coinciden exactamente en el 88% de los casos y a 1 punto o menos en el 99%.
- El banco cubre 18 de los 19 ámbitos. Falta el 15 (agricultura): ninguna afirmación tenía ahí 3 partidos con posición.
- Polaridad: 14 I, 20 D y 6 T.
- Celdas: 240, de las que 171 tienen valor (92 alta, 60 media y 19 baja).
- 55 celdas quedan marcadas para adjudicación.

Cobertura en las 40 preguntas:

| Partido | Posiciones documentadas |
|---|---|
| Frente Amplio | 31 |
| Podemos | 34 |
| PP | 24 |
| PSOE | 26 |
| SALF | 29 |
| Vox | 27 |

Simulación con estos datos:

| Prueba | Completo (40) | Rápido (24) |
|---|---|---|
| Autotest | 6 de 6; margen mínimo 1,8 puntos | 6 de 6; margen mínimo 1,9 puntos |
| Recuperación con σ = 0,75 | 0,974 a 1,000 | 0,866 a 1,000 |
| Recuperación con σ = 1,25 | 0,928 a 0,997 | 0,754 a 0,989 |
| Primer puesto con respuestas al azar | 12,0% a 28,2% | 12,2% a 26,7% |
