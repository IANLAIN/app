/**
 * main.js — SPA Orchestrator for incluIA
 * Handles page fetching, history navigation, and initializes all modules.
 */
import { setupNavigation, setActiveNav } from "./navigation.js";
import { initAuth } from "./auth.js";
import { initAiSim } from "./ai-sim.js";
import { initI18nSelect, initLanguageGate, applyTranslations } from "./i18n.js";
import { initTheme } from "./theme.js";
import { initOnboarding } from "./onboarding.js";
import { initDonate } from "./donate.js";

const app = document.getElementById("app");
const defaultRoute = "index.html";

const routes = new Map([
  ["index.html", defaultRoute],
  ["login.html", "pages/login.html"],
  ["register.html", "pages/register.html"],
  ["dashboard-candidate.html", "pages/dashboard-candidate.html"],
  ["dashboard-company.html", "pages/dashboard-company.html"],
  ["donate.html", "pages/donate.html"],
  ["mentoring.html", "pages/mentoring.html"],
  ["onboarding.html", "pages/onboarding.html"],
  ["pages/login.html", "pages/login.html"],
  ["pages/register.html", "pages/register.html"],
  ["pages/dashboard-candidate.html", "pages/dashboard-candidate.html"],
  ["pages/dashboard-company.html", "pages/dashboard-company.html"],
  ["pages/donate.html", "pages/donate.html"],
  ["pages/mentoring.html", "pages/mentoring.html"],
  ["pages/onboarding.html", "pages/onboarding.html"],
  ["pages/candidate-dashboard.html", "pages/dashboard-candidate.html"],
  ["pages/company-dashboard.html", "pages/dashboard-company.html"],
]);

function resolveRoutePath(path) {
  if (!path) return defaultRoute;
  const clean = path.split("?")[0].replace(/^\//, "");
  if (routes.has(clean)) return routes.get(clean);
  if (clean.startsWith("pages/")) {
    const fileName = clean.slice(clean.lastIndexOf("/") + 1);
    if (routes.has(fileName)) return routes.get(fileName);
    return clean;
  }
  const asPagePath = `pages/${clean}`;
  if (routes.has(asPagePath)) return routes.get(asPagePath);
  if (clean.endsWith(".html") && !clean.includes("/")) return `pages/${clean}`;
  return clean;
}

// Resolve the current location to a known route.
function resolveRouteFromLocation() {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.endsWith("/") || path.endsWith("/index.html")) {
    return defaultRoute;
  }
  const match = Array.from(routes.keys()).find((key) => path.endsWith(key));
  return match ? routes.get(match) : defaultRoute;
}

function getUserType() {
  const userType = localStorage.getItem("app-user-type");
  if (userType) return userType;
  const role = localStorage.getItem("user_role");
  if (role === "company") return "empresa";
  if (role === "candidate") return "candidato";
  return "visitante";
}

// Track current route to avoid redundant loads
let currentRoute = null;

// Fetch a page and inject its main content into the shell.
async function loadPage(path, { pushState = true, initialLoad = false } = {}) {
  if (!app) return;
  const resolvedPath = resolveRoutePath(path);

  // Skip if same route (unless initial load)
  if (!initialLoad && resolvedPath === currentRoute) return;
  currentRoute = resolvedPath;

  try {
    if (initialLoad) {
      upgradeInternalLinks(app);
      initPageInteractions(app);
      setActiveNav(resolvedPath);
    if (resolvedPath === 'index.html') {
      document.body.classList.add('is-home-route');
    } else {
      document.body.classList.remove('is-home-route');
    }

      applyTranslations();
      updateAuthUI();
      initScrollAnimations(app);
      return;
    }

    // Use absolute URL for fetch to avoid relative path resolution issues
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '').replace(/\/pages\/?.*/, '/');
    const fetchUrl = new URL(resolvedPath, baseUrl).href;
    const response = await fetch(fetchUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Fetch failed");
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const content = parsed.getElementById("page-content");
    if (!content) throw new Error("Content missing");

    // Fade out
    app.style.opacity = "0";
    app.style.transform = "translateY(8px)";

    await new Promise(r => setTimeout(r, 120));
    app.innerHTML = content.innerHTML;
    upgradeInternalLinks(app);
    if (parsed.title) document.title = parsed.title;
    initPageInteractions(app);
    setActiveNav(resolvedPath);
    if (resolvedPath === 'index.html') {
      document.body.classList.add('is-home-route');
    } else {
      document.body.classList.remove('is-home-route');
    }

    applyTranslations();
    updateAuthUI();

    if (pushState) {
      // Use the root-relative path for pushState
      const stateUrl = baseUrl.replace(window.location.origin, '') + resolvedPath;
      history.pushState({ path: resolvedPath }, "", stateUrl);
    }

    // Fade in
    requestAnimationFrame(() => {
      app.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      app.style.opacity = "1";
      app.style.transform = "translateY(0)";
    });

    initScrollAnimations(app);
    window.scrollTo({ top: 0, behavior: "smooth" });
    app.focus();
  } catch {
    app.innerHTML = `
      <div class="card" style="max-width:600px;margin:80px auto;text-align:center;">
        <h2>Error al cargar</h2>
        <p style="color:var(--color-muted);">La página no se pudo cargar. Intenta nuevamente o usa el menú.</p>
        <a href="index.html" data-nav class="btn btn-primary" style="margin-top:16px;">Volver al inicio</a>
      </div>`;
    app.style.opacity = "1";
    app.style.transform = "none";
  }
}

// Initialize UI behavior for the current page.
function initPageInteractions(root) {
  initAuth(root);
  initAiSim(root);
  initOnboarding(root);
  initDonate(root);
}

// Update login/logout button visibility
function updateAuthUI() {
  const btnLogout = document.getElementById("btn-logout");
  const btnLogin = document.getElementById("btn-login");

  const isDemo = localStorage.getItem("demo_session") === "true";
  const userId = localStorage.getItem("user_id");
  
  if (isDemo || userId) {
    btnLogout?.classList.remove("hidden");
    btnLogin?.classList.add("hidden");
  } else {
    btnLogout?.classList.add("hidden");
    btnLogin?.classList.remove("hidden");
  }
}

// Mark internal links for SPA interception.
// Path normalization is handled by navigation.js normalizeRoute().
function upgradeInternalLinks(root) {
  const pageFiles = new Set([
    "login.html", "register.html", "dashboard-candidate.html",
    "dashboard-company.html", "mentoring.html", "onboarding.html",
    "donate.html", "index.html",
  ]);

  root.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;

    // Extract filename from any path format
    const fileName = href.replace(/^\.\.\//, "").replace(/^\.\//, "").replace(/^pages\//, "").split("?")[0].split("/").pop();
    if (pageFiles.has(fileName)) {
      link.setAttribute("data-nav", "");
    }
  });
}

// ── Intersection Observer — scroll animations ─────────────────
function initScrollAnimations(root) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = root.querySelectorAll(
    "section, .card, .feature-card, .stat-card, .auth-panel, .auth-aside"
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          entry.target.classList.remove("section-hidden");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  targets.forEach((el) => {
    el.classList.add("section-hidden");
    observer.observe(el);
  });
}

// ── Auth-guarded navigation ──────────────────────────────────
async function checkAuthAndLoad(path, options) {
  const resolvedPath = resolveRoutePath(path);
  const isDashboard = resolvedPath.includes("dashboard");

  const userType = getUserType();
  const candidateOnly = new Set([
    "pages/dashboard-candidate.html",
    "pages/mentoring.html",
    "pages/onboarding.html",
  ]);
  const companyOnly = new Set([
    "pages/dashboard-company.html",
    "pages/why.html",
    "pages/donate.html",
  ]);

  if (candidateOnly.has(resolvedPath)) {
    if (userType === "empresa") {
      loadPage("pages/dashboard-company.html", options);
      return;
    }
    if (userType === "visitante") {
      loadPage("index.html", options);
      return;
    }
  }

  if (companyOnly.has(resolvedPath)) {
    if (userType === "candidato") {
      loadPage("pages/dashboard-candidate.html", options);
      return;
    }
    if (userType === "visitante") {
      loadPage("index.html", options);
      return;
    }
  }

  const isDemo = localStorage.getItem("demo_session") === "true";
  const userId = localStorage.getItem("user_id");
  const isAuthenticated = isDemo || userId;

  // Dashboard protection — require session
  if (isDashboard && !isAuthenticated) {
    loadPage("pages/login.html", options);
    return;
  }

  // Redirect to dashboard if logged in and visiting auth pages
  if (
    isAuthenticated &&
    (path === defaultRoute ||
      path.includes("login") ||
      path.includes("register"))
  ) {
    const role = localStorage.getItem("user_role") || "candidate";
    loadPage(`pages/dashboard-${role}.html`, {
      ...options,
      initialLoad: false,
    });
    return;
  }

  loadPage(path, options);
}

// ── App Initialization ──────────────────────────────────────
if (app) {
  // Expose SPA navigate so auth.js and other modules can redirect
  window.__spaNavigate = (path) => loadPage(path);

  initTheme();
  initI18nSelect();
  initLanguageGate();
  setupNavigation({ onNavigate: loadPage, useSpa: true });

  window.addEventListener("popstate", () => {
    const path = resolveRouteFromLocation();
    checkAuthAndLoad(path, { pushState: false });
  });

  const initial = resolveRouteFromLocation();
  checkAuthAndLoad(initial, { pushState: false, initialLoad: true });
} else {
  initTheme();
  initI18nSelect();
  initLanguageGate();
  setupNavigation({ useSpa: false });
  initPageInteractions(document);
  applyTranslations();
  initScrollAnimations(document);
}
