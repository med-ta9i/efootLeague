from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TournamentViewSet, JoinRequestViewSet

router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')
router.register(r'requests', JoinRequestViewSet, basename='request')

urlpatterns = [
    path('', include(router.urls)),
]
