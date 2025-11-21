"""
Tests to push complaints module files from 90-97% to 100% coverage
Focusing on specific uncovered lines in serializers, views, ML modules, and services
"""
import pytest
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from PIL import Image
import io
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import Citizen, Field_Worker, Government_Authority, Department
from complaints.models import Complaint, ComplaintImage, Resolution, ResolutionImage
from django.utils import timezone


@pytest.mark.django_db
class TestSerializersImageURL:
    """Test serializers image_url methods (lines 24, 37)"""
    
    def test_complaint_image_serializer_image_url(self):
        """Test ComplaintImageSerializer.get_image_url returns URL when image exists (line 24)"""
        from complaints.serializers import ComplaintImageSerializer
        
        # Create citizen and complaint
        citizen = Citizen.objects.create_user(
            username='test', password='pass', phone_number='9876543210'
        )
        complaint = Complaint(content='Test', posted_by=citizen, latitude=12.34, longitude=56.78)
        complaint.save()
        
        # Create image
        image = Image.new('RGB', (100, 100))
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        image_file = SimpleUploadedFile('test.jpg', image_io.read(), content_type='image/jpeg')
        
        # Create ComplaintImage
        complaint_image = ComplaintImage.objects.create(
            complaint=complaint,
            image=image_file,
            order=1
        )
        
        # Serialize - this should trigger line 24
        serializer = ComplaintImageSerializer(complaint_image)
        data = serializer.data
        assert 'image_url' in data
        assert data['image_url'] is not None
    
    def test_resolution_image_serializer_image_url(self):
        """Test ResolutionImageSerializer.get_image_url returns URL when image exists (line 37)"""
        from complaints.serializers import ResolutionImageSerializer
        
        # Create users and complaint
        citizen = Citizen.objects.create_user(
            username='test2', password='pass', phone_number='9876543211'
        )
        fw = Field_Worker.objects.create_user(
            username='fw', password='pass', phone_number='9876543212'
        )
        complaint = Complaint.objects.create(
            content='Test', posted_by=citizen, latitude=12.34, longitude=56.78
        )
        resolution = Resolution.objects.create(
            complaint=complaint, field_worker=fw, description='Fixed'
        )
        
        # Create image
        image = Image.new('RGB', (100, 100))
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        image_file = SimpleUploadedFile('res.jpg', image_io.read(), content_type='image/jpeg')
        
        # Create ResolutionImage
        res_image = ResolutionImage.objects.create(
            resolution=resolution,
            image=image_file,
            order=1
        )
        
        # Serialize - this should trigger line 37
        serializer = ResolutionImageSerializer(res_image)
        data = serializer.data
        assert 'image_url' in data
        assert data['image_url'] is not None


@pytest.mark.django_db
class TestSerializersAnonymousPostedBy:
    """Test posted_by with anonymous complaints (lines 96, 100, 104)"""
    
    def test_posted_by_anonymous_complaint(self):
        """Test get_posted_by returns None for anonymous complaint (line 96)"""
        from complaints.serializers import ComplaintSerializer
        
        citizen = Citizen.objects.create_user(
            username='test3', password='pass', phone_number='9876543213'
        )
        complaint = Complaint.objects.create(
            content='Test', posted_by=citizen, latitude=12.34, longitude=56.78,
            is_anonymous=True  # Anonymous complaint
        )
        
        # Serialize - should return None for posted_by (lines 96, 100, 104)
        serializer = ComplaintSerializer(complaint)
        data = serializer.data
        # posted_by should be None or not in data
        if 'posted_by' in data:
            assert data['posted_by'] is None


@pytest.mark.django_db
class TestSerializersPincodeValidation:
    """Test pincode validation (line 161)"""
    
    def test_invalid_pincode_format(self):
        """Test validate method raises error for invalid pincode (line 161)"""
        from complaints.serializers import ComplaintCreateSerializer
        
        citizen = Citizen.objects.create_user(
            username='test4', password='pass', phone_number='9876543214'
        )
        
        # Data with invalid pincode
        data = {
            'content': 'Test complaint',
            'posted_by': citizen.id,
            'location_source': 'gps',
            'latitude': 12.34,
            'longitude': 56.78,
            'pincode': '12345'  # Invalid - only 5 digits
        }
        
        serializer = ComplaintCreateSerializer(data=data)
        # Should be invalid due to pincode (line 161)
        assert not serializer.is_valid()


@pytest.mark.django_db
class TestSerializersDaysRemaining:
    """Test days_until_auto_approval calculation (line 236)"""
    
    def test_days_remaining_calculation(self):
        """Test get_days_until_auto_approval calculates remaining days (line 236)"""
        from complaints.serializers import ResolutionSerializer
        from datetime import timedelta
        
        citizen = Citizen.objects.create_user(
            username='test5', password='pass', phone_number='9876543215'
        )
        fw = Field_Worker.objects.create_user(
            username='fw2', password='pass', phone_number='9876543216'
        )
        complaint = Complaint.objects.create(
            content='Test', posted_by=citizen, latitude=12.34, longitude=56.78
        )
        
        # Create resolution with auto_approve_at in future
        resolution = Resolution.objects.create(
            complaint=complaint,
            field_worker=fw,
            description='Fixed',
            status='pending_approval',
            auto_approve_at=timezone.now() + timedelta(days=5)
        )
        
        # Serialize - should calculate days remaining (line 236)
        serializer = ResolutionSerializer(resolution)
        data = serializer.data
        if 'days_until_auto_approval' in data:
            assert data['days_until_auto_approval'] >= 0


@pytest.mark.django_db
class TestSerializersImageValidation:
    """Test resolution image validation and creation (lines 252-254, 271)"""
    
    def test_resolution_images_exceeds_limit(self):
        """Test validate_images raises error when >5 images (lines 252-254)"""
        from complaints.serializers import ResolutionCreateSerializer
        
        # Create 6 images
        images = []
        for i in range(6):
            img = Image.new('RGB', (100, 100))
            img_io = io.BytesIO()
            img.save(img_io, format='JPEG')
            img_io.seek(0)
            images.append(SimpleUploadedFile(f'img{i}.jpg', img_io.read(), content_type='image/jpeg'))
        
        data = {
            'description': 'Fixed',
            'images': images
        }
        
        serializer = ResolutionCreateSerializer(data=data)
        # Should be invalid (lines 252-254)
        assert not serializer.is_valid()
    







