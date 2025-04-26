from django import template
import numpy as np

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Obtiene un elemento de un diccionario por su clave"""
    return dictionary.get(key)

@register.filter
def get_range(min_val, max_val):
    """Genera un rango de números desde min_val hasta max_val (inclusive)"""
    min_val = int(min_val)
    max_val = int(max_val)
    return range(min_val, max_val + 1)

@register.filter
def endswith(value, arg):
    """Verifica si un string termina con un sufijo específico"""
    return value.endswith(arg)

@register.filter
def lower(value):
    """Convierte un string a minúsculas"""
    return value.lower()