from django.db import models
from django.conf import settings
from tournaments.models import Tournament

class Match(models.Model):
    ROUND_R16 = 'R16'
    ROUND_QF = 'QF'
    ROUND_SF = 'SF'
    ROUND_FINAL = 'FINAL'
    ROUND_LEAGUE = 'LEAGUE' # Added for league matches

    ROUND_CHOICES = [
        (ROUND_LEAGUE, 'League'),
        (ROUND_R16, 'Round of 16'),
        (ROUND_QF, 'Quarter Final'),
        (ROUND_SF, 'Semi Final'),
        (ROUND_FINAL, 'Final'),
    ]

    DECIDED_BY_NORMAL = 'NORMAL'
    DECIDED_BY_EXTRA_TIME = 'EXTRA_TIME'
    DECIDED_BY_PENALTIES = 'PENALTIES'

    DECIDED_BY_CHOICES = [
        (DECIDED_BY_NORMAL, 'Normal Time'),
        (DECIDED_BY_EXTRA_TIME, 'Extra Time'),
        (DECIDED_BY_PENALTIES, 'Penalties'),
    ]

    STATUS_SCHEDULED = 'SCHEDULED'
    STATUS_PLAYED = 'PLAYED'
    STATUS_LOCKED = 'LOCKED'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_PLAYED, 'Played'),
        (STATUS_LOCKED, 'Locked'),
    ]

    SOURCE_MANUAL = 'MANUAL'
    SOURCE_AI = 'AI'

    SOURCE_CHOICES = [
        (SOURCE_MANUAL, 'Manual'),
        (SOURCE_AI, 'AI Agent'),
    ]

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round = models.CharField(max_length=10, choices=ROUND_CHOICES, default=ROUND_LEAGUE)
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches_as_player2')
    score_player1 = models.PositiveIntegerField(default=0)
    score_player2 = models.PositiveIntegerField(default=0)
    decided_by = models.CharField(max_length=15, choices=DECIDED_BY_CHOICES, default=DECIDED_BY_NORMAL)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='matches_won')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_matches')
    played_at = models.DateTimeField(null=True, blank=True)
    source_score = models.CharField(max_length=10, choices=SOURCE_CHOICES, default=SOURCE_MANUAL)

    def __str__(self):
        return f"{self.player1} vs {self.player2} ({self.score_player1}-{self.score_player2})"

class LeagueStanding(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='standings')
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    goals_for = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goal_difference = models.IntegerField(default=0)
    points = models.IntegerField(default=0)

    class Meta:
        unique_together = ('tournament', 'player')
        ordering = ['-points', '-goal_difference', '-goals_for']

    def __str__(self):
        return f"{self.player} in {self.tournament} - {self.points} pts"
