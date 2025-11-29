"""
Tests for complaints views with department on ParentUser
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import Government_Authority, Field_Worker, Department, Citizen
from complaints.models import Complaint


@pytest.mark.django_db
class TestGovernmentHomePageWithDepartment:
    """Test GovernmentHomePageView with department on ParentUser"""
    
    def test_gov_home_requires_authority_user_type(self):
        """Test only users with user_type='authority' can access"""
        # Citizen should be denied
        citizen = Citizen.objects.create_user(
            username="citizen_gov_home",
            email="citizen_gov@test.com",
            password="password123"
        )
        
        client = APIClient()
        client.force_authenticate(user=citizen)
        url = reverse('complaints:gov-home')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'not a government authority' in response.data['error'].lower()
    
    def test_gov_home_requires_assigned_department(self):
        """Test authority without department gets 400"""
        gov = Government_Authority.objects.create_user(
            username="gov_no_dept",
            email="gov_no_dept@test.com",
            password="password123",
            verified=True
        )
        # No department assigned
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:gov-home')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'No department assigned' in response.data['error']
    
    def test_gov_home_returns_department_complaints(self):
        """Test returns complaints for authority's department"""
        dept = Department.objects.create(name="roads")
        gov = Government_Authority.objects.create_user(
            username="gov_with_dept",
            email="gov_dept@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        # Create complaint for this department
        citizen = Citizen.objects.create_user(
            username="complainant",
            email="complainant@test.com",
            password="password123"
        )
        
        complaint = Complaint.objects.create(
            content="Road issue",
            posted_by=citizen,
            assigned_to_dept=dept,
            status='Pending',
            address="Test Address"
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:gov-home')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestAvailableFieldWorkersWithDepartment:
    """Test AvailableFieldWorkersView with department on ParentUser"""
    
    def test_available_workers_requires_authority(self):
        """Test only authority can access available workers"""
        citizen = Citizen.objects.create_user(
            username="citizen_workers",
            email="citizen_workers@test.com",
            password="password123"
        )
        
        client = APIClient()
        client.force_authenticate(user=citizen)
        url = reverse('complaints:available-workers')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_available_workers_requires_department(self):
        """Test authority without department gets 400"""
        gov = Government_Authority.objects.create_user(
            username="gov_no_dept2",
            email="gov_no_dept2@test.com",
            password="password123",
            verified=True
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:available-workers')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'No department assigned' in response.data['error']
    
    def test_available_workers_returns_department_workers(self):
        """Test returns field workers from authority's department"""
        dept = Department.objects.create(name="water")
        gov = Government_Authority.objects.create_user(
            username="gov_workers",
            email="gov_workers@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        # Create field worker in same department
        fw = Field_Worker.objects.create_user(
            username="fw_same_dept",
            email="fw_same_dept@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:available-workers')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['username'] == 'fw_same_dept'


@pytest.mark.django_db
class TestFieldWorkerHomeWithDepartment:
    """Test FieldWorkerHomePageView with department on ParentUser"""
    
    def test_fw_home_requires_fieldworker_user_type(self):
        """Test only users with user_type='fieldworker' can access"""
        citizen = Citizen.objects.create_user(
            username="citizen_fw_home",
            email="citizen_fw@test.com",
            password="password123"
        )
        
        client = APIClient()
        client.force_authenticate(user=citizen)
        url = reverse('complaints:fw-home')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'not a field worker' in response.data['error'].lower()
    
    def test_fw_home_returns_assigned_complaints(self):
        """Test returns complaints assigned to field worker"""
        dept = Department.objects.create(name="sanitation")
        fw = Field_Worker.objects.create_user(
            username="fw_home",
            email="fw_home@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        citizen = Citizen.objects.create_user(
            username="complainant2",
            email="complainant2@test.com",
            password="password123"
        )
        
        complaint = Complaint.objects.create(
            content="Sanitation issue",
            posted_by=citizen,
            assigned_to_dept=dept,
            assigned_to_fieldworker=fw,
            status='In Progress',
            address="Test Address 2"
        )
        
        client = APIClient()
        client.force_authenticate(user=fw)
        url = reverse('complaints:fw-home')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestAssignComplaintWithDepartment:
    """Test AssignComplaintView with department on ParentUser"""
    
    def test_assign_requires_authority(self):
        """Test only authority can assign complaints"""
        dept = Department.objects.create(name="roads")
        citizen = Citizen.objects.create_user(
            username="citizen_assign",
            email="citizen_assign@test.com",
            password="password123"
        )
        
        complaint = Complaint.objects.create(
            content="Test complaint",
            posted_by=citizen,
            assigned_to_dept=dept,
            status='Pending',
            address="Test Address"
        )
        
        client = APIClient()
        client.force_authenticate(user=citizen)
        url = reverse('complaints:complaint-assign', args=[complaint.id])
        response = client.post(url, {'fieldworker_id': 1})
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_assign_requires_same_department(self):
        """Test authority can only assign complaints from their department"""
        dept1 = Department.objects.create(name="roads")
        dept2 = Department.objects.create(name="water")
        
        gov = Government_Authority.objects.create_user(
            username="gov_assign",
            email="gov_assign@test.com",
            password="password123",
            assigned_department=dept1,
            verified=True
        )
        
        citizen = Citizen.objects.create_user(
            username="citizen_assign2",
            email="citizen_assign2@test.com",
            password="password123"
        )
        
        # Complaint in different department
        complaint = Complaint.objects.create(
            content="Test complaint",
            posted_by=citizen,
            assigned_to_dept=dept2,
            status='Pending',
            address="Test Address"
        )
        
        fw = Field_Worker.objects.create_user(
            username="fw_assign",
            email="fw_assign@test.com",
            password="password123",
            assigned_department=dept1,
            verified=True
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:complaint-assign', args=[complaint.id])
        response = client.post(url, {'fieldworker_id': fw.id})
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestPastComplaintsWithDepartment:
    """Test PastComplaintsView with department on ParentUser"""
    
    def test_past_complaints_authority_shows_department_complaints(self):
        """Test authority sees department complaints in past complaints"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="gov_past",
            email="gov_past@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        citizen = Citizen.objects.create_user(
            username="citizen_past",
            email="citizen_past@test.com",
            password="password123"
        )
        
        complaint = Complaint.objects.create(
            content="Health issue",
            posted_by=citizen,
            assigned_to_dept=dept,
            status='Completed',
            address="Test Address"
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('complaints:past-complaints')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
