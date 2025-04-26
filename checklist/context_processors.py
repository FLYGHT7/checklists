def language_context_processor(request):
    """
    Añade el código de idioma al contexto de todas las plantillas
    """
    return {
        'LANGUAGE_CODE': getattr(request, 'LANGUAGE_CODE', 'es')
    }