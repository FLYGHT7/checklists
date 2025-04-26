/**
 * Todo List Fixes - Script para corregir problemas específicos en la vista de listas de tareas
 *
 * Este script soluciona:
 * 1. Los mensajes "No hay tareas" que no desaparecen cuando hay tareas
 * 2. La actualización de la barra de progreso en tiempo real
 */

document.addEventListener("DOMContentLoaded", () => {
    // Verificar si estamos en la página de detalles de lista de tareas
    const todoListDetail = document.querySelector(".task-board")
    if (!todoListDetail) return
  
    // Función para verificar y actualizar los mensajes de "No hay tareas"
    function updateEmptyMessages() {
      // Columnas a verificar
      const columns = [
        { id: "todo-tasks", emptyId: "todo-empty-message" },
        { id: "progress-tasks", emptyId: "progress-empty-message" },
        { id: "done-tasks", emptyId: "done-empty-message" },
      ]
  
      // Verificar cada columna
      columns.forEach((column) => {
        const columnElement = document.getElementById(column.id)
        const emptyMessage = document.getElementById(column.emptyId)
  
        if (columnElement && emptyMessage) {
          // Contar las tareas en la columna (excluyendo el mensaje vacío)
          const tasks = columnElement.querySelectorAll(".task-card")
  
          // Mostrar u ocultar el mensaje según corresponda
          if (tasks.length > 0) {
            emptyMessage.style.display = "none"
          } else {
            emptyMessage.style.display = "block"
          }
  
          // Actualizar el contador si existe
          const countElement = document.querySelector(`[data-column="${column.id.split("-")[0]}"] .task-count`)
          if (countElement) {
            countElement.textContent = tasks.length
          }
        }
      })
  
      // Actualizar la barra de progreso
      updateProgressBar()
    }
  
    // Función para actualizar la barra de progreso
    function updateProgressBar() {
      // Contar tareas en cada columna
      const todoCount = document.querySelectorAll("#todo-tasks .task-card").length
      const progressCount = document.querySelectorAll("#progress-tasks .task-card").length
      const doneCount = document.querySelectorAll("#done-tasks .task-card").length
      const totalCount = todoCount + progressCount + doneCount
  
      // Calcular el porcentaje
      let percentage = 0
      if (totalCount > 0) {
        percentage = Math.round((doneCount / totalCount) * 100)
      }
  
      // Actualizar la barra de progreso
      const progressBar = document.getElementById("main-progress-bar")
      if (progressBar) {
        progressBar.style.width = percentage + "%"
        progressBar.setAttribute("aria-valuenow", percentage.toString())
        progressBar.setAttribute("data-done-count", doneCount)
        progressBar.setAttribute("data-total-count", totalCount)
      }
  
      // Actualizar el texto del porcentaje
      const percentageText = document.getElementById("progress-percentage")
      if (percentageText) {
        percentageText.textContent = percentage + "%"
      }
  
      // Actualizar el texto de tareas completadas
      const tasksCompletedText = document.getElementById("tasks-completed-text")
      if (tasksCompletedText) {
        tasksCompletedText.textContent = `${doneCount} de ${totalCount} tareas completadas`
        tasksCompletedText.setAttribute("data-done-count", doneCount)
        tasksCompletedText.setAttribute("data-total-count", totalCount)
      }
  
      // Actualizar las estadísticas
      const todoStat = document.getElementById("todo-stat")
      const progressStat = document.getElementById("progress-stat")
      const doneStat = document.getElementById("done-stat")
  
      if (todoStat) todoStat.textContent = todoCount
      if (progressStat) progressStat.textContent = progressCount
      if (doneStat) doneStat.textContent = doneCount
    }
  
    // Observar cambios en las columnas de tareas
    function observeTaskColumns() {
      // Configurar el observador
      const config = { childList: true, subtree: true }
      const observer = new MutationObserver((mutations) => {
        updateEmptyMessages()
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
  
    // Ejecutar la verificación inicial
    updateEmptyMessages()
  
    // Configurar el observador para detectar cambios
    observeTaskColumns()
  
    // Agregar evento para actualizar después de arrastrar y soltar
    document.addEventListener("dragend", () => {
      // Pequeño retraso para asegurar que el DOM se ha actualizado
      setTimeout(updateEmptyMessages, 50)
    })
  })  