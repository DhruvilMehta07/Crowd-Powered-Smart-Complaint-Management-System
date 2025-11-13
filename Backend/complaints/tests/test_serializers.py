# Create test_serializers.py in complaints/tests/

import pytest
from complaints.serializers import *
from complaints.models import Complaint
from users.models import Citizen

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

class TestCitizenResolutionResponseSerializer:
    def test_validate_rejection_without_feedback(self):
        data = {'approved': False, 'feedback': ''}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert not serializer.is_valid()
        assert 'Feedback is required' in str(serializer.errors)

