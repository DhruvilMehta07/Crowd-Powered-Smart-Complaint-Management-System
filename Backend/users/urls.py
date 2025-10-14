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
    GetCSRFToken
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
    path('csrf-token/', GetCSRFToken.as_view(), name='get-csrf-token'),
    # refresh endpoint (reads refresh from HttpOnly cookie when not provided in body)
    path('token/refresh/', TokenRefreshCookieView.as_view(), name='token-refresh'),
]
