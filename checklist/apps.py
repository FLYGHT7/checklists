from django.apps import AppConfig


class ChecklistConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'checklist'

    def ready(self):
        _patch_django_context_copy()


def _patch_django_context_copy():
    """
    Patch for Python 3.14 + Django 5.1 incompatibility.
    In Python 3.14, copy(super()) returns the super proxy instead of the
    actual instance, breaking BaseContext.__copy__ (template/context.py:41).
    Replace it with an equivalent that uses object.__new__ directly.
    """
    import sys
    if sys.version_info < (3, 14):
        return  # only needed on 3.14+

    from django.template.context import BaseContext

    def _fixed_copy(self):
        duplicate = self.__class__.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    BaseContext.__copy__ = _fixed_copy
