"""
Mutation tests for complaints/models.py

These tests focus on:
- Boundary conditions
- Edge cases  
- All code branches
- Return value variations
- Exception handling
- Model method logic
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import Mock, patch, MagicMock
import cloudinary.uploader

from users.models import Citizen, Department, Field_Worker
from complaints.models import (
    Complaint, ComplaintImage, Upvote, Fake_Confidence, 
    Resolution, ResolutionImage, validate_image_size
)
from notifications.models import Notification
from .conftest import create_test_image


@pytest.mark.django_db
class TestComplaintModelMutations:
    """Focus on killing mutations in Complaint model"""
    
    def test_extract_pincode_exact_match(self):
        """Test exact pincode pattern matching"""
        poster = Citizen.objects.create_user(username='c1', password='p', phone_number='9876543210')
        comp = Complaint(posted_by=poster, content='Test', address='Near Mall, 560001 Bangalore')
        assert comp.extract_pincode_from_address() == '560001'
    
    def test_extract_pincode_no_match(self):
        """Test when no pincode exists"""
        poster = Citizen.objects.create_user(username='c2', password='p', phone_number='9876543211')
        comp = Complaint(posted_by=poster, content='Test', address='Some place without pincode')
        assert comp.extract_pincode_from_address() is None
    
    def test_extract_pincode_none_address(self):
        """Test with None address"""
        poster = Citizen.objects.create_user(username='c3', password='p', phone_number='9876543212')
        comp = Complaint(posted_by=poster, content='Test', address=None)
        assert comp.extract_pincode_from_address() is None
    
    def test_extract_pincode_empty_address(self):
        """Test with empty string address"""
        poster = Citizen.objects.create_user(username='c4', password='p', phone_number='9876543213')
        comp = Complaint(posted_by=poster, content='Test', address='')
        assert comp.extract_pincode_from_address() is None
    
    def test_extract_pincode_invalid_pattern(self):
        """Test pincode starting with 0 (invalid)"""
        poster = Citizen.objects.create_user(username='c5', password='p', phone_number='9876543214')
        comp = Complaint(posted_by=poster, content='Test', address='Address 012345')
        # Should NOT match pincode starting with 0
        assert comp.extract_pincode_from_address() is None
    
    def test_extract_pincode_multiple_matches(self):
        """Test address with multiple pincodes - should return first"""
        poster = Citizen.objects.create_user(username='c6', password='p', phone_number='9876543215')
        comp = Complaint(posted_by=poster, content='Test', address='From 560001 to 560002')
        result = comp.extract_pincode_from_address()
        assert result in ['560001', '560002']  # Should match one of them
    
    def test_get_location_display_gps_with_coords(self):
        """Test GPS location display"""
        poster = Citizen.objects.create_user(username='c7', password='p', phone_number='9876543216')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps', 
                        latitude=Decimal('12.9715987'), longitude=Decimal('77.594566'))
        display = comp.get_location_display()
        assert 'GPS' in display
        assert '12.9715987' in display
        assert '77.594566' in display
    
    def test_get_location_display_gps_without_coords(self):
        """Test GPS type but missing coordinates"""
        poster = Citizen.objects.create_user(username='c8', password='p', phone_number='9876543217')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps', 
                        latitude=None, longitude=None, address='Fallback Address')
        display = comp.get_location_display()
        assert 'Address' in display or 'Fallback' in display
    
    def test_get_location_display_manual_with_address(self):
        """Test manual location with address"""
        poster = Citizen.objects.create_user(username='c9', password='p', phone_number='9876543218')
        comp = Complaint(posted_by=poster, content='Test', address='123 Main St')
        display = comp.get_location_display()
        assert 'Address' in display
        assert '123 Main St' in display
    
    def test_get_location_display_no_location(self):
        """Test when no location info available"""
        poster = Citizen.objects.create_user(username='c10', password='p', phone_number='9876543219')
        comp = Complaint(posted_by=poster, content='Test')
        display = comp.get_location_display()
        assert 'NOT AVAILABLE' in display
    
    def test_get_image_count_zero(self):
        """Test image count when no images"""
        poster = Citizen.objects.create_user(username='c11', password='p', phone_number='9876543220')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560001')
        assert comp.get_image_count() == 0
    
    def test_get_image_count_multiple(self, monkeypatch):
        """Test image count with multiple images"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg", 
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c12', password='p', phone_number='9876543221')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560002')
        
        for i in range(3):
            img = create_test_image(f"img{i}.jpg")
            ComplaintImage.objects.create(complaint=comp, image=img, order=i)
        
        assert comp.get_image_count() == 3
    
    def test_update_fake_confidence_zero(self):
        """Test fake confidence with no votes"""
        poster = Citizen.objects.create_user(username='c13', password='p', phone_number='9876543222')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560003')
        total = comp.update_fake_confidence()
        assert total == 0.0
        assert comp.fake_confidence == 0.0
    
    def test_update_fake_confidence_citizen_only(self):
        """Test fake confidence with citizen vote"""
        poster = Citizen.objects.create_user(username='c14', password='p', phone_number='9876543223')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560004')
        Fake_Confidence.objects.create(complaint=comp, user=poster)
        total = comp.update_fake_confidence()
        assert total == 1.0
    
    def test_update_fake_confidence_fieldworker_only(self):
        """Test fake confidence with field worker vote"""
        poster = Citizen.objects.create_user(username='c15', password='p', phone_number='9876543224')
        fw = Field_Worker.objects.create_user(username='fw1', password='p', phone_number='9876543225')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560005')
        Fake_Confidence.objects.create(complaint=comp, user=fw)
        total = comp.update_fake_confidence()
        assert total == 100.0
    
    def test_update_fake_confidence_mixed(self):
        """Test fake confidence with both citizen and field worker"""
        poster = Citizen.objects.create_user(username='c16', password='p', phone_number='9876543226')
        fw = Field_Worker.objects.create_user(username='fw2', password='p', phone_number='9876543227')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560006')
        Fake_Confidence.objects.create(complaint=comp, user=poster)
        Fake_Confidence.objects.create(complaint=comp, user=fw)
        total = comp.update_fake_confidence()
        assert total == 101.0
    
    def test_str_representation_with_poster(self):
        """Test string representation with poster"""
        poster = Citizen.objects.create_user(username='testuser', password='p', phone_number='9876543228')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560007')
        s = str(comp)
        assert 'testuser' in s
        assert 'Complaint' in s
    
    def test_str_representation_anonymous(self):
        """Test string representation for anonymous complaint"""
        poster = Citizen.objects.create_user(username='anonuser', password='p', phone_number='9876543229')
        comp = Complaint.objects.create(posted_by=None, content='Test', address='Addr 560008')
        s = str(comp)
        assert 'Anonymous' in s
    
    def test_save_gps_with_reverse_geocode_success(self, monkeypatch):
        """Test save with GPS that successfully reverse geocodes"""
        poster = Citizen.objects.create_user(username='c17', password='p', phone_number='9876543230')
        
        def fake_reverse(self):
            return {'address': 'Geocoded Address, 560009', 'pincode': '560009'}
        
        monkeypatch.setattr(Complaint, 'reverse_geocode_mapmyindia', fake_reverse)
        
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        comp.save()
        
        assert comp.address == 'Geocoded Address, 560009'
        assert comp.pincode == '560009'
    
    def test_save_gps_with_reverse_geocode_failure(self, monkeypatch):
        """Test save with GPS when reverse geocode fails"""
        poster = Citizen.objects.create_user(username='c18', password='p', phone_number='9876543231')
        
        def fake_reverse(self):
            return None
        
        monkeypatch.setattr(Complaint, 'reverse_geocode_mapmyindia', fake_reverse)
        
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        comp.save()
        
        # Should still save without address
        assert comp.pk is not None
    
    def test_save_manual_extracts_pincode(self):
        """Test save with manual address extracts pincode"""
        poster = Citizen.objects.create_user(username='c19', password='p', phone_number='9876543232')
        comp = Complaint(posted_by=poster, content='Test', address='Near Park, 560010')
        comp.save()
        assert comp.pincode == '560010'
    
    def test_save_no_location_raises_error(self):
        """Test save with no location raises ValidationError"""
        poster = Citizen.objects.create_user(username='c20', password='p', phone_number='9876543233')
        comp = Complaint(posted_by=poster, content='Test')
        with pytest.raises(ValidationError):
            comp.save()
    
    def test_reverse_geocode_no_api_key(self, monkeypatch):
        """Test reverse geocode with no API key"""
        monkeypatch.setattr('complaints.models.settings.MAPMYINDIA_API_KEY', '')
        poster = Citizen.objects.create_user(username='c21', password='p', phone_number='9876543234')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        result = comp.reverse_geocode_mapmyindia()
        assert result is None
    
    def test_reverse_geocode_api_success(self, monkeypatch):
        """Test successful API response"""
        monkeypatch.setattr('complaints.models.settings.MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    'responseCode': 200,
                    'results': [{
                        'formatted_address': 'Test Address',
                        'pincode': '560011',
                        'city': 'Test City',
                        'state': 'Test State',
                        'district': 'Test District'
                    }]
                }
        
        def mock_get(*args, **kwargs):
            return MockResponse()
        
        monkeypatch.setattr('complaints.models.requests.get', mock_get)
        
        poster = Citizen.objects.create_user(username='c22', password='p', phone_number='9876543235')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        result = comp.reverse_geocode_mapmyindia()
        
        assert result['address'] == 'Test Address'
        assert result['pincode'] == '560011'
    
    def test_reverse_geocode_api_no_results(self, monkeypatch):
        """Test API returns no results"""
        monkeypatch.setattr('complaints.models.settings.MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 200
            def json(self):
                return {'responseCode': 404, 'results': []}
        
        monkeypatch.setattr('complaints.models.requests.get', lambda *a, **k: MockResponse())
        
        poster = Citizen.objects.create_user(username='c23', password='p', phone_number='9876543236')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=0.0, longitude=0.0)
        result = comp.reverse_geocode_mapmyindia()
        assert result is None
    
    def test_reverse_geocode_api_error(self, monkeypatch):
        """Test API returns error status"""
        monkeypatch.setattr('complaints.models.settings.MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 500
            text = 'Internal Server Error'
            def json(self):
                return {}
        
        monkeypatch.setattr('complaints.models.requests.get', lambda *a, **k: MockResponse())
        
        poster = Citizen.objects.create_user(username='c24', password='p', phone_number='9876543237')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        result = comp.reverse_geocode_mapmyindia()
        assert result is None
    
    def test_reverse_geocode_builds_address_from_parts(self, monkeypatch):
        """Test building address from city/village/district/state"""
        monkeypatch.setattr('complaints.models.settings.MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 200
            def json(self):
                return {
                    'responseCode': 200,
                    'results': [{
                        'formatted_address': '',  # Empty
                        'city': 'TestCity',
                        'district': 'TestDistrict',
                        'state': 'TestState',
                        'pincode': '560012'
                    }]
                }
        
        monkeypatch.setattr('complaints.models.requests.get', lambda *a, **k: MockResponse())
        
        poster = Citizen.objects.create_user(username='c25', password='p', phone_number='9876543238')
        comp = Complaint(posted_by=poster, content='Test', location_type='gps',
                        latitude=12.9, longitude=77.6)
        result = comp.reverse_geocode_mapmyindia()
        
        assert 'TestCity' in result['address']
        assert 'TestDistrict' in result['address']


@pytest.mark.django_db
class TestComplaintImageMutations:
    """Mutation tests for ComplaintImage model"""
    
    def test_clean_allows_4_images(self, monkeypatch):
        """Test that 4 images is allowed"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c26', password='p', phone_number='9876543239')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560013')
        
        for i in range(4):
            img = create_test_image(f"img{i}.jpg")
            ci = ComplaintImage(complaint=comp, image=img, order=i)
            ci.clean()  # Should not raise
            ci.save()
    
    def test_clean_rejects_5th_image(self, monkeypatch):
        """Test that 5th image is rejected"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c27', password='p', phone_number='9876543240')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560014')
        
        for i in range(4):
            img = create_test_image(f"img{i}.jpg")
            ComplaintImage.objects.create(complaint=comp, image=img, order=i)
        
        img5 = create_test_image("img5.jpg")
        ci5 = ComplaintImage(complaint=comp, image=img5, order=5)
        
        with pytest.raises(ValidationError):
            ci5.clean()
    
    def test_save_updates_images_count(self, monkeypatch):
        """Test that saving image updates complaint's images_count"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c28', password='p', phone_number='9876543241')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560015')
        assert comp.images_count == 0
        
        img = create_test_image("img.jpg")
        ComplaintImage.objects.create(complaint=comp, image=img, order=0)
        
        comp.refresh_from_db()
        assert comp.images_count == 1
    
    def test_str_representation(self, monkeypatch):
        """Test ComplaintImage string representation"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c29', password='p', phone_number='9876543242')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560016')
        
        img = create_test_image("img.jpg")
        ci = ComplaintImage.objects.create(complaint=comp, image=img, order=0)
        
        s = str(ci)
        assert 'Image for Complaint ID' in s
        assert str(comp.id) in s


@pytest.mark.django_db
class TestUpvoteMutations:
    """Mutation tests for Upvote model"""
    
    def test_upvote_unique_together(self):
        """Test unique_together constraint"""
        poster = Citizen.objects.create_user(username='c30', password='p', phone_number='9876543243')
        voter = Citizen.objects.create_user(username='c31', password='p', phone_number='9876543244')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560017')
        
        Upvote.objects.create(user=voter, complaint=comp)
        
        with pytest.raises(Exception):  # IntegrityError
            Upvote.objects.create(user=voter, complaint=comp)
    
    def test_str_representation(self):
        """Test Upvote string representation"""
        poster = Citizen.objects.create_user(username='c32', password='p', phone_number='9876543245')
        voter = Citizen.objects.create_user(username='voter', password='p', phone_number='9876543246')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560018')
        
        upvote = Upvote.objects.create(user=voter, complaint=comp)
        s = str(upvote)
        
        assert 'voter' in s
        assert 'upvoted' in s
        assert str(comp.id) in s


@pytest.mark.django_db
class TestFakeConfidenceMutations:
    """Mutation tests for Fake_Confidence model"""
    
    def test_resolve_weight_citizen(self):
        """Test weight resolution for citizen"""
        citizen = Citizen.objects.create_user(username='c33', password='p', phone_number='9876543247')
        weight = Fake_Confidence.resolve_weight_for_user(citizen)
        assert weight == 1.0
    
    def test_resolve_weight_field_worker(self):
        """Test weight resolution for field worker"""
        fw = Field_Worker.objects.create_user(username='fw3', password='p', phone_number='9876543248')
        weight = Fake_Confidence.resolve_weight_for_user(fw)
        assert weight == 100.0
    
    def test_save_sets_weight_automatically(self):
        """Test that save() sets weight automatically"""
        poster = Citizen.objects.create_user(username='c34', password='p', phone_number='9876543249')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560019')
        
        fc = Fake_Confidence.objects.create(complaint=comp, user=poster)
        assert fc.weight == 1.0
    
    def test_save_updates_complaint_confidence(self):
        """Test that save updates complaint's fake_confidence"""
        poster = Citizen.objects.create_user(username='c35', password='p', phone_number='9876543250')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560020')
        
        Fake_Confidence.objects.create(complaint=comp, user=poster)
        comp.refresh_from_db()
        assert comp.fake_confidence == 1.0
    
    def test_delete_updates_complaint_confidence(self):
        """Test that delete updates complaint's fake_confidence"""
        poster = Citizen.objects.create_user(username='c36', password='p', phone_number='9876543251')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560021')
        
        fc = Fake_Confidence.objects.create(complaint=comp, user=poster)
        comp.refresh_from_db()
        assert comp.fake_confidence == 1.0
        
        fc.delete()
        comp.refresh_from_db()
        assert comp.fake_confidence == 0.0
    
    def test_str_representation(self):
        """Test Fake_Confidence string representation"""
        poster = Citizen.objects.create_user(username='c37', password='p', phone_number='9876543252')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560022')
        
        fc = Fake_Confidence.objects.create(complaint=comp, user=poster)
        s = str(fc)
        
        assert 'c37' in s or poster.username in s
        assert 'flagged' in s
        assert str(comp.id) in s


@pytest.mark.django_db
class TestResolutionMutations:
    """Mutation tests for Resolution model"""
    
    def test_str_representation(self):
        """Test Resolution string representation"""
        poster = Citizen.objects.create_user(username='c38', password='p', phone_number='9876543253')
        fw = Field_Worker.objects.create_user(username='fw4', password='p', phone_number='9876543254')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560023')
        
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        s = str(res)
        
        assert 'Resolution for Complaint ID' in s
        assert str(comp.id) in s
        assert 'fw4' in s


@pytest.mark.django_db
class TestResolutionImageMutations:
    """Mutation tests for ResolutionImage model"""
    
    def test_clean_allows_5_images(self, monkeypatch):
        """Test that 5 images is allowed"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c39', password='p', phone_number='9876543255')
        fw = Field_Worker.objects.create_user(username='fw5', password='p', phone_number='9876543256')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560024')
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        
        for i in range(5):
            img = create_test_image(f"img{i}.jpg")
            ri = ResolutionImage(resolution=res, image=img, order=i)
            ri.clean()  # Should not raise
            ri.save()
    
    def test_clean_rejects_6th_image(self, monkeypatch):
        """Test that 6th image is rejected"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c40', password='p', phone_number='9876543257')
        fw = Field_Worker.objects.create_user(username='fw6', password='p', phone_number='9876543258')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560025')
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        
        for i in range(5):
            img = create_test_image(f"img{i}.jpg")
            ResolutionImage.objects.create(resolution=res, image=img, order=i)
        
        img6 = create_test_image("img6.jpg")
        ri6 = ResolutionImage(resolution=res, image=img6, order=6)
        
        with pytest.raises(ValidationError):
            ri6.clean()
    
    def test_save_updates_complaint_status(self, monkeypatch):
        """Test that save updates complaint status to Pending Approval"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c41', password='p', phone_number='9876543259')
        fw = Field_Worker.objects.create_user(username='fw7', password='p', phone_number='9876543260')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560026', status='In Progress')
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        
        img = create_test_image("img.jpg")
        ResolutionImage.objects.create(resolution=res, image=img, order=0)
        
        comp.refresh_from_db()
        assert comp.status == 'Pending Approval'
        assert comp.current_resolution == res
    
    def test_save_creates_notification(self, monkeypatch):
        """Test that save creates notification for citizen"""
        def mock_upload(*args, **kwargs):
            return {"public_id": "fake", "url": "http://fake.url/img.jpg",
                   "version": 123, "type": "upload", "resource_type": "image"}
        monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
        
        poster = Citizen.objects.create_user(username='c42', password='p', phone_number='9876543261')
        fw = Field_Worker.objects.create_user(username='fw8', password='p', phone_number='9876543262')
        comp = Complaint.objects.create(posted_by=poster, content='Test', address='Addr 560027')
        res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Fixed')
        
        img = create_test_image("img.jpg")
        ResolutionImage.objects.create(resolution=res, image=img, order=0)
        
        notifications = Notification.objects.filter(user=poster)
        assert notifications.exists()
        assert 'resolution' in notifications.first().message.lower()
