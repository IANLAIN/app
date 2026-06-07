// Bundle UI simulations for AI-assisted guidance and dashboards.
export function initAiSim(root = document) {
  initSimplifyButtons(root);
  initGuideGenerator(root);
  initTaskBoard(root);
  initMentorChat(root);
  renderCharts(root);
  initMicrosoftSignIn(root);
}

// Render simple bar charts from data attributes.
export function renderCharts(root = document) {
  const charts = root.querySelectorAll("[data-chart]");
  charts.forEach((chart) => {
    if (chart.dataset.rendered) {
      return;
    }
    const values = (chart.dataset.values || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));
    const labels = (chart.dataset.labels || "").split(",").map((label) => label.trim());
    chart.innerHTML = "";

    values.forEach((value, index) => {
      const row = document.createElement("div");
      row.className = "chart-row";

      const label = document.createElement("span");
      label.textContent = labels[index] || `Q${index + 1}`;

      const bar = document.createElement("div");
      bar.className = "chart-bar";
      const barFill = document.createElement("span");
      barFill.style.setProperty("--value", value);
      bar.appendChild(barFill);

      const metric = document.createElement("span");
      metric.className = "chart-value";
      metric.textContent = `${value}%`;

      row.append(label, bar, metric);
      chart.appendChild(row);
    });

    chart.dataset.rendered = "true";
  });
}

// Toggle simplified instructions for cognitive comfort.
function initSimplifyButtons(root) {
  const buttons = root.querySelectorAll("[data-simplify]");
  buttons.forEach((button) => {
    const targetId = button.getAttribute("data-target");
    const target = targetId ? root.querySelector(`#${targetId}`) : null;
    if (!target) {
      return;
    }
    button.addEventListener("click", () => {
      const original = target.dataset.original || target.textContent.trim();
      const simplified = target.dataset.simplified || original;
      const isSimplified = target.dataset.state === "simplified";
      target.textContent = isSimplified ? original : simplified;
      target.dataset.state = isSimplified ? "original" : "simplified";
      button.textContent = isSimplified ? "Simplificar instrucciones" : "Ver texto completo";
    });
  });
}

// Simulate an AI guide generator for job adaptation.
function initGuideGenerator(root) {
  const container = root.querySelector("[data-guide-generator]");
  if (!container) {
    return;
  }
  const action = container.querySelector("[data-guide-action]");
  const roleInput = container.querySelector("#role-input");
  const contextInput = container.querySelector("#context-input");
  const output = container.querySelector("[data-guide-output]");
  if (!action || !roleInput || !contextInput || !output) {
    return;
  }
  action.addEventListener("click", () => {
    const role = roleInput.value.trim() || "rol";
    const context = contextInput.value.trim() || "contexto";
    output.textContent = `Guia sugerida para ${role}: espacio con baja distraccion, checklist de tareas, reuniones de 15 minutos y ajustes segun ${context}.`;
    if (window.showToast) window.showToast("Guía de adaptación generada por IA", "success");
  });
}

// Add simple completion feedback to task cards.
function initTaskBoard(root) {
  const buttons = root.querySelectorAll("[data-task-toggle]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".task-card");
      const progress = card ? card.querySelector("progress") : null;
      if (!card || !progress) {
        return;
      }
      if (!progress.dataset.start) {
        progress.dataset.start = String(progress.value);
      }
      const isComplete = card.classList.toggle("is-complete");
      progress.value = isComplete ? progress.max : Number(progress.dataset.start);
      button.textContent = isComplete ? "Completada" : "Completar";
      if (window.showToast) {
        if (isComplete) window.showToast("¡Tarea completada! +50 XP", "success");
        else window.showToast("Tarea restablecida", "info");
      }
    });
  });
}

// Simulate mentor chat responses.
function initMentorChat(root) {
  const form = root.querySelector("[data-chat-form]");
  const input = root.querySelector("[data-chat-input]");
  const thread = root.querySelector("[data-chat-thread]");
  if (!form || !input || !thread) {
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      return;
    }
    appendMessage(thread, text, "out");
    input.value = "";
    window.setTimeout(() => {
      appendMessage(thread, "Gracias, lo reviso con calma.", "in");
    }, 450);
  });
}

// Simulate Microsoft sign-in feedback.
function initMicrosoftSignIn(root) {
  const button = root.querySelector("[data-ms-login]");
  const status = root.querySelector("[data-ms-status]");
  if (!button || !status) {
    return;
  }
  button.addEventListener("click", () => {
    status.textContent = "Autenticacion simulada con Microsoft Entra ID.";
  });
}

// Append a new chat message to the thread.
function appendMessage(thread, text, type) {
  const message = document.createElement("div");
  message.className = `message message-${type}`;
  const content = document.createElement("p");
  content.textContent = text;
  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatTime(new Date());
  message.append(content, time);
  thread.appendChild(message);
  thread.scrollTop = thread.scrollHeight;
}

// Format a short time label for chat entries.
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
