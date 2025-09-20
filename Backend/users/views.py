from django.urls import reverse_lazy
from django.contrib.auth import login
from django.contrib.auth.views import LoginView,LogoutView
from django.views.generic.edit import CreateView

from .models import Citizen, Government_Authority, Field_Worker
from .forms import CitizenForm, GovernmentAuthorityForm, FieldWorkerForm, LoginForm


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
	