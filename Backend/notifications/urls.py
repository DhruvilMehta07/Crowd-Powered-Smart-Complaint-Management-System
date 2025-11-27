# urls.py
from django.urls import path
from .views import (
    NotificationListAPIView, 
    MarkNotificationAsReadAPIView,
    MarkAllNotificationsAsReadAPIView,
    UnreadNotificationCountAPIView, NotificationOpenAPIView
)

# app_name = 'notifications'

urlpatterns = [
    path('', NotificationListAPIView.as_view(), name='notification-list'),
    path('mark-all-read/', MarkAllNotificationsAsReadAPIView.as_view(), name='mark-all-notifications-read'),
    path('<int:notification_id>/mark-read/', MarkNotificationAsReadAPIView.as_view(), name='mark-notification-read'),
    path('unread-count/', UnreadNotificationCountAPIView.as_view(), name='unread-notification-count'),
    path('<int:notification_id>/open/', NotificationOpenAPIView.as_view(), name='notification-open'),
]