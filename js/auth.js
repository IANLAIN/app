/**
 * auth.js — Supabase authentication + UX feedback
 * Handles Google OAuth, email/password login, registration wizard, and role selection.
 */
const SUPABASE_URL = "https://oupbptgzfevkzzvscekj.supabase.co";
const SUPABASE_KEY = "sb_publishable_Obya200r1UbgWVnMbuhhiw_Xto1ETSE";

function getSupabaseClient() {
  if (!window.supabase) return null;
  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    return null;
  }
}

// ── Global Logout Helper ───────────────────────────────────────
window.cerrarSesion = async () => {
  const supabaseClient = getSupabaseClient();
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("pending_role");
  localStorage.removeItem("demo_session");
  
  if (window.__spaNavigate) {
    window.__spaNavigate("index.html");
  } else {
    window.location.href = "index.html"; // Ajustado para evitar rutas incorrectas en entornos locales
  }
};

export function initAuth(root = document) {
  // ── Sign Out buttons ───────────────────────────────────────────
  // Agregamos listener a los botones dentro del DOM actual o contenedor (root)
  root.querySelectorAll("[data-logout]").forEach(btn => {
    if (!btn._logoutListener) {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await window.cerrarSesion();
      });
      btn._logoutListener = true;
    }
  });

  // Si el root no es document (ej. SPA load), aseguramos que el log-out global del header persista con su listener.
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

  const supabaseClient = getSupabaseClient();

  // ── Auto-create profile & Onboarding routing (OAuth) ───────────
  if (supabaseClient && !window._authListenerAdded) {
    window._authListenerAdded = true;
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const user = session.user;
        const isOAuth = user.app_metadata?.provider === "google";

        if (isOAuth) {
          try {
            const { data: profile } = await supabaseClient
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (!profile) {
              const pendingRole = localStorage.getItem("pending_role") || "candidate";
              await supabaseClient.from("profiles").insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || "",
                avatar_url: user.user_metadata?.avatar_url || "",
                role: pendingRole,
                onboarding_completed: false,
                created_at: new Date().toISOString(),
              });

              localStorage.setItem("user_role", pendingRole);
              localStorage.setItem("user_id", user.id);
              if (window.__spaNavigate)
                window.__spaNavigate("pages/onboarding.html");
            } else {
              localStorage.setItem("user_role", profile.role);
              localStorage.setItem("user_id", user.id);

              if (!profile.onboarding_completed) {
                if (window.__spaNavigate)
                  window.__spaNavigate("pages/onboarding.html");
              } else {
                if (window.__spaNavigate)
                  window.__spaNavigate(
                    `pages/dashboard-${profile.role}.html`
                  );
              }
            }
          } catch (err) {
            console.error("Error checking profile:", err);
          }
        }
      }
    });
  }

  // ── Shared status helpers ──────────────────────────────────────
  function setStatus(el, type, icon, text) {
    if (!el) return;
    el.className = `ms-status msg-${type}`;
    el.innerHTML = `<span aria-hidden="true">${icon}</span> ${text}`;
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
  function redirectToDashboard() {
    const role = localStorage.getItem("user_role") || "candidate";
    const dest =
      role === "company"
        ? "pages/dashboard-company.html"
        : "pages/dashboard-candidate.html";

    if (window.__spaNavigate) {
      window.__spaNavigate(dest);
    } else {
      window.location.href = "/" + dest;
    }
  }

  // ── Google OAuth (Login) ───────────────────────────────────────
  root.querySelectorAll("[data-google-login]").forEach((btn) => {
    const originalText =
      btn.querySelector("span[data-i18n]")?.textContent ||
      "Continuar con Google";
    const statusEl = authRoot.querySelector("[data-ms-status]");

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!supabaseClient) {
        setStatus(statusEl, "error", "⚠️", "Supabase no disponible. Recarga la página.");
        return;
      }

      setLoading(btn, true, originalText);
      setStatus(statusEl, "info", "⏳", "Conectando con Google...");

      const redirectTo = window.location.origin;

      try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
      } catch (err) {
        console.error("OAuth error:", err.message);
        setStatus(statusEl, "error", "⚠️", "Error al conectar con Google. Intenta de nuevo.");
        setLoading(btn, false, originalText);
      }
    });
  });

  // ── Email/password forms (Login) ───────────────────────────────
  authRoot.querySelectorAll("form").forEach((form) => {
    if (form.hasAttribute("data-register-form")) return; // Handled by wizard

    const submitBtn = form.querySelector("[type='submit']");
    const originalBtnText = submitBtn?.textContent || "Entrar";
    const statusEl = authRoot.querySelector("[data-ms-status]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!supabaseClient) {
        setStatus(statusEl, "error", "⚠️", "Backend no configurado. Usa Google por ahora.");
        return;
      }

      const emailEl = form.querySelector("[type='email']");
      const passEl = form.querySelector("[type='password']");
      const email = emailEl?.value?.trim();
      const pass = passEl?.value;

      // Clear previous validation states
      [emailEl, passEl].forEach((el) => {
        if (el) el.classList.remove("error", "success");
      });

      // Validations
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl?.classList.add("error");
        setStatus(statusEl, "error", "⚠️", "Por favor ingresa un correo válido.");
        return;
      }
      if (!pass || pass.length < 8) {
        passEl?.classList.add("error");
        setStatus(statusEl, "error", "⚠️", "La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      setLoading(submitBtn, true, originalBtnText);
      setStatus(statusEl, "info", "⏳", "Verificando credenciales...");

      // Cuentas de muestra (Bypass para Dashboard)
      if (email === "demo.candidato@incluia.org" && pass === "Demo1234!") {
        setStatus(statusEl, "success", "✅", "¡Sesión de muestra iniciada!");
        localStorage.setItem("user_role", "candidate");
        localStorage.setItem("demo_session", "true");
        setTimeout(() => redirectToDashboard(), 800);
        return;
      }
      if (email === "demo.empresa@incluia.org" && pass === "Demo1234!") {
        setStatus(statusEl, "success", "✅", "¡Sesión de muestra iniciada!");
        localStorage.setItem("user_role", "company");
        localStorage.setItem("demo_session", "true");
        setTimeout(() => redirectToDashboard(), 800);
        return;
      }

      try {
        const result = await supabaseClient.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (result.error) throw result.error;

        emailEl?.classList.add("success");
        passEl?.classList.add("success");
        setStatus(statusEl, "success", "✅", "¡Sesión iniciada correctamente!");

        const finalRole =
          result.data.user.user_metadata?.role || "candidate";
        localStorage.setItem("user_role", finalRole);

        setTimeout(() => redirectToDashboard(), 800);
      } catch (err) {
        console.error("Auth error:", err.message);
        setStatus(statusEl, "error", "⚠️", "Correo o contraseña incorrectos.");
        emailEl?.classList.add("error");
      } finally {
        setLoading(submitBtn, false, originalBtnText);
      }
    });
  });

  // ── Password Toggle ──────────────────────────────────────────
  function initPasswordToggle(input, btn) {
    if (!input || !btn) return;
    let visible = false;

    btn.addEventListener("click", () => {
      visible = !visible;
      input.type = visible ? "text" : "password";
      btn.setAttribute(
        "aria-label",
        visible ? "Ocultar contraseña" : "Mostrar contraseña"
      );
      btn.style.transform = "scale(1.25)";
      setTimeout(() => (btn.style.transform = "scale(1)"), 200);
    });
  }

  // Init password toggles by proximity
  root.querySelectorAll(".input-wrap").forEach(wrap => {
    const input = wrap.querySelector("input[type='password'], .pass-input");
    const btn = wrap.querySelector(".eye-btn");
    initPasswordToggle(input, btn);
  });

  // ── Strength Bar ──────────────────────────────────────────────
  function initStrengthBar(input, bar, label) {
    if (!input || !bar) return;

    const levels = [
      { w: "25%", color: "#E57373", text: "Muy débil" },
      { w: "50%", color: "#FFB74D", text: "Débil" },
      { w: "75%", color: "#81C784", text: "Buena" },
      { w: "100%", color: "#4D8FAC", text: "Muy fuerte ✓" },
    ];

    input.addEventListener("input", () => {
      const v = input.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const lvl = v.length === 0 ? null : levels[score - 1] || levels[0];
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
  initRegisterWizard(authRoot, supabaseClient);
}

// ═══ REGISTER WIZARD ═══════════════════════════════════════════════
function initRegisterWizard(root, supabase) {
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

      // Update progress
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

      // Configure Step 2 UI based on role
      if (selectedRole === "company") {
        if (companyFields) companyFields.style.display = "block";
        if (googleBtnText) googleBtnText.textContent = "Continuar con Google corporativo";
        if (nameLabel) nameLabel.textContent = "Nombre y Apellido";
        if (formDividerText) formDividerText.textContent = "o completa el formulario";
        if (roleBadge) roleBadge.innerHTML = '<span class="chip chip-success">🏢 Empresa / Reclutador</span>';
        // Set required on company fields
        const cn = root.querySelector("#reg-company-name");
        const cr = root.querySelector("#reg-company-role");
        if (cn) cn.required = true;
        if (cr) cr.required = true;
      } else {
        if (companyFields) companyFields.style.display = "none";
        if (googleBtnText) googleBtnText.textContent = "Continuar con Google";
        if (nameLabel) nameLabel.textContent = "Nombre completo";
        if (formDividerText) formDividerText.textContent = "o regístrate con correo";
        if (roleBadge) roleBadge.innerHTML = '<span class="chip chip-soft">🧠 Candidato / Aliado</span>';
        // Remove required from company fields
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
  if (btnGoogleRegister && supabase) {
    btnGoogleRegister.addEventListener("click", async (e) => {
      e.preventDefault();
      btnGoogleRegister.disabled = true;
      const textEl = btnGoogleRegister.querySelector("[data-google-btn-text]");
      if (textEl) textEl.textContent = "Conectando...";

      const roleForSupabase = selectedRole === "company" ? "company" : "candidate";
      localStorage.setItem("user_role", roleForSupabase);
      localStorage.setItem("pending_role", roleForSupabase);

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      } catch (err) {
        console.error("OAuth error:", err.message);
        btnGoogleRegister.disabled = false;
        if (textEl) textEl.textContent = "Continuar con Google";
      }
    });
  }

  // Form Submit
  if (registerForm && supabase) {
    const submitBtn = registerForm.querySelector("[data-btn-submit]");
    const statusEl = root.querySelector("#reg-status-message");

    function setRegStatus(type, icon, text) {
      if (!statusEl) return;
      statusEl.className = `ms-status msg-${type}`;
      statusEl.innerHTML = `<span aria-hidden="true">${icon}</span> ${text}`;
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

      const roleForSupabase = selectedRole === "company" ? "company" : "candidate";
      let metadata = { full_name: fullName, role: roleForSupabase };
      let profileData = {
        email,
        full_name: fullName,
        role: roleForSupabase,
        onboarding_completed: false,
      };

      if (selectedRole === "company") {
        const companyName = registerForm.querySelector("#reg-company-name")?.value.trim();
        const companyRole = registerForm.querySelector("#reg-company-role")?.value;
        const companySize = registerForm.querySelector("#reg-company-size")?.value;

        if (!companyName || !companyRole) {
          setRegStatus("error", "⚠️", "Faltan datos de la empresa.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Crear mi cuenta";
            submitBtn.classList.remove("is-loading");
          }
          return;
        }

        metadata = {
          ...metadata,
          company_name: companyName,
          company_role: companyRole,
          company_size: companySize,
        };
        profileData = {
          ...profileData,
          company_name: companyName,
          company_role: companyRole,
          company_size: companySize,
          verified: false,
        };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });

        if (error) throw error;

        // Upsert profile
        if (data.user) {
          profileData.id = data.user.id;
          await supabase.from("profiles").upsert(profileData);

          // Setup Step 3
          const verifyEmailEl = root.querySelector("[data-verify-email]");
          if (verifyEmailEl) verifyEmailEl.textContent = email;

          // Attach resend logic
          const btnResend = root.querySelector("[data-btn-resend]");
          const resendStatus = root.querySelector("[data-resend-status]");
          if (btnResend) {
            btnResend.onclick = async () => {
              btnResend.disabled = true;
              await supabase.auth.resend({ type: "signup", email });
              if (resendStatus) {
                resendStatus.className = "ms-status msg-success";
                resendStatus.innerHTML = "✅ Correo reenviado.";
              }
              setTimeout(() => {
                btnResend.disabled = false;
              }, 60000);
            };
          }

          // Animate to Step 3
          animateTransition(2, 3);
        }
      } catch (err) {
        console.error("Signup error:", err.message);
        setRegStatus("error", "⚠️", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Crear mi cuenta";
          submitBtn.classList.remove("is-loading");
        }
      }
    });
  }
}
