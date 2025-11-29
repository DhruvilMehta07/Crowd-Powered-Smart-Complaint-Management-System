"""
Django settings for CPCMS project.
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-j87721-qpo2z*xjtwl!!ee5e()no*3o)o8ui!0hh5gsh=k=2yw'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Get Railway URL for allowed hosts
RAILWAY_STATIC_URL = os.getenv('RAILWAY_STATIC_DOMAIN')
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app',
    '.up.railway.app',
]

# Add your specific Railway URL if available
if RAILWAY_STATIC_URL:
    ALLOWED_HOSTS.append(RAILWAY_STATIC_URL)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # installed apps
    'users',
    'complaints',
    'notifications',

    # api apps
    'rest_framework',
    'corsheaders',

    # simplejwt blacklist app
    'rest_framework_simplejwt.token_blacklist',
    'cloudinary_storage',
    'cloudinary',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'users.authentication.RedisCheckingJWTAuthentication',
    ],
}

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME', 'dqxm0hm4s'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY', '429768874145489'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET', 'GLmklkwKa0-7jmhILGcBEpvlfnM'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

SIMPLE_JWT = {
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_DOMAIN': None,
    'AUTH_COOKIE_SECURE': True,  # True for HTTPS (Railway)
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
}

# Redis configuration - use Railway Redis in production, local in development
if os.getenv('RAILWAY_ENVIRONMENT'):
    # Production - use Railway Redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://default:rYKKCnnSBoGrWWmYNOlZeGCMVtDVxHMs@yamanote.proxy.rlwy.net:55455'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        },
        'otps': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://default:rYKKCnnSBoGrWWmYNOlZeGCMVtDVxHMs@yamanote.proxy.rlwy.net:55455'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'cpcms:otps',
        },
    }
else:
    # Development - use local Redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': 'redis://redis:6379/1',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        },
        'otps': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': 'redis://redis:6379/1',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'cpcms:otps',
        },
    }

AUTH_USER_MODEL = 'users.ParentUser'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'CPCMS.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'CPCMS.wsgi.application'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'ekkatran@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD', 'pasg fbwj elnp odwe')
EMAIL_PORT = 587
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = 'ekkatran@gmail.com'

# Database configuration - Use dj_database_url for Railway
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', 'postgresql://postgres:vcszjEnoerXUCbTTSSIiatwWhhPbHVat@nozomi.proxy.rlwy.net:29169/railway'),
        conn_max_age=600,
        ssl_require=not DEBUG
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = 1209600
SESSION_COOKIE_DOMAIN = None
SESSION_COOKIE_SECURE = True  # True for HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF settings
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_SECURE = True  # True for HTTPS
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CORS_ALLOW_CREDENTIALS = True

# CORS and CSRF settings for production
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:7000')

CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    BACKEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:7000",
    "https://*.railway.app",
    "https://crowd-powered-smart-complaint-management-system-l766yeaz4.vercel.app",
    "https://*.vercel.app",
]

CSRF_TRUSTED_ORIGINS = [
    FRONTEND_URL,
    BACKEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:7000",
    "https://*.railway.app",
    "https://crowd-powered-smart-complaint-management-system-l766yeaz4.vercel.app",
    "https://*.vercel.app",
]

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken',
    'accept',
    'origin',
    'user-agent',
    'x-requested-with',
]

MAPMYINDIA_API_KEY = os.getenv('MAPMYINDIA_API_KEY', 'irnoviabclgykihrpoqyhutkaksuxqtpfkvi')

try:
    cloudinary.config(
        cloud_name=CLOUDINARY_STORAGE['CLOUD_NAME'],
        api_key=CLOUDINARY_STORAGE['API_KEY'],
        api_secret=CLOUDINARY_STORAGE['API_SECRET']
    )
    print("Cloudinary configured successfully")
except Exception as e:
    print(f"Cloudinary configuration error: {e}")