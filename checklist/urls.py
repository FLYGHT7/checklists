from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

urlpatterns = [
    path('', views.home, name='home'),
    path('favicon.ico', views.favicon_view, name='favicon'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    # Añadir esta línea a urlpatterns en urls.py
    path('todo_list/<int:list_id>/stats/', views.todo_list_stats, name='todo_list_stats'),
    
    # Todo Lists
    path('lists/', views.todo_lists, name='todo_lists'),
    path('lists/create/', views.create_todo_list, name='create_todo_list'),
    path('lists/<int:list_id>/', views.view_todo_list, name='view_todo_list'),
    path('lists/<int:list_id>/delete/', views.delete_todo_list, name='delete_todo_list'),
    
    # Tasks
    path('lists/<int:list_id>/add-task/', views.add_task, name='add_task'),
    path('tasks/<int:task_id>/edit/', views.edit_task, name='edit_task'),
    path('tasks/<int:task_id>/delete/', views.delete_task, name='delete_task'),
    
    # API
    path('api/tasks/<int:task_id>/status/', views.update_task_status, name='update_task_status'),
    path('api/lists/<int:list_id>/order/', views.update_tasks_order, name='update_tasks_order'),
    
    # Google Forms
    path('forms/', views.gform_list, name='gform_list'),
    path('forms/create/', views.gform_create, name='gform_create'),
    path('forms/<int:form_id>/', views.gform_view, name='gform_view'),
    path('forms/<int:form_id>/edit/', views.gform_edit, name='gform_edit'),
    path('forms/<int:form_id>/delete/', views.gform_delete, name='gform_delete'),
    path('forms/<int:form_id>/toggle-publish/', views.gform_toggle_publish, name='gform_toggle_publish'),
    path('forms/<int:form_id>/responses/', views.gform_responses, name='gform_responses'),
    path('forms/<int:form_id>/thank-you/', views.gform_thank_you, name='gform_thank_you'),
    path('forms/<int:form_id>/respond/', views.gform_respond, name='gform_respond'),
    path('forms/<int:form_id>/add-question/', views.gform_add_question, name='gform_add_question'),
    path('forms/<int:form_id>/update-question-order/', views.gform_update_question_order, name='gform_update_question_order'),
    path('forms/question/<int:question_id>/edit/', views.gform_edit_question, name='gform_edit_question'),
    path('forms/question/<int:question_id>/delete/', views.gform_delete_question, name='gform_delete_question'),
    path('forms/question/<int:question_id>/add-option/', views.gform_add_option, name='gform_add_option'),
    path('forms/question/<int:question_id>/update-option-order/', views.gform_update_option_order, name='gform_update_option_order'),
    path('forms/option/<int:option_id>/edit/', views.gform_edit_option, name='gform_edit_option'),
    path('forms/option/<int:option_id>/delete/', views.gform_delete_option, name='gform_delete_option'),
    path('forms/response/<int:response_id>/', views.gform_response_detail, name='gform_response_detail'),
    path('forms/response/<int:response_id>/data/', views.gform_response_data, name='gform_response_data'),
    path('forms/response/<int:response_id>/excel/', views.export_response_to_excel, name='export_response_to_excel'),

    # Redirecciones para URLs antiguas o incorrectas
    path('todo_list/<int:list_id>/', lambda request, list_id: redirect('view_todo_list', list_id=list_id)),

    # Nuevas rutas para el banco de preguntas independiente
    path('forms/question-bank/', views.gform_question_bank, name='gform_question_bank'),
    path('forms/question-bank/json/', views.gform_question_bank_json, name='gform_question_bank_json'),
    path('forms/question-bank/<uuid:question_id>/', views.gform_question_bank_detail, name='gform_question_bank_detail'),
    path('forms/question-bank/<uuid:question_id>/edit/', views.gform_question_bank_edit, name='gform_question_bank_edit'),
    path('forms/question-bank/<uuid:question_id>/delete/', views.gform_question_bank_delete, name='gform_question_bank_delete'),
    path('forms/question/<int:question_id>/save-to-bank/', views.gform_save_question_to_bank, name='gform_save_question_to_bank'),
    path('forms/form/<int:form_id>/add-from-bank/<uuid:question_id>/', views.gform_add_from_bank, name='gform_add_from_bank'),
    # Añadir la nueva URL para obtener las preguntas en formato JSON
    path('forms/<int:form_id>/questions/json/', views.gform_questions_json, name='gform_questions_json'),
    # Añadir la nueva URL para la limpieza manual
    path('question-bank/clean/', views.gform_clean_question_bank, name='gform_clean_question_bank'),
    
    # Nuevas rutas para permisos y compartir formularios
    path('forms/<int:form_id>/share/', views.gform_share_form, name='gform_share_form'),
    path('forms/<int:form_id>/add-permission/', views.gform_add_permission, name='gform_add_permission'),
    path('forms/permission/<int:permission_id>/remove/', views.gform_remove_permission, name='gform_remove_permission'),
    path('forms/<int:form_id>/create-share-link/', views.gform_create_share_link, name='gform_create_share_link'),
    path('forms/share-link/<int:link_id>/delete/', views.gform_delete_share_link, name='gform_delete_share_link'),
    path('forms/shared/<uuid:token>/', views.gform_shared_link, name='gform_shared_link'),

    # Nuevas rutas para gestionar formularios compartidos
    path('forms/add-shared-link/', views.gform_add_shared_link, name='gform_add_shared_link'),
    path('forms/<int:form_id>/remove-shared/', views.gform_remove_shared, name='gform_remove_shared'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)