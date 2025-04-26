document.addEventListener("DOMContentLoaded", () => {
  // Seleccionar todos los elementos de tarjetas de tareas
  const taskCards = document.querySelectorAll(".task-card")
  const taskColumns = document.querySelectorAll(".task-items")
  const taskCounts = document.querySelectorAll(".task-count")

  // Detectar si estamos en un dispositivo táctil de manera más confiable
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0

  console.log("¿Es dispositivo táctil?", isTouchDevice)

  // Variables para el arrastre
  let draggedCard = null
  let touchStartX = 0
  let touchStartY = 0
  let initialColumn = null
  let ghostElement = null
  let activeColumn = null
  let longPressTimer = null
  let isDragging = false

  // Configurar las tarjetas para arrastre
  taskCards.forEach((card) => {
    if (!isTouchDevice) {
      // Para dispositivos de escritorio
      card.setAttribute("draggable", "true")
      card.addEventListener("dragstart", handleDragStart)
      card.addEventListener("dragend", handleDragEnd)
    } else {
      // Para dispositivos táctiles
      card.setAttribute("draggable", "false") // Desactivar el arrastre nativo

      // Usar eventos táctiles
      card.addEventListener("touchstart", handleTouchStart, { passive: false })
      card.addEventListener("touchmove", handleTouchMove, { passive: false })
      card.addEventListener("touchend", handleTouchEnd)
      card.addEventListener("touchcancel", handleTouchEnd)

      // Prevenir el comportamiento de arrastre nativo en móviles
      card.addEventListener("dragstart", (e) => e.preventDefault())

      // Agregar un indicador visual para dispositivos táctiles
      const indicator = document.createElement("div")
      indicator.className = "touch-indicator"
      indicator.innerHTML = '<i class="bi bi-grip-horizontal"></i>'
      card.appendChild(indicator)
    }
  })

  // Configurar las zonas donde se pueden soltar las tarjetas
  taskColumns.forEach((column) => {
    if (!isTouchDevice) {
      column.addEventListener("dragover", handleDragOver)
      column.addEventListener("dragenter", handleDragEnter)
      column.addEventListener("dragleave", handleDragLeave)
      column.addEventListener("drop", handleDrop)
    }
  })

  // FUNCIONES PARA EVENTOS DE MOUSE (DESKTOP)

  function handleDragStart(e) {
    draggedCard = this
    setTimeout(() => {
      this.classList.add("dragging")
    }, 0)

    e.dataTransfer.setData("text/plain", this.id || "dragged-card")
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
      draggedCard.parentNode.removeChild(draggedCard)
      this.appendChild(draggedCard)

      draggedCard.classList.add("just-dropped")
      setTimeout(() => {
        draggedCard.classList.remove("just-dropped")
      }, 500)
    }

    updateTaskCounts()
    return false
  }

  // FUNCIONES PARA EVENTOS TÁCTILES (MOBILE/TABLET)

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY

    // Iniciar un temporizador para detectar pulsación larga
    clearTimeout(longPressTimer) // Limpiar cualquier temporizador existente
    longPressTimer = setTimeout(() => {
      console.log("Iniciando arrastre táctil")
      startDrag(this, touch.clientX, touch.clientY)
    }, 500) // 500ms para pulsación larga

    // Guardar la columna inicial
    initialColumn = findParentColumn(this)
  }

  function handleTouchMove(e) {
    // Si no estamos arrastrando, cancelar el temporizador si el usuario mueve el dedo
    if (!isDragging && longPressTimer) {
      const touch = e.touches[0]
      const moveX = Math.abs(touch.clientX - touchStartX)
      const moveY = Math.abs(touch.clientY - touchStartY)

      if (moveX > 10 || moveY > 10) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      return
    }

    // Si estamos arrastrando, manejar el movimiento
    if (isDragging && ghostElement && e.touches.length === 1) {
      e.preventDefault() // Prevenir el scroll

      const touch = e.touches[0]
      moveGhostElement(touch.clientX, touch.clientY)

      // Detectar sobre qué columna estamos
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      updateActiveColumn(elemBelow)
    }
  }

  function handleTouchEnd(e) {
    // Limpiar el temporizador si existe
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    // Si no estamos arrastrando, no hacer nada más
    if (!isDragging) return

    // Finalizar el arrastre
    if (ghostElement) {
      document.body.removeChild(ghostElement)
      ghostElement = null
    }

    // Quitar la clase de la tarjeta original
    if (draggedCard) {
      draggedCard.classList.remove("being-dragged")

      // Obtener la posición final del toque
      let touchX, touchY
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0]
        touchX = touch.clientX
        touchY = touch.clientY
      }

      // Detectar la columna final
      const elemBelow = document.elementFromPoint(touchX, touchY)
      const finalColumn = findParentColumn(elemBelow)

      // Mover la tarjeta si la columna final es válida y diferente de la inicial
      if (finalColumn && finalColumn !== initialColumn) {
        initialColumn.removeChild(draggedCard)
        finalColumn.appendChild(draggedCard)

        draggedCard.classList.add("just-dropped")
        setTimeout(() => {
          draggedCard.classList.remove("just-dropped")
        }, 500)
      }
    }

    // Limpiar las clases de las columnas
    taskColumns.forEach((col) => col.classList.remove("drag-over"))

    // Eliminar el overlay si existe
    const overlay = document.getElementById("touch-drag-overlay")
    if (overlay) {
      document.body.removeChild(overlay)
    }

    // Actualizar contadores y limpiar variables
    updateTaskCounts()
    draggedCard = null
    initialColumn = null
    activeColumn = null
    isDragging = false
  }

  // Función para iniciar el arrastre
  function startDrag(card, x, y) {
    isDragging = true
    draggedCard = card

    // Crear un elemento fantasma (clon visual de la tarjeta)
    ghostElement = card.cloneNode(true)
    ghostElement.classList.add("touch-dragging")
    ghostElement.style.position = "fixed"
    ghostElement.style.top = `${y - card.offsetHeight / 2}px`
    ghostElement.style.left = `${x - card.offsetWidth / 2}px`
    ghostElement.style.width = `${card.offsetWidth}px`
    ghostElement.style.opacity = "0.8"
    ghostElement.style.zIndex = "1000"
    document.body.appendChild(ghostElement)

    // Agregar clase visual a la tarjeta original
    card.classList.add("being-dragged")

    // Crear un overlay para evitar interacciones con otros elementos
    const overlay = document.createElement("div")
    overlay.id = "touch-drag-overlay"
    overlay.style.position = "fixed"
    overlay.style.top = "0"
    overlay.style.left = "0"
    overlay.style.width = "100%"
    overlay.style.height = "100%"
    overlay.style.zIndex = "999"
    document.body.appendChild(overlay)

    // Mostrar un mensaje de feedback
    const feedback = document.createElement("div")
    feedback.className = "drag-feedback"
    feedback.textContent = "Arrastrando..."
    feedback.style.position = "fixed"
    feedback.style.top = "10px"
    feedback.style.left = "50%"
    feedback.style.transform = "translateX(-50%)"
    feedback.style.background = "rgba(0,0,0,0.7)"
    feedback.style.color = "white"
    feedback.style.padding = "8px 16px"
    feedback.style.borderRadius = "20px"
    feedback.style.zIndex = "1001"
    document.body.appendChild(feedback)

    // Eliminar el mensaje después de 2 segundos
    setTimeout(() => {
      if (feedback.parentNode) {
        document.body.removeChild(feedback)
      }
    }, 2000)
  }

  function moveGhostElement(x, y) {
    if (!ghostElement) return

    ghostElement.style.top = `${y - draggedCard.offsetHeight / 2}px`
    ghostElement.style.left = `${x - draggedCard.offsetWidth / 2}px`
  }

  function updateActiveColumn(element) {
    const column = findParentColumn(element)

    // Quitar la clase de todas las columnas
    taskColumns.forEach((col) => col.classList.remove("drag-over"))

    // Agregar la clase a la columna activa
    if (column) {
      column.classList.add("drag-over")
      activeColumn = column
    }
  }

  function findParentColumn(element) {
    if (!element) return null

    // Buscar hacia arriba en el DOM hasta encontrar una columna
    while (element && !element.classList.contains("task-items")) {
      element = element.parentElement
    }
    return element
  }

  // Función para actualizar los contadores de tareas en cada columna
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

  // Agregar un mensaje de ayuda para dispositivos móviles
  if (isTouchDevice) {
    const taskContainers = document.querySelectorAll(".task-container")
    taskContainers.forEach((container) => {
      // Verificar si ya existe un mensaje de ayuda
      if (
        !container.previousElementSibling ||
        !container.previousElementSibling.classList.contains("mobile-help-text")
      ) {
        const helpText = document.createElement("div")
        helpText.className = "text-center text-muted small mb-3 mobile-help-text"
        helpText.innerHTML = "Mantén presionada una tarjeta para arrastrarla"
        container.parentNode.insertBefore(helpText, container)
      }
    })
  }
})