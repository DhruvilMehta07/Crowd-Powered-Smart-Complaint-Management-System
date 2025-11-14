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
    
    def list(self, request, *args, **kwargs):
        # get the notifications first
        queryset = self.get_queryset()
        
        #mark all unread notifications as read when user opens the list
        unread_notifications = queryset.filter(is_read=False)
        unread_notifications.update(is_read=True)
        
        # Serialize and return the data
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class MarkNotificationAsReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, 
                user=request.user
            )
            notification.is_read = True
            notification.save()
            
            return Response(
                {'status': 'success', 'message': 'Notification marked as read'},
                status=status.HTTP_200_OK
            )
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class MarkAllNotificationsAsReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        updated_count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'status': 'success', 
            'message': f'{updated_count} notifications marked as read'
        }, status=status.HTTP_200_OK)

class UnreadNotificationCountAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).count()
        
        return Response({
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)