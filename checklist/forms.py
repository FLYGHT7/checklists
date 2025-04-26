from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import TodoList, Task, GForm, GQuestion, GOption, FormPermission, FormShareLink

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Agregar clases de Bootstrap a los campos
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            field.widget.attrs['placeholder'] = field.label

class TodoListForm(forms.ModelForm):
    class Meta:
        model = TodoList
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre de la lista'})
        }

class TaskForm(forms.ModelForm):
    STATUS_CHOICES = [
        ('todo', 'Por Hacer'),
        ('progress', 'En Progreso'),
        ('done', 'Completado')
    ]
    
    status = forms.ChoiceField(
        choices=STATUS_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    due_date = forms.DateTimeField(
        required=False,
        widget=forms.DateTimeInput(attrs={
            'class': 'form-control',
            'type': 'datetime-local',
            'placeholder': 'Fecha de Entrega'
        })
    )
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'due_date']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Título de la tarea'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Descripción (opcional)',
                'rows': 3
            })
        }

# Formularios para Google Forms
class GFormForm(forms.ModelForm):
    """Formulario para crear/editar formularios"""
    class Meta:
        model = GForm
        fields = ['title', 'description', 'is_published']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Título del formulario'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Descripción (opcional)', 'rows': 3}),
            'is_published': forms.CheckboxInput(attrs={'class': 'form-check-input'})
        }

class GQuestionForm(forms.ModelForm):
    """Formulario para crear/editar preguntas"""
    class Meta:
        model = GQuestion
        fields = ['question_type', 'text', 'help_text', 'is_required', 'allow_attachments', 'min_value', 'max_value', 'min_label', 'max_label', 'image']
        widgets = {
            'question_type': forms.Select(attrs={'class': 'form-select'}),
            'text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Texto de la pregunta'}),
            'help_text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Texto de ayuda (opcional)'}),
            'is_required': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'allow_attachments': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'min_value': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'max': '10'}),
            'max_value': forms.NumberInput(attrs={'class': 'form-control', 'min': '1', 'max': '10'}),
            'min_label': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Etiqueta mínima'}),
            'max_label': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Etiqueta máxima'}),
            'image': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'})
        }

class GOptionForm(forms.ModelForm):
    """Formulario para crear/editar opciones"""
    class Meta:
        model = GOption
        fields = ['text']
        widgets = {
            'text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Texto de la opción'})
        }

class GFormResponseForm(forms.Form):
    """Formulario dinámico para responder a un formulario"""
    # Este formulario se construye dinámicamente en la vista
    def __init__(self, *args, **kwargs):
        form_instance = kwargs.pop('form_instance')
        super(GFormResponseForm, self).__init__(*args, **kwargs)
        
        # Agregar campos dinámicamente basados en las preguntas del formulario
        for question in form_instance.questions.all():
            field_name = f'question_{question.id}'
            
            if question.question_type == 'short_text':
                self.fields[field_name] = forms.CharField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    widget=forms.TextInput(attrs={'class': 'form-control'})
                )
            
            elif question.question_type == 'paragraph':
                self.fields[field_name] = forms.CharField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3})
                )
            
            elif question.question_type == 'multiple_choice':
                choices = [(option.id, option.text) for option in question.options.all()]
                self.fields[field_name] = forms.ChoiceField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    choices=choices,
                    widget=forms.RadioSelect(attrs={'class': 'form-check-input'})
                )
            
            elif question.question_type == 'checkbox':
                choices = [(option.id, option.text) for option in question.options.all()]
                self.fields[field_name] = forms.MultipleChoiceField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    choices=choices,
                    widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'})
                )
            
            elif question.question_type == 'dropdown':
                choices = [('', 'Selecciona una opción')] + [(option.id, option.text) for option in question.options.all()]
                self.fields[field_name] = forms.ChoiceField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    choices=choices,
                    widget=forms.Select(attrs={'class': 'form-select'})
                )
            
            elif question.question_type == 'linear_scale':
                min_val = question.min_value or 1
                max_val = question.max_value or 5
                choices = [(str(i), str(i)) for i in range(min_val, max_val + 1)]
                self.fields[field_name] = forms.ChoiceField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    choices=choices,
                    widget=forms.RadioSelect(attrs={'class': 'form-check-input scale-option'})
                )
            
            elif question.question_type == 'date':
                self.fields[field_name] = forms.DateField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
                )
            
            elif question.question_type == 'time':
                self.fields[field_name] = forms.TimeField(
                    label=question.text,
                    help_text=question.help_text,
                    required=question.is_required,
                    widget=forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'})
                )
            
            # Añadir campos para archivos adjuntos en respuestas solo si la pregunta lo permite
            if question.allow_attachments:
                file_field_name = f'file_{question.id}'
                self.fields[file_field_name] = forms.FileField(
                    label="Adjuntar imagen o video (opcional)",
                    required=False,
                    widget=forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*,video/*'})
                )
                
                url_field_name = f'url_{question.id}'
                self.fields[url_field_name] = forms.URLField(
                    label="O proporciona una URL de imagen/video (opcional)",
                    required=False,
                    widget=forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://ejemplo.com/imagen.jpg'})
                )

# Formularios para permisos y compartir
class FormPermissionForm(forms.Form):
    """Formulario para añadir permisos a usuarios"""
    user_email = forms.EmailField(
        label="Correo electrónico del usuario",
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'usuario@ejemplo.com'})
    )
    
    permission_type = forms.ChoiceField(
        label="Tipo de permiso",
        choices=FormPermission.PERMISSION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

class FormShareLinkForm(forms.Form):
    """Formulario para crear enlaces de compartir"""
    permission_type = forms.ChoiceField(
        label="Tipo de permiso",
        choices=FormShareLink.PERMISSION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    EXPIRATION_CHOICES = [
        ('never', 'Nunca expira'),
        ('1d', '1 día'),
        ('7d', '7 días'),
        ('30d', '30 días'),
    ]
    
    expires_in = forms.ChoiceField(
        label="Expiración del enlace",
        choices=EXPIRATION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )