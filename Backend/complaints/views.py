from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
import re, requests, json
from django.db.models import Q, Count, Exists, OuterRef, Value, BooleanField

from complaints.services.department_suggestion_service import DepartmentSuggestionService
from users.models import Government_Authority, Department,Field_Worker
from .models import Complaint, ComplaintImage, Upvote, Fake_Confidence,Notification,Resolution
from .serializers import (ComplaintSerializer, ComplaintCreateSerializer, 
                          UpvoteSerializer,FieldWorkerSerializer,ComplaintImageSerializer,
                          FakeConfidenceSerializer,
                          ResolutionSerializer,CitizenResolutionResponseSerializer,ResolutionCreateSerializer)
from CPCMS import settings
from django.utils import timezone
from datetime import timedelta


def auto_approve_due_resolutions():
    """Auto-approve pending Resolution entries whose auto_approve_at has passed.
    This is safe to call frequently; failures in notifications are ignored.
    """
    from django.utils import timezone as _tz
    now = _tz.now()

    expired = Resolution.objects.filter(status='pending_approval', auto_approve_at__lte=now)
    for resolution in expired:
        resolution.status = 'auto_approved'
        resolution.citizen_feedback = "Auto-approved after 3 days of no response."
        resolution.citizen_responded_at = now
        resolution.save()

        complaint = resolution.complaint
        complaint.status = 'Completed'
        try:
            complaint.resolution_approved_at = now
            complaint.save()
        except Exception:
            complaint.save()

        try:
            if resolution.field_worker:
                Notification.objects.create(
                    user=resolution.field_worker,
                    message=f"Your resolution for complaint #{complaint.id} was auto-approved (3 days no response from citizen).",
                    link=f"/complaints/{complaint.id}/"
                )
        except Exception:
            pass

# Helper to build an optimized annotated queryset for complaints listings
def base_complaint_queryset(request):
    user = getattr(request, 'user', None)
    qs = (Complaint.objects
          .select_related('posted_by', 'assigned_to_dept', 'assigned_to_fieldworker', 'current_resolution')
          .prefetch_related('images'))

    qs = qs.annotate(computed_upvotes_count=Count('upvotes', distinct=True))

    if user and getattr(user, 'is_authenticated', False):
        qs = qs.annotate(
            is_upvoted=Exists(
                Upvote.objects.filter(complaint=OuterRef('pk'), user=user)
            )
        )
    else:
        qs = qs.annotate(is_upvoted=Value(False, output_field=BooleanField()))

    return qs


class TrendingComplaintsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 3))
            if limit < 1:
                limit = 3
        except ValueError:
            limit = 3

        qs = (
            base_complaint_queryset(request)
            .exclude(status='resolved')
            .order_by('-computed_upvotes_count', '-id')[:limit]
        )

        serializer = ComplaintSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class ComplaintListView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        qs = base_complaint_queryset(request).exclude(status='resolved')

        # filtering
       
        department_id = request.query_params.get('department')
        pincode = request.query_params.get('pincode')

        if department_id:
            qs = qs.filter(assigned_to_dept_id=department_id)

        if pincode:
            qs = qs.filter(pincode=pincode)

       
        #sorting
        sort_by = request.query_params.get('sort_by', 'latest')  # default
        order = request.query_params.get('order', 'desc')        # asc/desc

        # map user-friendly sort keys → actual DB fields
        sort_fields = {
            'latest': 'posted_at',                  # default
            'upvotes': 'computed_upvotes_count',
            'oldest': 'posted_at',
        }

        if sort_by in sort_fields:
            field = sort_fields[sort_by]
        else:
            field = 'posted_at'  # fallback

        # ASC/DESC logic
        if order == 'asc':
            qs = qs.order_by(field)
        else:
            qs = qs.order_by(f'-{field}')
        
        # serialize&return
       
        serializer = ComplaintSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class ComplaintCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer=ComplaintCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            complaint = serializer.save(posted_by=request.user)
            # Notify government authorities for the assigned department (if any)
            try:
                if complaint.assigned_to_dept:
                    gov_users = Government_Authority.objects.filter(assigned_department=complaint.assigned_to_dept)
                    for gov in gov_users:
                        Notification.objects.create(
                            user=gov,
                            message=f"New complaint #{complaint.id} posted in your department.",
                            link=f"/complaints/{complaint.id}/"
                        )
            except Exception:
                # non-fatal; don't block complaint creation on notification failure
                pass
            response_serializer = ComplaintSerializer(complaint, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpvoteComplaintView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        upvote, created = Upvote.objects.get_or_create(user=request.user, complaint=complaint)

        if not created:
            # Remove upvote
            upvote.delete()
            # Recalculate the count from the database
            complaint.upvotes_count = complaint.upvotes.count()
            complaint.save(update_fields=['upvotes_count'])
            return Response(
                {'detail': 'Upvote removed.', 'likes_count': complaint.upvotes_count}, 
                status=status.HTTP_200_OK
            )
        else:
            # Add upvote
            complaint.upvotes_count = complaint.upvotes.count()
            complaint.save(update_fields=['upvotes_count'])
            return Response(
                {"message": 'Complaint upvoted.', "likes_count": complaint.upvotes_count},
                status=status.HTTP_200_OK
            )


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
        complaints = base_complaint_queryset(request)

        if query:
            complaints = complaints.filter(
                Q(content__icontains=query) | Q(address__icontains=query)
            )

        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class PastComplaintsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        userid = self.request.user.id
        st = Complaint.objects.all()
        # First, complaints posted by this user
        complaints = st.filter(posted_by_id=userid)

        # If none, check complaints assigned to the user as a field worker
        if not complaints.exists():
            complaints = st.filter(assigned_to_fieldworker_id=userid)

        # If still none, and user is a government authority with an assigned department, return complaints for that department.
        if not complaints.exists():
            try:
                # Use user_type on ParentUser to avoid unnecessary subclass join
                if getattr(request.user, 'user_type', '') == 'authority':
                    user_department = getattr(request.user, 'assigned_department', None)
                    if user_department:
                        complaints = st.filter(assigned_to_dept=user_department)
                    else:
                        complaints = Complaint.objects.none()
                else:
                    complaints = Complaint.objects.none()
            except Exception:
                complaints = Complaint.objects.none()

        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class GovernmentHomePageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Ensure the requester is a government authority and get their department
            if getattr(request.user, 'user_type', '') != 'authority':
                return Response(
                    {"error": "User is not a government authority."},
                    status=status.HTTP_403_FORBIDDEN
                )

            user_department = getattr(request.user, 'assigned_department', None)
            if not user_department:
                return Response(
                    {"error": "No department assigned to this user."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
    
            complaints = base_complaint_queryset(request).filter(
                status__in=['Pending', 'Escalated'], 
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
            # Ensure the requester is a field worker
            if getattr(request.user, 'user_type', '') != 'fieldworker':
                return Response(
                    {"error": "User is not a field worker."},
                    status=status.HTTP_403_FORBIDDEN
                )

            fieldworker = request.user

            complaints = base_complaint_queryset(request).filter(
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
        # Ensure request.user is a government authority and has a department
        if getattr(request.user, 'user_type', '') != 'authority':
            return Response(
                {"error": "User is not a government authority."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_department = getattr(request.user, 'assigned_department', None)
        if not user_department:
            return Response(
                {"error": "No department assigned to this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint = None
        if complaint_id is not None:
            complaint = get_object_or_404(Complaint, id=complaint_id)
            if complaint.assigned_to_dept != user_department:
                return Response(
                    {"error": "You can only assign complaints from your department."},
                    status=status.HTTP_403_FORBIDDEN
                )

        available_workers = Field_Worker.objects.filter(
            assigned_department=user_department,
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
            if getattr(request.user, 'user_type', '') != 'authority':
                return Response(
                    {"error": "User is not a government authority."},
                    status=status.HTTP_403_FORBIDDEN
                )

            gov_user = request.user
            if not getattr(gov_user, 'assigned_department', None) or complaint.assigned_to_dept != gov_user.assigned_department:
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

            # Notify the assigned field worker
            try:
                Notification.objects.create(
                    user=fieldworker,
                    message=f"You have been assigned complaint #{complaint.id}.",
                    link=f"/complaints/{complaint.id}/"
                )
            except Exception:
                pass

            # Notify the complaint owner that the complaint was assigned
            try:
                if complaint.posted_by:
                    Notification.objects.create(
                        user=complaint.posted_by,
                        message=f"Your complaint #{complaint.id} has been assigned to {fieldworker.username}.",
                        link=f"/complaints/{complaint.id}/"
                    )
            except Exception:
                pass

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


class ComplaintDetailView(APIView):
    """Return full complaint details including images, upvotes, assigned worker,
    resolutions and citizen feedback. Also returns simplified solved status
    ('solved'|'in_progress'|'unsolved').
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, complaint_id):
        # Auto-approve any overdue resolutions before presenting detail
        try:
            auto_approve_due_resolutions()
        except Exception:
            # Non-fatal; we still return complaint data even if auto-approve fails
            pass

        complaint = get_object_or_404(Complaint, id=complaint_id)

        # Basic serialized complaint (includes images, upvotes_count, fake_confidence, resolutions)
        serializer = ComplaintSerializer(complaint, context={'request': request})
        data = serializer.data

        # Assigned field worker name
        assigned_worker = None
        if complaint.assigned_to_fieldworker:
            assigned_worker = complaint.assigned_to_fieldworker.username

        # Determine simplified solved status
        status_field = (complaint.status or '').lower()
        if status_field in ('completed', 'approved', 'auto_approved', 'resolved'):
            solved_status = 'solved'
        elif status_field in ('in progress', 'in_progress', 'pending approval', 'pending_approval'):
            solved_status = 'in_progress'
        else:
            solved_status = 'unsolved'

        # Latest approved resolution (if any)
        latest_approved = (
            complaint.resolutions
            .filter(status__in=['approved', 'auto_approved'])
            .order_by('-citizen_responded_at', '-submitted_at')
            .first()
        )

        latest_resolution_data = None
        if latest_approved:
            latest_resolution_data = {
                'id': latest_approved.id,
                'field_worker': latest_approved.field_worker.username if latest_approved.field_worker else None,
                'description': latest_approved.description,
                'submitted_at': latest_approved.submitted_at,
                'status': latest_approved.status,
                'citizen_feedback': latest_approved.citizen_feedback,
                'citizen_responded_at': latest_approved.citizen_responded_at,
            }

        # If solved and feedback negative (we treat any non-empty feedback and not-approved state as negative),
        # the existing rejection flow (CitizenResolutionResponseView) will already set complaint to 'Escalated'
        # and clear assigned worker. Here we only surface the current state and let gov users reassign via AssignComplaintView.

        response = {
            'complaint': data,
            'assigned_field_worker': assigned_worker,
            'solved_status': solved_status,
            'latest_approved_resolution': latest_resolution_data,
        }

        return Response(response, status=status.HTTP_200_OK)


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
        # If reporter is a field worker and this is a new report, notify gov authorities
        # Determine reporter type using `user_type` to avoid subclass join
        try:
            is_field_worker = getattr(request.user, 'user_type', '') == 'fieldworker'
        except Exception:
            is_field_worker = False

        if created and is_field_worker and complaint.assigned_to_dept:
            try:
                gov_users = Government_Authority.objects.filter(assigned_department=complaint.assigned_to_dept)
                for gov in gov_users:
                    Notification.objects.create(
                        user=gov,
                        message=f"Field worker {request.user.username} has requested deletion approval for complaint #{complaint.id}.",
                        link=f"/complaints/{complaint.id}/approve-delete/"
                    )
            except Exception:
                pass
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

        # Ensure requester is a field worker
        if getattr(request.user, 'user_type', '') != 'fieldworker':
            return Response(
                {"error": "Only field workers can submit resolutions."},
                status=status.HTTP_403_FORBIDDEN
            )

        field_worker = request.user

        # Check if field worker is assigned to this complaint
        if complaint.assigned_to_fieldworker != field_worker:
            return Response(
                {"error": "You are not assigned to this complaint."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if there's already a pending resolution
        if complaint.resolutions.filter(status='pending_approval').exists():
            return Response(
                {"error": "A resolution is already pending approval for this complaint."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResolutionCreateSerializer(
            data=request.data,
            context={
                'complaint': complaint,
                'field_worker': field_worker
            }
        )
        
        if serializer.is_valid():
            resolution = serializer.save()
            
            # Update complaint status and set current resolution
            complaint.status = 'Pending Approval'
            complaint.current_resolution = resolution
            complaint.save()
            
            # Notify citizen
            if complaint.posted_by:
                Notification.objects.create(
                    user=complaint.posted_by,
                    message=f"A resolution has been submitted for your complaint #{complaint.id}. Please review within 3 days.",
                    link=f"/complaints/{complaint.id}/resolution/"
                )
            
            # Notify government authority
            if complaint.assigned_to_dept:
                gov_users = Government_Authority.objects.filter(
                    assigned_department=complaint.assigned_to_dept
                )
                for gov_user in gov_users:
                    Notification.objects.create(
                        user=gov_user,
                        message=f"Field worker {field_worker.username} submitted a resolution for complaint #{complaint.id}.",
                        link=f"/complaints/{complaint.id}/"
                    )
            
            response_serializer = ResolutionSerializer(resolution)
            return Response({
                "message": "Resolution submitted successfully. Waiting for citizen approval.",
                "resolution": response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApproveDeleteComplaintView(APIView):
    """Government authority approves deletion of a complaint belonging to their department."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id):
        if getattr(request.user, 'user_type', '') != 'authority':
            return Response({"error": "User is not a government authority."}, status=status.HTTP_403_FORBIDDEN)

        complaint = get_object_or_404(Complaint, id=complaint_id)

        user_department = getattr(request.user, 'assigned_department', None)
        if not user_department or complaint.assigned_to_dept != user_department:
            return Response({"error": "You can only approve deletions for complaints in your department."}, status=status.HTTP_403_FORBIDDEN)

        poster = complaint.posted_by
        cid = complaint.id
        complaint.delete()

        # notify poster that complaint was deleted
        try:
            if poster:
                Notification.objects.create(
                    user=poster,
                    message=f"Your complaint #{cid} was deleted following government approval.",
                    link=f"/complaints/"
                )
        except Exception:
            pass

        return Response({"message": f"Complaint #{cid} deleted."}, status=status.HTTP_200_OK)

class CitizenResolutionResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, complaint_id, resolution_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        resolution = get_object_or_404(Resolution, id=resolution_id, complaint=complaint)

        # Check if user is the complaint owner
        if not complaint.posted_by or complaint.posted_by.id != request.user.id:
            return Response(
                {"error": "Only the complaint owner can respond to resolutions."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if resolution is still pending
        if resolution.status != 'pending_approval':
            return Response(
                {"error": "This resolution has already been processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CitizenResolutionResponseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        approved = serializer.validated_data['approved']
        feedback = serializer.validated_data.get('feedback', '')

        resolution.citizen_feedback = feedback
        resolution.citizen_responded_at = timezone.now()

        if approved:
            # Citizen approved the resolution
            resolution.status = 'approved'
            complaint.status = 'Completed'
            complaint.resolution_approved_at = timezone.now()
            
            # Notify field worker
            Notification.objects.create(
                user=resolution.field_worker,
                message=f"Your resolution for complaint #{complaint.id} was approved by the citizen!",
                link=f"/complaints/{complaint.id}/"
            )
            
            message = "Resolution approved. Complaint marked as completed."
            
        else:
            # Citizen rejected the resolution
            resolution.status = 'rejected'
            complaint.status = 'Escalated'
            complaint.assigned_to_fieldworker = None  # Unassign field worker
            complaint.current_resolution = None
            
            # Notify government authority
            if complaint.assigned_to_dept:
                gov_users = Government_Authority.objects.filter(
                    assigned_department=complaint.assigned_to_dept
                )
                for gov_user in gov_users:
                    Notification.objects.create(
                        user=gov_user,
                        message=f"Resolution for complaint #{complaint.id} was rejected by citizen. Please reassign.",
                        link=f"/complaints/{complaint.id}/"
                    )
            
            message = "Resolution rejected. Complaint escalated to government authority for reassignment."

        resolution.save()
        complaint.save()

        return Response({
            "message": message,
            "complaint_status": complaint.status
        }, status=status.HTTP_200_OK)

class AutoApproveResolutionsView(APIView):
    """View to auto-approve resolutions after 3 days (can be called via cron job)"""
    permission_classes = [permissions.IsAdminUser]  # Only admin can trigger manually

    def post(self, request):
        from django.utils import timezone
        now = timezone.now()
        
        # Find resolutions that are pending and past auto-approval time
        expired_resolutions = Resolution.objects.filter(
            status='pending_approval',
            auto_approve_at__lte=now
        )
        
        auto_approved_count = 0
        
        for resolution in expired_resolutions:
            resolution.status = 'auto_approved'
            resolution.citizen_feedback = "Auto-approved after 3 days of no response."
            resolution.citizen_responded_at = now
            resolution.save()
            
            # Update complaint
            complaint = resolution.complaint
            complaint.status = 'Completed'
            complaint.resolution_approved_at = now
            complaint.save()
            
            # Notify field worker
            Notification.objects.create(
                user=resolution.field_worker,
                message=f"Your resolution for complaint #{complaint.id} was auto-approved (3 days no response from citizen).",
                link=f"/complaints/{complaint.id}/"
            )
            
            auto_approved_count += 1
        
        return Response({
            "message": f"Auto-approved {auto_approved_count} resolutions.",
            "auto_approved_count": auto_approved_count
        }, status=status.HTTP_200_OK)

class ComplaintResolutionView(APIView):
    """Get resolution details for a complaint"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, complaint_id):
        complaint = get_object_or_404(Complaint, id=complaint_id)
        dept = complaint.assigned_to_dept
        gov_auth = Government_Authority.objects.filter(assigned_department=dept)
        # Check if user has permission to view this complaint's resolutions
        user_can_view = (
            complaint.posted_by == request.user or  # Complaint owner
            complaint.assigned_to_fieldworker == request.user or  # Assigned field worker
            request.user in gov_auth # Department gov user
        )
        if(complaint.status=='Resolved'):
            user_can_view=True
        
        if not user_can_view:
            return Response(
                {"error": "You don't have permission to view resolutions for this complaint."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        resolutions = complaint.resolutions.all()
        serializer = ResolutionSerializer(resolutions, many=True)
        
        return Response({
            "complaint_id": complaint.id,
            "complaint_status": complaint.status,
            "resolutions": serializer.data
        }, status=status.HTTP_200_OK)


class TopFieldworkersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        #total fieldworkers
        total_fieldworkers = Field_Worker.objects.count()

        #compute how many to return
        top_n = max(total_fieldworkers // 10, 3)

        #annotate with total assigned complaints
        qs = (
            Field_Worker.objects
            .annotate(total_assigned=Count('assigned_complaints'))
            .order_by('-total_assigned', 'id')[:top_n]
        )

        #prepare response
        data = [
            {
                "id": fw.id,
                "name": getattr(fw, 'name', getattr(fw, 'username', 'Unknown')),
                "total_assigned_complaints": fw.total_assigned
            }
            for fw in qs
        ]

        return Response(data, status=status.HTTP_200_OK)

class DepartmentSuggestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"error": "Image field is required for department suggestion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        description = request.data.get('description', '')
        service = DepartmentSuggestionService()
        suggestion = service.suggest(image_file=image_file, description=description)
        return Response({"suggestion": suggestion}, status=status.HTTP_200_OK)

class PredictComplaintResolutionView(APIView):
    # Returns severity analysis,time prediction and metadata 
  
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, complaint_id):
        from complaints.services.complaint_prediction_service import ComplaintPredictionService
        
        try:
            complaint = get_object_or_404(Complaint, id=complaint_id)
            
            
            images = ComplaintImage.objects.filter(complaint=complaint)
            if not images.exists():
                return Response(
                    {"error": "Complaint must have at least one image for ML prediction"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
           
            first_image = images.first()
            image_url = first_image.image.url  # Cloudinary URL
            
            
            category = str(complaint.assigned_to_dept)
            description = complaint.content or ""
            address = complaint.address or "Unknown location"
            
            # Run the ML prediction pipeline
            severity_analysis, time_prediction, metadata = ComplaintPredictionService.predict_resolution(
                complaint_id=complaint.id,
                category=category,
                description=description,
                address=address,
                image_url=image_url
            )
            complaint.resolution_deadline = metadata.get('predicted_deadline')
            complaint.save(update_fields=['resolution_deadline'])

            return Response(
                {
                    "severity_analysis": severity_analysis,
                    "time_prediction": time_prediction,
                    "metadata": metadata
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"ML prediction failed for complaint {complaint_id}: {str(e)}")
            
            return Response(
                {"error": f"ML prediction pipeline failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )