"""
Comprehensive tests for notifications views to achieve 100% coverage
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from notifications.models import Notification
from complaints.models import Complaint
from users.models import Citizen, Department
from .. import views as notifications_views

User = get_user_model()


# Using APIRequestFactory for killing mutants effectively so i changed all the tests to use it


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
    
    def test_list_notifications_authenticated(self,  user):
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
        
        factory=APIRequestFactory()
        request=factory.get(reverse('notification-list'))
        force_authenticate(request, user=user)
        response = notifications_views.NotificationListAPIView.as_view()(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
    
    def test_list_notifications_marks_unread_as_read(self, user):
        """Test that listing notifications marks unread as read"""
        notif = Notification.objects.create(
            user=user,
            message="Unread notification",
            is_read=False
        )
        
        factory=APIRequestFactory()
        request=factory.get(reverse('notification-list'))
        force_authenticate(request, user=user)
        response = notifications_views.NotificationListAPIView.as_view()(request)
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_list_notifications_only_user_notifications(self, user, other_user):
        """Test that users only see their own notifications"""
        Notification.objects.create(user=user, message="User notification")
        Notification.objects.create(user=other_user, message="Other user notification")
        
        factory=APIRequestFactory()
        request=factory.get(reverse('notification-list'))
        force_authenticate(request, user=user)
        response = notifications_views.NotificationListAPIView.as_view()(request)
        
        assert len(response.data) == 1
        assert response.data[0]['message'] == "User notification"
    
    def test_list_notifications_unauthenticated(self):
        """Test listing notifications without authentication"""
        factory=APIRequestFactory()
        request=factory.get(reverse('notification-list'))
        response = notifications_views.NotificationListAPIView.as_view()(request)
        
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
    
    def test_mark_notification_as_read_success(self, user):
        """Test successfully marking notification as read"""
        notif = Notification.objects.create(
            user=user,
            message="Test notification",
            is_read=False
        )
        
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-notification-read', args=[notif.id]))
        force_authenticate(request, user=user)
        response = notifications_views.MarkNotificationAsReadAPIView.as_view()(request, notification_id=notif.id)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        
        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_mark_notification_as_read_not_found(self, user):
        """Test marking non-existent notification"""
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-notification-read', args=[99999]))
        force_authenticate(request, user=user)
        response = notifications_views.MarkNotificationAsReadAPIView.as_view()(request, notification_id=99999)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
    
    def test_mark_notification_as_read_wrong_user(self, user, other_user):
        """Test marking another user's notification"""
        notif = Notification.objects.create(
            user=other_user,
            message="Other user's notification",
            is_read=False
        )
        
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-notification-read', args=[notif.id]))
        force_authenticate(request, user=user)
        response = notifications_views.MarkNotificationAsReadAPIView.as_view()(request, notification_id=notif.id)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_mark_notification_as_read_unauthenticated(self):
        """Test marking notification without authentication"""
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-notification-read', args=[1]))
        response = notifications_views.MarkNotificationAsReadAPIView.as_view()(request, notification_id=1)
        
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
    
    def test_mark_all_notifications_as_read(self, user):
        """Test marking all notifications as read"""
        Notification.objects.create(user=user, message="Notif 1", is_read=False)
        Notification.objects.create(user=user, message="Notif 2", is_read=False)
        Notification.objects.create(user=user, message="Notif 3", is_read=True)
        
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-all-notifications-read'))
        force_authenticate(request, user=user)
        response = notifications_views.MarkAllNotificationsAsReadAPIView.as_view()(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert '2 notifications' in response.data['message']
        
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        assert unread_count == 0
    
    def test_mark_all_notifications_no_unread(self, user):
        """Test marking all when no unread notifications"""
        Notification.objects.create(user=user, message="Read notif", is_read=True)
        
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-all-notifications-read'))
        force_authenticate(request, user=user)
        response = notifications_views.MarkAllNotificationsAsReadAPIView.as_view()(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert '0 notifications' in response.data['message']
    
    def test_mark_all_notifications_unauthenticated(self):
        """Test marking all without authentication"""
        factory=APIRequestFactory()
        request=factory.post(reverse('mark-all-notifications-read'))
        response = notifications_views.MarkAllNotificationsAsReadAPIView.as_view()(request)
        
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
    
    def test_get_unread_count(self, user):
        """Test getting unread notification count"""
        Notification.objects.create(user=user, message="Unread 1", is_read=False)
        Notification.objects.create(user=user, message="Unread 2", is_read=False)
        Notification.objects.create(user=user, message="Read", is_read=True)
        
        factory=APIRequestFactory()
        request=factory.get(reverse('unread-notification-count'))
        force_authenticate(request, user=user)
        response = notifications_views.UnreadNotificationCountAPIView.as_view()(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 2
    
    def test_get_unread_count_zero(self, user):
        """Test getting unread count when all are read"""
        Notification.objects.create(user=user, message="Read", is_read=True)
        
        factory=APIRequestFactory()
        request=factory.get(reverse('unread-notification-count'))
        force_authenticate(request, user=user)
        response = notifications_views.UnreadNotificationCountAPIView.as_view()(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 0
    
    def test_get_unread_count_unauthenticated(self):
        """Test getting unread count without authentication"""
        factory=APIRequestFactory()
        request=factory.get(reverse('unread-notification-count'))
        response = notifications_views.UnreadNotificationCountAPIView.as_view()(request)
        
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
        complaint = Complaint.objects.create(
            posted_by=user,
            content="Test complaint content",
            address="Test address",
            assigned_to_dept=department
        )
        return complaint
    
    def test_notification_open_with_complaint_link(self, user, complaint):
        """Test opening notification with complaint link"""
        notif = Notification.objects.create(
            user=user,
            message="New comment",
            link=f'/complaints/{complaint.id}/',
            is_read=False
        )
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/{notif.id}/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=notif.id)

        # Should redirect to complaint detail
        assert response.status_code in (301, 302)
        assert f'/complaints/{complaint.id}/detail/' in (response.get('Location') or '')

        notif.refresh_from_db()
        assert notif.is_read is True

    # additional test to kill mutant (open notification with invalid complaint id in link)
    def test_notification_open_with_invalid_complaint_link(self, user):
        """Test opening notification with invalid complaint link"""
        notif = Notification.objects.create(
            user=user,
            message="Invalid complaint link",
            link=f'/complaints/99999/',
            is_read=False
        )
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/{notif.id}/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=notif.id)

        # Should redirect to complaint detail even if complaint does not exist
        assert response.status_code in (400, 301, 302)
        assert f'/complaints/99999/detail/' in (response.get('Location') or '')

        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_notification_open_with_generic_link(self, user):
        """Test opening notification with generic link"""
        notif = Notification.objects.create(
            user=user,
            message="Test message",
            link='/some/other/path/',
            is_read=False
        )
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/{notif.id}/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=notif.id)

        # Should redirect to the link
        assert response.status_code in (301, 302)
        assert '/some/other/path/' in (response.get('Location') or '')

        notif.refresh_from_db()
        assert notif.is_read is True
    
    def test_notification_open_no_link(self, user):
        """Test opening notification with no link"""
        notif = Notification.objects.create(
            user=user,
            message="Test message",
            link='',
            is_read=False
        )
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/{notif.id}/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=notif.id)

        assert response.status_code in (400, 404)
        # Response should include an error payload
        assert hasattr(response, 'data') and 'error' in response.data
    
    def test_notification_open_not_found(self, user):
        """Test opening non-existent notification"""
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/99999/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=99999)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
    
    def test_notification_open_already_read(self, user, complaint):
        """Test opening already read notification"""
        notif = Notification.objects.create(
            user=user,
            message="Already read",
            link=f'/complaints/{complaint.id}/',
            is_read=True
        )
        factory = APIRequestFactory()
        request = factory.get(f"/notifications/{notif.id}/open/")
        force_authenticate(request, user=user)

        view = notifications_views.NotificationOpenAPIView.as_view()
        response = view(request, notification_id=notif.id)

        # Should still redirect
        assert response.status_code in (301, 302)
    
    def test_notification_open_unauthenticated(self, client):
        """Test opening notification without authentication"""
        response = client.get(reverse('notification-open', args=[1]))
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]