from django.contrib.auth.forms import UserCreationForm
from django.forms import ModelForm
from django import forms

from .models import ParentUser, Citizen, Government_Authority, Field_Worker
from .models import Department
from django.contrib.auth import authenticate


class LoginForm(forms.Form):
    username_or_email = forms.CharField(label='Username or Email')
    password = forms.CharField(widget=forms.PasswordInput)

    def __init__(self, *args, **kwargs):
        # LoginView passes `request` into the form kwargs; remove it to
        # avoid BaseForm.__init__ complaining and keep it for authentication.
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        user_input = cleaned.get('username_or_email')
        password = cleaned.get('password')
        if user_input and password:
            user = authenticate(self.request, username=user_input, password=password)
            if user is None:
                try:
                    user_obj = ParentUser.objects.get(email__iexact=user_input)
                    user = authenticate(self.request, username=user_obj.username, password=password)
                except ParentUser.DoesNotExist:
                    user = None
            if user is None:
                raise forms.ValidationError('Invalid credentials')
            cleaned['user'] = user
        return cleaned

    def get_user(self):
        return self.cleaned_data.get('user')


class CitizenForm(UserCreationForm):
    class Meta:
        model = Citizen
        fields = ['username', 'email', 'password1', 'password2', 'phone_number']  


class GovernmentAuthorityForm(UserCreationForm):
    
    assigned_department = forms.ModelChoiceField(
        queryset=Department.objects.all(),
        required=False,
        empty_label="Other",
    )
    other_department = forms.CharField(max_length=200, required=False)

    class Meta:
        model = Government_Authority
        fields = ['username', 'email', 'password1', 'password2', 'assigned_department', 'other_department', 'phone_number']  

    def clean(self):
        cleaned = super().clean()
        assigned = cleaned.get('assigned_department')
        other = cleaned.get('other_department')
        if not assigned and not other:
            raise forms.ValidationError('Please select an existing department or enter a new one.')
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        dept = self.cleaned_data.get('assigned_department')
        other = self.cleaned_data.get('other_department')
        if not dept and other:
            dept_obj, created = Department.objects.get_or_create(name=other.strip().lower())
            instance.assigned_department = dept_obj
        else:
            instance.assigned_department = dept
        if commit:
            instance.save()
        return instance

class FieldWorkerForm(UserCreationForm):
    assigned_department = forms.ModelChoiceField(
        queryset=Department.objects.all(),
        required=False,
        empty_label="Other",
    )
    other_department = forms.CharField(max_length=200, required=False)

    class Meta:
        model = Field_Worker
        fields = ['username', 'email', 'password1', 'password2', 'assigned_department','other_department','assigned_area', 'phone_number']

    def clean(self):
        cleaned = super().clean()
        assigned = cleaned.get('assigned_department')
        other = cleaned.get('other_department')
        if not assigned and not other:
            raise forms.ValidationError('Please select an existing department or enter a new one.')
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        dept = self.cleaned_data.get('assigned_department')
        other = self.cleaned_data.get('other_department')
        if not dept and other:
            dept_obj, created = Department.objects.get_or_create(name=other.strip().lower())
            instance.assigned_department = dept_obj
        else:
            instance.assigned_department = dept
        if commit:
            instance.save()
        return instance