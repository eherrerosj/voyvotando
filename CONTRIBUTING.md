# Cómo contribuir

Gracias por querer mejorar Voy Votando. Hay 3 formas de ayudar, de la más urgente a la menos.

## 1. Corregir una posición

Es la contribución más valiosa. Cada posición de partido sale de un informe y lleva una cita con su página. Si crees que una está mal:

1. Abre la vista "Pregunta a pregunta" de tus resultados y despliega "Qué dice cada informe".
2. Comprueba la cita y su página en el PDF.
3. Abre un issue con la plantilla [Corrección de una posición](https://github.com/eherrerosj/voyvotando/issues/new?template=correccion-posicion.yml) e incluye la cita que respalda la corrección.

Una corrección se acepta si una cita del informe la respalda. La opinión sobre un partido no basta, en ningún sentido.

## 2. Avisar de un error o proponer una mejora

- [Error en la web](https://github.com/eherrerosj/voyvotando/issues/new?template=error-web.yml): incluye dispositivo, navegador y pasos.
- [Propuesta de mejora](https://github.com/eherrerosj/voyvotando/issues/new?template=propuesta.yml): explica qué problema resuelve.
- Fallos de seguridad o privacidad: en privado, según [SECURITY.md](SECURITY.md).

## 3. Contribuir código o datos

Requisitos: Node.js 22.23 o posterior. Python 3 solo para regenerar los datos.

```sh
npm ci
npm run dev            # http://localhost:4321
npm test               # motor de puntuación y enlace de resultado
npm run check          # tipos
npm run build          # web estática en dist/
```

Antes de abrir un pull request:

- Lee las reglas de neutralidad y privacidad de [AGENTS.md](AGENTS.md). Valen igual para personas y para agentes de IA.
- Si cambias datos en `data/extracted`, ejecuta `npm run data`. Falla si una cita no aparece en su página. Anota el cambio en [docs/historial-de-datos.md](docs/historial-de-datos.md).
- Si cambias la interfaz, ejecuta `npm run preview` y después `npm run qa:responsive -- http://127.0.0.1:4321 qa`. El informe debe salir sin hallazgos.
- La CI repite estas comprobaciones en cada pull request.

## Lo que no aceptamos

- Rastreadores, analítica, cookies, anuncios, scripts de terceros o cualquier envío de respuestas a un servidor.
- Cambios que traten a un partido con un criterio distinto al del resto.
- Datos agregados de uso publicados en la web.

## Licencias

Al contribuir aceptas que tu código se publique con [AGPL-3.0](LICENSE) y tus datos con [CC BY 4.0](LICENSE-DATA). Este proyecto sigue un [código de conducta](CODE_OF_CONDUCT.md).
