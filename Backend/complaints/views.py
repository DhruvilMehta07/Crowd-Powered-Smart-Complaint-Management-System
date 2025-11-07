from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
import re, requests, json
from django.db.models import Q

from users.models import Government_Authority, Department,Field_Worker
from .models import Complaint, ComplaintImage, Upvote, Fake_Confidence,ResolutionImage,Notification
from .serializers import (ComplaintSerializer, ComplaintCreateSerializer, 
                          UpvoteSerializer,FieldWorkerSerializer,ComplaintImageSerializer,
                          FakeConfidenceSerializer,ResolutionImageSerializer)
from CPCMS import settings
from django.utils import timezone

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

class ReverseGeocodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_api_key(self):
        return getattr(settings, 'MAPMYINDIA_API_KEY', '')

    def _validate_coords(self, latitude, longitude):
        if latitude is None or longitude is None or latitude == '' or longitude == '':
            return False
        return True

    def _build_params(self, latitude, longitude, api_key):
        return {
            'lat': float(latitude),
            'lng': float(longitude),
            'access_token': api_key,
            'region': 'IND'
        }

    def _extract_address(self, result):
        address = result.get('formatted_address', '') or ''
        pincode = result.get('pincode', '') or ''
        city = result.get('city', '') or ''
        state = result.get('state', '') or ''
        district = result.get('district', '') or ''

        if not address:
            parts = []
            if city:
                parts.append(city)
            elif result.get('village'):
                parts.append(result.get('village'))
            if district:
                parts.append(district)
            if state:
                parts.append(state)
            if pincode:
                parts.append(f"Pincode: {pincode}")
            address = ", ".join(parts)

        return address, pincode, city, state, district

    def _handle_api_error(self, msg, http_status=status.HTTP_500_INTERNAL_SERVER_ERROR):
        print(f"MapmyIndia API error: {msg}")
        return Response({'success': False, 'error': msg}, status=http_status)

    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        print(f"Reverse geocode request - lat: {latitude}, lng: {longitude}")

        if not self._validate_coords(latitude, longitude):
            return Response(
                {'success': False, 'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = self._get_api_key()
        print(f"API Key present: {bool(api_key)}")
        if not api_key:
            return Response(
                {'success': False, 'error': 'MapmyIndia API key not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            url = "https://search.mappls.com/search/address/rev-geocode"
            params = self._build_params(latitude, longitude, api_key)
            print(f"Calling MapmyIndia API with params: {params}")

            response = requests.get(url, params=params, timeout=10)
            print(f"MapmyIndia response status: {response.status_code}")
            print(f"MapmyIndia response text: {response.text}")

            if response.status_code != 200:
                return self._handle_api_error(f'MapmyIndia API HTTP error: {response.status_code}')

            data = response.json()
            print(f"MapmyIndia API response data: {data}")

            if data.get('responseCode') != 200 or not data.get('results'):
                return self._handle_api_error(f"No results found. Response code: {data.get('responseCode')}", http_status=status.HTTP_404_NOT_FOUND)

            result = data['results'][0]
            print(f"MapmyIndia result: {result}")

            address, pincode, city, state, district = self._extract_address(result)
            print(f"Reverse geocode successful - Address: {address}, Pincode: {pincode}")

            return Response({
                'success': True,
                'data': {
                    'address': address,
                    'pincode': pincode,
                    'city': city,
                    'state': state,
                    'district': district
                }
            })
        except requests.exceptions.Timeout:
            error_msg = 'MapmyIndia API request timeout'
            print(f"Error: {error_msg}")
            return Response({'success': False, 'error': error_msg}, status=status.HTTP_408_REQUEST_TIMEOUT)
        except requests.exceptions.RequestException as e:
            error_msg = f'Network error: {str(e)}'
            print(f"Error: {error_msg}")
            return Response({'success': False, 'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            error_msg = f'Unexpected error: {str(e)}'
            print(f"Error: {error_msg}")
            return Response({'success': False, 'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ComplaintSearchView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    model = Complaint
    
    def get(self, request):
        query = (request.query_params.get('q') or '').strip()
        complaints = Complaint.objects.all()

        if query:
            complaints = complaints.filter(
                Q(content__icontains=query) | Q(address__icontains=query)
            )

        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class PastComplaintsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        complaints = Complaint.objects.filter(posted_by=request.user)

        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class GovernmentHomePageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Get the government authority user with department
            gov_user = Government_Authority.objects.get(id=request.user.id)
            user_department = gov_user.assigned_department
            
            if not user_department:
                return Response(
                    {"error": "No department assigned to this user."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            complaints = Complaint.objects.filter(
                status='Pending', 
                assigned_to_dept=user_department
            )
            
            serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Government_Authority.DoesNotExist:
            return Response(
                {"error": "User is not a government authority."},
                status=status.HTTP_403_FORBIDDEN
            )
        
class FieldWorkerHomePageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Get the field worker user with department
            fieldworker = Field_Worker.objects.get(id=request.user.id)

            complaints = Complaint.objects.filter(
                status__in=['In Progress','Pending'],
                assigned_to_fieldworker=fieldworker,
            )
            if not complaints.exists():
                return Response(
                    {"message": "No pending complaints assigned to you."},
                    status=status.HTTP_200_OK
                )
            serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Field_Worker.DoesNotExist:
            return Response(
                {"error": "User is not a field worker."},
                status=status.HTTP_403_FORBIDDEN
            )
        

class AvailableFieldWorkersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, complaint_id=None):
        try:
            gov_user = Government_Authority.objects.get(id=request.user.id)
        except Government_Authority.DoesNotExist:
            return Response(
                {"error": "User is not a government authority."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not gov_user.assigned_department:
            return Response(
                {"error": "No department assigned to this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint = None
        if complaint_id is not None:
            complaint = get_object_or_404(Complaint, id=complaint_id)
            if complaint.assigned_to_dept != gov_user.assigned_department:
                return Response(
                    {"error": "You can only assign complaints from your department."},
                    status=status.HTTP_403_FORBIDDEN
                )

        available_workers = Field_Worker.objects.filter(
            assigned_department=gov_user.assigned_department,
            verified=True
        )

        serializer = FieldWorkerSerializer(available_workers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AssignComplaintView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, complaint_id):
        try:
            complaint = get_object_or_404(Complaint, id=complaint_id)
            
            # check if user is government authority from the same department
            gov_user = Government_Authority.objects.get(id=request.user.id)
            
            if not gov_user.assigned_department or complaint.assigned_to_dept != gov_user.assigned_department:
                return Response(
                    {"error": "You can only assign complaints from your department."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            fieldworker_id = request.data.get('fieldworker_id')
            
            if not fieldworker_id:
                return Response(
                    {"error": "fieldworker_id is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                fieldworker = Field_Worker.objects.get(
                    id=fieldworker_id,
                    assigned_department=gov_user.assigned_department,
                    verified=True
                )
            except Field_Worker.DoesNotExist:
                return Response(
                    {"error": "Field worker not found or not available."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            
            complaint.assigned_to_fieldworker = fieldworker # complaint assign
            complaint.status = 'In Progress'
            
            complaint.save()
            
            
            serializer = ComplaintSerializer(complaint, context={'request': request})# update
            return Response({
                "message": f"Complaint assigned to {fieldworker.username}",
                "complaint": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Government_Authority.DoesNotExist:
            return Response(
                {"error": "User is not a government authority."},
                status=status.HTTP_403_FORBIDDEN
            )
        
class ComplaintImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        images = ComplaintImage.objects.filter(complaint=complaint).order_by('order')

        serializer = ComplaintImageSerializer(
            images,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class FakeConfidenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        fake_entry, created = Fake_Confidence.objects.get_or_create(
            complaint=complaint,
            user=request.user
        )

        complaint.refresh_from_db(fields=['fake_confidence'])
        serializer = FakeConfidenceSerializer(fake_entry)

        if created:
            message = "Fake confidence recorded."
            status_code = status.HTTP_201_CREATED
        else:
            message = "Fake confidence already recorded for this complaint."
            status_code = status.HTTP_200_OK

        return Response(
            {
                "message": message,
                "fake_confidence": complaint.fake_confidence,
                "entry": serializer.data
            },
            status=status_code
        )

    def delete(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        try:
            fake_entry = Fake_Confidence.objects.get(complaint=complaint, user=request.user)
        except Fake_Confidence.DoesNotExist:
            return Response(
                {"error": "No fake confidence recorded for this complaint."},
                status=status.HTTP_404_NOT_FOUND
            )

        fake_entry.delete()
        complaint.refresh_from_db(fields=['fake_confidence'])

        return Response(
            {
                "message": "Fake confidence removed.",
                "fake_confidence": complaint.fake_confidence
            },
            status=status.HTTP_200_OK
        )


class SubmitResolutionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)

        try:
            fw = Field_Worker.objects.get(id=request.user.id)
        except Field_Worker.DoesNotExist:
            return Response({"error": "Only field workers can submit resolution images."}, status=status.HTTP_403_FORBIDDEN)

        if complaint.assigned_to_fieldworker is None or complaint.assigned_to_fieldworker.id != fw.id:
            return Response({"error": "You are not assigned to this complaint."}, status=status.HTTP_403_FORBIDDEN)

        image = request.data.get('image')
        if not image:
            return Response({"error": "Image is required."}, status=status.HTTP_400_BAD_REQUEST)

        resolution = ResolutionImage.objects.create(complaint=complaint, image=image, submitted_by=fw)

        serializer = ResolutionImageSerializer(resolution, context={'request': request})
        return Response({"message": "Resolution submitted, awaiting citizen approval.", "resolution": serializer.data}, status=status.HTTP_201_CREATED)


class ApproveResolutionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id, resolution_id=None):
        complaint = get_object_or_404(Complaint, id=complaint_id)

        if not complaint.posted_by or complaint.posted_by.id != request.user.id:
            return Response({"error": "Only the complaint owner can approve the resolution."}, status=status.HTTP_403_FORBIDDEN)

    
        if resolution_id:
            resolution = get_object_or_404(ResolutionImage, id=resolution_id, complaint=complaint)
        else:
            resolution = complaint.resolution_images.order_by('-submitted_at').first()
            if not resolution:
                return Response({"error": "No resolution to approve."}, status=status.HTTP_404_NOT_FOUND)

        resolution.approved = True
        resolution.approved_at = timezone.now()
        resolution.save(update_fields=['approved', 'approved_at'])

        complaint.status = 'Completed'
        complaint.save(update_fields=['status'])

        fw=resolution.submitted_by
        if fw:
             Notification.objects.create(
                user=fw,
                message=f"Your resolution for complaint #{complaint.id} was approved by the citizen. Complaint marked completed.",
                link=f"/complaints/{complaint.id}/",
            )

        return Response({"message": "Resolution approved. Complaint completed.", "complaint_id": complaint.id}, status=status.HTTP_200_OK)

