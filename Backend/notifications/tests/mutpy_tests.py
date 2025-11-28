import re
import pytest

from rest_framework import permissions
from rest_framework.test import APIRequestFactory, force_authenticate

from notifications.models import Notification
from notifications import views as notifications_views
import importlib
import sys
from users.models import Citizen
from django.urls import reverse
import inspect



# Test case to kill the incompetent mutant that removes permission_classes
@pytest.mark.django_db
def test_view_permission_classes_present():
	view_classes = [
		notifications_views.NotificationListAPIView,
		notifications_views.MarkNotificationAsReadAPIView,
		notifications_views.MarkAllNotificationsAsReadAPIView,
		notifications_views.UnreadNotificationCountAPIView,
		notifications_views.NotificationOpenAPIView,
	]

	for cls in view_classes:
		assert hasattr(cls, 'permission_classes'), f"{cls.__name__} missing permission_classes"
		assert cls.permission_classes == [permissions.IsAuthenticated]

# combination of the above and below test to kill mutants that remove authentication checks
# kills mutant: unauthenticated access to unread-count should be rejected (401/403)
# using APIClient for performing exception handling which would be otherwise skipped in APIRequestFactory because of direct view call
@pytest.mark.django_db
def test_unread_notification_count_requires_authentication_client():
    client = APIClient()
    url = reverse('unread-notification-count') 

    response = client.get(url)

    assert response.status_code in (401, 403), (
        f"Expected authentication error (401/403); got {response.status_code}. "
        f"Response content: {response.content!r}"
    )

# kills mutant IOD notifications.models: __str__ altered to exclude username
@pytest.mark.django_db
def test_notification___str__contains_username_and_prefix():
	user = Citizen.objects.create_user(
		username='mutpy_str_user', password='x', email='s@example.test', phone_number='000'
	)
	notif = Notification.objects.create(user=user, message='hello')

	s = str(notif)
	assert f'Notification for {user.username}' in s


# kills mutant IOD notifications.models: save replaced with no-op
@pytest.mark.django_db
def test_notification_save_persists_instance():
	user = Citizen.objects.create_user(
		username='mutpy_save_user', password='x', email='s2@example.test', phone_number='111'
	)

	notif = Notification(user=user, message='unsaved')
	assert notif.pk is None
	notif.save()
	assert notif.pk is not None
	assert Notification.objects.filter(pk=notif.pk).exists()


# kills SCI notifications.views: ordering change that calls super().list() before marking unread
@pytest.mark.django_db
def test_list_view_marks_unread_and_returns_count():
	user = Citizen.objects.create_user(username='mutpy_list_user', password='x', email='l@example.test', phone_number='124')
	Notification.objects.create(user=user, message='n1', is_read=False)
	Notification.objects.create(user=user, message='n2', is_read=False)

	factory = APIRequestFactory()
	request = factory.get(reverse('notification-list'))
	force_authenticate(request, user=user)
	response = notifications_views.NotificationListAPIView.as_view()(request)

	assert response.status_code == 200
	assert len(response.data) == 2

	unread_count = Notification.objects.filter(user=user, is_read=False).count()
	assert unread_count == 0


# kills SCI notifications.views: detects insertion of `super().list(...)` before processing
def test_views_no_super_list_call_in_source():
	src = inspect.getsource(notifications_views.NotificationListAPIView.list)
	assert 'super().list' not in src, "Unexpected call to super().list found in source"


# kills IOD notifications.models: detects `save` replaced with a no-op `pass`
def test_models_save_not_noop_in_source():
	if 'notifications.models' in sys.modules:
		del sys.modules['notifications.models']
	models_mod = importlib.import_module('notifications.models')
	Notification_local = models_mod.Notification
	src = inspect.getsource(Notification_local.save)
	fn_body = '\n'.join(src.splitlines()[1:])
	assert re.search(r"\bpass\b", fn_body) is None, "Found no-op `pass` in save() source"


# kills SCI notifications.models: detects unexpected call to super().__str__() inside __str__
def test_models_str_no_super_call_in_source():
	if 'notifications.models' in sys.modules:
		del sys.modules['notifications.models']
	models_mod = importlib.import_module('notifications.models')
	Notification_local = models_mod.Notification
	src = inspect.getsource(Notification_local.__str__)
	assert 'super().__str__' not in src, "Unexpected call to super().__str__() found in __str__"

from rest_framework.test import APIClient



