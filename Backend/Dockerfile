FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /code

# Update apt and install system dependencies (including OpenGL for OpenCV/YOLO)
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

# Copy Pipfiles first for better caching
COPY Pipfile Pipfile.lock /code/

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
    pytest \
    pytest-django \
    coverage

# Install ML dependencies (torch/torchvision already in base image)
# increase pip timeout
ENV PIP_DEFAULT_TIMEOUT=120

# Install CPU-only PyTorch (pinned) using the official cpu wheel index, then install other ML deps
RUN pip install --no-cache-dir \
    "numpy>=1.24.0,<2.0.0" \
    "torch==2.0.1+cpu" "torchvision==0.15.2+cpu" \
    -f https://download.pytorch.org/whl/cpu/torch_stable.html \
  || (sleep 5 && pip install --no-cache-dir \
    "numpy>=1.24.0,<2.0.0" \
    "torch==2.0.1+cpu" "torchvision==0.15.2+cpu" \
    -f https://download.pytorch.org/whl/cpu/torch_stable.html) && \
  pip install --no-cache-dir ultralytics>=8.0.0 langchain>=0.1.0 langchain-core>=0.1.0 langchain-groq>=0.1.0 numpy==1.26.4

# Copy project files
COPY . /code/

# additional test dependencies
RUN pip install --no-cache-dir pytest pytest-django pytest-cov
RUN pip install mutpy

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
