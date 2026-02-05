from rest_framework import serializers
from .models import Friendship
from users.serializers import UserSerializer

class FriendshipSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']
        read_only_fields = ['id', 'sender', 'receiver', 'status', 'created_at']

class FriendshipCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
