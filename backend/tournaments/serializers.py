from rest_framework import serializers
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation
from users.serializers import UserSerializer

class TournamentSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    participants_count = serializers.SerializerMethodField()
    join_code = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_participant = serializers.SerializerMethodField()
    pending_request_status = serializers.SerializerMethodField()
    join_requests = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'description', 'type', 'visibility', 'join_code', 
            'max_players', 'status', 'admin', 'winner', 'created_at', 'participants_count',
            'is_admin', 'is_participant', 'pending_request_status', 'join_requests'
        ]
        read_only_fields = ['id', 'admin', 'winner', 'created_at', 'participants_count']

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_join_code(self, obj):
        request = self.context.get('request')
        if request and request.user == obj.admin:
            return obj.join_code
        return None

    def get_is_admin(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.admin

    def get_is_participant(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.participants.filter(user=request.user).exists()

    def get_pending_request_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        join_req = obj.join_requests.filter(user=request.user, status='PENDING').first()
        return join_req.status if join_req else None

    def get_join_requests(self, obj):
        request = self.context.get('request')
        if request and request.user == obj.admin:
            pending_requests = obj.join_requests.filter(status='PENDING')
            return TournamentJoinRequestSerializer(pending_requests, many=True).data
        return []

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

class CreateInvitationSerializer(serializers.Serializer):
    username = serializers.CharField()
    tournament_id = serializers.IntegerField()
