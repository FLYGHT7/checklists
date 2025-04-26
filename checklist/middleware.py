from django.utils.deprecation import MiddlewareMixin
import logging
from django.core.cache import cache
from django.utils import translation

# Configurar logging
logger = logging.getLogger(__name__)

class CachedLanguageMiddleware(MiddlewareMixin):
    """
    Middleware optimizado para manejar el cambio de idioma con caché
    """
    
    def process_request(self, request):
        # Generar una clave de caché basada en la sesión
        session_key = request.session.session_key
        if not session_key:
            # Si no hay sesión, crear una
            request.session.create()
            session_key = request.session.session_key
            
        cache_key = f"user_language_{session_key}"
        
        # Verificar si hay un cambio explícito de idioma
        if 'set_language' in request.GET or 'language' in request.POST:
            # Procesar el cambio de idioma
            language = request.POST.get('language', request.GET.get('set_language', 'es'))
            request.session['language'] = language
            # Guardar en caché
            cache.set(cache_key, language, 60 * 60 * 24)  # 24 horas
            logger.debug(f"Middleware: Idioma cambiado a {language}")
        else:
            # Intentar obtener el idioma de la caché
            language = cache.get(cache_key)
            
            if language is None:
                # Si no está en caché, obtener de la sesión o usar el predeterminado
                language = request.session.get('language', 'es')
                # Guardar en caché para futuras solicitudes
                cache.set(cache_key, language, 60 * 60 * 24)  # 24 horas
                logger.debug(f"Middleware: Idioma establecido a {language} (desde sesión)")
            else:
                # No registrar nada si se obtuvo de la caché para reducir logs
                pass
        
        # Establecer el idioma en el request para que esté disponible en las plantillas
        request.LANGUAGE_CODE = language
        
        # Establecer en el contexto global para que esté disponible en todas las plantillas
        translation.activate(language)
        
        return None
    
    def process_template_response(self, request, response):
        """
        Asegurarse de que el idioma esté disponible en el contexto de la plantilla
        """
        if hasattr(response, 'context_data') and response.context_data is not None:
            response.context_data['LANGUAGE_CODE'] = request.LANGUAGE_CODE
        return response