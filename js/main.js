import { changeLanguage } from './i18n.js';
import { initTheme, applyThemePolicy } from './theme.js';
import { initAiSim } from './ai-sim.js';
import { initSimulator } from './simulator.js';

// Inicialización global al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // 1. Tema y accesibilidad (fuente dislexia)
  initTheme();

  // 2. Simulador de perfiles (botón flotante)
  initSimulator();

  // 3. Componentes de IA simulada (gráficos, guías, chat, tareas)
  initAiSim(document);

  // 4. Idioma inicial (guardado o por defecto)
  initLanguage();

  // 5. Navegación móvil (toggle del menú)
  initMobileNav();

  // 6. Botones de cerrar sesión
  initLogout();

  // 7. Botones de simplificar instrucciones
  initSimplifyButtons();

  // 8. Tareas gamificadas (marcar como completadas)
  initTaskToggles();
});

// ─────────────────────────────────────────────────────────────
// Inicializar idioma desde localStorage o selector
function initLanguage() {
  const langSelect = document.getElementById('lang-select');
  if (!langSelect) return;

  const savedLang = localStorage.getItem('app-lang');
  const browserLang = navigator.language.slice(0, 2);
  const defaultLang = 'es';
  let initialLang = savedLang || (['es', 'en', 'fr', 'pt'].includes(browserLang) ? browserLang : defaultLang);

  langSelect.value = initialLang;
  changeLanguage(initialLang);

  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    localStorage.setItem('app-lang', newLang);
    changeLanguage(newLang);
  });
}

// ─────────────────────────────────────────────────────────────
// Menú hamburguesa para móvil
function initMobileNav() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const siteNav = document.querySelector('.site-nav');
  const headerActions = document.querySelector('.header-actions');
  const overlay = document.querySelector('.nav-overlay');

  if (!navToggle) return;

  // Crear overlay si no existe
  let navOverlay = overlay;
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
  }

  function closeMenu() {
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (navOverlay) navOverlay.style.display = '';
  }

  function openMenu() {
    document.body.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
    if (navOverlay) navOverlay.style.display = 'block';
  }

  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    if (isOpen) closeMenu();
    else openMenu();
  });

  navOverlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeMenu();
  });
}

// ─────────────────────────────────────────────────────────────
// Cierre de sesión: limpiar localStorage y redirigir al inicio
function initLogout() {
  const logoutBtns = document.querySelectorAll('[data-logout]');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('app-user-type');
      localStorage.removeItem('user_role');
      localStorage.removeItem('demo_session');
      localStorage.removeItem('app-candidate-type');
      // Redirigir a la raíz (index.html)
      const isInPages = window.location.pathname.includes('/pages/');
      window.location.href = isInPages ? '../index.html' : 'index.html';
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Botones que simplifican instrucciones (alternar entre texto original y simplificado)
function initSimplifyButtons() {
  const btns = document.querySelectorAll('[data-simplify]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;

      const original = target.getAttribute('data-original') || target.textContent.trim();
      const simplified = target.getAttribute('data-simplified') || original;
      const isSimplified = target.classList.contains('simplified');

      if (isSimplified) {
        target.textContent = original;
        target.classList.remove('simplified');
        btn.textContent = btn.getAttribute('data-simplify-label') || 'Simplificar instrucciones';
      } else {
        target.textContent = simplified;
        target.classList.add('simplified');
        btn.textContent = btn.getAttribute('data-original-label') || 'Ver texto completo';
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Tareas: marcar como completadas (toggle .is-complete)
function initTaskToggles() {
  const taskToggles = document.querySelectorAll('[data-task-toggle]');
  taskToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.task-card');
      if (!card) return;

      const isComplete = card.classList.toggle('is-complete');
      const progress = card.querySelector('progress');
      if (progress) {
        if (isComplete) {
          progress.setAttribute('data-orig-val', progress.value);
          progress.value = progress.max;
        } else {
          const orig = progress.getAttribute('data-orig-val');
          progress.value = orig ? parseFloat(orig) : 0;
        }
      }
      btn.textContent = isComplete ? 'Completada' : 'Completar';
      if (window.showToast) {
        window.showToast(isComplete ? '✅ Tarea completada' : 'Tarea restablecida', isComplete ? 'success' : 'info');
      }
    });
  });
}