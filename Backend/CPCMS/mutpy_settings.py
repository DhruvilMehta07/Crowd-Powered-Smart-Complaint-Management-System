from .settings import *

# using sqlite database for mutation testing for speed
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / "mutpy.sqlite3",
    }
}

# Required for Django to start correctly during MutPy subprocesses
SECRET_KEY = SECRET_KEY 

# Disable migrations for massive speed + avoid PG issues
MIGRATION_MODULES = {
    app.split('.')[-1]: None
    for app in INSTALLED_APPS
}

# Email backend for speed
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Avoid Cloudinary/HW services
CLOUDINARY_STORAGE = {}
CLOUDINARY_URL = ""
