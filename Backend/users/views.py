# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework import permissions

from django.contrib.auth import logout
from django.contrib.auth import authenticate, login
from django.db import IntegrityError

from .models import Citizen, Government_Authority, Field_Worker, Department
from .serializers import CitizenSerializer, GovernmentAuthoritySerializer, FieldWorkerSerializer, UserLoginSerializer, DepartmentSerializer
from .EmailService import EmailService

# Store OTPs temporarily in memory
otp_storage = {}

class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class CitizenSignupAPIView(APIView):
    def post(self, request):
        serializer = CitizenSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            
            if Citizen.objects.filter(email=email).exists():
                return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            otp = EmailService.generate_otp()
            otp_storage[email] = {
                'otp': otp,
                'data': request.data,
                'user_type': 'citizen'
            }
            
            if EmailService.send_otp_email(email, otp, "Citizen"):
                return Response({
                    "message": "OTP sent to email. Verify to complete registration.",
                    "email": email
                }, status=status.HTTP_200_OK)
            else:
                del otp_storage[email]
                return Response({"error": "Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GovernmentAuthoritySignupAPIView(APIView):
    def post(self, request):
        serializer = GovernmentAuthoritySerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            
            if Government_Authority.objects.filter(email=email).exists():
                return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            otp = EmailService.generate_otp()
            otp_storage[email] = {
                'otp': otp,
                'data': request.data,
                'user_type': 'authority'
            }
            
            if EmailService.send_otp_email(email, otp, "Government Authority"):
                return Response({
                    "message": "OTP sent to email. Verify to complete registration.",
                    "email": email
                }, status=status.HTTP_200_OK)
            else:
                del otp_storage[email]
                return Response({"error": "Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FieldWorkerSignupAPIView(APIView):
    def post(self, request):
        serializer = FieldWorkerSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            
            if Field_Worker.objects.filter(email=email).exists():
                return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            otp = EmailService.generate_otp()
            otp_storage[email] = {
                'otp': otp,
                'data': request.data,
                'user_type': 'fieldworker'
            }
            
            if EmailService.send_otp_email(email, otp, "Field Worker"):
                return Response({
                    "message": "OTP sent to email. Verify to complete registration.",
                    "email": email
                }, status=status.HTTP_200_OK)
            else:
                del otp_storage[email]
                return Response({"error": "Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPAPIView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_attempt = request.data.get('otp')
        
        if not email or not otp_attempt:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if email not in otp_storage or otp_storage[email]['otp'] != otp_attempt:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_data = otp_storage[email]
        user_data = stored_data['data']
        user_type = stored_data['user_type']
        
        if user_type == 'citizen':
            serializer = CitizenSerializer(data=user_data)
            if serializer.is_valid():
                try:
                    user = serializer.save()
                    del otp_storage[email] 
                    
                    # Login user using session (no token)
                    login(request, user)
                    
                    return Response({
                        "message": "Registration successful!",
                        "user_id": user.id,
                        "username": user.username
                    }, status=status.HTTP_201_CREATED)
                    
                except IntegrityError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        elif user_type == 'authority':
            serializer = GovernmentAuthoritySerializer(data=user_data)
            if serializer.is_valid():
                try:
                    user = serializer.save(verified=False)
                    del otp_storage[email]
                    
                    return Response({
                        "message": "Registration successful! Awaiting admin verification.",
                        "user_id": user.id,
                        "username": user.username
                    }, status=status.HTTP_201_CREATED)
                    
                except IntegrityError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        elif user_type == 'fieldworker':
            serializer = FieldWorkerSerializer(data=user_data)
            if serializer.is_valid():
                try:
                    user = serializer.save(verified=False)
                    del otp_storage[email]
                    
                    return Response({
                        "message": "Registration successful! Awaiting admin verification.",
                        "user_id": user.id,
                        "username": user.username
                    }, status=status.HTTP_201_CREATED)
                    
                except IntegrityError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"error": "Invalid user type."}, status=status.HTTP_400_BAD_REQUEST)

class UserLoginAPIView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data.get('username')
            password = serializer.validated_data.get('password')
            user = authenticate(request, username=username, password=password)
            
            if user is None:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check admin verification for authorities and field workers
            u1 = Government_Authority.objects.filter(username=username).first()
            u2 = Field_Worker.objects.filter(username=username).first()

            if (u1 is not None and not u1.verified) or (u2 is not None and not u2.verified):
                return Response({"error": "Account pending admin verification."}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Login user using session (no token)
            login(request, user)
            
            return Response({
                "message": "Login successful.",
                "user_id": user.id,
                "username": user.username
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

class CheckAuthAPIView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                "authenticated": True,
                "user_id": request.user.id,
                "username": request.user.username
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "authenticated": False
            }, status=status.HTTP_200_OK)