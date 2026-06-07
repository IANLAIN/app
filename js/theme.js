/**
 * theme.js — Gestión centralizada de tema (claro/oscuro) y fuente dislexia
 * Exporta:
 *   - initTheme()       → configura toggles y aplica preferencias guardadas
 *   - applyThemePolicy()→ aplica restricciones por rol/neurotipo
 */

const STORAGE_THEME = "app-theme";
const STORAGE_FONT = "app-font";

// Obtener política de tema según rol y tipo de candidato
function getThemePolicy() {
  const userType = localStorage.getItem("app-user-type");
  const candidateType = localStorage.getItem("app-candidate-type");

  if (userType === "visitante" || userType === "empresa") {
    return { allowDark: true, allowToggle: true, enforced: null };
  }
  if (userType === "candidato" && candidateType === "down") {
    return { allowDark: false, allowToggle: false, enforced: "light" };
  }
  if (userType === "candidato" && (candidateType === "autismo" || candidateType === "tdah")) {
    return { allowDark: true, allowToggle: true, enforced: null };
  }
  return { allowDark: true, allowToggle: true, enforced: null };
}

// Aplicar tema visual al HTML y guardar en localStorage
function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_THEME, theme);

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀" : "☾";
    themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
}

// Aplicar política de tema (habilitar/deshabilitar toggle, forzar modo claro)
export function applyThemePolicy() {
  const policy = getThemePolicy();
  const themeToggle = document.getElementById("theme-toggle");

  if (themeToggle) {
    const hideToggle = !policy.allowToggle;
    themeToggle.classList.toggle("theme-toggle-hidden", hideToggle);
    themeToggle.setAttribute("aria-hidden", hideToggle ? "true" : "false");
    themeToggle.disabled = hideToggle;
  }

  if (policy.enforced) {
    applyTheme(policy.enforced);
    return;
  }

  const saved = localStorage.getItem(STORAGE_THEME);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = saved ? saved : (prefersDark ? "dark" : "light");

  if (initialTheme === "dark" && !policy.allowDark) {
    applyTheme("light");
  } else {
    applyTheme(initialTheme);
  }
}

// Configurar el toggle manual del usuario (solo si está permitido)
function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const policy = getThemePolicy();
    if (!policy.allowToggle) return;

    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

// Configurar el toggle de fuente dislexia
function setupDyslexicToggle() {
  const dyslexicToggle = document.getElementById("dyslexic-toggle");
  if (!dyslexicToggle) return;

  const applyFont = (isDyslexic) => {
    const html = document.documentElement;
    if (isDyslexic) {
      html.setAttribute("data-font", "dyslexic");
      localStorage.setItem(STORAGE_FONT, "dyslexic");
    } else {
      html.removeAttribute("data-font");
      localStorage.removeItem(STORAGE_FONT);
    }
    dyslexicToggle.setAttribute("aria-pressed", isDyslexic ? "true" : "false");
  };

  // Estado inicial
  const savedFont = localStorage.getItem(STORAGE_FONT);
  applyFont(savedFont === "dyslexic");

  dyslexicToggle.addEventListener("click", () => {
    const isCurrently = document.documentElement.getAttribute("data-font") === "dyslexic";
    applyFont(!isCurrently);
  });
}

// Inicialización completa (se llama una vez al cargar la página)
export function initTheme() {
  applyThemePolicy();
  setupThemeToggle();
  setupDyslexicToggle();

  // Reaccionar a cambios en el esquema de color del sistema
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const policy = getThemePolicy();
    if (!policy.allowDark) return;
    const saved = localStorage.getItem(STORAGE_THEME);
    if (!saved) {
      // Solo si el usuario no ha guardado una preferencia explícita
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  });
}

// Exponer applyThemePolicy globalmente para que pueda ser usado por el simulador
window.__applyThemePolicy = applyThemePolicy;