/**
 * ai-sim.js — Simulación de componentes IA en dashboards
 */

function ensureToastContainer() {
  if (document.getElementById('toast-container')) return;
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

export function showToast(message, type = 'info') {
  ensureToastContainer();
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: var(--bg-secondary);
    border-left: 4px solid ${type === 'success' ? '#4a7c59' : type === 'error' ? '#a0442a' : '#4a5c8a'};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 0.85rem;
    color: var(--color-ink);
    pointer-events: auto;
    animation: slideInRight 0.3s ease;
    max-width: 320px;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;

export function renderCharts(root = document) {
  const charts = root.querySelectorAll('[data-chart]');
  charts.forEach(chart => {
    if (chart.dataset.rendered === 'true') return;
    const values = (chart.dataset.values || '').split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const labels = (chart.dataset.labels || '').split(',').map(l => l.trim());
    if (!values.length) return;
    chart.innerHTML = '';
    values.forEach((val, idx) => {
      const row = document.createElement('div');
      row.className = 'chart-row';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = labels[idx] || `Item ${idx + 1}`;
      const barContainer = document.createElement('div');
      barContainer.className = 'chart-bar';
      const barFill = document.createElement('span');
      barFill.style.width = `${Math.min(100, val)}%`;
      barContainer.appendChild(barFill);
      const valueSpan = document.createElement('span');
      valueSpan.className = 'chart-value';
      valueSpan.textContent = `${val}%`;
      row.append(labelSpan, barContainer, valueSpan);
      chart.appendChild(row);
    });
    chart.dataset.rendered = 'true';
  });
}

function initGuideGenerator(root) {
  const container = root.querySelector('[data-guide-generator]');
  if (!container) return;
  const actionBtn = container.querySelector('[data-guide-action]');
  const roleInput = container.querySelector('#role-input');
  const contextInput = container.querySelector('#context-input');
  const outputDiv = container.querySelector('[data-guide-output]');
  if (!actionBtn || !roleInput || !contextInput || !outputDiv) return;

  const generateGuide = () => {
    const role = roleInput.value.trim() || 'el puesto';
    const context = contextInput.value.trim() || 'entorno estándar';
    const templates = [
      `Guía para ${role} en contexto de ${context}:\n- Permitir uso de auriculares con cancelación de ruido\n- Dividir tareas en pasos visuales (checklist)\n- Ofrecer descansos cortos cada 45 minutos\n- Usar recordatorios visuales en el puesto`,
      `Adaptaciones sugeridas para ${role}:\n- Reuniones de no más de 15 minutos\n- Proveer instrucciones por escrito\n- Espacio de trabajo con luz regulable\n- Flexibilidad horaria (inicio entre 8-10 am)`,
      `Perfil ajustado para ${role}:\n- Evitar sobrecarga sensorial (colores neutros)\n- Priorizar tareas secuenciales\n- Asignar un mentor de referencia\n- Uso de software de organización (Trello/Asana)`
    ];
    const randomIndex = Math.floor(Math.random() * templates.length);
    outputDiv.textContent = templates[randomIndex];
    showToast(`Guía generada para ${role}`, 'success');
  };
  actionBtn.addEventListener('click', generateGuide);
}

function initTaskBoard(root) {
  const btns = root.querySelectorAll('[data-task-toggle]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.task-card');
      if (!card) return;
      const progress = card.querySelector('progress');
      if (!progress) return;
      const isComplete = card.classList.toggle('is-complete');
      if (isComplete) {
        if (!progress.dataset.origVal) progress.dataset.origVal = progress.value;
        progress.value = progress.max;
        btn.textContent = 'Completada';
        showToast('Tarea completada', 'success');
      } else {
        progress.value = parseFloat(progress.dataset.origVal || 0);
        btn.textContent = 'Completar';
        showToast('Tarea restablecida', 'info');
      }
    });
  });
}

function initMentorChat(root) {
  const form = root.querySelector('[data-chat-form]');
  const input = root.querySelector('[data-chat-input]');
  const thread = root.querySelector('[data-chat-thread]');
  if (!form || !input || !thread) return;

  const mentorResponses = {
    default: "Entiendo. Cuéntame más, estoy aquí para ayudarte.",
    energia: "¿Cómo describirías tu energía hoy del 1 al 10? Podemos ajustar las tareas según eso.",
    pausa: "Claro. Tómate el tiempo que necesites. Las pausas activas ayudan a la concentración.",
    lista: "Me alegra que la lista de tareas te ayude. ¿Quieres que revisemos juntos las prioridades?",
    gracias: "De nada. Es un placer acompañarte. ¿Necesitas algo más?",
    comando: "Comandos disponibles:\n/energia - evaluar tu estado\n/pausa - sugerir descanso\n/lista - revisar tareas\n/ayuda - mostrar esto"
  };

  const appendMessage = (text, type) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    const p = document.createElement('p');
    p.textContent = text;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    const now = new Date();
    timeSpan.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    messageDiv.append(p, timeSpan);
    thread.appendChild(messageDiv);
    thread.scrollTop = thread.scrollHeight;
  };

  const getMentorResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('energía') || lowerMsg === '/energia') return mentorResponses.energia;
    if (lowerMsg.includes('pausa') || lowerMsg === '/pausa') return mentorResponses.pausa;
    if (lowerMsg.includes('lista') || lowerMsg === '/lista') return mentorResponses.lista;
    if (lowerMsg.includes('gracias')) return mentorResponses.gracias;
    if (lowerMsg.includes('/ayuda') || lowerMsg === 'ayuda') return mentorResponses.comando;
    return mentorResponses.default;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'out');
    input.value = '';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message message-in typing-indicator';
    typingIndicator.textContent = 'Escribiendo...';
    thread.appendChild(typingIndicator);
    thread.scrollTop = thread.scrollHeight;

    setTimeout(() => {
      typingIndicator.remove();
      const response = getMentorResponse(text);
      appendMessage(response, 'in');
    }, 800 + Math.random() * 700);
  });
}

export function initAiSim(root = document) {
  renderCharts(root);
  initGuideGenerator(root);
  initTaskBoard(root);
  initMentorChat(root);
  ensureToastContainer();
}