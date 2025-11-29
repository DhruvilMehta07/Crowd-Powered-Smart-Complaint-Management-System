"""Additional tests for user views focusing on user_type and department behavior."""
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import Citizen, Government_Authority, Field_Worker, Department


@pytest.mark.django_db
class TestUserLoginWithUserType:
    """Test login view with user_type field"""
    
    def test_login_citizen_returns_user_type(self):
        """Test login returns user_type='citizen' for citizen"""
        citizen = Citizen.objects.create_user(
            username="citizen_login",
            email="citizen@login.com",
            password="password123"
        )
        
        client = APIClient()
        url = reverse('users:login')
        response = client.post(url, {
            'username': 'citizen_login',
            'password': 'password123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_type'] == 'citizen'
    
    def test_login_authority_returns_user_type(self):
        """Test login returns user_type='authority' for government authority"""
        dept = Department.objects.create(name="test_dept")
        gov = Government_Authority.objects.create_user(
            username="gov_login",
            email="gov@login.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        client = APIClient()
        url = reverse('users:login')
        response = client.post(url, {
            'username': 'gov_login',
            'password': 'password123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_type'] == 'authority'
    
    def test_login_fieldworker_returns_user_type(self):
        """Test login returns user_type='fieldworker' for field worker"""
        dept = Department.objects.create(name="test_dept2")
        fw = Field_Worker.objects.create_user(
            username="fw_login",
            email="fw@login.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        client = APIClient()
        url = reverse('users:login')
        response = client.post(url, {
            'username': 'fw_login',
            'password': 'password123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_type'] == 'fieldworker'
    
    def test_login_authority_not_verified_denied(self):
        """Test unverified authority cannot login"""
        dept = Department.objects.create(name="test_dept3")
        gov = Government_Authority.objects.create_user(
            username="gov_unverified",
            email="gov_unverified@test.com",
            password="password123",
            assigned_department=dept,
            verified=False
        )
        
        client = APIClient()
        url = reverse('users:login')
        response = client.post(url, {
            'username': 'gov_unverified',
            'password': 'password123'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'pending admin verification' in response.data['error'].lower()
    
    def test_login_fieldworker_not_verified_denied(self):
        """Test unverified field worker cannot login"""
        dept = Department.objects.create(name="test_dept4")
        fw = Field_Worker.objects.create_user(
            username="fw_unverified",
            email="fw_unverified@test.com",
            password="password123",
            assigned_department=dept,
            verified=False
        )
        
        client = APIClient()
        url = reverse('users:login')
        response = client.post(url, {
            'username': 'fw_unverified',
            'password': 'password123'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'pending admin verification' in response.data['error'].lower()
    
    def test_login_uses_user_type_field_not_db_query(self):
        """Test login uses user_type field instead of querying subclass tables"""
        # Create a citizen
        citizen = Citizen.objects.create_user(
            username="citizen_type_check",
            email="citizen_type@test.com",
            password="password123"
        )
        
        client = APIClient()
        url = reverse('users:login')
        
        with CaptureQueriesContext(connection) as query_ctx:
            response = client.post(url, {
                'username': 'citizen_type_check',
                'password': 'password123'
            })

        subclass_queries = [q for q in query_ctx if 'government_authority' in q['sql'].lower() or 'field_worker' in q['sql'].lower()]
        assert not subclass_queries
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestProfileWithDepartment:
    """Test profile view with department field on ParentUser"""
    
    def test_profile_authority_shows_department(self):
        """Test profile returns department for authority"""
        dept = Department.objects.create(name="roads")
        gov = Government_Authority.objects.create_user(
            username="gov_profile",
            email="gov_profile@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        client = APIClient()
        client.force_authenticate(user=gov)
        url = reverse('users:profile')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['assigned_department'] is not None
        assert response.data['assigned_department']['name'] == 'roads'
    
    def test_profile_fieldworker_shows_department(self):
        """Test profile returns department for field worker"""
        dept = Department.objects.create(name="water")
        fw = Field_Worker.objects.create_user(
            username="fw_profile",
            email="fw_profile@test.com",
            password="password123",
            assigned_department=dept,
            verified=True
        )
        
        client = APIClient()
        client.force_authenticate(user=fw)
        url = reverse('users:profile')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['assigned_department'] is not None
        assert response.data['assigned_department']['name'] == 'water'
    
    def test_profile_citizen_no_department(self):
        """Test profile returns None for citizen department"""
        citizen = Citizen.objects.create_user(
            username="citizen_profile",
            email="citizen_profile@test.com",
            password="password123"
        )
        
        client = APIClient()
        client.force_authenticate(user=citizen)
        url = reverse('users:profile')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['assigned_department'] is None


@pytest.mark.django_db
class TestForgotPasswordFlow:
    """Test forgot password functionality"""
    
    def test_forgot_password_citizen(self):
        """Test forgot password for citizen"""
        citizen = Citizen.objects.create_user(
            username="citizen_forgot",
            email="citizen_forgot@test.com",
            password="oldpassword"
        )
        
        client = APIClient()
        url = reverse('users:forgot-password')
        response = client.post(url, {'email': 'citizen_forgot@test.com'})
        
        assert response.status_code == status.HTTP_200_OK
        assert 'OTP sent' in response.data['message']
    
    def test_forgot_password_authority(self):
        """Test forgot password for authority"""
        dept = Department.objects.create(name="health")
        gov = Government_Authority.objects.create_user(
            username="gov_forgot",
            email="gov_forgot@test.com",
            password="oldpassword",
            assigned_department=dept
        )
        
        client = APIClient()
        url = reverse('users:forgot-password')
        response = client.post(url, {'email': 'gov_forgot@test.com'})
        
        assert response.status_code == status.HTTP_200_OK
        assert 'OTP sent' in response.data['message']
    
    def test_forgot_password_fieldworker(self):
        """Test forgot password for field worker"""
        dept = Department.objects.create(name="sanitation")
        fw = Field_Worker.objects.create_user(
            username="fw_forgot",
            email="fw_forgot@test.com",
            password="oldpassword",
            assigned_department=dept
        )
        
        client = APIClient()
        url = reverse('users:forgot-password')
        response = client.post(url, {'email': 'fw_forgot@test.com'})
        
        assert response.status_code == status.HTTP_200_OK
        assert 'OTP sent' in response.data['message']


@pytest.mark.django_db
class TestResetPasswordFlow:
    """Test reset password functionality"""
    
    def test_reset_password_citizen(self):
        """Test reset password for citizen"""
        from users.views import otp_storage
        
        citizen = Citizen.objects.create_user(
            username="citizen_reset",
            email="citizen_reset@test.com",
            password="oldpassword"
        )
        
        # Manually add OTP to storage
        otp_storage['citizen_reset@test.com'] = {
            'otp': '123456',
            'data': {},
            'user_type': 'password_reset'
        }
        
        client = APIClient()
        url = reverse('users:reset-password')
        response = client.post(url, {
            'email': 'citizen_reset@test.com',
            'otp': '123456',
            'new_password': 'newpassword123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'Password reset successful' in response.data['message']
    
    def test_reset_password_authority(self):
        """Test reset password for authority"""
        from users.views import otp_storage
        
        dept = Department.objects.create(name="police")
        gov = Government_Authority.objects.create_user(
            username="gov_reset",
            email="gov_reset@test.com",
            password="oldpassword",
            assigned_department=dept
        )
        
        otp_storage['gov_reset@test.com'] = {
            'otp': '654321',
            'data': {},
            'user_type': 'password_reset'
        }
        
        client = APIClient()
        url = reverse('users:reset-password')
        response = client.post(url, {
            'email': 'gov_reset@test.com',
            'otp': '654321',
            'new_password': 'newpassword456'
        })
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_reset_password_fieldworker(self):
        """Test reset password for field worker"""
        from users.views import otp_storage
        
        dept = Department.objects.create(name="electricity")
        fw = Field_Worker.objects.create_user(
            username="fw_reset",
            email="fw_reset@test.com",
            password="oldpassword",
            assigned_department=dept
        )
        
        otp_storage['fw_reset@test.com'] = {
            'otp': '789012',
            'data': {},
            'user_type': 'password_reset'
        }
        
        client = APIClient()
        url = reverse('users:reset-password')
        response = client.post(url, {
            'email': 'fw_reset@test.com',
            'otp': '789012',
            'new_password': 'newpassword789'
        })
        
        assert response.status_code == status.HTTP_200_OK
