from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Friendship
from .serializers import FriendshipSerializer, FriendshipCreateSerializer

User = get_user_model()

class FriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(
            Q(sender=user) | Q(receiver=user)
        )

class FriendshipRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FriendshipCreateSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                receiver = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if receiver == request.user:
                return Response({"error": "Cannot add yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
            if Friendship.objects.filter(sender=request.user, receiver=receiver).exists() or \
               Friendship.objects.filter(sender=receiver, receiver=request.user).exists():
                return Response({"error": "Friendship request already sent or exists"}, status=status.HTTP_400_BAD_REQUEST)

            Friendship.objects.create(sender=request.user, receiver=receiver, status=Friendship.PENDING)
            return Response({"message": "Friend request sent"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FriendshipActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        friendship = get_object_or_404(Friendship, pk=pk, receiver=request.user, status=Friendship.PENDING)
        
        if action == 'accept':
            friendship.status = Friendship.ACCEPTED
            friendship.save()
            return Response({"message": "Friend request accepted"})
        elif action == 'reject':
            friendship.status = Friendship.REJECTED
            friendship.save()
            return Response({"message": "Friend request rejected"})
        
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
