// index-app.js - Landing page con autenticación real y wizard de registro
import { registerUser, loginUser, signInWithGoogle } from './auth.js';
import { initTheme } from './theme.js';
import { changeLanguage } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tema, accesibilidad e idioma
  initTheme();
  initLanguage();

  // Inicializar modal y wizard
  initModalAndWizard();

  // Inicializar gráfico radar (si existe)
  initRadarChart();

  // Inicializar botones de demostración rápida
  initDemoButtons();

  // Inicializar controles de accesibilidad adicionales (tamaño texto, contraste, ocultar imágenes)
  initAccessibilityControls();
});

// ─────────────────────────────────────────────────────────────
// Idioma inicial y cambio dinámico
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
// Modal, tabs y wizard de registro (4 pasos)
function initModalAndWizard() {
  const modal = document.getElementById('auth-modal');
  const modalClose = document.getElementById('modal-close');
  const openBtns = document.querySelectorAll('[data-open-modal]');
  const tabs = document.querySelectorAll('.modal-tab');
  const panels = document.querySelectorAll('.modal-panel');
  const switchLinks = document.querySelectorAll('[data-switch-tab]');

  if (!modal) return;

  function openModal(tabId) {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    switchTab(tabId);
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    resetWizard();
  }

  function switchTab(tabId) {
    tabs.forEach(t => {
      const active = t.getAttribute('data-tab') === tabId;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    panels.forEach(p => {
      const active = p.id === `panel-${tabId}`;
      p.classList.toggle('active', active);
    });
    if (tabId === 'register') goToStep(1);
  }

  function resetWizard() {
    goToStep(1);
    selectedRole = null;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    const btnStep2 = document.getElementById('btn-to-step2');
    if (btnStep2) btnStep2.disabled = true;
    const companyFields = document.getElementById('company-fields');
    if (companyFields) companyFields.style.display = 'none';
    const regForm = document.getElementById('register-form');
    if (regForm) regForm.reset();
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.getAttribute('data-open-modal'));
    });
  });
  modalClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
  });
  switchLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.getAttribute('data-switch-tab'));
    });
  });

  // Wizard state
  let currentStep = 1;
  let selectedRole = null; // 'candidate' o 'company'
  const roleCards = document.querySelectorAll('.role-card');
  const btnToStep2 = document.getElementById('btn-to-step2');
  const backToStep1 = document.getElementById('back-to-step1');
  const backToStep2 = document.getElementById('back-to-step2');
  const regForm = document.getElementById('register-form');
  const btnToStep4 = document.getElementById('btn-to-step4');
  const dots = document.querySelectorAll('.prog-dot');
  const steps = document.querySelectorAll('.wizard-step');

  function goToStep(step) {
    currentStep = step;
    steps.forEach((s, idx) => s.classList.toggle('active', idx + 1 === step));
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 <= step));
    if (step === 3 && window.radarChart) setTimeout(() => window.radarChart.resize(), 50);
  }

  // Selección de rol (paso 1)
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRole = card.getAttribute('data-role');
      if (btnToStep2) btnToStep2.disabled = false;
      const companyFields = document.getElementById('company-fields');
      if (companyFields) companyFields.style.display = selectedRole === 'company' ? 'block' : 'none';
    });
  });

  btnToStep2?.addEventListener('click', () => { if (selectedRole) goToStep(2); });
  backToStep1?.addEventListener('click', () => goToStep(1));

  // Envío del formulario de registro (paso 2)
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const password = document.getElementById('reg-password')?.value;
      const statusDiv = document.getElementById('register-status');

      if (!name || !email || !password) {
        showFormError('Por favor completa todos los campos.', statusDiv);
        return;
      }
      if (password.length < 8) {
        showFormError('La contraseña debe tener al menos 8 caracteres.', statusDiv);
        return;
      }
      if (selectedRole === 'company') {
        const companyName = document.getElementById('reg-company')?.value.trim();
        if (!companyName) {
          showFormError('Ingresa el nombre de la empresa.', statusDiv);
          return;
        }
      }

      // Guardar datos temporalmente para el paso 4
      localStorage.setItem('reg_temp_name', name);
      localStorage.setItem('reg_temp_email', email);
      localStorage.setItem('reg_temp_password', password);
      localStorage.setItem('reg_temp_role', selectedRole);
      if (selectedRole === 'company') {
        localStorage.setItem('reg_temp_company', document.getElementById('reg-company').value.trim());
      }

      if (selectedRole === 'candidate') {
        goToStep(3); // ir a radar
      } else {
        // Empresa salta el radar
        goToStep(4);
        document.getElementById('verify-email-display').textContent = email;
      }
    });
  }

  backToStep2?.addEventListener('click', () => goToStep(2));

  // Botón Finalizar (paso 3 -> paso 4)
  btnToStep4?.addEventListener('click', () => {
    goToStep(4);
    const email = localStorage.getItem('reg_temp_email') || '';
    document.getElementById('verify-email-display').textContent = email;
  });

  // Botón "Ir a mi panel" (paso 4) -> realiza el registro real
  const goToDashboardBtn = document.getElementById('go-to-dashboard');
  if (goToDashboardBtn) {
    goToDashboardBtn.addEventListener('click', async () => {
      const name = localStorage.getItem('reg_temp_name');
      const email = localStorage.getItem('reg_temp_email');
      const password = localStorage.getItem('reg_temp_password');
      const role = localStorage.getItem('reg_temp_role');
      const companyName = localStorage.getItem('reg_temp_company');

      try {
        let additional = {};
        let finalName = name;
        if (role === 'company') {
          additional = { contactName: name, industry: '' };
          finalName = companyName || name;
        }
        const newUser = registerUser(email, password, finalName, role, additional);
        // Limpiar temporales
        ['reg_temp_name', 'reg_temp_email', 'reg_temp_password', 'reg_temp_role', 'reg_temp_company'].forEach(k => localStorage.removeItem(k));
        // Redirigir al dashboard correspondiente
        if (newUser.role === 'candidate') window.location.href = 'pages/dashboard-candidate.html';
        else window.location.href = 'pages/dashboard-company.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  function showFormError(msg, statusDiv) {
    if (statusDiv) {
      statusDiv.textContent = msg;
      statusDiv.classList.add('msg-error');
      statusDiv.removeAttribute('hidden');
      setTimeout(() => statusDiv.setAttribute('hidden', ''), 3000);
    } else alert(msg);
  }

  // Toggle contraseña
  ['login', 'reg'].forEach(prefix => {
    const eye = document.getElementById(`${prefix}-eye-btn`);
    const input = document.getElementById(`${prefix}-password`);
    if (eye && input) {
      eye.addEventListener('click', () => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
      });
    }
  });

  // Botones de Google
  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch(e) { alert(e.message); }
  });
  document.getElementById('google-register-btn')?.addEventListener('click', async () => {
    try { await signInWithGoogle(); } catch(e) { alert(e.message); }
  });

  // Login real con auth.js
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        const user = loginUser(email, password);
        if (loginStatus) {
          loginStatus.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
          loginStatus.classList.add('msg-success');
          loginStatus.removeAttribute('hidden');
        }
        setTimeout(() => {
          if (user.role === 'candidate') window.location.href = 'pages/dashboard-candidate.html';
          else window.location.href = 'pages/dashboard-company.html';
        }, 800);
      } catch (err) {
        if (loginStatus) {
          loginStatus.textContent = err.message;
          loginStatus.classList.add('msg-error');
          loginStatus.removeAttribute('hidden');
        }
      }
    });
  }

  // Botones demo dentro del modal
  document.getElementById('demo-candidate-btn')?.addEventListener('click', () => {
    try { loginUser('carlos@example.com', 'candidate123'); } catch(e) {}
    window.location.href = 'pages/dashboard-candidate.html';
  });
  document.getElementById('demo-company-btn')?.addEventListener('click', () => {
    try { loginUser('empresa@example.com', 'company123'); } catch(e) {}
    window.location.href = 'pages/dashboard-company.html';
  });
}

// ─────────────────────────────────────────────────────────────
// Gráfico radar para el paso 3 (candidatos)
function initRadarChart() {
  const canvas = document.getElementById('radarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Procesamiento', 'Ambiental', 'Ejecución', 'Ajustes'],
      datasets: [{
        label: 'Perfil',
        data: [5, 5, 5, 5],
        backgroundColor: 'rgba(210, 227, 198, 0.5)',
        borderColor: '#4a3311',
        pointBackgroundColor: '#d2e3c6',
        pointBorderColor: '#4a3311',
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { r: { min: 1, max: 10, ticks: { stepSize: 1, backdropColor: 'transparent' } } },
      plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } }
    }
  });
  window.radarChart = radarChart;

  const sliders = ['axis1', 'axis2', 'axis3', 'axis4'];
  sliders.forEach((id, idx) => {
    const slider = document.getElementById(id);
    const valSpan = document.getElementById(`val${idx+1}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (valSpan) valSpan.textContent = val;
        radarChart.data.datasets[0].data[idx] = val;
        radarChart.update();
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Botones de demostración rápida (fuera del modal)
function initDemoButtons() {
  const extraCandidate = document.querySelector('.btn-demo-candidato');
  const extraCompany = document.querySelector('.btn-demo-empresa');
  extraCandidate?.addEventListener('click', () => {
    try { loginUser('carlos@example.com', 'candidate123'); } catch(e) {}
    window.location.href = 'pages/dashboard-candidate.html';
  });
  extraCompany?.addEventListener('click', () => {
    try { loginUser('empresa@example.com', 'company123'); } catch(e) {}
    window.location.href = 'pages/dashboard-company.html';
  });
}

// ─────────────────────────────────────────────────────────────
// Controles de accesibilidad (tamaño texto, contraste manual, ocultar imágenes)
function initAccessibilityControls() {
  const fontSizeSlider = document.getElementById('fontSize-slider');
  const contrastToggle = document.getElementById('contrast-toggle');
  const hideImagesToggle = document.getElementById('hide-images-toggle');

  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', (e) => {
      document.body.classList.remove('font-size-1', 'font-size-2', 'font-size-3');
      document.body.classList.add(`font-size-${e.target.value}`);
      localStorage.setItem('app-font-size', e.target.value);
    });
    const savedSize = localStorage.getItem('app-font-size');
    if (savedSize) {
      fontSizeSlider.value = savedSize;
      document.body.classList.add(`font-size-${savedSize}`);
    }
  }

  if (contrastToggle) {
    contrastToggle.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('app-theme', theme);
      const globalThemeToggle = document.getElementById('theme-toggle');
      if (globalThemeToggle) {
        globalThemeToggle.textContent = theme === 'dark' ? '☀' : '☾';
        globalThemeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      }
    });
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') contrastToggle.checked = true;
  }

  if (hideImagesToggle) {
    hideImagesToggle.addEventListener('change', (e) => {
      if (e.target.checked) document.body.classList.add('hide-images');
      else document.body.classList.remove('hide-images');
      localStorage.setItem('hide-images', e.target.checked);
    });
    const savedHide = localStorage.getItem('hide-images') === 'true';
    if (savedHide) {
      hideImagesToggle.checked = true;
      document.body.classList.add('hide-images');
    }
  }
}