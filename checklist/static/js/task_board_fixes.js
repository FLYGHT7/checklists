/**
 * Fixes para el tablero de tareas
 * - Actualiza la barra de progreso en tiempo real
 * - Muestra/oculta los mensajes de columnas vacías
 */
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si estamos en la página del tablero de tareas
    if (!document.querySelector(".task-board")) return
  
    // Función para actualizar la barra de progreso y los mensajes vacíos
    function updateTaskBoard() {
      const todoCount = document.querySelectorAll("#todo-tasks .task-card").length
      const progressCount = document.querySelectorAll("#progress-tasks .task-card").length
      const doneCount = document.querySelectorAll("#done-tasks .task-card").length
      const totalCount = todoCount + progressCount + doneCount
  
      // Actualizar contadores
      updateCounter("todo-count", todoCount)
      updateCounter("progress-count", progressCount)
      updateCounter("done-count", doneCount)
  
      updateCounter("todo-stat", todoCount)
      updateCounter("progress-stat", progressCount)
      updateCounter("done-stat", doneCount)
  
      // Calcular porcentaje
      let percentage = 0
      if (totalCount > 0) {
        percentage = Math.round((doneCount / totalCount) * 100)
      }
  
      // Actualizar barra de progreso
      const progressBar = document.getElementById("main-progress-bar")
      if (progressBar) {
        progressBar.style.width = percentage + "%"
        progressBar.setAttribute("aria-valuenow", percentage.toString())
      }
  
      // Actualizar texto de porcentaje
      const percentageText = document.getElementById("progress-percentage")
      if (percentageText) {
        percentageText.textContent = percentage + "%"
      }
  
      // Actualizar texto de tareas completadas
      const tasksCompletedText = document.getElementById("tasks-completed-text")
      if (tasksCompletedText) {
        tasksCompletedText.textContent = `${doneCount} de ${totalCount} tareas completadas`
      }
  
      // Mostrar/ocultar mensajes de columnas vacías
      toggleEmptyMessage("todo", todoCount)
      toggleEmptyMessage("progress", progressCount)
      toggleEmptyMessage("done", doneCount)
    }
  
    // Función auxiliar para actualizar contadores
    function updateCounter(id, value) {
      const element = document.getElementById(id)
      if (element) {
        element.textContent = value
      }
    }
  
    // Función para mostrar/ocultar mensajes de columnas vacías
    function toggleEmptyMessage(columnType, count) {
      const emptyMessage = document.getElementById(`${columnType}-empty-message`)
      if (emptyMessage) {
        if (count > 0) {
          emptyMessage.style.display = "none"
        } else {
          emptyMessage.style.display = "block"
        }
      }
    }
  
    // Observar cambios en las columnas de tareas
    function observeTaskColumns() {
      const config = { childList: true, subtree: false }
      const observer = new MutationObserver((mutations) => {
        // Actualizar el tablero cuando hay cambios
        updateTaskBoard()
      })
  
      // Observar cada columna
      const columns = ["todo-tasks", "progress-tasks", "done-tasks"]
      columns.forEach((columnId) => {
        const column = document.getElementById(columnId)
        if (column) {
          observer.observe(column, config)
        }
      })
    }
  
    // Interceptar eventos de drag and drop
    function interceptDragEvents() {
      // Capturar el evento dragend en todo el documento
      document.addEventListener("dragend", () => {
        // Pequeño retraso para asegurar que el DOM se ha actualizado
        setTimeout(updateTaskBoard, 50)
      })
  
      // Sobrescribir la función updateTaskStatus si existe
      if (window.updateTaskStatus) {
        const originalUpdateTaskStatus = window.updateTaskStatus
        window.updateTaskStatus = function () {
          const result = originalUpdateTaskStatus.apply(this, arguments)
          if (result instanceof Promise) {
            result.then(() => updateTaskBoard())
          } else {
            updateTaskBoard()
          }
          return result
        }
      }
  
      // Sobrescribir la función updateTasksOrder si existe
      if (window.updateTasksOrder) {
        const originalUpdateTasksOrder = window.updateTasksOrder
        window.updateTasksOrder = function () {
          const result = originalUpdateTasksOrder.apply(this, arguments)
          updateTaskBoard()
          return result
        }
      }
    }
  
    // Inicializar
    updateTaskBoard()
    observeTaskColumns()
    interceptDragEvents()
  })
  