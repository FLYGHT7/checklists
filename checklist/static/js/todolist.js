document.addEventListener("DOMContentLoaded", () => {
  // Seleccionar todos los elementos de tarjetas de tareas
  const taskCards = document.querySelectorAll(".task-card")
  const taskColumns = document.querySelectorAll(".task-items")
  const taskCounts = document.querySelectorAll(".task-count")

  // Detectar si estamos en un dispositivo táctil
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0

  // Variables para el arrastre
  let draggedCard = null
  let initialColumn = null

  // Configurar las tarjetas para arrastre
  taskCards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart)
    card.addEventListener("dragend", handleDragEnd)
  })

  // Configurar las zonas donde se pueden soltar las tarjetas
  taskColumns.forEach((column) => {
    column.addEventListener("dragover", handleDragOver)
    column.addEventListener("dragenter", handleDragEnter)
    column.addEventListener("dragleave", handleDragLeave)
    column.addEventListener("drop", handleDrop)
  })

  // Funciones para drag and drop
  function handleDragStart(e) {
    draggedCard = this
    initialColumn = this.parentNode
    setTimeout(() => {
      this.classList.add("dragging")
    }, 0)

    // Guardar el ID de la tarea y la columna inicial
    e.dataTransfer.setData("text/plain", this.dataset.taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragEnd() {
    this.classList.remove("dragging")
    updateTaskCounts()
  }

  function handleDragOver(e) {
    if (!draggedCard) return
    e.preventDefault()
  }

  function handleDragEnter(e) {
    if (!draggedCard) return
    e.preventDefault()
    this.classList.add("drag-over")
  }

  function handleDragLeave() {
    this.classList.remove("drag-over")
  }

  function handleDrop(e) {
    e.preventDefault()
    this.classList.remove("drag-over")

    if (draggedCard && this !== draggedCard.parentNode) {
      // Remover la tarjeta de su columna actual
      draggedCard.parentNode.removeChild(draggedCard)

      // Añadir la tarjeta a la nueva columna
      this.appendChild(draggedCard)

      // Añadir clase para animación de "recién soltado"
      draggedCard.classList.add("just-dropped")
      setTimeout(() => {
        draggedCard.classList.remove("just-dropped")
      }, 500)

      // Actualizar el estado de la tarea en el servidor
      updateTaskStatus(draggedCard.dataset.taskId, this.dataset.column)
    }

    updateTaskCounts()
  }

  // Función para actualizar el estado de la tarea en el servidor
  function updateTaskStatus(taskId, newStatus) {
    // Obtener el token CSRF
    const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value

    // Enviar la solicitud al servidor
    fetch(`/api/tasks/${taskId}/status/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.id) {
          showToast("Tarea actualizada correctamente", "success")
        } else {
          showToast("Error al actualizar la tarea", "error")
          // Si hay un error, devolver la tarjeta a su columna original
          if (initialColumn && draggedCard) {
            draggedCard.parentNode.removeChild(draggedCard)
            initialColumn.appendChild(draggedCard)
            updateTaskCounts()
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al actualizar la tarea", "error")
        // Si hay un error, devolver la tarjeta a su columna original
        if (initialColumn && draggedCard) {
          draggedCard.parentNode.removeChild(draggedCard)
          initialColumn.appendChild(draggedCard)
          updateTaskCounts()
        }
      })
  }

  // Función para actualizar los contadores de tareas
  function updateTaskCounts() {
    const columns = document.querySelectorAll(".task-column")

    columns.forEach((column) => {
      const count = column.querySelector(".task-items").children.length
      const countElement = column.querySelector(".task-count")
      if (countElement) {
        countElement.textContent = count
      }
    })
  }

  // Inicializar los contadores de tareas
  updateTaskCounts()

  // Función para mostrar toast
  function showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")

    toast.innerHTML = `
      <div class="toast-body">
        ${message}
      </div>
    `

    const toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      const newToastContainer = document.createElement("div")
      newToastContainer.id = "toastContainer"
      newToastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
      document.body.appendChild(newToastContainer)
      newToastContainer.appendChild(toast)
    } else {
      toastContainer.appendChild(toast)
    }

    // Mostrar el toast
    toast.classList.add("show")

    // Eliminar después de 3 segundos
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        toast.parentNode.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // Configurar el modal de eliminación de tareas
  const deleteTaskModal = document.getElementById("deleteTaskModal")
  if (deleteTaskModal) {
    deleteTaskModal.addEventListener("show.bs.modal", (event) => {
      // Botón que activó el modal
      const button = event.relatedTarget

      // Extraer el ID de la tarea
      const taskId = button.getAttribute("data-task-id")

      // Actualizar el botón de confirmación con el ID de la tarea
      const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
      confirmDeleteBtn.setAttribute("data-task-id", taskId)
    })

    // Manejar la eliminación de la tarea
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", function () {
        const taskId = this.getAttribute("data-task-id")
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value

        // Enviar la solicitud al servidor
        fetch(`/tasks/${taskId}/delete/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              // Eliminar la tarjeta del DOM
              const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`)
              if (taskCard) {
                taskCard.remove()
              }

              // Cerrar el modal
              const modal = bootstrap.Modal.getInstance(deleteTaskModal)
              modal.hide()

              // Mostrar mensaje de éxito
              showToast("Tarea eliminada correctamente", "success")

              // Actualizar contadores
              updateTaskCounts()
            } else {
              showToast("Error al eliminar la tarea", "error")
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            showToast("Error al eliminar la tarea", "error")
          })
      })
    }
  }

  // Inicializar tema
  initTheme()

  // Función para inicializar el tema
  function initTheme() {
    const savedTheme = localStorage.getItem("theme")
    const themeIcon = document.getElementById("theme-icon")

    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-bs-theme", "dark")
      if (themeIcon) {
        themeIcon.classList.remove("bi-moon-fill")
        themeIcon.classList.add("bi-sun-fill")
      }
    } else {
      document.documentElement.setAttribute("data-bs-theme", "light")
      if (themeIcon) {
        themeIcon.classList.remove("bi-sun-fill")
        themeIcon.classList.add("bi-moon-fill")
      }
    }
  }

  // Botón para cambiar el tema
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const themeIcon = document.getElementById("theme-icon")

      if (document.documentElement.getAttribute("data-bs-theme") === "dark") {
        document.documentElement.setAttribute("data-bs-theme", "light")
        localStorage.setItem("theme", "light")
        if (themeIcon) {
          themeIcon.classList.remove("bi-sun-fill")
          themeIcon.classList.add("bi-moon-fill")
        }
      } else {
        document.documentElement.setAttribute("data-bs-theme", "dark")
        localStorage.setItem("theme", "dark")
        if (themeIcon) {
          themeIcon.classList.remove("bi-moon-fill")
          themeIcon.classList.add("bi-sun-fill")
        }
      }
    })
  }
})