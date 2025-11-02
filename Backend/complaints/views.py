from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
import re, requests, json
from django.db.models import Q

from .models import Complaint, ComplaintImage, Upvote
from .serializers import ComplaintSerializer, ComplaintCreateSerializer, UpvoteSerializer
from CPCMS import settings

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
    
    def get(self,request):
        query = self.request.GET.get('q')
        return Complaint.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query) | Q(address__icontains=query)
        )
    