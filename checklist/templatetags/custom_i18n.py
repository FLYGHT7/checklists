from django import template
from django.utils.safestring import mark_safe
from checklist.translation import translate

register = template.Library()

@register.filter
def trans(text, language=None):
    """
    Filtro de plantilla para traducir texto
    
    Uso:
        {{ "Hello World"|trans:LANGUAGE_CODE }}
    """
    if not language:
        from django.utils.translation import get_language
        language = get_language()
    
    return mark_safe(translate(text, language))

@register.simple_tag(takes_context=True)
def trans_tag(context, text):
    """
    Tag de plantilla para traducir texto
    
    Uso:
        {% trans_tag "Hello World" %}
    """
    language = context.get('LANGUAGE_CODE', 'en')
    return mark_safe(translate(text, language))