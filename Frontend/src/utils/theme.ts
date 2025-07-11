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

// Haversine formula to calculate distance between two lat/lng points in kilometers
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
} 