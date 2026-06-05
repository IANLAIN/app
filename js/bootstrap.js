(function bootstrapPersistedPreferences() {
  const theme = localStorage.getItem("app-theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);

  const font = localStorage.getItem("app-font");
  if (font === "dyslexic") {
    document.documentElement.setAttribute("data-font", "dyslexic");
  } else {
    document.documentElement.removeAttribute("data-font");
  }

  const userType = localStorage.getItem("app-user-type");
  if (userType) {
    document.documentElement.setAttribute("data-user-type", userType);
  } else {
    document.documentElement.removeAttribute("data-user-type");
  }

  const candidateType = localStorage.getItem("app-candidate-type");
  if (candidateType) {
    document.documentElement.setAttribute("data-candidate-type", candidateType);
  } else {
    document.documentElement.removeAttribute("data-candidate-type");
  }
})();