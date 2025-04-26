/**
 * Formatea fechas UTC a la zona horaria local del usuario
 */
document.addEventListener("DOMContentLoaded", () => {
    // Convertir fechas UTC a la zona horaria local del usuario
    document.querySelectorAll(".datetime").forEach((element) => {
      const utcDateString = element.getAttribute("data-utc")
      if (utcDateString) {
        const date = new Date(utcDateString)
        const options = {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
        element.textContent = date.toLocaleDateString("es-ES", options).replace(",", "")
      }
    })
  })  