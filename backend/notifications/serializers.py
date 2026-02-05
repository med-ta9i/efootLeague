from rest_framework import serializers
from .models import Notification
from users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'receiver', 'type', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'receiver', 'type', 'content', 'created_at']
