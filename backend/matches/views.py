from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Match, LeagueStanding
from .serializers import MatchSerializer, MatchCreateSerializer, MatchUpdateSerializer, LeagueStandingSerializer
from tournaments.models import Tournament

class MatchViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return MatchCreateSerializer
        if self.action in ['update', 'partial_update']:
            return MatchUpdateSerializer
        return MatchSerializer

    def get_queryset(self):
        # Filter by tournament if provided in query params
        queryset = Match.objects.all()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            queryset = queryset.filter(tournament_id=tournament_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        match = self.get_object()
        if match.tournament.admin != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only tournament admin can update scores.")

        # Validation for negative scores
        score1 = self.request.data.get('score_player1')
        score2 = self.request.data.get('score_player2')
        if (score1 is not None and int(score1) < 0) or (score2 is not None and int(score2) < 0):
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Scores cannot be negative.")

        match = serializer.save()
        if match.status in [Match.STATUS_LOCKED, Match.STATUS_PLAYED]:
            self._update_standings(match)
            self._check_tournament_finished(match.tournament)

    def _check_tournament_finished(self, tournament):
        # Already finished? skip
        if tournament.status == Tournament.STATUS_FINISHED:
            return

        # Check if all matches are LOCKED
        all_matches = Match.objects.filter(tournament=tournament)
        if not all_matches.filter(~Q(status=Match.STATUS_LOCKED)).exists():
            # If League, calculate winner from standings
            if tournament.type in [Tournament.TYPE_LEAGUE, Tournament.TYPE_BOTH]:
                from .models import LeagueStanding
                # Get the player with highest points
                top_standing = LeagueStanding.objects.filter(tournament=tournament).order_by('-points', '-goal_difference').first()
                if top_standing:
                    tournament.winner = top_standing.player
                    tournament.status = Tournament.STATUS_FINISHED
                    tournament.save()
            # If Cup, it's handled in generate_next_round after the final

    def _update_standings(self, match):
        if match.tournament.type not in [Tournament.TYPE_LEAGUE, Tournament.TYPE_BOTH]:
            return
        
        # Simple logic: Recalculate standings for the two players
        # or Recalculate for the whole tournament (safer but slower)
        # For MVP, let's just trigger a full recalculation for these 2 players
        # But for correctness, we should iterate all finished matches for these players in this tournament
        
        for player in [match.player1, match.player2]:
            self._recalculate_player_standing(match.tournament, player)

    def _recalculate_player_standing(self, tournament, player):
        standing, _ = LeagueStanding.objects.get_or_create(tournament=tournament, player=player)
        
        matches = Match.objects.filter(
            tournament=tournament, 
            status__in=[Match.STATUS_PLAYED, Match.STATUS_LOCKED]
        ).filter(Q(player1=player) | Q(player2=player))
        
        played = 0
        wins = 0
        draws = 0
        losses = 0
        goals_for = 0
        goals_against = 0
        
        for m in matches:
            played += 1
            if m.player1 == player:
                goals_for += m.score_player1
                goals_against += m.score_player2
                if m.score_player1 > m.score_player2:
                    wins += 1
                elif m.score_player1 == m.score_player2:
                    draws += 1
                else:
                    losses += 1
            else:
                goals_for += m.score_player2
                goals_against += m.score_player1
                if m.score_player2 > m.score_player1:
                    wins += 1
                elif m.score_player2 == m.score_player1:
                    draws += 1
                else:
                    losses += 1

        standing.played = played
        standing.wins = wins
        standing.draws = draws
        standing.losses = losses
        standing.goals_for = goals_for
        standing.goals_against = goals_against
        standing.goal_difference = goals_for - goals_against
        standing.points = (wins * 3) + (draws * 1)
        standing.save()

class StandingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LeagueStandingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            return LeagueStanding.objects.filter(tournament_id=tournament_id)
        return LeagueStanding.objects.none()
