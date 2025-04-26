document.addEventListener("DOMContentLoaded", () => {
    // Funcionalidad para el sidebar colapsable
    const sidebarColumn = document.getElementById("sidebarColumn")
    const contentColumn = document.getElementById("contentColumn")
    const sidebarToggle = document.getElementById("sidebarToggle")
    const sidebarOverlay = document.getElementById("sidebarOverlay")
  
    // Verificar si el sidebar debe estar colapsado por defecto (recuperar del localStorage)
    const isSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true"
  
    if (isSidebarCollapsed) {
      sidebarColumn.classList.add("collapsed")
      contentColumn.classList.add("expanded")
      if (sidebarToggle && sidebarToggle.querySelector("i")) {
        sidebarToggle.querySelector("i").classList.remove("bi-chevron-left")
        sidebarToggle.querySelector("i").classList.add("bi-chevron-right")
      }
    }
  
    // Verificar si los elementos existen
    if (!sidebarColumn || !contentColumn || !sidebarToggle) {
      console.error("Elementos del sidebar no encontrados")
      return
    }
  
    // Función para alternar el estado del sidebar
    function toggleSidebar() {
      const isCollapsed = sidebarColumn.classList.contains("collapsed")
  
      if (isCollapsed) {
        // Expandir
        sidebarColumn.classList.remove("collapsed")
        contentColumn.classList.remove("expanded")
        if (sidebarToggle.querySelector("i")) {
          sidebarToggle.querySelector("i").classList.remove("bi-chevron-right")
          sidebarToggle.querySelector("i").classList.add("bi-chevron-left")
        }
      } else {
        // Colapsar
        sidebarColumn.classList.add("collapsed")
        contentColumn.classList.add("expanded")
        if (sidebarToggle.querySelector("i")) {
          sidebarToggle.querySelector("i").classList.remove("bi-chevron-left")
          sidebarToggle.querySelector("i").classList.add("bi-chevron-right")
        }
      }
  
      // Guardar estado en localStorage
      localStorage.setItem("sidebarCollapsed", sidebarColumn.classList.contains("collapsed"))
  
      // En móviles, mostrar/ocultar el overlay
      toggleOverlay()
    }
  
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", (e) => {
        e.preventDefault()
        toggleSidebar()
      })
    }
  
    // Cerrar sidebar al hacer clic en el overlay (solo en móviles)
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        if (!sidebarColumn.classList.contains("collapsed")) {
          toggleSidebar()
        }
      })
    }
  
    // Mostrar/ocultar overlay en dispositivos móviles
    function toggleOverlay() {
      if (window.innerWidth <= 768 && sidebarOverlay) {
        if (sidebarColumn.classList.contains("collapsed")) {
          sidebarOverlay.classList.remove("active")
          document.body.style.overflow = ""
        } else {
          sidebarOverlay.classList.add("active")
          document.body.style.overflow = "hidden" // Prevenir scroll del body
        }
      }
    }
  
    // Ajustar el overlay al cambiar el tamaño de la ventana
    window.addEventListener("resize", () => {
      toggleOverlay()
    })
  
    // Inicializar el estado del overlay
    toggleOverlay()
  })  