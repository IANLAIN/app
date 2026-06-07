/**
 * simulator.js — Panel flotante de simulación de perfiles
 */

let simulatorInitialized = false;

export function initSimulator() {
  if (simulatorInitialized) return;
  simulatorInitialized = true;

  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  if (!document.getElementById('profile-simulator-trigger')) {
    const trigger = document.createElement('button');
    trigger.id = 'profile-simulator-trigger';
    trigger.className = 'sim-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Abrir simulador de perfiles adaptativos');
    trigger.innerHTML = `<strong>Simular Perfiles</strong>`;
    document.body.appendChild(trigger);
  }

  if (!document.getElementById('profile-simulator-panel')) {
    const panel = document.createElement('div');
    panel.id = 'profile-simulator-panel';
    panel.className = 'sim-panel';
    panel.innerHTML = `
      <div class="sim-header">
        <h3>Simulador de Adaptabilidad</h3>
        <button type="button" class="sim-close" id="profile-simulator-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="sim-section">
        <label>Rol Principal / Perfil</label>
        <div class="sim-grid" id="sim-role-grid">
          <button type="button" class="sim-btn" data-role="candidato">Candidato</button>
          <button type="button" class="sim-btn" data-role="empresa">Empresa Aliada</button>
          <button type="button" class="sim-btn" data-role="visitante">Visitante</button>
        </div>
      </div>
      <div class="sim-section" id="sim-cand-section" style="display: none;">
        <label>Neurotipo (Adaptación Visual)</label>
        <div class="sim-grid" id="sim-cand-grid">
          <button type="button" class="sim-btn" data-cand-type="autismo">Autismo</button>
          <button type="button" class="sim-btn" data-cand-type="tdah">TDAH</button>
          <button type="button" class="sim-btn" data-cand-type="down">Down</button>
          <button type="button" class="sim-btn" data-cand-type="otro">Estándar</button>
        </div>
      </div>
      <div class="sim-section">
        <label>Preferencias de Accesibilidad</label>
        <div class="sim-grid">
          <button type="button" class="sim-btn" id="sim-toggle-dyslexic">Fuente Dislexia</button>
          <button type="button" class="sim-btn" id="sim-toggle-theme">Tema Oscuro</button>
        </div>
      </div>
      <div class="sim-section">
        <button type="button" class="sim-btn-danger" id="sim-reset-demo">Reiniciar Demo Completa</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  const trigger = document.getElementById('profile-simulator-trigger');
  const panel = document.getElementById('profile-simulator-panel');
  const closeBtn = document.getElementById('profile-simulator-close');

  if (trigger && panel) {
    trigger.addEventListener('click', () => {
      panel.classList.toggle('open');
      updateUIState();
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    }
    document.addEventListener('click', (e) => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== trigger) {
        panel.classList.remove('open');
      }
    });
  }

  function updateUIState() {
    const userType = localStorage.getItem('app-user-type') || 'visitante';
    const candidateType = localStorage.getItem('app-candidate-type') || '';
    const isDyslexic = localStorage.getItem('app-font') === 'dyslexic';
    const isDark = localStorage.getItem('app-theme') === 'dark';

    document.querySelectorAll('#sim-role-grid [data-role]').forEach(btn => {
      const btnRole = btn.getAttribute('data-role');
      btn.classList.toggle('active', btnRole === userType);
    });

    const candSection = document.getElementById('sim-cand-section');
    if (candSection) {
      candSection.style.display = userType === 'candidato' ? 'flex' : 'none';
    }

    document.querySelectorAll('#sim-cand-grid [data-cand-type]').forEach(btn => {
      const btnType = btn.getAttribute('data-cand-type');
      btn.classList.toggle('active', btnType === candidateType || (btnType === 'otro' && !candidateType));
    });

    const dysBtn = document.getElementById('sim-toggle-dyslexic');
    if (dysBtn) {
      dysBtn.classList.toggle('active', isDyslexic);
      dysBtn.innerHTML = `Fuente Dislexia: ${isDyslexic ? 'ON' : 'OFF'}`;
    }
    const themeBtn = document.getElementById('sim-toggle-theme');
    if (themeBtn) {
      themeBtn.classList.toggle('active', isDark);
      themeBtn.innerHTML = `Tema Oscuro: ${isDark ? 'ON' : 'OFF'}`;
    }
  }

  document.querySelectorAll('#sim-role-grid [data-role]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newRole = btn.getAttribute('data-role');
      localStorage.setItem('app-user-type', newRole);
      if (newRole === 'empresa') {
        localStorage.setItem('user_role', 'company');
        localStorage.removeItem('app-candidate-type');
        document.documentElement.removeAttribute('data-candidate-type');
      } else if (newRole === 'candidato') {
        localStorage.setItem('user_role', 'candidate');
        if (!localStorage.getItem('app-candidate-type')) {
          localStorage.setItem('app-candidate-type', 'autismo');
          document.documentElement.setAttribute('data-candidate-type', 'autismo');
        }
      } else {
        localStorage.removeItem('user_role');
        localStorage.removeItem('app-candidate-type');
        document.documentElement.removeAttribute('data-candidate-type');
      }
      document.documentElement.setAttribute('data-user-type', newRole);
      if (window.__applyThemePolicy) window.__applyThemePolicy();
      if (window.showToast) window.showToast(`Perfil cambiado a: ${newRole.toUpperCase()}`, 'success');
      updateUIState();

      setTimeout(() => {
        const isSubdir = window.location.pathname.includes('/pages/');
        if (newRole === 'candidato') {
          window.location.href = isSubdir ? 'dashboard-candidate.html' : 'pages/dashboard-candidate.html';
        } else if (newRole === 'empresa') {
          window.location.href = isSubdir ? 'dashboard-company.html' : 'pages/dashboard-company.html';
        } else {
          window.location.href = isSubdir ? '../index.html' : 'index.html';
        }
      }, 400);
    });
  });

  document.querySelectorAll('#sim-cand-grid [data-cand-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newType = btn.getAttribute('data-cand-type');
      if (newType === 'otro') {
        localStorage.removeItem('app-candidate-type');
        document.documentElement.removeAttribute('data-candidate-type');
      } else {
        localStorage.setItem('app-candidate-type', newType);
        document.documentElement.setAttribute('data-candidate-type', newType);
      }
      if (window.__applyThemePolicy) window.__applyThemePolicy();
      if (window.showToast) window.showToast(`Adaptación: ${newType.toUpperCase()}`, 'success');
      updateUIState();
    });
  });

  const dysBtn = document.getElementById('sim-toggle-dyslexic');
  if (dysBtn) {
    dysBtn.addEventListener('click', () => {
      const globalToggle = document.getElementById('dyslexic-toggle');
      if (globalToggle) {
        globalToggle.click();
      } else {
        const html = document.documentElement;
        const isDyslexic = html.getAttribute('data-font') === 'dyslexic';
        if (isDyslexic) {
          html.removeAttribute('data-font');
          localStorage.removeItem('app-font');
        } else {
          html.setAttribute('data-font', 'dyslexic');
          localStorage.setItem('app-font', 'dyslexic');
        }
        if (window.showToast) window.showToast('Fuente dislexia cambiada', 'info');
      }
      setTimeout(updateUIState, 50);
    });
  }

  const themeBtn = document.getElementById('sim-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const globalToggle = document.getElementById('theme-toggle');
      if (globalToggle) {
        globalToggle.click();
      } else {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('app-theme', next);
        if (window.showToast) window.showToast(`Tema cambiado a ${next}`, 'info');
      }
      setTimeout(updateUIState, 50);
    });
  }

  const resetBtn = document.getElementById('sim-reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.clear();
      if (window.showToast) window.showToast('Configuración reiniciada. Recargando...', 'info');
      setTimeout(() => {
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
      }, 800);
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-toggle') || e.target.closest('#dyslexic-toggle')) {
      setTimeout(updateUIState, 60);
    }
  });

  updateUIState();
}