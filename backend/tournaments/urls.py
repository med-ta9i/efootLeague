from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.routers import DefaultRouter
from .views import TournamentViewSet, JoinRequestViewSet, InvitationViewSet

router = DefaultRouter()
router.register(r'requests', JoinRequestViewSet, basename='request')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'', TournamentViewSet, basename='tournament')

urlpatterns = [
    path('', include(router.urls)),
]
