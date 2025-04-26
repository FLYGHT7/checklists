#!/usr/bin/env python
"""
Script para limpieza automática de duplicados en el banco de preguntas.
Este script puede ser ejecutado como una tarea programada (cron job) para
mantener el banco de preguntas limpio de duplicados.

Uso:
    python auto_cleanup.py

Configuración recomendada para cron:
    */30 * * * * /ruta/a/tu/entorno/python /ruta/a/tu/proyecto/auto_cleanup.py >> /ruta/a/logs/cleanup.log 2>&1
"""

import os
import sys
import django
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('auto_cleanup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configurar entorno Django
# Ajusta la ruta según la estructura de tu proyecto
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tu_proyecto.settings")
django.setup()

# Importar modelos después de configurar Django
try:
    from django.contrib.auth.models import User
    from forms_google.models import BankQuestion
except ImportError as e:
    logger.error(f"Error al importar modelos: {e}")
    sys.exit(1)

def cleanup_duplicates():
    """
    Elimina preguntas duplicadas del banco de preguntas basándose en el hash
    y el contenido de las preguntas.
    """
    logger.info("Iniciando limpieza automática de duplicados...")
    start_time = datetime.now()
    
    try:
        # Procesar usuario por usuario para evitar eliminar preguntas de otros usuarios
        users = User.objects.all()
        total_removed = 0
        total_questions = 0
        
        for user in users:
            logger.info(f"Procesando usuario: {user.username}")
            
            # Obtener todas las preguntas del banco del usuario
            user_questions = BankQuestion.objects.filter(created_by=user)
            total_questions += user_questions.count()
            
            if not user_questions.exists():
                logger.info(f"  - No hay preguntas para el usuario {user.username}")
                continue
                
            # Usar un diccionario para rastrear preguntas por contenido y hash
            seen_content = {}
            seen_hash = {}
            duplicates_to_delete = []
            
            for question in user_questions:
                # Asegurar que todas las preguntas tengan hash
                if not question.question_hash:
                    question.generate_hash()
                    question.save(update_fields=['question_hash'])
                
                # Crear una clave única basada en el contenido
                content_key = f"{question.text}|{question.question_type}"
                
                # Verificar duplicados por hash o contenido
                if question.question_hash in seen_hash or content_key in seen_content:
                    # Este es un duplicado, marcarlo para eliminación
                    duplicates_to_delete.append(question.id)
                    logger.debug(f"  - Duplicado detectado: {question.id}")
                else:
                    seen_hash[question.question_hash] = question
                    seen_content[content_key] = question
            
            # Eliminar los duplicados detectados
            if duplicates_to_delete:
                delete_count = len(duplicates_to_delete)
                BankQuestion.objects.filter(id__in=duplicates_to_delete).delete()
                logger.info(f"  - Eliminados {delete_count} duplicados para {user.username}")
                total_removed += delete_count
            else:
                logger.info(f"  - No se encontraron duplicados para {user.username}")
        
        # Calcular estadísticas
        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Limpieza completada en {execution_time:.2f} segundos")
        logger.info(f"Total de preguntas procesadas: {total_questions}")
        logger.info(f"Total de duplicados eliminados: {total_removed}")
        
        return {
            'total_questions': total_questions,
            'duplicates_removed': total_removed,
            'questions_kept': total_questions - total_removed,
            'execution_time': execution_time
        }
        
    except Exception as e:
        logger.error(f"Error durante la limpieza: {str(e)}", exc_info=True)
        return {
            'error': str(e),
            'total_questions': 0,
            'duplicates_removed': 0,
            'questions_kept': 0,
            'execution_time': (datetime.now() - start_time).total_seconds()
        }

if __name__ == "__main__":
    try:
        result = cleanup_duplicates()
        logger.info(f"Resumen: {result}")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error general: {str(e)}", exc_info=True)
        sys.exit(1)