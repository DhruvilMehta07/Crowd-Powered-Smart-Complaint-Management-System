from django.contrib.auth.forms import UserCreationForm
from django.forms import ModelForm

from .models import ParentUser, Citizen, Government_Authority, Field_Worker


class CitizenForm(UserCreationForm):
    class Meta:
        model = Citizen
        fields = ['username', 'email', 'password1', 'password2', 'phone_number']  


class GovernmentAuthorityForm(UserCreationForm):
    class Meta:
        model = Government_Authority
        fields = ['username', 'email', 'password1', 'password2', 'assigned_department', 'phone_number']  

class FieldWorkerForm(UserCreationForm):
    class Meta:
        model = Field_Worker
        fields = ['username', 'email', 'password1', 'password2', 'assigned_department','assigned_area', 'phone_number']  