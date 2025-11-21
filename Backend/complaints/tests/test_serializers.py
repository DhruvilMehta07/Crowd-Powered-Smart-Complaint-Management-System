# Create test_serializers.py in complaints/tests/

import pytest
from complaints.serializers import *
from complaints.models import Complaint, Resolution
from users.models import Citizen, Field_Worker, Department

@pytest.mark.django_db
class TestComplaintCreateSerializer:
    def test_validate_images_too_many(self):
        serializer = ComplaintCreateSerializer()
        images = ['img1', 'img2', 'img3', 'img4', 'img5']  # 5 images
        with pytest.raises(serializers.ValidationError):
            serializer.validate_images(images)

    def test_validate_gps_missing_coords(self):
        data = {
            'content': 'Test',
            'location_type': 'gps',
            'address': ''  # No coordinates provided
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'GPS coordinates are required' in str(serializer.errors)

    def test_validate_manual_missing_address(self):
        data = {
            'content': 'Test', 
            'location_type': 'manual',
            'latitude': None,
            'longitude': None
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'Address is required' in str(serializer.errors)
    
    def test_validate_images_empty_list(self):
        """Test that empty images list is valid"""
        serializer = ComplaintCreateSerializer()
        result = serializer.validate_images([])
        assert result == []
    
    def test_validate_images_exactly_four(self):
        """Test that 4 images is valid"""
        serializer = ComplaintCreateSerializer()
        images = ['img1', 'img2', 'img3', 'img4']
        result = serializer.validate_images(images)
        assert len(result) == 4
    
    def test_create_with_valid_data(self):
        """Test creating complaint with valid data"""
        user = Citizen.objects.create_user(
            username="serializer_user",
            email="ser@test.com",
            password="pass",
            phone_number="9876543210"
        )
        data = {
            'content': 'Test complaint',
            'address': '123 Test St, 560001',
            'location_type': 'manual'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        complaint = serializer.save(posted_by=user)
        assert complaint.pk is not None
        assert complaint.content == 'Test complaint'
    
    def test_validate_gps_with_coords(self):
        """Test GPS validation with coordinates"""
        user = Citizen.objects.create_user(
            username="gps_user",
            email="gps@test.com",
            password="pass",
            phone_number="9876543211"
        )
        data = {
            'content': 'GPS complaint',
            'location_type': 'gps',
            'latitude': 12.9716,
            'longitude': 77.5946
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

class TestCitizenResolutionResponseSerializer:
    def test_validate_rejection_without_feedback(self):
        data = {'approved': False, 'feedback': ''}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert not serializer.is_valid()
        assert 'Feedback is required' in str(serializer.errors)
    
    def test_validate_approval_without_feedback(self):
        """Test that approval doesn't require feedback"""
        data = {'approved': True, 'feedback': ''}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert serializer.is_valid()
    
    def test_validate_rejection_with_feedback(self):
        """Test rejection with feedback is valid"""
        data = {'approved': False, 'feedback': 'Not satisfied'}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.django_db
class TestResolutionCreateSerializer:
    def test_resolution_create_valid(self):
        """Test creating resolution with valid data"""
        dept = Department.objects.create(name="test dept")
        citizen = Citizen.objects.create_user(
            username="cit",
            email="cit@test.com",
            password="pass",
            phone_number="9876543212"
        )
        fw = Field_Worker.objects.create_user(
            username="fw",
            email="fw@test.com",
            password="pass",
            phone_number="9876543213",
            assigned_department=dept
        )
        complaint = Complaint.objects.create(
            content="Test",
            posted_by=citizen,
            address="Test Address, 560001",
            assigned_to_fieldworker=fw
        )
        
        data = {'description': 'Fixed the issue'}
        serializer = ResolutionCreateSerializer(
            data=data,
            context={'complaint': complaint, 'field_worker': fw}
        )
        assert serializer.is_valid(), serializer.errors
        resolution = serializer.save()
        assert resolution.description == 'Fixed the issue'
        assert resolution.field_worker == fw
        assert resolution.complaint == complaint
    
    def test_resolution_create_missing_description(self):
        """Test that description is required"""
        dept = Department.objects.create(name="test dept2")
        citizen = Citizen.objects.create_user(
            username="cit2",
            email="cit2@test.com",
            password="pass",
            phone_number="9876543214"
        )
        fw = Field_Worker.objects.create_user(
            username="fw2",
            email="fw2@test.com",
            password="pass",
            phone_number="9876543215",
            assigned_department=dept
        )
        complaint = Complaint.objects.create(
            content="Test2",
            posted_by=citizen,
            address="Test Address 2, 560002",
            assigned_to_fieldworker=fw
        )
        
        data = {}
        serializer = ResolutionCreateSerializer(
            data=data,
            context={'complaint': complaint, 'field_worker': fw}
        )
        assert not serializer.is_valid()
        assert 'description' in serializer.errors


@pytest.mark.django_db
class TestComplaintSerializer:
    def test_complaint_serializer_basic(self):
        """Test basic complaint serialization"""
        citizen = Citizen.objects.create_user(
            username="test_ser",
            email="test_ser@test.com",
            password="pass",
            phone_number="9876543216"
        )
        complaint = Complaint.objects.create(
            content="Serializer test",
            posted_by=citizen,
            address="Serializer St, 560003"
        )
        
        serializer = ComplaintSerializer(complaint)
        data = serializer.data
        
        assert data['content'] == 'Serializer test'
        assert 'posted_by' in data
        assert 'posted_at' in data


