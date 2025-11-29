FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT=8000

# Set working directory to /app (what Railway expects)
WORKDIR /app

# Update apt and install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    libwebp-dev \
    tcl8.6-dev \
    tk8.6-dev \
    python3-tk \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install pipenv
RUN pip install --no-cache-dir pipenv

# Copy Pipfiles from Backend directory
COPY Backend/Pipfile Backend/Pipfile.lock /app/

# Install dependencies using pipenv
RUN pipenv install --system --deploy

# Install additional Python packages
RUN pip install --no-cache-dir \
    pillow \
    requests \
    djangorestframework \
    django-cors-headers \
    python-dotenv \
    django-cloudinary-storage \
    djangorestframework-simplejwt \
    django-redis \
    redis \
    gunicorn \
    whitenoise \
    psycopg2-binary \
    dj-database-url \
    pytest \
    pytest-django \
    coverage

# Install ML dependencies
ENV PIP_DEFAULT_TIMEOUT=120

RUN pip install --no-cache-dir \
    "numpy>=1.24.0,<2.0.0" \
    "torch==2.0.1" \
    "torchvision==0.15.2" \
    ultralytics>=8.0.0 \
    langchain>=0.1.0 \
    langchain-core>=0.1.0 \
    langchain-groq>=0.1.0

# Copy ALL project files from Backend directory
COPY Backend/ /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Use Gunicorn for production
CMD gunicorn CPCMS.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120