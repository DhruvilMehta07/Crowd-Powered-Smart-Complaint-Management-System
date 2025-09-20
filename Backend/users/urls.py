from django.urls import path
from .views import (
    CitizenSignupView,
    GovernmentAuthoritySignupView,
    FieldWorkerSignupView,
    UserLoginView,UserLogoutView
)

app_name = 'users'

urlpatterns = [
    path('login/', UserLoginView.as_view(), name='login'),
    path('signup/citizen/', CitizenSignupView.as_view(), name='signup_citizen'),
    path('signup/authority/', GovernmentAuthoritySignupView.as_view(), name='signup_authority'),
    path('signup/fieldworker/', FieldWorkerSignupView.as_view(), name='signup_fieldworker'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
]
