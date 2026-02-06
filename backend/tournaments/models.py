from django.db import models
from django.conf import settings
import uuid

class Tournament(models.Model):
    TYPE_LEAGUE = 'LEAGUE'
    TYPE_CUP = 'CUP'
    TYPE_BOTH = 'BOTH'
    
    TYPE_CHOICES = [
        (TYPE_LEAGUE, 'League'),
        (TYPE_CUP, 'Cup'),
        (TYPE_BOTH, 'Both (League + Cup)'),
    ]

    VISIBILITY_PUBLIC = 'PUBLIC'
    VISIBILITY_PRIVATE = 'PRIVATE'

    VISIBILITY_CHOICES = [
        (VISIBILITY_PUBLIC, 'Public'),
        (VISIBILITY_PRIVATE, 'Private'),
    ]

    STATUS_DRAFT = 'DRAFT'
    STATUS_ONGOING = 'ONGOING'
    STATUS_FINISHED = 'FINISHED'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_ONGOING, 'Ongoing'),
        (STATUS_FINISHED, 'Finished'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_LEAGUE)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default=VISIBILITY_PUBLIC)
    join_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    max_players = models.IntegerField(default=16)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='administered_tournaments')
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournaments_won')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.visibility == self.VISIBILITY_PRIVATE and not self.join_code:
            self.join_code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class TournamentParticipant(models.Model):
    ROLE_ADMIN = 'ADMIN'
    ROLE_PLAYER = 'PLAYER'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_PLAYER, 'Player'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_PLAYER)
    group = models.CharField(max_length=1, blank=True, null=True) # 'A' or 'B'
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tournament')

    def __str__(self):
        return f"{self.user} in {self.tournament}"

class TournamentJoinRequest(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='join_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tournament')

    def __str__(self):
        return f"{self.user} -> {self.tournament} ({self.status})"

class TournamentInvitation(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_DECLINED = 'DECLINED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
    ]

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_tournament_invitations')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_tournament_invitations')
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} invited {self.receiver} to {self.tournament}"
