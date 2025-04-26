document.addEventListener("DOMContentLoaded", () => {
    // Toggle para mostrar/ocultar opciones de adjuntos
    document.querySelectorAll(".toggle-attachments").forEach((button) => {
      button.addEventListener("click", function () {
        const questionId = this.dataset.questionId
        const attachmentOptions = document.getElementById(`attachment-options-${questionId}`)
  
        if (attachmentOptions.classList.contains("d-none")) {
          // Mostrar opciones
          attachmentOptions.classList.remove("d-none")
          this.innerHTML = '<i class="bi bi-paperclip me-2"></i>Ocultar opciones para adjuntar archivos'
        } else {
          // Ocultar opciones
          attachmentOptions.classList.add("d-none")
          this.innerHTML = '<i class="bi bi-paperclip me-2"></i>Mostrar opciones para adjuntar archivos'
  
          // Limpiar los campos
          const fileInput = document.getElementById(`file_${questionId}`)
          const urlInput = document.getElementById(`url_${questionId}`)
          const previewContainer = document.getElementById(`preview_${questionId}`)
  
          if (fileInput) fileInput.value = ""
          if (urlInput) urlInput.value = ""
          if (previewContainer) {
            previewContainer.classList.add("d-none")
            const previewContent = previewContainer.querySelector(`#preview_content_${questionId}`)
            if (previewContent) previewContent.innerHTML = ""
          }
        }
      })
    })
  
    // Función para mostrar vista previa de archivos
    document.querySelectorAll('input[type="file"]').forEach((fileInput) => {
      const questionId = fileInput.id.split("_")[1]
      const previewContainer = document.getElementById(`preview_${questionId}`)
      const previewContent = document.getElementById(`preview_content_${questionId}`)
  
      fileInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const file = this.files[0]
          const reader = new FileReader()
  
          reader.onload = (e) => {
            previewContainer.classList.remove("d-none")
  
            if (file.type.startsWith("image/")) {
              previewContent.innerHTML = `<img src="${e.target.result}" class="img-fluid" alt="Vista previa">`
            } else if (file.type.startsWith("video/")) {
              previewContent.innerHTML = `
                <video controls class="img-fluid">
                  <source src="${e.target.result}" type="${file.type}">
                  Tu navegador no soporta la reproducción de videos.
                </video>
              `
            } else {
              previewContent.innerHTML = `<p class="p-3">Archivo seleccionado: ${file.name}</p>`
            }
          }
  
          reader.readAsDataURL(file)
        }
      })
    })
  
    // Para cada input de URL
    document.querySelectorAll('input[type="url"]').forEach((urlInput) => {
      const questionId = urlInput.id.split("_")[1]
      const previewContainer = document.getElementById(`preview_${questionId}`)
      const previewContent = document.getElementById(`preview_content_${questionId}`)
  
      urlInput.addEventListener("change", function () {
        if (this.value) {
          const url = this.value.toLowerCase()
          previewContainer.classList.remove("d-none")
  
          if (url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".gif")) {
            previewContent.innerHTML = `<img src="${this.value}" class="img-fluid" alt="Vista previa">`
          } else if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg")) {
            previewContent.innerHTML = `
              <video controls class="img-fluid">
                <source src="${this.value}" type="video/mp4">
                Tu navegador no soporta la reproducción de videos.
              </video>
            `
          } else {
            previewContent.innerHTML = `
              <div class="p-3">
                <p class="mb-2">URL proporcionada:</p>
                <a href="${this.value}" target="_blank" class="d-block text-truncate">${this.value}</a>
              </div>
            `
          }
        }
      })
    })
  })
  
  // Función para limpiar la vista previa
  function clearPreview(previewId) {
    const previewContainer = document.getElementById(previewId)
    const previewContent = previewContainer
  }  