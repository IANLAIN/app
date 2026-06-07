/**
 * simulator.js — Profile Simulator Widget for incluIA
 * Allows real-time switching between neurodiversity adaptive themes, roles, and preferences.
 */

// Simple Toast Notification helper
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const emojis = {
    success: "✅",
    error: "⚠️",
    info: "ℹ️"
  };

  toast.innerHTML = `
    <span class="emoji" aria-hidden="true">${emojis[type] || "ℹ️"}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Make showToast globally accessible
window.showToast = showToast;

export function initSimulator() {
  // Avoid duplicate injection
  if (document.getElementById("profile-simulator-trigger")) return;

  // Insert trigger button
  const trigger = document.createElement("button");
  trigger.id = "profile-simulator-trigger";
  trigger.className = "sim-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", "Abrir simulador de perfiles adaptativos");
  trigger.innerHTML = `<span>🎭</span> <strong>Simular Perfiles</strong>`;
  document.body.appendChild(trigger);

  // Insert main simulator panel
  const panel = document.createElement("div");
  panel.id = "profile-simulator-panel";
  panel.className = "sim-panel";
  panel.innerHTML = `
    <div class="sim-header">
      <h3>Simulador de Adaptabilidad</h3>
      <button type="button" class="sim-close" id="profile-simulator-close" aria-label="Cerrar">&times;</button>
    </div>
    
    <div class="sim-section">
      <label>Rol Principal / Perfil</label>
      <div class="sim-grid" id="sim-role-grid">
        <button type="button" class="sim-btn" data-role="candidato">🧠 Candidato</button>
        <button type="button" class="sim-btn" data-role="empresa">🏢 Empresa Aliada</button>
        <button type="button" class="sim-btn" data-role="visitante">🌐 Visitante</button>
      </div>
    </div>

    <div class="sim-section" id="sim-cand-section" style="display: none;">
      <label>Neurotipo (Adaptación Visual)</label>
      <div class="sim-grid" id="sim-cand-grid">
        <button type="button" class="sim-btn" data-cand-type="autismo">🧩 Autismo (Verde Oliva/Calma)</button>
        <button type="button" class="sim-btn" data-cand-type="tdah">⚡ TDAH (Naranja/Hipercubo)</button>
        <button type="button" class="sim-btn" data-cand-type="down">💙 Down (Pastel/Peach/Sin emojis)</button>
        <button type="button" class="sim-btn" data-cand-type="otro">🌈 Estilo Estándar</button>
      </div>
    </div>

    <div class="sim-section">
      <label>Preferencias de Accesibilidad</label>
      <div class="sim-grid">
        <button type="button" class="sim-btn" id="sim-toggle-dyslexic">Aa Fuente Dislexia</button>
        <button type="button" class="sim-btn" id="sim-toggle-theme">☾ Tema Oscuro (Autismo/TDAH)</button>
      </div>
    </div>

    <div class="sim-section">
      <button type="button" class="sim-btn-danger" id="sim-reset-demo">Reiniciar Demo Completa</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Toggle panel
  trigger.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  const closeBtn = document.getElementById("profile-simulator-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }

  // Update active buttons dynamically
  function updateUIState() {
    const userType = localStorage.getItem("app-user-type") || "visitante";
    const candidateType = localStorage.getItem("app-candidate-type") || "";
    const isDyslexic = localStorage.getItem("app-font") === "dyslexic";
    const isDark = localStorage.getItem("app-theme") === "dark";

    // Update role buttons
    document.querySelectorAll("#sim-role-grid [data-role]").forEach(btn => {
      const btnRole = btn.getAttribute("data-role");
      btn.classList.toggle("active", btnRole === userType);
    });

    // Toggle candidate neurotype section visibility
    const candSection = document.getElementById("sim-cand-section");
    if (candSection) {
      candSection.style.display = userType === "candidato" ? "flex" : "none";
    }

    // Update candidate type buttons
    document.querySelectorAll("#sim-cand-grid [data-cand-type]").forEach(btn => {
      const btnType = btn.getAttribute("data-cand-type");
      btn.classList.toggle("active", btnType === candidateType || (btnType === "otro" && !candidateType));
    });

    // Update accessibility buttons
    const dysBtn = document.getElementById("sim-toggle-dyslexic");
    if (dysBtn) {
      dysBtn.classList.toggle("active", isDyslexic);
      dysBtn.innerHTML = `Aa Fuente Dislexia: <strong>${isDyslexic ? "ON" : "OFF"}</strong>`;
    }

    const themeBtn = document.getElementById("sim-toggle-theme");
    if (themeBtn) {
      themeBtn.classList.toggle("active", isDark);
      themeBtn.innerHTML = `☾ Tema Oscuro: <strong>${isDark ? "ON" : "OFF"}</strong>`;
    }
  }

  // Role button handlers
  document.querySelectorAll("#sim-role-grid [data-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const newRole = btn.getAttribute("data-role");
      localStorage.setItem("app-user-type", newRole);
      
      // Sync user_role for dashboard checking compatibility
      const oldRole = localStorage.getItem("user_role");
      if (newRole === "empresa") {
        localStorage.setItem("user_role", "company");
      } else if (newRole === "candidato") {
        localStorage.setItem("user_role", "candidate");
        if (!localStorage.getItem("app-candidate-type")) {
          localStorage.setItem("app-candidate-type", "autismo"); // default to autism for nice adaptive design show
        }
      } else {
        localStorage.removeItem("user_role");
      }

      document.documentElement.setAttribute("data-user-type", newRole);
      if (window.__applyThemePolicy) window.__applyThemePolicy();

      showToast(`Perfil cambiado a: ${newRole.toUpperCase()}`, "success");
      updateUIState();

      // Auto-navigate to show dashboard layout shifts
      setTimeout(() => {
        if (window.__spaNavigate) {
          if (newRole === "candidato") window.__spaNavigate("pages/dashboard-candidate.html");
          else if (newRole === "empresa") window.__spaNavigate("pages/dashboard-company.html");
          else window.__spaNavigate("index.html");
        } else {
          // Statically navigate safely using the correct path relation
          const isSubdir = window.location.pathname.includes("/pages/");
          if (newRole === "candidato") window.location.href = isSubdir ? "dashboard-candidate.html" : "pages/dashboard-candidate.html";
          else if (newRole === "empresa") window.location.href = isSubdir ? "dashboard-company.html" : "pages/dashboard-company.html";
          else window.location.href = isSubdir ? "../index.html" : "index.html";
        }
      }, 500);
    });
  });

  // Candidate type button handlers
  document.querySelectorAll("#sim-cand-grid [data-cand-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      const newType = btn.getAttribute("data-cand-type");
      if (newType === "otro") {
        localStorage.removeItem("app-candidate-type");
        document.documentElement.removeAttribute("data-candidate-type");
      } else {
        localStorage.setItem("app-candidate-type", newType);
        document.documentElement.setAttribute("data-candidate-type", newType);
      }
      if (window.__applyThemePolicy) window.__applyThemePolicy();

      showToast(`Adaptación activada: ${newType.toUpperCase()}`, "success");
      updateUIState();
    });
  });

  // Dyslexic Font handler
  const dysBtn = document.getElementById("sim-toggle-dyslexic");
  if (dysBtn) {
    dysBtn.addEventListener("click", () => {
      const toggleBtn = document.getElementById("dyslexic-toggle");
      if (toggleBtn) {
        toggleBtn.click();
      } else {
        // Fallback static toggle
        const current = document.documentElement.getAttribute("data-font");
        if (current === "dyslexic") {
          document.documentElement.removeAttribute("data-font");
          localStorage.removeItem("app-font");
        } else {
          document.documentElement.setAttribute("data-font", "dyslexic");
          localStorage.setItem("app-font", "dyslexic");
        }
      }
      showToast("Preferencia de fuente cambiada", "info");
      updateUIState();
    });
  }

  // Dark theme handler
  const themeBtn = document.getElementById("sim-toggle-theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const toggleBtn = document.getElementById("theme-toggle");
      if (toggleBtn) {
        toggleBtn.click();
      } else {
        // Fallback static toggle
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("app-theme", next);
      }
      showToast("Tema de color cambiado", "info");
      updateUIState();
    });
  }

  // Reset Demo handler
  const resetBtn = document.getElementById("sim-reset-demo");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.clear();
      showToast("Configuración reiniciada. Recargando...", "info");
      setTimeout(() => {
        window.location.href = window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
      }, 800);
    });
  }

  // Initial load
  updateUIState();
  
  // Listen for changes done through other buttons (like the header toggles)
  document.addEventListener("click", (e) => {
    if (e.target.closest("#theme-toggle") || e.target.closest("#dyslexic-toggle")) {
      setTimeout(updateUIState, 50);
    }
  });
}
