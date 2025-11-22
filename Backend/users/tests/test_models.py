"""
Comprehensive tests for user models, serializers and additional views
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from users.models import Citizen, Government_Authority, Field_Worker, Department, ParentUser
from users.serializers import (
    CitizenSerializer, GovernmentAuthoritySerializer, FieldWorkerSerializer,
    DepartmentSerializer, CitizenProfileSerializer, GeneralProfileSerializer
)


@pytest.mark.django_db
class TestUserModels:
    
    def test_citizen_creation_with_phone(self):
        """Test creating citizen with valid phone number"""
        citizen = Citizen.objects.create_user(
            username="testcitizen",
            email="citizen@test.com",
            password="password123",
            phone_number="9876543210"
        )
        assert citizen.pk is not None
        assert citizen.phone_number == "9876543210"
    
    def test_citizen_invalid_phone_number(self):
        """Test citizen with invalid phone number"""
        with pytest.raises(ValidationError):
            citizen = Citizen(
                username="testcitizen2",
                email="citizen2@test.com",
                phone_number="123"  # Too short
            )
            citizen.full_clean()
    
    def test_citizen_phone_starts_with_invalid_digit(self):
        """Test phone number must start with 6-9"""
        with pytest.raises(ValidationError):
            citizen = Citizen(
                username="testcitizen3",
                email="citizen3@test.com",
                phone_number="5876543210"  # Starts with 5
            )
            citizen.full_clean()
    
    def test_department_case_insensitive_uniqueness(self):
        """Test department name uniqueness is case-insensitive"""
        Department.objects.create(name="Roads")
        
        with pytest.raises(IntegrityError):
            Department.objects.create(name="ROADS")  # Should fail
    
    def test_department_str_representation(self):
        """Test department string representation capitalizes name"""
        dept = Department.objects.create(name="water supply")
        assert str(dept) == "Water supply"
    
    def test_department_saves_lowercase(self):
        """Test department saves name in lowercase"""
        dept = Department.objects.create(name="WasteManagement")
        dept.refresh_from_db()
        assert dept.name == "wastemanagement"
    
    def test_government_authority_creation(self):
        """Test creating government authority user"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="gov1",
            email="gov@test.com",
            password="password",
            phone_number="8765432109",
            assigned_department=dept,
            verified=False
        )
        assert gov.pk is not None
        assert gov.verified is False
        assert gov.assigned_department == dept
    
    def test_field_worker_creation(self):
        """Test creating field worker user"""
        dept = Department.objects.create(name="sanitation")
        fw = Field_Worker.objects.create_user(
            username="fw1",
            email="fw@test.com",
            password="password",
            phone_number="7654321098",
            assigned_department=dept,
            verified=True
        )
        assert fw.pk is not None
        assert fw.verified is True
        assert fw.assigned_department == dept
    
    def test_parent_user_str_representation(self):
        """Test ParentUser string returns email"""
        user = Citizen.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="pass"
        )
        assert str(user) == "test@example.com"
    
    def test_unique_phone_numbers(self):
        """Test phone numbers must be unique across users"""
        Citizen.objects.create_user(
            username="user1",
            email="user1@test.com",
            password="pass",
            phone_number="9123456789"
        )
        
        with pytest.raises(IntegrityError):
            Citizen.objects.create_user(
                username="user2",
                email="user2@test.com",
                password="pass",
                phone_number="9123456789"  # Duplicate
            )
    
    def test_government_authority_without_department(self):
        """Test creating gov authority without department"""
        gov = Government_Authority.objects.create_user(
            username="gov2",
            email="gov2@test.com",
            password="password",
            phone_number="8123456789"
        )
        assert gov.assigned_department is None
    
    def test_field_worker_without_department(self):
        """Test creating field worker without department"""
        fw = Field_Worker.objects.create_user(
            username="fw2",
            email="fw2@test.com",
            password="password",
            phone_number="7123456789"
        )
        assert fw.assigned_department is None


@pytest.mark.django_db
class TestUserSerializers:
    
    def test_citizen_serializer_password_encryption(self):
        """Test CitizenSerializer encrypts password"""
        data = {
            'username': 'testcitizen',
            'email': 'citizen@test.com',
            'password': 'password123',
            'phone_number': '9876543210'
        }
        serializer = CitizenSerializer(data=data)
        assert serializer.is_valid()
        
        citizen = serializer.save()
        assert citizen.password != 'password123'  # Should be hashed
        assert citizen.check_password('password123')  # But should verify
    
    def test_citizen_serializer_password_too_short(self):
        """Test password validation - minimum 6 characters"""
        data = {
            'username': 'testcitizen',
            'email': 'citizen@test.com',
            'password': '12345',  # Too short
            'phone_number': '9876543210'
        }
        serializer = CitizenSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
    
    def test_government_authority_serializer_with_department(self):
        """Test GovernmentAuthoritySerializer with department"""
        dept = Department.objects.create(name="roads")
        data = {
            'username': 'govauth',
            'email': 'gov@test.com',
            'password': 'password123',
            'phone_number': '8765432109',
            'assigned_department_id': dept.id
        }
        serializer = GovernmentAuthoritySerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        gov = serializer.save()
        assert gov.assigned_department == dept
    
    def test_field_worker_serializer_with_department(self):
        """Test FieldWorkerSerializer with department"""
        dept = Department.objects.create(name="water")
        data = {
            'username': 'fieldworker',
            'email': 'fw@test.com',
            'password': 'password123',
            'phone_number': '7654321098',
            'assigned_department_id': dept.id
        }
        serializer = FieldWorkerSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        fw = serializer.save()
        assert fw.assigned_department == dept
    
    def test_department_serializer(self):
        """Test DepartmentSerializer"""
        dept = Department.objects.create(name="electricity")
        serializer = DepartmentSerializer(dept)
        assert serializer.data['name'] == 'electricity'
        assert 'id' in serializer.data
    
    def test_citizen_profile_serializer(self):
        """Test CitizenProfileSerializer read-only fields"""
        citizen = Citizen.objects.create_user(
            username="profiletest",
            email="profile@test.com",
            password="pass",
            phone_number="9123456789",
            first_name="John",
            last_name="Doe"
        )
        serializer = CitizenProfileSerializer(citizen)
        data = serializer.data
        
        assert data['username'] == "profiletest"
        assert data['email'] == "profile@test.com"
        assert data['first_name'] == "John"
        assert data['last_name'] == "Doe"
        assert data['phone_number'] == "9123456789"
    
    def test_general_profile_serializer_citizen(self):
        """Test GeneralProfileSerializer for citizen"""
        citizen = Citizen.objects.create_user(
            username="genprofile",
            email="gen@test.com",
            password="pass",
            phone_number="8123456789"
        )
        serializer = GeneralProfileSerializer(citizen)
        data = serializer.data
        
        assert data['username'] == "genprofile"
        assert data['assigned_department'] is None
        assert data['verified'] is None  # Citizens don't have verified field
    
    def test_general_profile_serializer_gov_authority(self):
        """Test GeneralProfileSerializer for government authority"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="govprofile",
            email="govp@test.com",
            password="pass",
            phone_number="7123456789",
            assigned_department=dept,
            verified=True
        )
        serializer = GeneralProfileSerializer(gov)
        data = serializer.data
        
        assert data['username'] == "govprofile"
        assert data['assigned_department'] is not None
        assert data['assigned_department']['name'] == "health"
        assert data['verified'] is True
    
    def test_general_profile_serializer_field_worker(self):
        """Test GeneralProfileSerializer for field worker"""
        dept = Department.objects.create(name="waste")
        fw = Field_Worker.objects.create_user(
            username="fwprofile",
            email="fwp@test.com",
            password="pass",
            phone_number="6123456789",
            assigned_department=dept,
            verified=False
        )
        serializer = GeneralProfileSerializer(fw)
        data = serializer.data
        
        assert data['username'] == "fwprofile"
        assert data['assigned_department'] is not None
        assert data['verified'] is False


@pytest.mark.django_db
class TestDepartmentModel:
    
    def test_department_whitespace_trimming(self):
        """Test department trims whitespace from name"""
        dept = Department.objects.create(name="  roads  ")
        dept.refresh_from_db()
        assert dept.name == "roads"
    
    def test_department_empty_name(self):
        """Test department with empty name"""
        dept = Department.objects.create(name="")
        assert str(dept) == ""
    
    def test_multiple_departments(self):
        """Test creating multiple departments"""
        d1 = Department.objects.create(name="roads")
        d2 = Department.objects.create(name="water")
        d3 = Department.objects.create(name="electricity")
        
        assert Department.objects.count() == 3
        assert d1.name != d2.name != d3.name


@pytest.mark.django_db
class TestPhoneNumberValidation:
    
    def test_valid_phone_numbers(self):
        """Test various valid phone numbers"""
        valid_numbers = ["6123456789", "7987654321", "8765432109", "9012345678"]
        
        for i, number in enumerate(valid_numbers):
            citizen = Citizen.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@test.com",
                password="pass",
                phone_number=number
            )
            citizen.full_clean()  # Should not raise
            assert citizen.phone_number == number
    
    def test_invalid_phone_numbers(self):
        """Test various invalid phone numbers"""
        invalid_numbers = [
            "123",  # Too short
            "12345678901",  # Too long
            "0123456789",  # Starts with 0
            "5123456789",  # Starts with 5
            "abc1234567",  # Contains letters
            "+919876543210",  # Has country code
        ]
        
        for i, number in enumerate(invalid_numbers):
            with pytest.raises(ValidationError):
                citizen = Citizen(
                    username=f"invalid{i}",
                    email=f"invalid{i}@test.com",
                    phone_number=number
                )
                citizen.full_clean()
