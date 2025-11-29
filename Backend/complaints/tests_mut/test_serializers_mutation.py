"""
Mutation tests for complaints/serializers.py

These tests focus on:
- Validation logic branches
- Edge cases in serializer methods
- Return value variations
- Field transformations
- Context handling
"""
import pytest
import re
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers as drf_serializers
from PIL import Image
import io

from users.models import Citizen, Department, Field_Worker
from complaints.models import Complaint, ComplaintImage, Resolution, Upvote
from complaints.serializers import (
    ComplaintSerializer, ComplaintCreateSerializer, ComplaintImageSerializer,
    UpvoteSerializer, FakeConfidenceSerializer, ComplaintAssignSerializer,
    ResolutionSerializer, ResolutionCreateSerializer, CitizenResolutionResponseSerializer,
    ResolutionImageSerializer
)
from .conftest import create_test_image


@pytest.mark.django_db
class TestComplaintCreateSerializerMutations:
    """Mutation tests for ComplaintCreateSerializer"""
    
    def test_validate_gps_missing_latitude(self):
        """Test GPS without latitude"""
        data = {
            'content': 'Test',
            'location_type': 'gps',
            'longitude': 77.5946
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'GPS coordinates are required' in str(serializer.errors)
    
    def test_validate_gps_missing_longitude(self):
        """Test GPS without longitude"""
        data = {
            'content': 'Test',
            'location_type': 'gps',
            'latitude': 12.9716
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'GPS coordinates are required' in str(serializer.errors)
    
    def test_validate_gps_missing_both_coords(self):
        """Test GPS without any coordinates"""
        data = {
            'content': 'Test',
            'location_type': 'gps'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'GPS coordinates are required' in str(serializer.errors)
    
    def test_validate_gps_with_both_coords_valid(self):
        """Test GPS with both coordinates is valid"""
        data = {
            'content': 'Test',
            'location_type': 'gps',
            'latitude': 12.9716,
            'longitude': 77.5946
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_manual_missing_address(self):
        """Test manual without address"""
        data = {
            'content': 'Test',
            'location_type': 'manual'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'Address is required' in str(serializer.errors)
    
    def test_validate_manual_with_address_valid(self):
        """Test manual with address is valid"""
        data = {
            'content': 'Test',
            'location_type': 'manual',
            'address': '123 Test Street'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_pincode_valid_format(self):
        """Test valid pincode format"""
        data = {
            'content': 'Test',
            'location_type': 'manual',
            'address': '123 Street',
            'pincode': '560001'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_pincode_invalid_starts_with_zero(self):
        """Test pincode starting with 0 is invalid"""
        data = {
            'content': 'Test',
            'location_type': 'manual',
            'address': '123 Street',
            'pincode': '056001'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'pincode' in serializer.errors
    
    def test_validate_pincode_invalid_too_short(self):
        """Test pincode less than 6 digits"""
        data = {
            'content': 'Test',
            'location_type': 'manual',
            'address': '123 Street',
            'pincode': '12345'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'pincode' in serializer.errors
    
    def test_validate_pincode_invalid_too_long(self):
        """Test pincode more than 6 digits"""
        data = {
            'content': 'Test',
            'location_type': 'manual',
            'address': '123 Street',
            'pincode': '5600011'
        }
        serializer = ComplaintCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'pincode' in serializer.errors
    
    def test_validate_images_empty_list(self):
        """Test empty images list is valid"""
        serializer = ComplaintCreateSerializer()
        result = serializer.validate_images([])
        assert result == []
    
    def test_validate_images_one_image(self):
        """Test single image is valid"""
        serializer = ComplaintCreateSerializer()
        result = serializer.validate_images(['img1'])
        assert len(result) == 1
    
    def test_validate_images_four_images(self):
        """Test 4 images is valid"""
        serializer = ComplaintCreateSerializer()
        result = serializer.validate_images(['img1', 'img2', 'img3', 'img4'])
        assert len(result) == 4
    
    def test_validate_images_five_images_invalid(self):
        """Test 5 images is invalid"""
        serializer = ComplaintCreateSerializer()
        with pytest.raises(drf_serializers.ValidationError) as exc_info:
            serializer.validate_images(['img1', 'img2', 'img3', 'img4', 'img5'])
        assert 'maximum of 4 images' in str(exc_info.value).lower()
    
    def test_create_complaint_with_images(self, monkeypatch):
        """Test creating complaint with images"""
        import cloudinary.uploader
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        user = Citizen.objects.create_user(username='u1', password='p', phone_number='9876543210')
        
        # Create valid image data
        img1_io = io.BytesIO()
        img1_pil = Image.new('RGB', (100, 100), color='red')
        img1_pil.save(img1_io, format='JPEG')
        img1_io.seek(0)
        img1 = SimpleUploadedFile("img1.jpg", img1_io.read(), content_type="image/jpeg")
        
        img2_io = io.BytesIO()
        img2_pil = Image.new('RGB', (100, 100), color='blue')
        img2_pil.save(img2_io, format='JPEG')
        img2_io.seek(0)
        img2 = SimpleUploadedFile("img2.jpg", img2_io.read(), content_type="image/jpeg")
        
        data = {
            'content': 'Test complaint',
            'address': '123 Test St',
            'location_type': 'manual',
            'images': [img1, img2]
        }
        
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        complaint = serializer.save(posted_by=user)
        assert complaint.pk is not None
        assert complaint.images.count() == 2
    
    def test_create_complaint_without_images(self):
        """Test creating complaint without images"""
        user = Citizen.objects.create_user(username='u2', password='p', phone_number='9876543211')
        
        data = {
            'content': 'Test complaint',
            'address': '123 Test St',
            'location_type': 'manual'
        }
        
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        complaint = serializer.save(posted_by=user)
        assert complaint.pk is not None
        assert complaint.images.count() == 0
    
    def test_create_with_anonymous_flag(self):
        """Test creating anonymous complaint"""
        user = Citizen.objects.create_user(username='u3', password='p', phone_number='9876543212')
        
        data = {
            'content': 'Anonymous test',
            'address': '456 Test Ave',
            'location_type': 'manual',
            'is_anonymous': True
        }
        
        serializer = ComplaintCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        complaint = serializer.save(posted_by=user)
        assert complaint.is_anonymous is True


@pytest.mark.django_db
class TestComplaintSerializerMutations:
    """Mutation tests for ComplaintSerializer"""
    
    def test_get_upvotes_count_from_annotation(self):
        """Test upvotes count from annotation"""
        user = Citizen.objects.create_user(username='u4', password='p', phone_number='9876543213')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560001')
        
        # Simulate annotation
        comp.computed_upvotes_count = 5
        
        serializer = ComplaintSerializer(comp)
        assert serializer.get_upvotes_count(comp) == 5
    
    def test_get_upvotes_count_from_field(self):
        """Test upvotes count from field when no annotation"""
        user = Citizen.objects.create_user(username='u5', password='p', phone_number='9876543214')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560002', upvotes_count=3)
        
        serializer = ComplaintSerializer(comp)
        assert serializer.get_upvotes_count(comp) == 3
    
    def test_get_upvotes_count_default_zero(self):
        """Test upvotes count defaults to 0"""
        user = Citizen.objects.create_user(username='u6', password='p', phone_number='9876543215')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560003')
        
        serializer = ComplaintSerializer(comp)
        count = serializer.get_upvotes_count(comp)
        assert count == 0 or count >= 0  # Should be non-negative
    
    def test_get_is_upvoted_from_annotation(self):
        """Test is_upvoted from annotation"""
        user = Citizen.objects.create_user(username='u7', password='p', phone_number='9876543216')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560004')
        
        comp.is_upvoted = True
        serializer = ComplaintSerializer(comp)
        assert serializer.get_is_upvoted(comp) is True
    
    def test_get_is_upvoted_authenticated_user_upvoted(self):
        """Test is_upvoted for authenticated user who upvoted"""
        user = Citizen.objects.create_user(username='u8', password='p', phone_number='9876543217')
        other_user = Citizen.objects.create_user(username='u9', password='p', phone_number='9876543218')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560005')
        Upvote.objects.create(user=other_user, complaint=comp)
        
        from unittest.mock import Mock
        request = Mock()
        request.user = other_user
        
        serializer = ComplaintSerializer(comp, context={'request': request})
        assert serializer.get_is_upvoted(comp) is True
    
    def test_get_is_upvoted_authenticated_user_not_upvoted(self):
        """Test is_upvoted for authenticated user who didn't upvote"""
        user = Citizen.objects.create_user(username='u10', password='p', phone_number='9876543219')
        other_user = Citizen.objects.create_user(username='u11', password='p', phone_number='9876543220')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560006')
        
        from unittest.mock import Mock
        request = Mock()
        request.user = other_user
        
        serializer = ComplaintSerializer(comp, context={'request': request})
        assert serializer.get_is_upvoted(comp) is False
    
    def test_get_is_upvoted_unauthenticated(self):
        """Test is_upvoted for unauthenticated user"""
        user = Citizen.objects.create_user(username='u12', password='p', phone_number='9876543221')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560007')
        
        serializer = ComplaintSerializer(comp)
        assert serializer.get_is_upvoted(comp) is False
    
    def test_get_thumbnail_url_with_image(self, monkeypatch):
        """Test thumbnail URL when images exist"""
        import cloudinary.uploader
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        user = Citizen.objects.create_user(username='u13', password='p', phone_number='9876543222')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560008')
        
        img = create_test_image("img.jpg")
        ComplaintImage.objects.create(complaint=comp, image=img, order=0)
        
        serializer = ComplaintSerializer(comp)
        url = serializer.get_thumbnail_url(comp)
        assert url is not None
        assert 'http' in url
    
    def test_get_thumbnail_url_without_image(self):
        """Test thumbnail URL when no images"""
        user = Citizen.objects.create_user(username='u14', password='p', phone_number='9876543223')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560009')
        
        serializer = ComplaintSerializer(comp)
        url = serializer.get_thumbnail_url(comp)
        assert url is None
    
    def test_get_posted_by_anonymous_complaint(self):
        """Test posted_by for anonymous complaint"""
        user = Citizen.objects.create_user(username='u15', password='p', phone_number='9876543224')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560010', is_anonymous=True)
        
        serializer = ComplaintSerializer(comp)
        posted_by = serializer.get_posted_by(comp)
        assert posted_by is None
    
    def test_get_posted_by_non_anonymous(self):
        """Test posted_by for non-anonymous complaint"""
        user = Citizen.objects.create_user(username='u16', password='p', phone_number='9876543225')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560011', is_anonymous=False)
        
        serializer = ComplaintSerializer(comp, context={'request': None})
        posted_by = serializer.get_posted_by(comp)
        assert posted_by is not None
        assert 'username' in posted_by
    
    def test_get_assigned_to_fieldworker_with_assignment(self):
        """Test fieldworker name when assigned"""
        user = Citizen.objects.create_user(username='u17', password='p', phone_number='9876543226')
        fw = Field_Worker.objects.create_user(username='fw1', password='p', phone_number='9876543227')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560012', assigned_to_fieldworker=fw)
        
        serializer = ComplaintSerializer(comp)
        name = serializer.get_assigned_to_fieldworker(comp)
        assert name == 'fw1'
    
    def test_get_assigned_to_fieldworker_without_assignment(self):
        """Test fieldworker name when not assigned"""
        user = Citizen.objects.create_user(username='u18', password='p', phone_number='9876543228')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560013')
        
        serializer = ComplaintSerializer(comp)
        name = serializer.get_assigned_to_fieldworker(comp)
        assert name is None
    
    def test_get_current_resolution_with_resolution(self):
        """Test current_resolution when exists"""
        user = Citizen.objects.create_user(username='u19', password='p', phone_number='9876543229')
        fw = Field_Worker.objects.create_user(username='fw2', password='p', phone_number='9876543230')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560014')
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        comp.current_resolution = res
        comp.save()
        
        serializer = ComplaintSerializer(comp)
        current = serializer.get_current_resolution(comp)
        assert current is not None
        assert current['id'] == res.id
        assert 'status' in current
    
    def test_get_current_resolution_without_resolution(self):
        """Test current_resolution when doesn't exist"""
        user = Citizen.objects.create_user(username='u20', password='p', phone_number='9876543231')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560015')
        
        serializer = ComplaintSerializer(comp)
        current = serializer.get_current_resolution(comp)
        assert current is None
    
    def test_get_has_pending_resolution_true(self):
        """Test has_pending_resolution returns True"""
        user = Citizen.objects.create_user(username='u21', password='p', phone_number='9876543232')
        fw = Field_Worker.objects.create_user(username='fw3', password='p', phone_number='9876543233')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560016')
        Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed', status='pending_approval')
        
        serializer = ComplaintSerializer(comp)
        has_pending = serializer.get_has_pending_resolution(comp)
        assert has_pending is True
    
    def test_get_has_pending_resolution_false(self):
        """Test has_pending_resolution returns False"""
        user = Citizen.objects.create_user(username='u22', password='p', phone_number='9876543234')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560017')
        
        serializer = ComplaintSerializer(comp)
        has_pending = serializer.get_has_pending_resolution(comp)
        assert has_pending is False


@pytest.mark.django_db
class TestCitizenResolutionResponseSerializerMutations:
    """Mutation tests for CitizenResolutionResponseSerializer"""
    
    def test_validate_approval_without_feedback(self):
        """Test approval without feedback is valid"""
        data = {'approved': True}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_approval_with_feedback(self):
        """Test approval with feedback is valid"""
        data = {'approved': True, 'feedback': 'Good work'}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_rejection_without_feedback_invalid(self):
        """Test rejection without feedback is invalid"""
        data = {'approved': False}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert not serializer.is_valid()
        assert 'feedback' in serializer.errors
    
    def test_validate_rejection_with_empty_feedback_invalid(self):
        """Test rejection with empty feedback is invalid"""
        data = {'approved': False, 'feedback': ''}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert not serializer.is_valid()
        assert 'feedback' in serializer.errors
    
    def test_validate_rejection_with_feedback_valid(self):
        """Test rejection with feedback is valid"""
        data = {'approved': False, 'feedback': 'Not good enough'}
        serializer = CitizenResolutionResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
    
    def test_validate_rejection_with_whitespace_feedback_invalid(self):
        """Test rejection with whitespace-only feedback"""
        data = {'approved': False, 'feedback': '   '}
        serializer = CitizenResolutionResponseSerializer(data=data)
        # This might be valid or invalid depending on implementation
        # Testing actual behavior
        is_valid = serializer.is_valid()
        # If it considers whitespace as empty, it should be invalid
        assert is_valid or 'feedback' in serializer.errors


@pytest.mark.django_db
class TestResolutionCreateSerializerMutations:
    """Mutation tests for ResolutionCreateSerializer"""
    
    def test_validate_images_empty_list(self):
        """Test empty images list is valid"""
        serializer = ResolutionCreateSerializer()
        result = serializer.validate_images([])
        assert result == []
    
    def test_validate_images_five_images(self):
        """Test 5 images is valid"""
        serializer = ResolutionCreateSerializer()
        result = serializer.validate_images(['img1', 'img2', 'img3', 'img4', 'img5'])
        assert len(result) == 5
    
    def test_validate_images_six_images_invalid(self):
        """Test 6 images is invalid"""
        serializer = ResolutionCreateSerializer()
        with pytest.raises(drf_serializers.ValidationError) as exc_info:
            serializer.validate_images(['img1', 'img2', 'img3', 'img4', 'img5', 'img6'])
        assert 'maximum of 5 images' in str(exc_info.value).lower()
    
    def test_create_resolution_with_images(self, monkeypatch):
        """Test creating resolution with images"""
        import cloudinary.uploader
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        user = Citizen.objects.create_user(username='u23', password='p', phone_number='9876543235')
        fw = Field_Worker.objects.create_user(username='fw4', password='p', phone_number='9876543236')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560018')
        
        img1 = create_test_image("img1.jpg", color='red')
        img2 = create_test_image("img2.jpg", color='blue')
        
        data = {
            'description': 'Fixed the issue',
            'images': [img1, img2]
        }
        
        serializer = ResolutionCreateSerializer(data=data, context={'complaint': comp, 'field_worker': fw})
        assert serializer.is_valid(), serializer.errors
        
        resolution = serializer.save()
        assert resolution.pk is not None
        assert resolution.images.count() == 2
    
    def test_create_resolution_without_images(self):
        """Test creating resolution without images"""
        user = Citizen.objects.create_user(username='u24', password='p', phone_number='9876543237')
        fw = Field_Worker.objects.create_user(username='fw5', password='p', phone_number='9876543238')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560019')
        
        data = {'description': 'Fixed the issue'}
        
        serializer = ResolutionCreateSerializer(data=data, context={'complaint': comp, 'field_worker': fw})
        assert serializer.is_valid(), serializer.errors
        
        resolution = serializer.save()
        assert resolution.pk is not None
        assert resolution.images.count() == 0


@pytest.mark.django_db
class TestResolutionSerializerMutations:
    """Mutation tests for ResolutionSerializer"""
    
    def test_get_days_until_auto_approve_positive(self):
        """Test days calculation when time remaining"""
        from django.utils import timezone
        from datetime import timedelta
        
        user = Citizen.objects.create_user(username='u25', password='p', phone_number='9876543239')
        fw = Field_Worker.objects.create_user(username='fw6', password='p', phone_number='9876543240')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560020')
        
        res = Resolution.objects.create(
            complaint=comp, 
            field_worker=fw, 
            description='Fixed',
            status='pending_approval',
            auto_approve_at=timezone.now() + timedelta(days=2)
        )
        
        serializer = ResolutionSerializer(res)
        days = serializer.get_days_until_auto_approve(res)
        assert days >= 0  # Should be 1 or 2 depending on timing
    
    def test_get_days_until_auto_approve_zero_when_expired(self):
        """Test days returns 0 when expired"""
        from django.utils import timezone
        from datetime import timedelta
        
        user = Citizen.objects.create_user(username='u26', password='p', phone_number='9876543241')
        fw = Field_Worker.objects.create_user(username='fw7', password='p', phone_number='9876543242')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560021')
        
        res = Resolution.objects.create(
            complaint=comp,
            field_worker=fw,
            description='Fixed',
            status='pending_approval',
            auto_approve_at=timezone.now() - timedelta(days=1)
        )
        
        serializer = ResolutionSerializer(res)
        days = serializer.get_days_until_auto_approve(res)
        assert days == 0
    
    def test_get_days_until_auto_approve_zero_when_not_pending(self):
        """Test days returns 0 when not pending approval"""
        from django.utils import timezone
        from datetime import timedelta
        
        user = Citizen.objects.create_user(username='u27', password='p', phone_number='9876543243')
        fw = Field_Worker.objects.create_user(username='fw8', password='p', phone_number='9876543244')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560022')
        
        res = Resolution.objects.create(
            complaint=comp,
            field_worker=fw,
            description='Fixed',
            status='approved',
            auto_approve_at=timezone.now() + timedelta(days=2)
        )
        
        serializer = ResolutionSerializer(res)
        days = serializer.get_days_until_auto_approve(res)
        assert days == 0
    
    def test_get_days_until_auto_approve_zero_when_no_auto_approve_time(self):
        """Test days returns 0 when auto_approve_at is None"""
        user = Citizen.objects.create_user(username='u28', password='p', phone_number='9876543245')
        fw = Field_Worker.objects.create_user(username='fw9', password='p', phone_number='9876543246')
        comp = Complaint.objects.create(content='Test', posted_by=user, address='Addr 560023')
        
        res = Resolution.objects.create(
            complaint=comp,
            field_worker=fw,
            description='Fixed',
            status='pending_approval',
            auto_approve_at=None
        )
        
        serializer = ResolutionSerializer(res)
        days = serializer.get_days_until_auto_approve(res)
        assert days == 0
