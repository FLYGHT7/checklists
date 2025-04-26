// Definir variables globales para acceder a ellas desde cualquier parte
let bootstrap
let Sortable

document.addEventListener("DOMContentLoaded", () => {
  // Asignar las variables globales si están disponibles
  bootstrap = window.bootstrap || {}
  Sortable = window.Sortable || {}

  // Función para mostrar notificaciones (solo para errores críticos, no para limpiezas)
  function showToast(message, type = "info") {
    // Verificar si existe un contenedor de toast
    let toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toastContainer"
      toastContainer.className = "position-fixed bottom-0 end-0 p-3"
      toastContainer.style.zIndex = "1050"
      document.body.appendChild(toastContainer)
    }

    // Crear el toast
    const toastId = "toast-" + Date.now()
    const toast = document.createElement("div")
    toast.id = toastId
    toast.className = `toast bg-${type} text-white`
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")

    toast.innerHTML = `
      <div class="toast-header bg-${type} text-white">
        <strong class="me-auto">Notificación</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `

    toastContainer.appendChild(toast)

    // Inicializar y mostrar el toast con Bootstrap
    if (bootstrap && bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000,
      })
      bsToast.show()

      // Eliminar el toast después de ocultarse
      toast.addEventListener("hidden.bs.toast", () => {
        toast.remove()
      })
    } else {
      // Fallback si bootstrap no está disponible
      toast.style.display = "block"
      setTimeout(() => {
        toast.remove()
      }, 5000)
    }
  }

  // Función para obtener el valor de una cookie (para CSRF)
  function getCookie(name) {
    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
    return cookieValue
  }

  // Modificar la función initBankQuestionButtons para asegurar que los event listeners se añadan correctamente
  function initBankQuestionButtons() {
    console.log("Inicializando botones del banco de preguntas...")

    // Botones para eliminar preguntas del banco
    document.querySelectorAll(".delete-bank-question-btn").forEach((btn) => {
      // Eliminar event listeners anteriores clonando el botón
      const newBtn = btn.cloneNode(true)
      if (btn.parentNode) {
        btn.parentNode.replaceChild(newBtn, btn)
      }

      // Añadir nuevo event listener
      newBtn.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()
        console.log("Botón eliminar clickeado para ID:", this.dataset.id)

        const questionId = this.dataset.id

        // Mostrar el modal de confirmación
        const deleteConfirmText = document.getElementById("deleteConfirmText")
        if (deleteConfirmText) {
          deleteConfirmText.textContent = "¿Estás seguro de que deseas eliminar esta pregunta del banco?"

          // Configurar el botón de confirmación
          const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
          if (confirmDeleteBtn) {
            // Eliminar event listeners anteriores
            const newConfirmBtn = confirmDeleteBtn.cloneNode(true)
            confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn)

            // Añadir nuevo event listener
            newConfirmBtn.addEventListener("click", () => {
              // Cerrar el modal
              const modalElement = document.getElementById("deleteConfirmModal")
              if (modalElement && bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement)
                if (modal) {
                  modal.hide()
                }
              }

              // Eliminar la pregunta del banco directamente
              deleteBankQuestion(questionId)
            })

            // Mostrar el modal
            const modalElement = document.getElementById("deleteConfirmModal")
            if (modalElement && bootstrap && bootstrap.Modal) {
              const modal = new bootstrap.Modal(modalElement)
              modal.show()
            }
          }
        }
      })
    })

    // Botones para añadir preguntas desde el banco
    document.querySelectorAll(".add-bank-question-btn").forEach((btn) => {
      // Eliminar event listeners anteriores clonando el botón
      const newBtn = btn.cloneNode(true)
      if (btn.parentNode) {
        btn.parentNode.replaceChild(newBtn, btn)
      }

      // Añadir nuevo event listener
      newBtn.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()
        console.log("Botón añadir clickeado para ID:", this.dataset.id)

        const questionId = this.dataset.id
        // Obtener el ID del formulario de la URL
        const formId = window.location.pathname.split("/")[2] // Asumiendo que la URL es /forms/{formId}/...

        // Llamar a la función para añadir la pregunta
        addQuestionFromBank(formId, questionId)
      })
    })

    // Botones para editar preguntas del banco
    document.querySelectorAll(".edit-bank-question-btn").forEach((btn) => {
      // Eliminar event listeners anteriores
      const newBtn = btn.cloneNode(true)
      if (btn.parentNode) {
        btn.parentNode.replaceChild(newBtn, btn)
      }

      // Añadir nuevo event listener
      newBtn.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()
        console.log("Botón editar clickeado para ID:", this.dataset.id)

        const questionId = this.dataset.id
        editBankQuestion(questionId)
      })
    })

    console.log("Botones del banco de preguntas inicializados correctamente")
  }

  // Función para inicializar Sortable (drag and drop)
  function initSortable() {
    const questionsList = document.getElementById("questionsList")
    const questionBank = document.getElementById("questionBank")

    if (questionsList && questionBank && typeof Sortable === "function") {
      // Sortable para la lista de preguntas
      new Sortable(questionsList, {
        animation: 150,
        handle: ".card-header",
        group: {
          name: "questions",
          put: true,
        },
        onAdd: (evt) => {
          const item = evt.item
          const questionId = item.dataset.id

          // Eliminar el elemento clonado y añadir la pregunta desde el banco
          item.remove()

          // Obtener el ID del formulario
          const formId =
            document.querySelector('input[name="form_id"]')?.value ||
            window.location.pathname.split("/").filter(Boolean)[1]

          // Llamar a la función para añadir la pregunta desde el banco
          addQuestionFromBank(formId, questionId)
        },
      })

      // Sortable para el banco de preguntas
      new Sortable(questionBank, {
        animation: 150,
        group: {
          name: "questions",
          pull: "clone",
          put: false,
        },
        sort: false,
        onClone: (evt) => {
          const clone = evt.clone
          clone.classList.add("dragging")
        },
      })
    }
  }

  // Función para añadir una pregunta desde el banco
  function addQuestionFromBank(formId, questionId) {
    console.log(`Añadiendo pregunta ${questionId} al formulario ${formId}`)

    // Crear un token CSRF
    const csrftoken = getCookie("csrftoken")

    // Crear un formulario para enviar la solicitud POST
    const form = document.createElement("form")
    form.method = "POST"
    form.action = `/forms/form/${formId}/add-from-bank/${questionId}/`

    // Añadir CSRF token
    const csrfInput = document.createElement("input")
    csrfInput.type = "hidden"
    csrfInput.name = "csrfmiddlewaretoken"
    csrfInput.value = csrftoken
    form.appendChild(csrfInput)

    // Añadir el formulario al DOM
    document.body.appendChild(form)

    // Enviar el formulario usando fetch
    fetch(form.action, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new FormData(form),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Eliminar el formulario temporal
        document.body.removeChild(form)

        if (data.success) {
          // Recargar la página para mostrar la nueva pregunta
          location.reload()
        } else {
          showToast("Error: " + (data.error || "No se pudo añadir la pregunta"), "danger")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al añadir la pregunta", "danger")
        document.body.removeChild(form)
      })
  }

  // Función para editar una pregunta del banco
  function editBankQuestion(questionId) {
    console.log("Editando pregunta del banco con ID:", questionId)

    // Obtener los datos de la pregunta
    fetch(`/forms/question-bank/${questionId}/`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          const question = data.question

          // Llenar el formulario de edición
          const editModal = document.getElementById("editQuestionModal")
          if (editModal) {
            const form = editModal.querySelector("form")
            form.action = `/forms/question-bank/${questionId}/edit/`

            // Llenar los campos del formulario
            const textField = form.querySelector("#edit_text")
            if (textField) textField.value = question.text

            const helpTextField = form.querySelector("#edit_help_text")
            if (helpTextField) helpTextField.value = question.help_text || ""

            const isRequiredField = form.querySelector("#edit_is_required")
            if (isRequiredField) isRequiredField.checked = question.is_required

            const allowAttachmentsField = form.querySelector("#edit_allow_attachments")
            if (allowAttachmentsField) allowAttachmentsField.checked = question.allow_attachments

            // Seleccionar el tipo de pregunta
            const typeSelect = form.querySelector("#edit_question_type")
            if (typeSelect) {
              for (let i = 0; i < typeSelect.options.length; i++) {
                if (typeSelect.options[i].value === question.question_type) {
                  typeSelect.selectedIndex = i
                  break
                }
              }
            }

            // Mostrar campos específicos según el tipo
            const linearScaleFields = form.querySelector("#editLinearScaleFields")
            if (question.question_type === "linear_scale" && linearScaleFields) {
              linearScaleFields.classList.remove("d-none")

              // Establecer valores de escala
              const minValueField = form.querySelector("#edit_min_value")
              if (minValueField) minValueField.value = question.min_value || 1

              const maxValueField = form.querySelector("#edit_max_value")
              if (maxValueField) maxValueField.value = question.max_value || 5

              const minLabelField = form.querySelector("#edit_min_label")
              if (minLabelField) minLabelField.value = question.min_label || ""

              const maxLabelField = form.querySelector("#edit_max_label")
              if (maxLabelField) maxLabelField.value = question.max_label || ""

              // Actualizar vista previa si existe la función
              if (typeof window.updateEditScalePreview === "function") {
                window.updateEditScalePreview()
              }
            } else if (linearScaleFields) {
              linearScaleFields.classList.add("d-none")
            }

            // Configurar el botón de actualización
            const updateBtn = document.getElementById("updateQuestionBtn")
            if (updateBtn) {
              // Eliminar event listeners anteriores
              const newUpdateBtn = updateBtn.cloneNode(true)
              updateBtn.parentNode.replaceChild(newUpdateBtn, updateBtn)

              // Añadir nuevo event listener
              newUpdateBtn.addEventListener("click", () => {
                if (form.checkValidity()) {
                  // Enviar el formulario usando fetch para evitar recargar la página
                  const formData = new FormData(form)

                  fetch(form.action, {
                    method: "POST",
                    headers: {
                      "X-CSRFToken": getCookie("csrftoken"),
                      "X-Requested-With": "XMLHttpRequest",
                    },
                    body: formData,
                  })
                    .then((response) => response.json())
                    .then((result) => {
                      // Cerrar el modal
                      const modal = bootstrap.Modal.getInstance(editModal)
                      if (modal) modal.hide()

                      if (result.success) {
                        showToast("Pregunta actualizada correctamente", "success")

                        // Actualizar el banco de preguntas
                        updateQuestionBank()
                      } else {
                        showToast("Error al actualizar la pregunta: " + (result.error || "Error desconocido"), "danger")
                      }
                    })
                    .catch((error) => {
                      console.error("Error:", error)
                      showToast("Error al actualizar la pregunta", "danger")
                    })
                } else {
                  form.reportValidity()
                }
              })
            }

            // Mostrar el modal
            if (bootstrap && bootstrap.Modal) {
              const modal = new bootstrap.Modal(editModal)
              modal.show()
            } else {
              // Fallback si bootstrap no está disponible
              editModal.style.display = "block"
            }
          } else {
            showToast("No se encontró el modal para editar la pregunta", "danger")
          }
        } else {
          showToast("Error al cargar los datos de la pregunta: " + (data.error || "Error desconocido"), "danger")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al cargar los datos de la pregunta", "danger")
      })
  }

  // Función para eliminar una pregunta del banco
  function deleteBankQuestion(questionId) {
    console.log("Ejecutando deleteBankQuestion para ID:", questionId)

    // Crear un token CSRF
    const csrftoken = getCookie("csrftoken")

    // Enviar la solicitud para eliminar la pregunta directamente
    // sin mostrar otro modal de confirmación (ya que ya se confirmó)
    fetch(`/forms/question-bank/${questionId}/delete/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Limpiar cualquier backdrop modal que pueda haber quedado
        removeModalBackdrop()

        if (data.success) {
          // Eliminar el elemento del DOM sin recargar la página
          const questionElement = document.querySelector(`.bank-question-item[data-id="${questionId}"]`)
          if (questionElement) {
            // Animación de desvanecimiento antes de eliminar
            questionElement.style.transition = "opacity 0.3s ease"
            questionElement.style.opacity = "0"

            setTimeout(() => {
              questionElement.remove()

              // Si no quedan preguntas, mostrar mensaje
              const bankContainer = document.getElementById("questionBank")
              if (bankContainer && !bankContainer.querySelector(".bank-question-item")) {
                bankContainer.innerHTML = `
                <div class="bank-empty">
                  <i class="bi bi-archive"></i>
                  <h5>No hay preguntas guardadas</h5>
                  <p>Guarda preguntas en el banco para reutilizarlas en otros formularios.</p>
                </div>
              `
              }
            }, 300)
          }

          // También eliminar las preguntas correspondientes del formulario
          const formQuestions = document.querySelectorAll(".form-question, .question-card")
          formQuestions.forEach((question) => {
            // Buscar si esta pregunta tiene un badge "En banco"
            const bankBadge = question.querySelector('.badge.bg-success, .badge:contains("En banco")')
            if (bankBadge) {
              // Verificar si es la misma pregunta (comparando texto o ID)
              const questionText = question.querySelector(".card-title, .bank-question-text")?.textContent.trim()
              const bankQuestionText = document
                .querySelector(`.bank-question-item[data-id="${questionId}"] .bank-question-text`)
                ?.textContent.trim()

              if (questionText === bankQuestionText) {
                // Eliminar el badge "En banco"
                bankBadge.remove()

                // Habilitar el botón "Guardar en banco" si existe
                const saveBtn = question.querySelector(".save-to-bank-btn")
                if (saveBtn) {
                  saveBtn.disabled = false
                }
              }
            }
          })

          // Actualizar la lista de preguntas del formulario
          const formId = window.location.pathname.split("/").filter(Boolean)[1]
          fetchAndUpdateQuestions(formId)

          // Limpiar duplicados en el servidor
          setTimeout(() => {
            cleanupDuplicatesFromServer(false)
          }, 500)

          // Mostrar notificación
          showToast(data.message || "Pregunta eliminada correctamente del banco", "success")
        } else {
          showToast("Error: " + (data.error || "No se pudo eliminar la pregunta"), "danger")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al eliminar la pregunta", "danger")

        // Limpiar cualquier backdrop modal que pueda haber quedado
        removeModalBackdrop()
      })
  }

  // Función para guardar una pregunta en el banco
  function saveQuestionToBank(questionId) {
    // Crear un token CSRF
    const csrftoken = getCookie("csrftoken")

    // Enviar la solicitud para guardar la pregunta en el banco
    fetch(`/forms/question/${questionId}/save-to-bank/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Actualizar la UI - Añadir badge visual sin deshabilitar el botón
          const btn = document.querySelector(`.save-to-bank-btn[data-id="${questionId}"]`)
          if (btn) {
            // Ya no deshabilitamos el botón para permitir guardar múltiples veces
            // btn.disabled = true;

            // Añadir badge si no existe
            const questionCard = document.querySelector(`.question-card[data-id="${questionId}"]`)
            if (questionCard) {
              const badgeContainer = questionCard.querySelector(".card-header div:first-child")
              if (badgeContainer && !questionCard.querySelector(".badge.bg-success")) {
                const badge = document.createElement("span")
                badge.className = "badge bg-success ms-1"
                badge.textContent = "En banco"
                badgeContainer.appendChild(badge)
              }
            }
          }

          // Actualizar el banco de preguntas
          updateQuestionBank()

          // Limpiar duplicados automáticamente
          setTimeout(() => {
            cleanupDuplicatesFromServer(false)
          }, 500)
        } else {
          showToast("Error: " + (data.error || "No se pudo guardar la pregunta en el banco"), "danger")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al guardar la pregunta en el banco", "danger")
      })
  }

  // Modificar la función para guardar preguntas en el banco
  document.querySelectorAll(".save-to-bank-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const questionId = this.dataset.id

      // Crear un formulario para enviar la solicitud POST
      const form = document.createElement("form")
      form.method = "POST"
      form.action = `/forms/question/${questionId}/save-to-bank/`

      // Añadir CSRF token
      const csrfInput = document.createElement("input")
      csrfInput.type = "hidden"
      csrfInput.name = "csrfmiddlewaretoken"
      csrfInput.value = document.querySelector("[name=csrfmiddlewaretoken]").value
      form.appendChild(csrfInput)

      // Añadir el formulario al DOM
      document.body.appendChild(form)

      // Enviar el formulario usando fetch
      fetch(form.action, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfInput.value,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new FormData(form),
      })
        .then((response) => response.json())
        .then((data) => {
          // Eliminar el formulario temporal
          document.body.removeChild(form)

          if (data.success) {
            // Actualizar la UI - Ya NO deshabilitamos el botón para permitir guardar múltiples veces
            // this.disabled = true;

            const questionCard = document.querySelector(`.question-card[data-id="${questionId}"]`)
            if (questionCard) {
              const badgeContainer = questionCard.querySelector(".card-header div:first-child")

              // Añadir badge si no existe
              if (badgeContainer && !questionCard.querySelector(".badge.bg-success")) {
                const badge = document.createElement("span")
                badge.className = "badge bg-success ms-1 bank-badge"
                badge.textContent = "En banco"
                badgeContainer.appendChild(badge)
              }

              // Asegurarnos de que el botón de eliminar siga funcionando
              const deleteBtn = questionCard.querySelector(".delete-question-btn")
              if (deleteBtn) {
                // Clonar y reemplazar el botón para eliminar event listeners antiguos
                const newDeleteBtn = deleteBtn.cloneNode(true)
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn)

                // Añadir nuevo event listener
                newDeleteBtn.addEventListener("click", function () {
                  const qId = this.dataset.id
                  deleteUrl = `/forms/question/${qId}/delete/`
                  deleteConfirmText.textContent = "¿Estás seguro de que deseas eliminar esta pregunta?"

                  // Mostrar el modal
                  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"))
                  modal.show()
                })
              }
            }

            // Mostrar notificación
            showToast("Pregunta guardada en el banco correctamente", "success")

            // Actualizar el banco de preguntas sin recargar la página
            updateQuestionBank()
          } else {
            showToast("Error al guardar la pregunta en el banco: " + (data.error || "Error desconocido"), "error")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          showToast("Error al guardar la pregunta en el banco", "error")
          document.body.removeChild(form)
        })
    })
  })

  // Función para actualizar el banco de preguntas
  function updateQuestionBank() {
    const questionBankContainer = document.getElementById("questionBank")
    if (!questionBankContainer) return

    // Mostrar indicador de carga
    questionBankContainer.innerHTML =
      '<div class="text-center p-3"><i class="bi bi-arrow-repeat spinner"></i> Actualizando banco de preguntas...</div>'

    // Obtener las preguntas actualizadas
    fetch("/forms/question-bank/json/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin", // Ensure cookies are sent with the request
    })
      .then((response) => {
        // Verificar si la respuesta es válida
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }
        // Verificar el tipo de contenido para detectar HTML en lugar de JSON
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("text/html")) {
          throw new Error("El servidor devolvió HTML en lugar de JSON. Posible error 500 en el servidor.")
        }
        return response.json()
      })
      .then((data) => {
        // Verificar si data es null o undefined
        if (!data) {
          throw new Error("Datos vacíos recibidos del servidor")
        }

        if (data.success && data.bank_questions && data.bank_questions.length > 0) {
          // Limpiar el contenedor
          questionBankContainer.innerHTML = ""

          // Crear un Map para rastrear IDs ya añadidos y evitar duplicados
          const addedIds = new Map()
          const addedContent = new Map() // Para detectar duplicados por contenido

          // Ordenar las preguntas por fecha de creación (más recientes primero)
          const sortedQuestions = [...data.bank_questions].sort((a, b) => {
            // Si tienen created_at, usar eso
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at)
            }
            // Si no, mantener el orden original
            return 0
          })

          // Añadir cada pregunta al banco (evitando duplicados)
          sortedQuestions.forEach((question) => {
            // Crear clave de contenido
            const contentKey = `${question.text}|${question.question_type}`

            // Verificar si esta pregunta ya ha sido añadida por ID o contenido
            if (addedIds.has(question.id) || addedContent.has(contentKey)) {
              console.log(`Pregunta duplicada detectada en el frontend: ${question.id} - ${contentKey}`)
              return // Saltar esta pregunta
            }

            // Registrar esta ID y contenido como añadidos
            addedIds.set(question.id, true)
            addedContent.set(contentKey, true)

            const questionItem = document.createElement("div")
            questionItem.className = "bank-question-item"
            questionItem.dataset.id = question.id
            questionItem.dataset.type = question.question_type
            questionItem.dataset.text = question.text.toLowerCase().replace(/\s+/g, "-") // Para comparación de duplicados
            questionItem.dataset.hash = question.hash || "" // Para comparación de duplicados
            questionItem.draggable = true

            questionItem.innerHTML = `
              <span class="bank-question-type">${question.question_type_display}</span>
              <div class="bank-question-text">${question.text}</div>
              <div class="bank-question-meta">
                <div class="bank-question-usage">
                  <i class="bi bi-bar-chart"></i> Usado ${question.usage_count} veces
                </div>
              </div>
              <div class="bank-question-actions">
                <button type="button" class="bank-action-btn add-btn add-bank-question-btn" data-id="${question.id}" title="Añadir al formulario">
                  <i class="bi bi-plus"></i>
                </button>
                <button type="button" class="bank-action-btn edit-btn edit-bank-question-btn" data-id="${question.id}" title="Editar pregunta">
                  <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="bank-action-btn delete-btn delete-bank-question-btn" data-id="${question.id}" title="Eliminar pregunta">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            `

            questionBankContainer.appendChild(questionItem)
          })

          // Reinicializar los event listeners
          initBankQuestionButtons()

          // Reinicializar Sortable si está disponible
          if (typeof Sortable === "function") {
            initSortable()
          }

          console.log(`Banco de preguntas actualizado: ${addedIds.size} preguntas únicas cargadas`)

          // Ejecutar limpieza de duplicados en el DOM después de cargar
          setTimeout(removeDuplicatesFromDOM, 100)
        } else if (data.bank_questions && data.bank_questions.length === 0) {
          // Mostrar mensaje si no hay preguntas
          questionBankContainer.innerHTML = `
            <div class="bank-empty">
              <i class="bi bi-archive"></i>
              <h5>No hay preguntas guardadas</h5>
              <p>Guarda preguntas en el banco para reutilizarlas en otros formularios.</p>
            </div>
          `
        } else {
          throw new Error("Formato de datos inválido o no hay preguntas disponibles")
        }
      })
      .catch((error) => {
        console.error("Error al actualizar el banco de preguntas:", error)
        // Display a more detailed error message
        questionBankContainer.innerHTML = `
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            Error al cargar las preguntas del banco: ${error.message}
            <div class="mt-2">
              <button type="button" class="btn btn-sm btn-outline-danger" onclick="updateQuestionBank()">
                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
              </button>
            </div>
          </div>
        `
      })
  }

  // Función para eliminar duplicados en el DOM
  function removeDuplicatesFromDOM() {
    // Verificar duplicados en el banco de preguntas
    const bankItems = document.querySelectorAll(".bank-question-item")
    const ids = new Map() // Usamos Map para guardar el primer elemento de cada ID
    const textMap = new Map() // Mapa adicional para detectar duplicados por texto
    const duplicates = []

    bankItems.forEach((item) => {
      const id = item.dataset.id
      const text = item.querySelector(".bank-question-text")?.textContent.trim()
      const type = item.dataset.type
      const contentKey = `${text}|${type}`

      // Verificar duplicados por ID
      if (ids.has(id)) {
        // Este es un duplicado por ID
        duplicates.push(item)
        console.log(`Duplicado por ID: ${id}`)
      }
      // Verificar duplicados por contenido
      else if (text && textMap.has(contentKey)) {
        // Este es un duplicado por contenido
        duplicates.push(item)
        console.log(`Duplicado por contenido: ${contentKey}`)
      } else {
        // Este es el primer elemento con este ID y contenido
        ids.set(id, item)
        if (text) {
          textMap.set(contentKey, item)
        }
      }
    })

    // Eliminar elementos duplicados
    duplicates.forEach((item) => {
      item.remove()
    })

    if (duplicates.length > 0) {
      console.log(`Eliminados ${duplicates.length} elementos duplicados del DOM`)
    }

    return duplicates.length
  }

  // Función para limpiar duplicados desde el servidor
  function cleanupDuplicatesFromServer(showNotification = false) {
    // Crear un token CSRF
    const csrftoken = getCookie("csrftoken")

    // Enviar solicitud para limpiar duplicados
    fetch("/forms/question-bank/clean/", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": csrftoken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (showNotification) {
            showToast(data.message || "Duplicados eliminados correctamente", "success")
          }

          if (data.duplicates_removed > 0) {
            console.log(
              `Limpieza en servidor: ${data.duplicates_removed} eliminados, ${data.questions_kept} mantenidos`,
            )
            // Actualizar el banco de preguntas solo si se eliminaron duplicados
            updateQuestionBank()
          }
        } else {
          console.error("Error al limpiar duplicados:", data.error)
        }
      })
      .catch((error) => {
        console.error("Error al limpiar duplicados:", error)
      })
  }

  // Nueva función para añadir una pregunta a la UI sin recargar
  function addQuestionToUI(question) {
    const questionsList = document.getElementById("questionsList")
    if (!questionsList) return

    // Eliminar el mensaje de "no hay preguntas" si existe
    const emptyMessage = questionsList.querySelector(".empty-questions")
    if (emptyMessage) {
      emptyMessage.remove()
    }

    // Crear el elemento de la pregunta
    const questionCard = document.createElement("div")
    questionCard.className = "question-card"
    questionCard.dataset.id = question.id

    // Construir el HTML de la pregunta
    questionCard.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
          <div>
              <span class="badge bg-info">${question.question_type_display}</span>
              ${question.is_required ? '<span class="badge bg-danger ms-1">Obligatorio</span>' : ""}
              ${question.allow_attachments ? '<span class="badge bg-info ms-1 attachment-allowed">Permite adjuntos</span>' : ""}
              ${question.in_question_bank ? '<span class="badge bg-success ms-1">En banco</span>' : ""}
          </div>
          <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-success save-to-bank-btn custom-tooltip" data-id="${question.id}" data-tooltip="Guardar en banco" ${question.in_question_bank ? "disabled" : ""}>
                  <i class="bi bi-archive"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-primary edit-question-btn custom-tooltip" data-id="${question.id}" data-tooltip="Editar pregunta">
                  <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger delete-question-btn custom-tooltip" data-id="${question.id}" data-tooltip="Eliminar pregunta">
                  <i class="bi bi-trash"></i>
              </button>
          </div>
      </div>
      <div class="card-body">
          <h5 class="card-title">${question.text}</h5>
          ${question.help_text ? `<p class="text-muted small">${question.help_text}</p>` : ""}
          
          ${
            question.image
              ? `
          <div class="mt-2 mb-3">
              <img src="${question.image}" alt="Imagen de la pregunta" class="img-fluid rounded" style="max-height: 200px;">
          </div>
          `
              : ""
          }
      </div>
    `

    // Añadir la pregunta al principio de la lista
    questionsList.prepend(questionCard)

    // Inicializar los event listeners para los botones de la nueva pregunta
    initQuestionCardButtons(questionCard)
  }

  // Nueva función para inicializar los botones de una tarjeta de pregunta
  function initQuestionCardButtons(questionCard) {
    // Botón de guardar en banco
    const saveBtn = questionCard.querySelector(".save-to-bank-btn")
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const questionId = this.dataset.id
        saveQuestionToBank(questionId)
      })
    }

    // Botón de editar
    const editBtn = questionCard.querySelector(".edit-question-btn")
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        const questionId = this.dataset.id
        // Aquí iría el código para editar la pregunta
        // Normalmente abriría un modal con los datos de la pregunta
      })
    }

    // Botón de eliminar
    const deleteBtn = questionCard.querySelector(".delete-question-btn")
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        const questionId = this.dataset.id
        // Configurar el modal de confirmación para eliminar
        const deleteConfirmModal = document.getElementById("deleteConfirmModal")
        const deleteConfirmText = document.getElementById("deleteConfirmText") // Declare deleteConfirmText here
        if (deleteConfirmModal && deleteConfirmText) {
          deleteConfirmText.textContent = "¿Estás seguro de que deseas eliminar esta pregunta?"

          // Configurar el botón de confirmación
          const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
          if (confirmDeleteBtn) {
            // Eliminar event listeners anteriores
            const newConfirmBtn = confirmDeleteBtn.cloneNode(true)
            confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn)

            // Añadir nuevo event listener
            newConfirmBtn.addEventListener("click", () => {
              // Aquí iría el código para eliminar la pregunta
              // Y luego actualizar la UI sin recargar
            })

            // Mostrar el modal
            if (bootstrap && bootstrap.Modal) {
              const modal = new bootstrap.Modal(deleteConfirmModal)
              modal.show()
            } else {
              deleteConfirmModal.style.display = "block"
            }
          }
        }
      })
    }
  }

  // Nueva función para obtener y actualizar la lista de preguntas
  function fetchAndUpdateQuestions(formId) {
    fetch(`/forms/${formId}/questions/json/`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.questions) {
          // Actualizar la lista de preguntas
          const questionsList = document.getElementById("questionsList")
          if (questionsList) {
            // Limpiar la lista actual
            questionsList.innerHTML = ""

            if (data.questions.length > 0) {
              // Añadir cada pregunta a la UI
              data.questions.forEach((question) => {
                addQuestionToUI(question)
              })
            } else {
              // Mostrar mensaje de que no hay preguntas
              questionsList.innerHTML = `
                <div class="empty-questions">
                    <i class="bi bi-question-circle"></i>
                    <h3>No hay preguntas en este formulario</h3>
                    <p class="text-muted">Haz clic en "Añadir Pregunta" para empezar a crear tu formulario o arrastra preguntas desde el banco.</p>
                </div>
              `
            }
          }
        } else {
          showToast("Error al actualizar la lista de preguntas", "danger")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        showToast("Error al actualizar la lista de preguntas", "danger")
      })
  }

  // Función para detectar duplicados en el DOM
  function detectDuplicatesInDOM() {
    const bankItems = document.querySelectorAll(".bank-question-item")
    const textMap = new Map() // Mapa para rastrear textos de preguntas
    const duplicatesFound = []

    bankItems.forEach((item) => {
      const text = item.querySelector(".bank-question-text").textContent.trim()
      const type = item.dataset.type
      const key = `${text}|${type}`

      if (textMap.has(key)) {
        // Este es un duplicado, marcarlo
        item.classList.add("duplicate-item")
        textMap.get(key).classList.add("duplicate-item")
        duplicatesFound.push(item)
      } else {
        // Este es el primer elemento con este texto y tipo
        textMap.set(key, item)
      }
    })

    if (duplicatesFound.length > 0) {
      console.log(`Se encontraron ${duplicatesFound.length} duplicados en el DOM`)
      // Limpiar duplicados automáticamente
      removeDuplicatesFromDOM()
    }

    return duplicatesFound.length
  }

  // Configurar actualización periódica del banco de preguntas
  let updateInterval

  function startAutoUpdate() {
    // Limpiar cualquier intervalo existente
    if (updateInterval) {
      clearInterval(updateInterval)
    }

    // Actualizar cada 10 segundos
    updateInterval = setInterval(() => {
      // Solo actualizar si el banco está visible
      const questionBank = document.getElementById("questionBank")
      if (questionBank && questionBank.offsetParent !== null) {
        console.log("Actualizando banco de preguntas automáticamente...")
        updateQuestionBank()

        // Limpiar duplicados en el servidor cada 30 segundos
        if (Math.random() < 0.3) {
          // ~30% de probabilidad en cada actualización
          cleanupDuplicatesFromServer(false)
        }
      }
    }, 10000) // 10 segundos
  }

  // Iniciar actualización automática
  startAutoUpdate()

  // Ejecutar limpieza inicial
  setTimeout(() => {
    // Limpiar duplicados en el DOM
    removeDuplicatesFromDOM()

    // Limpiar duplicados en el servidor silenciosamente
    cleanupDuplicatesFromServer(false)
  }, 1000)

  // Asegurarse de que la función se ejecute cuando el DOM esté cargado
  initBankQuestionButtons()

  // También inicializar Sortable si está disponible
  if (typeof Sortable === "function") {
    initSortable()
  }

  // Exponer funciones globalmente para que puedan ser llamadas desde HTML
  window.updateQuestionBank = updateQuestionBank
  window.removeDuplicatesFromDOM = removeDuplicatesFromDOM
  window.cleanupDuplicatesFromServer = cleanupDuplicatesFromServer
  window.initBankQuestionButtons = initBankQuestionButtons

  // Modificar la función para eliminar preguntas
  let deleteConfirmText // Declare deleteConfirmText here
  document.querySelectorAll(".delete-question-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const questionId = this.dataset.id
      deleteUrl = `/forms/question/${questionId}/delete/`
      deleteConfirmText = document.getElementById("deleteConfirmText").textContent =
        "¿Estás seguro de que deseas eliminar esta pregunta?"

      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"))
      modal.show()
    })
  })

  // Variables globales para deleteUrl y deleteMethod
  let deleteUrl = ""
  const deleteMethod = "POST"

  // Modificar la función confirmDeleteBtn para manejar mejor la eliminación
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      // Crear un formulario dinámico para enviar la solicitud POST
      const form = document.createElement("form")
      form.method = deleteMethod
      form.action = deleteUrl

      // Añadir CSRF token
      const csrfInput = document.createElement("input")
      csrfInput.type = "hidden"
      csrfInput.name = "csrfmiddlewaretoken"
      csrfInput.value = document.querySelector("[name=csrfmiddlewaretoken]").value
      form.appendChild(csrfInput)

      // Añadir el formulario al DOM
      document.body.appendChild(form)

      // Usar fetch en lugar de form.submit() para evitar recargar la página
      fetch(form.action, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfInput.value,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new FormData(form),
      })
        .then((response) => response.json())
        .then((data) => {
          // Eliminar el formulario temporal
          document.body.removeChild(form)

          // Cerrar el modal
          const modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"))
          modal.hide()

          if (data.success) {
            // Extraer el ID de la pregunta de la URL
            const questionId = deleteUrl.split("/").filter(Boolean).pop()

            // Eliminar la pregunta del DOM
            const questionCard = document.querySelector(`.question-card[data-id="${questionId}"]`)
            if (questionCard) {
              questionCard.remove()

              // Verificar si no quedan preguntas
              const questionsList = document.getElementById("questionsList")
              if (questionsList && !questionsList.querySelector(".question-card")) {
                questionsList.innerHTML = `
                <div class="empty-questions">
                  <i class="bi bi-question-circle"></i>
                  <h3>No hay preguntas en este formulario</h3>
                  <p class="text-muted">Haz clic en "Añadir Pregunta" para empezar a crear tu formulario o arrastra preguntas desde el banco.</p>
                </div>
              `
              }
            }

            showToast("Pregunta eliminada correctamente", "success")
          } else {
            showToast("Error al eliminar la pregunta: " + (data.error || "Error desconocido"), "error")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          showToast("Error al eliminar la pregunta", "error")
          document.body.removeChild(form)

          // Cerrar el modal
          const modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"))
          modal.hide()
        })
    })
  }

  // Función para eliminar el backdrop de un modal
  function removeModalBackdrop() {
    const backdrop = document.querySelector(".modal-backdrop")
    if (backdrop) {
      backdrop.remove()
    }
  }
})

// Asegurarse de que la función se ejecute cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, inicializando botones del banco...")
  initBankQuestionButtons()

  // También inicializar después de actualizar el banco de preguntas
  const updateBankBtn = document.querySelector(".update-bank-btn")
  if (updateBankBtn) {
    updateBankBtn.addEventListener("click", () => {
      updateQuestionBank()
    })
  }
})

// Exponer la función globalmente para que pueda ser llamada desde otros scripts
window.initBankQuestionButtons = initBankQuestionButtons