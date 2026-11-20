# Arquitectura

Voy Votando es una web estática. No tiene servidor de aplicación ni base de datos, y todo el cálculo se hace en el navegador. Este documento describe la pila, el repositorio, el modelo de datos, el diseño y las pruebas.

Las secciones conservan la numeración que citan los comentarios del código: 7.x para diseño y 8.x para la parte técnica. La fórmula de puntuación está en la [metodología](metodologia.md).

## 8. Arquitectura técnica

### 8.1 Pila

| Capa | Elección | Versión | Motivo |
|---|---|---|---|
| Framework | Astro con salida estática | 7.4.5 | Páginas de contenido sin JavaScript y 2 islas React: el test y los resultados |
| Interactividad | React con TypeScript estricto | React 19.3.1, TypeScript 5.9.3 | Estado del test y página de resultados |
| Estilos | CSS con variables (tokens de 7.1) | | Sin dependencias de estilos |
| Gráficos | SVG propio en `charts.tsx` | | Cascada, mapa con elipse y mini barras, con control total de la accesibilidad |
| Tipografías | Archivo, Fraunces e Inter variables, alojadas en el propio sitio | `@fontsource-variable` 5.3.0 | Ninguna petición a servicios de fuentes externos |
| Datos | Python 3, solo con la biblioteca estándar | | Scripts de `data/extracted` y `scripts/export.py` |
| Pruebas | Vitest, fast-check, Playwright y axe-core | 5.1.0, 4.10.2, 1.64.1, 4.14.0 | Unidad, propiedades, recorridos y accesibilidad |
| Publicación | Cloudflare Workers con recursos estáticos, mediante Wrangler | 4.155.0 | CDN y HTTPS, sin servidor propio |

- Node.js 22.23.4 o posterior compila la web.
- Python 3 solo hace falta para regenerar los datos.
- La web se publica en [voyvotando.bull-labs.com](https://voyvotando.bull-labs.com).

### 8.2 Estructura del repositorio

```
data/reports/              6 informes en PDF (solo lectura)
data/extracted/            texto, extracción, codificaciones, adjudicación, banco y scripts
scripts/export.py          exporta data/extracted a src/content y aplica los controles de 8.4
scripts/copy-public-data.mjs copia los PDF y las unidades a public/ antes de dev y build
scripts/csp.mjs            escribe la cabecera CSP con los hashes de los scripts en línea (8.8)
scripts/validar.ts         simulación de votantes con el motor de la web (metodología, 6.13)
scripts/shots.mjs          recorrido con capturas en escritorio y móvil
scripts/responsive-qa.mjs  control de diseño adaptable y accesibilidad en 6 tamaños
src/content/               JSON exportados: parties, questions, questions_core, blocks, ambitos,
                           glossary, interludes, meta y units/<partido>.json
src/lib/types.ts           tipos del modelo de datos (8.3)
src/lib/scoring.ts         motor de puntuación (metodología, 6.1 a 6.24)
src/lib/state.ts           enlace de resultado y progreso del test (8.5)
src/lib/data.ts            datos completos para resultados y fichas
src/lib/data-core.ts       datos mínimos para el test, sin posiciones ni citas (8.6)
src/lib/format.ts          nombres y etiquetas de la interfaz
src/lib/*.test.ts          pruebas de Vitest
src/components/test/       Quiz.tsx: prioridades, preguntas, interludios y navegación
src/components/results/    Results.tsx, Sections.tsx y charts.tsx: las 10 secciones de 7.4
src/layouts/Base.astro     cabecera, pie y metadatos comunes
src/pages/                 index, test, resultados, partidos/, partidos/[id], metodologia, privacidad, 404
src/styles/global.css      tokens de diseño (7.1) y estilos base
public/_headers            cabeceras HTTP (8.8)
public/informes/           PDF de los informes, copiados en cada dev y build (no se versionan)
public/datos/              unidades de cada partido para carga bajo demanda (no se versionan)
docs/                      metodología, arquitectura, guía de adaptación e historial de datos
```

### 8.3 Modelo de datos

Los tipos están en `src/lib/types.ts`:

```ts
export const PARTY_IDS = ["fa", "podemos", "pp", "psoe", "salf", "vox"] as const;
export type PartyId = (typeof PARTY_IDS)[number];

export type Confidence = "alta" | "media" | "baja";
export type Rating = "Alta" | "Media" | "Baja" | "NE";
export type Scale = -2 | -1 | 0 | 1 | 2;
export type Axis = "ECO" | "SOC" | "TER" | "EUR";

/** Respuesta: valor de la escala, null si eligió "Prefiero no responder", ausente si no llegó. */
export type Answers = Partial<Record<string, Scale | null>>;

export interface Evidence {
  unitId: string | null;
  page: number | null;
  quote: string;
  sourceReport: PartyId;
}

export interface Position {
  value: Scale | null;
  confidence: Confidence | null;
  salience: Confidence | null;
  evidence: Evidence[];
  viability: Partial<Record<"A" | "B" | "C" | "E", Rating>>;
  rationale: string;
}

export interface Help {
  medida: string;
  ahora: string | null;
  aFavor: string | null;
  enContra: string | null;
  fuentes: { informe: PartyId; pagina: number }[];
}

export interface Question {
  id: string;
  order: number;
  block: number;
  ambito: number;
  text: string;
  axis: Axis | null;
  dir: 1 | -1 | 0;
  polarity: "I" | "D" | "T";
  fast: boolean;
  help: Help | null;
  positions: Record<PartyId, Position>;
}

export interface Scenario { label: string; definition: string }

export interface Agreement {
  counterpart: string;
  commonGround: string;
  frictions: string;
  documented: boolean;
}

export interface Party {
  id: PartyId;
  name: string;
  short: string;
  report: { title: string; version: string; cutoff: string; programDate: string; programTitle: string; pages: number; units: number; pdf: string };
  scenarios: { A: Scenario; B: Scenario; C: Scenario; E: { definition: string } };
  conclusions: { title: string; text: string }[];
  salienceByAmbito: Record<string, Confidence>;
  internalSupport: { area: string; evidence: string; limit: string }[];
  team: { name: string; role: string; trajectory: string }[];
  agreements: Agreement[];
  partners: PartyId[];
}

export interface Block { id: number; name: string; ambitos: number[] }
```

Otros 2 ficheros exportados tienen forma propia:

| Fichero | Campos |
|---|---|
| `src/content/units/<partido>.json` | `party`, `ambito`, `id`, `title`, `text`, `condition`, `A`, `B`, `C`, `E`, `figures` y `page` de cada una de las 651 unidades |
| `src/content/meta.json` | `version`, `sha256`, `questions`, `fast`, `parties`, `units`, `reportPages`, `cutoff`, `adjudicated` y `electionDate` |

`evidence.sourceReport` indica el informe de donde sale la cita. Es distinto del partido cuando la celda usa evidencia cruzada.

### 8.4 Exportación y controles de datos

`npm run data` ejecuta `python3 -I scripts/export.py`. El script hace 5 cosas:

1. Lee `banco_final.json`, `posiciones_adjudicadas.json` y los 6 `informe.json`.
2. Aplica `banco_ajustes.json`: retira preguntas, añade preguntas, sustituye textos y cambia qué preguntas van en el modo rápido.
3. Aplica `polaridad.json`: invierte el signo de las posiciones, la dirección del eje y la polaridad. También intercambia "A favor" y "En contra" en la ayuda.
4. Escribe `src/content/*.json` y las unidades de cada partido en `src/content/units/`.
5. Calcula la huella SHA-256 de todo el contenido exportado y la guarda en `meta.json`.

Antes de `npm run dev` y `npm run build`, `scripts/copy-public-data.mjs` copia los 6 PDF a `public/informes/<partido>.pdf` y las unidades a `public/datos/unidades-<partido>.json`. Así el repositorio no guarda 2 copias de cada fichero.

El script termina con error si falla cualquiera de estos controles:

- Una pregunta tiene menos de 3 partidos con posición.
- Una celda con valor no tiene cita, o su confianza no es alta, media ni baja.
- Una cita no aparece en su página del informe, ni en la página anterior o siguiente.
- El texto de una afirmación contiene el nombre de un partido o de una persona de la lista `FORBIDDEN_NAMES`.
- El total de unidades exportadas no es 651.

La búsqueda de citas normaliza el texto y une los saltos de línea. Si la cita no aparece literal, acepta la página cuando contiene todas sus palabras de más de 2 letras. Esa regla cubre las tablas a dos columnas, que intercalan líneas en el texto con maquetación.

### 8.5 Estado, enlace de resultado y compartir

- Las respuestas viven en memoria mientras dura el test.
- Una copia en `sessionStorage`, con la clave `voyvotando:progreso`, permite retomar el test tras recargar. Cada lectura y escritura va dentro de try/catch, y el test funciona sin almacenamiento.
- Al terminar, el test borra esa copia y abre `/resultados` con el estado en el fragmento de la URL.

Formato del fragmento:

```
#v=<versión de datos>&m=<c|r>&p=<bloques prioritarios separados por coma>&r=<respuestas>
```

- `m` es el modo: `c` completo o `r` rápido.
- `r` codifica cada pregunta, en el orden del banco, como un dígito en base 6. El 0 es sin respuesta y del 1 al 5 van de −2 a +2. El número resultante se escribe en base 36.
- Las 39 respuestas caben en 20 caracteres.
- El navegador no envía el fragmento al servidor. Quien recibe el enlace sí ve las respuestas, y la web lo avisa.
- Si la versión del enlace no es la vigente, la página recalcula con los datos nuevos y lo avisa (metodología, 6.24).

Otras formas de compartir:

| Función | Cómo funciona |
|---|---|
| Copiar enlace | Copia la URL con el fragmento al portapapeles |
| Imagen | Un `canvas` de 1200 × 630 píxeles dibuja el podio, la versión de los datos y la dirección de la web. No lleva respuestas. |
| Comparar con otra persona | Se pega el enlace de otra persona y el navegador calcula la afinidad entre ambas (metodología, 6.19) |
| Imprimir | El botón "Imprimir o guardar en PDF" usa la hoja de estilos de impresión |

### 8.6 Rendimiento

- La página del test importa `questions_core.json`, que no lleva posiciones ni citas. Pesa 38 KB sin comprimir y unos 10 KB con gzip.
- La página de resultados importa `questions.json` completo, con 174 KB sin comprimir y unos 32 KB con gzip.
- Con la compilación actual, el test descarga unos 85 KB de JavaScript con gzip y resultados unos 135 KB. Esas cifras incluyen los datos que importa cada página.
- La sección "Si gobiernan" carga solo las unidades del partido elegido, desde `/datos/unidades-<partido>.json`. Las de otro partido llegan al seleccionarlo.
- Las fuentes se sirven en woff2 por subconjuntos de caracteres, con `font-display: swap`.
- El bootstrap de 1.000 remuestreos cuesta 234.000 sumas y se hace en el navegador.
- `public/_headers` marca los ficheros de `/_astro/` como inmutables durante 1 año.

### 8.7 Analítica

No hay analítica, ni cookies, ni anuncios, ni scripts de terceros. La web no registra respuestas ni resultados y no publica datos agregados de uso.

### 8.8 Seguridad y privacidad técnica

`public/_headers` aplica estas cabeceras a todas las rutas:

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`, `connect-src 'self'`, `script-src 'self'` más el hash SHA-256 de cada script en línea, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Cache-Control` | `public, max-age=0, must-revalidate, no-transform`. En `/_astro/` se sustituye por `public, max-age=31536000, immutable`. |

`no-transform` impide que el proveedor modifique el HTML. Cloudflare Web Analytics inserta su script en cada página cuando está activo en la zona DNS, y con esta directiva no lo hace. La CSP bloquearía ese script igualmente, pero dejaría un error en la consola.

`public/_headers` lleva el marcador `__CSP__`. Tras `astro build`, `scripts/csp.mjs` calcula el hash de los 3 scripts en línea que genera Astro y escribe la política en `dist/_headers`. Así ningún otro script se ejecuta, aunque alguien consiga inyectarlo. `connect-src 'self'` impide que el código envíe datos a otro dominio.

Garantías de privacidad del diseño:

- Ninguna respuesta sale del navegador. La página de resultados solo pide las unidades de un partido, y esa petición no lleva respuestas.
- Las opiniones políticas son datos de categoría especial (artículo 9 del RGPD). El diseño evita tratarlas: no hay servidor que las reciba.
- No hay formularios ni contenido de personas usuarias.
- Los PDF de los informes se sirven desde el propio sitio.

## 7. Experiencia de usuario y diseño

### 7.1 Tokens de color y tipografía

Inspiración visual: politicalplaylist.com.

Los tokens están en `src/styles/global.css`. Los contrastes siguen la fórmula de WCAG 2.2. El nivel AA exige 4,5:1 para texto normal y 3:1 para gráficos.

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#f3efe3` | Fondo | |
| `--ink` | `#444444` | Texto de cuerpo | 8,47 sobre papel |
| `--ink-strong` | `#1f1f1f` | Titulares, bordes y foco | 14,34 sobre papel |
| `--muted` | `#6b6b6b` | Texto secundario | 4,64 sobre papel |
| `--orange` | `#f6581e` | Rellenos y la persona usuaria | 2,88 sobre papel, así que no se usa para texto. `#1f1f1f` sobre naranja da 4,97. |
| `--orange-text` | `#b8410f` | Texto naranja y enlaces | 4,81 sobre papel |
| `--teal` | `#79ada6` | Fondo de sección | `#1f1f1f` sobre teal da 6,55 |
| `--pink` | `#efcabb` | Fondo de sección | `#1f1f1f` sobre rosa da 10,86 |
| `--surface` | `#faf8f2` | Tarjetas y sección "Por qué" | `#444444` sobre superficie da 9,17 |
| `--party` | `#444444` | Todos los partidos, con el mismo color | |
| `--match` | `#3d7a72` | Puntos a favor en las contribuciones | 4,68 sobre superficie; 4,32 sobre papel, solo en gráficos |
| `--clash` | `#b8410f` | Puntos en contra | 5,20 sobre superficie |

Ajustes por contexto:

- Pie y sección de precisión: texto `#f3efe3` sobre `#444444` (8,47) y enlaces `#ffb08f` (5,50).
- Sección rosa: `--muted` pasa a `#4f4f4f` (5,40) y `--orange-text` a `#8f3009` (5,33).
- Sección teal: `--muted` pasa a `#1f1f1f` (6,55) y `--orange-text` a `#5c1f06` (5,04).
- El fondo del test cambia de tinte por bloque: `#efcabb`, `#cfe3df` y `#fbd9c8`. En esos fondos, `--muted` es `#4f4f4f` (5,40 a 6,19) y `--orange-text` es `#8f3009` (5,33 a 6,11).

Modo oscuro, con `prefers-color-scheme: dark` o `data-theme="dark"`:

| Token | Valor | Contraste sobre `#1c1b19` |
|---|---|---|
| `--paper` | `#1c1b19` | |
| `--ink` | `#e6e1d4` | 13,18 |
| `--ink-strong` | `#f3efe3` | 14,97 |
| `--muted` | `#a8a296` | 6,78 |
| `--orange-text` | `#ff7a45` | 6,66 |
| `--match` | `#8fc3bb` | 8,76 |
| `--party` | `#d8d2c4` | 11,42 |
| `--teal` | `#2f4f4b` | Fondo: `--ink` encima da 6,87 |
| `--pink` | `#4a3730` | Fondo: `--ink` encima da 8,55 |
| `--surface` | `#24231f` | Fondo de tarjetas |

Tipografía:

| Uso | Fuente | Ajustes |
|---|---|---|
| Rótulos y cifras grandes | Archivo variable | Anchura 125%, peso 700, mayúsculas |
| Afirmaciones y titulares de sección | Fraunces variable | Peso 600. La afirmación va de 26 a 42 px según el ancho. |
| Texto de cuerpo | Inter variable | 17 px, interlineado 1,55 |

Otros tokens:

- Los botones son cuadrados, con borde de 5 px y texto en mayúsculas. La flecha se desplaza 10 px al pasar el ratón.
- Las transiciones duran 0,4 s con `cubic-bezier(0.4, 0, 0.2, 1)`. Con `prefers-reduced-motion` se desactivan todas.
- El espaciado es de 50 px entre columnas y 80 px en vertical. El margen lateral es de 16 px en móvil y 32 px desde 760 px de ancho.
- El ancho máximo del contenido es de 1.180 px.

### 7.2 Neutralidad visual

- Los 6 partidos aparecen con el mismo color neutro y sus siglas en texto. No hay logos ni colores de partido.
- La persona usuaria es el único elemento naranja del resultado: su punto en el mapa y su respuesta en las comparaciones.
- Las listas que no se ordenan por afinidad van en orden alfabético: Frente Amplio, Podemos, PP, PSOE, SALF y Vox.

### 7.3 Pantallas

| Ruta | Contenido |
|---|---|
| `/` | Portada con el modo completo (39 preguntas) y el modo rápido (24), qué se vota, de dónde salen los datos y qué partidos entran |
| `/test` | Prioridades, preguntas, interludios entre bloques y navegación |
| `/resultados` | Página de 10 secciones (7.4) |
| `/partidos` y `/partidos/<id>` | Ficha de cada partido: escenarios, prioridades, respaldo, equipo, acuerdos y cercanía con los demás |
| `/metodologia` | Fuentes, reglas de codificación, fórmula, margen de error, validación y límites |
| `/privacidad` | Qué datos se tratan y cuáles no |

En el test, cada pregunta muestra el bloque, el número y el porcentaje completado. Hay 3 controles más: avance automático (activado por defecto), una rejilla con los números de las preguntas y un botón para reiniciar.

### 7.4 Página de resultados

Las 10 secciones van en un solo scroll y cada una tiene un ancla.

| Nº | Ancla | Sección | Fondo | Pregunta que responde |
|---|---|---|---|---|
| 1 | `#titular` | Titular | Naranja | ¿Con quién coincido más? |
| 2 | `#podio` | Podio | Papel | ¿Cómo quedan los 6? |
| 3 | `#por-que` | Por qué | Superficie | ¿Qué preguntas deciden mi resultado? |
| 4 | `#mapa` | Mapa | Teal | ¿Dónde estoy frente a los partidos? |
| 5 | `#temas` | Por temas | Papel | ¿Mi resultado cambia según el tema? |
| 6 | `#inesperadas` | Coincidencias inesperadas | Rosa | ¿En qué coincido con partidos lejanos? |
| 7 | `#si-gobiernan` | Si gobiernan | Papel | ¿Qué podría aprobarse de lo que comparto? |
| 8 | `#pactos` | Pactos | Teal | ¿Qué pasa con mis ideas si ese partido pacta? |
| 9 | `#preguntas` | Pregunta a pregunta | Papel | ¿Qué dice cada programa exactamente? |
| 10 | `#precision` | Precisión y siguiente paso | `#444444` | ¿Cuánto me puedo fiar y qué hago ahora? |

Reglas comunes:

- Las secciones 3, 7 y 8 se calculan para los 6 partidos, y un selector permite verlos todos.
- Antes de esta página no se revela ninguna afinidad parcial.
- La sección 9 enlaza cada cita con su página del PDF, con `#page=<n>`.
- La página nunca tiene scroll horizontal. En móvil las secciones se apilan.

### 7.5 Textos de la interfaz

- La web trata a la persona de tú. Los adjetivos describen y no valoran.
- Los resultados hablan de "afinidad" y "coincidencia". No usan "tu partido" ni "deberías votar".
- Una línea fija en el titular recuerda: "Mide coincidencias con programas. No es una recomendación de voto."

### 7.6 Accesibilidad (WCAG 2.2 AA)

- Cada pregunta es un `radiogroup` con etiquetas, y el progreso se anuncia con `aria-live="polite"`.
- El foco visible es un contorno de 3 px en `--ink-strong`. Hay un enlace "Saltar al contenido".
- El test se completa solo con teclado: teclas 1 a 5 para responder, 0 para saltar y flechas para navegar.
- Los botones miden al menos 48 px de alto. En pantallas táctiles, los chips y botones pequeños miden al menos 44 px.
- Se respetan `prefers-reduced-motion` y `prefers-color-scheme`.

## 10. Pruebas

| Orden | Qué hace | Cuándo usarla |
|---|---|---|
| `npm test` | Vitest con 31 pruebas: 27 del motor de puntuación y 4 del enlace de resultado | En cada cambio |
| `npm run check` | `astro check`: tipos de TypeScript y de los componentes Astro | En cada cambio |
| `npm run data` | Exportación con los controles de 8.4 | Tras tocar `data/extracted` |
| `npm run build` | Web estática en `dist/` | Antes de publicar |
| `npm run qa:responsive -- <url> <carpeta>` | Control de diseño adaptable y accesibilidad | Antes de publicar, con `npm run preview` en marcha |
| `npm run shots -- <url> <carpeta>` | Recorrido completo con capturas | Tras cambios de interfaz |

Las pruebas del motor (`src/lib/scoring.test.ts`) cubren:

- La tabla de acuerdo de 6.2 y su simetría.
- Los pesos de prioridad ×2,0, ×1,5 y ×1,2.
- El ejemplo resuelto de 6.14 y la descomposición exacta $S_k = 50 + \sum \delta$.
- Propiedades con fast-check: afinidad entre 0 y 100, monotonía y que saltar una pregunta sin posición no cambie nada.
- El autotest con los 6 partidos y la recuperación con ruido σ = 0,75 (umbral 0,95).
- El bootstrap determinista, los ejes, las bisagras, la sensibilidad y las funciones de 6.19 a 6.23.

`npm run qa:responsive` recorre todas las páginas en 6 tamaños, de 360 a 1.024 px de ancho:

- Mide el scroll horizontal y los textos cortados.
- Detecta la letra de menos de 12 px y las zonas de toque de menos de 24 px.
- Detecta desplegables que provocan zoom en iOS.
- Pasa axe con las reglas `wcag2a`, `wcag2aa`, `wcag21aa` y `wcag22aa`.
- Deja un `report.json` y capturas en la carpeta indicada.

`npm run shots` recorre la portada, las prioridades, el test completo y los resultados con Playwright. Lo hace en escritorio (1.366 × 900) y en móvil (390 × 844), guarda capturas y anota los errores de consola.

## Licencia

El código se publica con licencia AGPL-3.0. Los datos, los informes y las codificaciones se publican con licencia CC BY 4.0.
