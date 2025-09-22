from django.urls import reverse_lazy
from django.contrib.auth import login
from django.contrib.auth.views import LoginView,LogoutView
from django.views.generic.edit import CreateView

from .models import Citizen, Government_Authority, Field_Worker,ParentUser

from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Citizen
from .serializers import CitizenSerializer, GovernmentAuthoritySerializer,FieldWorkerSerializer,UserLoginSerializer
from rest_framework import status
from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import generics
from .models import Department
from .serializers import DepartmentSerializer



class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


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
            u1 = Government_Authority.objects.filter(username=username).first()
            u2 = Field_Worker.objects.filter(username=username).first()

            if user is None:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            if u1 is not None or u2 is not None:
                if (u1 is not None and u1.verified == False) or (u2 is not None and u2.verified == False):
                    return Response({"error": "You have not been verified yet."}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    login(request, user)
                    return Response({"message": "Login successful."}, status=status.HTTP_200_OK)
            else:
                login(request, user)
                return Response({"message": "Login successful."}, status=status.HTTP_200_OK)
            
            
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