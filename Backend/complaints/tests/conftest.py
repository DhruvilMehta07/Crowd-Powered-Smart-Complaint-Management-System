import pytest
from users.models import Citizen, Government_Authority, Field_Worker, Department
from complaints.models import Complaint, Resolution
from rest_framework.test import APIClient


@pytest.fixture
def client():
    """DRF APIClient for view tests."""
    return APIClient()


@pytest.fixture
def department():
    return Department.objects.create(name="Public Works")


@pytest.fixture
def citizen_user():
    return Citizen.objects.create_user(username="citizen", password="pw")


@pytest.fixture
def other_citizen_user():
    return Citizen.objects.create_user(username="other", password="pw")


@pytest.fixture
def gov_user(department):
    return Government_Authority.objects.create_user(
        username="gov",
        password="pw",
        assigned_department=department
    )


@pytest.fixture
def field_worker_user(department):
    return Field_Worker.objects.create_user(
        username="fw",
        password="pw",
        assigned_department=department,
        verified=True
    )


@pytest.fixture
def test_complaint(citizen_user, department):
    return Complaint.objects.create(
        posted_by=citizen_user,
        content="Test complaint content",
        address="123 Main St, Mumbai, 400001",
        assigned_to_dept=department
    )


@pytest.fixture
def test_resolution(test_complaint, field_worker_user):
    return Resolution.objects.create(
        complaint=test_complaint,
        field_worker=field_worker_user,
        description="Fixed it."
    )
