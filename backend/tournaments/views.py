from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation
from .serializers import (
    TournamentSerializer, CreateTournamentSerializer, TournamentParticipantSerializer,
    TournamentJoinRequestSerializer, TournamentInvitationSerializer
)
from users.models import User

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
            
            # Join immediately if code matches
            TournamentParticipant.objects.create(user=request.user, tournament=tournament, role=TournamentParticipant.ROLE_PLAYER)
            return Response({"message": "Joined tournament successfully"})
        
        # Public tournament creates a request
        TournamentJoinRequest.objects.create(user=request.user, tournament=tournament)
        return Response({"message": "Join request sent"})

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
        return Response({"message": "Request approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        join_request = self.get_object()
        if join_request.tournament.admin != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        join_request.status = TournamentJoinRequest.STATUS_REJECTED
        join_request.save()
        return Response({"message": "Request rejected"})
