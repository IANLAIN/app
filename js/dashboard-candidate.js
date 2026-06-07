import { getCurrentUser, logout, updateUserProfile, getMatchesForCandidate } from './auth.js';
import { initTheme } from './theme.js';
import { initSimulator } from './simulator.js';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSimulator();

  const user = getCurrentUser();
  if (!user || user.role !== 'candidate') {
    window.location.href = '../index.html';
    return;
  }

  // Configurar botón de cierre
  document.getElementById('logout-btn')?.addEventListener('click', () => logout());

  renderDashboard(user);
});

function renderDashboard(user) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  // Datos del perfil (completar si falta onboarding)
  const profile = user.profile || {};
  const needsOnboarding = !profile.completedOnboarding;

  let html = `
    <div class="dashboard-hero card">
      <div>
        <p class="eyebrow">Bienvenido, ${user.name}</p>
        <h1>Tu ruta de inserción laboral</h1>
        <p>Aquí encontrarás herramientas de acompañamiento, match y seguimiento.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-outline" id="edit-profile-btn">Editar perfil</button>
        <button class="btn btn-primary" id="start-onboarding-btn" ${needsOnboarding ? '' : 'style="display:none"'}>Completar perfil</button>
      </div>
    </div>
  `;

  if (needsOnboarding) {
    html += renderOnboardingForm();
  } else {
    html += renderProfileSection(profile);
    html += renderMatchesSection(user);
    html += renderMentorSection();
    html += renderFollowUpSection();
  }

  container.innerHTML = html;
  attachEventListeners(user, needsOnboarding);
}

function renderOnboardingForm() {
  return `
    <div class="card" id="onboarding-card">
      <h2>Completa tu perfil</h2>
      <p>Cuéntanos sobre ti para personalizar tu experiencia.</p>
      <form id="onboarding-form">
        <div class="field">
          <label>¿Cómo te describes?</label>
          <select id="neurotype" required>
            <option value="">Selecciona...</option>
            <option value="autismo">Autismo</option>
            <option value="tdah">TDAH</option>
            <option value="down">Síndrome de Down</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="field">
          <label>Áreas de interés laboral (puedes elegir varias)</label>
          <div class="options-grid">
            ${['tecnologia', 'arte', 'logistica', 'ambiente', 'atencion', 'manufactura'].map(i => `<label><input type="checkbox" name="interests" value="${i}"> ${i}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Habilidades destacadas</label>
          <div class="options-grid">
            ${['computadores', 'datos', 'dibujo', 'comunicacion', 'orden', 'detalle'].map(s => `<label><input type="checkbox" name="skills" value="${s}"> ${s}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Preferencia de trabajo</label>
          <select name="workPreference">
            <option value="remoto">Remoto</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
        <div class="field">
          <label>Ambiente ideal</label>
          <select name="environment">
            <option value="silencioso">Silencioso</option>
            <option value="musica">Con música de fondo</option>
            <option value="equipo">En equipo</option>
            <option value="solo">Trabajo individual</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Guardar perfil</button>
      </form>
    </div>
  `;
}

function renderProfileSection(profile) {
  return `
    <div class="card">
      <h2>Mi perfil</h2>
      <p><strong>Neurotipo:</strong> ${profile.neurotype || 'No especificado'}</p>
      <p><strong>Intereses:</strong> ${(profile.interests || []).join(', ') || 'Ninguno'}</p>
      <p><strong>Habilidades:</strong> ${(profile.skills || []).join(', ') || 'Ninguna'}</p>
      <p><strong>Preferencia laboral:</strong> ${profile.workPreference || 'No definida'}</p>
      <p><strong>Ambiente ideal:</strong> ${profile.environment || 'No definido'}</p>
    </div>
  `;
}

function renderMatchesSection(user) {
  const matches = getMatchesForCandidate(user.id);
  return `
    <div class="card">
      <h2>Vacantes sugeridas para ti</h2>
      <div class="match-list">
        ${matches.map(m => `
          <div class="match-card" style="border:1px solid var(--color-border); padding:1rem; margin-bottom:1rem; border-radius:var(--radius-md);">
            <h3>${m.title}</h3>
            <p>Empresa: ${m.company}</p>
            <p>Match: ${m.match}%</p>
            <p>Habilidades requeridas: ${m.skills.join(', ')}</p>
            <button class="btn btn-sm btn-primary" data-vacancy-id="${m.id}">Postularme</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMentorSection() {
  return `
    <div class="card">
      <h2>Acompañamiento con mentor</h2>
      <p>Tu mentora asignada: <strong>Carolina López (Psicóloga laboral)</strong></p>
      <div class="chat-preview">
        <div id="mentor-chat" class="chat-thread" style="max-height: 200px; overflow-y: auto; border:1px solid var(--color-border); padding:0.5rem; border-radius:var(--radius-md);">
          <div class="message message-in">Hola, soy tu mentora. ¿Cómo te sientes hoy?</div>
        </div>
        <form id="chat-form" class="chat-form" style="margin-top:0.5rem; display:flex; gap:0.5rem;">
          <input type="text" placeholder="Escribe un mensaje..." id="chat-input" style="flex:1">
          <button type="submit" class="btn btn-primary">Enviar</button>
        </form>
      </div>
    </div>
  `;
}

function renderFollowUpSection() {
  return `
    <div class="card">
      <h2>Seguimiento de contratación</h2>
      <p>Registra tus avances en el proceso de inserción laboral.</p>
      <form id="followup-form">
        <div class="field">
          <label>Estado actual</label>
          <select id="followup-status">
            <option value="buscando">Buscando oportunidades</option>
            <option value="entrevistas">En proceso de entrevistas</option>
            <option value="contratado">Contratado/a</option>
            <option value="adaptacion">En periodo de adaptación</option>
          </select>
        </div>
        <div class="field">
          <label>Notas personales (dificultades, logros, sensaciones)</label>
          <textarea id="followup-notes" rows="3" placeholder="Escribe aquí..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Guardar seguimiento</button>
      </form>
      <div id="followup-history"></div>
    </div>
  `;
}

function attachEventListeners(user, needsOnboarding) {
  if (needsOnboarding) {
    const form = document.getElementById('onboarding-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const neurotype = document.getElementById('neurotype').value;
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(i => i.value);
        const skills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(i => i.value);
        const workPreference = document.querySelector('select[name="workPreference"]').value;
        const environment = document.querySelector('select[name="environment"]').value;

        const updated = updateUserProfile({
          profile: {
            ...user.profile,
            neurotype,
            interests,
            skills,
            workPreference,
            environment,
            completedOnboarding: true
          }
        });
        if (updated) {
          window.location.reload();
        } else {
          alert('Error al guardar el perfil');
        }
      });
    }
  } else {
    // Eventos para chat, postulación, seguimiento
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatThread = document.querySelector('#mentor-chat');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        const outMsg = document.createElement('div');
        outMsg.className = 'message message-out';
        outMsg.textContent = msg;
        chatThread.appendChild(outMsg);
        chatInput.value = '';
        setTimeout(() => {
          const reply = document.createElement('div');
          reply.className = 'message message-in';
          reply.textContent = 'Gracias por compartir. ¿Necesitas apoyo en algo específico?';
          chatThread.appendChild(reply);
          chatThread.scrollTop = chatThread.scrollHeight;
        }, 800);
      });
    }

    const followupForm = document.getElementById('followup-form');
    if (followupForm) {
      followupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = document.getElementById('followup-status').value;
        const notes = document.getElementById('followup-notes').value;
        // Guardar en localStorage del usuario
        const history = JSON.parse(localStorage.getItem(`followup_${user.id}`) || '[]');
        history.push({ date: new Date().toISOString(), status, notes });
        localStorage.setItem(`followup_${user.id}`, JSON.stringify(history));
        alert('Seguimiento guardado');
        document.getElementById('followup-notes').value = '';
        renderFollowupHistory(user.id);
      });
      renderFollowupHistory(user.id);
    }
  }
}

function renderFollowupHistory(userId) {
  const container = document.getElementById('followup-history');
  if (!container) return;
  const history = JSON.parse(localStorage.getItem(`followup_${userId}`) || '[]');
  if (history.length === 0) {
    container.innerHTML = '<p>No hay registros previos.</p>';
    return;
  }
  container.innerHTML = '<h3>Registros anteriores</h3>' + history.map(h => `
    <div style="border-bottom:1px solid var(--color-border); padding:0.5rem 0;">
      <strong>${new Date(h.date).toLocaleString()}</strong> - Estado: ${h.status}<br>
      Notas: ${h.notes || '—'}
    </div>
  `).join('');
}