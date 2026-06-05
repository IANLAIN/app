/**
 * navigation.js — SPA link interception & mobile menu
 * Intercepts [data-nav] link clicks and normalizes routes.
 */

export function setupNavigation({ onNavigate, useSpa }) {
  const navToggle = document.querySelector("[data-nav-toggle]");

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (!useSpa || !onNavigate) return;

  // Known page filenames → canonical SPA routes
  const pageFiles = new Set([
    "login.html",
    "register.html",
    "dashboard-candidate.html",
    "dashboard-company.html",
    "candidate-dashboard.html",
    "company-dashboard.html",

    "mentoring.html",
    "onboarding.html",
  ]);

  /**
   * Normalize any href into a canonical route string.
   * Always returns either "index.html" or "pages/xxx.html"
   */
  function normalizeRoute(href) {
    try {
      // Strip ../ and ./ prefixes for relative paths
      let cleaned = href.replace(/^\.\.\//, "").replace(/^\.\//, "");

      // Strip leading slashes
      cleaned = cleaned.replace(/^\/+/, "");

      // Remove query strings and hash
      cleaned = cleaned.split("?")[0].split("#")[0];

      // Fix doubled "pages/pages/"
      cleaned = cleaned.replace(/^(pages\/)+/, "pages/");

      // Extract just the filename
      const parts = cleaned.split("/");
      const fileName = parts[parts.length - 1] || "index.html";

      // Root/index → index.html
      if (!fileName || fileName === "index.html" || cleaned === "") {
        return "index.html";
      }

      // Known page files → always "pages/filename"
      if (pageFiles.has(fileName)) {
        return `pages/${fileName}`;
      }

      // Already has pages/ prefix
      if (cleaned.startsWith("pages/")) {
        return cleaned;
      }

      return cleaned;
    } catch {
      return href;
    }
  }

  function isInternalLink(link) {
    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("http://") ||
      href.startsWith("https://")
    ) {
      // Allow same-origin absolute URLs
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        try {
          return new URL(href).origin === window.location.origin;
        } catch {
          return false;
        }
      }
      return false;
    }
    return true;
  }

  // Global click delegation for all internal links
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (!isInternalLink(link)) return;
    if (
      link.target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    const route = normalizeRoute(link.getAttribute("href"));
    onNavigate(route);

    // Close mobile menu
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  });
}

/**
 * Update active (aria-current) state for header navigation links.
 */
export function setActiveNav(currentPath) {
  const rawPath = currentPath.split("?")[0].replace(/\\/g, "/");

  // Extract just the filename for comparison
  const currentFile = rawPath.includes("/")
    ? rawPath.split("/").pop()
    : rawPath;

  document.querySelectorAll("nav a, .nav-list a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const linkFile = href
      .replace(/^\.\.\//, "")
      .replace(/^\.\//, "")
      .replace(/^pages\//, "")
      .split("?")[0]
      .split("/")
      .pop();

    const isActive =
      currentFile === linkFile ||
      (currentFile === "index.html" && (!linkFile || linkFile === ""));

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}
