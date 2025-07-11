export function applyTheme() {
  let savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  function setTheme(event) {
    // If there's no saved theme, use system preference
    if (!savedTheme) {
      savedTheme = event
        ? event.matches
          ? "dark"
          : "light"
        : prefersDark.matches
        ? "dark"
        : "light";
    }
    const isDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }
  setTheme();
  prefersDark.addEventListener("change", setTheme);
}

export function toggleTheme() {
  const isDarkMode = document.documentElement.classList.contains("dark");
  if (isDarkMode) {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
} 