# Use slim Python to keep image small
FROM python:3.12-slim

# 1. Force logs to appear immediately (Crucial for debugging timeouts)
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY Backend/requirements.txt .

# Install CPU-only PyTorch first
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY Backend /app

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8080

CMD python manage.py makemigrations &&python manage.py migrate && gunicorn CPCMS.wsgi:application --bind 0.0.0.0:${PORT:-8080} --timeout 120