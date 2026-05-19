# incluIA

incluIA es una plataforma de inclusion laboral construida como SPA ligera con HTML, CSS y JavaScript modular. El sitio prioriza accesibilidad, claridad visual y adaptacion por perfil de usuario, con controles de idioma, tema y preferencias almacenadas en localStorage.

## Arquitectura y flujo principal

El contenedor principal es index.html y el contenido de cada vista vive en la carpeta pages/. El router en js/main.js intercepta enlaces con data-nav, carga el HTML correspondiente y reemplaza el contenido de #page-content sin recargar toda la pagina. El sistema re-inicializa los modulos necesarios en cada cambio de vista.

## Estructura del proyecto

Raiz
- index.html: shell principal del sitio.
- README.md: descripcion tecnica.

css/
- styles.css: variables de tema, tipografia, y estilos globales.
- components/: estilos por modulo (layout, botones, tarjetas, formularios, charts, chat, onboarding y tareas).

js/
- main.js: orquestacion SPA y control de rutas.
- auth.js: autenticacion simulada, validacion y redireccion por rol.
- theme.js: manejo de tema y fuente para dislexia.
- i18n.js: diccionarios y aplicacion de traducciones.
- navigation.js: manejo de enlaces y menu movil.
- ai-sim.js: simulaciones UI para guias, chat y graficos.
- onboarding.js: flujo del cuestionario.

pages/
- login.html, register.html: acceso y registro.
- dashboard-candidate.html: panel de candidato.
- dashboard-company.html: panel de empresa.
- mentoring.html: chat y apoyo.
- donate.html: informacion de apoyo.
- why.html: informacion institucional.

assets/
- icons/ e images/: recursos estaticos del sitio.

## Internacionalizacion

Los textos traducibles usan data-i18n y se reemplazan desde js/i18n.js. El selector de idioma actualiza el contenido y el atributo lang del documento.

## Temas y accesibilidad

El tema se guarda en localStorage y se ajusta segun el perfil. El sitio respeta prefers-reduced-motion, usa foco visible y mantiene contraste adecuado. La tipografia y el espaciado estan definidos para lectura clara.
