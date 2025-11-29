"""
Mutation tests for complaints/views.py

These tests focus on:
- All response status codes
- Branch coverage for conditions
- Permission checks
- Error handling paths
- Edge cases in request handling
"""
import pytest
import requests
from unittest.mock import Mock, patch, MagicMock
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from PIL import Image
import io
import cloudinary.uploader

from users.models import Citizen, Government_Authority, Field_Worker, Department
from complaints.models import (
    Complaint, ComplaintImage, Upvote, Fake_Confidence,
    Resolution, ResolutionImage
)
from notifications.models import Notification


@pytest.mark.django_db
class TestTrendingComplaintsViewMutations:
    """Mutation tests for TrendingComplaintsView"""
    
    def test_default_limit_3(self, api_client):
        """Test default limit is 3"""
        user = Citizen.objects.create_user(username='u1', password='p', phone_number='9876543210')
        for i in range(5):
            Complaint.objects.create(content=f'Test{i}', posted_by=user, address=f'Addr {i} 560001')
        
        response = api_client.get(reverse('complaints:trending-complaints'))
        assert response.status_code == 200
        assert len(response.json()) <= 3
    
    def test_custom_limit(self, api_client):
        """Test custom limit parameter"""
        user = Citizen.objects.create_user(username='u2', password='p', phone_number='9876543211')
        for i in range(10):
            Complaint.objects.create(content=f'Test{i}', posted_by=user, address=f'Addr {i} 560002')
        
        response = api_client.get(reverse('complaints:trending-complaints') + '?limit=5')
        assert response.status_code == 200
        assert len(response.json()) <= 5
    
    def test_invalid_limit_uses_default(self, api_client):
        """Test invalid limit falls back to default"""
        user = Citizen.objects.create_user(username='u3', password='p', phone_number='9876543212')
        for i in range(5):
            Complaint.objects.create(content=f'Test{i}', posted_by=user, address=f'Addr {i} 560003')
        
        response = api_client.get(reverse('complaints:trending-complaints') + '?limit=invalid')
        assert response.status_code == 200
        assert len(response.json()) <= 3
    
    def test_negative_limit_uses_default(self, api_client):
        """Test negative limit uses default"""
        user = Citizen.objects.create_user(username='u4', password='p', phone_number='9876543213')
        Complaint.objects.create(content='Test', posted_by=user, address='Addr 560004')
        
        response = api_client.get(reverse('complaints:trending-complaints') + '?limit=-5')
        assert response.status_code == 200


@pytest.mark.django_db
class TestComplaintListViewMutations:
    """Mutation tests for ComplaintListView"""
    
    def test_filter_by_department(self, api_client, department, citizen_user):
        """Test filtering by department"""
        other_dept = Department.objects.create(name='Other Dept')
        comp1 = Complaint.objects.create(content='Test1', posted_by=citizen_user, 
                                        address='Addr1 560005', assigned_to_dept=department)
        comp2 = Complaint.objects.create(content='Test2', posted_by=citizen_user,
                                        address='Addr2 560006', assigned_to_dept=other_dept)
        
        response = api_client.get(reverse('complaints:complaint-list') + f'?department={department.id}')
        assert response.status_code == 200
        data = response.json()
        ids = [c['id'] for c in data]
        assert comp1.id in ids
        assert comp2.id not in ids
    
    def test_filter_by_pincode(self, api_client, citizen_user):
        """Test filtering by pincode"""
        comp1 = Complaint.objects.create(content='Test1', posted_by=citizen_user,
                                        address='Addr1 560007', pincode='560007')
        comp2 = Complaint.objects.create(content='Test2', posted_by=citizen_user,
                                        address='Addr2 560008', pincode='560008')
        
        response = api_client.get(reverse('complaints:complaint-list') + '?pincode=560007')
        assert response.status_code == 200
        data = response.json()
        ids = [c['id'] for c in data]
        assert comp1.id in ids
        assert comp2.id not in ids
    
    def test_sort_by_latest_desc(self, api_client, citizen_user):
        """Test sorting by latest (desc)"""
        comp1 = Complaint.objects.create(content='First', posted_by=citizen_user, address='Addr1 560009')
        comp2 = Complaint.objects.create(content='Second', posted_by=citizen_user, address='Addr2 560010')
        
        response = api_client.get(reverse('complaints:complaint-list') + '?sort_by=latest&order=desc')
        assert response.status_code == 200
        data = response.json()
        assert data[0]['id'] == comp2.id  # Latest first
    
    def test_sort_by_latest_asc(self, api_client, citizen_user):
        """Test sorting by latest (asc)"""
        comp1 = Complaint.objects.create(content='First', posted_by=citizen_user, address='Addr1 560011')
        comp2 = Complaint.objects.create(content='Second', posted_by=citizen_user, address='Addr2 560012')
        
        response = api_client.get(reverse('complaints:complaint-list') + '?sort_by=latest&order=asc')
        assert response.status_code == 200
        data = response.json()
        assert data[0]['id'] == comp1.id  # Oldest first
    
    def test_sort_by_upvotes(self, api_client, citizen_user):
        """Test sorting by upvotes"""
        comp1 = Complaint.objects.create(content='Few', posted_by=citizen_user, address='Addr1 560013', upvotes_count=1)
        comp2 = Complaint.objects.create(content='Many', posted_by=citizen_user, address='Addr2 560014', upvotes_count=10)
        
        response = api_client.get(reverse('complaints:complaint-list') + '?sort_by=upvotes&order=desc')
        assert response.status_code == 200
        data = response.json()
        if len(data) >= 2:
            assert data[0]['id'] == comp2.id
    
    def test_invalid_sort_by_uses_default(self, api_client, citizen_user):
        """Test invalid sort_by uses default"""
        Complaint.objects.create(content='Test', posted_by=citizen_user, address='Addr 560015')
        
        response = api_client.get(reverse('complaints:complaint-list') + '?sort_by=invalid')
        assert response.status_code == 200


@pytest.mark.django_db
class TestComplaintCreateViewMutations:
    """Mutation tests for ComplaintCreateView"""
    
    def test_unauthenticated_returns_401(self, api_client):
        """Test unauthenticated user gets 401"""
        response = api_client.post(reverse('complaints:complaint-create'), {})
        assert response.status_code == 401
    
    def test_invalid_data_returns_400(self, api_client, citizen_user):
        """Test invalid data returns 400"""
        api_client.force_authenticate(user=citizen_user)
        response = api_client.post(reverse('complaints:complaint-create'), {})
        assert response.status_code == 400
    
    def test_successful_create_notifies_gov_users(self, api_client, citizen_user, department, gov_user):
        """Test successful creation notifies government users"""
        api_client.force_authenticate(user=citizen_user)
        
        data = {
            'content': 'New complaint',
            'address': '123 Test St',
            'location_type': 'manual',
            'assigned_to_dept': department.id
        }
        
        response = api_client.post(reverse('complaints:complaint-create'), data)
        assert response.status_code == 201
        
        # Check notification
        notifications = Notification.objects.filter(user=gov_user)
        assert notifications.exists()


@pytest.mark.django_db
class TestUpvoteComplaintViewMutations:
    """Mutation tests for UpvoteComplaintView"""
    
    def test_first_upvote_creates(self, api_client, citizen_user, test_complaint):
        """Test first upvote creates entry"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:complaint-upvote', 
                                          kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        assert 'upvoted' in response.json()['message'].lower()
        assert Upvote.objects.filter(user=citizen_user, complaint=test_complaint).exists()
    
    def test_second_upvote_removes(self, api_client, citizen_user, test_complaint):
        """Test second upvote removes entry"""
        api_client.force_authenticate(user=citizen_user)
        Upvote.objects.create(user=citizen_user, complaint=test_complaint)
        
        response = api_client.post(reverse('complaints:complaint-upvote',
                                          kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        assert 'removed' in response.json()['detail'].lower()
        assert not Upvote.objects.filter(user=citizen_user, complaint=test_complaint).exists()
    
    def test_upvote_updates_count(self, api_client, citizen_user, test_complaint):
        """Test upvote updates complaint count"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:complaint-upvote',
                                          kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        
        test_complaint.refresh_from_db()
        assert test_complaint.upvotes_count == 1


@pytest.mark.django_db
class TestComplaintDeleteViewMutations:
    """Mutation tests for ComplaintDeleteView"""
    
    def test_owner_can_delete(self, api_client, citizen_user, test_complaint):
        """Test owner can delete their complaint"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.delete(reverse('complaints:complaint-delete',
                                            kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        assert not Complaint.objects.filter(id=test_complaint.id).exists()
    
    def test_non_owner_cannot_delete(self, api_client, other_citizen_user, test_complaint):
        """Test non-owner cannot delete"""
        api_client.force_authenticate(user=other_citizen_user)
        
        response = api_client.delete(reverse('complaints:complaint-delete',
                                            kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 403
        assert Complaint.objects.filter(id=test_complaint.id).exists()


@pytest.mark.django_db
class TestReverseGeocodeViewMutations:
    """Mutation tests for ReverseGeocodeView"""
    
    def test_missing_coords_returns_400(self, api_client, citizen_user):
        """Test missing coordinates returns 400"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:reverse-geocode'), {})
        assert response.status_code == 400
    
    def test_empty_coords_returns_400(self, api_client, citizen_user):
        """Test empty coordinates returns 400"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:reverse-geocode'), 
                                   {'latitude': '', 'longitude': ''})
        assert response.status_code == 400
    
    def test_no_api_key_returns_500(self, api_client, citizen_user, monkeypatch):
        """Test no API key returns 500"""
        api_client.force_authenticate(user=citizen_user)
        
        from django.conf import settings
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', '')
        
        response = api_client.post(reverse('complaints:reverse-geocode'),
                                   {'latitude': '12.9', 'longitude': '77.6'})
        assert response.status_code == 500
    
    def test_api_success_returns_data(self, api_client, citizen_user, monkeypatch):
        """Test successful API call returns data"""
        api_client.force_authenticate(user=citizen_user)
        
        from django.conf import settings
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 200
            text = 'success'
            def json(self):
                return {
                    'responseCode': 200,
                    'results': [{
                        'formatted_address': 'Test Address',
                        'pincode': '560001',
                        'city': 'Test City',
                        'state': 'Test State',
                        'district': 'Test District'
                    }]
                }
        
        monkeypatch.setattr(requests, 'get', lambda *a, **k: MockResponse())
        
        response = api_client.post(reverse('complaints:reverse-geocode'),
                                   {'latitude': '12.9', 'longitude': '77.6'})
        assert response.status_code == 200
        assert response.json()['success'] is True
        assert 'Test Address' in response.json()['data']['address']
    
    def test_api_no_results_returns_404(self, api_client, citizen_user, monkeypatch):
        """Test API with no results returns 404"""
        api_client.force_authenticate(user=citizen_user)
        
        from django.conf import settings
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        class MockResponse:
            status_code = 200
            text = 'no results'
            def json(self):
                return {'responseCode': 404, 'results': []}
        
        monkeypatch.setattr(requests, 'get', lambda *a, **k: MockResponse())
        
        response = api_client.post(reverse('complaints:reverse-geocode'),
                                   {'latitude': '0.0', 'longitude': '0.0'})
        assert response.status_code == 404
    
    def test_api_timeout_returns_408(self, api_client, citizen_user, monkeypatch):
        """Test API timeout returns 408"""
        api_client.force_authenticate(user=citizen_user)
        
        from django.conf import settings
        monkeypatch.setattr(settings, 'MAPMYINDIA_API_KEY', 'fake_key')
        
        def mock_get(*a, **k):
            raise requests.exceptions.Timeout('Timeout')
        
        monkeypatch.setattr(requests, 'get', mock_get)
        
        response = api_client.post(reverse('complaints:reverse-geocode'),
                                   {'latitude': '12.9', 'longitude': '77.6'})
        assert response.status_code == 408


@pytest.mark.django_db
class TestComplaintSearchViewMutations:
    """Mutation tests for ComplaintSearchView"""
    
    def test_search_by_content(self, api_client, citizen_user):
        """Test search by content"""
        comp1 = Complaint.objects.create(content='pothole issue', posted_by=citizen_user, address='Addr 560016')
        comp2 = Complaint.objects.create(content='water leak', posted_by=citizen_user, address='Addr 560017')
        
        response = api_client.get(reverse('complaints:complaint-search') + '?q=pothole')
        assert response.status_code == 200
        ids = [c['id'] for c in response.json()]
        assert comp1.id in ids
        assert comp2.id not in ids
    
    def test_search_by_address(self, api_client, citizen_user):
        """Test search by address"""
        comp1 = Complaint.objects.create(content='Issue', posted_by=citizen_user, address='Near Park 560018')
        comp2 = Complaint.objects.create(content='Issue', posted_by=citizen_user, address='Near Mall 560019')
        
        response = api_client.get(reverse('complaints:complaint-search') + '?q=Park')
        assert response.status_code == 200
        ids = [c['id'] for c in response.json()]
        assert comp1.id in ids
    
    def test_empty_search_returns_all(self, api_client, citizen_user):
        """Test empty search returns all complaints"""
        Complaint.objects.create(content='Test1', posted_by=citizen_user, address='Addr1 560020')
        Complaint.objects.create(content='Test2', posted_by=citizen_user, address='Addr2 560021')
        
        response = api_client.get(reverse('complaints:complaint-search') + '?q=')
        assert response.status_code == 200
        assert len(response.json()) >= 2


@pytest.mark.django_db
class TestPastComplaintsViewMutations:
    """Mutation tests for PastComplaintsView"""
    
    def test_returns_only_user_complaints(self, api_client, citizen_user, other_citizen_user):
        """Test returns only requesting user's complaints"""
        comp1 = Complaint.objects.create(content='My complaint', posted_by=citizen_user, address='Addr 560022')
        comp2 = Complaint.objects.create(content='Other complaint', posted_by=other_citizen_user, address='Addr 560023')
        
        api_client.force_authenticate(user=citizen_user)
        response = api_client.get(reverse('complaints:past-complaints'))
        
        assert response.status_code == 200
        ids = [c['id'] for c in response.json()]
        assert comp1.id in ids
        assert comp2.id not in ids


@pytest.mark.django_db
class TestGovernmentHomePageViewMutations:
    """Mutation tests for GovernmentHomePageView"""
    
    def test_gov_user_sees_dept_complaints(self, api_client, gov_user, citizen_user, department):
        """Test government user sees department complaints"""
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user, 
                                       address='Addr 560024', assigned_to_dept=department,
                                       status='Pending')
        
        api_client.force_authenticate(user=gov_user)
        response = api_client.get(reverse('complaints:gov-home'))
        
        assert response.status_code == 200
        ids = [c['id'] for c in response.json()]
        assert comp.id in ids
    
    def test_non_gov_user_gets_403(self, api_client, citizen_user):
        """Test non-government user gets 403"""
        api_client.force_authenticate(user=citizen_user)
        response = api_client.get(reverse('complaints:gov-home'))
        assert response.status_code == 403
    
    def test_gov_without_dept_gets_400(self, api_client):
        """Test government user without department gets 400"""
        gov_no_dept = Government_Authority.objects.create_user(
            username='gov2', password='p', phone_number='9876543247'
        )
        api_client.force_authenticate(user=gov_no_dept)
        response = api_client.get(reverse('complaints:gov-home'))
        assert response.status_code == 400


@pytest.mark.django_db
class TestFieldWorkerHomePageViewMutations:
    """Mutation tests for FieldWorkerHomePageView"""
    
    def test_fw_sees_assigned_complaints(self, api_client, field_worker_user, citizen_user):
        """Test field worker sees assigned complaints"""
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user,
                                       address='Addr 560025', assigned_to_fieldworker=field_worker_user,
                                       status='In Progress')
        
        api_client.force_authenticate(user=field_worker_user)
        response = api_client.get(reverse('complaints:fw-home'))
        
        assert response.status_code == 200
        ids = [c['id'] for c in response.json()]
        assert comp.id in ids
    
    def test_fw_no_complaints_returns_message(self, api_client, field_worker_user):
        """Test field worker with no complaints gets message"""
        api_client.force_authenticate(user=field_worker_user)
        response = api_client.get(reverse('complaints:fw-home'))
        
        assert response.status_code == 200
        assert 'No pending complaints' in response.json()['message']
    
    def test_non_fw_gets_403(self, api_client, citizen_user):
        """Test non-field-worker gets 403"""
        api_client.force_authenticate(user=citizen_user)
        response = api_client.get(reverse('complaints:fw-home'))
        assert response.status_code == 403


@pytest.mark.django_db
class TestFakeConfidenceViewMutations:
    """Mutation tests for FakeConfidenceView"""
    
    def test_first_post_creates_entry(self, api_client, citizen_user, test_complaint):
        """Test first POST creates fake confidence entry"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:complaint-fake-confidence',
                                          kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 201
        assert 'recorded' in response.json()['message'].lower()
    
    def test_second_post_returns_existing(self, api_client, citizen_user, test_complaint):
        """Test second POST returns existing entry"""
        api_client.force_authenticate(user=citizen_user)
        Fake_Confidence.objects.create(complaint=test_complaint, user=citizen_user)
        
        response = api_client.post(reverse('complaints:complaint-fake-confidence',
                                          kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        assert 'already recorded' in response.json()['message'].lower()
    
    def test_delete_existing_entry(self, api_client, citizen_user, test_complaint):
        """Test DELETE removes entry"""
        api_client.force_authenticate(user=citizen_user)
        Fake_Confidence.objects.create(complaint=test_complaint, user=citizen_user)
        
        response = api_client.delete(reverse('complaints:complaint-fake-confidence',
                                            kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 200
        assert 'removed' in response.json()['message'].lower()
    
    def test_delete_nonexistent_returns_404(self, api_client, citizen_user, test_complaint):
        """Test DELETE without entry returns 404"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.delete(reverse('complaints:complaint-fake-confidence',
                                            kwargs={'complaint_id': test_complaint.id}))
        assert response.status_code == 404


@pytest.mark.django_db
class TestSubmitResolutionViewMutations:
    """Mutation tests for SubmitResolutionView"""
    
    def test_non_fw_gets_403(self, api_client, citizen_user, test_complaint):
        """Test non-field-worker gets 403"""
        api_client.force_authenticate(user=citizen_user)
        
        response = api_client.post(reverse('complaints:resolution-submit',
                                          kwargs={'complaint_id': test_complaint.id}),
                                  {'description': 'Fixed'})
        assert response.status_code == 403
    
    def test_unassigned_fw_gets_403(self, api_client, field_worker_user, citizen_user):
        """Test unassigned field worker gets 403"""
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user, address='Addr 560026')
        api_client.force_authenticate(user=field_worker_user)
        
        response = api_client.post(reverse('complaints:resolution-submit',
                                          kwargs={'complaint_id': comp.id}),
                                  {'description': 'Fixed'})
        assert response.status_code == 403
    
    def test_pending_resolution_exists_returns_400(self, api_client, field_worker_user, citizen_user):
        """Test existing pending resolution returns 400"""
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user, address='Addr 560027',
                                       assigned_to_fieldworker=field_worker_user)
        Resolution.objects.create(complaint=comp, field_worker=field_worker_user,
                                 description='First', status='pending_approval')
        
        api_client.force_authenticate(user=field_worker_user)
        response = api_client.post(reverse('complaints:resolution-submit',
                                          kwargs={'complaint_id': comp.id}),
                                  {'description': 'Second'})
        assert response.status_code == 400
    
    def test_successful_submission_updates_status(self, api_client, field_worker_user, citizen_user):
        """Test successful submission updates complaint status"""
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user, address='Addr 560028',
                                       assigned_to_fieldworker=field_worker_user, status='In Progress')
        
        api_client.force_authenticate(user=field_worker_user)
        response = api_client.post(reverse('complaints:resolution-submit',
                                          kwargs={'complaint_id': comp.id}),
                                  {'description': 'Fixed'}, format='multipart')
        
        assert response.status_code == 201
        comp.refresh_from_db()
        assert comp.status == 'Pending Approval'


@pytest.mark.django_db
class TestCitizenResolutionResponseViewMutations:
    """Mutation tests for CitizenResolutionResponseView"""
    
    def test_non_owner_gets_403(self, api_client, other_citizen_user, test_complaint, field_worker_user):
        """Test non-owner gets 403"""
        res = Resolution.objects.create(complaint=test_complaint, field_worker=field_worker_user,
                                       description='Fixed', status='pending_approval')
        
        api_client.force_authenticate(user=other_citizen_user)
        response = api_client.post(
            reverse('complaints:resolution-response',
                   kwargs={'complaint_id': test_complaint.id, 'resolution_id': res.id}),
            {'approved': True}
        )
        assert response.status_code == 403
    
    def test_non_pending_resolution_returns_400(self, api_client, citizen_user, test_complaint, field_worker_user):
        """Test already processed resolution returns 400"""
        res = Resolution.objects.create(complaint=test_complaint, field_worker=field_worker_user,
                                       description='Fixed', status='approved')
        
        api_client.force_authenticate(user=citizen_user)
        response = api_client.post(
            reverse('complaints:resolution-response',
                   kwargs={'complaint_id': test_complaint.id, 'resolution_id': res.id}),
            {'approved': True}
        )
        assert response.status_code == 400
    
    def test_approval_marks_completed(self, api_client, citizen_user, test_complaint, field_worker_user):
        """Test approval marks complaint as completed"""
        res = Resolution.objects.create(complaint=test_complaint, field_worker=field_worker_user,
                                       description='Fixed', status='pending_approval')
        
        api_client.force_authenticate(user=citizen_user)
        response = api_client.post(
            reverse('complaints:resolution-response',
                   kwargs={'complaint_id': test_complaint.id, 'resolution_id': res.id}),
            {'approved': True}, format='json'
        )
        
        assert response.status_code == 200
        test_complaint.refresh_from_db()
        assert test_complaint.status == 'Completed'
    
    def test_rejection_escalates_complaint(self, api_client, citizen_user, test_complaint, field_worker_user):
        """Test rejection escalates complaint"""
        test_complaint.assigned_to_fieldworker = field_worker_user
        test_complaint.save()
        
        res = Resolution.objects.create(complaint=test_complaint, field_worker=field_worker_user,
                                       description='Fixed', status='pending_approval')
        
        api_client.force_authenticate(user=citizen_user)
        response = api_client.post(
            reverse('complaints:resolution-response',
                   kwargs={'complaint_id': test_complaint.id, 'resolution_id': res.id}),
            {'approved': False, 'feedback': 'Not good enough'}, format='json'
        )
        
        assert response.status_code == 200
        test_complaint.refresh_from_db()
        assert test_complaint.status == 'Escalated'
        assert test_complaint.assigned_to_fieldworker is None


@pytest.mark.django_db
class TestAutoApproveResolutionsViewMutations:
    """Mutation tests for AutoApproveResolutionsView"""
    
    def test_non_admin_cannot_trigger(self, api_client, citizen_user):
        """Test non-admin cannot trigger auto-approve"""
        api_client.force_authenticate(user=citizen_user)
        response = api_client.post(reverse('complaints:auto-approve'))
        assert response.status_code == 403
    
    def test_auto_approves_expired_resolutions(self, api_client, citizen_user, field_worker_user):
        """Test auto-approves expired resolutions"""
        admin = Citizen.objects.create_superuser(username='admin', password='p', phone_number='9876543248')
        comp = Complaint.objects.create(content='Test', posted_by=citizen_user, address='Addr 560029')
        res = Resolution.objects.create(
            complaint=comp, field_worker=field_worker_user,
            description='Fixed', status='pending_approval',
            auto_approve_at=timezone.now() - timedelta(days=1)
        )
        
        api_client.force_authenticate(user=admin)
        response = api_client.post(reverse('complaints:auto-approve'))
        
        assert response.status_code == 200
        assert response.json()['auto_approved_count'] >= 1
        
        res.refresh_from_db()
        assert res.status == 'auto_approved'
