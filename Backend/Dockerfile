FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /code

RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    libwebp-dev \
    tcl8.6-dev tk8.6-dev python3-tk

# Install pipenv and dependencies
COPY Pipfile Pipfile.lock /code/
RUN pip install pipenv && pipenv install --system && pip install pillow

# Copy project files
COPY . /code/