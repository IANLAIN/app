import { getCurrentUser, logout, updateUserProfile, getMatchesForCandidate } from './auth.js';
import { initTheme } from './theme.js';
import { initSimulator } from './simulator.js';
import { initI18n, applyTranslations } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSimulator();
  initI18n();

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
        <p class="eyebrow" data-i18n="dash.cand.welcome">Bienvenido,</p> <p class="eyebrow">${user.name}</p>
        <h1 data-i18n="dash.cand.hero.title">Tu ruta de inserción laboral</h1>
        <p data-i18n="dash.cand.hero.desc">Aquí encontrarás herramientas de acompañamiento, match y seguimiento.</p>
      </div>
      <div class="hero-actions">
        ${!needsOnboarding ? '<button class="btn btn-outline" id="edit-profile-btn" data-i18n="dash.cand.btn.editProfile">Editar perfil</button>' : ''}
      </div>
    </div>
  `;

  if (needsOnboarding) {
    html += renderOnboardingForm(user);
  } else {
    html += `<div style="display:grid; gap:2.5rem;">`;
    html += renderPrepareZone(user);
    html += renderAdaptZone(user);
    html += renderAccompanyZone(user);
    html += renderConnectZone(user);
    html += `</div>`;
  }

  container.innerHTML = html;
  applyTranslations();
  attachEventListeners(user, needsOnboarding);
}

function renderOnboardingForm(user) {
  const profile = user.profile || {};
  const isChecked = (arr, val) => (arr || []).includes(val) ? 'checked' : '';
  const isSelected = (val1, val2) => val1 === val2 ? 'selected' : '';

  return `
    <div class="card" id="onboarding-card">
      <h2>${profile.completedOnboarding ? '<span data-i18n="dash.cand.onb.editTitle">Edita tu perfil</span>' : '<span data-i18n="dash.cand.onb.title">Completa tu perfil</span>'}</h2>
      <p data-i18n="dash.cand.onb.desc">Actualiza tus preferencias para personalizar tu experiencia.</p>
      <form id="onboarding-form">
        <div class="profile-edit-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div class="field">
            <label data-i18n="dash.cand.onb.photo">Foto de perfil</label>
            <input type="file" id="profile-avatar" accept="image/*">
            <div style="font-size:0.8rem; color:var(--color-muted); margin-top:4px;" data-i18n="dash.cand.onb.photoHint">Elige una imagen para identificarte (máx 2MB)</div>
          </div>
          <div class="field">
            <label data-i18n="dash.cand.onb.name">Nombre completo</label>
            <input type="text" id="profile-name" value="${user.name || ''}" required>
          </div>
          <div class="field" style="grid-column: 1 / -1;">
            <label data-i18n="dash.cand.onb.bio">Acerca de mí (Biografía)</label>
            <textarea id="profile-bio" rows="3" placeholder="...">${profile.bio || ''}</textarea>
          </div>
          <div class="field">
            <label data-i18n="dash.cand.onb.neurotype">¿Cómo te describes?</label>
            <select id="neurotype" required>
              <option value="" data-i18n="dash.cand.onb.select">Selecciona...</option>
              <option value="autismo" ${isSelected(profile.neurotype, 'autismo')} data-i18n="dash.cand.onb.autism">Autismo</option>
              <option value="tdah" ${isSelected(profile.neurotype, 'tdah')} data-i18n="dash.cand.onb.adhd">TDAH</option>
              <option value="down" ${isSelected(profile.neurotype, 'down')} data-i18n="dash.cand.onb.down">Síndrome de Down</option>
              <option value="otro" ${isSelected(profile.neurotype, 'otro')} data-i18n="dash.cand.onb.other">Otro</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="dash.cand.onb.workPref">Preferencia de trabajo</label>
            <select name="workPreference">
              <option value="remoto" ${isSelected(profile.workPreference, 'remoto')} data-i18n="dash.cand.onb.remote">Remoto</option>
              <option value="presencial" ${isSelected(profile.workPreference, 'presencial')} data-i18n="dash.cand.onb.onsite">Presencial</option>
              <option value="hibrido" ${isSelected(profile.workPreference, 'hibrido')} data-i18n="dash.cand.onb.hybrid">Híbrido</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="dash.cand.onb.env">Ambiente ideal</label>
            <select name="environment">
              <option value="silencioso" ${isSelected(profile.environment, 'silencioso')} data-i18n="dash.cand.onb.silent">Silencioso</option>
              <option value="musica" ${isSelected(profile.environment, 'musica')} data-i18n="dash.cand.onb.music">Con música de fondo</option>
              <option value="equipo" ${isSelected(profile.environment, 'equipo')} data-i18n="dash.cand.onb.team">En equipo</option>
              <option value="solo" ${isSelected(profile.environment, 'solo')} data-i18n="dash.cand.onb.solo">Trabajo individual</option>
            </select>
          </div>
        </div>
        
        <div class="field" style="margin-top: 1.5rem;">
          <label data-i18n="dash.cand.onb.interests">Áreas de interés laboral (puedes elegir varias)</label>
          <div class="options-grid">
            ${['tecnologia', 'arte', 'logistica', 'ambiente', 'atencion', 'manufactura'].map(i => `<label><input type="checkbox" name="interests" value="${i}" ${isChecked(profile.interests, i)}> ${i}</label>`).join('')}
          </div>
        </div>
        <div class="field">
          <label data-i18n="dash.cand.onb.skills">Habilidades destacadas</label>
          <div class="options-grid">
            ${['computadores', 'datos', 'dibujo', 'comunicacion', 'orden', 'detalle'].map(s => `<label><input type="checkbox" name="skills" value="${s}" ${isChecked(profile.skills, s)}> ${s}</label>`).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 15px;">
          ${profile.completedOnboarding ? '<button type="button" class="btn btn-outline" id="cancel-edit-btn" data-i18n="btn.cancel">Cancelar</button>' : ''}
          <button type="submit" class="btn btn-primary" data-i18n="btn.saveProfile">Guardar perfil</button>
        </div>
      </form>
    </div>
  `;
}

function renderPrepareZone(user) {
  const profile = user.profile || {};
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.cand.prep.title">PREPARAR · Desarrollo y Confianza</h2>
      <div class="card">
         <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
           <div>
             <h3 style="color:var(--color-ink);" data-i18n="dash.cand.prep.status">Estado de tu perfil</h3>
             <p style="color:var(--color-muted);"><span data-i18n="dash.cand.prep.statusDesc">Tu perfil de habilidades y entorno está</span> ${profile.completedOnboarding ? '100%' : '50%'} <span data-i18n="dash.cand.prep.statusDesc2">completo.</span></p>
           </div>
           <button class="btn btn-primary" id="btn-complete-profile" data-i18n="dash.cand.btn.updateProfile">Actualizar perfil detallado</button>
         </div>
         <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--color-border);">
            <h4 style="color:var(--color-ink); margin-bottom:0.5rem;" data-i18n="dash.cand.prep.sugg">Sugerencias de desarrollo</h4>
            <ul style="padding-left:1.2rem; color:var(--color-muted); font-size:0.9rem;">
              <li style="margin-bottom:0.5rem;" data-i18n="dash.cand.prep.sugg1">Micro-curso: Comunicación efectiva en el trabajo (3 min)</li>
              <li data-i18n="dash.cand.prep.sugg2">Reto: Organiza tu espacio digital para mayor concentración</li>
            </ul>
         </div>
      </div>
    </section>
  `;
}

function renderAdaptZone(user) {
  const theme = localStorage.getItem('app-theme') === 'dark' ? 'Oscuro' : 'Claro';
  const font = localStorage.getItem('app-font') === 'dyslexic' ? 'OpenDyslexic' : 'Estándar';
  const palette = localStorage.getItem('app-color-scheme') || 'coffee';
  const paletteName = palette === 'coffee' ? 'Café Neutro' : palette === 'purple' ? 'Púrpura Pastel' : 'Menta Pastel';

  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.cand.adapt.title">ADAPTAR · Tu Entorno Digital</h2>
      <div class="card">
        <h3 style="color:var(--color-ink); margin-bottom:0.5rem;" data-i18n="dash.cand.adapt.activePrefs">Preferencias visuales activas</h3>
        <p style="color:var(--color-muted); font-size:0.9rem; margin-bottom:1rem;" data-i18n="dash.cand.adapt.activeDesc">Tu entorno en Incluyo está configurado de la siguiente manera para adaptarse a tus necesidades sensoriales y de lectura.</p>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
           <span class="chip chip-soft"><span data-i18n="dash.cand.adapt.theme">Tema:</span> ${theme}</span>
           <span class="chip chip-soft"><span data-i18n="dash.cand.adapt.font">Fuente:</span> ${font}</span>
           <span class="chip chip-soft"><span data-i18n="dash.cand.adapt.palette">Paleta:</span> ${paletteName}</span>
        </div>
        <button class="btn btn-outline" id="btn-adjust-prefs" onclick="document.getElementById('theme-toggle').click()" data-i18n="dash.cand.btn.adjustPrefs">Alternar contraste rápido</button>
      </div>
    </section>
  `;
}

function renderAccompanyZone(user) {
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.cand.acc.title">ACOMPAÑAR · Tu Mentoría</h2>
      <div class="card" style="display:flex; flex-direction:column; gap:1rem;">
        <div>
          <h3 style="color:var(--color-ink); margin-bottom:0.25rem;" data-i18n="dash.cand.acc.mentor">Tu Mentor Asignado</h3>
          <p style="color:var(--color-ink); margin-bottom:0;"><strong>Carolina López</strong> · <span data-i18n="dash.cand.acc.mentorRole">Especialista en bienestar y productividad.</span></p>
          <p style="color:var(--color-muted); font-size:0.85rem; margin-bottom:0;" data-i18n="dash.cand.acc.lastSession">Última sesión: hace 2 días</p>
        </div>
        <div style="background:var(--bg-primary); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:1rem;">
          <p style="font-size:0.9rem; color:var(--color-muted); margin-bottom:0; font-style:italic;" data-i18n="dash.cand.acc.quote">"Recuerda que puedes pedir pausas cortas cuando lo necesites. Aquí estoy para guiarte."</p>
        </div>
        <div>
          <a href="mentoring.html" class="btn btn-primary" data-i18n="dash.cand.btn.mentorCenter">Ir al Centro de Mentoría</a>
        </div>
      </div>
    </section>
  `;
}

function renderConnectZone(user) {
  const matches = getMatchesForCandidate(user.id);
  return `
    <section class="pillar-zone">
      <h2 style="font-size:1.4rem; border-bottom:2px solid var(--color-border); padding-bottom:0.5rem; margin-bottom:1rem; color:var(--color-ink);" data-i18n="dash.cand.conn.title">CONECTAR · Oportunidades Sugeridas</h2>
      <div class="card">
        <p style="color:var(--color-muted); margin-bottom:1.5rem;" data-i18n="dash.cand.conn.desc">El sistema ha encontrado oportunidades laborales con entornos ajustados a tus características.</p>
        <div class="match-list" style="display:grid; gap:1rem;">
          ${matches.length ? matches.map(m => `
            <div class="match-card" style="border:1px solid var(--color-border); padding:1.25rem; border-radius:var(--radius-md); background:var(--bg-primary);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <h3 style="margin-bottom:0.25rem; color:var(--color-ink);">${m.title}</h3>
                  <p style="margin-bottom:0.5rem; color:var(--color-muted); font-size:0.9rem;"><span data-i18n="dash.cand.conn.company">Empresa:</span> <strong>${m.company}</strong></p>
                </div>
                <div style="background:var(--color-primary); color:var(--color-ink); padding:0.2rem 0.5rem; border-radius:var(--radius-pill); font-weight:700; font-size:0.85rem;">
                  Match: ${m.match}%
                </div>
              </div>
              <div style="margin:0.75rem 0;">
                <span class="eyebrow" data-i18n="dash.cand.conn.align">Alineación de entorno</span>
                <p style="font-size:0.85rem; color:var(--color-muted); margin-bottom:0;" data-i18n="dash.cand.conn.alignDesc">Alto soporte en estructuración de tareas, permite flexibilidad de horarios.</p>
              </div>
              <button class="btn btn-sm btn-primary" data-i18n="dash.cand.btn.apply">Ver detalles y postularme</button>
            </div>
          `).join('') : '<p style="color:var(--color-muted);" data-i18n="dash.cand.conn.empty">No hay vacantes sugeridas en este momento. Sigue desarrollando tu perfil.</p>'}
        </div>
      </div>
    </section>
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
    document.getElementById('btn-complete-profile')?.addEventListener('click', () => {
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