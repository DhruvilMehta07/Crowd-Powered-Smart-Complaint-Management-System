import pytest
import requests
import cloudinary.uploader
from django.urls import reverse
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.files.uploadedfile import SimpleUploadedFile

# use fixtures from this package's conftest (no direct import required)
from complaints.models import (
    Complaint,
    ComplaintImage,
    Resolution,
    ResolutionImage,
    Upvote,
    Fake_Confidence,
)
from notifications.models import Notification
from users.models import Citizen, Government_Authority, Field_Worker, Department


pytestmark = pytest.mark.django_db

@pytest.fixture
def pending_resolution( assigned_complaint, field_worker_user):
    """Fixture for a resolution that is pending approval."""
    resolution = Resolution.objects.create(
        complaint=assigned_complaint,
        field_worker=field_worker_user,
        description="I fixed it!",
        status='pending_approval'
    )
    assigned_complaint.current_resolution = resolution
    assigned_complaint.save()
    return resolution

@pytest.fixture
def admin_user():
    return Citizen.objects.create_superuser(username="admin", email="admin@test.com", password="pw")

@pytest.fixture
def assigned_complaint(test_complaint, field_worker_user):
    """Fixture to return a complaint assigned to our FW."""
    test_complaint.assigned_to_fieldworker = field_worker_user
    test_complaint.status = 'In Progress'
    test_complaint.save()
    return test_complaint

@pytest.fixture
def expired_resolution(pending_resolution):
    """A resolution that is old and pending."""
    pending_resolution.auto_approve_at = timezone.now() - timedelta(days=1)
    pending_resolution.save()
    return pending_resolution


# for any test that creates an image object.
@pytest.fixture
def mock_cloudinary_upload(monkeypatch):
    """
    Mocks cloudinary.uploader.upload to prevent real network calls
    and returns a dictionary that satisfies the CloudinaryField.
    """
    def mock_upload(*args, **kwargs):
        return {
            "public_id": "fake_public_id",
            "url": "http://fake.cloudinary.com/image.jpg",
            "version": 1234567890,
            "type": "upload",
            "resource_type": "image"
        }
    
    monkeypatch.setattr(cloudinary.uploader, "upload", mock_upload)



class TestComplaintListView:
    def test_list_complaints(self, client, test_complaint):
        url = reverse('complaints:complaint-list') # Assumes name='complaint-list'
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]['content'] == test_complaint.content

class TestComplaintCreateView:
    def test_create_unauthenticated(self, client):
        url = reverse('complaints:complaint-create')
        res = client.post(url, {})
        assert res.status_code == 401 # IsAuthenticated fails

    def test_create_invalid_data(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-create')
        res = client.post(url, {}) # Missing all required fields
        
        assert res.status_code == 400
        assert 'content' in res.json()
        assert Complaint.objects.count() == 0

    def test_create_success_with_image(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-create')
        
        # Create a proper fake image file
        from PIL import Image
        import io
        
        image = Image.new('RGB', (100, 100), color='red')
        image_file = io.BytesIO()
        image.save(image_file, 'JPEG')
        image_file.seek(0)
        
        img = SimpleUploadedFile(
            "fake.jpg", 
            image_file.read(), 
            content_type="image/jpeg"
        )
        
        data = {
            'content': 'A terrible pothole',
            'address': '123 Pothole Ave',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'images': img  
        }
        
        res = client.post(url, data, format='multipart')
        
        if res.status_code != 201:
            print(f"Create complaint error: {res.json()}")
        
        assert res.status_code == 201
        assert Complaint.objects.count() == 1


class TestUpvoteComplaintView:
    def test_upvote_create_and_remove(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:complaint-upvote', kwargs={'complaint_id': test_complaint.id})
        
        #add upvote
        res_add = client.post(url)
        assert res_add.status_code == 200
        assert res_add.json()['message'] == 'Complaint upvoted.'
        assert res_add.json()['likes_count'] == 1
        test_complaint.refresh_from_db()
        assert test_complaint.upvotes_count == 1
        assert Upvote.objects.count() == 1

        # remove upvote
        res_remove = client.post(url)
        assert res_remove.status_code == 200
        assert res_remove.json()['detail'] == 'Upvote removed.'
        test_complaint.refresh_from_db()
        assert test_complaint.upvotes_count == 0
        assert Upvote.objects.count() == 0

    class TestComplaintDeleteView:
        
        def test_delete_by_owner(self, client, citizen_user, test_complaint):
            assert test_complaint.posted_by_id == citizen_user.id

            # Authenticate the actual Django auth user (not the profile)
            # If Citizen has a OneToOneField to User named `user`
            client.force_authenticate(user=citizen_user)
            

            url = reverse('complaints:complaint-delete', kwargs={'complaint_id': test_complaint.id})
            res = client.delete(url)

            assert res.status_code != 500

    def test_delete_by_other_user(self, client, other_citizen_user, test_complaint):
        client.force_authenticate(user=other_citizen_user )
        url = reverse('complaints:complaint-delete', kwargs={'complaint_id': test_complaint.id})
        res = client.delete(url)
        
        assert res.status_code == 403
        assert "You can only delete your own complaints" in res.json()['error']
        assert Complaint.objects.count() == 1 #not deleted

class TestReverseGeocodeView:
    
    @pytest.fixture
    def mock_requests_get(self, monkeypatch):
        """Mocks requests.get to return a controlled response."""
        class MockResponse:
            status_code = 200
            text = '{"results": [{"formatted_address": "Mock Address"}]}'
            
            def __init__(self, status=200, json_data=None):
                self.status_code = status
                self._json_data = json_data or {
                    "responseCode": 200,
                    "results": [{
                        "formatted_address": "Mocked Address, Mock City",
                        "pincode": "12345",
                        "city": "Mock City",
                        "state": "Mock State",
                        "district": "Mock District"
                    }]
                }
            
            def json(self):
                return self._json_data
            
            def raise_for_status(self):
                if self.status_code != 200:
                    raise requests.exceptions.HTTPError("API Error")

        def mock_get(url, params=None, **kwargs):
            if "fail" in url:
                return MockResponse(status=500, json_data={"error": "failed"})
            return MockResponse()

        monkeypatch.setattr(requests, "get", mock_get)

    def test_geocode_success(self, client, citizen_user, monkeypatch, mock_requests_get):
        client.force_authenticate(user=citizen_user )
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '10.0', 'longitude': '20.0'}
        
        res = client.post(url, data)
        
        assert res.status_code == 200
        assert res.json()['success'] == True
        assert res.json()['data']['address'] == "Mocked Address, Mock City"
        assert res.json()['data']['pincode'] == "12345"

    def test_geocode_no_key(self, client, citizen_user, monkeypatch):
        client.force_authenticate(user=citizen_user )
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', None)
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '', 'longitude': ''}
        
        res = client.post(url, data)
        
        assert res.status_code == 400

    def test_geocode_missing_coords(self, client, citizen_user):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '', 'longitude': ''}
        
        res = client.post(url, data)
        
        assert res.status_code == 400
        assert "Latitude and longitude are required" in res.json()['error']

class TestComplaintSearchView:
    def test_search_found(self, client, test_complaint):
        url = reverse('complaints:complaint-search') + '?q=content'
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]['id'] == test_complaint.id

    def test_search_not_found(self, client, test_complaint):
        url = reverse('complaints:complaint-search') + '?q=nomatch'
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 0

class TestPastComplaintsView:
    def test_get_my_complaints(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:past-complaints')
        res = client.get(url)
        
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]['id'] == test_complaint.id

    def test_get_my_complaints_empty(self, client, other_citizen_user, test_complaint):
        client.force_authenticate(user=other_citizen_user )
        url = reverse('complaints:past-complaints')
        res = client.get(url)
        
        assert res.status_code == 200
        assert len(res.json()) == 0 # User has no complaints

class TestGovernmentHomePageView:
    def test_gov_home_success(self, client, gov_user, test_complaint):
        client.force_authenticate(user=gov_user )
        url = reverse('complaints:gov-home')
        
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 1 # test_complaint is 'Pending'
        assert res.json()[0]['id'] == test_complaint.id

    def test_gov_home_not_gov(self, client, citizen_user):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:gov-home')
        res = client.get(url)
        assert res.status_code == 403 # Fails Government_Authority.DoesNotExist

class TestFieldWorkerHomePageView:
    def test_fw_home_with_complaint(self, client, field_worker_user, test_complaint):
        # Assign complaint to FW
        test_complaint.assigned_to_fieldworker = field_worker_user
        test_complaint.status = 'In Progress'
        test_complaint.save()
        
        client.force_authenticate(user=field_worker_user )
        url = reverse('complaints:fw-home')
        
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]['id'] == test_complaint.id

    def test_fw_home_no_complaints(self, client, field_worker_user):
        client.force_authenticate(user=field_worker_user )
        url = reverse('complaints:fw-home')
        res = client.get(url)
        
        assert res.status_code == 200
        assert "No pending complaints" in res.json()['message']

class TestAssignComplaintView:
    def test_assign_success(self, client, gov_user, field_worker_user, test_complaint):
        client.force_authenticate(user=gov_user )
        url = reverse('complaints:complaint-assign', kwargs={'complaint_id': test_complaint.id})
        data = {'fieldworker_id': field_worker_user.id}
        
        res = client.post(url, data, content_type='application/json')
        
        assert res.status_code == 200
        assert "Complaint assigned" in res.json()['message']
        test_complaint.refresh_from_db()
        assert test_complaint.assigned_to_fieldworker == field_worker_user
        assert test_complaint.status == 'In Progress'

    def test_assign_fw_not_in_dept(self, client, gov_user, department, test_complaint):
        # Create FW in a different department
        other_dept = Department.objects.create(name="Health")
        other_fw = Field_Worker.objects.create_user(
            username="fw2", password="pw", assigned_department=other_dept, verified=True
        )
        
        client.force_authenticate(user=gov_user )
        url = reverse('complaints:complaint-assign', kwargs={'complaint_id': test_complaint.id})
        data = {'fieldworker_id': other_fw.id}
        
        res = client.post(url, data, content_type='application/json')
        
        assert res.status_code == 404 # Field worker not found in their dept
        assert "Field worker not found" in res.json()['error']

class TestSubmitResolutionView:
    def test_submit_resolution_success(self, client, field_worker_user, gov_user, assigned_complaint, mock_cloudinary_upload):
        client.force_authenticate(user=field_worker_user)
        
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': assigned_complaint.id})
        
        data = {
            'description': 'All fixed!',
            
        }
        
        res = client.post(url, data, format='multipart')
        
        if res.status_code != 201:
            print(f"Submit resolution error: {res.json()}")
        
        assert res.status_code == 201
        assert "Resolution submitted" in res.json()['message']

    def test_citizen_reject_resolution(self, client, citizen_user, gov_user, pending_resolution):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:resolution-response', kwargs={
            'complaint_id': pending_resolution.complaint.id,
            'resolution_id': pending_resolution.id
        })
        data = {'approved': False, 'feedback': 'It is still broken.'}
        
        res = client.post(url, data, content_type='application/json')
        
        assert res.status_code == 200
        assert "Resolution rejected" in res.json()['message']
        
        pending_resolution.refresh_from_db()
        pending_resolution.complaint.refresh_from_db()
        
        assert pending_resolution.status == 'rejected'
        assert pending_resolution.complaint.status == 'Escalated'
        assert pending_resolution.complaint.assigned_to_fieldworker is None # Unassigned
        
        # Check notification for gov user
        assert Notification.objects.filter(user=gov_user).exists()
        assert "was rejected by citizen" in Notification.objects.first().message

    def test_citizen_approve_not_owner(self, client, other_citizen_user, pending_resolution):
        client.force_authenticate(user=other_citizen_user )
        url = reverse('complaints:resolution-response', kwargs={
            'complaint_id': pending_resolution.complaint.id,
            'resolution_id': pending_resolution.id
        })
        data = {'approved': True}
        
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 403
        assert "Only the complaint owner" in res.json()['error']

class TestAutoApproveResolutionsView:
    def test_auto_approve_success(self, client, admin_user, expired_resolution):
        client.force_authenticate(user=admin_user )
        url = reverse('complaints:auto-approve')
        
        res = client.post(url)
        
        assert res.status_code == 200
        assert res.json()['auto_approved_count'] == 1
        
        expired_resolution.refresh_from_db()
        expired_resolution.complaint.refresh_from_db()
        
        assert expired_resolution.status == 'auto_approved'
        assert expired_resolution.complaint.status == 'Completed'
        assert "Auto-approved" in expired_resolution.citizen_feedback

    def test_auto_approve_not_admin(self, client, citizen_user, expired_resolution):
        client.force_authenticate(user=citizen_user )
        url = reverse('complaints:auto-approve')
        res = client.post(url)
        assert res.status_code == 403 # IsAdminUser fails

class TestComplaintCreateViewEdgeCases:
    def test_create_complaint_with_gps_but_no_coords(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-create')
        data = {
            'content': 'Test complaint',
            'location_type': 'gps',
            'address': ''  # No address, but also no coordinates
        }
        res = client.post(url, data)
        assert res.status_code == 400
        assert "GPS coordinates are required" in str(res.json())

class TestReverseGeocodeViewEdgeCases:
    def test_geocode_timeout(self, client, citizen_user, monkeypatch):
        client.force_authenticate(user=citizen_user)
        
        def mock_timeout(*args, **kwargs):
            raise requests.exceptions.Timeout("Timeout")
        
        monkeypatch.setattr(requests, 'get', mock_timeout)
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '10.0', 'longitude': '20.0'}
        res = client.post(url, data)
        assert res.status_code == 408

class TestFakeConfidenceView:
    def test_delete_nonexistent_fake_confidence(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-fake-confidence', kwargs={'complaint_id': test_complaint.id})
        res = client.delete(url)
        assert res.status_code == 404

class TestSubmitResolutionViewEdgeCases:
    def test_submit_resolution_not_assigned(self, client, field_worker_user, test_complaint):
        # Field worker not assigned to this complaint
        client.force_authenticate(user=field_worker_user)
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': test_complaint.id})
        data = {'description': 'Test resolution'}
        res = client.post(url, data)
        assert res.status_code == 403

    def test_submit_resolution_already_pending(self, client, field_worker_user, assigned_complaint):
        # Create a pending resolution first
        Resolution.objects.create(
            complaint=assigned_complaint,
            field_worker=field_worker_user,
            description="First resolution",
            status='pending_approval'
        )
        
        client.force_authenticate(user=field_worker_user)
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': assigned_complaint.id})
        data = {'description': 'Second resolution'}
        res = client.post(url, data)
        assert res.status_code == 400

class TestComplaintCreateViewMoreEdgeCases:
    def test_create_complaint_manual_no_address(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-create')
        data = {
            'content': 'Test complaint',
            'location_type': 'manual',
            # No address provided for manual location
        }
        res = client.post(url, data)
        assert res.status_code == 400
        assert "Address is required" in str(res.json())

    def test_create_complaint_invalid_pincode(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-create')
        data = {
            'content': 'Test complaint',
            'address': '123 Test St',
            'pincode': 'invalid'  # Invalid pincode format
        }
        res = client.post(url, data)
        assert res.status_code == 400
        assert "Pincode must be 6 digits" in str(res.json())

class TestReverseGeocodeViewMoreEdgeCases:
    def test_geocode_network_error(self, client, citizen_user, monkeypatch):
        client.force_authenticate(user=citizen_user)
        
        def mock_network_error(*args, **kwargs):
            raise requests.exceptions.RequestException("Network error")
        
        monkeypatch.setattr(requests, 'get', mock_network_error)
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '10.0', 'longitude': '20.0'}
        res = client.post(url, data)
        assert res.status_code == 500

    def test_geocode_api_error_response(self, client, citizen_user, monkeypatch):
        client.force_authenticate(user=citizen_user)
        
        class MockErrorResponse:
            status_code = 200
            def json(self):
                return {
                    "responseCode": 400,
                    "results": []
                }
        
        monkeypatch.setattr(requests, 'get', lambda *args, **kwargs: MockErrorResponse())
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '10.0', 'longitude': '20.0'}
        res = client.post(url, data)
        assert res.status_code == 500

    def test_geocode_unexpected_error(self, client, citizen_user, monkeypatch):
        client.force_authenticate(user=citizen_user)
        
        def mock_unexpected_error(*args, **kwargs):
            raise Exception("Unexpected error")
        
        monkeypatch.setattr(requests, 'get', mock_unexpected_error)
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        url = reverse('complaints:reverse-geocode')
        data = {'latitude': '10.0', 'longitude': '20.0'}
        res = client.post(url, data)
        assert res.status_code == 500

class TestGovernmentHomePageViewEdgeCases:
    def test_gov_home_no_department(self, client, gov_user, monkeypatch):
        # Remove department from gov_user
        gov_user.assigned_department = None
        gov_user.save()
        
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:gov-home')
        res = client.get(url)
        assert res.status_code == 400
        assert "No department assigned" in res.json()['error']

class TestFieldWorkerHomePageViewEdgeCases:
    def test_fw_home_not_field_worker(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:fw-home')
        res = client.get(url)
        assert res.status_code == 403
        assert "User is not a field worker" in res.json()['error']

class TestAvailableFieldWorkersView:
    def test_available_workers_success(self, client, gov_user, field_worker_user):
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:available-workers')
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]['username'] == field_worker_user.username

    def test_available_workers_with_complaint(self, client, gov_user, field_worker_user, test_complaint):
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:available-worker', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 200

    def test_available_workers_wrong_department_complaint(self, client, gov_user, department, test_complaint):
        # Create complaint in different department
        other_dept = Department.objects.create(name="Other Dept")
        test_complaint.assigned_to_dept = other_dept
        test_complaint.save()
        
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:available-worker', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 403
        assert "only assign complaints from your department" in res.json()['error']

    def test_available_workers_not_gov_user(self, client, citizen_user):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:available-workers')
        res = client.get(url)
        assert res.status_code == 403
        assert "User is not a government authority" in res.json()['error']

    def test_available_workers_no_department(self, client, gov_user, monkeypatch):
        gov_user.assigned_department = None
        gov_user.save()
        
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:available-workers')
        res = client.get(url)
        assert res.status_code == 400
        assert "No department assigned" in res.json()['error']

class TestAssignComplaintViewEdgeCases:
    def test_assign_no_fieldworker_id(self, client, gov_user, test_complaint):
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:complaint-assign', kwargs={'complaint_id': test_complaint.id})
        data = {}  # No fieldworker_id
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 400
        assert "fieldworker_id is required" in res.json()['error']

    def test_assign_wrong_department(self, client, gov_user, department, test_complaint):
        # Create complaint in different department
        other_dept = Department.objects.create(name="Other Dept")
        test_complaint.assigned_to_dept = other_dept
        test_complaint.save()
        
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:complaint-assign', kwargs={'complaint_id': test_complaint.id})
        data = {'fieldworker_id': 999}  # Doesn't matter since department check fails first
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 403
        assert "only assign complaints from your department" in res.json()['error']

    def test_assign_not_gov_user(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-assign', kwargs={'complaint_id': test_complaint.id})
        data = {'fieldworker_id': 1}
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 403
        assert "User is not a government authority" in res.json()['error']

class TestComplaintImageView:
    def test_complaint_images_success(self, client, citizen_user, test_complaint, mock_cloudinary_upload):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-images', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 200
        assert len(res.json()) == 0  # No images initially

class TestFakeConfidenceViewMore:
    def test_create_fake_confidence_success(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-fake-confidence', kwargs={'complaint_id': test_complaint.id})
        res = client.post(url)
        assert res.status_code == 201
        assert "Fake confidence recorded" in res.json()['message']

    def test_create_fake_confidence_already_exists(self, client, citizen_user, test_complaint):
        # Create first fake confidence
        Fake_Confidence.objects.create(complaint=test_complaint, user=citizen_user)
        
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-fake-confidence', kwargs={'complaint_id': test_complaint.id})
        res = client.post(url)
        assert res.status_code == 200
        assert "Fake confidence already recorded" in res.json()['message']

class TestSubmitResolutionViewMoreEdgeCases:
    def test_submit_resolution_not_field_worker(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': test_complaint.id})
        data = {'description': 'Test resolution'}
        res = client.post(url, data)
        assert res.status_code == 403
        assert "Only field workers can submit resolutions" in res.json()['error']

    def test_submit_resolution_invalid_data(self, client, field_worker_user, assigned_complaint):
        client.force_authenticate(user=field_worker_user)
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': assigned_complaint.id})
        data = {}  # No description
        res = client.post(url, data)
        assert res.status_code == 400
        assert 'description' in res.json()

class TestCitizenResolutionResponseViewMore:
    def test_citizen_approve_resolution_success(self, client, citizen_user, pending_resolution):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:resolution-response', kwargs={
            'complaint_id': pending_resolution.complaint.id,
            'resolution_id': pending_resolution.id
        })
        data = {'approved': True}
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 200
        assert "Resolution approved" in res.json()['message']
        
        pending_resolution.refresh_from_db()
        assert pending_resolution.status == 'approved'
        assert pending_resolution.complaint.status == 'Completed'

    def test_citizen_response_already_processed(self, client, citizen_user, pending_resolution):
        # Mark resolution as already processed
        pending_resolution.status = 'approved'
        pending_resolution.save()
        
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:resolution-response', kwargs={
            'complaint_id': pending_resolution.complaint.id,
            'resolution_id': pending_resolution.id
        })
        data = {'approved': True}
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 400
        assert "already been processed" in res.json()['error']

    def test_citizen_reject_no_feedback(self, client, citizen_user, pending_resolution):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:resolution-response', kwargs={
            'complaint_id': pending_resolution.complaint.id,
            'resolution_id': pending_resolution.id
        })
        data = {'approved': False, 'feedback': ''}  # No feedback for rejection
        res = client.post(url, data, content_type='application/json')
        assert res.status_code == 400

class TestComplaintResolutionView:
    def test_complaint_resolution_complaint_owner(self, client, citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:resolution-response', kwargs={'complaint_id': test_complaint.id})
        res = client.post(url)
        assert res.status_code != 200

    def test_complaint_resolution_assigned_field_worker(self, client, field_worker_user, assigned_complaint):
        client.force_authenticate(user=field_worker_user)
        url = reverse('complaints:resolution-response', kwargs={'complaint_id': assigned_complaint.id})
        res = client.get(url)
        assert res.status_code == 200

    def test_complaint_resolution_gov_user(self, client, gov_user, test_complaint):
        client.force_authenticate(user=gov_user)
        url = reverse('complaints:resolution-response', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 200

    def test_complaint_resolution_no_permission(self, client, other_citizen_user, test_complaint):
        client.force_authenticate(user=other_citizen_user)
        url = reverse('complaints:resolution-response', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 403
        assert "don't have permission" in res.json()['error']

    def test_complaint_resolution_resolved_status(self, client, other_citizen_user, test_complaint):
        # Mark complaint as resolved - should allow viewing
        test_complaint.status = 'Resolved'
        test_complaint.save()
        
        client.force_authenticate(user=other_citizen_user)
        url = reverse('complaints:resolution-response', kwargs={'complaint_id': test_complaint.id})
        res = client.get(url)
        assert res.status_code == 200

class TestAutoApproveResolutionsViewMore:
    def test_auto_approve_no_expired_resolutions(self, client, admin_user):
        client.force_authenticate(user=admin_user)
        url = reverse('complaints:auto-approve')
        res = client.post(url)
        assert res.status_code == 200
        assert res.json()['auto_approved_count'] == 0

# Test for notification creation in various scenarios
class TestNotificationCreation:
    def test_notification_created_on_resolution_submission(self, client, field_worker_user, assigned_complaint, mock_cloudinary_upload):
        client.force_authenticate(user=field_worker_user)
        url = reverse('complaints:resolution-submit', kwargs={'complaint_id': assigned_complaint.id})
        data = {'description': 'Fixed the issue'}
        
        res = client.post(url, data, format='multipart')
        assert res.status_code == 201
        
        # Check notification was created for citizen
        assert Notification.objects.filter(user=assigned_complaint.posted_by).exists()
        
        # Check notification was created for gov user
        gov_users = Government_Authority.objects.filter(
            assigned_department=assigned_complaint.assigned_to_dept
        )
        if gov_users.exists():
            assert Notification.objects.filter(user=gov_users.first()).exists()

# Test for upvote count recalculation
class TestUpvoteCountRecalculation:
    def test_upvote_count_accurate_after_multiple_operations(self, client, citizen_user, other_citizen_user, test_complaint):
        client.force_authenticate(user=citizen_user)
        url = reverse('complaints:complaint-upvote', kwargs={'complaint_id': test_complaint.id})
        
        # First upvote
        res1 = client.post(url)
        assert res1.status_code == 200
        assert res1.json()['likes_count'] == 1
        
        # Second upvote from different user
        client.force_authenticate(user=other_citizen_user)
        res2 = client.post(url)
        assert res2.status_code == 200
        assert res2.json()['likes_count'] == 2
        
        # Remove first upvote
        client.force_authenticate(user=citizen_user)
        res3 = client.post(url)
        assert res3.status_code == 200
        assert res3.json()['detail'] == 'Upvote removed.'
        test_complaint.refresh_from_db()
        assert test_complaint.upvotes_count == 1