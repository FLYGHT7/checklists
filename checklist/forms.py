from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.utils.translation import get_language
from .models import TodoList, Task, GForm, GQuestion, GOption, FormPermission, FormShareLink
from .translation import translate

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
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'List name'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['name'].widget.attrs['placeholder'] = translate('List name', lang)

class TaskForm(forms.ModelForm):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('progress', 'In Progress'),
        ('done', 'Completed')
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
            'placeholder': 'Due date'
        })
    )
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'due_date']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Task title'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Description (optional)',
                'rows': 3
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['title'].widget.attrs['placeholder'] = translate('Task title', lang)
        self.fields['description'].widget.attrs['placeholder'] = translate('Description (optional)', lang)
        self.fields['due_date'].widget.attrs['placeholder'] = translate('Due date', lang)
        self.fields['status'].choices = [
            ('todo', translate('To Do', lang)),
            ('progress', translate('In Progress', lang)),
            ('done', translate('Completed', lang)),
        ]

# Formularios para Google Forms
class GFormForm(forms.ModelForm):
    """Formulario para crear/editar formularios"""
    class Meta:
        model = GForm
        fields = ['title', 'description', 'is_published']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Form title'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Description (optional)', 'rows': 3}),
            'is_published': forms.CheckboxInput(attrs={'class': 'form-check-input'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['title'].widget.attrs['placeholder'] = translate('Form title', lang)
        self.fields['description'].widget.attrs['placeholder'] = translate('Description (optional)', lang)

class GQuestionForm(forms.ModelForm):
    """Formulario para crear/editar preguntas"""
    class Meta:
        model = GQuestion
        fields = ['question_type', 'text', 'help_text', 'is_required', 'allow_attachments', 'min_value', 'max_value', 'min_label', 'max_label', 'image']
        widgets = {
            'question_type': forms.Select(attrs={'class': 'form-select'}),
            'text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Question text'}),
            'help_text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Help text (optional)'}),
            'is_required': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'allow_attachments': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'min_value': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'max': '10'}),
            'max_value': forms.NumberInput(attrs={'class': 'form-control', 'min': '1', 'max': '10'}),
            'min_label': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Minimum label'}),
            'max_label': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Maximum label'}),
            'image': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['text'].widget.attrs['placeholder'] = translate('Question text', lang)
        self.fields['help_text'].widget.attrs['placeholder'] = translate('Help text (optional)', lang)
        self.fields['min_label'].widget.attrs['placeholder'] = translate('Minimum label', lang)
        self.fields['max_label'].widget.attrs['placeholder'] = translate('Maximum label', lang)

class GOptionForm(forms.ModelForm):
    """Formulario para crear/editar opciones"""
    class Meta:
        model = GOption
        fields = ['text']
        widgets = {
            'text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Option text'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['text'].widget.attrs['placeholder'] = translate('Option text', lang)

class GFormResponseForm(forms.Form):
    """Formulario dinámico para responder a un formulario"""
    # Este formulario se construye dinámicamente en la vista
    def __init__(self, *args, **kwargs):
        form_instance = kwargs.pop('form_instance')
        super(GFormResponseForm, self).__init__(*args, **kwargs)
        lang = get_language() or 'es'
        
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
                choices = [('', translate('Select an option', lang))] + [(option.id, option.text) for option in question.options.all()]
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
                    label=translate("Attach image or video (optional)", lang),
                    required=False,
                    widget=forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*,video/*'})
                )
                
                url_field_name = f'url_{question.id}'
                self.fields[url_field_name] = forms.URLField(
                    label=translate("Or provide an image/video URL (optional)", lang),
                    required=False,
                    widget=forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://example.com/image.jpg'})
                )

# Formularios para permisos y compartir
class FormPermissionForm(forms.Form):
    """Formulario para añadir permisos a usuarios"""
    user_email = forms.EmailField(
        label="User email",
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'user@example.com'})
    )
    
    permission_type = forms.ChoiceField(
        label="Permission type",
        choices=FormPermission.PERMISSION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['user_email'].label = translate('User email', lang)
        self.fields['user_email'].widget.attrs['placeholder'] = translate('user@example.com', lang)
        self.fields['permission_type'].label = translate('Permission type', lang)

class FormShareLinkForm(forms.Form):
    """Formulario para crear enlaces de compartir"""
    permission_type = forms.ChoiceField(
        label="Permission type",
        choices=FormShareLink.PERMISSION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    
    EXPIRATION_CHOICES = [
        ('never', 'Never expires'),
        ('1d', '1 day'),
        ('7d', '7 days'),
        ('30d', '30 days'),
    ]
    
    expires_in = forms.ChoiceField(
        label="Link expiration",
        choices=EXPIRATION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = get_language() or 'es'
        self.fields['permission_type'].label = translate('Permission type', lang)
        self.fields['expires_in'].label = translate('Link expiration', lang)
        self.fields['expires_in'].choices = [
            ('never', translate('Never expires', lang)),
            ('1d', translate('1 day', lang)),
            ('7d', translate('7 days', lang)),
            ('30d', translate('30 days', lang)),
        ]