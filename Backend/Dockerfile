FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

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
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install runtime dependencies
ENV PIP_DEFAULT_TIMEOUT=120

COPY Backend/requirements-production.txt /tmp/requirements.txt

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# Install PyTorch CPU wheels when available, fall back for local ARM builds
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        "torch==2.0.1+cpu" \
        "torchvision==0.15.2+cpu" \
    || pip install --no-cache-dir \
        "torch==2.0.1" \
        "torchvision==0.15.2"

# Install higher-level ML helpers
RUN pip install --no-cache-dir \
        ultralytics>=8.0.0 \
        langchain>=0.1.0 \
        langchain-core>=0.1.0 \
        langchain-groq>=0.1.0

# Copy backend project files
CMD python manage.py collectstatic --noinput && python manage.py migrate

# Collect static files
CMD python man gunicorn CPCMS.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
