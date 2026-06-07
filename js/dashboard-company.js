import { getCurrentUser, logout, updateUserProfile, getMatchesForCompany } from './auth.js';
import { initTheme } from './theme.js';
import { initSimulator } from './simulator.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSimulator();

  const user = getCurrentUser();
  if (!user || user.role !== 'company') {
    window.location.href = '../index.html';
    return;
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => logout());

  renderDashboard(user);
});

function renderDashboard(user) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const profile = user.profile || {};
  const matches = getMatchesForCompany(user.id);

  let html = `
    <div class="dashboard-hero card">
      <div>
        <p class="eyebrow">Bienvenido, ${user.name}</p>
        <h1>Panel de gestión de talento</h1>
        <p>Encuentra candidatos, genera guías de adaptación y mide tu impacto.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-outline" id="edit-company-btn">Editar datos</button>
        <button class="btn btn-primary" id="new-vacancy-btn">Publicar vacante</button>
      </div>
    </div>

    <div class="card">
      <h2>Datos de la empresa</h2>
      <p><strong>Sector:</strong> ${profile.industry || 'No especificado'}</p>
      <p><strong>Filosofía:</strong> ${profile.philosophy || 'No especificada'}</p>
      <p><strong>Entorno laboral:</strong> ${profile.workEnvironment || 'No especificado'}</p>
      <p><strong>Ajustes ofrecidos:</strong> ${(profile.accommodations || []).join(', ') || 'Ninguno'}</p>
    </div>

    <div class="card">
      <h2>Candidatos sugeridos (match)</h2>
      <div class="match-list">
        ${matches.map(c => `
          <div class="match-card" style="border:1px solid var(--color-border); padding:1rem; margin-bottom:1rem; border-radius:var(--radius-md);">
            <h3>${c.name}</h3>
            <p>Match: ${c.match}%</p>
            <p>Neurotipo: ${c.profile?.neurotype || 'No especificado'}</p>
            <p>Habilidades: ${(c.profile?.skills || []).join(', ')}</p>
            <button class="btn btn-sm btn-primary" data-candidate-id="${c.id}">Contactar vía mentor</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Generador de guía de adaptación</h2>
      <div class="field">
        <label>Rol a adaptar</label>
        <input type="text" id="role-guide" placeholder="Ej. Analista QA">
      </div>
      <div class="field">
        <label>Contexto/limitaciones del puesto</label>
        <textarea id="context-guide" rows="2">Entorno dinámico, reuniones frecuentes</textarea>
      </div>
      <button class="btn btn-primary" id="generate-guide-btn">Generar guía</button>
      <div id="guide-output" class="guide-output" style="margin-top:1rem;"></div>
    </div>

    <div class="card">
      <h2>Métricas de impacto social (ESG)</h2>
      <div class="grid grid-3">
        <div><strong>Retención</strong><div class="chart" data-chart data-values="72,84,91" data-labels="Q1,Q2,Q3"></div></div>
        <div><strong>Bienestar</strong><div class="chart" data-chart data-values="68,74,82" data-labels="Q1,Q2,Q3"></div></div>
        <div><strong>Capacitación</strong><div class="chart" data-chart data-values="55,69,88" data-labels="Q1,Q2,Q3"></div></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Inicializar gráficos
  import('../js/ai-sim.js').then(({ renderCharts }) => renderCharts(container));

  // Evento guía
  document.getElementById('generate-guide-btn')?.addEventListener('click', () => {
    const role = document.getElementById('role-guide').value.trim() || 'el puesto';
    const context = document.getElementById('context-guide').value.trim();
    const output = document.getElementById('guide-output');
    output.innerHTML = `Guía para ${role} en contexto "${context}":<br>
      - Permitir uso de auriculares con cancelación de ruido<br>
      - Dividir tareas en pasos visuales (checklist)<br>
      - Ofrecer descansos cortos cada 45 minutos<br>
      - Asignar un mentor de referencia durante el primer mes`;
  });

  // Editar empresa
  document.getElementById('edit-company-btn')?.addEventListener('click', () => {
    const newIndustry = prompt('Nuevo sector:', profile.industry || '');
    const newPhilosophy = prompt('Filosofía:', profile.philosophy || '');
    const newEnvironment = prompt('Entorno laboral:', profile.workEnvironment || '');
    if (newIndustry || newPhilosophy || newEnvironment) {
      updateUserProfile({
        profile: {
          ...profile,
          industry: newIndustry || profile.industry,
          philosophy: newPhilosophy || profile.philosophy,
          workEnvironment: newEnvironment || profile.workEnvironment
        }
      });
      window.location.reload();
    }
  });
}