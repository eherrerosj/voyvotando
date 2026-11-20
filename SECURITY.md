# Seguridad y privacidad

Voy Votando promete que ninguna respuesta sale del navegador. Cualquier fallo que rompa esa promesa se trata como un fallo de seguridad.

## Qué nos interesa

- Cualquier forma en que las respuestas o el resultado lleguen a un servidor o a un tercero.
- Scripts, recursos o conexiones de terceros que salten la cabecera CSP.
- Inyección de código (XSS) a través del enlace de resultado o de los datos.
- Datos manipulados que cambien el resultado sin pasar por las comprobaciones de `npm run data`.

## Cómo avisar

Abre un aviso privado en [Security → Report a vulnerability](https://github.com/eherrerosj/voyvotando/security/advisories/new). No abras un issue público.

Indica los pasos para reproducirlo y el navegador. La respuesta llega en 72 horas como máximo. Cuando haya arreglo, el aviso se publica con crédito para quien lo encontró, si lo desea.

## Versiones cubiertas

Solo la versión publicada en [voyvotando.bull-labs.com](https://voyvotando.bull-labs.com) y la rama `main`.
