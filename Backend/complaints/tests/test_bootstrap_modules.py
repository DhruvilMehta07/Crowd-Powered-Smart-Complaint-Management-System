"""Tests that exercise bootstrap modules to drive coverage to 100%."""
import importlib
import sys

import pytest
from django.test import override_settings


def _reload(module_path: str):
    """Helper that reloads a module to pick up patched settings."""
    module = importlib.import_module(module_path)
    return importlib.reload(module)


def test_manage_main_invokes_execute(monkeypatch):
    """Calling manage.main should invoke Django's execute_from_command_line."""
    captured = {}

    def fake_execute(argv):
        captured['argv'] = tuple(argv)

    monkeypatch.setenv('DJANGO_SETTINGS_MODULE', 'CPCMS.settings_test')
    monkeypatch.setattr('django.core.management.execute_from_command_line', fake_execute)
    monkeypatch.setattr(sys, 'argv', ['manage.py', 'check'])

    manage_module = _reload('manage')
    manage_module.main()

    assert captured['argv'] == ('manage.py', 'check')


def test_asgi_application_import(monkeypatch):
    """Importing CPCMS.asgi should expose an application callable."""
    monkeypatch.setenv('DJANGO_SETTINGS_MODULE', 'CPCMS.settings_test')
    module = _reload('CPCMS.asgi')
    assert hasattr(module, 'application')


def test_wsgi_application_import(monkeypatch):
    """Importing CPCMS.wsgi should expose an application callable."""
    monkeypatch.setenv('DJANGO_SETTINGS_MODULE', 'CPCMS.settings_test')
    module = _reload('CPCMS.wsgi')
    assert hasattr(module, 'application')


def test_mutpy_settings_overrides_sqlite(tmp_path, monkeypatch):
    """MutPy settings should swap database engine and disable migrations."""
    monkeypatch.setenv('DJANGO_SETTINGS_MODULE', 'CPCMS.settings')
    module = _reload('CPCMS.mutpy_settings')
    assert module.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3'
    assert str(module.DATABASES['default']['NAME']).endswith('mutpy.sqlite3')
    assert module.MIGRATION_MODULES  # should not be empty
    assert all(value is None for value in module.MIGRATION_MODULES.values())


@override_settings(DEBUG=True, MEDIA_URL='/media/', MEDIA_ROOT='/tmp/media')
def test_urls_append_static_when_debug(settings):
    """Reloading CPCMS.urls with DEBUG=True should append static media patterns."""
    module = _reload('CPCMS.urls')
    media_routes = [
        getattr(pattern, 'pattern', None)
        for pattern in module.urlpatterns
        if hasattr(pattern, 'pattern') and 'media' in str(pattern.pattern)
    ]
    assert media_routes, 'Expected media URL pattern when DEBUG=True'
