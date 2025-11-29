"""
Tests for ParentUser assigned_department field and model updates
"""
import pytest
from django.db import IntegrityError
from users.models import Citizen, Government_Authority, Field_Worker, Department, ParentUser


@pytest.mark.django_db
class TestParentUserDepartment:
    """Test assigned_department field on ParentUser"""
    
    def test_parent_user_department_default_none(self):
        """Test ParentUser assigned_department defaults to None"""
        citizen = Citizen.objects.create_user(
            username="citizen1",
            email="citizen1@test.com",
            password="password123"
        )
        assert citizen.assigned_department is None
    
    def test_parent_user_department_can_be_set(self):
        """Test ParentUser can have assigned_department set"""
        dept = Department.objects.create(name="roads")
        citizen = Citizen.objects.create_user(
            username="citizen2",
            email="citizen2@test.com",
            password="password123",
            assigned_department=dept
        )
        assert citizen.assigned_department == dept
    
    def test_government_authority_inherits_department(self):
        """Test Government_Authority uses ParentUser's assigned_department"""
        dept = Department.objects.create(name="water")
        gov = Government_Authority.objects.create_user(
            username="gov1",
            email="gov1@test.com",
            password="password123",
            phone_number="9876543210",
            assigned_department=dept,
            verified=True
        )
        assert gov.assigned_department == dept
        assert gov.verified is True
    
    def test_field_worker_inherits_department(self):
        """Test Field_Worker uses ParentUser's assigned_department"""
        dept = Department.objects.create(name="sanitation")
        fw = Field_Worker.objects.create_user(
            username="fw1",
            email="fw1@test.com",
            password="password123",
            phone_number="8765432109",
            assigned_department=dept,
            verified=False
        )
        assert fw.assigned_department == dept
        assert fw.verified is False
    
    def test_citizen_without_department(self):
        """Test Citizen can exist without assigned_department"""
        citizen = Citizen.objects.create_user(
            username="citizen3",
            email="citizen3@test.com",
            password="password123",
            phone_number="7654321098"
        )
        assert citizen.assigned_department is None
        assert citizen.phone_number == "7654321098"
    
    def test_department_cascade_delete(self):
        """Test CASCADE delete when department is deleted"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="gov2",
            email="gov2@test.com",
            password="password123",
            assigned_department=dept
        )
        
        dept_id = dept.id
        dept.delete()
        
        # User should be deleted due to CASCADE
        assert not Government_Authority.objects.filter(id=gov.id).exists()
    
    def test_multiple_users_same_department(self):
        """Test multiple users can share the same department"""
        dept = Department.objects.create(name="transport")
        
        gov = Government_Authority.objects.create_user(
            username="gov3",
            email="gov3@test.com",
            password="password123",
            assigned_department=dept
        )
        
        fw = Field_Worker.objects.create_user(
            username="fw2",
            email="fw2@test.com",
            password="password123",
            assigned_department=dept
        )
        
        assert gov.assigned_department == fw.assigned_department == dept
    
    def test_user_type_field_citizen(self):
        """Test user_type field is set correctly for Citizen"""
        citizen = Citizen.objects.create_user(
            username="citizen4",
            email="citizen4@test.com",
            password="password123"
        )
        assert citizen.user_type == 'citizen'
    
    def test_user_type_field_authority(self):
        """Test user_type field is set correctly for Government_Authority"""
        dept = Department.objects.create(name="education")
        gov = Government_Authority.objects.create_user(
            username="gov4",
            email="gov4@test.com",
            password="password123",
            assigned_department=dept
        )
        assert gov.user_type == 'authority'
    
    def test_user_type_field_fieldworker(self):
        """Test user_type field is set correctly for Field_Worker"""
        dept = Department.objects.create(name="electricity")
        fw = Field_Worker.objects.create_user(
            username="fw3",
            email="fw3@test.com",
            password="password123",
            assigned_department=dept
        )
        assert fw.user_type == 'fieldworker'
    
    def test_parent_user_user_type_default(self):
        """Test ParentUser user_type defaults to 'user'"""
        user = ParentUser.objects.create_user(
            username="baseuser",
            email="baseuser@test.com",
            password="password123"
        )
        assert user.user_type == 'user'
    
    def test_government_authority_no_department_field(self):
        """Test Government_Authority doesn't have its own assigned_department field"""
        # This should not raise an error - department is on ParentUser
        dept = Department.objects.create(name="police")
        gov = Government_Authority.objects.create_user(
            username="gov5",
            email="gov5@test.com",
            password="password123",
            assigned_department=dept
        )
        # Accessing via ParentUser field
        assert hasattr(gov, 'assigned_department')
        assert gov.assigned_department == dept
    
    def test_field_worker_no_department_field(self):
        """Test Field_Worker doesn't have its own assigned_department field"""
        dept = Department.objects.create(name="fire")
        fw = Field_Worker.objects.create_user(
            username="fw4",
            email="fw4@test.com",
            password="password123",
            assigned_department=dept
        )
        # Accessing via ParentUser field
        assert hasattr(fw, 'assigned_department')
        assert fw.assigned_department == dept
    
    def test_verified_field_government_authority(self):
        """Test verified field exists on Government_Authority"""
        gov = Government_Authority.objects.create_user(
            username="gov6",
            email="gov6@test.com",
            password="password123",
            verified=True
        )
        assert gov.verified is True
    
    def test_verified_field_field_worker(self):
        """Test verified field exists on Field_Worker"""
        fw = Field_Worker.objects.create_user(
            username="fw5",
            email="fw5@test.com",
            password="password123",
            verified=False
        )
        assert fw.verified is False
    
    def test_phone_number_uniqueness_across_types(self):
        """Test phone numbers are unique across all user types"""
        phone = "9123456789"
        
        Citizen.objects.create_user(
            username="citizen5",
            email="citizen5@test.com",
            password="password123",
            phone_number=phone
        )
        
        # Same phone for Government_Authority should fail
        with pytest.raises(IntegrityError):
            Government_Authority.objects.create_user(
                username="gov7",
                email="gov7@test.com",
                password="password123",
                phone_number=phone
            )
