# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework import permissions
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.views import TokenRefreshView

from django.contrib.auth import logout
from django.contrib.auth import authenticate, login
from django.db import IntegrityError
from django.conf import settings
from django.core.cache import caches

import re,requests,json

from .models import Citizen, Government_Authority, Field_Worker, Department
from .serializers import CitizenSerializer, GovernmentAuthoritySerializer, FieldWorkerSerializer, UserLoginSerializer, DepartmentSerializer
from .EmailService import EmailService

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie


# Store OTPs temporarily in memory
otp_storage = {}
# Setting up redis cache
redis_cache = caches['default']

email_exists_error="User with this email already exists."
otp_sent_message="OTP sent to email. Verify to complete registration."
otp_failed_error="Failed to send OTP email."

class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class CitizenSignupAPIView(APIView):
    def post(self, request):
        serializer = CitizenSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            
            if Citizen.objects.filter(email=email).exists():
                return Response({"error": email_exists_error}, status=status.HTTP_400_BAD_REQUEST)
            
            otp = EmailService.generate_otp()
            otp_storage[email] = {
                'otp': otp,
                'data': request.data,
                'user_type': 'citizen'
            }
            user_type ='citizen'
            if EmailService.send_otp_email(email, otp, "Citizen"):
                return Response({
                    "message": otp_sent_message,
                    "email": email
                    
                }, status=status.HTTP_200_OK)
            else:
                del otp_storage[email]
                return Response({"error": otp_failed_error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GovernmentAuthoritySignupAPIView(APIView):
    def post(self, request):
        serializer = GovernmentAuthoritySerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            
            if Government_Authority.objects.filter(email=email).exists():
                return Response({"error": email_exists_error}, status=status.HTTP_400_BAD_REQUEST)
            
            otp = EmailService.generate_otp()
            otp_storage[email] = {
                'otp': otp,
                'data': request.data,
                'user_type': 'authority'
            }
            user_type ='authority'
            if EmailService.send_otp_email(email, otp, "Government Authority"):
                return Response({
                    "message": otp_sent_message,
                    "email": email
                }, status=status.HTTP_200_OK)
            else:
                del otp_storage[email]
                return Response({"error": otp_failed_error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FieldWorkerSignupAPIView(APIView):
    def post(self, request):
        serializer = FieldWorkerSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            user_type ='fieldworker'
            if Field_Worker.objects.filter(email=email).exists():
                return Response({"error": email_exists_error}, status=status.HTTP_400_BAD_REQUEST)
            
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


def HandleCitizenRegistration(email, user_data):
    serializer = CitizenSerializer(data=user_data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            # remove OTP storage entry (caller should still ensure removal if needed)
            del otp_storage[email]
            # Issue JWTs (access + refresh) and set refresh as HttpOnly cookie
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            response = Response({
                "message": "Registration successful!",
                "access": access_token,
                "user_id": user.id,
                "username": user.username,
                'user_type':'citizen'
            }, status=status.HTTP_201_CREATED)

            # set refresh token as HttpOnly cookie; secure flag depends on DEBUG
            response.set_cookie(
                'refresh',
                refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds())
            )
            return response

        except IntegrityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def HandleAuthorityRegistration(email, user_data):
    serializer = GovernmentAuthoritySerializer(data=user_data)
    if serializer.is_valid():
        try:
            user = serializer.save(verified=False)
            del otp_storage[email]

            return Response({
                "message": "Registration successful! Awaiting admin verification.",
                "user_id": user.id,
                "username": user.username,
                'user_type':'authority'
            }, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def HandleFieldWorkerRegistration(email, user_data):
    serializer = FieldWorkerSerializer(data=user_data)
    if serializer.is_valid():
        try:
            user = serializer.save(verified=False)
            del otp_storage[email]

            return Response({
                "message": "Registration successful! Awaiting admin verification.",
                "user_id": user.id,
                "username": user.username,
                'user_type':'fieldworker'
            }, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
            return HandleCitizenRegistration(email,user_data)
        
        elif user_type == 'authority':
            return HandleAuthorityRegistration(email,user_data)
        
        elif user_type == 'fieldworker':
            return HandleFieldWorkerRegistration(email,user_data)
        
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
            
            # Issue JWT tokens (access + refresh)
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            if u1 is not None:
                user_type_local = 'authority'
            elif u2 is not None:
                user_type_local = 'fieldworker'
            else:
                user_type_local = 'citizen'
            response = Response({
                "message": "Login successful.",
                "access": access_token,
                "user_id": user.id,
                "username": user.username,
                'user_type': user_type_local
                
            }, status=status.HTTP_200_OK)

            response.set_cookie(
                'refresh',
                refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds())
            )
            return response
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutAPIView(APIView):
    """
    Expect POST with {"refresh": "<refresh_token>"}.
    Blacklists the refresh in DB (simplejwt.token_blacklist) and caches the token jti in Redis with TTL.
    """
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh') or request.data.get('refresh') 
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            # blacklist in DB
            token.blacklist()
            # cache jti in redis with TTL
            # use payload for safety
            jti = getattr(token, 'payload', {}).get('jti') or token.get('jti') if hasattr(token, 'get') else None
            exp = getattr(token, 'payload', {}).get('exp') or token.get('exp') if hasattr(token, 'get') else None
            import time
            ttl = max(0, int(exp - time.time())) if exp else None
            if jti and ttl:
                try:
                    redis_cache.set(f"blacklist:{jti}", 1, ttl)
                except Exception:
                    # Redis may be down we still blacklist in DB
                    pass
            # delete refresh cookie on logout
            response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh')
            
            return response
        except TokenError:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": "Logout failed.", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TokenRefreshCookieView(TokenRefreshView):
    """Wrap TokenRefreshView to accept refresh from cookie when not provided in body
    and set the returned refresh token as an HttpOnly cookie when rotation occurs.
    """
    def post(self, request, *args, **kwargs):
        if 'refresh' not in request.data and request.COOKIES.get('refresh'):
            data = request.data.copy()
            data['refresh'] = request.COOKIES.get('refresh')
            request._full_data = data

        # checking for blacklisted token in redis/db
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                backend = TokenBackend(
                    algorithm=settings.SIMPLE_JWT['ALGORITHM'],
                    signing_key=settings.SIMPLE_JWT.get('SIGNING_KEY')
                )
                payload = backend.decode(refresh_token, verify=False)
                jti = payload.get('jti')  # decode without verification
                
                from users.authentication import redis_cache  
                if jti and redis_cache.get(f"blacklist:{jti}"):
                    return Response({"detail": "Token has been blacklisted in Redis."}, status=status.HTTP_401_UNAUTHORIZED)
            except TokenError:
                return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"detail": f"Token check failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
       

        response = super().post(request, *args, **kwargs)

        # if a new refresh token is returned (rotation), set it as cookie
        refresh = getattr(response, 'data', {}).get('refresh')
        if refresh:
            response.set_cookie(
                'refresh',
                refresh,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds())
            )
            # remove refresh from response body to keep it HttpOnly
            try:
                del response.data['refresh']
            except Exception:
                pass

        return response

