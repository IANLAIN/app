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

let isEditingProfile = false;

function renderDashboard(user) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  // Datos del perfil (completar si falta onboarding o si estamos editando)
  const profile = user.profile || {};
  const needsOnboarding = !profile.completedOnboarding || isEditingProfile;

  let html = `
    <div class="dashboard-hero card">
      <div>
        <p class="eyebrow">Bienvenido, ${user.name}</p>
        <h1>Tu ruta de inserción laboral</h1>
        <p>Aquí encontrarás herramientas de acompañamiento, match y seguimiento.</p>
      </div>
      <div class="hero-actions">
        ${!needsOnboarding ? '<button class="btn btn-outline" id="edit-profile-btn">Editar perfil</button>' : ''}
      </div>
    </div>
  `;

  if (needsOnboarding) {
    html += renderOnboardingForm(user);
  } else {
    html += renderProfileSection(user);
    html += renderMatchesSection(user);
    html += renderMentorSection();
    html += renderFollowUpSection();
  }

  container.innerHTML = html;
  attachEventListeners(user, needsOnboarding);
}

function renderOnboardingForm(user) {
  const profile = user.profile || {};
  const isChecked = (arr, val) => (arr || []).includes(val) ? 'checked' : '';
  const isSelected = (val1, val2) => val1 === val2 ? 'selected' : '';

  return `
    <div class="card" id="onboarding-card">
      <h2>${profile.completedOnboarding ? 'Edita tu perfil' : 'Completa tu perfil'}</h2>
      <p>Actualiza tus preferencias para personalizar tu experiencia.</p>
      <form id="onboarding-form">
        <div class="profile-edit-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div class="field">
            <label>Foto de perfil</label>
            <input type="file" id="profile-avatar" accept="image/*">
            <div style="font-size:0.8rem; color:var(--color-muted); margin-top:4px;">Elige una imagen para identificarte (máx 2MB)</div>
          </div>
          <div class="field">
            <label>Nombre completo</label>
            <input type="text" id="profile-name" value="${user.name || ''}" required>
          </div>
          <div class="field" style="grid-column: 1 / -1;">
            <label>Acerca de mí (Biografía)</label>
            <textarea id="profile-bio" rows="3" placeholder="Cuéntanos un poco sobre ti...">${profile.bio || ''}</textarea>
          </div>
          <div class="field">
            <label>¿Cómo te describes?</label>
            <select id="neurotype" required>
              <option value="">Selecciona...</option>
              <option value="autismo" ${isSelected(profile.neurotype, 'autismo')}>Autismo</option>
              <option value="tdah" ${isSelected(profile.neurotype, 'tdah')}>TDAH</option>
              <option value="down" ${isSelected(profile.neurotype, 'down')}>Síndrome de Down</option>
              <option value="otro" ${isSelected(profile.neurotype, 'otro')}>Otro</option>
            </select>
          </div>
          <div class="field">
            <label>Preferencia de trabajo</label>
            <select name="workPreference">
              <option value="remoto" ${isSelected(profile.workPreference, 'remoto')}>Remoto</option>
              <option value="presencial" ${isSelected(profile.workPreference, 'presencial')}>Presencial</option>
              <option value="hibrido" ${isSelected(profile.workPreference, 'hibrido')}>Híbrido</option>
            </select>
          </div>
          <div class="field">
            <label>Ambiente ideal</label>
            <select name="environment">
              <option value="silencioso" ${isSelected(profile.environment, 'silencioso')}>Silencioso</option>
              <option value="musica" ${isSelected(profile.environment, 'musica')}>Con música de fondo</option>
              <option value="equipo" ${isSelected(profile.environment, 'equipo')}>En equipo</option>
              <option value="solo" ${isSelected(profile.environment, 'solo')}>Trabajo individual</option>
            </select>
          </div>
        </div>
        
        <div class="field" style="margin-top: 1.5rem;">
          <label>Áreas de interés laboral (puedes elegir varias)</label>
          <div class="options-grid">
            ${['tecnologia', 'arte', 'logistica', 'ambiente', 'atencion', 'manufactura'].map(i => `<label><input type="checkbox" name="interests" value="${i}" ${isChecked(profile.interests, i)}> ${i}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Habilidades destacadas</label>
          <div class="options-grid">
            ${['computadores', 'datos', 'dibujo', 'comunicacion', 'orden', 'detalle'].map(s => `<label><input type="checkbox" name="skills" value="${s}" ${isChecked(profile.skills, s)}> ${s}</label>`).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 15px;">
          ${profile.completedOnboarding ? '<button type="button" class="btn btn-outline" id="cancel-edit-btn">Cancelar</button>' : ''}
          <button type="submit" class="btn btn-primary">Guardar perfil</button>
        </div>
      </form>
    </div>
  `;
}

function renderProfileSection(user) {
  const profile = user.profile || {};
  const initials = (user.name || 'U').substring(0,2).toUpperCase();
  const avatarHtml = profile.avatar 
    ? `<img src="${profile.avatar}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);">`
    : `<div style="width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold;">${initials}</div>`;

  const renderBadges = (arr) => (arr && arr.length) ? arr.map(i => `<span style="background: var(--color-surface-alt); border: 1px solid var(--color-border); padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; display: inline-block; margin-right: 6px; margin-bottom: 6px; text-transform: capitalize;">${i}</span>`).join('') : '<span style="color:var(--color-muted);">Ninguna</span>';

  return `
    <div class="card profile-card" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
        ${avatarHtml}
        <div>
          <h2 style="margin: 0; font-size: 1.8rem;">${user.name}</h2>
          <p style="margin: 4px 0 0; color: var(--color-muted); font-size: 1rem;">Candidato/a</p>
        </div>
      </div>
      
      ${profile.bio ? `<div style="background: var(--color-surface-alt); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--color-primary);"><p style="margin:0; font-style: italic;">"${profile.bio}"</p></div>` : ''}
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 0.5rem;">
        <div>
          <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-ink);">Detalles laborales</h3>
          <p style="margin-bottom: 0.5rem;"><strong>Neurotipo:</strong> <span style="text-transform: capitalize;">${profile.neurotype || 'No especificado'}</span></p>
          <p style="margin-bottom: 0.5rem;"><strong>Preferencia:</strong> <span style="text-transform: capitalize;">${profile.workPreference || 'No definida'}</span></p>
          <p style="margin-bottom: 0;"><strong>Ambiente ideal:</strong> <span style="text-transform: capitalize;">${profile.environment || 'No definido'}</span></p>
        </div>
        <div>
          <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-ink);">Mis intereses</h3>
          <div>${renderBadges(profile.interests)}</div>
        </div>
        <div>
          <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-ink);">Mis habilidades</h3>
          <div>${renderBadges(profile.skills)}</div>
        </div>
      </div>
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
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const neurotype = document.getElementById('neurotype').value;
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(i => i.value);
        const skills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(i => i.value);
        const workPreference = document.querySelector('select[name="workPreference"]').value;
        const environment = document.querySelector('select[name="environment"]').value;
        
        const newName = document.getElementById('profile-name').value.trim();
        const newBio = document.getElementById('profile-bio').value.trim();
        
        // Handle Avatar Upload
        let newAvatar = user.profile.avatar || '';
        const fileInput = document.getElementById('profile-avatar');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          if (file.size > 2 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 2MB.');
            return;
          }
          newAvatar = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        const updated = updateUserProfile({
          name: newName || user.name,
          profile: {
            ...user.profile,
            avatar: newAvatar,
            bio: newBio,
            neurotype,
            interests,
            skills,
            workPreference,
            environment,
            completedOnboarding: true
          }
        });
        if (updated) {
          isEditingProfile = false;
          window.location.reload();
        } else {
          alert('Error al guardar el perfil');
        }
      });
    }

    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
      isEditingProfile = false;
      renderDashboard(user);
    });
  } else {
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      isEditingProfile = true;
      renderDashboard(user);
    });

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