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


@ pytest.mark.django_db
def test_citizen_profile_serializer():
    """Test CitizenProfileSerializer"""
    from users.serializers import CitizenProfileSerializer
    
    citizen = Citizen.objects.create_user(
        username='profile_test',
        email='profile@test.com',
        password='testpass',
        phone_number='1234567890'
    )
    
    serializer = CitizenProfileSerializer(citizen)
    data = serializer.data
    
    assert data['username'] == 'profile_test'
    assert data['email'] == 'profile@test.com'
    assert data['phone_number'] == '1234567890'
    assert 'id' in data
    assert 'date_joined' in data


@ pytest.mark.django_db
def test_general_profile_serializer_citizen():
    """Test GeneralProfileSerializer with Citizen"""
    from users.serializers import GeneralProfileSerializer
    
    citizen = Citizen.objects.create_user(
        username='general_citizen',
        email='citizen@test.com',
        password='testpass',
        phone_number='9999999999'
    )
    
    serializer = GeneralProfileSerializer(citizen)
    data = serializer.data
    
    assert data['username'] == 'general_citizen'
    assert data['email'] == 'citizen@test.com'
    assert data['phone_number'] == '9999999999'
    assert data['assigned_department'] is None
    assert data['verified'] is None


@ pytest.mark.django_db
def test_general_profile_serializer_government_authority():
    """Test GeneralProfileSerializer with Government Authority"""
    from users.serializers import GeneralProfileSerializer
    
    dept = Department.objects.create(name='Test Dept')
    ga = Government_Authority.objects.create_user(
        username='general_ga',
        email='ga@test.com',
        password='testpass',
        phone_number='8888888888',
        assigned_department=dept,
        verified=True
    )
    
    serializer = GeneralProfileSerializer(ga)
    data = serializer.data
    
    assert data['username'] == 'general_ga'
    assert data['assigned_department'] is not None
    assert data['assigned_department']['name'] == 'test dept'
    assert data['verified'] is True


@ pytest.mark.django_db
def test_general_profile_serializer_field_worker():
    """Test GeneralProfileSerializer with Field Worker"""
    from users.serializers import GeneralProfileSerializer
    
    dept = Department.objects.create(name='Worker Dept')
    fw = Field_Worker.objects.create_user(
        username='general_fw',
        email='fw@test.com',
        password='testpass',
        phone_number='7777777777',
        assigned_department=dept,
        verified=False
    )
    
    serializer = GeneralProfileSerializer(fw)
    data = serializer.data
    
    assert data['username'] == 'general_fw'
    assert data['assigned_department'] is not None
    assert data['verified'] is False


@ pytest.mark.django_db
def test_user_login_serializer():
    """Test UserLoginSerializer"""
    from users.serializers import UserLoginSerializer
    
    data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    serializer = UserLoginSerializer(data=data)
    assert serializer.is_valid()
    assert serializer.validated_data['username'] == 'testuser'
    assert serializer.validated_data['password'] == 'testpass123'


@ pytest.mark.django_db
def test_user_login_serializer_invalid():
    """Test UserLoginSerializer with missing fields"""
    from users.serializers import UserLoginSerializer
    
    # Missing password
    serializer = UserLoginSerializer(data={'username': 'test'})
    assert not serializer.is_valid()
    assert 'password' in serializer.errors
    
    # Missing username
    serializer2 = UserLoginSerializer(data={'password': 'pass'})
    assert not serializer2.is_valid()
    assert 'username' in serializer2.errors


@ pytest.mark.django_db
def test_government_authority_serializer_read():
    """Test GovernmentAuthoritySerializer read with department"""
    dept = Department.objects.create(name='Read Dept')
    ga = Government_Authority.objects.create_user(
        username='read_ga',
        email='read@test.com',
        password='testpass',
        phone_number='6666666666',
        assigned_department=dept
    )
    
    serializer = GovernmentAuthoritySerializer(ga)
    data = serializer.data
    
    assert data['username'] == 'read_ga'
    assert data['assigned_department'] is not None
    assert data['assigned_department']['name'] == 'read dept'


@ pytest.mark.django_db
def test_field_worker_serializer_read():
    """Test FieldWorkerSerializer read with department"""
    dept = Department.objects.create(name='FW Dept')
    fw = Field_Worker.objects.create_user(
        username='read_fw',
        email='readfw@test.com',
        password='testpass',
        phone_number='5555555555',
        assigned_department=dept
    )
    
    serializer = FieldWorkerSerializer(fw)
    data = serializer.data
    
    assert data['username'] == 'read_fw'
    assert data['assigned_department'] is not None
    assert data['assigned_department']['name'] == 'fw dept'
