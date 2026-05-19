/**
 * theme.js — Dark mode toggle + dyslexic font toggle
 * Persists choices to localStorage for cross-page continuity.
 */
export function initTheme() {
  // ── Dark Mode Toggle ─────────────────────────────────────
  const themeToggle = document.getElementById("theme-toggle");
  const html = document.documentElement;

  function getThemePolicy() {
    const userType = localStorage.getItem("app-user-type");
    const candidateType = localStorage.getItem("app-candidate-type");

    if (userType === "visitante" || userType === "empresa") {
      return { allowDark: false, allowToggle: false, enforced: "light" };
    }

    if (userType === "candidato" && candidateType === "down") {
      return { allowDark: false, allowToggle: false, enforced: "light" };
    }

    if (userType === "candidato" && (candidateType === "autismo" || candidateType === "tdah")) {
      return { allowDark: true, allowToggle: true, enforced: null };
    }

    return { allowDark: true, allowToggle: true, enforced: null };
  }

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☀" : "☾";
      themeToggle.setAttribute(
        "aria-pressed",
        theme === "dark" ? "true" : "false"
      );
    }
  }

  function applyThemePolicy() {
    const policy = getThemePolicy();
    if (themeToggle) {
      const hideToggle = !policy.allowToggle;
      themeToggle.classList.toggle("theme-toggle-hidden", hideToggle);
      themeToggle.setAttribute("aria-hidden", hideToggle ? "true" : "false");
      themeToggle.disabled = hideToggle;
    }

    if (policy.enforced) {
      applyTheme(policy.enforced);
      return;
    }

    const saved = localStorage.getItem("app-theme");
    if (saved === "dark" && !policy.allowDark) {
      applyTheme("light");
    }
  }

  // Init from localStorage or system preference
  const policy = getThemePolicy();
  const saved = localStorage.getItem("app-theme");
  if (saved && (saved === "light" || policy.allowDark)) {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(policy.allowDark && prefersDark ? "dark" : "light");
  }

  // Init User Type Theme (Empresa, etc.)
  const userType = localStorage.getItem("app-user-type");
  if (userType) {
    html.setAttribute("data-user-type", userType);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = html.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      const nextPolicy = getThemePolicy();
      if (next === "dark" && !nextPolicy.allowDark) {
        applyTheme("light");
        return;
      }
      applyTheme(next);
    });
  }

  // ── Dyslexic Font Toggle ───────────────────────────────────
  const dyslexicToggle = document.getElementById("dyslexic-toggle");

  function applyFont(font) {
    if (font === "dyslexic") {
      html.setAttribute("data-font", "dyslexic");
      localStorage.setItem("app-font", "dyslexic");
    } else {
      html.removeAttribute("data-font");
      localStorage.removeItem("app-font");
    }
    if (dyslexicToggle) {
      dyslexicToggle.setAttribute(
        "aria-pressed",
        font === "dyslexic" ? "true" : "false"
      );
      dyslexicToggle.style.background =
        font === "dyslexic" ? "var(--color-primary)" : "";
      dyslexicToggle.style.color =
        font === "dyslexic" ? "var(--btn-primary-text)" : "";
    }
  }

  // Init font from localStorage
  const savedFont = localStorage.getItem("app-font");
  applyFont(savedFont || "default");

  if (dyslexicToggle) {
    dyslexicToggle.addEventListener("click", () => {
      const current = html.getAttribute("data-font");
      applyFont(current === "dyslexic" ? "default" : "dyslexic");
    });
  }

  applyThemePolicy();
  window.__applyThemePolicy = applyThemePolicy;
}
