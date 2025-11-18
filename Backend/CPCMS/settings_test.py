"""
Lightweight test settings that import the project's default settings then override
DATABASES to force tests to use a local sqlite database. Keep external service
settings minimal to avoid network calls during tests.
"""
from .settings import *

import os

TEST_DB_PATH = os.path.join(BASE_DIR, 'test_db.sqlite3')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': TEST_DB_PATH,
    }
}
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
#cloudinary alternative
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
MEDIA_ROOT = os.path.join(BASE_DIR, 'test_media')


STATIC_URL = '/templates/'
#local memory cache for tests
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    },
    'otps': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'otp-cache',
    }
    
}
