from django.shortcuts import render
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Complaint, ResolutionImage, Notification
from .serializers import ResolutionImageSerializer, NotificationSerializer
# Create your views here.

class NotificationListAPIView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
