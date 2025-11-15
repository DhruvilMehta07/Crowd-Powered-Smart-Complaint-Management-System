from django.shortcuts import render, redirect
import re
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from complaints.models import Complaint, ResolutionImage
from .serializers import NotificationSerializer
from complaints.serializers import ResolutionImageSerializer
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


class NotificationOpenAPIView(APIView):
    """Mark notification as read and redirect to the complaint detail view linked by the notification.

    Behavior:
    - Only the notification owner can open it.
    - Marks `is_read=True`.
    - If the notification `link` contains a complaint id (e.g. '/complaints/123/' ), redirects to
      the complaint detail path `/complaints/<id>/detail/`.
    - Otherwise, redirects to whatever `link` is stored, or returns 400 if none.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

        # mark read
        if not notification.is_read:
            notification.is_read = True
            notification.save()

        link = (notification.link or '').strip()

        # Try to extract complaint id from link
        m = re.search(r'/complaints/(?P<id>\d+)', link)
        if m:
            complaint_id = m.group('id')
            detail_path = f"/complaints/{complaint_id}/detail/"
            return redirect(detail_path)

        if link:
            return redirect(link)

        return Response({'error': 'No redirect link available for this notification'}, status=status.HTTP_400_BAD_REQUEST)