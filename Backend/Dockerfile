FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /code

RUN apt-get clean && rm -rf /var/lib/apt/lists/* \
    && apt-get update \
    && apt-get install -y --fix-missing \
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
RUN pip install Django djangorestframework
RUN pip install Django django-cors-headers
RUN pip install djangorestframework-simplejwt django-redis redis
# Copy project files
COPY . /code/