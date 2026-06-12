import { getCurrentUser, logout, updateUserProfile, getMatchesForCompany } from './auth.js';
import { initTheme } from './theme.js';
import { initSimulator } from './simulator.js';
import { initI18n, applyTranslations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSimulator();
  initI18n();

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

  let html = `
    <div class="dashboard-hero card" style="margin-bottom:2.5rem;">
      <div>
        <p class="eyebrow" data-i18n="dash.comp.eyebrow">Gestión de Talento Inclusivo</p>
        <h1 data-i18n="dash.comp.hero.title">Hola, ${user.name}</h1>
        <p data-i18n="dash.comp.hero.desc">Encuentra candidatos neurodivergentes, genera guías de adaptación y mide tu impacto ESG.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-outline" id="edit-company-btn" data-i18n="dash.comp.btn.editProfile">Actualizar perfil de empresa</button>
        <button class="btn btn-primary" id="new-vacancy-btn" data-i18n="dash.comp.btn.newVacancy">Publicar nueva vacante</button>
      </div>
    </div>
    
    <div style="display:grid; gap:2.5rem;">
      ${renderPrepareZone(user)}
      ${renderAdaptZone(user)}
      ${renderAccompanyZone(user)}
      ${renderConnectZone(user)}
    </div>
  `;

  container.innerHTML = html;
  applyTranslations();

  // Inicializar gráficos
  import('../js/ai-sim.js').then(({ renderCharts }) => renderCharts(container));
  attachCompanyEventListeners(user);
}

function renderPrepareZone(user) {
  const profile = user.profile || {};
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.comp.prep.title">PREPARAR · Perfil de Empresa Inclusiva</h2>
      <div class="card">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.5rem;">
          <div>
            <h3 style="color:var(--color-ink); margin-bottom:0.5rem; font-size:1rem;" data-i18n="dash.comp.prep.sectorTitle">Sector y Filosofía</h3>
            <p style="margin-bottom:0.25rem;"><strong data-i18n="dash.comp.prep.sector">Sector:</strong> <span style="color:var(--color-muted);">${profile.industry || 'Tecnología y Software'}</span></p>
            <p style="margin-bottom:0.25rem;"><strong data-i18n="dash.comp.prep.philosophy">Filosofía:</strong> <span style="color:var(--color-muted);">${profile.philosophy || 'Promovemos equipos diversos para mayor innovación'}</span></p>
            <p style="margin-bottom:0;"><strong data-i18n="dash.comp.prep.env">Entorno laboral:</strong> <span style="color:var(--color-muted);">${profile.workEnvironment || 'Híbrido, oficinas silenciosas'}</span></p>
          </div>
          <div>
            <h3 style="color:var(--color-ink); margin-bottom:0.5rem; font-size:1rem;" data-i18n="dash.comp.prep.accTitle">Ajustes Razonables Disponibles</h3>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
              ${(profile.accommodations || ['Flexibilidad horaria', 'Auriculares con cancelación', 'Mentoría 1:1']).map(a => `<span class="chip chip-soft">${a}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAdaptZone(user) {
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.comp.adapt.title">ADAPTAR · GenAI para Inclusión</h2>
      <div class="card">
        <h3 style="color:var(--color-ink); margin-bottom:0.5rem;" data-i18n="dash.comp.adapt.guideTitle">Generador de Guías de Adaptación</h3>
        <p style="color:var(--color-muted); font-size:0.9rem; margin-bottom:1rem;" data-i18n="dash.comp.adapt.guideDesc">Ingresa un rol y el contexto del puesto para generar una guía estructurada con IA sobre cómo adaptar el entorno para candidatos neurodivergentes.</p>
        <div class="field" style="margin-bottom:1rem;">
          <label data-i18n="dash.comp.adapt.roleLabel">Rol a adaptar</label>
          <input type="text" id="role-guide" placeholder="...">
        </div>
        <div class="field" style="margin-bottom:1rem;">
          <label data-i18n="dash.comp.adapt.contextLabel">Contexto o limitaciones del puesto</label>
          <textarea id="context-guide" rows="2" placeholder="...">Entorno dinámico, reuniones frecuentes (Agile)</textarea>
        </div>
        <button class="btn btn-outline" id="generate-guide-btn" data-i18n="dash.comp.btn.generateGuide">Generar sugerencias de IA</button>
        <div id="guide-output" class="guide-output" style="margin-top:1.5rem;"></div>
      </div>
    </section>
  `;
}

function renderAccompanyZone(user) {
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.comp.acc.title">ACOMPAÑAR · Impacto y Seguimiento ESG</h2>
      <div class="card">
        <p style="color:var(--color-muted); font-size:0.9rem; margin-bottom:1.5rem;" data-i18n="dash.comp.acc.desc">Mide el impacto de tus políticas de inclusión. Estos datos te ayudan a cumplir con estándares ESG (Environmental, Social, and Governance).</p>
        <div class="grid grid-3">
          <div style="background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <strong style="display:block; margin-bottom:0.5rem;" data-i18n="dash.comp.acc.retention">Retención del Talento</strong>
            <div class="chart" data-chart data-values="72,84,91" data-labels="Q1,Q2,Q3"></div>
          </div>
          <div style="background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <strong style="display:block; margin-bottom:0.5rem;" data-i18n="dash.comp.acc.wellness">Índice de Bienestar</strong>
            <div class="chart" data-chart data-values="68,74,82" data-labels="Q1,Q2,Q3"></div>
          </div>
          <div style="background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <strong style="display:block; margin-bottom:0.5rem;" data-i18n="dash.comp.acc.training">Horas de Capacitación</strong>
            <div class="chart" data-chart data-values="55,69,88" data-labels="Q1,Q2,Q3"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderConnectZone(user) {
  const matches = getMatchesForCompany(user.id);
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.comp.conn.title">CONECTAR · Talento Sugerido</h2>
      <div class="card">
        <p style="color:var(--color-muted); margin-bottom:1.5rem;" data-i18n="dash.comp.conn.desc">El sistema ha encontrado candidatos cuyo perfil de entorno hace "match" perfecto con las características de tu empresa.</p>
        <div class="match-list" style="display:grid; gap:1rem;">
          ${matches.length ? matches.map(c => `
            <div class="match-card" style="border:1px solid var(--color-border); padding:1.25rem; border-radius:var(--radius-md); background:var(--bg-primary);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <h3 style="margin:0; color:var(--color-ink);">${c.name}</h3>
                <div style="background:var(--color-primary); color:var(--color-ink); padding:0.2rem 0.5rem; border-radius:var(--radius-pill); font-weight:700; font-size:0.85rem;">
                  Match: ${c.match}%
                </div>
              </div>
              <p style="margin-bottom:0.25rem;"><strong data-i18n="dash.comp.conn.neurotype">Neurotipo:</strong> <span style="text-transform:capitalize;">${c.profile?.neurotype || 'Autismo'}</span></p>
              <p style="margin-bottom:1rem; font-size:0.9rem; color:var(--color-muted);"><strong data-i18n="dash.comp.conn.skills">Habilidades:</strong> ${(c.profile?.skills || ['Desarrollo Web', 'Atención al detalle']).join(', ')}</p>
              <button class="btn btn-sm btn-primary" data-candidate-id="${c.id}" data-i18n="dash.comp.btn.contact">Contactar vía Mentor Intermediario</button>
            </div>
          `).join('') : '<p style="color:var(--color-muted);" data-i18n="dash.comp.conn.empty">Actualmente no hay nuevos candidatos sugeridos.</p>'}
        </div>
      </div>
    </section>
  `;
}

function attachCompanyEventListeners(user) {
  const profile = user.profile || {};
  
  // Evento guía IA
  document.getElementById('generate-guide-btn')?.addEventListener('click', () => {
    const role = document.getElementById('role-guide').value.trim() || 'el puesto';
    const context = document.getElementById('context-guide').value.trim();
    const output = document.getElementById('guide-output');
    output.style.display = 'block';
    output.style.padding = '1rem';
    output.style.background = 'var(--bg-primary)';
    output.style.borderLeft = '4px solid var(--color-primary)';
    output.style.borderRadius = 'var(--radius-md)';
    output.innerHTML = `<h4 style="margin-bottom:0.5rem;">Sugerencias de Adaptación para: ${role}</h4>
      <p style="font-size:0.85rem; color:var(--color-muted); margin-bottom:0.5rem;">Contexto: "${context}"</p>
      <ul style="padding-left:1.5rem; margin-bottom:0; font-size:0.95rem; color:var(--color-ink);">
        <li>Permitir uso de auriculares con cancelación de ruido durante horas de open-space.</li>
        <li>Dividir tareas complejas en pasos visuales concretos (usando Trello o Jira con checklists).</li>
        <li>Ofrecer flexibilidad para tomar descansos cortos cada 45 minutos.</li>
        <li>Asignar un "buddy" o mentor de referencia en el equipo durante el primer mes de onboarding.</li>
      </ul>`;
  });

  // Editar empresa
  document.getElementById('edit-company-btn')?.addEventListener('click', () => {
    const newIndustry = prompt('Actualizar sector de la empresa:', profile.industry || 'Tecnología');
    const newPhilosophy = prompt('Actualizar filosofía inclusiva:', profile.philosophy || 'Inclusión como motor de innovación');
    const newEnvironment = prompt('Actualizar entorno laboral:', profile.workEnvironment || 'Híbrido');
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