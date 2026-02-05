from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'num_whatsapp', 'is_verified', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'is_verified']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'avatar', 'num_whatsapp']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            avatar=validated_data.get('avatar'),
            num_whatsapp=validated_data.get('num_whatsapp')
        )
        return user
