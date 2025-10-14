from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404

from .models import Complaint, ComplaintImage, Upvote
from .serializers import ComplaintSerializer, ComplaintCreateSerializer, UpvoteSerializer


class ComplaintListView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        complaints = Complaint.objects.all()
        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ComplaintCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer=ComplaintCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            complaint = serializer.save(posted_by=request.user)
            response_serializer = ComplaintSerializer(complaint, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UpvoteComplaintView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        upvote, created = Upvote.objects.get_or_create(user=request.user, complaint=complaint)
        
        if not created:
            upvote.delete()
            return Response({'detail': 'Upvote removed.'}, status=status.HTTP_200_OK)
        
        else:
            message = 'Complaint upvoted.'

        complaint.upvotes_count = complaint.upvotes.count()
        complaint.save(update_fields=['upvotes_count'])

        return Response({"message":message,"likes_count":complaint.upvotes_count})


class ComplaintDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        
        # Check if the user is the owner of the complaint
        if complaint.posted_by != request.user:
            return Response(
                {"error": "You can only delete your own complaints."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        complaint.delete()
        return Response(
            {"message": "Complaint deleted successfully."},
            status=status.HTTP_200_OK
        )


