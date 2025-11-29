"""
Tests for serializers with assigned_department on ParentUser
"""
import pytest
from users.models import Citizen, Government_Authority, Field_Worker, Department, ParentUser
from users.serializers import (
    CitizenSerializer, GovernmentAuthoritySerializer, FieldWorkerSerializer,
    GeneralProfileSerializer, DepartmentSerializer
)


@pytest.mark.django_db
class TestGeneralProfileSerializerWithDepartment:
    """Test GeneralProfileSerializer with department field"""
    
    def test_serializer_includes_department_for_authority(self):
        """Test serializer includes department for authority"""
        dept = Department.objects.create(name="roads")
        gov = Government_Authority.objects.create_user(
            username="gov_serial",
            email="gov_serial@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        serializer = GeneralProfileSerializer(gov)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department'] is not None
        assert data['assigned_department']['name'] == 'roads'
        assert data['user_type'] == 'authority'
        assert data['verified'] is True
    
    def test_serializer_includes_department_for_fieldworker(self):
        """Test serializer includes department for field worker"""
        dept = Department.objects.create(name="water")
        fw = Field_Worker.objects.create_user(
            username="fw_serial",
            email="fw_serial@test.com",
            password="password123",
            assigned_department=dept,
            verified=False
        )
        
        serializer = GeneralProfileSerializer(fw)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department'] is not None
        assert data['assigned_department']['name'] == 'water'
        assert data['user_type'] == 'fieldworker'
        assert data['verified'] is False
    
    def test_serializer_none_department_for_citizen(self):
        """Test serializer returns None for citizen department"""
        citizen = Citizen.objects.create_user(
            username="citizen_serial",
            email="citizen_serial@test.com",
            password="password123"
        )
        
        serializer = GeneralProfileSerializer(citizen)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department'] is None
        assert data['user_type'] == 'citizen'
    
    def test_serializer_handles_missing_department(self):
        """Test serializer handles authority with no department"""
        gov = Government_Authority.objects.create_user(
            username="gov_no_dept",
            email="gov_no_dept@test.com",
            password="password123",
            verified=True
        )
        
        serializer = GeneralProfileSerializer(gov)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department'] is None
    
    def test_serializer_user_type_method(self):
        """Test get_user_type method returns correct type"""
        citizen = Citizen.objects.create_user(
            username="citizen_type",
            email="citizen_type@test.com",
            password="password123"
        )
        
        serializer = GeneralProfileSerializer(citizen)
        assert serializer.get_user_type(citizen) == 'citizen'
    
    def test_serializer_assigned_department_method(self):
        """Test get_assigned_department method"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="gov_dept_method",
            email="gov_dept_method@test.com",
            password="password123",
            assigned_department=dept
        )
        
        serializer = GeneralProfileSerializer(gov)
        dept_data = serializer.get_assigned_department(gov)
        
        assert dept_data is not None
        assert dept_data['name'] == 'health'
    
    def test_serializer_verified_method(self):
        """Test get_verified method"""
        gov = Government_Authority.objects.create_user(
            username="gov_verified",
            email="gov_verified@test.com",
            password="password123",
            verified=True
        )
        
        serializer = GeneralProfileSerializer(gov)
        assert serializer.get_verified(gov) is True
    
    def test_serializer_phone_number_field(self):
        """Test phone_number field exposes value"""
        citizen = Citizen.objects.create_user(
            username="citizen_phone",
            email="citizen_phone@test.com",
            password="password123",
            phone_number="9876543210"
        )
        
        serializer = GeneralProfileSerializer(citizen)
        assert serializer.data['phone_number'] == "9876543210"


@pytest.mark.django_db
class TestGovernmentAuthoritySerializer:
    """Test GovernmentAuthoritySerializer"""
    
    def test_create_sets_user_type_authority(self):
        """Test serializer sets user_type to 'authority'"""
        dept = Department.objects.create(name="police")
        
        data = {
            'username': 'gov_create',
            'email': 'gov_create@test.com',
            'password': 'password123',
            'phone_number': '9123456789',
            'assigned_department_id': dept.id
        }
        
        serializer = GovernmentAuthoritySerializer(data=data)
        assert serializer.is_valid()
        
        gov = serializer.save()
        assert gov.user_type == 'authority'
        assert gov.assigned_department == dept
    
    def test_serializer_read_department(self):
        """Test serializer reads department correctly"""
        dept = Department.objects.create(name="fire")
        gov = Government_Authority.objects.create_user(
            username="gov_read",
            email="gov_read@test.com",
            password="password123",
            assigned_department=dept
        )
        
        serializer = GovernmentAuthoritySerializer(gov)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department']['name'] == 'fire'


@pytest.mark.django_db
class TestFieldWorkerSerializer:
    """Test FieldWorkerSerializer"""
    
    def test_create_sets_user_type_fieldworker(self):
        """Test serializer sets user_type to 'fieldworker'"""
        dept = Department.objects.create(name="sanitation")
        
        data = {
            'username': 'fw_create',
            'email': 'fw_create@test.com',
            'password': 'password123',
            'phone_number': '8123456789',
            'assigned_department_id': dept.id
        }
        
        serializer = FieldWorkerSerializer(data=data)
        assert serializer.is_valid()
        
        fw = serializer.save()
        assert fw.user_type == 'fieldworker'
        assert fw.assigned_department == dept
    
    def test_serializer_read_department(self):
        """Test serializer reads department correctly"""
        dept = Department.objects.create(name="electricity")
        fw = Field_Worker.objects.create_user(
            username="fw_read",
            email="fw_read@test.com",
            password="password123",
            assigned_department=dept
        )
        
        serializer = FieldWorkerSerializer(fw)
        data = serializer.data
        
        assert 'assigned_department' in data
        assert data['assigned_department']['name'] == 'electricity'


@pytest.mark.django_db
class TestCitizenSerializer:
    """Test CitizenSerializer"""
    
    def test_create_sets_user_type_citizen(self):
        """Test serializer sets user_type to 'citizen'"""
        data = {
            'username': 'citizen_create',
            'email': 'citizen_create@test.com',
            'password': 'password123',
            'phone_number': '7123456789'
        }
        
        serializer = CitizenSerializer(data=data)
        assert serializer.is_valid()
        
        citizen = serializer.save()
        assert citizen.user_type == 'citizen'
        assert citizen.assigned_department is None
    
    def test_citizen_without_phone(self):
        """Test citizen can be created without phone"""
        data = {
            'username': 'citizen_no_phone',
            'email': 'citizen_no_phone@test.com',
            'password': 'password123'
        }
        
        serializer = CitizenSerializer(data=data)
        assert serializer.is_valid()
        
        citizen = serializer.save()
        assert citizen.phone_number is None or citizen.phone_number == ''


@pytest.mark.django_db
class TestDepartmentSerializer:
    """Test DepartmentSerializer"""
    
    def test_serializer_returns_id_and_name(self):
        """Test serializer includes id and name"""
        dept = Department.objects.create(name="transport")
        
        serializer = DepartmentSerializer(dept)
        data = serializer.data
        
        assert 'id' in data
        assert 'name' in data
        assert data['name'] == 'transport'
    
    def test_serializer_create_department(self):
        """Test can create department via serializer"""
        data = {'name': 'Education'}
        
        serializer = DepartmentSerializer(data=data)
        assert serializer.is_valid()
        
        dept = serializer.save()
        assert dept.name == 'education'  # Should be lowercase
