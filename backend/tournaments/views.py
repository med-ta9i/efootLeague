from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation
from .serializers import (
    TournamentSerializer, CreateTournamentSerializer, TournamentParticipantSerializer,
    TournamentJoinRequestSerializer, TournamentInvitationSerializer, CreateInvitationSerializer
)
from users.models import User
from notifications.models import Notification

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
        
        # Notify Admin
        Notification.objects.create(
            receiver=tournament.admin,
            type=Notification.TYPE_TOURNAMENT_REQUEST,
            content=f"{request.user.username} requested to join your tournament: {tournament.name}"
        )
        
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
