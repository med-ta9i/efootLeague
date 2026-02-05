from django.urls import path
from .views import FriendshipListView, FriendshipRequestView, FriendshipActionView

urlpatterns = [
    path('', FriendshipListView.as_view(), name='friendship-list'),
    path('request/', FriendshipRequestView.as_view(), name='friendship-request'),
    path('<int:pk>/<str:action>/', FriendshipActionView.as_view(), name='friendship-action'),
]
