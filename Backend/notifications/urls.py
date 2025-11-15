# urls.py
from django.urls import path
from .views import (
    NotificationListAPIView, 
    MarkNotificationAsReadAPIView,
    MarkAllNotificationsAsReadAPIView,
    UnreadNotificationCountAPIView
)

urlpatterns = [
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('notifications/mark-all-read/', MarkAllNotificationsAsReadAPIView.as_view(), name='mark-all-notifications-read'),
    path('notifications/<int:notification_id>/mark-read/', MarkNotificationAsReadAPIView.as_view(), name='mark-notification-read'),
    path('notifications/unread-count/', UnreadNotificationCountAPIView.as_view(), name='unread-notification-count'),
    path('notifications/<int:notification_id>/open/', NotificationOpenAPIView.as_view(), name='notification-open'),
]