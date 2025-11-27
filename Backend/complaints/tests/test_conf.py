import pytest
from django.test import Client
from users.models import Citizen, Government_Authority, Field_Worker, Department
from complaints.models import Complaint, Resolution
from rest_framework.test import APIClient

@pytest.fixture
def client():
    """A client for making test requests."""
    return APIClient()

@pytest.fixture
def department():
    """A test department."""
    return Department.objects.create(name="Public Works")

@pytest.fixture
def citizen_user():
    """A standard citizen user."""
    return Citizen.objects.create_user(username="citizen", password="pw")

@pytest.fixture
def other_citizen_user():
    """Another citizen for permission testing."""
    return Citizen.objects.create_user(username="other", password="pw")

@pytest.fixture
def gov_user(department):
    """A government authority user."""
    return Government_Authority.objects.create_user(
        username="gov", 
        password="pw", 
        assigned_department=department
    )

@pytest.fixture
def field_worker_user(department):
    """A verified field worker user."""
    return Field_Worker.objects.create_user(
        username="fw", 
        password="pw", 
        assigned_department=department, 
        verified=True
    )

@pytest.fixture
def test_complaint(citizen_user, department):
    """A simple complaint for testing."""
    return Complaint.objects.create(
        posted_by=citizen_user, 
        content="Test complaint content",
        address="123 Main St, Mumbai, 400001",
        assigned_to_dept=department
    )

@pytest.fixture
def test_resolution(test_complaint, field_worker_user):
    """A resolution for a complaint."""
    return Resolution.objects.create(
        complaint=test_complaint,
        field_worker=field_worker_user,
        description="Fixed it."
    )