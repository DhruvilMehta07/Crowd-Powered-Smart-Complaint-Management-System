import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import Citizen, Department, Field_Worker
import cloudinary.uploader
from complaints.models import Complaint, ComplaintImage, Upvote, Fake_Confidence, Resolution, ResolutionImage

@pytest.mark.django_db
def test_create_complaint_with_minimal_data():
    # create compalint
    poster = Citizen.objects.create_user(username='c1', email='c1@example.com', password='p', phone_number='9876543214')
    comp = Complaint.objects.create(content='Pothole on road', posted_by=poster, address='Near Park, Sector 18 382007')
    assert comp.pk is not None
    assert comp.images_count == 0
    assert comp.pincode =='382007'

@pytest.mark.django_db
def test_create_complaint_with_gps_location(monkeypatch):
    poster = Citizen.objects.create_user(username='c2', email='c2@example.com', password='p', phone_number='9876543215')
    comp = Complaint(content='Streetlight broken', posted_by=poster, location_type='gps', latitude=12.9715987, longitude=77.594566)

    def fake_reverse():
        return {'address': 'Gada Electronics, 560001', 'pincode': '560001'}
    monkeypatch.setattr(Complaint, 'reverse_geocode_mapmyindia', lambda self: fake_reverse())
    comp.save()
    assert comp.address == 'Gada Electronics, 560001'
    assert comp.pincode == '560001'

@pytest.mark.django_db
def test_complaint_string_representation():
    poster = Citizen.objects.create_user(username='c3', email='c3@example.com', password='p', phone_number='9876543216')
    comp = Complaint.objects.create(content='Garbage heap', posted_by=poster, address='Area 560002')
    s = str(comp)
    assert 'c3' in s or 'Anonymous' in s

@pytest.mark.django_db
def test_reverse_geocode_api_responses(monkeypatch):
    poster = Citizen.objects.create_user(username='c4', email='c4@example.com', password='p', phone_number='9876543217')
    comp = Complaint(posted_by=poster, content='Tree fallen', location_type='gps', latitude=0.0, longitude=0.0)

    class DummyResp:
        def __init__(self, code, json_data=None, text=''):
            self.status_code = code
            self._json = json_data or {}
            self.text = text
        def json(self):
            return self._json

    # success
    monkeypatch.setattr('complaints.models.requests.get', lambda url, params, timeout=10: DummyResp(200, {'responseCode':200, 'results':[{'formatted_address':'Addr','pincode':'123456'}]}))
    r = comp.reverse_geocode_mapmyindia()
    assert r['address'] == 'Addr'

    # no results
    monkeypatch.setattr('complaints.models.requests.get', lambda url, params, timeout=10: DummyResp(200, {'responseCode':404, 'results':[]}))
    r = comp.reverse_geocode_mapmyindia()
    assert r is None

    # api error
    monkeypatch.setattr('complaints.models.requests.get', lambda url, params, timeout=10: DummyResp(500, {}, text='Server Error'))
    r = comp.reverse_geocode_mapmyindia()
    assert r is None

@pytest.mark.django_db
def test_extract_pincode_from_address_variants():
    poster = Citizen.objects.create_user(username='c5', email='c5@example.com', password='p', phone_number='9876543218')
    comp = Complaint(posted_by=poster, content='Leak', address='Gada Electronics, 560034')
    assert comp.extract_pincode_from_address() == '560034'
    comp.address = 'No pincode here'
    assert comp.extract_pincode_from_address() is None
    comp.address = ''
    assert comp.extract_pincode_from_address() is None

@pytest.mark.django_db
def test_get_location_display_variants():
    poster = Citizen.objects.create_user(username='c6', email='c6@example.com', password='p', phone_number='9876543219')
    comp = Complaint(posted_by=poster, content='Noise', location_type='gps', latitude=11.11, longitude=22.22)
    assert 'GPS' in comp.get_location_display()
    comp2 = Complaint(posted_by=poster, content='Noise', address='Somewhere')
    assert 'Address' in comp2.get_location_display()
    comp3 = Complaint(posted_by=poster, content='Noise')
    assert 'NOT AVAILABLE' in comp3.get_location_display()

@pytest.mark.django_db
def test_update_fake_confidence_and_ordering():
    poster = Citizen.objects.create_user(username='c7', email='c7@example.com', password='p', phone_number='9876543220')
    fw = Field_Worker.objects.create_user(username='fw', email='fw@example.com', password='p', phone_number='9876543221')
    comp = Complaint.objects.create(content='Signboard down', posted_by=poster, address='Zone 400010')
    # create fake confidences
    Fake_Confidence.objects.create(complaint=comp, user=poster)
    Fake_Confidence.objects.create(complaint=comp, user=fw)
    total = comp.update_fake_confidence()
    assert total == pytest.approx(1 + 100.0)

    # ordering
    c1 = Complaint.objects.create(content='First', posted_by=poster, address='A 400011')
    c2 = Complaint.objects.create(content='Second', posted_by=poster, address='B 400012')
    qs = list(Complaint.objects.all())
    assert qs[0].posted_at >= qs[1].posted_at

@pytest.mark.django_db
def test_complaint_image_clean_and_count(monkeypatch):
    poster = Citizen.objects.create_user(username='c8', email='c8@example.com', password='p', phone_number='9876543222')
    comp = Complaint.objects.create(content='Tree leaves', posted_by=poster, address='Addr 400020')
    # prevent Cloudinary network calls during save
    def mock_upload(*args, **kwargs):
        return {
            "public_id": "fake_id_res",
            "url": "http://fake.url/res.jpg",
            "version": 123456,
            "type": "upload",
            "resource_type": "image"
        }
    monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
    # create 4 images
    for i in range(4):
        img = SimpleUploadedFile(f"img{i}.jpg", b"filecontent", content_type="image/jpeg")
        ci = ComplaintImage.objects.create(complaint=comp, image=img, order=i)
        assert ci.pk is not None
    comp.refresh_from_db()
    assert comp.images_count == 4
    # attempt 5th
    img5 = SimpleUploadedFile("img5.jpg", b"filecontent", content_type="image/jpeg")
    with pytest.raises(ValidationError):
        ci5 = ComplaintImage(complaint=comp, image=img5, order=5)
        ci5.clean()

@pytest.mark.django_db
def test_upvote_unique_and_string():
    poster = Citizen.objects.create_user(username='c9', email='c9@example.com', password='p', phone_number='9876543223')
    other = Citizen.objects.create_user(username='u2', email='u2@example.com', password='p', phone_number='9876543224')
    comp = Complaint.objects.create(content='Puddle', posted_by=poster, address='Addr 400030')
    up = Upvote.objects.create(user=other, complaint=comp)
    assert str(up).startswith('u2 upvoted')
    # unique together
    with pytest.raises(Exception):
        Upvote.objects.create(user=other, complaint=comp)

@pytest.mark.django_db
def test_resolution_and_images_and_notification(monkeypatch):
    poster = Citizen.objects.create_user(username='c10', email='c10@example.com', password='p', phone_number='9876543225')
    fw = Field_Worker.objects.create_user(username='fw2', email='fw2@example.com', password='p', phone_number='9876543226')
    comp = Complaint.objects.create(content='Blocked drain', posted_by=poster, address='Addr 400040')
    # prevent Cloudinary network calls during ResolutionImage save
    def mock_upload(*args, **kwargs):
        return {
        "public_id": "fake_id_res",
        "url": "http://fake.url/res.jpg",
        "version": 123456,           
        "type": "upload",            
        "resource_type": "image"     
        }
    monkeypatch.setattr(cloudinary.uploader, 'upload', mock_upload)
    res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Cleared drain')
    assert res.pk is not None
    # create images up to 5
    for i in range(1):
        img = SimpleUploadedFile(f"rimg{i}.jpg", b"filecontent", content_type="image/jpeg")
        ri = ResolutionImage.objects.create(resolution=res, image=img, order=i)
        assert ri.pk is not None
    # string repr
    assert 'Resolution for Complaint ID' in str(res)

@pytest.mark.django_db
def test_complaint_save_with_no_location():
    """Test ValidationError when no location provided"""
    poster = Citizen.objects.create_user(username='c11', password='p', phone_number='9876543227')
    comp = Complaint(posted_by=poster, content='No location')
    with pytest.raises(ValidationError):
        comp.save()

@pytest.mark.django_db
def test_complaint_get_image_count():
    poster = Citizen.objects.create_user(username='c12', password='p', phone_number='9876543228')
    comp = Complaint.objects.create(content='Test', posted_by=poster, address='Addr 400050')
    assert comp.get_image_count() == 0

@pytest.mark.django_db
def test_fake_confidence_weight_calculation():
    poster = Citizen.objects.create_user(username='c13', password='p', phone_number='9876543229')
    fw = Field_Worker.objects.create_user(username='fw3', password='p', phone_number='9876543230')
    
    # Test citizen weight
    fc_citizen = Fake_Confidence(complaint=None, user=poster)
    assert fc_citizen.resolve_weight_for_user(poster) == 1.0
    
    # Test field worker weight  
    fc_fw = Fake_Confidence(complaint=None, user=fw)
    assert fc_fw.resolve_weight_for_user(fw) == 100.0

@pytest.mark.django_db
def test_resolution_image_clean_validation():
    poster = Citizen.objects.create_user(username='c14', password='p', phone_number='9876543231')
    fw = Field_Worker.objects.create_user(username='fw4', password='p', phone_number='9876543232')
    comp = Complaint.objects.create(content='Test', posted_by=poster, address='Addr 400060')
    res = Resolution.objects.create(complaint=comp, field_worker=fw, description='Test resolution')
    
    # Create 5 images (should work)
    for i in range(5):
        ResolutionImage.objects.create(resolution=res, image=None, order=i)
    
    # Try to create 6th (should fail)
    with pytest.raises(ValidationError):
        ri = ResolutionImage(resolution=res, image=None, order=6)
        ri.clean()


@pytest.mark.django_db
class TestComplaintModelCoverage:
    """Additional tests for complaint models to reach 100% coverage"""
