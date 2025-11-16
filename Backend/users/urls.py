from django.urls import path

from django.urls import path
from .views import (
    CitizenSignupAPIView,
    GovernmentAuthoritySignupAPIView,
    FieldWorkerSignupAPIView,
    UserLoginAPIView,
    DepartmentListCreateAPIView,
    VerifyOTPAPIView,
    UserLogoutAPIView, 
    TokenRefreshCookieView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    CitizenProfileAPIView,
    PasswordResetRequestAPIView,
    PasswordResetVerifyAPIView,
    ChangePasswordAPIView,
)



app_name = 'users'


urlpatterns = [
    path('departments/', DepartmentListCreateAPIView.as_view(), name='department-list-create'),
    path('signup/citizens/', CitizenSignupAPIView.as_view(), name='signup-citizen'),
    path('signup/authorities/', GovernmentAuthoritySignupAPIView.as_view(), name='signup-authority'),
    path('signup/fieldworker/', FieldWorkerSignupAPIView.as_view(), name='signup-fieldworker'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp'),
    path('login/',UserLoginAPIView.as_view(),name='login'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout'),
    # refresh endpoint (reads refresh from HttpOnly cookie when not provided in body)
    path('token/refresh/', TokenRefreshCookieView.as_view(), name='token-refresh'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),
    path('profile/', CitizenProfileAPIView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='change-password'),
    path('password-reset/request/', PasswordResetRequestAPIView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', PasswordResetVerifyAPIView.as_view(), name='password-reset-verify'),
]
