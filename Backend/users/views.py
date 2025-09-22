from django.urls import reverse_lazy
from django.contrib.auth import login
from django.contrib.auth.views import LoginView,LogoutView
from django.views.generic.edit import CreateView
from rest_framework import generics

from .models import Citizen, Government_Authority, Field_Worker,Department
from .forms import CitizenForm, GovernmentAuthorityForm, FieldWorkerForm, LoginForm

from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Citizen
from .serializers import CitizenSerializer, GovernmentAuthoritySerializer,FieldWorkerSerializer,UserLoginSerializer,DepartmentSerializer
from rest_framework import status
from django.contrib.auth import authenticate
from django.db import IntegrityError



class CitizenSignupAPIView(APIView):
    def post(self, request):
        serializer = CitizenSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                login(request, user)
                return Response({"message": "Citizen registered and logged in successfully."}, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GovernmentAuthoritySignupAPIView(APIView):
    def post(self, request):
        serializer = GovernmentAuthoritySerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                if(user.verified==False):
                    return Response({"message": "Government Authority registered successfully. Awaiting verification."}, status=status.HTTP_201_CREATED)
                else:
                    login(request, user)
                    return Response({"message": "Government Authority registered and logged in successfully."}, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FieldWorkerSignupAPIView(APIView):
    def post(self, request):
        serializer = FieldWorkerSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                if(user.verified==False):
                    return Response({"message": "Field Worker registered successfully. Awaiting verification."}, status=status.HTTP_201_CREATED)
                else:
                    login(request, user)
                    return Response({"message": "Field Worker registered and logged in successfully."}, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class UserLoginAPIView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data.get('username')
            password = serializer.validated_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                if(hasattr(user, 'verified') and user.verified==False):
                    return Response({"error": "User not verified yet."}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    login(request, user)
                    return Response({"message": "Login successful."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

# This was previous class based view implementation for signup and login using Django forms and views.
"""
class CitizenSignupView(CreateView):
	model = Citizen
	form_class = CitizenForm
	template_name = 'users/signup_citizen.html'
	success_url = reverse_lazy('home')

	def form_valid(self, form):
		# Save the new user then log them in
		response = super().form_valid(form)
		user = form.instance
		login(self.request, user)
		return response


class GovernmentAuthoritySignupView(CreateView):
	model = Government_Authority
	form_class = GovernmentAuthorityForm
	template_name = 'users/signup_authority.html'
	success_url = reverse_lazy('home')

	def form_valid(self, form):
		response = super().form_valid(form)
		user = form.instance
		login(self.request, user)
		return response


class FieldWorkerSignupView(CreateView):
	model = Field_Worker
	form_class = FieldWorkerForm
	template_name = 'users/signup_fieldworker.html'
	success_url = reverse_lazy('home')

	def form_valid(self, form):
		response = super().form_valid(form)
		user = form.instance
		login(self.request, user)
		return response


class UserLoginView(LoginView):
	authentication_form = LoginForm
	template_name = 'users/login.html'
	redirect_authenticated_user = True
	def get_success_url(self):
		return reverse_lazy('home')

class UserLogoutView(LogoutView):
    next_page = reverse_lazy('home')
"""