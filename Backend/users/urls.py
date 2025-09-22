from django.urls import path

from .views import (
    CitizenSignupAPIView,
    GovernmentAuthoritySignupAPIView,
    FieldWorkerSignupAPIView,
    UserLoginAPIView,
    DepartmentListCreateAPIView
)


app_name = 'users'


urlpatterns = [
    path('departments/', DepartmentListCreateAPIView.as_view(), name='department-list-create'),
    path('signup/citizens/', CitizenSignupAPIView.as_view(), name='signup-citizen'),
    path('signup/authorities/', GovernmentAuthoritySignupAPIView.as_view(), name='signup-authority'),
    path('signup/fieldworker/', FieldWorkerSignupAPIView.as_view(), name='signup-fieldworker'),
    path('login/',UserLoginAPIView.as_view(),name='login'),
]
