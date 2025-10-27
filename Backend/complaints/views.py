from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
import re, requests, json

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
    
    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        print(f"Reverse geocode request - lat: {latitude}, lng: {longitude}")
        
        if not latitude or not longitude:
            return Response(
                {'success': False, 'error': 'Latitude and longitude are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            api_key = getattr(settings, 'MAPMYINDIA_API_KEY', '')
            
            print(f"API Key present: {bool(api_key)}")
            
            if not api_key:
                return Response(
                    {'success': False, 'error': 'MapmyIndia API key not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            url = "https://search.mappls.com/search/address/rev-geocode"
            
            params = {
                'lat': float(latitude),
                'lng': float(longitude),
                'access_token': api_key,
                'region': 'IND'
            }
            
            print(f"Calling MapmyIndia API with params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            print(f"MapmyIndia response status: {response.status_code}")
            print(f"MapmyIndia response text: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"MapmyIndia API response data: {data}")
                
                if data.get('responseCode') == 200 and data.get('results'):
                    result = data['results'][0]
                    print(f"MapmyIndia result: {result}")
                    
                    address = result.get('formatted_address', '')
                    pincode = result.get('pincode', '')
                    city = result.get('city', '')
                    state = result.get('state', '')
                    district = result.get('district', '')
                    
                    if not address:
                        address_parts = []
                        if city:
                            address_parts.append(city)
                        elif result.get('village'):
                            address_parts.append(result.get('village'))
                        if district:
                            address_parts.append(district)
                        if state:
                            address_parts.append(state)
                        if pincode:
                            address_parts.append(f"Pincode: {pincode}")
                        
                        address = ", ".join(address_parts)
                    
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
                else:
                    error_msg = f"No results found. Response code: {data.get('responseCode')}"
                    print(f"MapmyIndia API error: {error_msg}")
                    return Response(
                        {'success': False, 'error': error_msg}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                error_msg = f'MapmyIndia API HTTP error: {response.status_code}'
                print(f"MapmyIndia API error: {error_msg}")
                return Response(
                    {'success': False, 'error': error_msg}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except requests.exceptions.Timeout:
            error_msg = 'MapmyIndia API request timeout'
            print(f"Error: {error_msg}")
            return Response(
                {'success': False, 'error': error_msg}, 
                status=status.HTTP_408_REQUEST_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            error_msg = f'Network error: {str(e)}'
            print(f"Error: {error_msg}")
            return Response(
                {'success': False, 'error': error_msg}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            error_msg = f'Unexpected error: {str(e)}'
            print(f"Error: {error_msg}")
            return Response(
                {'success': False, 'error': error_msg}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )