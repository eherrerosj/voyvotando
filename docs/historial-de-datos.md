# Historial de datos

Este historial recoge los cambios de cada versión de los datos de Voy Votando. La versión vigente aparece en el pie de la web y en `src/content/meta.json`, junto con su huella SHA-256.

Cada enlace de resultado guarda la versión con la que se calculó. Si la versión cambia, la web recalcula el resultado con los datos nuevos y lo avisa (metodología, 6.24).

Las versiones siguen este formato: `1.0-rcN` para las candidatas y `1.0` para la publicada. Cada entrada separa lo añadido, lo cambiado, lo retirado y lo revisado.

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
