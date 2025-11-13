import pytest
from django.contrib.auth.hashers import check_password
from users.serializers import CitizenSerializer, GovernmentAuthoritySerializer, FieldWorkerSerializer, DepartmentSerializer
from users.models import Department, Citizen, Government_Authority, Field_Worker

@pytest.fixture
def department():
    dept = Department.objects.create(name="Test Department")
    return dept

@ pytest.mark.django_db
def test_department_serializer():
    dept = Department.objects.create(name="Water")
    ser = DepartmentSerializer(dept)
    assert ser.data['name'] == 'water'
    assert 'id' in ser.data

@ pytest.mark.django_db
def test_citizen_serializer_create_and_validate_password():
    data = {
        'username': 'alice',
        'email': 'alice@example.com',
        'password': 'strongpass',
        'phone_number': '9876543210'
    }
    ser = CitizenSerializer(data=data)
    assert ser.is_valid(), ser.errors
    user = ser.save()
    # password should be hashed
    assert user.check_password('strongpass')
    assert user.email == 'alice@example.com'

@ pytest.mark.django_db
def test_citizen_password_too_short():
    data = {'username': 'bob', 'email': 'bob@example.com', 'password': '123', 'phone_number': '9876543211'}
    ser = CitizenSerializer(data=data)
    assert not ser.is_valid()
    assert 'password' in ser.errors

@ pytest.mark.django_db
def test_government_and_fieldworker_serializers_create(department):
    # department fixture provided by conftest in users tests module path (or create here)
    dept = Department.objects.first() or Department.objects.create(name='health')
    ga_data = {
        'username': 'gov1',
        'email': 'gov1@example.com',
        'password': 'govpass',
        'assigned_department_id': dept.id,
        'phone_number': '9876543212'
    }
    ser_ga = GovernmentAuthoritySerializer(data=ga_data)
    assert ser_ga.is_valid(), ser_ga.errors
    ga = ser_ga.save()
    assert ga.assigned_department == dept
    assert ga.check_password('govpass')

    fw_data = {
        'username': 'fw1',
        'email': 'fw1@example.com',
        'password': 'fwpass',
        'assigned_department_id': dept.id,
        'phone_number': '9876543213'
    }
    ser_fw = FieldWorkerSerializer(data=fw_data)
    assert ser_fw.is_valid(), ser_fw.errors
    fw = ser_fw.save()
    assert fw.assigned_department == dept
    assert fw.check_password('fwpass')
