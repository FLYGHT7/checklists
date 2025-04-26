document.addEventListener('DOMContentLoaded', function() {
  // Mostrar/ocultar campos específicos según el tipo de pregunta
  const questionType = document.getElementById('id_question_type');
  const linearScaleFields = document.getElementById('linearScaleFields');

  if (questionType) {
    questionType.addEventListener('change', function() {
      if (this.value === 'linear_scale') {
        linearScaleFields.classList.remove('d-none');
        updateScalePreview();
      } else {
        linearScaleFields.classList.add('d-none');
      }
    });
  }

  // Sortable para la lista de preguntas
  const questionsList = document.getElementById('questionsList');
  if (questionsList) {
    new Sortable(questionsList, {
      animation: 150,
      handle: '.card-header',
      group: {
        name: 'questions',
        put: true
      },
      onAdd: function(evt) {
        const item = evt.item;
        const questionId = item.dataset.id;
        
        // Eliminar el elemento clonado y añadir la pregunta desde el banco
        item.remove();
        
        // Llamar a la función para añadir la pregunta desde el banco
        addQuestionFromBank(questionId);
      },
      onEnd: function() {
        // Obtener el nuevo orden
        const questions = document.querySelectorAll('.question-card');
        const questionIds = Array.from(questions).map(q => q.dataset.id);
        
        // Enviar el nuevo orden al servidor
        updateQuestionsOrder(questionIds);
      }
    });
  }

  // Sortable para el banco de preguntas
  const questionBank = document.getElementById('questionBank');
  if (questionBank) {
    new Sortable(questionBank, {
      animation: 150,
      group: {
        name: 'questions',
        pull: 'clone',
        put: false
      },
      sort: false,
      onClone: function(evt) {
        const clone = evt.clone;
        
        // Añadir clase para estilo
        clone.classList.add('dragging');
      }
    });
  }

  // Sortable para las listas de opciones
  document.querySelectorAll('.options-list').forEach(container => {
    new Sortable(container, {
      animation: 150,
      handle: '.option-handle',
      onEnd: function(evt) {
        // Obtener el ID de la pregunta
        const questionId = evt.target.dataset.questionId;
        
        // Obtener el nuevo orden
        const options = evt.target.querySelectorAll('.option-item');
        const optionIds = Array.from(options).map(o => o.dataset.id);
        
        // Enviar el nuevo orden al servidor
        updateOptionsOrder(questionId, optionIds);
      }
    });
  });

  // Añadir pregunta
  const saveQuestionBtn = document.getElementById('saveQuestionBtn');
  const addQuestionForm = document.getElementById('addQuestionForm');

  if (saveQuestionBtn) {
    saveQuestionBtn.addEventListener('click', function() {
      if (addQuestionForm.checkValidity()) {
        addQuestionForm.submit();
      } else {
        addQuestionForm.reportValidity();
      }
    });
  }

  // Editar pregunta
  const updateQuestionBtn = document.getElementById('updateQuestionBtn');
  const editQuestionForm = document.getElementById('editQuestionForm');
  const editQuestionType = document.getElementById('edit_question_type');
  const editLinearScaleFields = document.getElementById('editLinearScaleFields');

  if (editQuestionType) {
    editQuestionType.addEventListener('change', function() {
      if (this.value === 'linear_scale') {
        editLinearScaleFields.classList.remove('d-none');
        updateEditScalePreview();
      } else {
        editLinearScaleFields.classList.add('d-none');
      }
    });
  }

  document.querySelectorAll('.edit-question-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const questionId = this.dataset.id;
      const questionCard = document.querySelector(`.question-card[data-id="${questionId}"]`);
      
      // Obtener datos de la pregunta
      const questionText = questionCard.querySelector('.card-title').textContent;
      const questionType = questionCard.querySelector('.badge').textContent;
      const isRequired = questionCard.querySelector('.badge.bg-danger') !== null;
      const allowAttachments = questionCard.querySelector('.badge.attachment-allowed') !== null;
      const inQuestionBank = questionCard.querySelector('.badge.bg-success') !== null;
      const helpText = questionCard.querySelector('.text-muted.small')?.textContent || '';
      
      // Llenar el formulario
      document.getElementById('edit_text').value = questionText;
      document.getElementById('edit_help_text').value = helpText;
      document.getElementById('edit_is_required').checked = isRequired;
      document.getElementById('edit_allow_attachments').checked = allowAttachments;
      document.getElementById('edit_in_question_bank').checked = inQuestionBank;
      
      // Seleccionar el tipo de pregunta
      const typeSelect = document.getElementById('edit_question_type');
      for (let i = 0; i < typeSelect.options.length; i++) {
        if (typeSelect.options[i].text === questionType) {
          typeSelect.selectedIndex = i;
          break;
        }
      }
      
      // Mostrar campos específicos según el tipo
      if (questionType === 'Escala Lineal') {
        editLinearScaleFields.classList.remove('d-none');
        
        // Obtener valores de escala
        const minValue = questionCard.querySelector('.col-6:first-child strong:first-of-type').nextSibling.textContent.trim();
        const maxValue = questionCard.querySelector('.col-6:last-child strong:first-of-type').nextSibling.textContent.trim();
        const minLabel = questionCard.querySelector('.col-6:first-child strong:last-of-type').nextSibling.textContent.trim();
        
        const maxLabel = questionCard.querySelector('.col-6:last-child strong:last-of-type').nextSibling.textContent.trim();
        
        document.getElementById('edit_min_value').value = minValue;
        document.getElementById('edit_max_value').value = maxValue;
        document.getElementById('edit_min_label').value = minLabel;
        document.getElementById('edit_max_label').value = maxLabel;
        
        // Actualizar vista previa
        updateEditScalePreview();
      } else {
        editLinearScaleFields.classList.add('d-none');
      }
      
      // Actualizar la URL del formulario
      editQuestionForm.action = `/forms/question/${questionId}/edit/`;
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('editQuestionModal'));
      modal.show();
    });
  });

  if (updateQuestionBtn) {
    updateQuestionBtn.addEventListener('click', function() {
      if (editQuestionForm.checkValidity()) {
        editQuestionForm.submit();
      } else {
        editQuestionForm.reportValidity();
      }
    });
  }

  // Guardar pregunta en el banco
  document.querySelectorAll('.save-to-bank-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const questionId = this.dataset.id;
      
      // Crear un formulario para enviar la solicitud POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/forms/question/${questionId}/save-to-bank/`;
      
      // Añadir CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = document.querySelector('[name=csrfmiddlewaretoken]').value;
      form.appendChild(csrfInput);
      
      // Añadir el formulario al DOM
      document.body.appendChild(form);
      
      // Enviar el formulario usando fetch
      fetch(form.action, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfInput.value,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form)
      })
      .then(response => response.json())
      .then(data => {
        // Eliminar el formulario temporal
        document.body.removeChild(form);
        
        if (data.success) {
          // Actualizar la UI
          this.disabled = true;
          const questionCard = document.querySelector(`.question-card[data-id="${questionId}"]`);
          const badgeContainer = questionCard.querySelector('.card-header div:first-child');
          
          // Añadir badge si no existe
          if (!questionCard.querySelector('.badge.bg-success')) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success ms-1';
            badge.textContent = 'En banco';
            badgeContainer.appendChild(badge);
          }
          
          // Mostrar notificación
          showToast('Pregunta guardada en el banco correctamente', 'success');
          
          // Actualizar el banco de preguntas sin recargar la página
          updateQuestionBank();
        } else {
          showToast('Error al guardar la pregunta en el banco: ' + (data.error || 'Error desconocido'), 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showToast('Error al guardar la pregunta en el banco', 'error');
        document.body.removeChild(form);
      });
    });
  });

  // Añadir opción
  const saveOptionBtn = document.getElementById('saveOptionBtn');
  const addOptionForm = document.getElementById('addOptionForm');

  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const questionId = this.dataset.questionId;
      document.getElementById('option_question_id').value = questionId;
      
      // Actualizar la URL del formulario
      addOptionForm.action = `/forms/question/${questionId}/add-option/`;
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('addOptionModal'));
      modal.show();
    });
  });

  if (saveOptionBtn) {
    saveOptionBtn.addEventListener('click', function() {
      if (addOptionForm.checkValidity()) {
        addOptionForm.submit();
      } else {
        addOptionForm.reportValidity();
      }
    });
  }

  // Editar opción
  const updateOptionBtn = document.getElementById('updateOptionBtn');
  const editOptionForm = document.getElementById('editOptionForm');

  document.querySelectorAll('.edit-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const optionId = this.dataset.id;
      const optionItem = this.closest('.option-item');
      const optionText = optionItem.querySelector('.option-text').textContent;
      
      // Llenar el formulario
      document.getElementById('edit_option_id').value = optionId;
      document.getElementById('edit_option_text').value = optionText;
      
      // Actualizar la URL del formulario
      editOptionForm.action = `/forms/option/${optionId}/edit/`;
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('editOptionModal'));
      modal.show();
    });
  });

  if (updateOptionBtn) {
    updateOptionBtn.addEventListener('click', function() {
      if (editOptionForm.checkValidity()) {
        editOptionForm.submit();
      } else {
        editOptionForm.reportValidity();
      }
    });
  }

  // Eliminar pregunta o opción
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  let deleteUrl = '';
  let deleteMethod = 'post';

  document.querySelectorAll('.delete-question-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const questionId = this.dataset.id;
      deleteUrl = `/forms/question/${questionId}/delete/`;
      deleteConfirmText.textContent = '¿Estás seguro de que deseas eliminar esta pregunta?';
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
      modal.show();
    });
  });

  document.querySelectorAll('.delete-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const optionId = this.dataset.id;
      deleteUrl = `/forms/option/${optionId}/delete/`;
      deleteConfirmText.textContent = '¿Estás seguro de que deseas eliminar esta opción?';
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
      modal.show();
    });
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function() {
      // Crear un formulario dinámico para enviar la solicitud POST
      const form = document.createElement('form');
      form.method = deleteMethod;
      form.action = deleteUrl;
      
      // Añadir CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = document.querySelector('[name=csrfmiddlewaretoken]').value;
      form.appendChild(csrfInput);
      
      // Añadir el formulario al DOM y enviarlo
      document.body.appendChild(form);
      form.submit();
    });
  }

  // Función para actualizar el orden de las preguntas
  function updateQuestionsOrder(questionIds) {
    fetch(`/forms/{{ gform.id }}/update-question-order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: JSON.stringify({
        question_ids: questionIds
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Orden de preguntas actualizado');
      } else {
        console.error('Error al actualizar el orden de preguntas:', data.error);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

  // Función para actualizar el orden de las opciones
  function updateOptionsOrder(questionId, optionIds) {
    fetch(`/forms/question/${questionId}/update-option-order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: JSON.stringify({
        option_ids: optionIds
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Orden de opciones actualizado');
      } else {
        console.error('Error al actualizar el orden de opciones:', data.error);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

  // Actualizar vista previa de escala lineal
  const minValueInput = document.getElementById('id_min_value');
  const maxValueInput = document.getElementById('id_max_value');
  const minLabelInput = document.getElementById('id_min_label');
  const maxLabelInput = document.getElementById('id_max_label');
  const previewMinLabel = document.getElementById('preview-min-label');
  const previewMaxLabel = document.getElementById('preview-max-label');
  const scalePreviewOptions = document.querySelector('.scale-preview-options');

  function updateScalePreview() {
    if (minValueInput && maxValueInput && scalePreviewOptions) {
      const minVal = parseInt(minValueInput.value) || 1;
      const maxVal = parseInt(maxValueInput.value) || 5;
      
      // Actualizar etiquetas
      if (previewMinLabel && minLabelInput) {
        previewMinLabel.textContent = minLabelInput.value || 'Muy insatisfecho';
      }
      
      if (previewMaxLabel && maxLabelInput) {
        previewMaxLabel.textContent = maxLabelInput.value || 'Muy satisfecho';
      }
      
      // Actualizar opciones
      if (scalePreviewOptions) {
        scalePreviewOptions.innerHTML = '';
        for (let i = minVal; i <= maxVal; i++) {
          const span = document.createElement('span');
          span.textContent = i;
          scalePreviewOptions.appendChild(span);
        }
      }
    }
  }

  // Función para actualizar la vista previa en el modal de edición
  function updateEditScalePreview() {
    const editMinValue = document.getElementById('edit_min_value');
    const editMaxValue = document.getElementById('edit_max_value');
    const editMinLabel = document.getElementById('edit_min_label');
    const editMaxLabel = document.getElementById('edit_max_label');
    const editPreviewMinLabel = document.getElementById('edit-preview-min-label');
    const editPreviewMaxLabel = document.getElementById('edit-preview-max-label');
    const editScalePreviewOptions = document.querySelector('#editLinearScaleFields .scale-preview-options');
    
    if (editMinValue && editMaxValue && editScalePreviewOptions) {
      const minVal = parseInt(editMinValue.value) || 1;
      const maxVal = parseInt(editMaxValue.value) || 5;
      
      // Actualizar etiquetas
      if (editPreviewMinLabel && editMinLabel) {
        editPreviewMinLabel.textContent = editMinLabel.value || 'Muy insatisfecho';
      }
      
      if (editPreviewMaxLabel && editMaxLabel) {
        editPreviewMaxLabel.textContent = editMaxLabel.value || 'Muy satisfecho';
      }
      
      // Actualizar opciones
      if (editScalePreviewOptions) {
        editScalePreviewOptions.innerHTML = '';
        for (let i = minVal; i <= maxVal; i++) {
          const span = document.createElement('span');
          span.textContent = i;
          editScalePreviewOptions.appendChild(span);
        }
      }
    }
  }

  // Añadir event listeners para actualizar la vista previa
  if (minValueInput) minValueInput.addEventListener('input', updateScalePreview);
  if (maxValueInput) maxValueInput.addEventListener('input', updateScalePreview);
  if (minLabelInput) minLabelInput.addEventListener('input', updateScalePreview);
  if (maxLabelInput) maxLabelInput.addEventListener('input', updateScalePreview);

  // Event listeners para la vista previa en el modal de edición
  const editMinValue = document.getElementById('edit_min_value');
  const editMaxValue = document.getElementById('edit_max_value');
  const editMinLabel = document.getElementById('edit_min_label');
  const editMaxLabel = document.getElementById('edit_max_label');

  if (editMinValue) editMinValue.addEventListener('input', updateEditScalePreview);
  if (editMaxValue) editMaxValue.addEventListener('input', updateEditScalePreview);
  if (editMinLabel) editMinLabel.addEventListener('input', updateEditScalePreview);
  if (editMaxLabel) editMaxLabel.addEventListener('input', updateEditScalePreview);

  // Inicializar vistas previas
  updateScalePreview();
  updateEditScalePreview();

  // Funcionalidad para mostrar notificaciones cuando no hay respuestas o preguntas
  document.querySelectorAll('.responses-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (this.dataset.hasResponses === 'false') {
        e.preventDefault();
        
        // Mostrar notificación
        showToast('Este formulario aún no tiene respuestas.', 'warning');
      }
    });
  });

  document.querySelectorAll('.responder-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (this.dataset.hasQuestions === 'false') {
        e.preventDefault();
        
        // Mostrar notificación
        showToast('Este formulario no tiene preguntas. Añade preguntas antes de responder.', 'warning');
      }
    });
  });

  // Función para mostrar toasts
  function showToast(message, type = 'info') {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(document.getElementById('notificationToast'));
    toast.show();
  }

  // Añadir efectos visuales para drag and drop
  document.addEventListener('dragover', function(e) {
    if (questionsList.contains(e.target) || questionsList === e.target) {
      questionsList.classList.add('drop-target');
    }
  });

  document.addEventListener('dragleave', function(e) {
    if (!questionsList.contains(e.relatedTarget)) {
      questionsList.classList.remove('drop-target');
    }
  });

  document.addEventListener('drop', function() {
    questionsList.classList.remove('drop-target');
  });

  document.addEventListener('dragend', function() {
    questionsList.classList.remove('drop-target');
  });

  // Función para añadir una pregunta desde el banco
  function addQuestionFromBank(questionId) {
    // Crear un formulario para enviar la solicitud POST
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/forms/form/{{ gform.id }}/add-from-bank/${questionId}/`;
    
    // Añadir CSRF token
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrfmiddlewaretoken';
    csrfInput.value = document.querySelector('[name=csrfmiddlewaretoken]').value;
    form.appendChild(csrfInput);
    
    // Añadir el formulario al DOM
    document.body.appendChild(form);
    
    // Enviar el formulario usando fetch
    fetch(form.action, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfInput.value,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: new FormData(form)
    })
    .then(response => response.json())
    .then(data => {
      // Eliminar el formulario temporal
      document.body.removeChild(form);
      
      if (data.success) {
        // Recargar la página para mostrar la nueva pregunta
        location.reload();
      } else {
        showToast('Error al añadir la pregunta desde el banco: ' + (data.error || 'Error desconocido'), 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Error al añadir la pregunta desde el banco', 'error');
      document.body.removeChild(form);
    });
  }

  // Función para actualizar el banco de preguntas
  function updateQuestionBank() {
    // Obtener el contenedor del banco de preguntas
    const questionBankContainer = document.getElementById('questionBank');
    
    if (!questionBankContainer) return;
    
    // Mostrar un indicador de carga
    questionBankContainer.innerHTML = '<div class="text-center p-3"><i class="bi bi-arrow-repeat spinner"></i> Actualizando banco de preguntas...</div>';
    
    // Realizar una solicitud AJAX para obtener las preguntas actualizadas
    fetch('/forms/question-bank/json/', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Limpiar el contenedor
      questionBankContainer.innerHTML = '';
      
      if (data.success && data.bank_questions && data.bank_questions.length > 0) {
        // Añadir cada pregunta al banco
        data.bank_questions.forEach(question => {
          const questionItem = document.createElement('div');
          questionItem.className = 'bank-question-item';
          questionItem.dataset.id = question.id;
          questionItem.dataset.type = question.question_type;
          questionItem.draggable = true;
          
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
          `;
          
          questionBankContainer.appendChild(questionItem);
        });
        
        // Reinicializar los eventos para los nuevos botones
        initBankQuestionEvents();
      } else {
        // Mostrar mensaje si no hay preguntas
        questionBankContainer.innerHTML = `
          <div class="bank-empty">
            <i class="bi bi-archive"></i>
            <h5>No hay preguntas guardadas</h5>
            <p>Guarda preguntas en el banco para reutilizarlas en otros formularios.</p>
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('Error al actualizar el banco de preguntas:', error);
      questionBankContainer.innerHTML = '<div class="alert alert-danger">Error al cargar las preguntas del banco</div>';
    });
  }

  // Inicializar eventos para el banco de preguntas
  function initBankQuestionEvents() {
    // Reinicializar Sortable para el banco de preguntas
    if (window.Sortable) {
      const questionBank = document.getElementById('questionBank');
      if (questionBank) {
        new Sortable(questionBank, {
          animation: 150,
          group: {
            name: 'questions',
            pull: 'clone',
            put: false
          },
          sort: false,
          onClone: function(evt) {
            const clone = evt.clone;
            clone.classList.add('dragging');
          }
        });
      }
    }
    
    // Reinicializar eventos para los botones de añadir desde el banco
    document.querySelectorAll('.add-bank-question-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const questionId = this.dataset.id;
        addQuestionFromBank(questionId);
      });
    });
    
    // Eventos para los botones de editar preguntas del banco
    document.querySelectorAll('.edit-bank-question-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const questionId = this.dataset.id;
        editBankQuestion(questionId);
      });
    });
    
    // Eventos para los botones de eliminar preguntas del banco
    document.querySelectorAll('.delete-bank-question-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const questionId = this.dataset.id;
        deleteBankQuestion(questionId);
      });
    });
  }

  // Función para editar una pregunta del banco
  function editBankQuestion(questionId) {
    // Mostrar un indicador de carga
    showToast('Cargando datos de la pregunta...', 'info');
    
    // Obtener los datos de la pregunta
    fetch(`/forms/question-bank/${questionId}/`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const question = data.question;
        
        // Llenar el formulario de edición
        document.getElementById('edit_text').value = question.text;
        document.getElementById('edit_help_text').value = question.help_text || '';
        document.getElementById('edit_is_required').checked = question.is_required;
        document.getElementById('edit_allow_attachments').checked = question.allow_attachments;
        document.getElementById('edit_in_question_bank').checked = true;
        document.getElementById('edit_in_question_bank').disabled = true; // No permitir desmarcar
        
        // Seleccionar el tipo de pregunta
        const typeSelect = document.getElementById('edit_question_type');
        for (let i = 0; i < typeSelect.options.length; i++) {
          if (typeSelect.options[i].value === question.question_type) {
            typeSelect.selectedIndex = i;
            break;
          }
        }
        
        // Mostrar campos específicos según el tipo
        if (question.question_type === 'linear_scale') {
          document.getElementById('editLinearScaleFields').classList.remove('d-none');
          
          // Establecer valores de escala
          document.getElementById('edit_min_value').value = question.min_value || 1;
          document.getElementById('edit_max_value').value = question.max_value || 5;
          document.getElementById('edit_min_label').value = question.min_label || '';
          document.getElementById('edit_max_label').value = question.max_label || '';
          
          // Actualizar vista previa
          updateEditScalePreview();
        } else {
          document.getElementById('editLinearScaleFields').classList.add('d-none');
        }
        
        // Actualizar la URL del formulario para apuntar a la API de edición del banco
        document.getElementById('editQuestionForm').action = `/forms/question-bank/${questionId}/edit/`;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('editQuestionModal'));
        modal.show();
      } else {
        showToast('Error al cargar los datos de la pregunta', 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Error al cargar los datos de la pregunta', 'error');
    });
  }

  // Función para eliminar una pregunta del banco
  function deleteBankQuestion(questionId) {
    // Mostrar el modal de confirmación
    const deleteConfirmText = document.getElementById('deleteConfirmText');
    deleteConfirmText.textContent = '¿Estás seguro de que deseas eliminar esta pregunta del banco?';
    
    // Configurar el botón de confirmación
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Eliminar event listeners anteriores
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
    
    // Añadir nuevo event listener
    newConfirmBtn.addEventListener('click', function() {
      // Crear un formulario para enviar la solicitud POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/forms/question-bank/${questionId}/delete/`;
      
      // Añadir CSRF token
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = document.querySelector('[name=csrfmiddlewaretoken]').value;
      form.appendChild(csrfInput);
      
      // Añadir el formulario al DOM
      document.body.appendChild(form);
      
      // Enviar el formulario usando fetch
      fetch(form.action, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfInput.value,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form)
      })
      .then(response => response.json())
      .then(data => {
        // Eliminar el formulario temporal
        document.body.removeChild(form);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        if (data.success) {
          // Actualizar el banco de preguntas
          updateQuestionBank();
          showToast(data.message || 'Pregunta eliminada correctamente del banco', 'success');
        } else {
          showToast('Error al eliminar la pregunta: ' + (data.error || 'Error desconocido'), 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showToast('Error al eliminar la pregunta', 'error');
        document.body.removeChild(form);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
      });
    });
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
  }
});