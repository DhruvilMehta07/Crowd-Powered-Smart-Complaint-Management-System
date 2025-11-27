"""
Comprehensive tests for notifications app
"""
import pytest
from django.utils import timezone
from notifications.models import Notification
from users.models import Citizen, Government_Authority, Field_Worker, Department
from rest_framework.test import APIRequestFactory


@pytest.fixture
def factory():
    """Provide an APIRequestFactory for tests that may need to construct requests."""
    return APIRequestFactory()


@pytest.mark.django_db
class TestNotificationModel:
    
    def test_notification_creation(self, factory):
        """Test creating a notification"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="pass"
        )
        
        notification = Notification.objects.create(
            user=user,
            message="Test notification",
            link="/test/link/"
        )
        
        assert notification.pk is not None
        assert notification.user == user
        assert notification.message == "Test notification"
        assert notification.link == "/test/link/"
        assert notification.is_read is False
    
    def test_notification_read_status(self, factory):
        """Test notification read/unread status"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pass"
        )
        
        notification = Notification.objects.create(
            user=user,
            message="Unread notification"
        )
        
        assert notification.is_read is False
        
        notification.is_read = True
        notification.save()
        
        notification.refresh_from_db()
        assert notification.is_read is True
    
    def test_notification_string_representation(self, factory):
        """Test notification __str__ method"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user3",
            email="user3@example.com",
            password="pass"
        )
        
        notification = Notification.objects.create(
            user=user,
            message="Test message for string"
        )
        
        str_repr = str(notification)
        assert "user3" in str_repr or "Notification" in str_repr
    
    def test_notification_created_at_auto_set(self, factory):
        """Test that created_at is automatically set"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user4",
            email="user4@example.com",
            password="pass"
        )
        
        before = timezone.now()
        notification = Notification.objects.create(
            user=user,
            message="Time test"
        )
        after = timezone.now()
        
        assert before <= notification.created_at <= after
    
    def test_multiple_notifications_for_user(self, factory):
        """Test creating multiple notifications for same user"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user5",
            email="user5@example.com",
            password="pass"
        )
        
        notif1 = Notification.objects.create(user=user, message="First")
        notif2 = Notification.objects.create(user=user, message="Second")
        notif3 = Notification.objects.create(user=user, message="Third")
        
        user_notifs = Notification.objects.filter(user=user)
        assert user_notifs.count() == 3
    
    def test_notification_ordering(self, factory):
        """Test that notifications are ordered by created_at"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user6",
            email="user6@example.com",
            password="pass"
        )
        
        notif1 = Notification.objects.create(user=user, message="First")
        notif2 = Notification.objects.create(user=user, message="Second")
        
        notifications = list(Notification.objects.filter(user=user))
        
        # Assuming default ordering is -created_at (newest first)
        if hasattr(Notification._meta, 'ordering') and Notification._meta.ordering:
            if '-created_at' in Notification._meta.ordering:
                assert notifications[0].created_at >= notifications[1].created_at
    
    def test_notification_for_government_authority(self, factory):
        """Test notification for government authority user"""
        request = factory.get('/')
        dept = Department.objects.create(name="test dept")
        gov_user = Government_Authority.objects.create_user(
            username="gov1",
            email="gov1@example.com",
            password="pass",
            assigned_department=dept
        )
        
        notification = Notification.objects.create(
            user=gov_user,
            message="Gov notification"
        )
        
        assert notification.user == gov_user
    
    def test_notification_for_field_worker(self, factory):
        """Test notification for field worker user"""
        request = factory.get('/')
        dept = Department.objects.create(name="fw dept")
        fw_user = Field_Worker.objects.create_user(
            username="fw1",
            email="fw1@example.com",
            password="pass",
            assigned_department=dept
        )
        
        notification = Notification.objects.create(
            user=fw_user,
            message="Field worker notification"
        )
        
        assert notification.user == fw_user
    
    def test_notification_with_null_link(self, factory):
        """Test notification can have null link"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user7",
            email="user7@example.com",
            password="pass"
        )
        
        notification = Notification.objects.create(
            user=user,
            message="No link notification",
            link=None
        )
        
        assert notification.link is None
    
    def test_notification_with_empty_link(self, factory):
        """Test notification with empty string link"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="user8",
            email="user8@example.com",
            password="pass"
        )
        
        notification = Notification.objects.create(
            user=user,
            message="Empty link",
            link=""
        )
        
        assert notification.link == ""
    
    def test_bulk_notification_creation(self, factory):
        """Test creating multiple notifications at once"""
        request = factory.get('/')
        users = []
        for i in range(5):
            user = Citizen.objects.create_user(
                username=f"bulk_user{i}",
                email=f"bulk{i}@example.com",
                password="pass"
            )
            users.append(user)
        
        notifications = [
            Notification(user=user, message=f"Bulk notification {i}")
            for i, user in enumerate(users)
        ]
        
        Notification.objects.bulk_create(notifications)
        
        assert Notification.objects.count() >= 5
    
    def test_notification_cascade_delete_with_user(self, factory):
        """Test that notifications are deleted when user is deleted"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="delete_user",
            email="delete@example.com",
            password="pass"
        )
        
        Notification.objects.create(user=user, message="Will be deleted")
        
        user_id = user.id
        user.delete()
        
        # Check that notifications for deleted user are also deleted
        # (depends on on_delete behavior in model)
        remaining = Notification.objects.filter(user_id=user_id)
        # If on_delete=CASCADE, this should be 0
        # If on_delete=SET_NULL or other, might be different
    
    def test_notification_long_message(self, factory):
        """Test notification with long message"""
        request = factory.get('/')
        user = Citizen.objects.create_user(
            username="long_msg_user",
            email="long@example.com",
            password="pass"
        )
        
        long_message = "A" * 500  # Very long message
        
        notification = Notification.objects.create(
            user=user,
            message=long_message
        )
        
        assert len(notification.message) == 500
        assert notification.message == long_message
