# incluIA | Documentación Técnica Completa 🧩
### Plataforma de Inclusión Laboral Neuro-Accesible

Esta documentación detalla la arquitectura, el funcionamiento y la estructura de archivos del proyecto **incluIA**. Diseñado específicamente para usuarios con autismo, síndrome de Down y otras condiciones intelectuales y psicosociales, priorizando la baja carga cognitiva y la accesibilidad técnica (WCAG 2.1).

---

## 🏗️ Arquitectura del Sistema: SPA Engine

incluIA funciona como una **Single Page Application (SPA)** ligera construida con Vanilla JavaScript, sin frameworks pesados. 

### El Ciclo de Vida (Main Flow)
1. **Shell (`index.html`)**: Es el contenedor principal que nunca se recarga. Contiene el Header, Footer y el contenedor `<main id="app">`.
2. **Router (`js/main.js`)**: 
   - Escucha los cambios en la URL (`popstate`) e intercepta los clics en enlaces con el atributo `data-nav`.
   - Utiliza la función `loadPage(path)` para buscar archivos HTML en la carpeta `pages/`.
   - Extrae el contenido del elemento `#page-content` del archivo solicitado y lo inyecta en el Shell.
   - Dispara animaciones de transición (fade + slide) y re-inicializa los componentes dinámicos.
3. **Persistencia**: El estado del tema (claro/oscuro), la fuente (dislexia) y el idioma se guardan en `localStorage` y se aplican automáticamente en cada carga de página.

---

## 📂 Estructura Detallada de Carpetas

### 🟢 Raíz
- `index.html`: Shell principal. Contiene la estructura global y carga los preloads de fuentes y páginas críticas.
- `README.md`: Esta documentación.

### 📁 `css/` (Diseño Atómico & Tokens)
- `styles.css`: **Cerebro visual**. Define todos los tokens (variables CSS), la escala tipográfica, el sistema de sombras, los keyframes de animación y el reset global.
- `components/`: Módulos específicos para reducir el tamaño del archivo principal:
  - `layout.css`: Header (glassmorphism), Footer y estructuras de grilla.
  - `buttons.css`: Estados de botones (hover, active, loading) con targets de 44px.
  - `cards.css`: Contenedores con elevación suave y bordes redondeados (`--radius-lg`).
  - `forms.css`: Estilos para inputs, validaciones visuales y feedback de error/éxito.
  - `charts.css`: Visualización de métricas y barras de progreso accesibles.
  - `chat.css`: Estilos para la interfaz de mentoría y burbujas de conversación.
  - `onboarding.css`: Estilos para el flujo de perfil sensorial del candidato.
  - `tasks.css`: Listas de tareas guiadas con bajo ruido visual.

### 📁 `js/` (Lógica Funcional)
- `main.js`: Orquestador SPA. Maneja el fetch de páginas, el historial de navegación y las animaciones de transición.
- `auth.js`: Integración con **Supabase Auth**. Maneja Google OAuth, login por correo y redirecciones basadas en roles.
- `theme.js`: Controlador de modos Visuales. Gestiona el cambio entre Light/Dark y el toggle de fuente para Dislexia.
- `i18n.js`: Motor de internacionalización. Contiene los diccionarios (ES, EN, FR, PT) y traduce el DOM dinámicamente.
- `navigation.js`: Lógica para el menú móvil y el manejo de enlaces internos.
- `ai-sim.js`: Simulador de lógica de emparejamiento (Match) y asistente de mentoría.
- `charts.js`: (Utility) Helpers para la representación visual de datos.

### 📁 `pages/` (Vistas Modulares)
*Cada archivo aquí contiene solo el fragmento dentro de `<div id="page-content">`.*
- `landing.html`: Página principal con propuesta de valor y estadísticas.
- `login.html` / `register.html`: Pantallas de acceso con validación en tiempo real.
- `dashboard-candidate.html`: Panel para el talento (tareas, perfil sensorial, progreso).
- `dashboard-company.html`: Panel para empresas (métricas ESG, match de candidatos).
- `mentoring.html`: Chat guiado y recursos de apoyo.
- `donate.html`: Información sobre impacto y formas de colaboración.

### 📁 `assets/` (Recursos Estáticos)
- `icons/`: SVGs optimizados (incluye el logo de Microsoft/Supabase y pictogramas accesibles).
- `images/`: Ilustraciones vectoriales de baja saturación para evitar sobrecarga sensorial.

---

## 🛠️ Funcionamiento de Componentes Críticos

### 1. Sistema de Colores (Zero Hardcoded)
No se permiten valores HEX o RGB directos en los archivos de componentes. Todo debe usar:
- `var(--bg-primary)`: Fondos principales (Crema o Azul Noche).
- `var(--text-primary)`: Texto de alto contraste (WCAG AAA).
- `var(--accent-1)`: Color de acción principal (calmante, no agresivo).

### 2. Motor de Traducción
El sistema busca elementos con el atributo `data-i18n="clave.valor"`. Al cambiar el idioma en el selector del header, `i18n.js` recorre el DOM y reemplaza el `textContent` basado en el diccionario seleccionado.

### 3. Integración Supabase
- **Redirects**: Al volver de un login de Google, el sistema detecta la sesión y redirige al usuario al Dashboard correcto según el rol guardado en `localStorage`.
- **Seguridad**: Se utiliza el cliente oficial de Supabase cargado vía CDN para manejar la persistencia del usuario.

---

## 📐 Estándares de Codificación
1. **HTML Semántico**: Uso estricto de `<main>`, `<section>`, `<article>`, `<nav>` para lectores de pantalla.
2. **CSS BEM-like**: Clases descriptivas que evitan colisiones de estilos.
3. **JS Modular**: Uso de `import/export` para mantener la lógica separada y testeable.
4. **Accesibilidad Cognitiva**: 
   - Interlineado de 1.8 para párrafos.
   - Fuentes Atkinson Hyperlegible.
   - Sin efectos de parpadeo o movimientos rápidos.
