from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
import random
import math
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation
from .serializers import (
    TournamentSerializer, CreateTournamentSerializer, TournamentParticipantSerializer,
    TournamentJoinRequestSerializer, TournamentInvitationSerializer, CreateInvitationSerializer
)
from users.models import User
from notifications.models import Notification
from matches.models import Match

class TournamentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateTournamentSerializer
        return TournamentSerializer

    def get_queryset(self):
        return Tournament.objects.filter(
            Q(visibility=Tournament.VISIBILITY_PUBLIC) | 
            Q(participants__user=self.request.user) |
            Q(admin=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        tournament = serializer.save(admin=self.request.user)
        TournamentParticipant.objects.create(
            user=self.request.user,
            tournament=tournament,
            role=TournamentParticipant.ROLE_ADMIN
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        tournament = self.get_object()
        
        # Check if already participant
        if TournamentParticipant.objects.filter(user=request.user, tournament=tournament).exists():
            return Response({"error": "Already joined"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Private tournament needs matching join code
        if tournament.visibility == Tournament.VISIBILITY_PRIVATE:
            code = request.data.get('join_code')
            if code != tournament.join_code:
                return Response({"error": "Invalid join code"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Join immediately (Public OR Private with correct code)
        TournamentParticipant.objects.create(user=request.user, tournament=tournament, role=TournamentParticipant.ROLE_PLAYER)
        
        # Notify Admin
        Notification.objects.create(
            receiver=tournament.admin,
            type=Notification.TYPE_TOURNAMENT_REQUEST, # Reusing this type for "Join Event"
            content=f"{request.user.username} has joined your tournament: {tournament.name}"
        )
        
        return Response({"message": "Joined tournament successfully"})

    @action(detail=True, methods=['post'])
    def start_tournament(self, request, pk=None):
        tournament = self.get_object()
        if tournament.admin != request.user:
            return Response({"error": "Only admin can start the tournament"}, status=status.HTTP_403_FORBIDDEN)
        
        if tournament.status != Tournament.STATUS_DRAFT:
            return Response({"error": "Tournament already started or finished"}, status=status.HTTP_400_BAD_REQUEST)
        
        participants = list(TournamentParticipant.objects.filter(tournament=tournament))
        if len(participants) < 2:
            return Response({"error": "Need at least 2 players to start"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Change status
        tournament.status = Tournament.STATUS_ONGOING
        tournament.save()
        
        # Generate Fixtures - Round Robin for League
        if tournament.type in [Tournament.TYPE_LEAGUE, Tournament.TYPE_BOTH]:
            players = [p.user for p in participants]
            if len(players) % 2 != 0:
                players.append(None) # Bye player
            
            num_players = len(players)
            num_rounds = num_players - 1
            matches_per_round = num_players // 2
            
            created_count = 0
            for r in range(num_rounds):
                round_label = f"Round {r + 1}"
                for i in range(matches_per_round):
                    p1 = players[i]
                    p2 = players[num_players - 1 - i]
                    
                    if p1 and p2:
                        Match.objects.get_or_create(
                            tournament=tournament,
                            player1=p1,
                            player2=p2,
                            round=round_label,
                            defaults={'created_by': request.user}
                        )
                        created_count += 1
                
                # Rotate players (keep first player fixed)
                players = [players[0]] + [players[-1]] + players[1:-1]
            
            return Response({"message": f"Tournament started! {created_count} matches generated across {num_rounds} rounds."})
            
        elif tournament.type == Tournament.TYPE_BOTH:
            num_players = len(participants)
            if num_players < 4:
                tournament.status = Tournament.STATUS_DRAFT
                tournament.save()
                return Response({"error": "Le mode Mixte (Liga + Cup) nécessite au moins 4 joueurs."}, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Randomly Split into Group A and Group B (as balanced as possible)
            random.shuffle(participants)
            mid = num_players // 2
            group_a_parts = participants[:mid]
            group_b_parts = participants[mid:]
            
            for p in group_a_parts:
                p.group = 'A'
                p.save()
            for p in group_b_parts:
                p.group = 'B'
                p.save()
            
            # 2. Generate fixtures for each group
            created_count = 0
            for group_label, group_participants in [('A', group_a_parts), ('B', group_b_parts)]:
                players = [p.user for p in group_participants]
                if len(players) % 2 != 0:
                    players.append(None) # Bye player
                
                num_p = len(players)
                num_r = num_p - 1
                m_per_r = num_p // 2
                
                for r in range(num_r):
                    round_label = f"Group {group_label} - Round {r + 1}"
                    for i in range(m_per_r):
                        p1 = players[i]
                        p2 = players[num_p - 1 - i]
                        
                        if p1 and p2:
                            Match.objects.get_or_create(
                                tournament=tournament,
                                player1=p1,
                                player2=p2,
                                round=round_label,
                                defaults={'created_by': request.user}
                            )
                            created_count += 1
                    
                    # Rotate players (keep first fixed)
                    players = [players[0]] + [players[-1]] + players[1:-1]
            
            return Response({"message": f"Tournoi lancé ! {num_players} joueurs divisés en 2 groupes ({len(group_a_parts)} vs {len(group_b_parts)}). {created_count} matches générés."})

        elif tournament.type == Tournament.TYPE_CUP:
            num_players = len(participants)
            
            # Check if power of 2
            if not (num_players > 0 and (num_players & (num_players - 1)) == 0):
                # Revert status if validation fails
                tournament.status = Tournament.STATUS_DRAFT
                tournament.save()
                return Response({
                    "error": f"Le nombre de joueurs ({num_players}) doit être une puissance de 2 (2, 4, 8, 16...) pour un mode Coupe."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Determine Round Name
            round_name = Match.ROUND_FINAL
            if num_players == 4: round_name = Match.ROUND_SF
            elif num_players == 8: round_name = Match.ROUND_QF
            elif num_players == 16: round_name = Match.ROUND_R16
            
            # Shuffle and Generate Pairs
            players = [p.user for p in participants]
            random.shuffle(players)
            
            created_count = 0
            for i in range(0, num_players, 2):
                Match.objects.create(
                    tournament=tournament,
                    player1=players[i],
                    player2=players[i+1],
                    round=round_name,
                    created_by=request.user
                )
                created_count += 1
            
            return Response({"message": f"Tournoi lancé ! {created_count} matches de {round_name} générés."})

        return Response({"message": "Tournament started!"})

    @action(detail=True, methods=['post'])
    def generate_next_round(self, request, pk=None):
        tournament = self.get_object()
        if tournament.admin != request.user:
            return Response({"error": "Only admin can generate next round"}, status=status.HTTP_403_FORBIDDEN)
        
        if tournament.type not in [Tournament.TYPE_CUP, Tournament.TYPE_BOTH]:
            return Response({"error": "Only Cup tournaments have rounds progression"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Identify current round
        all_matches = Match.objects.filter(tournament=tournament)
        if not all_matches.exists():
            return Response({"error": "No matches found. Start the tournament first."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine the latest round played
        round_order = [Match.ROUND_R16, Match.ROUND_QF, Match.ROUND_SF, Match.ROUND_FINAL]
        latest_matches = None
        current_round = None
        
        for r in reversed(round_order):
            matches_in_round = all_matches.filter(round=r)
            if matches_in_round.exists():
                latest_matches = matches_in_round
                current_round = r
                break
        
        # SPECIAL CASE: TYPE_BOTH Group Stage to SF
        if tournament.type == Tournament.TYPE_BOTH and not current_round:
             # Check if any Group matches exist
             group_matches = all_matches.filter(round__icontains='Group')
             if group_matches.exists():
                 # Check if all group matches are LOCKED
                 if group_matches.filter(~Q(status=Match.STATUS_LOCKED)).exists():
                     return Response({"error": "Tous les matches de poules doivent être terminés (LOCKED) avant les demi-finales."}, status=status.HTTP_400_BAD_REQUEST)
                 
                 # Calculate winners from Group A and B
                 from matches.models import LeagueStanding
                 standings_a = LeagueStanding.objects.filter(tournament=tournament, player__tournamentparticipant__group='A').order_by('-points', '-goal_difference')[:2]
                 standings_b = LeagueStanding.objects.filter(tournament=tournament, player__tournamentparticipant__group='B').order_by('-points', '-goal_difference')[:2]
                 
                 if len(standings_a) < 2 or len(standings_b) < 2:
                      return Response({"error": "Pas assez de joueurs dans les groupes pour les demis."}, status=status.HTTP_400_BAD_REQUEST)
                 
                 # 1A vs 2B
                 Match.objects.create(
                     tournament=tournament,
                     player1=standings_a[0].player,
                     player2=standings_b[1].player,
                     round=Match.ROUND_SF,
                     created_by=request.user
                 )
                 # 1B vs 2A
                 Match.objects.create(
                     tournament=tournament,
                     player1=standings_b[0].player,
                     player2=standings_a[1].player,
                     round=Match.ROUND_SF,
                     created_by=request.user
                 )
                 return Response({"message": "Demi-finales générées (1A vs 2B, 1B vs 2A) !"})

        if not current_round:
            return Response({"error": "Could not identify current round"}, status=status.HTTP_400_BAD_REQUEST)

        if current_round == Match.ROUND_FINAL:
             # Check if final is finished to mark tournament as finished?
             final_match = latest_matches.first()
             if final_match.status == Match.STATUS_LOCKED:
                 # Determine winner
                 if final_match.score_player1 > final_match.score_player2:
                     tournament.winner = final_match.player1
                 elif final_match.score_player2 > final_match.score_player1:
                     tournament.winner = final_match.player2
                 
                 tournament.status = Tournament.STATUS_FINISHED
                 tournament.save()
                 return Response({"message": f"Tournament finished! Champion: {tournament.winner.username}"})
             return Response({"error": "Final match is not locked yet"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if all matches in latest round are LOCKED and have winners
        if latest_matches.filter(~Q(status=Match.STATUS_LOCKED)).exists():
            return Response({"error": f"All matches in {current_round} must be LOCKED before generating next round."}, status=status.HTTP_400_BAD_REQUEST)
        
        winners = []
        for m in latest_matches:
            if not m.winner:
                # Fallback: determine winner from score
                if m.score_player1 > m.score_player2:
                    winners.append(m.player1)
                elif m.score_player2 > m.score_player1:
                    winners.append(m.player2)
                else:
                    return Response({"error": f"Match {m.id} is a draw. Cup matches must have a winner."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                winners.append(m.winner)

        # 3. Pair winners for next round
        num_winners = len(winners)
        if num_winners < 2:
             return Response({"error": "Not enough winners to generate next round"}, status=status.HTTP_400_BAD_REQUEST)
        
        next_round = None
        if num_winners == 8: next_round = Match.ROUND_QF
        elif num_winners == 4: next_round = Match.ROUND_SF
        elif num_winners == 2: next_round = Match.ROUND_FINAL
        else:
             # Handle odd numbers if any, but power of 2 should prevent this
             return Response({"error": f"Unexpected number of winners: {num_winners}"}, status=status.HTTP_400_BAD_REQUEST)

        # Shuffle winners for next pairings
        random.shuffle(winners)
        created_count = 0
        for i in range(0, num_winners, 2):
            Match.objects.create(
                tournament=tournament,
                player1=winners[i],
                player2=winners[i+1],
                round=next_round,
                created_by=request.user
            )
            created_count += 1
            
        return Response({"message": f"Round {next_round} generated with {created_count} matches."})

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        tournament = self.get_object()
        participants = TournamentParticipant.objects.filter(tournament=tournament)
        serializer = TournamentParticipantSerializer(participants, many=True)
        return Response(serializer.data)

class JoinRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TournamentJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin can see requests for their tournaments
        # Users can see their own requests
        return TournamentJoinRequest.objects.filter(
            Q(tournament__admin=self.request.user) | Q(user=self.request.user)
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        join_request = self.get_object()
        if join_request.tournament.admin != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        join_request.status = TournamentJoinRequest.STATUS_ACCEPTED
        join_request.save()
        
        TournamentParticipant.objects.create(
            user=join_request.user,
            tournament=join_request.tournament,
            role=TournamentParticipant.ROLE_PLAYER
        )

        # Notify User
        Notification.objects.create(
            receiver=join_request.user,
            type=Notification.TYPE_TOURNAMENT_REQUEST,
            content=f"Your request to join {join_request.tournament.name} was approved!"
        )

        return Response({"message": "Request approved"})

        join_request.status = TournamentJoinRequest.STATUS_REJECTED
        join_request.save()

        # Notify User
        Notification.objects.create(
            receiver=join_request.user,
            type=Notification.TYPE_TOURNAMENT_REQUEST,
            content=f"Your request to join {join_request.tournament.name} was rejected."
        )

        return Response({"message": "Request rejected"})

class InvitationViewSet(viewsets.ModelViewSet):
    serializer_class = TournamentInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see invitations sent TO them
        return TournamentInvitation.objects.filter(receiver=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_invitation(self, request):
        serializer = CreateInvitationSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            tournament_id = serializer.validated_data['tournament_id']
            
            tournament = get_object_or_404(Tournament, pk=tournament_id)
            if tournament.admin != request.user:
                 return Response({"error": "Only admin can invite"}, status=status.HTTP_403_FORBIDDEN)

            receiver = User.objects.filter(username=username).first()
            if not receiver:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if TournamentParticipant.objects.filter(tournament=tournament, user=receiver).exists():
                 return Response({"error": "User already in tournament"}, status=status.HTTP_400_BAD_REQUEST)

             # Create invitation
            invitation = TournamentInvitation.objects.create(
                sender=request.user,
                receiver=receiver,
                tournament=tournament
            )

            # Notify Receiver
            Notification.objects.create(
                receiver=receiver,
                type=Notification.TYPE_INVITATION,
                content=f"{request.user.username} invited you to join the tournament: {tournament.name}"
            )

            return Response({"message": "Invitation sent"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        if invitation.receiver != request.user:
            return Response({"error": "Not your invitation"}, status=status.HTTP_403_FORBIDDEN)
        
        invitation.status = TournamentInvitation.STATUS_ACCEPTED
        invitation.save()
        
        TournamentParticipant.objects.create(
            user=request.user,
            tournament=invitation.tournament,
            role=TournamentParticipant.ROLE_PLAYER
        )

        # Notify Admin
        Notification.objects.create(
            receiver=invitation.tournament.admin,
            type=Notification.TYPE_INVITATION,
            content=f"{request.user.username} accepted your invitation to {invitation.tournament.name}"
        )

        return Response({"message": "Invitation accepted"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invitation = self.get_object()
        if invitation.receiver != request.user:
            return Response({"error": "Not your invitation"}, status=status.HTTP_403_FORBIDDEN)
        
        invitation.status = TournamentInvitation.STATUS_REJECTED
        invitation.save()

        # Notify Admin
        Notification.objects.create(
            receiver=invitation.tournament.admin,
            type=Notification.TYPE_INVITATION,
            content=f"{request.user.username} rejected your invitation to {invitation.tournament.name}"
        )

        return Response({"message": "Invitation rejected"})
