/**
 * auth.js — Local Mock Authentication + UX feedback
 * Handles Google OAuth (Mock), email/password login, registration wizard, and role selection.
 */

import { t } from "./i18n.js";

// ── Global Logout Helper ───────────────────────────────────────
window.cerrarSesion = async () => {
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("demo_session");
  
  if (window.__spaNavigate) {
    window.__spaNavigate("index.html");
  } else {
    window.location.href = "index.html";
  }
};

export function initAuth(root = document) {
  // ── Sign Out buttons ───────────────────────────────────────────
  root.querySelectorAll("[data-logout]").forEach(btn => {
    if (!btn._logoutListener) {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await window.cerrarSesion();
      });
      btn._logoutListener = true;
    }
  });

  if (root !== document) {
    const headerLogout = document.getElementById("btn-logout");
    if (headerLogout && !headerLogout._logoutListener) {
      headerLogout.addEventListener("click", async (e) => {
        e.preventDefault();
        await window.cerrarSesion();
      });
      headerLogout._logoutListener = true;
    }
  }

  const authRoot = root.querySelector("[data-auth-root]");
  if (!authRoot) return;

  function updateDemoButtons() {
    const userType = localStorage.getItem("app-user-type");
    const demoCandidate = authRoot.querySelector(".btn-demo-candidato");
    const demoCompany = authRoot.querySelector(".btn-demo-empresa");
    if (!demoCandidate && !demoCompany) return;

    const showCandidate = userType === "visitante" || userType === "candidato" || !userType;
    const showCompany = userType === "visitante" || userType === "empresa" || !userType;

    if (demoCandidate) demoCandidate.style.display = showCandidate ? "inline-flex" : "none";
    if (demoCompany) demoCompany.style.display = showCompany ? "inline-flex" : "none";
  }

  updateDemoButtons();

  // ── Shared status helpers ──────────────────────────────────────
  function setStatus(el, type, icon, text) {
    if (!el) return;
    el.className = `ms-status msg-${type}`;
    el.textContent = text;
    el.removeAttribute("hidden");
  }

  function setLoading(btn, loading, originalText) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Cargando..." : originalText;
    if (loading) btn.classList.add("is-loading");
    else btn.classList.remove("is-loading");
  }

  // ── Redirect helper — SPA Router ───────────────────────────────
  function redirectToDashboard(role) {
    const dest = role === "company" ? "pages/dashboard-company.html" : "pages/dashboard-candidate.html";

    if (window.__spaNavigate) {
      window.__spaNavigate(dest);
    } else {
      window.location.href = "/" + dest;
    }
  }

  // ── Mock Google OAuth (Login) ───────────────────────────────────────
  root.querySelectorAll("[data-google-login]").forEach((btn) => {
    const originalText = btn.querySelector("span[data-i18n]")?.textContent || "Continuar con Google";
    const statusEl = authRoot.querySelector("[data-ms-status]");

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      setLoading(btn, true, originalText);
      setStatus(statusEl, "info", "⏳", "Conectando con Google...");

      setTimeout(() => {
        setStatus(statusEl, "success", "✅", "¡Sesión iniciada correctamente!");
        localStorage.setItem("user_role", "candidate"); // Default mock
        localStorage.setItem("user_id", "mock-google-user-id");
        localStorage.setItem("demo_session", "true");
        setTimeout(() => redirectToDashboard("candidate"), 800);
      }, 1500);
    });
  });

  // ── Email/password forms (Login) ───────────────────────────────
  authRoot.querySelectorAll("form").forEach((form) => {
    if (form.hasAttribute("data-register-form")) return;

    const submitBtn = form.querySelector("[type='submit']");
    const originalBtnText = submitBtn?.textContent || "Entrar";
    const statusEl = authRoot.querySelector("[data-ms-status]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailEl = form.querySelector("[type='email']");
      const passEl = form.querySelector("[type='password']");
      const tempEmail = emailEl?.value?.trim();
      const tempPass = passEl?.value;
      
      // Clear previous validation states
      [emailEl, passEl].forEach((el) => {
        if (el) el.classList.remove("error", "success");
      });

      if (!tempEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempEmail)) {
        emailEl?.classList.add("error");
        setStatus(statusEl, "error", "⚠️", "Por favor ingresa un correo válido.");
        return;
      }
      if (!tempPass || tempPass.length < 8) {
        passEl?.classList.add("error");
        setStatus(statusEl, "error", "⚠️", "La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      setLoading(submitBtn, true, originalBtnText);
      setStatus(statusEl, "info", "⏳", "Verificando credenciales...");

      setTimeout(() => {
        let role = "candidate";
        if (tempEmail.includes("empresa") || tempEmail === "demo.empresa@incluia.org") {
          role = "company";
        }
        
        emailEl?.classList.add("success");
        passEl?.classList.add("success");
        setStatus(statusEl, "success", "✅", "¡Sesión iniciada correctamente!");
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_id", "mock-local-user-id");
        localStorage.setItem("demo_session", "true");
        
        setTimeout(() => redirectToDashboard(role), 800);
      }, 1200);
    });
  });

  // ── Password Toggle ──────────────────────────────────────────
  function initPasswordToggle(input, btn) {
    if (!input || !btn) return;
    let visible = false;
    const label = btn.querySelector(".eye-text");
    const showText = t("auth.toggle.show", "Mostrar");
    const hideText = t("auth.toggle.hide", "Ocultar");
    const showAria = t("auth.toggle.show.aria", "Mostrar contraseña");
    const hideAria = t("auth.toggle.hide.aria", "Ocultar contraseña");
    if (label) label.textContent = showText;

    btn.addEventListener("click", () => {
      visible = !visible;
      input.type = visible ? "text" : "password";
      btn.setAttribute("aria-label", visible ? hideAria : showAria);
      if (label) label.textContent = visible ? hideText : showText;
      btn.style.transform = "scale(1.25)";
      setTimeout(() => (btn.style.transform = "scale(1)"), 200);
    });
  }

  root.querySelectorAll(".input-wrap").forEach(wrap => {
    const input = wrap.querySelector("input[type='password'], .pass-input");
    const btn = wrap.querySelector(".eye-btn");
    initPasswordToggle(input, btn);
  });

  // ── Strength Bar ──────────────────────────────────────────────
  function initStrengthBar(input, bar, label) {
    if (!input || !bar) return;

    const levels = [
      { w: "25%", color: "var(--color-error)", text: "Muy débil" },
      { w: "50%", color: "var(--color-warning)", text: "Débil" },
      { w: "75%", color: "var(--color-success)", text: "Buena" },
      { w: "100%", color: "var(--color-primary)", text: "Muy fuerte" },
    ];

    input.addEventListener("input", () => {
      const v = input.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const lvl = v.length === 0 ? null : levels[Math.min(score, 3) || 0];
      bar.style.width = lvl ? lvl.w : "0%";
      bar.style.background = lvl ? lvl.color : "transparent";
      if (label) {
        label.textContent = lvl ? lvl.text : "";
        label.style.color = lvl ? lvl.color : "var(--text-secondary)";
      }
    });
  }

  const strengthBar = root.querySelector("#strengthBar");
  const strengthLabel = root.querySelector("#strengthLabel");
  const regPasswordInput = root.querySelector("#reg-password");
  initStrengthBar(regPasswordInput, strengthBar, strengthLabel);

  // ── Register Wizard ─────────────────────────────────────────
  initRegisterWizard(authRoot);
}

// ═══ REGISTER WIZARD ═══════════════════════════════════════════════
function initRegisterWizard(root) {
  const wizard = root.querySelector("[data-register-wizard]");
  if (!wizard) return;

  const steps = root.querySelectorAll("[data-reg-step]");
  const progressSteps = root.querySelectorAll("[data-step-indicator]");
  const roleCards = root.querySelectorAll("[data-role-cards] [data-role]");
  const btnToStep2 = root.querySelector("[data-btn-to-step2]");
  const btnBack1 = root.querySelector("[data-btn-back-1]");
  const companyFields = root.querySelector("[data-company-fields]");
  const roleBadge = root.querySelector("[data-role-badge]");
  const googleBtnText = root.querySelector("[data-google-btn-text]");
  const nameLabel = root.querySelector("[data-name-label]");
  const formDividerText = root.querySelector("[data-form-divider-text]");
  const registerForm = root.querySelector("[data-register-form]");

  let selectedRole = "";

  function showStep(stepNum) {
    steps.forEach((s) => {
      const sNum = parseInt(s.getAttribute("data-reg-step"));
      if (sNum === stepNum) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
    progressSteps.forEach((p) => {
      const pNum = parseInt(p.getAttribute("data-step-indicator"));
      if (pNum <= stepNum) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
  }

  function animateTransition(fromStep, toStep) {
    const from = root.querySelector(`[data-reg-step="${fromStep}"]`);
    const to = root.querySelector(`[data-reg-step="${toStep}"]`);
    if (!from || !to) return;

    from.style.transition = "opacity 0.25s, transform 0.25s";
    from.style.opacity = "0";
    from.style.transform = "translateX(-20px)";

    setTimeout(() => {
      from.classList.remove("active");
      from.style.opacity = "";
      from.style.transform = "";
      from.style.transition = "";

      to.classList.add("active");
      to.style.opacity = "0";
      to.style.transform = "translateX(20px)";

      requestAnimationFrame(() => {
        to.style.transition = "opacity 0.25s, transform 0.25s";
        to.style.opacity = "1";
        to.style.transform = "translateX(0)";
      });

      setTimeout(() => {
        to.style.transition = "";
      }, 300);

      showStep(toStep);
    }, 260);
  }

  // Select Role
  roleCards.forEach((card) => {
    card.addEventListener("click", () => {
      roleCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedRole = card.getAttribute("data-role");
      if (btnToStep2) {
        btnToStep2.disabled = false;
        btnToStep2.style.opacity = "1";
      }
    });
  });

  // Navigate Step 1 -> Step 2
  if (btnToStep2) {
    btnToStep2.addEventListener("click", () => {
      if (!selectedRole) return;

      if (selectedRole === "company") {
        if (companyFields) companyFields.style.display = "block";
        if (googleBtnText) googleBtnText.textContent = "Continuar con Google corporativo";
        if (nameLabel) nameLabel.textContent = "Nombre y Apellido";
        if (formDividerText) formDividerText.textContent = "o completa el formulario";
        if (roleBadge) roleBadge.innerHTML = '<span class="chip chip-success">Empresa / Reclutador</span>';
        const cn = root.querySelector("#reg-company-name");
        const cr = root.querySelector("#reg-company-role");
        if (cn) cn.required = true;
        if (cr) cr.required = true;
      } else {
        if (companyFields) companyFields.style.display = "none";
        if (googleBtnText) googleBtnText.textContent = "Continuar con Google";
        if (nameLabel) nameLabel.textContent = "Nombre completo";
        if (formDividerText) formDividerText.textContent = "o regístrate con correo";
        if (roleBadge) roleBadge.innerHTML = '<span class="chip chip-soft">Candidato / Aliado</span>';
        const cn = root.querySelector("#reg-company-name");
        const cr = root.querySelector("#reg-company-role");
        if (cn) cn.required = false;
        if (cr) cr.required = false;
      }

      animateTransition(1, 2);
    });
  }

  // Navigate Step 2 -> Step 1
  if (btnBack1) {
    btnBack1.addEventListener("click", () => {
      animateTransition(2, 1);
    });
  }

  // Google Auth for Registration
  const btnGoogleRegister = root.querySelector("[data-google-register]");
  if (btnGoogleRegister) {
    btnGoogleRegister.addEventListener("click", async (e) => {
      e.preventDefault();
      btnGoogleRegister.disabled = true;
      const textEl = btnGoogleRegister.querySelector("[data-google-btn-text]");
      if (textEl) textEl.textContent = "Conectando...";

      const roleForMock = selectedRole === "company" ? "company" : "candidate";
      localStorage.setItem("user_role", roleForMock);
      localStorage.setItem("pending_role", roleForMock);

      setTimeout(() => {
        localStorage.setItem("user_id", "mock-google-user-id");
        localStorage.setItem("demo_session", "true");
        const dest = roleForMock === "company" ? "pages/dashboard-company.html" : "pages/dashboard-candidate.html";
        if (window.__spaNavigate) window.__spaNavigate(dest);
        else window.location.href = dest;
      }, 1500);
    });
  }

  // Form Submit
  if (registerForm) {
    const submitBtn = registerForm.querySelector("[data-btn-submit]");
    const statusEl = root.querySelector("#reg-status-message");

    function setRegStatus(type, icon, text) {
      if (!statusEl) return;
      statusEl.className = `ms-status msg-${type}`;
      statusEl.textContent = text;
      statusEl.removeAttribute("hidden");
    }

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = registerForm.querySelector("#reg-email")?.value.trim();
      const password = registerForm.querySelector("#reg-password")?.value;
      const fullName = registerForm.querySelector("#reg-full-name")?.value.trim();

      if (!fullName || !email || !password) {
        setRegStatus("error", "⚠️", "Por favor, completa los campos requeridos.");
        return;
      }
      if (password.length < 8) {
        setRegStatus("error", "⚠️", "La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creando cuenta...";
        submitBtn.classList.add("is-loading");
      }

      const roleForMock = selectedRole === "company" ? "company" : "candidate";

      if (selectedRole === "company") {
        const companyName = registerForm.querySelector("#reg-company-name")?.value.trim();
        const companyRole = registerForm.querySelector("#reg-company-role")?.value;

        if (!companyName || !companyRole) {
          setRegStatus("error", "⚠️", "Faltan datos de la empresa.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Crear mi cuenta";
            submitBtn.classList.remove("is-loading");
          }
          return;
        }
      }

      setTimeout(() => {
        const verifyEmailEl = root.querySelector("[data-verify-email]");
        if (verifyEmailEl) verifyEmailEl.textContent = email;

        const btnResend = root.querySelector("[data-btn-resend]");
        const resendStatus = root.querySelector("[data-resend-status]");
        if (btnResend) {
          btnResend.onclick = async () => {
            btnResend.disabled = true;
            if (resendStatus) {
              resendStatus.className = "ms-status msg-success";
              resendStatus.innerHTML = "✅ Correo reenviado.";
            }
            setTimeout(() => {
              btnResend.disabled = false;
            }, 60000);
          };
        }
        
        localStorage.setItem("user_role", roleForMock);
        localStorage.setItem("user_id", "mock-local-user-id");
        localStorage.setItem("demo_session", "true");

        animateTransition(2, 3);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Crear mi cuenta";
          submitBtn.classList.remove("is-loading");
        }
      }, 1500);
    });
  }
}
