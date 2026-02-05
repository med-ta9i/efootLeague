from rest_framework import serializers
from .models import Match, LeagueStanding
from users.serializers import UserSerializer
from tournaments.serializers import TournamentSerializer

class MatchSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)

    class Meta:
        model = Match
        fields = ['id', 'tournament', 'tournament_name', 'round', 'player1', 'player2', 'score_player1', 'score_player2', 'decided_by', 'winner', 'status', 'played_at', 'source_score']
        read_only_fields = ['id', 'created_by', 'tournament_name']

class MatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['tournament', 'round', 'player1', 'player2', 'played_at']

class MatchUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['score_player1', 'score_player2', 'decided_by', 'status', 'winner']

class LeagueStandingSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)
    
    class Meta:
        model = LeagueStanding
        fields = ['id', 'player', 'played', 'wins', 'draws', 'losses', 'goals_for', 'goals_against', 'goal_difference', 'points']
