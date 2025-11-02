from django.urls import path

from .views import (ComplaintListView,ComplaintCreateView,UpvoteComplaintView,
                    ComplaintDeleteView,ReverseGeocodeView,ComplaintSearchView,PastComplaintsView,GovernmentHomePageView)


urlpatterns = [
    path('', ComplaintListView.as_view(), name='complaint-list'),
    path('create/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('<int:complaint_id>/upvote/', UpvoteComplaintView.as_view(), name='complaint-upvote'),
    path('<int:complaint_id>/delete/', ComplaintDeleteView.as_view(), name='complaint-delete'),
    path('reverse-geocode/',ReverseGeocodeView.as_view(),),
    path('search/',ComplaintSearchView.as_view()),
    path('past/',PastComplaintsView.as_view(),),
    path('govhome/',GovernmentHomePageView.as_view(), ),
]