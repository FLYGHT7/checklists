from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.utils import timezone
import uuid
import hashlib
from datetime import datetime, timedelta

# Models todo_list
class TodoList(models.Model):
  name = models.CharField(max_length=255)
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  created_at = models.DateTimeField(default=now)

  def __str__(self):
      return self.name

# Models task
class Task(models.Model):
  STATUS_CHOICES = (
      ('todo', 'Por Hacer'),
      ('progress', 'En Progreso'),
      ('done', 'Completado'),
  )
  
  title = models.CharField(max_length=255)
  description = models.TextField(blank=True, null=True)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
  position = models.IntegerField(default=0)
  todo_list = models.ForeignKey(TodoList, on_delete=models.CASCADE, related_name='tasks')
  due_date = models.DateTimeField(null=True, blank=True)
  
  def is_late(self):
      """determines if the task is late"""
      return self.due_date and self.due_date < timezone.now()
  
  def is_due_today(self):
      """determines if the task is due today"""
      if not self.due_date:
          return False
      today = timezone.now().date()
      return self.due_date.date() == today

  def __str__(self):
      return self.title
  
  class Meta:
      ordering = ['status', 'position']

# Modelo para el banco de preguntas (independiente de formularios)
class BankQuestion(models.Model):
  """Modelo para preguntas guardadas en el banco, independientes de cualquier formulario"""
  QUESTION_TYPES = (
      ('short_text', 'Texto Corto'),
      ('paragraph', 'Párrafo'),
      ('multiple_choice', 'Opción Múltiple'),
      ('checkbox', 'Casillas de Verificación'),
      ('dropdown', 'Lista Desplegable'),
      ('linear_scale', 'Escala Lineal'),
      ('date', 'Fecha'),
      ('time', 'Hora'),
  )
  
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  text = models.CharField(max_length=500)
  question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
  help_text = models.CharField(max_length=255, blank=True, null=True)
  is_required = models.BooleanField(default=False)
  
  # Campos específicos para escala lineal
  min_value = models.IntegerField(default=1, null=True, blank=True)
  max_value = models.IntegerField(default=5, null=True, blank=True)
  min_label = models.CharField(max_length=50, blank=True, null=True)
  max_label = models.CharField(max_length=50, blank=True, null=True)
  
  # Imagen para la pregunta (opcional)
  image = models.ImageField(upload_to='bank_question_images/', blank=True, null=True)
  
  # Campo para controlar si se permiten adjuntos
  allow_attachments = models.BooleanField(default=False, help_text="Permitir que los usuarios adjunten archivos o URLs a esta pregunta")
  
  # Metadatos
  created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bank_questions_created')
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  # Nuevo campo para identificar de manera única la pregunta (hash)
  question_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
  
  class Meta:
      # Añadir restricción única para evitar duplicados
      unique_together = ('created_by', 'question_hash')
  
  def __str__(self):
      return f"{self.text} ({self.get_question_type_display()})"
  
  def get_question_type_display(self):
      return dict(self.QUESTION_TYPES).get(self.question_type, self.question_type)
  
  @property
  def usage_count(self):
      """Retorna el número de formularios que usan esta pregunta"""
      return GQuestion.objects.filter(bank_question=self).count()
  
  def generate_hash(self):
      """Genera un hash único basado en el contenido de la pregunta"""
      content = f"{self.text}|{self.question_type}|{self.help_text}|{self.is_required}|{self.created_by_id}"
      self.question_hash = hashlib.sha256(content.encode()).hexdigest()
      return self.question_hash
  
  def save(self, *args, **kwargs):
      try:
          # Generar un hash único basado en el contenido de la pregunta
          if not self.question_hash:
              self.generate_hash()
          
          # Verificar si ya existe una pregunta con el mismo contenido (mejor detección de duplicados)
          if not self.pk:  # Solo para nuevas preguntas
              existing = BankQuestion.objects.filter(
                  created_by=self.created_by, 
                  question_hash=self.question_hash
              ).first()
              
              if existing:
                  # Si ya existe, retornar la existente en lugar de crear una nueva
                  return existing
          
          # Si no existe o es una actualización, guardar normalmente
          super().save(*args, **kwargs)
          return self
          
      except Exception as e:
          import traceback
          print(f"Error al guardar BankQuestion: {str(e)}\n{traceback.format_exc()}")
          
          # Intentar guardar sin el hash como último recurso
          if not self.question_hash:
              import time
              self.question_hash = f"fallback-{int(time.time())}"
          
          super().save(*args, **kwargs)
          return self

class BankOption(models.Model):
  """Modelo para opciones de preguntas de selección en el banco"""
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  question = models.ForeignKey(BankQuestion, on_delete=models.CASCADE, related_name='options')
  text = models.CharField(max_length=255)
  position = models.PositiveIntegerField(default=0)
  
  def __str__(self):
      return self.text
  
  class Meta:
      ordering = ['position']

# Modelos para Google Forms
class GForm(models.Model):
    """Modelo principal para formularios tipo Google Forms"""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gforms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-updated_at']

    def get_user_permission(self, user=None):
        """Obtiene el permiso del usuario para este formulario"""
        # Si no se proporciona usuario, usar el usuario de la solicitud
        from django.utils.functional import SimpleLazyObject
        
        # Si el usuario es el propietario, devolver 'owner'
        if user == self.user:
            return 'owner'
        
        # Buscar si existe un permiso específico para este usuario
        try:
            # Añadir log para depuración
            print(f"Buscando permiso para usuario {user.username} en formulario {self.id}")
            permission = FormPermission.objects.get(form=self, user=user)
            print(f"Permiso encontrado: {permission.permission_type}")
            return permission.permission_type
        except FormPermission.DoesNotExist:
            print(f"No se encontró permiso para usuario {user.username} en formulario {self.id}")
            return 'viewer'  # Por defecto, si no hay permiso específico

    def can_edit(self, user):
        """Verifica si el usuario puede editar el formulario"""
        permission = self.get_user_permission(user)
        return permission in ['owner', 'editor']
    
    def can_respond(self, user):
        """Verifica si el usuario puede responder el formulario"""
        permission = self.get_user_permission(user)
        # Corregir: Solo propietarios, editores y respondedores pueden responder
        return permission in ['owner', 'editor', 'responder'] or self.is_published
    
    def can_view(self, user):
        """Verifica si el usuario puede ver el formulario"""
        permission = self.get_user_permission(user)
        return permission in ['owner', 'editor', 'responder', 'viewer'] or self.is_published

class FormPermission(models.Model):
  """Modelo para gestionar permisos de usuarios en formularios"""
  PERMISSION_CHOICES = (
      ('editor', 'Editor'),
      ('responder', 'Respondedor'),
      ('viewer', 'Visualizador'),
  )
  
  form = models.ForeignKey(GForm, on_delete=models.CASCADE, related_name='permissions')
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='form_permissions')
  permission_type = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
  created_at = models.DateTimeField(auto_now_add=True)
  
  class Meta:
      unique_together = ('form', 'user')  # Un usuario solo puede tener un tipo de permiso por formulario
  
  def __str__(self):
      return f"{self.user.username} - {self.get_permission_type_display()} en {self.form.title}"

class FormShareLink(models.Model):
  """Modelo para enlaces de compartir formularios con usuarios no registrados"""
  PERMISSION_CHOICES = (
      ('editor', 'Editor'),
      ('responder', 'Respondedor'),
      ('viewer', 'Visualizador'),
  )
  
  form = models.ForeignKey(GForm, on_delete=models.CASCADE, related_name='share_links')
  token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
  permission_type = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
  created_at = models.DateTimeField(auto_now_add=True)
  expires_at = models.DateTimeField(null=True, blank=True)  # Opcional: fecha de expiración
  
  def __str__(self):
      return f"Enlace de {self.get_permission_type_display()} para {self.form.title}"
  
  def is_valid(self):
      """Verifica si el enlace es válido (no ha expirado)"""
      if not self.expires_at:
          return True
      return timezone.now() < self.expires_at

class GQuestion(models.Model):
  """Modelo para preguntas del formulario"""
  QUESTION_TYPES = (
      ('short_text', 'Texto Corto'),
      ('paragraph', 'Párrafo'),
      ('multiple_choice', 'Opción Múltiple'),
      ('checkbox', 'Casillas de Verificación'),
      ('dropdown', 'Lista Desplegable'),
      ('linear_scale', 'Escala Lineal'),
      ('date', 'Fecha'),
      ('time', 'Hora'),
  )
  
  form = models.ForeignKey(GForm, on_delete=models.CASCADE, related_name='questions')
  text = models.CharField(max_length=500)
  question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
  help_text = models.CharField(max_length=255, blank=True, null=True)
  is_required = models.BooleanField(default=False)
  position = models.PositiveIntegerField(default=0)
  
  # Campos específicos para escala lineal
  min_value = models.IntegerField(default=1, null=True, blank=True)
  max_value = models.IntegerField(default=5, null=True, blank=True)
  min_label = models.CharField(max_length=50, blank=True, null=True)
  max_label = models.CharField(max_length=50, blank=True, null=True)
  
  # Imagen para la pregunta (opcional)
  image = models.ImageField(upload_to='gform_question_images/', blank=True, null=True)
  
  # Campo para controlar si se permiten adjuntos
  allow_attachments = models.BooleanField(default=False, help_text="Permitir que los usuarios adjunten archivos o URLs a esta pregunta")
  
  # Relación con el banco de preguntas (opcional)
  bank_question = models.ForeignKey(BankQuestion, on_delete=models.SET_NULL, null=True, blank=True, related_name='form_questions')
  
  def __str__(self):
      return f"{self.text} ({self.get_question_type_display()})"
  
  @property
  def in_question_bank(self):
      """Retorna True si la pregunta está vinculada al banco"""
      return self.bank_question is not None
  
  class Meta:
      ordering = ['position']

class GOption(models.Model):
  """Modelo para opciones de preguntas de selección"""
  question = models.ForeignKey(GQuestion, on_delete=models.CASCADE, related_name='options')
  text = models.CharField(max_length=255)
  position = models.PositiveIntegerField(default=0)
  
  def __str__(self):
      return self.text
  
  class Meta:
      ordering = ['position']

class GResponse(models.Model):
  """Modelo para respuestas al formulario"""
  form = models.ForeignKey(GForm, on_delete=models.CASCADE, related_name='responses')
  respondent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
  respondent_email = models.EmailField(blank=True, null=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  def __str__(self):
      return f"Respuesta a {self.form.title} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"
  
  class Meta:
      ordering = ['-created_at']

class GAnswer(models.Model):
  """Modelo para respuestas individuales a preguntas"""
  response = models.ForeignKey(GResponse, on_delete=models.CASCADE, related_name='answers')
  question = models.ForeignKey(GQuestion, on_delete=models.CASCADE)
  text_answer = models.TextField(blank=True, null=True)
  
  # Campos para archivos adjuntos en respuestas
  image = models.ImageField(upload_to='gform_answer_images/', blank=True, null=True)
  video = models.FileField(upload_to='gform_answer_videos/', blank=True, null=True)
  file_url = models.URLField(blank=True, null=True)
  
  def __str__(self):
      return f"Respuesta a {self.question.text}"

class GSelectedOption(models.Model):
  """Modelo para opciones seleccionadas en preguntas de selección"""
  answer = models.ForeignKey(GAnswer, on_delete=models.CASCADE, related_name='selected_options')
  option = models.ForeignKey(GOption, on_delete=models.CASCADE)
  
  def __str__(self):
      return f"Opción seleccionada: {self.option.text}"
