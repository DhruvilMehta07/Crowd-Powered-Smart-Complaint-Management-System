"""
Shared fixtures for mutation testing
"""
import os
import sys

# Set Django settings module if not already set
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CPCMS.settings_test')

# Setup Django before importing models
import django
django.setup()

import pytest
from django.test import Client
from rest_framework.test import APIClient
from users.models import Citizen, Government_Authority, Field_Worker, Department
from complaints.models import Complaint


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department():
    return Department.objects.create(name="Roads")


@pytest.fixture
def citizen_user():
    return Citizen.objects.create_user(
        username="citizen1",
        email="citizen1@test.com",
        password="testpass123",
        phone_number="9876543210"
    )


@pytest.fixture
def other_citizen_user():
    return Citizen.objects.create_user(
        username="citizen2",
        email="citizen2@test.com",
        password="testpass123",
        phone_number="9876543211"
    )


@pytest.fixture
def field_worker_user(department):
    return Field_Worker.objects.create_user(
        username="fieldworker1",
        email="fw1@test.com",
        password="testpass123",
        phone_number="9876543212",
        assigned_department=department,
        verified=True
    )


@pytest.fixture
def gov_user(department):
    return Government_Authority.objects.create_user(
        username="govauth1",
        email="gov1@test.com",
        password="testpass123",
        phone_number="9876543213",
        assigned_department=department,
        verified=True
    )


@pytest.fixture
def test_complaint(citizen_user, department):
    return Complaint.objects.create(
        content="Test complaint content",
        posted_by=citizen_user,
        address="123 Test Street, 560001",
        assigned_to_dept=department,
        status='Pending'
    )


def create_test_image(filename="test.jpg", size=(100, 100), color='red', format='JPEG'):
    """Helper function to create valid test images"""
    from PIL import Image
    from django.core.files.uploadedfile import SimpleUploadedFile
    import io
    
    img_io = io.BytesIO()
    img = Image.new('RGB', size, color=color)
    img.save(img_io, format=format)
    img_io.seek(0)
    
    content_type = f'image/{format.lower()}'
    return SimpleUploadedFile(filename, img_io.read(), content_type=content_type)
