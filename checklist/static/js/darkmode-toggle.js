document.addEventListener("DOMContentLoaded", () => {
  // Get both dark mode toggle buttons
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  const darkModeToggleMobile = document.getElementById("dark-mode-toggle-mobile")

  // Function to toggle dark mode
  function toggleDarkMode() {
    // Obtener el tema actual
    const currentTheme = document.documentElement.getAttribute("data-bs-theme")
    const newTheme = currentTheme === "light" ? "dark" : "light"

    // Cambiar el tema
    document.documentElement.setAttribute("data-bs-theme", newTheme)

    // Guardar el tema en localStorage
    localStorage.setItem("theme", newTheme)

    // Cambiar el ícono dependiendo del tema
    const icons = [document.getElementById("toggle-icon"), document.getElementById("toggle-icon-mobile")]

    icons.forEach((icon) => {
      if (icon) {
        if (newTheme === "dark") {
          icon.classList.remove("bi-moon-fill")
          icon.classList.add("bi-sun-fill")
        } else {
          icon.classList.remove("bi-sun-fill")
          icon.classList.add("bi-moon-fill")
        }

        // Activar la animación de rotación en el ícono
        icon.classList.add("rotate-animation")

        // Eliminar la animación después de que termine
        setTimeout(() => {
          icon.classList.remove("rotate-animation")
        }, 500) // Duración de la animación: 500ms
      }
    })
  }

  // Add click event to both buttons
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode)
  }

  if (darkModeToggleMobile) {
    darkModeToggleMobile.addEventListener("click", toggleDarkMode)
  }

  // Restore theme on page load
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme) {
    // Aplicar el tema guardado
    document.documentElement.setAttribute("data-bs-theme", savedTheme)

    // Cambiar el ícono dependiendo del tema
    const icons = [document.getElementById("toggle-icon"), document.getElementById("toggle-icon-mobile")]

    icons.forEach((icon) => {
      if (icon) {
        if (savedTheme === "dark") {
          icon.classList.remove("bi-moon-fill")
          icon.classList.add("bi-sun-fill")
        } else {
          icon.classList.remove("bi-sun-fill")
          icon.classList.add("bi-moon-fill")
        }
      }
    })
  }
})