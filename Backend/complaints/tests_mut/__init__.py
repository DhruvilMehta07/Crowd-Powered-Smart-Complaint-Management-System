# Mutation testing focused tests for complaints app
# CRITICAL: Setup Django BEFORE any test modules are imported
import os
import sys
import django

# Set Django settings module
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CPCMS.settings_test')

# Setup Django if not already done
from django.conf import settings
if not settings.configured:
    django.setup()
elif not django.apps.apps.ready:
    try:
        django.setup()
    except RuntimeError:
        # Apps already loaded
        pass
