// Este archivo se incluirá en view_todo_list.html para notificar al dashboard
// cuando se realicen cambios en las tareas

document.addEventListener("DOMContentLoaded", () => {
    // Función para notificar al dashboard que hubo cambios
    function notifyDashboard() {
      // Usar localStorage para comunicarse con el dashboard
      localStorage.setItem("taskStatusChanged", Date.now().toString())
      console.log("Notificando al dashboard sobre cambios en tareas")
    }
  
    // Interceptar la función updateTaskStatus del archivo todolist.js
    const originalUpdateTaskStatus = window.updateTaskStatus
    if (typeof originalUpdateTaskStatus === "function") {
      window.updateTaskStatus = (taskId, newStatus) => {
        // Llamar a la función original
        const result = originalUpdateTaskStatus(taskId, newStatus)
  
        // Notificar al dashboard
        setTimeout(notifyDashboard, 500)
  
        return result
      }
    }
  
    // Interceptar el evento de eliminación de tareas
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
    if (confirmDeleteBtn) {
      const originalClickHandler = confirmDeleteBtn.onclick
  
      confirmDeleteBtn.addEventListener("click", () => {
        // Notificar al dashboard después de un breve retraso
        setTimeout(notifyDashboard, 500)
      })
    }
  })  