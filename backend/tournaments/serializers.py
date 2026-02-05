from rest_framework import serializers
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation
from users.serializers import UserSerializer

class TournamentSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'description', 'type', 'visibility', 'join_code', 'max_players', 'status', 'admin', 'created_at', 'participants_count']
        read_only_fields = ['id', 'admin', 'created_at', 'join_code', 'participants_count']

    def get_participants_count(self, obj):
        return obj.participants.count()

class TournamentParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TournamentParticipant
        fields = ['id', 'user', 'role', 'joined_at']

class TournamentJoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)

    class Meta:
        model = TournamentJoinRequest
        fields = ['id', 'user', 'tournament', 'tournament_name', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'tournament_name']

class TournamentInvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)

    class Meta:
        model = TournamentInvitation
        fields = ['id', 'sender', 'receiver', 'tournament', 'tournament_name', 'status', 'created_at']

class CreateTournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['name', 'description', 'type', 'visibility', 'max_players']
