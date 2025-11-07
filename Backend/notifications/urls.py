from django.urls import path
from .views import NotificationListAPIView

urlpatterns = [
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
]
