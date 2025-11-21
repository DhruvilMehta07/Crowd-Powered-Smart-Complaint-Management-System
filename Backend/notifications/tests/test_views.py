"""
Comprehensive tests for notifications views to achieve 100% coverage
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from notifications.models import Notification
from complaints.models import Complaint
from users.models import Citizen, Department

User = get_user_model()


@pytest.mark.django_db
class TestNotificationListAPIView:
    """Test notification list view"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        citizen = Citizen.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            phone_number='1234567890'
        )
        return citizen
    
    @pytest.fixture
    def other_user(self):
        citizen = Citizen.objects.create_user(
            username='otheruser',
            password='testpass123',
            email='other@example.com',
            phone_number='0987654321'
        )
        return citizen
    
    def test_list_notifications_authenticated(self, client, user):
        """Test listing notifications for authenticated user"""
        # Create notifications for the user
        Notification.objects.create(
            user=user,
            message="Test notification 1",
            is_read=False
        )
        Notification.objects.create(
            user=user,
            message="Test notification 2",
            is_read=True
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-list'))
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
    
    def test_list_notifications_marks_unread_as_read(self, client, user):
        """Test that listing notifications marks unread as read"""
        notif = Notification.objects.create(
            user=user,
            message="Unread notification",
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-list'))
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_list_notifications_only_user_notifications(self, client, user, other_user):
        """Test that users only see their own notifications"""
        Notification.objects.create(user=user, message="User notification")
        Notification.objects.create(user=other_user, message="Other user notification")
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-list'))
        
        assert len(response.data) == 1
        assert response.data[0]['message'] == "User notification"
    
    def test_list_notifications_unauthenticated(self, client):
        """Test listing notifications without authentication"""
        response = client.get(reverse('notification-list'))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestMarkNotificationAsReadAPIView:
    """Test mark single notification as read"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        citizen = Citizen.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            phone_number='1234567890'
        )
        return citizen
    
    @pytest.fixture
    def other_user(self):
        citizen = Citizen.objects.create_user(
            username='otheruser',
            password='testpass123',
            email='other@example.com',
            phone_number='0987654321'
        )
        return citizen
    
    def test_mark_notification_as_read_success(self, client, user):
        """Test successfully marking notification as read"""
        notif = Notification.objects.create(
            user=user,
            message="Test notification",
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.post(reverse('mark-notification-read', args=[notif.id]))
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_mark_notification_as_read_not_found(self, client, user):
        """Test marking non-existent notification"""
        client.force_authenticate(user=user)
        response = client.post(reverse('mark-notification-read', args=[99999]))
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
    
    def test_mark_notification_as_read_wrong_user(self, client, user, other_user):
        """Test marking another user's notification"""
        notif = Notification.objects.create(
            user=other_user,
            message="Other user's notification",
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.post(reverse('mark-notification-read', args=[notif.id]))
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_mark_notification_as_read_unauthenticated(self, client):
        """Test marking notification without authentication"""
        response = client.post(reverse('mark-notification-read', args=[1]))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestMarkAllNotificationsAsReadAPIView:
    """Test mark all notifications as read"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        citizen = Citizen.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            phone_number='1234567890'
        )
        return citizen
    
    def test_mark_all_notifications_as_read(self, client, user):
        """Test marking all notifications as read"""
        Notification.objects.create(user=user, message="Notif 1", is_read=False)
        Notification.objects.create(user=user, message="Notif 2", is_read=False)
        Notification.objects.create(user=user, message="Notif 3", is_read=True)
        
        client.force_authenticate(user=user)
        response = client.post(reverse('mark-all-notifications-read'))
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert '2 notifications' in response.data['message']
        
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        assert unread_count == 0
    
    def test_mark_all_notifications_no_unread(self, client, user):
        """Test marking all when no unread notifications"""
        Notification.objects.create(user=user, message="Read notif", is_read=True)
        
        client.force_authenticate(user=user)
        response = client.post(reverse('mark-all-notifications-read'))
        
        assert response.status_code == status.HTTP_200_OK
        assert '0 notifications' in response.data['message']
    
    def test_mark_all_notifications_unauthenticated(self, client):
        """Test marking all without authentication"""
        response = client.post(reverse('mark-all-notifications-read'))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestUnreadNotificationCountAPIView:
    """Test unread notification count"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        citizen = Citizen.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            phone_number='1234567890'
        )
        return citizen
    
    def test_get_unread_count(self, client, user):
        """Test getting unread notification count"""
        Notification.objects.create(user=user, message="Unread 1", is_read=False)
        Notification.objects.create(user=user, message="Unread 2", is_read=False)
        Notification.objects.create(user=user, message="Read", is_read=True)
        
        client.force_authenticate(user=user)
        response = client.get(reverse('unread-notification-count'))
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 2
    
    def test_get_unread_count_zero(self, client, user):
        """Test getting unread count when all are read"""
        Notification.objects.create(user=user, message="Read", is_read=True)
        
        client.force_authenticate(user=user)
        response = client.get(reverse('unread-notification-count'))
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 0
    
    def test_get_unread_count_unauthenticated(self, client):
        """Test getting unread count without authentication"""
        response = client.get(reverse('unread-notification-count'))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestNotificationOpenAPIView:
    """Test notification open and redirect"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def user(self):
        citizen = Citizen.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            phone_number='1234567890'
        )
        return citizen
    
    @pytest.fixture
    def department(self):
        return Department.objects.create(name='Road')
    
    @pytest.fixture
    def complaint(self, user, department):
        return Complaint.objects.create(
            posted_by=user,
            content="Test complaint content",
            address="Test address",
            assigned_to_dept=department
        )
    
    def test_notification_open_with_complaint_link(self, client, user, complaint):
        """Test opening notification with complaint link"""
        notif = Notification.objects.create(
            user=user,
            message="New comment",
            link=f'/complaints/{complaint.id}/',
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-open', args=[notif.id]))
        
        # Should redirect to complaint detail
        assert response.status_code in [status.HTTP_302_FOUND, status.HTTP_301_MOVED_PERMANENTLY]
        assert f'/complaints/{complaint.id}/detail/' in response.url
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_notification_open_with_generic_link(self, client, user):
        """Test opening notification with generic link"""
        notif = Notification.objects.create(
            user=user,
            message="Test message",
            link='/some/other/path/',
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-open', args=[notif.id]))
        
        # Should redirect to the link
        assert response.status_code in [status.HTTP_302_FOUND, status.HTTP_301_MOVED_PERMANENTLY]
        assert '/some/other/path/' in response.url
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_notification_open_no_link(self, client, user):
        """Test opening notification with no link"""
        notif = Notification.objects.create(
            user=user,
            message="Test message",
            link='',
            is_read=False
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-open', args=[notif.id]))
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_notification_open_not_found(self, client, user):
        """Test opening non-existent notification"""
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-open', args=[99999]))
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
    
    def test_notification_open_already_read(self, client, user, complaint):
        """Test opening already read notification"""
        notif = Notification.objects.create(
            user=user,
            message="Already read",
            link=f'/complaints/{complaint.id}/',
            is_read=True
        )
        
        client.force_authenticate(user=user)
        response = client.get(reverse('notification-open', args=[notif.id]))
        
        # Should still redirect
        assert response.status_code in [status.HTTP_302_FOUND, status.HTTP_301_MOVED_PERMANENTLY]
    
    def test_notification_open_unauthenticated(self, client):
        """Test opening notification without authentication"""
        response = client.get(reverse('notification-open', args=[1]))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
