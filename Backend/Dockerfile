FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /code

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
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install pipenv
RUN pip install pipenv

# Copy Pipfiles first for better caching
COPY Pipfile Pipfile.lock /code/

# Install dependencies using pipenv
RUN pipenv install --system --deploy

# Install additional Python packages
RUN pip install \
    pillow \
    requests \
    djangorestframework \
    django-cors-headers \
    python-dotenv \
    django-cloudinary-storage \
    djangorestframework-simplejwt \
    django-redis \
    redis \
    pytest \
    pytest-django \
    coverage

# Copy project files
COPY . /code/

# Optional: Add any additional commands you need
# For example, if you need to run collectstatic or migrations:
# RUN python manage.py collectstatic --noinput